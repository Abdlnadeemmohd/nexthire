"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthUser, PRECONFIGURED_USERS, UserRole } from "@/lib/auth";
import { authService } from "@/services/authService";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string, role?: UserRole, remember?: boolean) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  registerSeeker: (name: string, email: string, phone: string, country: string, pass: string) => Promise<{ success: boolean }>;
  registerRecruiter: (name: string, company: string, email: string, website: string, phone: string, location: string, designation: string, pass: string) => Promise<{ success: boolean }>;
  logout: () => void;
  updateUserProfile: (partial: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => authService.getCurrentSessionUser());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const sessionUser = authService.getCurrentSessionUser();
    setUser(sessionUser);

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

  const registerSeeker = async (name: string, email: string, phone: string, country: string, pass: string) => {
    setIsLoading(true);
    const res = await authService.registerSeeker({ name, email, phone, country, password: pass });
    setIsLoading(false);
    setUser(res.user);
    return { success: true };
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
    setUser(res.user);
    return { success: true };
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const updateUserProfile = (partial: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...partial };
      if (typeof window !== "undefined") {
        sessionStorage.setItem("nexthire_auth_user_session", JSON.stringify(updated));
      }
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        registerSeeker,
        registerRecruiter,
        logout,
        updateUserProfile,
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
