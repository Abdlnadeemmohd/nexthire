"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { AuthUser, UserRole } from "@/lib/auth";
import { authService } from "@/services/authService";

export type { UserRole };

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string, role?: UserRole, remember?: boolean) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  loginWithFirebase: (idToken: string) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  registerSeeker: (name: string, email: string, phone: string, country: string, pass: string) => Promise<{ success: boolean }>;
  registerRecruiter: (name: string, company: string, email: string, website: string, phone: string, location: string, designation: string, pass: string) => Promise<{ success: boolean }>;
  logout: () => Promise<void>;
  updateUserProfile: (partial: Partial<AuthUser>) => void;
  updateSubscriptionTier: (tier: string) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => authService.getCurrentSessionUser());
  const [isLoading, setIsLoading] = useState(false);
  const isLoggingOutRef = useRef(false);

  useEffect(() => {
    // 1. Synchronize initial state from storage
    const sessionUser = authService.getCurrentSessionUser();
    setUser(sessionUser);

    // 2. Validate session against server-side /api/auth/me
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user);
          authService.saveSessionUser(data.user);
        } else {
          // If server says unauthenticated, ensure client storage and state are cleared
          if (sessionUser && !isLoggingOutRef.current) {
            setUser(null);
            if (typeof window !== "undefined") {
              localStorage.removeItem("nexthire_auth_user_session");
              sessionStorage.removeItem("nexthire_auth_user_session");
            }
          }
        }
      })
      .catch(() => {
        // Network failure during session check
      });

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "nexthire_auth_user_session") {
        if (e.newValue) {
          try {
            setUser(JSON.parse(e.newValue));
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = async (email: string, pass: string, role?: UserRole, remember: boolean = true) => {
    setIsLoading(true);
    const res = await authService.login(email, pass, role, remember);
    setIsLoading(false);

    if (res.success && res.user) {
      setUser(res.user);
      return { success: true, user: res.user };
    }
    return { success: false, error: res.error || "Authentication failed." };
  };

  const loginWithFirebase = async (idToken: string) => {
    setIsLoading(true);
    const res = await authService.loginWithFirebase(idToken);
    setIsLoading(false);

    if (res.success && res.user) {
      setUser(res.user);
      return { success: true, user: res.user };
    }
    return { success: false, error: res.error || "Firebase authentication failed." };
  };

  const registerSeeker = async (name: string, email: string, phone: string, country: string, pass: string) => {
    setIsLoading(true);
    const res = await authService.registerSeeker({ name, email, phone, country, password: pass });
    setIsLoading(false);
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true };
    }
    return { success: false, error: res.error || "Registration failed" };
  };

  const registerRecruiter = async (
    name: string,
    company: string,
    email: string,
    website: string,
    phone: string,
    location: string,
    designation: string,
    pass: string
  ) => {
    setIsLoading(true);
    const res = await authService.registerRecruiter({
      name,
      companyName: company,
      email,
      website,
      phone,
      location,
      designation,
      password: pass,
    });
    setIsLoading(false);
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true };
    }
    return { success: false, error: res.error || "Registration failed" };
  };

  const logout = async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    try {
      // 1. Immediately wipe React user state
      setUser(null);

      // 2. Execute full atomic logout (server cookie invalidation + Firebase client signOut + storage wipe)
      await authService.logout();

      // 3. Broadcast storage event for header and notification counter synchronization
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
        window.location.href = "/";
      }
    } catch (err) {
      console.error("[Logout execution notice]:", err);
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } finally {
      isLoggingOutRef.current = false;
    }
  };

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        authService.saveSessionUser(data.user);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("storage"));
        }
      }
    } catch (err) {
      console.error("[AuthContext.refreshUser notice]:", err);
    }
  };

  const updateUserProfile = (partial: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...partial };
      if (typeof window !== "undefined") {
        authService.saveSessionUser(updated);
        window.dispatchEvent(new Event("storage"));
      }
      return updated;
    });
  };

  const updateSubscriptionTier = (tier: string) => {
    updateUserProfile({ subscriptionTier: tier });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithFirebase,
        registerSeeker,
        registerRecruiter,
        logout,
        updateUserProfile,
        updateSubscriptionTier,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
