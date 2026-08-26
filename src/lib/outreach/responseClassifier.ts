import {
  ResponseClassification,
  EngagementIntent,
  ResponseClassificationResult,
} from "./types";

function normalize(text: string): string {
  return (text || "").toLowerCase().trim();
}

/**
 * Sanitizes candidate reply text against prompt injection patterns and privilege elevation.
 */
export function sanitizeCandidateReply(text: string): string {
  if (!text) return "";
  // Strip system prompt manipulation attempts while retaining readable text
  return text
    .replace(/(?:system\s*prompt|ignore\s*previous\s*instructions|drop\s*table|bypass\s*security)/gi, "[redacted]")
    .trim();
}

/**
 * Classifies candidate responses into actionable recruiter categories.
 * Strict prompt-injection resilience: treats candidate text purely as literal message content.
 */
export function classifyCandidateResponse(rawText: string): ResponseClassificationResult {
  const sanitized = sanitizeCandidateReply(rawText);
  const text = normalize(sanitized);

  // 1. Opt-out / Unsubscribe / Strong Negative
  if (
    text.includes("unsubscribe") ||
    text.includes("opt out") ||
    text.includes("opt-out") ||
    text.includes("stop messaging") ||
    text.includes("remove me") ||
    text.includes("do not contact")
  ) {
    return {
      classification: "NEGATIVE",
      sentiment: "NEGATIVE",
      engagementIntent: "OPTED_OUT",
      confidence: "HIGH",
      suggestedNextAction: "Candidate requested to stop receiving outreach. Mark as opted-out and do not contact.",
      suggestedActionType: "RESPECT_OPT_OUT",
      summary: "Candidate requested communication opt-out.",
    };
  }

  // 2. Salary / Compensation inquiry
  if (
    text.includes("salary") ||
    text.includes("compensation") ||
    text.includes("pay range") ||
    text.includes("budget") ||
    text.includes("ctc") ||
    text.includes("remuneration")
  ) {
    return {
      classification: "REQUEST_SALARY",
      sentiment: "NEUTRAL",
      engagementIntent: "MODERATE_INTENT",
      confidence: "HIGH",
      suggestedNextAction: "Provide approved compensation range and inquire about candidate expectations.",
      suggestedActionType: "PROVIDE_SALARY",
      summary: "Candidate is inquiring about the salary and compensation structure.",
    };
  }

  // 3. Positive Interest / Ready to Talk
  if (
    text.includes("interested") ||
    text.includes("sounds great") ||
    text.includes("love to chat") ||
    text.includes("would love to learn more") ||
    text.includes("let's connect") ||
    text.includes("schedule") ||
    text.includes("call") ||
    text.includes("available on") ||
    text.includes("free this week") ||
    text.includes("happy to talk") ||
    text.includes("send a calendar link") ||
    text.includes("set up a call")
  ) {
    return {
      classification: "POSITIVE_INTEREST",
      sentiment: "POSITIVE",
      engagementIntent: "HIGH_INTENT",
      confidence: "HIGH",
      suggestedNextAction: "Candidate expressed direct interest. Share interview scheduling availability or calendar link.",
      suggestedActionType: "SCHEDULE_INTERVIEW",
      summary: "Positive interest in role and open to discussion.",
    };
  }

  // 4. Interested Later / Future Contact
  if (
    text.includes("in a few months") ||
    text.includes("reach out later") ||
    text.includes("next quarter") ||
    text.includes("not right now but") ||
    text.includes("keep in touch") ||
    text.includes("in the future") ||
    text.includes("stay connected")
  ) {
    return {
      classification: "INTERESTED_LATER",
      sentiment: "NEUTRAL",
      engagementIntent: "MODERATE_INTENT",
      confidence: "HIGH",
      suggestedNextAction: "Candidate is open to future opportunities. Save to talent pool and set rediscovery reminder.",
      suggestedActionType: "SEND_FOLLOW_UP",
      summary: "Candidate interested in future openings rather than immediate transition.",
    };
  }

  // 5. Not Available / Happy at Current Role
  if (
    text.includes("not looking") ||
    text.includes("not interested") ||
    text.includes("happy where i am") ||
    text.includes("just joined") ||
    text.includes("passed") ||
    text.includes("declined") ||
    text.includes("no thanks")
  ) {
    return {
      classification: "NOT_AVAILABLE",
      sentiment: "NEGATIVE",
      engagementIntent: "LOW_INTENT",
      confidence: "HIGH",
      suggestedNextAction: "Candidate is not currently in the market. Send polite acknowledgement.",
      suggestedActionType: "NO_ACTION",
      summary: "Candidate politely declined current opening.",
    };
  }

  // 6. Request for More Information / Tech Stack / Remote Policy
  if (
    text.includes("tech stack") ||
    text.includes("remote") ||
    text.includes("job description") ||
    text.includes("more details") ||
    text.includes("more information") ||
    text.includes("role requirements") ||
    text.includes("team size")
  ) {
    return {
      classification: "REQUEST_MORE_INFORMATION",
      sentiment: "NEUTRAL",
      engagementIntent: "MODERATE_INTENT",
      confidence: "HIGH",
      suggestedNextAction: "Send complete job details, team architecture stack, and remote policy overview.",
      suggestedActionType: "SEND_JOB_DETAILS",
      summary: "Candidate requested technical architecture or position details.",
    };
  }

  // 7. General / Brief reply
  if (text.length > 5 && (text.includes("thanks") || text.includes("thank you") || text.includes("hello"))) {
    return {
      classification: "NEEDS_CLARIFICATION",
      sentiment: "NEUTRAL",
      engagementIntent: "MODERATE_INTENT",
      confidence: "MEDIUM",
      suggestedNextAction: "Follow up with a brief note asking if they would like role specifications.",
      suggestedActionType: "SEND_FOLLOW_UP",
      summary: "Brief response acknowledging message.",
    };
  }

  return {
    classification: "UNKNOWN",
    sentiment: "NEUTRAL",
    engagementIntent: "MODERATE_INTENT",
    confidence: "LOW",
    suggestedNextAction: "Review candidate reply and respond in recruiter chat.",
    suggestedActionType: "NO_ACTION",
    summary: "Unclassified reply requiring recruiter review.",
  };
}
