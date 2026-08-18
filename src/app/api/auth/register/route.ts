import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
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

    const {
      firebaseUid,
      name,
      email,
      password,
      role = "JOB_SEEKER",
      companyName,
      headline,
      location,
    } = body || {};

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required", category: "INVALID_REQUEST" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const passwordHash = hashPassword(password);

    let newUser: any = null;
    try {
      // Check existing by email or firebaseUid
      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { email: normalizedEmail },
            ...(firebaseUid ? [{ firebaseUid }] : []),
          ],
        },
      });

      if (existing) {
        return NextResponse.json(
          { success: false, error: "An account with this email or identity already exists", category: "USER_ALREADY_EXISTS" },
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      let companyId: string | undefined = undefined;
      if (companyName && role === "RECRUITER") {
        const comp = await prisma.company.create({
          data: {
            name: companyName,
            industry: "Technology",
            location: location || "Global",
            description: `${companyName} organization on NextHire.`,
          },
        });
        companyId = comp.id;
      }

      newUser = await prisma.user.create({
        data: {
          firebaseUid: firebaseUid || undefined,
          name,
          email: normalizedEmail,
          passwordHash,
          role: role as UserRole,
          headline: headline || `${role.replace("_", " ")} Account`,
          location: location || undefined,
          companyId,
        },
        include: { company: true },
      });
    } catch (err: any) {
      console.error("[Register] Neon PostgreSQL error:", err);
      return NextResponse.json(
        {
          success: false,
          error: "Authentication database is temporarily unavailable.",
          category: "DATABASE_UNAVAILABLE",
        },
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!newUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create user account.",
          category: "USER_CREATION_FAILED",
        },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = newUser.id;
    const userRole: UserRole = newUser.role as UserRole;

    let session: { token: string; expiresAt: Date };
    try {
      session = await createSession(userId);
    } catch (sessErr: any) {
      console.error("[Register] Session creation error:", sessErr);
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
      firebaseUid: newUser.firebaseUid || undefined,
      name: newUser.name,
      email: normalizedEmail,
      role: userRole,
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
      status: "VERIFIED" as const,
      companyName: companyName || undefined,
      companyId: newUser.companyId || undefined,
      headline: headline || `${userRole.replace("_", " ")} Account`,
    };

    const cookieValue = formatSessionCookie({
      token: session.token,
      userId: authUser.id,
      email: authUser.email,
      role: authUser.role,
    });

    const response = NextResponse.json(
      { success: true, user: authUser },
      { status: 201, headers: { "Content-Type": "application/json" } }
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
    console.error("[Register] Internal error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to register user", category: "INTERNAL_SERVER_ERROR" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
