import { QuestionType } from "@prisma/client";
import { AssessmentQuestionData, RubricCriterion } from "./types";

interface SkillQuestionTemplate {
  skill: string;
  category: string;
  type: QuestionType;
  question: string;
  codeSnippet?: string;
  sampleAnswer: string;
  rubric: RubricCriterion[];
}

const QUESTION_BANK: SkillQuestionTemplate[] = [
  // --- NODE.JS / BACKEND ---
  {
    skill: "node.js",
    category: "Node.js & Runtime Architecture",
    type: "KNOWLEDGE",
    question: "Explain the Node.js event loop phases (timers, pending callbacks, poll, check, close callbacks) and how setImmediate differs from process.nextTick.",
    sampleAnswer: "Node.js uses libuv for asynchronous I/O. process.nextTick executes immediately after the current operation before event loop yields. setImmediate runs in the check phase.",
    rubric: [
      { name: "Event Loop Phase Accuracy", maxScore: 5, description: "Correctly outlines timers, I/O polling, and check phases." },
      { name: "Microtask Queue Distinction", maxScore: 5, description: "Accurately details process.nextTick vs setImmediate timing." },
      { name: "Production Asynchrony Insight", maxScore: 5, description: "Explains non-blocking I/O implications and thread pool behavior." },
      { name: "Clarity & Technical Depth", maxScore: 5, description: "Communicates technical runtime concepts concisely." },
    ],
  },
  {
    skill: "node.js",
    category: "Node.js & Performance",
    type: "DEBUGGING",
    question: "Identify the performance bottleneck in this endpoint handling high-volume PDF exports and explain how to refactor it with streaming and worker threads.",
    codeSnippet: `app.get('/export', async (req, res) => {\n  const data = await db.largeDataset.findMany(); // 500,000 rows\n  const pdfBuffer = generatePdfSync(data); // CPU-bound blocking call\n  res.send(pdfBuffer);\n});`,
    sampleAnswer: "generatePdfSync blocks the event loop. Refactor using worker_threads or dedicated worker queues (BullMQ), and stream chunks to the response.",
    rubric: [
      { name: "Event Loop Block Identification", maxScore: 5, description: "Spots synchronous CPU-intensive PDF generation." },
      { name: "Memory Footprint Analysis", maxScore: 5, description: "Notes buffering 500k rows in memory risks OOM." },
      { name: "Streaming & Worker Solution", maxScore: 5, description: "Proposes streams or worker threads/background queue." },
      { name: "Production Robustness", maxScore: 5, description: "Includes pagination, backpressure handling, and error handling." },
    ],
  },

  // --- POSTGRESQL / DATABASE ---
  {
    skill: "postgresql",
    category: "PostgreSQL & Database Optimization",
    type: "KNOWLEDGE",
    question: "Explain the difference between B-Tree, GIN, and BRIN indexes in PostgreSQL and how EXPLAIN ANALYZE helps identify sequential scan bottlenecks.",
    sampleAnswer: "B-Tree is default for scalar comparisons. GIN is ideal for composite/JSONB/full-text. BRIN is efficient for naturally sorted massive time-series tables.",
    rubric: [
      { name: "Index Type Understanding", maxScore: 5, description: "Explains B-Tree vs GIN vs BRIN use cases accurately." },
      { name: "Query Plan Interpretation", maxScore: 5, description: "Demonstrates understanding of Seq Scan vs Index Scan in EXPLAIN ANALYZE." },
      { name: "Optimization Strategy", maxScore: 5, description: "Discusses composite indexes, index selectivity, and maintenance costs." },
      { name: "Reasoning Depth", maxScore: 5, description: "Provides concrete database operational examples." },
    ],
  },
  {
    skill: "postgresql",
    category: "PostgreSQL & Reliability",
    type: "SCENARIO",
    question: "A high-concurrency e-commerce inventory update query is experiencing frequent deadlocks under flash sale traffic. How would you diagnose and eliminate the deadlocks?",
    sampleAnswer: "Analyze pg_stat_activity and Postgres logs. Enforce a consistent lock acquisition order across transactions, use optimistic concurrency or row-level SELECT FOR UPDATE with NOWAIT/SKIP LOCKED.",
    rubric: [
      { name: "Root Cause Diagnosis", maxScore: 5, description: "Explains concurrent conflicting row lock orders." },
      { name: "Lock Ordering Strategy", maxScore: 5, description: "Proposes deterministic order (e.g. sorting item IDs before locking)." },
      { name: "Concurrency Controls", maxScore: 5, description: "Discusses SKIP LOCKED, advisory locks, or queue decoupling." },
      { name: "Data Integrity & Rollback", maxScore: 5, description: "Ensures ACID consistency and atomic state transitions." },
    ],
  },

  // --- SYSTEM DESIGN & DISTRIBUTED SYSTEMS ---
  {
    skill: "system design",
    category: "System Design & Distributed Architecture",
    type: "PRACTICAL",
    question: "Design a rate-limiting and webhook delivery system processing 100,000 outbound events per minute with retry policies, exponential backoff, and idempotent consumer guarantees.",
    sampleAnswer: "Use Redis Token Bucket for rate limiting, Kafka/RabbitMQ for durable queueing, worker pool for HTTP dispatch with exponential backoff and dead-letter queues, and Svix/HMAC signatures with idempotency keys.",
    rubric: [
      { name: "Architecture & Component Choice", maxScore: 5, description: "Selects appropriate durable queues, rate limiters, and worker pools." },
      { name: "Scalability & Throughput", maxScore: 5, description: "Handles 100k events/min with horizontal worker scaling and batching." },
      { name: "Failure & Retry Handling", maxScore: 5, description: "Designs exponential backoff with jitter and Dead Letter Queue (DLQ)." },
      { name: "Idempotency & Security", maxScore: 5, description: "Specifies HMAC signatures, timestamp replay tolerance, and dedup keys." },
    ],
  },
  {
    skill: "system design",
    category: "System Design & Reliability",
    type: "SCENARIO",
    question: "Your primary API latency has suddenly spiked from 80ms to 2.5 seconds during peak traffic hours. Walk through your step-by-step triage, telemetry inspection, and mitigation strategy.",
    sampleAnswer: "Check APM metrics (p99 latency, CPU, memory), database connection pool utilization, slow queries via pg_stat_statements, external third-party dependency latencies, and apply caching or shed load via circuit breakers.",
    rubric: [
      { name: "Triage & Telemetry Inspection", maxScore: 5, description: "Uses structured APM, RED metrics (Rate, Errors, Duration), and logs." },
      { name: "Bottleneck Isolation", maxScore: 5, description: "Distinguishes between DB saturation, thread pool exhaustion, and upstream dependencies." },
      { name: "Immediate Mitigation", maxScore: 5, description: "Proposes circuit breakers, rate limiting, connection pool scaling, or caching." },
      { name: "Post-Incident Prevention", maxScore: 5, description: "Suggests auto-scaling, query optimization, and canary deployments." },
    ],
  },

  // --- REACT / FRONTEND ---
  {
    skill: "react",
    category: "Frontend Architecture & React",
    type: "KNOWLEDGE",
    question: "Explain how React 18 Server Components (RSC) differ from traditional Client Components and how the Suspense streaming boundary improves Largest Contentful Paint (LCP).",
    sampleAnswer: "RSCs render exclusively on the server, zero client bundle overhead. Suspense streams HTML chunks as they become ready, unblocking early paint.",
    rubric: [
      { name: "RSC vs Client Component Execution", maxScore: 5, description: "Articulates server-only execution vs hydration." },
      { name: "Streaming & Suspense Mechanics", maxScore: 5, description: "Explains progressive HTML streaming and component decoupling." },
      { name: "Performance & Core Web Vitals", maxScore: 5, description: "Relates streaming boundaries directly to LCP, TTFB, and FID/INP." },
      { name: "State Management Trade-offs", maxScore: 5, description: "Describes boundary rules between server and client components." },
    ],
  },

  // --- CLOUD / AWS / DEVOPS ---
  {
    skill: "aws",
    category: "Cloud Infrastructure & AWS",
    type: "PRACTICAL",
    question: "Design a zero-downtime Blue/Green deployment pipeline for a containerized microservice on AWS (ECS Fargate or EKS) with automated health check rollbacks.",
    sampleAnswer: "Use CodePipeline, ECR, and Application Load Balancer with target groups. Route test traffic to green target group, verify health metrics, then shift production traffic with automated rollback on error thresholds.",
    rubric: [
      { name: "Traffic Routing & Load Balancing", maxScore: 5, description: "Configures ALB target group shifting (Canary/Linear)." },
      { name: "Automated Health Checks", maxScore: 5, description: "Defines meaningful application health endpoints and error metrics." },
      { name: "Rollback Strategy", maxScore: 5, description: "Automates CloudWatch alarm triggers to immediately revert traffic." },
      { name: "Database Migration Synchronization", maxScore: 5, description: "Considers backward-compatible schema changes during cutover." },
    ],
  },

  // --- API DESIGN & SECURITY ---
  {
    skill: "api design",
    category: "API Design & Security",
    type: "SCENARIO",
    question: "Design a secure, multi-tenant RESTful API authentication and authorization scheme preventing Broken Object Level Authorization (BOLA/IDOR) and SSRF attacks.",
    sampleAnswer: "Enforce JWT/opaque session validation on every route. Never trust client-supplied tenant/company IDs; bind authorization directly to the server-verified session context. Validate URL schemes and IP ranges against SSRF.",
    rubric: [
      { name: "BOLA/IDOR Defense", maxScore: 5, description: "Ensures tenant scoping is verified strictly at database query level." },
      { name: "SSRF Protection", maxScore: 5, description: "Blocks internal/private IP ranges (127.0.0.1, 169.254.169.254, RFC 1918)." },
      { name: "Authentication Architecture", maxScore: 5, description: "Specifies secure cookies, token rotation, and RBAC middleware." },
      { name: "Error & Audit Sanitization", maxScore: 5, description: "Prevents leaking sensitive stack traces and records audit logs." },
    ],
  },
];

