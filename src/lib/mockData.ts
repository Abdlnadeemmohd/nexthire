export interface Job {
  id: string;
  title: string;
  companyName: string;
  companyLogo: string;
  location: string;
  country: string;
  salaryMin: number;
  salaryMax: number;
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "REMOTE" | "HYBRID";
  experienceLevel: string;
  category: string;
  isRemote: boolean;
  matchScore: number;
  tags: string[];
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  postedAt: string;
  companyDescription: string;
  companyWebsite: string;
  companySize: string;
}

export interface CandidateApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyLogo: string;
  candidateName: string;
  candidateAvatar: string;
  candidateTitle: string;
  matchScore: number;
  status: "APPLIED" | "UNDER_REVIEW" | "SHORTLISTED" | "INTERVIEW" | "OFFER" | "HIRED" | "REJECTED";
  appliedAt: string;
  updatedAt: string;
  resumeUrl: string;
  location: string;
  skills: string[];
  notes?: string;
  interviewDate?: string;
}

export interface MessageItem {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  receiverId: string;
  content: string;
  attachment?: {
    name: string;
    size: string;
    type: string;
    url: string;
  };
  timestamp: string;
  read: boolean;
  isRecruiter: boolean;
}

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "JOB_SEEKER" | "RECRUITER" | "COMPANY_ADMIN" | "PLATFORM_ADMIN";
  avatar: string;
  country: string;
  status: "VERIFIED" | "PENDING" | "BLOCKED" | "SUSPENDED";
  subscription: "FREE" | "STARTER" | "GROWTH" | "ENTERPRISE";
  createdAt: string;
}

export interface CompanyModerationItem {
  id: string;
  companyName: string;
  logo: string;
  website: string;
  email: string;
  taxId: string;
  licenseNumber: string;
  recruiterName: string;
  recruiterEmail: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  appliedAt: string;
  notes?: string;
}

export interface SubscriptionPlanItem {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year";
  features: string[];
  subscribersCount: number;
  status: "ACTIVE" | "INACTIVE";
  mrr: number;
}

export interface TransactionItem {
  id: string;
  customerName: string;
  companyName: string;
  planName: string;
  amount: number;
  status: "PAID" | "PENDING" | "REFUNDED";
  date: string;
}

