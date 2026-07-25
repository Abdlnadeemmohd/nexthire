"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthUser, PRECONFIGURED_USERS, UserRole } from "@/lib/auth";
import { authService } from "@/services/authService";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (role: UserRole, email: string, pass: string, remember: boolean) => Promise<{ success: boolean; error?: string }>;
  registerSeeker: (name: string, email: string, phone: string, country: string, pass: string) => Promise<{ success: boolean }>;
  registerRecruiter: (name: string, company: string, email: string, website: string, phone: string, location: string, designation: string, pass: string) => Promise<{ success: boolean }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Default to Alex Rivers (Job Seeker) for instant preview if no session stored
  const [user, setUser] = useState<AuthUser | null>(PRECONFIGURED_USERS[2]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const sessionUser = authService.getCurrentSessionUser();
    if (sessionUser) {
      setUser(sessionUser);
    }
  }, []);

  const login = async (role: UserRole, email: string, pass: string, remember: boolean) => {
    setIsLoading(true);
    const res = await authService.login(email, pass, role, remember);
    setIsLoading(false);

    if (res.success && res.user) {
      setUser(res.user);
      return { success: true };
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
