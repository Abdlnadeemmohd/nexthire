import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { firebaseAdminAuth } from "@/lib/auth/firebaseAdmin";
import { createSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { UserRole } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid Firebase ID token" },
        { status: 400 }
      );
    }

    // 1. Verify Firebase ID token server-side via Firebase Admin SDK
    let decodedToken;
    try {
      decodedToken = await firebaseAdminAuth.verifyIdToken(idToken);
    } catch (err: any) {
      console.warn("Firebase ID token verification failed server-side:", err?.message || err);
      return NextResponse.json(
        { success: false, error: "Invalid or expired Firebase authentication token" },
        { status: 401 }
      );
    }

    const verifiedEmail = decodedToken.email;
    if (!verifiedEmail) {
      return NextResponse.json(
        { success: false, error: "Firebase token does not contain a verified email address" },
        { status: 400 }
      );
    }

    const normalizedEmail = verifiedEmail.toLowerCase().trim();

    // 2. Find existing NextHire user or create default Job Seeker
    let dbUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { company: true, profile: true },
    });

    if (!dbUser) {
      // Create new candidate user (Never auto-assign PLATFORM_ADMIN or RECRUITER)
      const candidateName = decodedToken.name || normalizedEmail.split("@")[0] || "NextHire Member";
      dbUser = await prisma.user.create({
        data: {
          name: candidateName,
          email: normalizedEmail,
          role: "JOB_SEEKER",
          avatar: decodedToken.picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
          headline: "Job Seeker Account (Verified via Firebase)",
        },
        include: { company: true, profile: true },
      });
    }

    // 3. Issue authoritative NextHire server Session token & HttpOnly cookie
    const session = await createSession(dbUser.id);
    const authUser = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role as UserRole,
      avatar: dbUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
      status: "VERIFIED" as const,
      companyId: dbUser.companyId || dbUser.company?.id || undefined,
      companyName: dbUser.company?.name,
      headline: dbUser.headline || undefined,
    };

    const response = NextResponse.json({ success: true, user: authUser });
    response.cookies.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Internal server authentication error" },
      { status: 500 }
    );
  }
}