export const INITIAL_JOBS: Job[] = [
  {
    id: "job-1",
    title: "Senior Product Designer",
    companyName: "Stellar Systems",
    companyLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDUSY4HuOhQnp99RQGM7nj2qJaAWM49iI9uWz43APGGY9elmswm8Xhx8Hx3opdXODLdtZq0n-bxGcH7MRRbeOar3uNrgkHm1g4eL86ilUFWlHgKQHoc0-DqJsvor7xRNbZXRHP0WvFXR_dNDhMolXMQPnmQg4Jl_XDs_ssI9JsQ_WcIV4LJRpTCzOkZnd3pXcC9vurP6zcFOrmGm5bUwPACA1hF1P7gnmLUPkIZbbhMPh5kRmRcRFnUqsykv9lu5Rpjm64oHzTH_oyL",
    location: "San Francisco, CA",
    country: "United States",
    salaryMin: 180000,
    salaryMax: 240000,
    employmentType: "FULL_TIME",
    experienceLevel: "Senior",
    category: "Design",
    isRemote: true,
    matchScore: 98,
    tags: ["Figma", "Prototyping", "AI/ML UX", "Design Systems"],
    description: "We are looking for a visionary Senior Product Designer to lead our AI interfaces team. You will be responsible for defining the user experience for our next-generation enterprise AI tools.",
    responsibilities: [
      "Architect complex design systems and fluid, responsive interfaces.",
      "Collaborate closely with AI engineers and product managers to clarify generative workflow UI.",
      "Conduct user research with enterprise clients to distill intuitive UX paradigms.",
      "Mentor mid-level product designers and drive design quality standard across teams."
    ],
    requirements: [
      "5+ years of experience designing complex B2B SaaS products.",
      "Expert knowledge of Figma, design token architecture, and micro-interactions.",
      "Proven track record of designing AI-driven features or data-dense dashboards.",
      "Strong portfolio demonstrating end-to-end design process."
    ],
    benefits: [
      "Competitive Equity Package",
      "Full Medical, Dental, & Vision Coverage",
      "$3,000 Annual Learning stipend",
      "Flexible Remote Work Environment"
    ],
    postedAt: "2 hours ago",
    companyDescription: "Stellar Systems is pioneering next-generation enterprise AI tools that empower multi-functional teams to streamline workflows and decision intelligence.",
    companyWebsite: "https://stellarsystems.ai",
    companySize: "250-500 employees"
  },
  {
    id: "job-2",
    title: "Lead AI Systems Architect",
    companyName: "NeuralScale",
    companyLogo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60",
    location: "New York, NY",
    country: "United States",
    salaryMin: 220000,
    salaryMax: 310000,
    employmentType: "FULL_TIME",
    experienceLevel: "Lead / Executive",
    category: "Engineering",
    isRemote: true,
    matchScore: 94,
    tags: ["PyTorch", "LLM Fine-Tuning", "Distributed Systems", "Kubernetes"],
    description: "Drive the core architecture of NeuralScale's high-throughput LLM training and inference platform.",
    responsibilities: [
      "Design zero-latency inference infrastructure for multi-billion parameter models.",
      "Optimize distributed training pipelines across hybrid GPU clusters.",
      "Lead cross-functional engineering teams in implementing high-availability AI services."
    ],
    requirements: [
      "7+ years in distributed systems engineering and ML infrastructure.",
      "Deep experience with PyTorch, CUDA acceleration, and Kubernetes orchestration.",
      "M.S. or Ph.D. in Computer Science, Machine Learning, or related quantitative field."
    ],
    benefits: [
      "Top-tier compensation and equity",
      "Unlimited PTO",
      "Home office setup stipend ($2,500)",
      "Comprehensive wellness perks"
    ],
    postedAt: "1 day ago",
    companyDescription: "NeuralScale builds foundational enterprise infrastructure for real-time generative AI inference and agentic automation.",
    companyWebsite: "https://neuralscale.io",
    companySize: "100-250 employees"
  },
  {
    id: "job-3",
    title: "Principal Frontend Engineer",
    companyName: "Horizon Tech",
    companyLogo: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&auto=format&fit=crop&q=60",
    location: "London, UK",
    country: "United Kingdom",
    salaryMin: 150000,
    salaryMax: 195000,
    employmentType: "HYBRID",
    experienceLevel: "Senior",
    category: "Engineering",
    isRemote: false,
    matchScore: 91,
    tags: ["Next.js", "TypeScript", "TailwindCSS", "Performance"],
    description: "Lead front-end architecture for global financial analytics web applications, prioritizing sub-millisecond render performance and glassmorphic UI polish.",
    responsibilities: [
      "Set web standards across Next.js App Router applications.",
      "Implement real-time WebSocket state management for stock metrics.",
      "Champion WCAG 2.1 AA accessibility compliance and fluid animations."
    ],
    requirements: [
      "6+ years of production TypeScript/React development.",
      "Mastery of web performance metrics (LCP, FID, CLS).",
      "Demonstrated experience building custom UI component systems."
    ],
    benefits: [
      "Generous pension match up to 10%",
      "Private healthcare",
      "Flexible hybrid model (2 days office)"
    ],
    postedAt: "3 days ago",
    companyDescription: "Horizon Tech is the leading financial data visualizer for European investment funds and institutional traders.",
    companyWebsite: "https://horizontech.co.uk",
    companySize: "500+ employees"
  },
  {
    id: "job-4",
    title: "Staff Product Manager - Growth",
    companyName: "Nexus Commerce",
    companyLogo: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=100&auto=format&fit=crop&q=60",
    location: "Austin, TX",
    country: "United States",
    salaryMin: 170000,
    salaryMax: 215000,
    employmentType: "FULL_TIME",
    experienceLevel: "Mid-Senior",
    category: "Product",
    isRemote: true,
    matchScore: 88,
    tags: ["Product Strategy", "A/B Testing", "Funnel Optimization", "SQL"],
    description: "Scale self-serve acquisition funnels for Nexus Commerce's high-growth merchant suite.",
    responsibilities: [
      "Own expansion revenue and user activation metrics.",
      "Partner with growth engineering to run continuous experimentation velocity."
    ],
    requirements: [
      "5+ years product management experience at PLG SaaS companies.",
      "Strong analytical proficiency in SQL, Amplitude, and Mixpanel."
    ],
    benefits: [
      "401k match 5%",
      "Wellness reimbursement",
      "Annual company offsites"
    ],
    postedAt: "Just now",
    companyDescription: "Nexus Commerce enables digital-first brands to sell globally with zero frictionless infrastructure.",
    companyWebsite: "https://nexuscommerce.com",
    companySize: "50-100 employees"
  }
];

