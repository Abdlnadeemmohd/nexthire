const { PrismaClient } = require("@prisma/client");
const { randomBytes, scryptSync } = require("crypto");

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function main() {
  console.log("🌱 Starting NextHire Stage 1 Production Database Seeding...");

  const defaultPasswordHash = hashPassword("Password123!");

  // 1. Create or ensure Stage 1 Test Company
  const company = await prisma.company.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {
      name: "NextHire Simulation Corp",
      industry: "Software Engineering & Cloud Infrastructure",
      location: "San Francisco, CA",
      description: "Dedicated enterprise partner testing real-time recruitment, ATS pipeline, and hiring workflows on NextHire Cloud.",
      website: "https://nexthire.cloud",
      isVerified: true,
    },
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "NextHire Simulation Corp",
      industry: "Software Engineering & Cloud Infrastructure",
      location: "San Francisco, CA",
      description: "Dedicated enterprise partner testing real-time recruitment, ATS pipeline, and hiring workflows on NextHire Cloud.",
      website: "https://nexthire.cloud",
      isVerified: true,
      logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
    },
  });
  console.log(`✅ Company ready: ${company.name} (${company.id})`);

  // 2. Stage 1 Job Seeker Account
  const seeker = await prisma.user.upsert({
    where: { email: "jobseeker@nexthire.cloud" },
    update: {
      name: "Stage 1 Candidate",
      role: "JOB_SEEKER",
      headline: "Senior Full-Stack Engineer",
      bio: "Dedicated Stage 1 test candidate evaluating the live NextHire job search, application lifecycle, and resume management workflow.",
      location: "San Francisco, CA",
    },
    create: {
      email: "jobseeker@nexthire.cloud",
      name: "Stage 1 Candidate",
      role: "JOB_SEEKER",
      passwordHash: defaultPasswordHash,
      headline: "Senior Full-Stack Engineer",
      bio: "Dedicated Stage 1 test candidate evaluating the live NextHire job search, application lifecycle, and resume management workflow.",
      location: "San Francisco, CA",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  // Ensure Seeker Profile exists
  await prisma.profile.upsert({
    where: { userId: seeker.id },
    update: {},
    create: {
      userId: seeker.id,
      skills: "Next.js, TypeScript, React, PostgreSQL, Node.js, Prisma, Tailwind CSS",
      experience: JSON.stringify([
        {
          id: "exp-stage1-1",
          company: "CloudTech Solutions",
          role: "Senior Software Engineer",
          startDate: "2022-01",
          endDate: "Present",
          description: "Architected distributed web services and front-end user experiences.",
          achievements: ["Reduced bundle size by 35%", "Implemented serverless microservices"],
        },
      ]),
      education: JSON.stringify([
        {
          id: "edu-stage1-1",
          institution: "University of California, Berkeley",
          degree: "B.S. in Computer Science",
          fieldOfStudy: "Computer Science",
          graduationYear: "2021",
        },
      ]),
      portfolio: JSON.stringify({
        github: "https://github.com",
        linkedin: "https://linkedin.com",
      }),
      resumeScore: 95,
    },
  });
  console.log(`✅ Job Seeker ready: ${seeker.email} (${seeker.id})`);

  // 3. Stage 1 Recruiter Account
  const recruiter = await prisma.user.upsert({
    where: { email: "recruiter@nexthire.cloud" },
    update: {
      name: "Stage 1 Recruiter",
      role: "RECRUITER",
      companyId: company.id,
      headline: "Lead Talent Acquisition Partner",
      bio: "Managing technical hiring and recruitment pipelines for NextHire Simulation Corp.",
      location: "San Francisco, CA",
    },
    create: {
      email: "recruiter@nexthire.cloud",
      name: "Stage 1 Recruiter",
      role: "RECRUITER",
      passwordHash: defaultPasswordHash,
      companyId: company.id,
      headline: "Lead Talent Acquisition Partner",
      bio: "Managing technical hiring and recruitment pipelines for NextHire Simulation Corp.",
      location: "San Francisco, CA",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });
  console.log(`✅ Recruiter ready: ${recruiter.email} (${recruiter.id})`);

  // 4. Stage 1 Platform Owner Account
  const owner = await prisma.user.upsert({
    where: { email: "owner@nexthire.cloud" },
    update: {
      name: "Stage 1 Platform Owner",
      role: "PLATFORM_ADMIN",
      headline: "Platform Administrator & Owner",
      bio: "Platform governance and system audit oversight.",
      location: "San Francisco, CA",
    },
    create: {
      email: "owner@nexthire.cloud",
      name: "Stage 1 Platform Owner",
      role: "PLATFORM_ADMIN",
      passwordHash: defaultPasswordHash,
      headline: "Platform Administrator & Owner",
      bio: "Platform governance and system audit oversight.",
      location: "San Francisco, CA",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    },
  });
  console.log(`✅ Platform Owner ready: ${owner.email} (${owner.id})`);

  // 5. Create initial active job for NextHire Simulation Corp
  const initialJob = await prisma.job.upsert({
    where: { id: "00000000-0000-0000-0000-000000000101" },
    update: {
      title: "Senior Full-Stack Engineer (Next.js & TypeScript)",
      companyId: company.id,
      recruiterId: recruiter.id,
      description: "NextHire Simulation Corp is hiring a Senior Full-Stack Engineer to build scalable web applications, real-time messaging, and high-performance serverless endpoints.",
      responsibilities: JSON.stringify([
        "Architect and build modern web applications using Next.js 14 App Router and TypeScript",
        "Design scalable database schemas and queries using Neon PostgreSQL and Prisma",
        "Implement secure, enterprise-grade authentication and Cloudinary document workflows",
      ]),
      requirements: JSON.stringify([
        "4+ years of professional full-stack development experience",
        "Deep expertise with React, TypeScript, and modern CSS/Tailwind frameworks",
        "Experience building production REST and GraphQL API routes",
      ]),
      benefits: JSON.stringify([
        "Competitive salary ($140,000 - $180,000) and equity compensation",
        "Comprehensive health, dental, and vision insurance",
        "Full remote flexibility with top-tier hardware stipend",
      ]),
      location: "San Francisco, CA",
      country: "United States",
      salaryMin: 140000,
      salaryMax: 180000,
      employmentType: "FULL_TIME",
      experienceLevel: "Senior (4-7 years)",
      category: "ENGINEERING",
      isRemote: true,
      skills: "Next.js, TypeScript, React, PostgreSQL, Prisma, Node.js, Tailwind CSS",
      status: "ACTIVE",
    },
    create: {
      id: "00000000-0000-0000-0000-000000000101",
      title: "Senior Full-Stack Engineer (Next.js & TypeScript)",
      companyId: company.id,
      recruiterId: recruiter.id,
      description: "NextHire Simulation Corp is hiring a Senior Full-Stack Engineer to build scalable web applications, real-time messaging, and high-performance serverless endpoints.",
      responsibilities: JSON.stringify([
        "Architect and build modern web applications using Next.js 14 App Router and TypeScript",
        "Design scalable database schemas and queries using Neon PostgreSQL and Prisma",
        "Implement secure, enterprise-grade authentication and Cloudinary document workflows",
      ]),
      requirements: JSON.stringify([
        "4+ years of professional full-stack development experience",
        "Deep expertise with React, TypeScript, and modern CSS/Tailwind frameworks",
        "Experience building production REST and GraphQL API routes",
      ]),
      benefits: JSON.stringify([
        "Competitive salary ($140,000 - $180,000) and equity compensation",
        "Comprehensive health, dental, and vision insurance",
        "Full remote flexibility with top-tier hardware stipend",
      ]),
      location: "San Francisco, CA",
      country: "United States",
      salaryMin: 140000,
      salaryMax: 180000,
      employmentType: "FULL_TIME",
      experienceLevel: "Senior (4-7 years)",
      category: "ENGINEERING",
      isRemote: true,
      skills: "Next.js, TypeScript, React, PostgreSQL, Prisma, Node.js, Tailwind CSS",
      status: "ACTIVE",
    },
  });
  console.log(`✅ Initial Active Job ready: ${initialJob.title} (${initialJob.id})`);

  console.log("\n🎉 Stage 1 database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