/**
 * Generates a tailored skills assessment based on job title, description, and required skills.
 */
export function generateAssessmentForJob(
  jobTitle: string,
  jobDescription: string,
  skillsList: string[] = []
): {
  title: string;
  description: string;
  category: string;
  durationMinutes: number;
  passingScore: number;
  questions: AssessmentQuestionData[];
} {
  const combinedText = `${jobTitle} ${jobDescription} ${skillsList.join(" ")}`.toLowerCase();
  
  // Find matching question templates from question bank
  const matchedTemplates: SkillQuestionTemplate[] = [];
  const addedQuestions = new Set<string>();

  for (const item of QUESTION_BANK) {
    if (combinedText.includes(item.skill.toLowerCase()) && !addedQuestions.has(item.question)) {
      matchedTemplates.push(item);
      addedQuestions.add(item.question);
    }
  }

  // If fewer than 4 templates matched, add high-value default system design & API questions
  if (matchedTemplates.length < 4) {
    for (const item of QUESTION_BANK) {
      if (!addedQuestions.has(item.question)) {
        matchedTemplates.push(item);
        addedQuestions.add(item.question);
        if (matchedTemplates.length >= 4) break;
      }
    }
  }

  // Format into ordered questions with rubrics
  const questions: AssessmentQuestionData[] = matchedTemplates.slice(0, 5).map((tmpl, idx) => ({
    category: tmpl.category,
    type: tmpl.type,
    question: tmpl.question,
    codeSnippet: tmpl.codeSnippet,
    sampleAnswer: tmpl.sampleAnswer,
    rubric: tmpl.rubric,
    maxScore: tmpl.rubric.reduce((acc, r) => acc + r.maxScore, 0),
    order: idx + 1,
  }));

  const primaryCategory = questions[0]?.category || "General Technical Assessment";

  return {
    title: `${jobTitle} Skills & Verification Assessment`,
    description: `Structured evidence-based evaluation for ${jobTitle}. Covers fundamental knowledge, production troubleshooting, and practical system design.`,
    category: primaryCategory,
    durationMinutes: Math.max(30, questions.length * 10),
    passingScore: 70,
    questions,
  };
}