export const INITIAL_APPLICATIONS: CandidateApplication[] = [
  {
    id: "app-1",
    jobId: "job-1",
    jobTitle: "Senior Product Designer",
    companyName: "Stellar Systems",
    companyLogo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDUSY4HuOhQnp99RQGM7nj2qJaAWM49iI9uWz43APGGY9elmswm8Xhx8Hx3opdXODLdtZq0n-bxGcH7MRRbeOar3uNrgkHm1g4eL86ilUFWlHgKQHoc0-DqJsvor7xRNbZXRHP0WvFXR_dNDhMolXMQPnmQg4Jl_XDs_ssI9JsQ_WcIV4LJRpTCzOkZnd3pXcC9vurP6zcFOrmGm5bUwPACA1hF1P7gnmLUPkIZbbhMPh5kRmRcRFnUqsykv9lu5Rpjm64oHzTH_oyL",
    candidateName: "Alex Rivers",
    candidateAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCohtV2Z0aDLDnAjCiN9bVGyy23UBK2eUaFPXAmILSLmTWMtP5mNAQBOGNOKEumuaKYIrTbgg8HxYkR0BkzjQKbnZY6AomJue9dlrGeS7LUmBLE19pwl7THpOA-Q9SNXeNmKxubmdGOHk_odhKF4Bc4kTPkMK7ZBHYi-0CUCyvPmvlq7U6ACptlDENQxAUgJI34gc6pdN1Dvu6jkM7Iuzox9T9iAtNf-1nCFP2PYJ0woS8ZXB1QnfmjuwJbhNJc53KKfsCErff_c5F8",
    candidateTitle: "Senior UX Specialist & Systems Architect",
    matchScore: 98,
    status: "INTERVIEW",
    appliedAt: "2026-07-20",
    updatedAt: "2026-07-24",
    resumeUrl: "/resumes/Alex_Rivers_Resume_2026.pdf",
    location: "San Francisco, CA",
    skills: ["Figma", "Design Systems", "User Research", "Next.js", "AI UX"],
    notes: "Outstanding portfolio review. Technical team interview scheduled for tomorrow at 2:00 PM PST.",
    interviewDate: "2026-07-26T14:00:00Z"
  },
  {
    id: "app-2",
    jobId: "job-2",
    jobTitle: "Lead AI Systems Architect",
    companyName: "NeuralScale",
    companyLogo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60",
    candidateName: "Alex Rivers",
    candidateAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCohtV2Z0aDLDnAjCiN9bVGyy23UBK2eUaFPXAmILSLmTWMtP5mNAQBOGNOKEumuaKYIrTbgg8HxYkR0BkzjQKbnZY6AomJue9dlrGeS7LUmBLE19pwl7THpOA-Q9SNXeNmKxubmdGOHk_odhKF4Bc4kTPkMK7ZBHYi-0CUCyvPmvlq7U6ACptlDENQxAUgJI34gc6pdN1Dvu6jkM7Iuzox9T9iAtNf-1nCFP2PYJ0woS8ZXB1QnfmjuwJbhNJc53KKfsCErff_c5F8",
    candidateTitle: "Senior UX Specialist & Systems Architect",
    matchScore: 94,
    status: "SHORTLISTED",
    appliedAt: "2026-07-21",
    updatedAt: "2026-07-23",
    resumeUrl: "/resumes/Alex_Rivers_Resume_2026.pdf",
    location: "San Francisco, CA",
    skills: ["PyTorch", "LLM fine-tuning", "UX Design"],
    notes: "Passed recruiter screening. Hiring manager reviewing profile."
  },
  {
    id: "app-3",
    jobId: "job-3",
    jobTitle: "Principal Frontend Engineer",
    companyName: "Horizon Tech",
    companyLogo: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&auto=format&fit=crop&q=60",
    candidateName: "Alex Rivers",
    candidateAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCohtV2Z0aDLDnAjCiN9bVGyy23UBK2eUaFPXAmILSLmTWMtP5mNAQBOGNOKEumuaKYIrTbgg8HxYkR0BkzjQKbnZY6AomJue9dlrGeS7LUmBLE19pwl7THpOA-Q9SNXeNmKxubmdGOHk_odhKF4Bc4kTPkMK7ZBHYi-0CUCyvPmvlq7U6ACptlDENQxAUgJI34gc6pdN1Dvu6jkM7Iuzox9T9iAtNf-1nCFP2PYJ0woS8ZXB1QnfmjuwJbhNJc53KKfsCErff_c5F8",
    candidateTitle: "Senior UX Specialist & Systems Architect",
    matchScore: 91,
    status: "UNDER_REVIEW",
    appliedAt: "2026-07-22",
    updatedAt: "2026-07-22",
    resumeUrl: "/resumes/Alex_Rivers_Resume_2026.pdf",
    location: "San Francisco, CA",
    skills: ["TypeScript", "Next.js", "Performance"]
  },
  {
    id: "app-4",
    jobId: "job-4",
    jobTitle: "Staff Product Manager - Growth",
    companyName: "Nexus Commerce",
    companyLogo: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=100&auto=format&fit=crop&q=60",
    candidateName: "Alex Rivers",
    candidateAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCohtV2Z0aDLDnAjCiN9bVGyy23UBK2eUaFPXAmILSLmTWMtP5mNAQBOGNOKEumuaKYIrTbgg8HxYkR0BkzjQKbnZY6AomJue9dlrGeS7LUmBLE19pwl7THpOA-Q9SNXeNmKxubmdGOHk_odhKF4Bc4kTPkMK7ZBHYi-0CUCyvPmvlq7U6ACptlDENQxAUgJI34gc6pdN1Dvu6jkM7Iuzox9T9iAtNf-1nCFP2PYJ0woS8ZXB1QnfmjuwJbhNJc53KKfsCErff_c5F8",
    candidateTitle: "Senior UX Specialist & Systems Architect",
    matchScore: 85,
    status: "OFFER",
    appliedAt: "2026-07-15",
    updatedAt: "2026-07-25",
    resumeUrl: "/resumes/Alex_Rivers_Resume_2026.pdf",
    location: "San Francisco, CA",
    skills: ["Growth", "A/B Testing", "Metrics"],
    notes: "Official offer letter generated: $200,000 base + 0.15% equity."
  }
];

