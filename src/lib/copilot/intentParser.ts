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
    .replace(/[?!;:\-_./,\t]/g, " ")
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

  // --- PHASE 14: EXECUTIVE HIRING INTELLIGENCE INTENTS ---
  if (
    norm.includes("executive overview") ||
    norm.includes("current hiring situation") ||
    norm.includes("overall hiring health") ||
    norm.includes("executive summary") ||
    norm.includes("overview for leadership")
  ) {
    return { intent: "GET_EXECUTIVE_OVERVIEW" };
  }

  if (
    norm.includes("hiring plan") ||
    norm.includes("hit our hiring target") ||
    norm.includes("hiring targets") ||
    norm.includes("hiring plan status")
  ) {
    return { intent: "GET_HIRING_PLAN_STATUS" };
  }

  if (
    norm.includes("hiring forecast") ||
    norm.includes("projected completion") ||
    norm.includes("forecast for open roles")
  ) {
    return { intent: "GET_HIRING_FORECAST" };
  }

  if (
    norm.includes("executive risk") ||
    norm.includes("organizational risk") ||
    norm.includes("risk radar") ||
    norm.includes("risks should leadership know about")
  ) {
    return { intent: "GET_EXECUTIVE_HIRING_RISKS" };
  }

  if (
    norm.includes("time to hire") ||
    norm.includes("losing time in the hiring process") ||
    norm.includes("time to fill")
  ) {
    return { intent: "GET_EXECUTIVE_TIME_TO_HIRE" };
  }

  if (
    norm.includes("hiring efficiency") ||
    norm.includes("funnel is least efficient") ||
    norm.includes("pipeline efficiency")
  ) {
    return { intent: "GET_HIRING_EFFICIENCY" };
  }

  if (
    norm.includes("sourcing channel") ||
    norm.includes("source roi") ||
    norm.includes("channel roi")
  ) {
    return { intent: "GET_SOURCE_ROI" };
  }

  if (
    norm.includes("slowing hiring") ||
    norm.includes("organizational bottleneck") ||
    norm.includes("company bottleneck")
  ) {
    return { intent: "GET_ORGANIZATIONAL_BOTTLENECKS" };
  }

  if (
    norm.includes("leadership focus") ||
    norm.includes("executive recommendation")
  ) {
    return { intent: "GET_EXECUTIVE_RECOMMENDATIONS" };
  }

  if (
    norm.includes("cost intelligence") ||
    norm.includes("cost per hire") ||
    norm.includes("recruiting spend")
  ) {
    return { intent: "GET_COST_INTELLIGENCE" };
  }

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

  // 7b. Check for Phase 12 Market & Talent Supply Intelligence Intents
  const marketRole = extractRole(cleanPrompt);

  if (
    norm.includes("supply problem or funnel problem") ||
    norm.includes("supply vs funnel") ||
    norm.includes("supply or funnel") ||
    norm.includes("source more candidates or fix the funnel") ||
    norm.includes("talent supply problem or a funnel problem") ||
    norm.includes("supply or conversion bottleneck")
  ) {
    return { intent: "GET_SUPPLY_VS_FUNNEL", targetJobQuery: marketRole };
  }

  if (
    norm.includes("which requirements are restricting") ||
    norm.includes("limiting my candidate pool") ||
    norm.includes("restricting the talent pool") ||
    norm.includes("requirement strictness") ||
    norm.includes("should i loosen the experience") ||
    norm.includes("relax requirements") ||
    norm.includes("relax skill requirement")
  ) {
    return { intent: "GET_REQUIREMENT_STRICTNESS", targetJobQuery: marketRole };
  }

  if (
    norm.includes("sourcing strategy") ||
    norm.includes("what sourcing strategy") ||
    norm.includes("how should i source") ||
    norm.includes("sourcing recommendations")
  ) {
    return { intent: "GET_SOURCING_STRATEGY", targetJobQuery: marketRole };
  }

  if (
    norm.includes("which skills are scarce") ||
    norm.includes("skill scarcity") ||
    norm.includes("how scarce is") ||
    norm.includes("abundant vs scarce") ||
    norm.includes("how much postgresql talent") ||
    norm.includes("how much react talent") ||
    norm.includes("how much python talent")
  ) {
    return { intent: "GET_SKILL_SCARCITY", targetJobQuery: marketRole };
  }

  if (
    norm.includes("which locations have the most") ||
    norm.includes("where is talent concentrated") ||
    norm.includes("location supply") ||
    norm.includes("geographic concentration") ||
    norm.includes("should i expand my location") ||
    norm.includes("where is relevant talent geographically")
  ) {
    return { intent: "GET_LOCATION_SUPPLY", targetJobQuery: marketRole };
  }

  if (
    norm.includes("how much remote") ||
    norm.includes("remote capable talent") ||
    norm.includes("remote supply") ||
    norm.includes("remote talent exists")
  ) {
    return { intent: "GET_REMOTE_SUPPLY", targetJobQuery: marketRole };
  }

  if (
    norm.includes("seniority distribution") ||
    norm.includes("experience distribution") ||
    norm.includes("how hard is it to hire senior") ||
    norm.includes("seniority breakdown")
  ) {
    return { intent: "GET_SENIORITY_SUPPLY", targetJobQuery: marketRole };
  }

  if (
    norm.includes("has talent supply changed") ||
    norm.includes("market trends") ||
    norm.includes("talent supply trends") ||
    norm.includes("talent growth over time") ||
    norm.includes("last 90 days") ||
    norm.includes("last 30 days")
  ) {
    return { intent: "GET_MARKET_TRENDS", targetJobQuery: marketRole };
  }

  if (
    norm.includes("how much relevant talent exists") ||
    norm.includes("how much qualified talent exists") ||
    norm.includes("how many matching candidates on platform") ||
    norm.includes("talent supply") ||
    norm.includes("talent pool size")
  ) {
    return { intent: "GET_TALENT_SUPPLY", targetJobQuery: marketRole };
  }

  // 7c. Check for Phase 11 Hiring Funnel & Strategy Intents
  if (
    norm.includes("what should i focus on today") ||
    norm.includes("what should i do today") ||
    norm.includes("what should i do next") ||
    norm.includes("recommended actions") ||
    norm.includes("priority actions") ||
    norm.includes("action plan")
  ) {
    return { intent: "GET_RECOMMENDED_ACTIONS", targetJobQuery: cleanPrompt };
  }

  if (
    norm.includes("which jobs are at risk") ||
    norm.includes("jobs at risk") ||
    norm.includes("hiring target risk") ||
    norm.includes("missing their hiring target") ||
    norm.includes("hiring risks")
  ) {
    return { intent: "GET_HIRING_RISKS", targetJobQuery: cleanPrompt };
  }

  if (
    norm.includes("compare hiring funnel") ||
    norm.includes("compare funnel") ||
    norm.includes("compare with historical") ||
    norm.includes("historical benchmark")
  ) {
    return { intent: "COMPARE_HIRING_FUNNEL", targetJobQuery: cleanPrompt };
  }

  // Team-scoped funnel: must be checked BEFORE generic "hiring funnel" pattern
  if (
    (norm.includes("hiring funnel") && norm.includes("team")) ||
    (norm.includes("hiring funnel") && norm.includes("conversion"))
  ) {
    return { intent: "GET_TEAM_FUNNEL", targetJobQuery: cleanPrompt };
  }

  if (
    norm.includes("where are we losing candidates") ||
    norm.includes("funnel breakdown") ||
    norm.includes("hiring funnel") ||
    norm.includes("unhealthy funnel") ||
    norm.includes("which funnel is unhealthy")
  ) {
    return { intent: "GET_HIRING_FUNNEL", targetJobQuery: cleanPrompt };
  }

  if (
    norm.includes("find bottlenecks") ||
    norm.includes("bottleneck detection") ||
    norm.includes("pipeline bottlenecks") ||
    norm.includes("where is the funnel breaking")
  ) {
    return { intent: "GET_BOTTLENECKS", targetJobQuery: cleanPrompt };
  }

  if (
    norm.includes("stalled candidates") ||
    norm.includes("candidates stuck") ||
    norm.includes("stuck in pipeline") ||
    norm.includes("which candidates require attention") ||
    norm.includes("candidates needing attention")
  ) {
    return { intent: "GET_STALLED_CANDIDATES", targetJobQuery: cleanPrompt };
  }

  // ---------------------------------------------------------------------------
  // PHASE 13: RECRUITER GROWTH, TEAM COLLABORATION & HIRING OPERATIONS
  // ---------------------------------------------------------------------------
  if (
    norm.includes("who is overloaded") ||
    norm.includes("team workload") ||
    norm.includes("recruiter capacity") ||
    norm.includes("workload distribution")
  ) {
    return { intent: "GET_TEAM_WORKLOAD" };
  }

  if (
    norm.includes("which candidates are unassigned") ||
    norm.includes("unassigned candidates") ||
    norm.includes("unassigned candidate") ||
    norm.includes("unassigned work") ||
    norm.includes("unassigned jobs") ||
    norm.includes("candidates without owner") ||
    norm.includes("who owns this candidate")
  ) {
    return { intent: "GET_UNASSIGNED_WORK", targetCandidateQuery: cleanPrompt };
  }

  if (
    norm.includes("who has capacity") ||
    norm.includes("who has bandwidth") ||
    norm.includes("recruiter capacity") ||
    norm.includes("available recruiters")
  ) {
    return { intent: "GET_RECRUITER_CAPACITY" };
  }

  if (
    norm.includes("candidate handoffs") ||
    norm.includes("handoffs") ||
    norm.includes("pending handoffs") ||
    norm.includes("which handoffs are overdue") ||
    norm.includes("stuck handoffs")
  ) {
    return { intent: "GET_HANDOFFS" };
  }

  if (
    norm.includes("duplicate work") ||
    norm.includes("duplicating work") ||
    norm.includes("duplicate outreach") ||
    norm.includes("overlapping candidates") ||
    norm.includes("concurrent outreach")
  ) {
    return { intent: "GET_DUPLICATE_WORK", targetCandidateQuery: cleanPrompt };
  }

  if (
    norm.includes("team funnel") ||
    norm.includes("team conversion") ||
    norm.includes("team performance") ||
    norm.includes("hiring funnel conversion") ||
    norm.includes("team hiring funnel") ||
    norm.includes("how is our recruiting team converting") ||
    norm.includes("team throughput") ||
    norm.includes("team metrics")
  ) {
    return { intent: "GET_TEAM_FUNNEL", targetJobQuery: cleanPrompt };
  }

  if (
    norm.includes("team activity") ||
    norm.includes("what is the team doing") ||
    norm.includes("recent team activity") ||
    norm.includes("team log")
  ) {
    return { intent: "GET_TEAM_ACTIVITY" };
  }

  if (
    norm.includes("who should take this candidate") ||
    norm.includes("who should own this candidate") ||
    norm.includes("who should handle the next task") ||
    norm.includes("who should i assign") ||
    norm.includes("who should assign") ||
    norm.includes("recommend recruiter for") ||
    norm.includes("suggest owner for") ||
    norm.includes("assignment recommendation") ||
    norm.includes("assign candidate to") ||
    norm.includes("best recruiter for")
  ) {
    return { intent: "GET_ASSIGNMENT_RECOMMENDATION", targetCandidateQuery: cleanPrompt };
  }

  if (
    norm.includes("team bottlenecks") ||
    norm.includes("hiring bottlenecks") ||
    norm.includes("bottlenecks on the team") ||
    norm.includes("where is collaboration slowing") ||
    norm.includes("where are recruiter handoffs breaking") ||
    norm.includes("team pipeline issues") ||
    norm.includes("where is the team struggling")
  ) {
    return { intent: "GET_TEAM_BOTTLENECKS" };
  }

  if (
    norm.includes("what should the team focus on") ||
    norm.includes("team priorities") ||
    norm.includes("collaboration priorities") ||
    norm.includes("collaboration actions") ||
    norm.includes("show me today's team priorities") ||
    norm.includes("team focus") ||
    norm.includes("what is our team goal today")
  ) {
    return { intent: "GET_COLLABORATION_ACTIONS" };
  }

  if (
    norm.includes("recruiter workload") ||
    norm.includes("my workload") ||
    norm.includes("which recruiters are overloaded") ||
    norm.includes("am i overloaded")
  ) {
    return { intent: "GET_RECRUITER_WORKLOAD" };
  }

  if (
    norm.includes("job health") ||
    norm.includes("health of my jobs") ||
    norm.includes("how healthy are my jobs")
  ) {
    return { intent: "GET_JOB_HEALTH", targetJobQuery: cleanPrompt };
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

export const parseIntent = parseRecruiterIntent;
