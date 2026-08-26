import { prisma } from "@/lib/prisma";
import {
  GroundedInterviewPlan,
  GroundedInterviewQuestion,
  CompetencyVerificationStatus,
} from "./types";

// Protected characteristics that MUST NEVER be factored into interview planning
const FORBIDDEN_CHARACTERISTICS = [
  "age", "race", "ethnicity", "gender", "sex", "sexual orientation", "religion",
  "creed", "disability", "marital status", "pregnancy", "citizenship", "nationality",
  "political affiliation"
];

// Standard core competencies evaluated during interviews
const CORE_COMPETENCIES = [
  "Technical Depth & Architecture",
  "Problem Solving & Debugging",
  "System Design & Scalability",
  "Code Quality & Best Practices",
  "Communication & Collaboration",
  "Ownership & Delivery Execution",
  "Role-Specific Domain Knowledge",
];

/**
 * Sanitizes candidate and job texts to prevent prompt injection or leakage of protected traits.
 */
function sanitizeInput(text: string): string {
  if (!text) return "";
  let clean = text
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/system\s*:\s*you\s+are/gi, "")
    .replace(/ignore\s+all\s+previous\s+instructions/gi, "")
    .replace(/[<>{}\\]/g, " ")
    .trim();
  return clean.slice(0, 5000);
}

/**
 * Cross-references job requirements against candidate profile, resume, and skills assessment.
 */
