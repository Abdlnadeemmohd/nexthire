import { StructuredNotesResult } from "./types";

/**
 * Sanitizes input and neutralizes hostile prompt injection tokens.
 */
export function sanitizeInterviewerNotes(raw: string): string {
  if (!raw) return "";
  let clean = raw
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/system\s*:\s*you\s+are/gi, "")
    .replace(/ignore\s+all\s+previous\s+instructions/gi, "")
    .replace(/override\s+authorization/gi, "")
    .replace(/grant\s+admin/gi, "")
    .replace(/[<>{}\\]/g, " ")
    .trim();

  return clean.slice(0, 8000);
}

/**
 * AI Interview Note Assistant
 * Structures raw interviewer scratch notes into categorized facts, strengths, concerns,
 * unverified gaps, and recommended follow-up questions.
 */
export function structureInterviewerNotes(rawNotes: string): StructuredNotesResult {
  const sanitized = sanitizeInterviewerNotes(rawNotes);
  if (!sanitized) {
    return {
      strengths: [],
      concerns: [],
      observedEvidence: [],
      unverifiedAreas: [],
      followUpQuestions: [],
      sanitizedNotes: "",
    };
  }

  const sentences = sanitized
    .split(/(?<=[.!?\n])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 5);

  const strengths: string[] = [];
  const concerns: string[] = [];
  const observedEvidence: Array<{
    competency: string;
    fact: string;
    source: "INTERVIEW_STATEMENT" | "CODE_DEMO" | "WORK_SAMPLE";
  }> = [];
  const unverifiedAreas: string[] = [];
  const followUpQuestions: string[] = [];

  const positivePatterns = [
    /\b(strong|good|great|excellent|proficient|solid|mastery|clear|well|demonstrated|passed|solved|built|impressive)\b/i,
  ];
  const negativePatterns = [
    /\b(weak|struggled|lacking|gap|unsure|failed|could not|couldn't|confused|poor|hesitant|unfamiliar|shallow)\b/i,
  ];
  const evidenceKeywords = [
    /\b(explained|showed|implemented|designed|migrated|debugged|coded|optimized|scaled|refactored|answered)\b/i,
  ];

  for (const sentence of sentences) {
    const isNegative = negativePatterns.some(p => p.test(sentence));
    const isPositive = positivePatterns.some(p => p.test(sentence));
    const hasEvidence = evidenceKeywords.some(p => p.test(sentence));

    // Extract competency if mentioned
    let inferredCompetency = "Technical Execution";
    if (/\b(react|next\.?js|frontend|ui|css|tailwind|vue)\b/i.test(sentence)) {
      inferredCompetency = "Frontend Engineering";
    } else if (/\b(node|postgres|sql|prisma|backend|api|database|graphql|redis)\b/i.test(sentence)) {
      inferredCompetency = "Backend & Data Engineering";
    } else if (/\b(system design|architecture|scalability|distributed|microservices|aws|cloud|docker|k8s)\b/i.test(sentence)) {
      inferredCompetency = "System Design & Architecture";
    } else if (/\b(communication|collaboration|team|articulate|explained|mentored)\b/i.test(sentence)) {
      inferredCompetency = "Communication & Teamwork";
    } else if (/\b(ownership|deadline|delivery|lead|leadership|project)\b/i.test(sentence)) {
      inferredCompetency = "Ownership & Leadership";
    }

    if (hasEvidence) {
      observedEvidence.push({
        competency: inferredCompetency,
        fact: sentence,
        source: "INTERVIEW_STATEMENT",
      });
    }

    if (isNegative) {
      concerns.push(sentence);
      unverifiedAreas.push(inferredCompetency);
      followUpQuestions.push(`Could you elaborate further on your experience with ${inferredCompetency}?`);
    } else if (isPositive) {
      strengths.push(sentence);
    }
  }

  // Deduplicate
  const uniqueStrengths = Array.from(new Set(strengths));
  const uniqueConcerns = Array.from(new Set(concerns));
  const uniqueUnverified = Array.from(new Set(unverifiedAreas));
  const uniqueQuestions = Array.from(new Set(followUpQuestions)).slice(0, 3);

  // Fallbacks if unstructured
  if (uniqueStrengths.length === 0 && sentences.length > 0) {
    uniqueStrengths.push(sentences[0]);
  }

  return {
    strengths: uniqueStrengths,
    concerns: uniqueConcerns,
    observedEvidence,
    unverifiedAreas: uniqueUnverified,
    followUpQuestions: uniqueQuestions,
    sanitizedNotes: sanitized,
  };
}
