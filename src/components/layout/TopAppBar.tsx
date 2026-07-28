"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { DesktopHeader } from "./DesktopHeader";
import { MobileHeader } from "./MobileHeader";

export function TopAppBar() {
  const { user, isAuthenticated } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      {/* Desktop Navigation & Header (Visible on Desktop / Tablet >= 768px) */}
      <DesktopHeader
        isAuthenticated={isAuthenticated}
        user={user}
        isMounted={isMounted}
      />

      {/* Mobile-First Navigation & Full-Screen Search Header (Visible on Mobile < 768px) */}
      <MobileHeader
        isAuthenticated={isAuthenticated}
        user={user}
      />
    </>
  );
}