export const INITIAL_MESSAGES: MessageItem[] = [
  {
    id: "msg-1",
    senderId: "recruiter-1",
    senderName: "Sarah Jenkins (Stellar Systems)",
    senderAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuC1D7dFdsnx2LAf_HxMUQf5KpCl5o2SHtRoQtxP7qjPB2D7KMODcDu0063TsqSLCewWg9M09otOoMbH-NfUzvBYL92WSEUJQDyw0W-Bmok-FvgZyL21HUitslBJkhfhVC2G8gAQ6LSZ_X8qMYN9F5R1R_kgZFA67hps92BfZKbel7Lmg6aApF7Nih5ph9jjS0S0rUr2W_p3a3L0hwTkNXDRL4DpAgeh-X1qCkE5OBpKsWx0JHS37gayqR4caP6y50K32RpNrJ5CHWlC",
    receiverId: "seeker-1",
    content: "Hi Alex! We were really impressed by your portfolio and experience building design systems for AI platforms. Are you available for a 30-min call tomorrow?",
    timestamp: "10:14 AM",
    read: true,
    isRecruiter: true
  },
  {
    id: "msg-2",
    senderId: "seeker-1",
    senderName: "Alex Rivers",
    senderAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCohtV2Z0aDLDnAjCiN9bVGyy23UBK2eUaFPXAmILSLmTWMtP5mNAQBOGNOKEumuaKYIrTbgg8HxYkR0BkzjQKbnZY6AomJue9dlrGeS7LUmBLE19pwl7THpOA-Q9SNXeNmKxubmdGOHk_odhKF4Bc4kTPkMK7ZBHYi-0CUCyvPmvlq7U6ACptlDENQxAUgJI34gc6pdN1Dvu6jkM7Iuzox9T9iAtNf-1nCFP2PYJ0woS8ZXB1QnfmjuwJbhNJc53KKfsCErff_c5F8",
    receiverId: "recruiter-1",
    content: "Hi Sarah! Thanks for reaching out. Yes, tomorrow at 2:00 PM PST works perfectly for me. I've also attached my updated 2026 design case studies.",
    attachment: {
      name: "Alex_Rivers_CaseStudies_2026.pdf",
      size: "4.2 MB",
      type: "PDF",
      url: "#"
    },
    timestamp: "10:18 AM",
    read: true,
    isRecruiter: false
  },
  {
    id: "msg-3",
    senderId: "recruiter-1",
    senderName: "Sarah Jenkins (Stellar Systems)",
    senderAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuC1D7dFdsnx2LAf_HxMUQf5KpCl5o2SHtRoQtxP7qjPB2D7KMODcDu0063TsqSLCewWg9M09otOoMbH-NfUzvBYL92WSEUJQDyw0W-Bmok-FvgZyL21HUitslBJkhfhVC2G8gAQ6LSZ_X8qMYN9F5R1R_kgZFA67hps92BfZKbel7Lmg6aApF7Nih5ph9jjS0S0rUr2W_p3a3L0hwTkNXDRL4DpAgeh-X1qCkE5OBpKsWx0JHS37gayqR4caP6y50K32RpNrJ5CHWlC",
    receiverId: "seeker-1",
    content: "Perfect! Calendar invite sent with the Google Meet link. Looking forward to our chat!",
    timestamp: "10:22 AM",
    read: true,
    isRecruiter: true
  }
];

