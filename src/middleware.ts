import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Never redirect or intercept API routes with HTML pages
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 2. Protected page route prefixes
  const isProtected =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/recruiter") ||
    pathname.startsWith("/jobseeker") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/applications") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/messages") ||
    pathname.startsWith("/resume-studio");

  if (!isProtected) {
    return NextResponse.next();
  }

  const cookieSession = request.cookies.get("nexthire_auth_session");
  if (!cookieSession || !cookieSession.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  let userRole: string | null = null;
  try {
    const rawVal = cookieSession.value;
    let parsedUser: any = null;
    try {
      parsedUser = JSON.parse(decodeURIComponent(rawVal));
    } catch {
      try {
        parsedUser = JSON.parse(rawVal);
      } catch {
        parsedUser = null;
      }
    }
    userRole = parsedUser?.role || null;
  } catch {
    userRole = null;
  }

  if (!userRole) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Role-based route enforcement
  if (userRole === "JOB_SEEKER") {
    if (pathname.startsWith("/admin") || pathname.startsWith("/recruiter")) {
      return NextResponse.redirect(new URL("/403", request.url));
    }
  } else if (userRole === "RECRUITER") {
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/403", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/recruiter/:path*",
    "/jobseeker/:path*",
    "/dashboard/:path*",
    "/applications/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/messages/:path*",
    "/resume-studio/:path*",
  ],
};
