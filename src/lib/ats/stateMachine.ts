import { UserRole } from "@/lib/auth";

export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ["UNDER_REVIEW", "REJECTED", "APPLICATION_CLOSED"],
  UNDER_REVIEW: ["INTERVIEW_SCHEDULED", "INTERVIEW_ROUND_1", "REJECTED", "APPLICATION_CLOSED"],
  INTERVIEW_SCHEDULED: ["INTERVIEW_ROUND_1", "INTERVIEW_ROUND_2", "REJECTED", "APPLICATION_CLOSED"],
  INTERVIEW_ROUND_1: ["INTERVIEW_ROUND_2", "INTERVIEW_ROUND_3", "OFFER_EXTENDED", "REJECTED", "APPLICATION_CLOSED"],
  INTERVIEW_ROUND_2: ["INTERVIEW_ROUND_3", "FINAL_DECISION", "OFFER_EXTENDED", "REJECTED", "APPLICATION_CLOSED"],
  INTERVIEW_ROUND_3: ["FINAL_DECISION", "OFFER_EXTENDED", "REJECTED", "APPLICATION_CLOSED"],
  FINAL_DECISION: ["OFFER_EXTENDED", "REJECTED", "APPLICATION_CLOSED"],
  OFFER_EXTENDED: ["APPLICATION_CLOSED", "REJECTED"], // Terminal unless candidate accepts/declines
  REJECTED: [], // Terminal state
  APPLICATION_CLOSED: [], // Terminal state
};

export const STAGE_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  INTERVIEW_SCHEDULED: "Schedule Interview",
  INTERVIEW_ROUND_1: "Interview Round 1",
  INTERVIEW_ROUND_2: "Interview Round 2",
  INTERVIEW_ROUND_3: "Interview Round 3",
  FINAL_DECISION: "Final Decision",
  OFFER_EXTENDED: "Extend Offer",
  REJECTED: "Rejected",
  APPLICATION_CLOSED: "Closed",
};

export function getAllowedTransitions(currentStatus: string): string[] {
  return ALLOWED_TRANSITIONS[currentStatus] || [];
}

export function isTerminalStatus(status: string): boolean {
  return status === "REJECTED" || status === "APPLICATION_CLOSED";
}

export function validateStatusTransition(
  currentStatus: string,
  targetStatus: string,
  userRole?: UserRole
): { valid: boolean; error?: string } {
  if (currentStatus === targetStatus) {
    return { valid: true };
  }

  // Platform Admins can override transitions for administrative corrections
  if (userRole === "PLATFORM_ADMIN") {
    return { valid: true };
  }

  const allowedNextStates = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowedNextStates.includes(targetStatus)) {
    return {
      valid: false,
      error: `Invalid transition from '${currentStatus}' to '${targetStatus}'. Allowed next stages: ${allowedNextStates.join(", ") || "None (Terminal State)"}`,
    };
  }

  return { valid: true };
}
