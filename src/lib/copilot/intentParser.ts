import { CopilotIntentType, ParsedSearchCriteria, RecruiterActionProposal } from "./types";

const KNOWN_SKILLS = [
  "TypeScript", "JavaScript", "React", "Next.js", "Node.js", "Python", "Go", "Golang", "Java",
  "C++", "C#", ".NET", "PostgreSQL", "Postgres", "MySQL", "MongoDB", "Redis", "GraphQL", "REST APIs",
  "AWS", "Amazon Web Services", "GCP", "Google Cloud", "Azure", "Docker", "Kubernetes", "K8s",
  "TailwindCSS", "HTML", "CSS", "Git", "CI/CD", "Prisma", "Microservices", "Kafka", "Elasticsearch",
  "DevOps", "Terraform", "System Design", "Distributed Systems", "SQL", "NoSQL", "Spring Boot",
  "FastAPI", "Django", "Flask", "Ruby on Rails", "Rust", "Swift", "Kotlin", "Flutter", "React Native"
];

/**
 * Sanitizes input and neutralizes prompt injection attempts.
 * Prevents candidate profile text or user input from spoofing system commands or bypassing authorization.
 */
export function sanitizeCopilotPrompt(rawPrompt: string): string {
  if (!rawPrompt) return "";

  let sanitized = rawPrompt
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/system\s*:\s*you\s+are/gi, "")
    .replace(/ignore\s+all\s+previous\s+instructions/gi, "")
    .replace(/override\s+authorization/gi, "")
    .replace(/act\s+as\s+admin/gi, "")
    .replace(/grant\s+admin\s+access/gi, "")
    .replace(/[<>{}\\]/g, " ")
    .trim();

  // Bound length to prevent denial-of-service / memory overflow
  return sanitized.slice(0, 1000);
}

/**
 * Normalizes text for matching and entity extraction.
 */
