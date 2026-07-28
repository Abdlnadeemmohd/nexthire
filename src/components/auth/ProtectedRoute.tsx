"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { hasRouteAccess } from "@/lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPortal?: "seeker" | "recruiter" | "admin";
}

export function ProtectedRoute({ children, requiredPortal }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || isLoading) return;

    if (!isAuthenticated || !user) {
      const roleParam = requiredPortal === "recruiter" ? "recruiter" : requiredPortal === "admin" ? "admin" : "seeker";
      router.push(`/login?role=${roleParam}&redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Role-based route authorization check
    const isAllowed = hasRouteAccess(user.role, pathname);
    if (!isAllowed) {
      router.push("/403");
    }
  }, [user, isAuthenticated, isLoading, isMounted, pathname, router]);

  // Prevent SSR Hydration mismatch between server and client HTML
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex items-center gap-3 text-primary font-label-md text-sm">
          <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
          Verifying security credentials...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  const isAllowed = hasRouteAccess(user.role, pathname);
  if (!isAllowed) return null;

  return <>{children}</>;
}