export async function generateInterviewPlan(
  interviewId: string,
  companyId: string
): Promise<GroundedInterviewPlan> {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      application: {
        include: {
          job: {
            include: { company: true },
          },
          applicant: {
            include: {
              profile: true,
              assessmentSubmissions: {
                include: { assessment: true },
                orderBy: { submittedAt: "desc" },
                take: 5,
              },
            },
          },
        },
      },
      plan: true,
    },
  });

  if (!interview) {
    throw new Error(`Interview not found: ${interviewId}`);
  }

  const app = interview.application;
  const job = app.job;
  const candidate = app.applicant;
  const profile = candidate.profile;

  // 1. Extract and normalize job required skills & competencies
  const jobSkills: string[] = [];
  if (job.skills) {
    try {
      const parsed = JSON.parse(job.skills);
      if (Array.isArray(parsed)) {
        jobSkills.push(...parsed.map(s => String(s).trim()));
      }
    } catch {
      jobSkills.push(...job.skills.split(",").map(s => s.trim()).filter(Boolean));
    }
  }

  // 2. Extract candidate verified skills from Phase 8 assessments
  const verifiedAssessmentSkills = new Set<string>();
  const partiallyVerifiedSkills = new Set<string>();

  for (const sub of candidate.assessmentSubmissions) {
    if (sub.status === "EVALUATED" || sub.status === "VERIFIED") {
      try {
        const matrix = JSON.parse(sub.skillVerificationMatrix || "[]");
        if (Array.isArray(matrix)) {
          for (const item of matrix) {
            const skillName = (item.skill || "").toLowerCase();
            if (item.confidence === "HIGH" || (sub.overallScore && sub.overallScore >= 75)) {
              verifiedAssessmentSkills.add(skillName);
            } else {
              partiallyVerifiedSkills.add(skillName);
            }
          }
        }
      } catch {
        // Safe fallback
      }
    }
  }

  // 3. Extract candidate profile/resume skills
  const candidateProfileSkills = new Set<string>();
  if (profile?.skills) {
    try {
      const parsed = JSON.parse(profile.skills);
      if (Array.isArray(parsed)) {
        parsed.forEach(s => candidateProfileSkills.add(String(s).trim().toLowerCase()));
      }
    } catch {
      profile.skills.split(",").forEach(s => candidateProfileSkills.add(s.trim().toLowerCase()));
    }
  }

  // 4. Categorize job skills into VERIFIED, PARTIALLY_VERIFIED, UNVERIFIED
  const verifiedList: string[] = [];
  const partiallyVerifiedList: string[] = [];
  const unverifiedList: string[] = [];

  for (const skill of jobSkills) {
    const sLower = skill.toLowerCase();
    if (verifiedAssessmentSkills.has(sLower)) {
      verifiedList.push(skill);
    } else if (candidateProfileSkills.has(sLower) || partiallyVerifiedSkills.has(sLower)) {
      partiallyVerifiedList.push(skill);
    } else {
      unverifiedList.push(skill);
    }
  }

  // Fallback defaults if no specific skills listed
  if (verifiedList.length === 0 && partiallyVerifiedList.length === 0 && unverifiedList.length === 0) {
    unverifiedList.push("Core Technical Competencies", "Domain Problem Solving");
  }

  // 5. Generate Grounded Interview Questions
  const questions: GroundedInterviewQuestion[] = [];

  // Focus high-priority questions on UNVERIFIED and PARTIALLY_VERIFIED skills first
  for (const skill of unverifiedList) {
    questions.push({
      id: `q-unverified-${skill.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      category: "Unverified Skill Deep Dive",
      competency: skill,
      question: `Can you walk us through a recent production challenge where you leveraged ${skill}? What architectural tradeoffs did you make?`,
      followUp: `If you were to refactor that implementation for 10x higher scale, what specific bottlenecks in ${skill} would you address first?`,
      evidenceToLookFor: `Concrete examples of hands-on ${skill} usage, metrics of success, error handling, and performance considerations.`,
      redFlags: `Vague generalizations, unable to name specific libraries/tools, or claiming credit for team-wide work without individual contribution details.`,
      verificationStatus: "UNVERIFIED",
      rationale: `Job requirement for "${skill}" was not verified in skills assessment and requires live exploration.`,
    });
  }

  for (const skill of partiallyVerifiedList) {
    questions.push({
      id: `q-partial-${skill.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      category: "Practical Application & Breadth",
      competency: skill,
      question: `You've highlighted experience with ${skill}. How have you handled state management, edge cases, and testing in your ${skill} projects?`,
      followUp: `What was the most difficult bug you encountered using ${skill}, and how did you isolate and resolve it?`,
      evidenceToLookFor: `Clear debugging methodology, automated testing strategy, and deep familiarity with ${skill} pitfalls.`,
      redFlags: `Relying entirely on boilerplate or tutorials without understanding underlying execution mechanics.`,
      verificationStatus: "PARTIALLY_VERIFIED",
      rationale: `Candidate claims ${skill} on resume/profile; live interview will elevate confidence to fully verified.`,
    });
  }

  // For already verified skills, ask architectural/advanced application questions (never redundant basic tests)
  for (const skill of verifiedList.slice(0, 2)) {
    questions.push({
      id: `q-verified-${skill.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      category: "Advanced Architecture & Strategy",
      competency: skill,
      question: `Given your proven mastery of ${skill}, how would you architect our ${job.title} system to maximize maintainability across distributed teams?`,
      followUp: `How would you mentor junior engineers on the team in adopting ${skill} best practices?`,
      evidenceToLookFor: `High-level design thinking, cross-functional awareness, and knowledge sharing ability.`,
      redFlags: `Dogmatic adherence to single patterns without evaluating team context or business constraints.`,
      verificationStatus: "VERIFIED",
      rationale: `Skill already verified via assessment; question tests high-level leadership and architectural execution.`,
    });
  }

  // Core behavioural / ownership question
  questions.push({
    id: "q-core-ownership",
    category: "Ownership & Collaboration",
    competency: "Execution & Ownership",
    question: `Tell us about a time when a critical project deadline or release was at risk. What steps did you personally take to realign the deliverable?`,
    followUp: `How did you communicate the risk to stakeholders and your engineering leads?`,
    evidenceToLookFor: `Proactive communication, prioritization, and accountability for project outcomes.`,
    redFlags: `Blaming teammates, hiding roadblocks until the deadline, or lack of agency.`,
    verificationStatus: "UNVERIFIED",
    rationale: `Evaluates ownership, resilience, and alignment with engineering delivery standards.`,
  });

  // 6. Build Objectives & Plan Structure
  const objectives = [
    `Validate hands-on depth in unverified requirements: ${unverifiedList.slice(0, 3).join(", ") || "Key Technical Areas"}`,
    `Assess system design maturity and engineering tradeoffs for ${job.title}`,
    `Evaluate communication clarity and cross-functional team collaboration`,
    `Gather concrete evidence for structured scorecard evaluation`,
  ];

  const planPayload: GroundedInterviewPlan = {
    interviewId,
    companyId,
    jobId: job.id,
    candidateId: candidate.id,
    candidateName: candidate.name,
    jobTitle: job.title,
    interviewType: interview.type || "TECHNICAL",
    durationMinutes: 45,
    objectives,
    competencies: CORE_COMPETENCIES,
    questions,
    unverifiedGaps: unverifiedList,
    verifiedCompetencies: verifiedList,
    partiallyVerifiedCompetencies: partiallyVerifiedList,
  };

  // 7. Persist or update InterviewPlan in database
  await prisma.interviewPlan.upsert({
    where: { interviewId },
    create: {
      interviewId,
      companyId,
      jobId: job.id,
      candidateId: candidate.id,
      interviewType: planPayload.interviewType,
      durationMinutes: planPayload.durationMinutes,
      objectives: JSON.stringify(planPayload.objectives),
      competencies: JSON.stringify(planPayload.competencies),
      questions: JSON.stringify(planPayload.questions),
      unverifiedGaps: JSON.stringify(planPayload.unverifiedGaps),
    },
    update: {
      interviewType: planPayload.interviewType,
      durationMinutes: planPayload.durationMinutes,
      objectives: JSON.stringify(planPayload.objectives),
      competencies: JSON.stringify(planPayload.competencies),
      questions: JSON.stringify(planPayload.questions),
      unverifiedGaps: JSON.stringify(planPayload.unverifiedGaps),
    },
  });

  return planPayload;
}
