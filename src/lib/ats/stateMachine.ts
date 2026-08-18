import { UserRole } from "@/lib/auth";

export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ["UNDER_REVIEW", "REJECTED", "APPLICATION_CLOSED"],
  UNDER_REVIEW: ["INTERVIEW_SCHEDULED", "FINAL_DECISION", "REJECTED", "APPLICATION_CLOSED"],
  INTERVIEW_SCHEDULED: ["FINAL_DECISION", "OFFER_EXTENDED", "REJECTED", "APPLICATION_CLOSED"],
  // Legacy / internal compatibility states allow direct progression to Final Decision or Selection:
  INTERVIEW_ROUND_1: ["FINAL_DECISION", "OFFER_EXTENDED", "REJECTED", "APPLICATION_CLOSED"],
  INTERVIEW_ROUND_2: ["FINAL_DECISION", "OFFER_EXTENDED", "REJECTED", "APPLICATION_CLOSED"],
  INTERVIEW_ROUND_3: ["FINAL_DECISION", "OFFER_EXTENDED", "REJECTED", "APPLICATION_CLOSED"],
  FINAL_DECISION: ["OFFER_EXTENDED", "REJECTED", "APPLICATION_CLOSED"],
  OFFER_EXTENDED: ["APPLICATION_CLOSED", "REJECTED"], // Terminal success stage unless closed/withdrawn
  REJECTED: [], // Terminal state
  APPLICATION_CLOSED: [], // Terminal state
};

export const STAGE_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  INTERVIEW_SCHEDULED: "Interview",
  INTERVIEW_ROUND_1: "Interview",
  INTERVIEW_ROUND_2: "Interview",
  INTERVIEW_ROUND_3: "Interview",
  FINAL_DECISION: "Final Decision",
  OFFER_EXTENDED: "Selected",
  REJECTED: "Rejected",
  APPLICATION_CLOSED: "Closed",
};

export const RECRUITER_ACTION_LABELS: Record<string, string> = {
  UNDER_REVIEW: "Move to Under Review",
  INTERVIEW_SCHEDULED: "Schedule Interview",
  FINAL_DECISION: "Move to Final Decision",
  OFFER_EXTENDED: "Select Candidate",
  REJECTED: "Reject Candidate",
  APPLICATION_CLOSED: "Close Application",
};

export const CANDIDATE_PIPELINE_STAGES = [
  { key: "SUBMITTED", label: "Submitted" },
  { key: "UNDER_REVIEW", label: "Under Review" },
  { key: "INTERVIEW_SCHEDULED", label: "Interview" },
  { key: "FINAL_DECISION", label: "Final Decision" },
  { key: "OFFER_EXTENDED", label: "Selected" },
];

export function getCandidateStageIndex(status: string): number {
  if (status === "REJECTED" || status === "APPLICATION_CLOSED") return -1;
  if (status === "SUBMITTED") return 0;
  if (status === "UNDER_REVIEW") return 1;
  if (status.startsWith("INTERVIEW")) return 2;
  if (status === "FINAL_DECISION") return 3;
  if (status === "OFFER_EXTENDED" || status === "SELECTED") return 4;
  return 0;
}

export function getAllowedTransitions(currentStatus: string): string[] {
  return ALLOWED_TRANSITIONS[currentStatus] || [];
}

export function isTerminalStatus(status: string): boolean {
  return status === "REJECTED" || status === "APPLICATION_CLOSED";
}

export function isActiveApplicationStatus(status: string): boolean {
  if (!status) return false;
  if (isTerminalStatus(status)) return false;
  if (status === "WITHDRAWN") return false;
  return true;
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