export const INITIAL_USERS: UserItem[] = [
  {
    id: "usr-1",
    name: "Alex Rivers",
    email: "alex.rivers@gmail.com",
    role: "JOB_SEEKER",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCohtV2Z0aDLDnAjCiN9bVGyy23UBK2eUaFPXAmILSLmTWMtP5mNAQBOGNOKEumuaKYIrTbgg8HxYkR0BkzjQKbnZY6AomJue9dlrGeS7LUmBLE19pwl7THpOA-Q9SNXeNmKxubmdGOHk_odhKF4Bc4kTPkMK7ZBHYi-0CUCyvPmvlq7U6ACptlDENQxAUgJI34gc6pdN1Dvu6jkM7Iuzox9T9iAtNf-1nCFP2PYJ0woS8ZXB1QnfmjuwJbhNJc53KKfsCErff_c5F8",
    country: "United States",
    status: "VERIFIED",
    subscription: "FREE",
    createdAt: "2026-01-15"
  },
  {
    id: "usr-2",
    name: "Sarah Jenkins",
    email: "sarah@stellarsystems.ai",
    role: "RECRUITER",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuC1D7dFdsnx2LAf_HxMUQf5KpCl5o2SHtRoQtxP7qjPB2D7KMODcDu0063TsqSLCewWg9M09otOoMbH-NfUzvBYL92WSEUJQDyw0W-Bmok-FvgZyL21HUitslBJkhfhVC2G8gAQ6LSZ_X8qMYN9F5R1R_kgZFA67hps92BfZKbel7Lmg6aApF7Nih5ph9jjS0S0rUr2W_p3a3L0hwTkNXDRL4DpAgeh-X1qCkE5OBpKsWx0JHS37gayqR4caP6y50K32RpNrJ5CHWlC",
    country: "United States",
    status: "VERIFIED",
    subscription: "GROWTH",
    createdAt: "2026-02-01"
  },
  {
    id: "usr-3",
    name: "Marcus Vance",
    email: "marcus@neuralscale.io",
    role: "RECRUITER",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
    country: "United States",
    status: "PENDING",
    subscription: "STARTER",
    createdAt: "2026-03-10"
  },
  {
    id: "usr-4",
    name: "Elena Rostova",
    email: "elena@horizontech.co.uk",
    role: "COMPANY_ADMIN",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=60",
    country: "United Kingdom",
    status: "VERIFIED",
    subscription: "ENTERPRISE",
    createdAt: "2025-11-20"
  },
  {
    id: "usr-5",
    name: "David Kim",
    email: "david.kim@nexus.io",
    role: "JOB_SEEKER",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60",
    country: "Canada",
    status: "BLOCKED",
    subscription: "FREE",
    createdAt: "2026-04-05"
  }
];

