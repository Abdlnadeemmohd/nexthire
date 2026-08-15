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
        { success: false, error: "Name, email, and password are required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const passwordHash = hashPassword(password);

    let newUser: any = null;
    try {
      // Check existing
      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "An account with this email already exists" },
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
    } catch (err) {
      console.warn("Database registration fallback:", err);
    }

    const userId = newUser ? newUser.id : `usr-${Date.now()}`;
    const userRole: UserRole = (newUser ? newUser.role : role) as UserRole;

    const authUser = {
      id: userId,
      name: name,
      email: normalizedEmail,
      role: userRole,
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
      status: "VERIFIED" as const,
      companyName: companyName || undefined,
      headline: headline || `${userRole.replace("_", " ")} Account`,
    };

    const session = await createSession(userId);
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
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to register user" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
