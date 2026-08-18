import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFirebaseAdminAuth } from "@/lib/auth/firebaseAdmin";
import { createSession, formatSessionCookie, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { UserRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { idToken } = body || {};

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid Firebase ID token" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. Verify Firebase ID token server-side via official Firebase Admin SDK
    let decodedToken: any;
    try {
      const adminAuth = getFirebaseAdminAuth();
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (err: any) {
      const errMsg = err?.message || "Verification failed";
      console.warn("[Firebase Auth] Server verification note:", errMsg);
      return NextResponse.json(
        {
          success: false,
          error: errMsg.includes("credentials are not configured")
            ? "Authentication service configuration pending on server."
            : "Invalid or expired Firebase authentication token",
        },
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const verifiedEmail = decodedToken?.email;
    if (!verifiedEmail) {
      return NextResponse.json(
        { success: false, error: "Firebase token does not contain a verified email address" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = verifiedEmail.toLowerCase().trim();

    // 2. Find existing NextHire user or create default Job Seeker
    let dbUser: any = null;
    try {
      dbUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: { company: true, profile: true },
      });

      if (!dbUser) {
        // Create new candidate user (Never auto-assign PLATFORM_ADMIN or RECRUITER)
        const candidateName =
          decodedToken.name || normalizedEmail.split("@")[0] || "NextHire Member";
        dbUser = await prisma.user.create({
          data: {
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
    } catch (dbErr) {
      console.warn("[Firebase Auth] Database lookup / creation note:", dbErr);
    }

    const userId = dbUser?.id || `usr-${Date.now()}`;
    const userRole: UserRole = (dbUser?.role as UserRole) || "JOB_SEEKER";
    const userName = dbUser?.name || decodedToken.name || normalizedEmail.split("@")[0] || "NextHire Member";

    // 3. Issue authoritative NextHire server Session token & HttpOnly cookie
    const session = await createSession(userId);
    const authUser = {
      id: userId,
      name: userName,
      email: normalizedEmail,
      role: userRole,
      avatar:
        dbUser?.avatar ||
        decodedToken.picture ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
      status: "VERIFIED" as const,
      companyId: dbUser?.companyId || dbUser?.company?.id || undefined,
      companyName: dbUser?.company?.name,
      headline: dbUser?.headline || undefined,
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

    return response;
  } catch (err: any) {
    console.error("Internal error in /api/auth/firebase:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server authentication error" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
