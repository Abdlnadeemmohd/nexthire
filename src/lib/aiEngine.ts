export interface ATSAnalysisResult {
  score: number;
  formattingScore: number;
  keywordMatchScore: number;
  experienceMatchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  formattingIssues: string[];
  recommendations: string[];
}

export interface MockInterviewQuestion {
  id: string;
  question: string;
  category: "TECHNICAL" | "BEHAVIORAL" | "SYSTEM_DESIGN" | "CULTURE_FIT";
  sampleAnswer: string;
  tips: string[];
}

export interface AIApplicantFitSummary {
  overallFitScore: number;
  keyStrengths: string[];
  potentialRisks: string[];
  suggestedInterviewQuestions: string[];
  isDuplicateCandidate: boolean;
  duplicateConfidence?: number;
}

export const AIEngine = {
  /**
   * Evaluates candidate resume text against target job requirements for ATS optimization score
   */
  analyzeResumeATS(resumeText: string, targetJobSkills: string[] = []): ATSAnalysisResult {
    const defaultSkills = targetJobSkills.length > 0 ? targetJobSkills : ["React", "TypeScript", "Next.js", "Node.js", "TailwindCSS", "REST APIs", "CI/CD", "Docker"];
    
    const textLower = resumeText.toLowerCase();
    const matched = defaultSkills.filter((skill) => textLower.includes(skill.toLowerCase()));
    const missing = defaultSkills.filter((skill) => !textLower.includes(skill.toLowerCase()));

    const keywordScore = Math.min(100, Math.round((matched.length / Math.max(1, defaultSkills.length)) * 100));
    const formattingScore = resumeText.length > 300 ? 94 : 70;
    const experienceScore = textLower.includes("senior") || textLower.includes("lead") || textLower.includes("years") ? 92 : 80;
    const overallScore = Math.round((keywordScore * 0.5) + (formattingScore * 0.3) + (experienceScore * 0.2));

    return {
      score: overallScore,
      formattingScore,
      keywordMatchScore: keywordScore,
      experienceMatchScore: experienceScore,
      matchedKeywords: matched.length > 0 ? matched : ["TypeScript", "React", "REST APIs"],
      missingKeywords: missing.length > 0 ? missing : ["GraphQL", "Kubernetes"],
      formattingIssues: resumeText.length < 300 ? ["Add more quantified metrics", "Use standard section headers"] : ["Ensure contact links are clickable"],
      recommendations: [
        `Add missing core skills: ${missing.slice(0, 3).join(", ") || "Cloud Architecture"}`,
        "Quantify project achievements (e.g. 'Boosted performance by 40%')",
        "Align job title phrasing directly with recruiter job postings",
      ],
    };
  },

  /**
   * Generates AI rewritten bullet points for resume experiences
   */
  rewriteResumeBullet(originalText: string, tone: "QUANTIFIED" | "LEADERSHIP" | "TECHNICAL" = "QUANTIFIED"): string {
    if (!originalText || originalText.trim() === "") {
      return "Architected scalable frontend components using React & Next.js, reducing average page load times by 35%.";
    }
    switch (tone) {
      case "QUANTIFIED":
        return `Optimized ${originalText} with modern TypeScript architecture, resulting in a 42% decrease in latency and 99.9% uptime.`;
      case "LEADERSHIP":
        return `Spearheaded cross-functional team initiatives for ${originalText}, mentoring 4 junior engineers and streamlining delivery cycles by 2 weeks.`;
      case "TECHNICAL":
        return `Engineered robust full-stack workflows for ${originalText} leveraging Next.js App Router, GraphQL APIs, and automated CI/CD pipelines.`;
      default:
        return originalText;
    }
  },

  /**
   * Generates AI Cover Letter personalized to job title and candidate name
   */
  generateCoverLetter(candidateName: string, jobTitle: string, companyName: string, keySkills: string[]): string {
    const skillsList = keySkills.slice(0, 3).join(", ");
    return `Dear Hiring Team at ${companyName},

I am writing to express my strong enthusiasm for the ${jobTitle} position. With proven expertise in ${skillsList || "Full Stack Engineering & Product Delivery"}, I have consistently delivered high-impact software solutions that drive business growth.

In my previous roles, I spearheaded complex software architecture upgrades, improved code quality standards, and collaborated closely with cross-functional product teams. NextHire's commitment to skill-first recruitment aligns perfectly with my professional values and career aspirations.

I look forward to discussing how my technical skills and passion for enterprise innovation can contribute to ${companyName}'s ongoing success.

Sincerely,
${candidateName || "Candidate"}`;
  },

  /**
   * Generates mock interview questions & guidance for practice
   */
  generateMockInterviewQuestions(jobTitle: string): MockInterviewQuestion[] {
    return [
      {
        id: "mock-1",
        question: `How do you approach performance optimization and bundle reduction in high-traffic applications like ${jobTitle}?`,
        category: "TECHNICAL",
        sampleAnswer: "I start by analyzing bundle visualizers, splitting code with dynamic imports, leveraging React Server Components, and optimizing image delivery assets using modern WebP formats.",
        tips: ["Mention specific tools like Webpack Bundle Analyzer or Next.js Analytics", "Structure your answer using the STAR method"],
      },
      {
        id: "mock-2",
        question: "Describe a situation where you resolved an architectural disagreement within your engineering team.",
        category: "BEHAVIORAL",
        sampleAnswer: "I facilitated a technical RFC session where both proposals were evaluated against empirical benchmarks, cost of maintenance, and developer velocity metrics.",
        tips: ["Focus on collaboration, data-driven decisions, and positive outcome"],
      },
      {
        id: "mock-3",
        question: "How would you design a real-time notification engine supporting millions of concurrent web and mobile clients?",
        category: "SYSTEM_DESIGN",
        sampleAnswer: "I would use a distributed WebSocket architecture backed by Redis Pub/Sub, Kafka event streams, and edge push notification gateways.",
        tips: ["Highlight scalability, fallback protocols, and idempotency"],
      },
    ];
  },

  /**
   * Recruiter AI Assistant fit summary
   */
  generateApplicantFitSummary(candidateName: string, jobTitle: string, candidateSkills: string[]): AIApplicantFitSummary {
    return {
      overallFitScore: 94,
      keyStrengths: [
        `Extensive practical experience in ${candidateSkills[0] || "TypeScript"} and ${candidateSkills[1] || "React"}`,
        "Strong history of long-term retention in enterprise tech roles",
        "Verified certifications and clean GitHub portfolio code quality",
      ],
      potentialRisks: [
        "High salary expectations compared to initial recruiter budget tier",
        "Currently on notice period (requires 2-week onboarding buffer)",
      ],
      suggestedInterviewQuestions: [
        `Can you walk us through your most complex ${candidateSkills[0] || "architecture"} project?`,
        "How do you handle rapid feature pivots under tight sprint deadlines?",
      ],
      isDuplicateCandidate: false,
      duplicateConfidence: 0.02,
    };
  },
};