export const INITIAL_COMPANY_MODERATIONS: CompanyModerationItem[] = [
  {
    id: "mod-1",
    companyName: "Vortex Intelligence Inc.",
    logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60",
    website: "https://vortexintel.ai",
    email: "legal@vortexintel.ai",
    taxId: "US-984210941",
    licenseNumber: "CA-CORP-2026-981",
    recruiterName: "Rachel Miller",
    recruiterEmail: "rachel@vortexintel.ai",
    status: "PENDING",
    appliedAt: "2026-07-24"
  },
  {
    id: "mod-2",
    companyName: "Stellar Systems",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDUSY4HuOhQnp99RQGM7nj2qJaAWM49iI9uWz43APGGY9elmswm8Xhx8Hx3opdXODLdtZq0n-bxGcH7MRRbeOar3uNrgkHm1g4eL86ilUFWlHgKQHoc0-DqJsvor7xRNbZXRHP0WvFXR_dNDhMolXMQPnmQg4Jl_XDs_ssI9JsQ_WcIV4LJRpTCzOkZnd3pXcC9vurP6zcFOrmGm5bUwPACA1hF1P7gnmLUPkIZbbhMPh5kRmRcRFnUqsykv9lu5Rpjm64oHzTH_oyL",
    website: "https://stellarsystems.ai",
    email: "compliance@stellarsystems.ai",
    taxId: "US-129481023",
    licenseNumber: "DE-INC-2025-412",
    recruiterName: "Sarah Jenkins",
    recruiterEmail: "sarah@stellarsystems.ai",
    status: "APPROVED",
    appliedAt: "2026-02-01"
  },
  {
    id: "mod-3",
    companyName: "CryptoScale Labs",
    logo: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&auto=format&fit=crop&q=60",
    website: "https://cryptoscale.io",
    email: "admin@cryptoscale.io",
    taxId: "KY-8841029",
    licenseNumber: "KY-LLC-881",
    recruiterName: "Alexander Vance",
    recruiterEmail: "alex@cryptoscale.io",
    status: "REJECTED",
    appliedAt: "2026-06-12",
    notes: "Failed business license verification and invalid tax registration."
  }
];

