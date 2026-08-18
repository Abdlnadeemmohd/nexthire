import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyServerFirebaseIdToken,
  getFirebaseAdminStatus,
} from "@/lib/auth/firebaseAdmin";
import { createSession, formatSessionCookie, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { UserRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV !== "production") {
      console.log("[AUTH] Request received for /api/auth/firebase");
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body", category: "INVALID_REQUEST" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { idToken } = body || {};

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid Firebase ID token", category: "MISSING_TOKEN" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (process.env.NODE_ENV !== "production") {
      const adminStatus = getFirebaseAdminStatus();
      console.log(
        `[AUTH] idToken received: true (length: ${idToken.length}) | Admin Configured: ${adminStatus.isConfigured} (Source: ${adminStatus.credentialSource || "none"})`
      );
    }

    // 1. Authoritative Server-Side Token Verification via official Firebase Admin SDK
    let decodedToken: any;
    try {
      decodedToken = await verifyServerFirebaseIdToken(idToken);
      if (process.env.NODE_ENV !== "production") {
        console.log("[AUTH] Token verification: success | Firebase UID obtained: true");
      }
    } catch (err: any) {
      const category = err?.category || "TOKEN_INVALID";
      const errMsg = err?.message || "Firebase token verification failed.";

      console.warn(`[AUTH] Token verification failed [Category: ${category}]`);

      if (category === "FIREBASE_ADMIN_NOT_CONFIGURED") {
        return NextResponse.json(
          {
            success: false,
            error: "Authentication service configuration is pending on the server. Please configure server credentials.",
            category: "FIREBASE_ADMIN_NOT_CONFIGURED",
          },
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      }

      if (category === "FIREBASE_PROJECT_MISMATCH") {
        return NextResponse.json(
          {
            success: false,
            error: "Firebase client and server project ID mismatch detected.",
            category: "FIREBASE_PROJECT_MISMATCH",
          },
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      if (category === "TOKEN_EXPIRED") {
        return NextResponse.json(
          {
            success: false,
            error: "Firebase authentication session expired. Please sign in again.",
            category: "TOKEN_EXPIRED",
          },
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Invalid or unverified Firebase authentication token.",
          category: "TOKEN_INVALID",
        },
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const firebaseUid = decodedToken?.uid;
    const verifiedEmail = decodedToken?.email;

    if (!firebaseUid) {
      return NextResponse.json(
        {
          success: false,
          error: "Firebase token does not contain a valid user identity (UID).",
          category: "TOKEN_INVALID",
        },
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!verifiedEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Firebase token does not contain an email address.",
          category: "MISSING_VERIFIED_EMAIL",
        },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = verifiedEmail.toLowerCase().trim();

    // 2. Authoritative Neon PostgreSQL User Lookup / Creation via Prisma
    let dbUser: any = null;
    try {
      // Preferred lookup: by verified firebaseUid
      dbUser = await prisma.user.findUnique({
        where: { firebaseUid },
        include: { company: true, profile: true },
      });

      // Secondary fallback: lookup by normalized email for existing account linkage
      if (!dbUser) {
        dbUser = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: { company: true, profile: true },
        });

        if (dbUser && !dbUser.firebaseUid) {
          // Link existing account to this Firebase UID
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: { firebaseUid },
            include: { company: true, profile: true },
          });
        }
      }

      // If no user exists, create a new JOB_SEEKER account (Roles are strictly server-controlled)
      if (!dbUser) {
        const candidateName =
          decodedToken.name || normalizedEmail.split("@")[0] || "NextHire Member";

        dbUser = await prisma.user.create({
          data: {
            firebaseUid,
            name: candidateName,
            email: normalizedEmail,
            role: "JOB_SEEKER",
            avatar:
              decodedToken.picture ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
            headline: "Job Seeker Account (Verified via Firebase)",
          },
          include: { company: true, profile: true },
        });
      }

      if (process.env.NODE_ENV !== "production") {
        console.log("[AUTH] Neon User lookup/create: success");
      }
    } catch (dbErr: any) {
      console.error("[AUTH] Neon PostgreSQL database error:", dbErr?.message || dbErr);
      return NextResponse.json(
        {
          success: false,
          error: "Authentication database is temporarily unavailable.",
          category: "DATABASE_UNAVAILABLE",
        },
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!dbUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create or synchronize user profile.",
          category: "USER_CREATION_FAILED",
        },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = dbUser.id;
    const userRole: UserRole = (dbUser.role as UserRole) || "JOB_SEEKER";
    const userName = dbUser.name || decodedToken.name || normalizedEmail.split("@")[0] || "NextHire Member";

    // 3. Issue authoritative NextHire server Session token & HttpOnly cookie
    let session: { token: string; expiresAt: Date };
    try {
      session = await createSession(userId);
      if (process.env.NODE_ENV !== "production") {
        console.log("[AUTH] Neon Session creation: success");
      }
    } catch (sessErr: any) {
      console.error("[AUTH] Session creation error in Neon database:", sessErr?.message || sessErr);
      return NextResponse.json(
        {
          success: false,
          error: "Unable to create authentication session.",
          category: "SESSION_CREATION_FAILED",
        },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const authUser = {
      id: userId,
      firebaseUid,
      name: userName,
      email: normalizedEmail,
      role: userRole,
      avatar:
        dbUser.avatar ||
        decodedToken.picture ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
      status: "VERIFIED" as const,
      companyId: dbUser.companyId || dbUser.company?.id || undefined,
      companyName: dbUser.company?.name,
      headline: dbUser.headline || undefined,
    };

    const cookieValue = formatSessionCookie({
      token: session.token,
      userId: authUser.id,
      email: authUser.email,
      role: authUser.role,
    });

    const response = NextResponse.json(
      { success: true, user: authUser },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

    response.cookies.set(SESSION_COOKIE_NAME, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("[AUTH] Handshake response: 200 OK");
    }

    return response;
  } catch (err: any) {
    console.error("[AUTH] Internal server error in /api/auth/firebase:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Unable to complete authentication due to an internal server error. Please try again.",
        category: "INTERNAL_SERVER_ERROR",
      },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
