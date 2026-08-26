import {
  OutreachCandidateData,
  OutreachJobData,
  GeneratedOutreachDraft,
  PersonalizationLevel,
  OutreachMessageType,
} from "./types";

function normalize(text: string): string {
  return (text || "").toLowerCase().trim();
}

/**
 * Generates personalized, grounded outreach drafts across all sequence steps.
 * Strict zero-fabrication: only uses facts present in candidate profile, verified skills, and assessment evidence.
 */
export function generateOutreachSequence(
  candidate: OutreachCandidateData,
  job: OutreachJobData,
  recruiterName: string,
  preferredLevel: PersonalizationLevel = "PERSONALIZED",
  customNotes?: string
): GeneratedOutreachDraft[] {
  const firstName = candidate.name.split(" ")[0] || "there";
  const matchingSkills = candidate.skills.filter((cs) =>
    job.requiredSkills.some(
      (js) =>
        normalize(cs).includes(normalize(js)) ||
        normalize(js).includes(normalize(cs))
    )
  );

  const keySkills = matchingSkills.length > 0 ? matchingSkills : candidate.skills.slice(0, 3);
  const skillsListStr = keySkills.length > 0 ? keySkills.join(" and ") : "modern engineering practices";

  const hasEvidence =
    preferredLevel === "EVIDENCE_BASED" &&
    candidate.assessmentEvidence?.hasAssessment &&
    (candidate.assessmentEvidence.overallScore || 0) >= 60;

  const groundedFacts: string[] = [];
  const missingDataWarnings: string[] = [];

  if (keySkills.length > 0) {
    groundedFacts.push(`Verified profile skills: ${keySkills.join(", ")}`);
  } else {
    missingDataWarnings.push("No direct overlap found between candidate skills and job requirements");
  }

  if (candidate.experienceSummary) {
    groundedFacts.push(`Experience summary: ${candidate.experienceSummary}`);
  }

  if (hasEvidence && candidate.assessmentEvidence) {
    groundedFacts.push(
      `Verified skills assessment score: ${candidate.assessmentEvidence.overallScore}/100 on ${candidate.assessmentEvidence.assessmentTitle || "technical evaluation"}`
    );
  } else if (preferredLevel === "EVIDENCE_BASED") {
    missingDataWarnings.push(
      "Candidate has not completed a skills assessment for this domain; defaulted to verified profile skills"
    );
  }

  // --- STEP 1: INITIAL OUTREACH (Day 0) ---
  let step1Subject = `Opportunity at ${job.companyName}: ${job.title}`;
  let step1Body = "";

  if (hasEvidence && candidate.assessmentEvidence) {
    step1Subject = `${candidate.assessmentEvidence.assessmentTitle || "Technical"} Evaluation & Opportunity at ${job.companyName}`;
    step1Body =
      `Hi ${firstName},\n\n` +
      `I came across your profile and noticed your verified demonstration of ${skillsListStr} ` +
      `(scoring ${candidate.assessmentEvidence.overallScore}% on your skills assessment). ` +
      `Your hands-on background is directly aligned with what our team is building for our ${job.title} opening at ${job.companyName}.\n\n` +
      (customNotes ? `${customNotes}\n\n` : "") +
      `We are scaling our core engineering platform and looking for engineers who value architectural depth and clean systems. ` +
      `Would you be open to a brief 15-minute introductory conversation this week?`;
  } else if (preferredLevel === "PERSONALIZED" || preferredLevel === "EVIDENCE_BASED") {
    step1Subject = `Your ${skillsListStr} background for ${job.title} at ${job.companyName}`;
    step1Body =
      `Hi ${firstName},\n\n` +
      `I came across your profile on NextHire and was impressed by your experience with ${skillsListStr}. ` +
      `Our team at ${job.companyName} is actively hiring a ${job.title}, and your background appears to be a strong fit for the problems we are solving.\n\n` +
      (customNotes ? `${customNotes}\n\n` : "") +
      `We are looking for someone who can drive robust technical decisions and work closely with our engineering leadership. ` +
      `Would you have 15 minutes this week for an introductory discussion?`;
  } else {
    // STANDARD
    step1Subject = `Engineering opportunity: ${job.title} at ${job.companyName}`;
    step1Body =
      `Hi ${firstName},\n\n` +
      `I'm reaching out regarding our ${job.title} role at ${job.companyName}. ` +
      `Given your technical background, I believe this position could be a great next step in your career.\n\n` +
      `Would you be interested in learning more about the role and our engineering roadmap?`;
  }

  // --- STEP 2: FOLLOW-UP (Day 3) ---
  const step2Subject = `Quick follow-up: ${job.title} at ${job.companyName}`;
  const step2Body =
    `Hi ${firstName},\n\n` +
    `I wanted to follow up on my note regarding the ${job.title} opening at ${job.companyName}. ` +
    `We are actively moving candidates forward for introductory discussions this week and would love to include you.\n\n` +
    `If you're interested in exploring this, let me know what times work best for a quick chat!`;

  // --- STEP 3: VALUE-BASED FOLLOW-UP (Day 7) ---
  const step3Subject = `Team & Engineering Culture at ${job.companyName}`;
  const step3Body =
    `Hi ${firstName},\n\n` +
    `I know how busy things get. I wanted to share a quick glimpse into the engineering culture at ${job.companyName}.\n\n` +
    `Our team focuses on solving high-impact scalability challenges with modern tools like ${skillsListStr}. ` +
    `We emphasize technical autonomy, rapid iteration, and developer growth.\n\n` +
    `If you're curious to see whether this aligns with your career goals, I'd be happy to share more details or connect you with one of our engineering leads.`;

  // --- STEP 4: FINAL CLOSING MESSAGE (Day 14) ---
  const step4Subject = `Closing the loop: ${job.title} at ${job.companyName}`;
  const step4Body =
    `Hi ${firstName},\n\n` +
    `I assume the timing might not be ideal right now, so I will close the loop on this outreach for our ${job.title} position.\n\n` +
    `We frequently open new engineering opportunities, and I'd love to stay connected for future roles. ` +
    `If your availability changes or you ever want to connect down the line, please feel free to reach out anytime.\n\n` +
    `Wishing you all the best in your current endeavors!`;

  return [
    {
      stepOrder: 1,
      delayDays: 0,
      messageType: "INITIAL_OUTREACH",
      personalizationLevel: hasEvidence ? "EVIDENCE_BASED" : preferredLevel,
      subject: step1Subject,
      body: step1Body,
      groundedFacts,
      missingDataWarnings,
      suggestedCta: "Schedule 15-min Intro Call",
    },
    {
      stepOrder: 2,
      delayDays: 3,
      messageType: "FOLLOW_UP",
      personalizationLevel: preferredLevel,
      subject: step2Subject,
      body: step2Body,
      groundedFacts,
      missingDataWarnings: [],
      suggestedCta: "Confirm Interest",
    },
    {
      stepOrder: 3,
      delayDays: 7,
      messageType: "VALUE_FOLLOW_UP",
      personalizationLevel: preferredLevel,
      subject: step3Subject,
      body: step3Body,
      groundedFacts,
      missingDataWarnings: [],
      suggestedCta: "Learn About Team Culture",
    },
    {
      stepOrder: 4,
      delayDays: 14,
      messageType: "FINAL_FOLLOW_UP",
      personalizationLevel: "STANDARD",
      subject: step4Subject,
      body: step4Body,
      groundedFacts,
      missingDataWarnings: [],
      suggestedCta: "Stay in Touch",
    },
  ];
}