export const INITIAL_SUBSCRIPTION_PLANS: SubscriptionPlanItem[] = [
  {
    id: "plan-starter",
    name: "Starter",
    price: 299,
    interval: "month",
    features: ["3 Active Job Openings", "Basic AI Candidate Matching", "Direct Chat Messaging"],
    subscribersCount: 142,
    status: "ACTIVE",
    mrr: 42458
  },
  {
    id: "plan-growth",
    name: "Growth",
    price: 699,
    interval: "month",
    features: ["10 Active Job Openings", "Advanced Candidate Pipeline", "Bulk Resume Export", "Slack Integration"],
    subscribersCount: 285,
    status: "ACTIVE",
    mrr: 199215
  },
  {
    id: "plan-enterprise",
    name: "Enterprise",
    price: 2499,
    interval: "month",
    features: ["Unlimited Job Openings", "Dedicated Executive Search Specialist", "Workday ATS API Sync", "24/7 SLA Support"],
    subscribersCount: 96,
    status: "ACTIVE",
    mrr: 239904
  }
];

export const INITIAL_TRANSACTIONS: TransactionItem[] = [
  {
    id: "inv-9012",
    customerName: "Sarah Jenkins",
    companyName: "Stellar Systems",
    planName: "Growth Plan ($699/mo)",
    amount: 699,
    status: "PAID",
    date: "2026-07-01"
  },
  {
    id: "inv-9013",
    customerName: "Elena Rostova",
    companyName: "Horizon Tech",
    planName: "Enterprise Plan ($2,499/mo)",
    amount: 2499,
    status: "PAID",
    date: "2026-07-03"
  },
  {
    id: "inv-9014",
    customerName: "Marcus Vance",
    companyName: "NeuralScale",
    planName: "Starter Plan ($299/mo)",
    amount: 299,
    status: "PAID",
    date: "2026-07-15"
  }
];

export const PROFILE_DATA = {
  name: "Alex Rivers",
  headline: "Senior UX Specialist & Systems Architect",
  location: "San Francisco, CA",
  avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCohtV2Z0aDLDnAjCiN9bVGyy23UBK2eUaFPXAmILSLmTWMtP5mNAQBOGNOKEumuaKYIrTbgg8HxYkR0BkzjQKbnZY6AomJue9dlrGeS7LUmBLE19pwl7THpOA-Q9SNXeNmKxubmdGOHk_odhKF4Bc4kTPkMK7ZBHYi-0CUCyvPmvlq7U6ACptlDENQxAUgJI34gc6pdN1Dvu6jkM7Iuzox9T9iAtNf-1nCFP2PYJ0woS8ZXB1QnfmjuwJbhNJc53KKfsCErff_c5F8",
  bio: "Senior Product Designer with 6+ years specializing in design token architecture, enterprise AI software, and intuitive micro-interactions.",
  resumeScore: 96,
  completeness: 92,
  skills: [
    "Design Systems", "Figma", "User Research", "Generative AI UX", "Prototyping", "Next.js", "TypeScript", "TailwindCSS", "A/B Testing"
  ],
  experience: [
    {
      company: "Apex Product Labs",
      title: "Lead Product Designer",
      period: "2023 - Present",
      description: "Architected multi-brand design tokens used across 14 enterprise applications, cutting UI development cycles by 40%."
    },
    {
      company: "Vanguard Systems",
      title: "Senior UX Engineer",
      period: "2021 - 2023",
      description: "Designed data-dense monitoring dashboards and AI-assisted threat detection interfaces for cybersecurity clients."
    }
  ],
  education: [
    {
      institution: "Stanford University",
      degree: "B.S. in Human-Computer Interaction",
      year: "2017 - 2021"
    }
  ],
  portfolio: [
    {
      title: "Enterprise AI Copilot UI",
      description: "Generative workflow design system for complex data pipelines.",
      link: "https://alexrivers.design/ai-copilot"
    },
    {
      title: "Fluid Design Tokens System",
      description: "Open-source token architecture with automatic dark mode mapping.",
      link: "https://alexrivers.design/tokens"
    }
  ]
};
