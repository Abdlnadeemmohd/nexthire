import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, formatSessionCookie, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { PRECONFIGURED_USERS, UserRole } from "@/lib/auth";

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

    const { email, password, role: requestedRole } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Database User Authentication
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
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      const session = await createSession(user.id);
      const authUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
        avatar:
          user.avatar ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
        status: "VERIFIED" as const,
        companyName: user.company?.name,
        headline: user.headline || undefined,
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
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        }

        // Ensure user exists in database for preconfigured test credentials
        let dbPreconfigured = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!dbPreconfigured) {
          dbPreconfigured = await prisma.user.create({
            data: {
              email: normalizedEmail,
              name: preconfigured.name,
              role: preconfigured.role,
              headline: `${preconfigured.role.replace("_", " ")} Account`,
              avatar: preconfigured.avatar,
            },
          });
        }

        const session = await createSession(dbPreconfigured.id);
        const cookieValue = formatSessionCookie({
          token: session.token,
          userId: dbPreconfigured.id,
          email: dbPreconfigured.email,
          role: dbPreconfigured.role as UserRole,
        });

        const response = NextResponse.json(
          { success: true, user: dbPreconfigured },
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
        response.cookies.set(SESSION_COOKIE_NAME, cookieValue, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60,
        });

        return response;
      }
    }

    // In production or when credentials do not match database record, reject
    return NextResponse.json(
      { success: false, error: "Invalid email or password", category: "INVALID_CREDENTIALS" },
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[Login] Internal error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error", category: "INTERNAL_SERVER_ERROR" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
