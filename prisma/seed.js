const { PrismaClient } = require("@prisma/client");
const { randomBytes, scryptSync } = require("crypto");

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function main() {
  console.log("🌱 Starting NextHire Complete Database Seeding (QA & Live Fixtures)...");

  const defaultPasswordHash = hashPassword("Password123!");

  // =========================================================================
  // 1. COMPANIES
  // =========================================================================
  // Company A: QA Partner Company
  const companyA = await prisma.company.upsert({
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

  // Company B: Live Recruiter & Manager Test Company (Acme Corp)
  const companyB = await prisma.company.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {
      name: "Acme Corporation",
      industry: "Technology & Software",
      location: "New York, NY",
      description: "High-growth software company testing live recruiter and recruiter manager workflows.",
      website: "https://acmecorp.example.com",
      isVerified: true,
    },
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Acme Corporation",
      industry: "Technology & Software",
      location: "New York, NY",
      description: "High-growth software company testing live recruiter and recruiter manager workflows.",
      website: "https://acmecorp.example.com",
      isVerified: true,
      logo: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=150&auto=format&fit=crop&q=80",
    },
  });

  // Company C: Cross-Company Isolation Test Company (Globex Corp)
  const companyC = await prisma.company.upsert({
    where: { id: "00000000-0000-0000-0000-000000000003" },
    update: {
      name: "Globex Corporation",
      industry: "Global Logistics & Operations",
      location: "Chicago, IL",
      description: "Independent organization for verifying strict cross-company isolation.",
      website: "https://globex.example.com",
      isVerified: true,
    },
    create: {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Globex Corporation",
      industry: "Global Logistics & Operations",
      location: "Chicago, IL",
      description: "Independent organization for verifying strict cross-company isolation.",
      website: "https://globex.example.com",
      isVerified: true,
      logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&auto=format&fit=crop&q=80",
    },
  });
  console.log("✅ Companies ready: NextHire Simulation Corp, Acme Corp, Globex Corp");

  // =========================================================================
  // 2. FULL-ACCESS QA ACCOUNTS
  // =========================================================================
  // QA Job Seeker
  const qaSeeker = await prisma.user.upsert({
    where: { email: "jobseeker@nexthire.cloud" },
    update: {
      name: "Stage 1 Candidate",
      role: "JOB_SEEKER",
      isTester: true,
      headline: "Senior Full-Stack Engineer",
      bio: "Dedicated Stage 1 test candidate evaluating the live NextHire job search, application lifecycle, and resume management workflow.",
      location: "San Francisco, CA",
    },
    create: {
      email: "jobseeker@nexthire.cloud",
      name: "Stage 1 Candidate",
      role: "JOB_SEEKER",
      isTester: true,
      passwordHash: defaultPasswordHash,
      headline: "Senior Full-Stack Engineer",
      bio: "Dedicated Stage 1 test candidate evaluating the live NextHire job search, application lifecycle, and resume management workflow.",
      location: "San Francisco, CA",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  await prisma.profile.upsert({
    where: { userId: qaSeeker.id },
    update: {},
    create: {
      userId: qaSeeker.id,
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

  // QA Recruiter
  const qaRecruiter = await prisma.user.upsert({
    where: { email: "recruiter@nexthire.cloud" },
    update: {
      name: "Stage 1 Recruiter",
      role: "RECRUITER",
      isTester: true,
      companyId: companyA.id,
      headline: "Lead Talent Acquisition Partner",
      bio: "Managing technical hiring and recruitment pipelines on NextHire.",
      location: "San Francisco, CA",
    },
    create: {
      email: "recruiter@nexthire.cloud",
      name: "Stage 1 Recruiter",
      role: "RECRUITER",
      isTester: true,
      passwordHash: defaultPasswordHash,
      companyId: companyA.id,
      headline: "Lead Talent Acquisition Partner",
      bio: "Managing technical hiring and recruitment pipelines on NextHire.",
      location: "San Francisco, CA",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  // QA Platform Owner
  const qaOwner = await prisma.user.upsert({
    where: { email: "owner@nexthire.cloud" },
    update: {
      name: "Stage 1 Platform Owner",
      role: "PLATFORM_ADMIN",
      isTester: true,
      headline: "Platform Administrator & Owner",
      bio: "Platform governance and system audit oversight.",
      location: "San Francisco, CA",
    },
    create: {
      email: "owner@nexthire.cloud",
      name: "Stage 1 Platform Owner",
      role: "PLATFORM_ADMIN",
      isTester: true,
      passwordHash: defaultPasswordHash,
      headline: "Platform Administrator & Owner",
      bio: "Platform governance and system audit oversight.",
      location: "San Francisco, CA",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    },
  });
  console.log("✅ QA Accounts ready: jobseeker@nexthire.cloud, recruiter@nexthire.cloud, owner@nexthire.cloud");

  // =========================================================================
  // 3. LIVE / REALISTIC USER ACCOUNTS (Normal Production Rules)
  // =========================================================================
  // Live Job Seeker
  const liveSeeker = await prisma.user.upsert({
    where: { email: "jb1@nexthire.cloud" },
    update: {
      name: "Alex Rivera",
      role: "JOB_SEEKER",
      isTester: false,
      headline: "Frontend Software Engineer",
      bio: "Live Job Seeker testing standard candidate application workflows and real profile requirements.",
      location: "Austin, TX",
    },
    create: {
      email: "jb1@nexthire.cloud",
      name: "Alex Rivera",
      role: "JOB_SEEKER",
      isTester: false,
      passwordHash: defaultPasswordHash,
      headline: "Frontend Software Engineer",
      bio: "Live Job Seeker testing standard candidate application workflows and real profile requirements.",
      location: "Austin, TX",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    },
  });

  await prisma.profile.upsert({
    where: { userId: liveSeeker.id },
    update: {},
    create: {
      userId: liveSeeker.id,
      skills: "React, JavaScript, CSS, HTML5, Redux",
      experience: JSON.stringify([
        {
          id: "exp-live-1",
          company: "WebCraft Studio",
          role: "Frontend Developer",
          startDate: "2021-06",
          endDate: "Present",
          description: "Built responsive UI components.",
        },
      ]),
      resumeScore: 82,
    },
  });

  // Live Recruiter Manager (Acme Corp)
  const liveManager = await prisma.user.upsert({
    where: { email: "rcm@nexthire.cloud" },
    update: {
      name: "Elena Rostova",
      role: "RECRUITER_MANAGER",
      isTester: false,
      companyId: companyB.id,
      headline: "Head of Recruiting & Talent Acquisition",
      bio: "Recruiting Manager directing technical hiring and managing recruiter allocations at Acme Corp.",
      location: "New York, NY",
    },
    create: {
      email: "rcm@nexthire.cloud",
      name: "Elena Rostova",
      role: "RECRUITER_MANAGER",
      isTester: false,
      passwordHash: defaultPasswordHash,
      companyId: companyB.id,
      headline: "Head of Recruiting & Talent Acquisition",
      bio: "Recruiting Manager directing technical hiring and managing recruiter allocations at Acme Corp.",
      location: "New York, NY",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
  });

  // Live Recruiter (Reports to Elena Rostova at Acme Corp)
  const liveRecruiter = await prisma.user.upsert({
    where: { email: "rc1@nexthire.cloud" },
    update: {
      name: "Marcus Vance",
      role: "RECRUITER",
      isTester: false,
      companyId: companyB.id,
      managerId: liveManager.id,
      headline: "Technical Recruiter",
      bio: "Live Recruiter working under Talent Manager at Acme Corp.",
      location: "New York, NY",
    },
    create: {
      email: "rc1@nexthire.cloud",
      name: "Marcus Vance",
      role: "RECRUITER",
      isTester: false,
      passwordHash: defaultPasswordHash,
      companyId: companyB.id,
      managerId: liveManager.id,
      headline: "Technical Recruiter",
      bio: "Live Recruiter working under Talent Manager at Acme Corp.",
      location: "New York, NY",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
  });

  // Cross-Company Recruiter (Belongs to Globex Corp - Company C)
  const crossCompanyRecruiter = await prisma.user.upsert({
    where: { email: "rc2@nexthire.cloud" },
    update: {
      name: "David Sterling",
      role: "RECRUITER",
      isTester: false,
      companyId: companyC.id,
      headline: "Logistics Talent Lead",
      bio: "Recruiter for Globex Corp testing cross-company security isolation.",
      location: "Chicago, IL",
    },
    create: {
      email: "rc2@nexthire.cloud",
      name: "David Sterling",
      role: "RECRUITER",
      isTester: false,
      passwordHash: defaultPasswordHash,
      companyId: companyC.id,
      headline: "Logistics Talent Lead",
      bio: "Recruiter for Globex Corp testing cross-company security isolation.",
      location: "Chicago, IL",
      avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
    },
  });
  console.log("✅ Live Accounts ready: jb1@nexthire.cloud, rcm@nexthire.cloud, rc1@nexthire.cloud, rc2@nexthire.cloud");

  // =========================================================================
  // 4. TEAM & REPORTING STRUCTURE
  // =========================================================================
  const acmeTeam = await prisma.recruiterTeam.upsert({
    where: { id: "00000000-0000-0000-0000-000000000201" },
    update: {
      name: "Acme Engineering Recruitment",
      description: "Core technical recruitment unit managed by Elena Rostova.",
      companyId: companyB.id,
    },
    create: {
      id: "00000000-0000-0000-0000-000000000201",
      name: "Acme Engineering Recruitment",
      description: "Core technical recruitment unit managed by Elena Rostova.",
      companyId: companyB.id,
    },
  });

  // Team Memberships
  await prisma.teamMembership.upsert({
    where: { teamId_userId: { teamId: acmeTeam.id, userId: liveManager.id } },
    update: { role: "HIRING_MANAGER", companyId: companyB.id },
    create: { teamId: acmeTeam.id, userId: liveManager.id, companyId: companyB.id, role: "HIRING_MANAGER" },
  });

  await prisma.teamMembership.upsert({
    where: { teamId_userId: { teamId: acmeTeam.id, userId: liveRecruiter.id } },
    update: { role: "TEAM_MEMBER", companyId: companyB.id },
    create: { teamId: acmeTeam.id, userId: liveRecruiter.id, companyId: companyB.id, role: "TEAM_MEMBER" },
  });
  console.log("✅ Team structure established: Elena Rostova (HIRING_MANAGER) -> Marcus Vance (TEAM_MEMBER)");

  // =========================================================================
  // 5. SAMPLE ACTIVE JOB & CANDIDATE ASSIGNMENT
  // =========================================================================
  const acmeJob = await prisma.job.upsert({
    where: { id: "00000000-0000-0000-0000-000000000201" },
    update: {
      title: "Full-Stack Engineer (Acme Tech)",
      companyId: companyB.id,
      recruiterId: liveRecruiter.id,
      status: "ACTIVE",
    },
    create: {
      id: "00000000-0000-0000-0000-000000000201",
      title: "Full-Stack Engineer (Acme Tech)",
      companyId: companyB.id,
      recruiterId: liveRecruiter.id,
      description: "Acme Corporation is hiring a full-stack engineer to build core product features.",
      responsibilities: JSON.stringify([
        "Develop high performance React and Node.js microservices",
        "Collaborate with product and design teams to deliver exceptional UX",
      ]),
      requirements: JSON.stringify([
        "3+ years experience with React, TypeScript, and SQL databases",
        "Strong understanding of modern REST APIs and automated testing",
      ]),
      benefits: JSON.stringify([
        "Competitive salary and equity package",
        "Comprehensive health, dental, and vision coverage",
      ]),
      location: "New York, NY",
      country: "United States",
      salaryMin: 130000,
      salaryMax: 165000,
      employmentType: "FULL_TIME",
      experienceLevel: "Mid-Senior",
      category: "ENGINEERING",
      isRemote: true,
      skills: "React, Node.js, TypeScript, PostgreSQL",
      status: "ACTIVE",
    },
  });

  // Assign live seeker to live recruiter by live manager
  await prisma.candidateAssignment.upsert({
    where: { id: "00000000-0000-0000-0000-000000000301" },
    update: {
      companyId: companyB.id,
      candidateId: liveSeeker.id,
      recruiterId: liveRecruiter.id,
      assignedById: liveManager.id,
      status: "ACTIVE",
      jobId: acmeJob.id,
    },
    create: {
      id: "00000000-0000-0000-0000-000000000301",
      companyId: companyB.id,
      candidateId: liveSeeker.id,
      recruiterId: liveRecruiter.id,
      assignedById: liveManager.id,
      reason: "Assigned candidate for initial technical screening",
      status: "ACTIVE",
      jobId: acmeJob.id,
      teamId: acmeTeam.id,
    },
  });

  console.log("\n🎉 Complete database seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
