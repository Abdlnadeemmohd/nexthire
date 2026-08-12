import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { PRECONFIGURED_USERS, UserRole } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, role: requestedRole } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Database User Authentication (Always Active)
    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: { company: true, profile: true },
      });
    } catch {
      // Database unpopulated fallback
    }

    if (user && user.passwordHash) {
      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Invalid email or password" },
          { status: 401 }
        );
      }

      const session = await createSession(user.id);
      const authUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
        avatar: user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
        status: "VERIFIED" as const,
        companyName: user.company?.name,
        headline: user.headline || undefined,
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
    }

    // -------------------------------------------------------------------------
    // DEVELOPMENT-ONLY FALLBACK (Strictly disabled in production)
    // -------------------------------------------------------------------------
    if (process.env.NODE_ENV !== "production") {
      // 2. Preconfigured User Verification (Development Only)
      const preconfigured = PRECONFIGURED_USERS.find(
        (u) => u.email.toLowerCase() === normalizedEmail
      );

      if (preconfigured) {
        let expectedPass = "";
        if (preconfigured.role === "PLATFORM_ADMIN") expectedPass = "Owner@123";
        else if (preconfigured.role === "RECRUITER") expectedPass = "Recruiter@123";
        else if (preconfigured.role === "JOB_SEEKER") expectedPass = "JobSeeker@123";

        if (password !== expectedPass) {
          return NextResponse.json(
            { success: false, error: `Invalid password for ${preconfigured.name}` },
            { status: 401 }
          );
        }

        const session = await createSession(preconfigured.id);
        const response = NextResponse.json({ success: true, user: preconfigured });
        
        const cookieVal = encodeURIComponent(JSON.stringify(preconfigured));
        response.cookies.set(SESSION_COOKIE_NAME, cookieVal, {
          httpOnly: false,
          secure: false,
          sameSite: "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60,
        });

        return response;
      }

      // 3. Dynamic User Fallback for test credentials (Development Only)
      const role: UserRole = requestedRole || "JOB_SEEKER";
      const dynamicUser = {
        id: `usr-${Date.now()}`,
        name: email.split("@")[0] || "User",
        email: normalizedEmail,
        role,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
        status: "VERIFIED" as const,
        headline: `${role.replace("_", " ")} Account`,
      };

      const cookieVal = encodeURIComponent(JSON.stringify(dynamicUser));
      const response = NextResponse.json({ success: true, user: dynamicUser });
      response.cookies.set(SESSION_COOKIE_NAME, cookieVal, {
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    }

    // In production, reject unauthenticated user when not found in database
    return NextResponse.json(
      { success: false, error: "Invalid email or password" },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
