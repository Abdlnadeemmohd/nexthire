"use client";

import React, { useEffect } from "react";
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

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Role-based route authorization check
    const isAllowed = hasRouteAccess(user.role, pathname);
    if (!isAllowed) {
      router.push("/403");
    }
  }, [user, isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
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
