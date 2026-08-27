"use client";

import React from "react";
import { UserRole } from "@/lib/auth";
import {
  SUBSCRIPTION_TIER_STYLES,
  normalizeSubscriptionTier,
  SubscriptionTier,
} from "@/lib/subscriptionTiers";
import { SubscriptionVerificationBadge } from "@/components/ui/SubscriptionVerificationBadge";

export interface VerifiedBadgeProps {
  role?: UserRole | "COMPANY" | "PREMIUM_RECRUITER" | "HIRING_PARTNER" | string;
  tier?: "TRIAL" | "FREE" | "SILVER" | "GOLD" | "DIAMOND" | "PLATINUM" | SubscriptionTier | string;
  isVerified?: boolean;
  size?: "sm" | "md" | "lg";
  customLabel?: string;
  showIconOnly?: boolean;
  className?: string;
}

export function VerifiedBadge({
  role = "JOB_SEEKER",
  tier = "FREE",
  isVerified = true,
  size = "sm",
  customLabel,
  showIconOnly = false,
  className = "",
}: VerifiedBadgeProps) {
  return (
    <SubscriptionVerificationBadge
      role={role}
      tier={tier}
      verificationStatus={isVerified ? "VERIFIED" : "UNVERIFIED"}
      size={size}
      className={className}
    />
  );
}