function normalize(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[-_./,\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extracts structured skills from text.
 */
export function extractSkillsFromPrompt(prompt: string): string[] {
  const norm = normalize(prompt);
  const matched = new Set<string>();

  for (const skill of KNOWN_SKILLS) {
    const skillNorm = normalize(skill);
    // Word boundary or containment check
    const regex = new RegExp(`(?:^|\\s)${skillNorm.replace(/\+/g, "\\+")}(?:$|\\s)`, "i");
    if (regex.test(norm) || norm.includes(` ${skillNorm} `) || norm.startsWith(`${skillNorm} `) || norm.endsWith(` ${skillNorm}`)) {
      // Canonicalize common synonyms
      if (skill === "Postgres") matched.add("PostgreSQL");
      else if (skill === "Golang") matched.add("Go");
      else if (skill === "K8s") matched.add("Kubernetes");
      else if (skill === "Amazon Web Services") matched.add("AWS");
      else if (skill === "Google Cloud") matched.add("GCP");
      else matched.add(skill);
    }
  }

  return Array.from(matched);
}

/**
 * Extracts experience years requirement (e.g. "5+ years", "at least 3 years", "4 yrs").
 */
export function extractExperienceYears(prompt: string): number | undefined {
  const expMatch = prompt.match(/(\d+)\s*\+?\s*(?:years?|yrs?)/i);
  if (expMatch && expMatch[1]) {
    const yrs = parseInt(expMatch[1], 10);
    if (!isNaN(yrs) && yrs > 0 && yrs <= 30) {
      return yrs;
    }
  }
  return undefined;
}

/**
 * Extracts seniority level.
 */
export function extractSeniority(prompt: string): "JUNIOR" | "MID" | "SENIOR" | "LEAD" | "PRINCIPAL" | undefined {
  const norm = normalize(prompt);
  if (norm.includes("principal") || norm.includes("staff")) return "PRINCIPAL";
  if (norm.includes("lead") || norm.includes("head") || norm.includes("architect")) return "LEAD";
  if (norm.includes("senior") || norm.includes("sr")) return "SENIOR";
  if (norm.includes("junior") || norm.includes("jr") || norm.includes("entry") || norm.includes("intern")) return "JUNIOR";
  if (norm.includes("mid") || norm.includes("intermediate")) return "MID";
  return undefined;
}

/**
 * Extracts candidate role/title (e.g. "Backend Engineer", "Frontend Developer", etc.).
 */
export function extractRole(prompt: string): string | undefined {
  const norm = normalize(prompt);
  const roles = [
    { key: "full stack engineer", title: "Full-Stack Engineer" },
    { key: "full stack developer", title: "Full-Stack Developer" },
    { key: "fullstack", title: "Full-Stack Engineer" },
    { key: "backend engineer", title: "Backend Engineer" },
    { key: "backend developer", title: "Backend Developer" },
    { key: "backend", title: "Backend Engineer" },
    { key: "frontend engineer", title: "Frontend Engineer" },
    { key: "frontend developer", title: "Frontend Developer" },
    { key: "frontend", title: "Frontend Engineer" },
    { key: "devops engineer", title: "DevOps Engineer" },
    { key: "devops", title: "DevOps Engineer" },
    { key: "cloud engineer", title: "Cloud Engineer" },
    { key: "data engineer", title: "Data Engineer" },
    { key: "machine learning engineer", title: "Machine Learning Engineer" },
    { key: "ml engineer", title: "ML Engineer" },
    { key: "software engineer", title: "Software Engineer" },
    { key: "mobile engineer", title: "Mobile Engineer" },
    { key: "product manager", title: "Product Manager" },
    { key: "qa engineer", title: "QA Engineer" },
    { key: "engineering manager", title: "Engineering Manager" },
  ];

  for (const r of roles) {
    if (norm.includes(r.key)) return r.title;
  }
  return undefined;
}

/**
 * Extracts location entity.
 */
export function extractLocation(prompt: string): string | undefined {
  const norm = normalize(prompt);
  const cities = [
    "bangalore", "bengaluru", "mumbai", "delhi", "hyderabad", "pune", "chennai", "gurgaon", "noida",
    "san francisco", "new york", "london", "singapore", "berlin", "toronto"
  ];
  const countries = ["india", "united states", "usa", "us", "uk", "germany", "canada"];

  for (const city of cities) {
    const regex = new RegExp(`(?:in|located in|from|near)\\s+${city}|(?:^|\\s)${city}(?:$|\\s)`, "i");
    if (regex.test(norm)) {
      if (city === "bengaluru") return "Bangalore";
      if (city === "san francisco") return "San Francisco";
      if (city === "new york") return "New York";
      return city.charAt(0).toUpperCase() + city.slice(1);
    }
  }

  for (const country of countries) {
    const regex = new RegExp(`(?:in|located in|from|near)\\s+${country}|(?:^|\\s)${country}(?:$|\\s)`, "i");
    if (regex.test(norm)) {
      if (country === "usa" || country === "us") return "United States";
      if (country === "uk") return "United Kingdom";
      return country.charAt(0).toUpperCase() + country.slice(1);
    }
  }
  return undefined;
}

/**
 * Parses a recruiter natural language prompt into intent and structured parameters.
 */
export function parseRecruiterIntent(rawPrompt: string): {
  intent: CopilotIntentType;
  criteria?: ParsedSearchCriteria;
  targetJobQuery?: string;
  targetCandidateQuery?: string;
  actionProposal?: RecruiterActionProposal;
} {
  const cleanPrompt = sanitizeCopilotPrompt(rawPrompt);
  const norm = normalize(cleanPrompt);

  // 1. Check for Action Intent (Shortlist, Reject, Move Stage)
  if (
    norm.startsWith("shortlist ") ||
    norm.startsWith("move ") ||
    norm.startsWith("reject ") ||
    norm.includes("move Sarah to interview") ||
    norm.includes("shortlist candidate") ||
    norm.includes("reject candidate")
  ) {
    let actionType: "SHORTLIST" | "MOVE_STAGE" | "REJECT" = "SHORTLIST";
    let newStage: string | undefined;
    let confirmationMessage = "";

    if (norm.includes("reject")) {
      actionType = "REJECT";
      confirmationMessage = `This will move the selected candidate(s) to REJECTED status and log an authoritative audit event. Confirm?`;
    } else if (norm.includes("interview")) {
      actionType = "MOVE_STAGE";
      newStage = "INTERVIEW_SCHEDULED";
      confirmationMessage = `This will advance the candidate to INTERVIEW_SCHEDULED status. Confirm?`;
    } else {
      actionType = "SHORTLIST";
      newStage = "UNDER_REVIEW";
      confirmationMessage = `This will shortlist the candidate and move them to UNDER_REVIEW stage. Confirm?`;
    }

    return {
      intent: "EXECUTE_RECRUITER_ACTION",
      actionProposal: {
        actionType,
        newStage,
        affectedCount: 1,
        requiresConfirmation: true,
        confirmationMessage,
        stateChanging: true,
      },
    };
  }

  // 2. Check for Needs Attention / Tasks Intent
  if (
    norm.includes("needs attention") ||
    norm.includes("requiring action") ||
    norm.includes("approaching sla") ||
    norm.includes("overdue") ||
    norm.includes("waiting for recruiter") ||
    norm.includes("waiting for action") ||
    norm.includes("not received a response") ||
    norm.includes("shortlisted but not interviewed") ||
    norm.includes("my tasks") ||
    norm.includes("pending action")
  ) {
    return { intent: "GET_RECRUITER_TASKS" };
  }

  // 3. Check for Talent Rediscovery Intent
  if (
    norm.includes("previously interviewed") ||
    norm.includes("previous finalists") ||
    norm.includes("silver medalist") ||
    norm.includes("silver-medalist") ||
    norm.includes("previously rejected who now match") ||
    norm.includes("applied to previous jobs") ||
    norm.includes("past applicants") ||
    norm.includes("contact again")
  ) {
    return {
      intent: "TALENT_REDISCOVERY",
      targetJobQuery: extractRole(cleanPrompt) || undefined,
    };
  }

  // 4. Check for Pipeline Analysis Intent
  if (
    norm.includes("why is this job") ||
    norm.includes("why isn't") ||
    norm.includes("not progressing") ||
    norm.includes("stuck") ||
    norm.includes("pipeline analysis") ||
    norm.includes("weakest pipeline") ||
    norm.includes("conversion rate") ||
    norm.includes("pipeline for")
  ) {
    return {
      intent: "ANALYZE_JOB_PIPELINE",
      targetJobQuery: extractRole(cleanPrompt) || cleanPrompt,
    };
  }

  // 5. Check for Candidate Fit Breakdown Intent
  if (
    norm.includes("candidate fit") ||
    norm.includes("explain match") ||
    norm.includes("why is candidate") ||
    norm.includes("evidence for candidate") ||
    norm.includes("how strong is")
  ) {
    return {
      intent: "EXPLAIN_CANDIDATE_FIT",
      targetCandidateQuery: cleanPrompt,
    };
  }

  // 5a. Check for Interview Intelligence Intents
  if (
    norm.includes("prepare me for interview") ||
    norm.includes("interview prep") ||
    norm.includes("what should i ask") ||
    norm.includes("prepare for my interview")
  ) {
    return {
      intent: "PREPARE_INTERVIEW",
      targetCandidateQuery: cleanPrompt,
    };
  }

  if (
    norm.includes("summarize interview") ||
    norm.includes("interview summary") ||
    norm.includes("how did the interview go")
  ) {
    return {
      intent: "SUMMARIZE_INTERVIEW",
      targetCandidateQuery: cleanPrompt,
    };
  }

  if (
    norm.includes("incomplete scorecards") ||
    norm.includes("awaiting feedback") ||
    norm.includes("overdue scorecards") ||
    norm.includes("missing feedback")
  ) {
    return {
      intent: "GET_INCOMPLETE_SCORECARDS",
    };
  }

  if (
    norm.includes("compare candidates") ||
    norm.includes("compare these candidates") ||
    norm.includes("candidate comparison") ||
    norm.includes("compare applicants")
  ) {
    return {
      intent: "COMPARE_CANDIDATES",
      targetJobQuery: cleanPrompt,
    };
  }

  if (
    norm.includes("evidence conflict") ||
    norm.includes("conflicting evidence") ||
    norm.includes("contradictions")
  ) {
    return {
      intent: "CHECK_EVIDENCE_CONFLICTS",
      targetCandidateQuery: cleanPrompt,
    };
  }

  // 6. Check for Outreach Campaign & Metrics Intent
  if (
    norm.includes("outreach campaign") ||
    norm.includes("campaign performance") ||
    norm.includes("outreach metrics") ||
    norm.includes("how is my backend campaign performing") ||
    norm.includes("which candidates replied positively") ||
    norm.includes("who needs follow-up") ||
    norm.includes("candidates interested in interviewing") ||
    norm.includes("who has not replied")
  ) {
    if (norm.includes("performance") || norm.includes("metrics") || norm.includes("performing")) {
      return { intent: "GET_CAMPAIGN_METRICS", targetJobQuery: cleanPrompt };
    }
    return { intent: "GET_OUTREACH_CAMPAIGNS", targetJobQuery: cleanPrompt };
  }

  // 7. Check for Pause Campaign Intent
  if (norm.includes("pause the campaign") || norm.includes("pause campaign") || norm.includes("pause outreach")) {
    return {
      intent: "EXECUTE_RECRUITER_ACTION",
      actionProposal: {
        actionType: "SHORTLIST", // Safe proposal placeholder
        affectedCount: 1,
        requiresConfirmation: true,
        confirmationMessage: "Are you sure you want to pause this active outreach campaign? Follow-up messages will be held.",
        stateChanging: true,
      },
    };
  }

  // 8. Check for Recruiter Metrics Intent
  if (
    norm.includes("how many candidates are currently in my pipeline") ||
    norm.includes("how many candidates in my pipeline") ||
    norm.includes("pipeline count") ||
    norm.includes("total candidates") ||
    norm.includes("my hiring overview")
  ) {
    return { intent: "GET_RECRUITER_METRICS" };
  }

  // 7. Default to Structured Candidate Search Intent
  const extractedSkills = extractSkillsFromPrompt(cleanPrompt);
  const extractedRole = extractRole(cleanPrompt);
  const extractedSeniority = extractSeniority(cleanPrompt);
  const extractedExp = extractExperienceYears(cleanPrompt);
  const extractedLoc = extractLocation(cleanPrompt);

  let remotePref: "REMOTE_ONLY" | "HYBRID" | "ON_SITE" | "ANY" | undefined;
  if (norm.includes("remote only") || norm.includes("fully remote")) {
    remotePref = "REMOTE_ONLY";
  } else if (norm.includes("hybrid")) {
    remotePref = "HYBRID";
  } else if (norm.includes("remote")) {
    remotePref = "REMOTE_ONLY";
  }

  return {
    intent: "SEARCH_CANDIDATES",
    criteria: {
      role: extractedRole,
      seniority: extractedSeniority,
      minExperienceYears: extractedExp,
      skills: extractedSkills,
      location: extractedLoc,
      remotePreference: remotePref,
      limit: 10,
    },
  };
}
