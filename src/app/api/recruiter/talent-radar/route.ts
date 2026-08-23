import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { calculateTalentSupplyTrends } from "@/lib/talent/talentIntelligence";

export const dynamic = "force-dynamic";

function normalizeText(txt: string): string {
  return (txt || "")
    .toLowerCase()
    .replace(/[-_./,\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET() {
  const authUser = await getAuthenticatedUser();
  if (!authUser || authUser.role !== "RECRUITER") {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Active recruiter session required" },
      { status: 403 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        company: true,
      },
    });

    const companyId = user?.companyId || null;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAhead = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // 1. Fetch active company jobs
    const activeJobs = await prisma.job.findMany({
      where: {
        companyId: companyId || "",
        status: "ACTIVE",
      },
      include: {
        applications: {
          select: {
            id: true,
            status: true,
            appliedAt: true,
            applicant: { select: { id: true, name: true, headline: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Fetch discoverable candidates only
    const discoverableCandidates = await prisma.user.findMany({
      where: {
        role: "JOB_SEEKER",
        isDiscoverable: true,
      },
      include: {
        profile: true,
      },
    });

    // 3. Aggregate Top Available Skills from candidate profiles
    const skillCounts: Record<string, number> = {};
    for (const cand of discoverableCandidates) {
      const skills = (cand.profile?.skills || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      for (const s of skills) {
        const canonical = s.charAt(0).toUpperCase() + s.slice(1);
        skillCounts[canonical] = (skillCounts[canonical] || 0) + 1;
      }
    }

    const topSkills = Object.entries(skillCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 4. Compute per-job matches & overall unique matching talent
    const allMatchingCandidateIds = new Set<string>();
    const allStrongCandidateIds = new Set<string>();
    const allNewMatchingCandidateIds = new Set<string>();

    const jobRadarCards = activeJobs.map((job) => {
      const jobTitleNorm = normalizeText(job.title);
      const jobSkills = (job.skills || "")
        .split(",")
        .map((s) => normalizeText(s))
        .filter(Boolean);

      let totalMatches = 0;
      let strongMatches = 0;
      let newMatches = 0;
      const matchedSkillFrequency: Record<string, number> = {};

      for (const cand of discoverableCandidates) {
        const candSkills = (cand.profile?.skills || "")
          .split(",")
          .map((s) => normalizeText(s))
          .filter(Boolean);
        const headlineNorm = normalizeText(cand.headline || "");

        const sharedSkills = jobSkills.filter((js) =>
          candSkills.some((cs) => cs.includes(js) || js.includes(cs))
        );

        const titleOverlap =
          jobTitleNorm.split(" ").some((w) => w.length > 2 && headlineNorm.includes(w)) ||
          headlineNorm.split(" ").some((w) => w.length > 2 && jobTitleNorm.includes(w));

        const isMatch = sharedSkills.length > 0 || titleOverlap;
        const isStrong = sharedSkills.length >= 2 || (sharedSkills.length >= 1 && titleOverlap);

        if (isMatch) {
          totalMatches++;
          allMatchingCandidateIds.add(cand.id);

          if (isStrong) {
            strongMatches++;
            allStrongCandidateIds.add(cand.id);
          }

          if (cand.createdAt >= sevenDaysAgo) {
            newMatches++;
            allNewMatchingCandidateIds.add(cand.id);
          }

          sharedSkills.forEach((s) => {
            matchedSkillFrequency[s] = (matchedSkillFrequency[s] || 0) + 1;
          });
        }
      }

      const topMatchedSkills = Object.entries(matchedSkillFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([s]) => s.charAt(0).toUpperCase() + s.slice(1));

      const firstSkills = jobSkills.slice(0, 3).join(",");
      const ctaUrl = `/recruiter/candidates?title=${encodeURIComponent(job.title)}&skills=${encodeURIComponent(firstSkills)}`;

      return {
        jobId: job.id,
        title: job.title,
        location: job.location,
        employmentType: job.employmentType,
        createdAt: job.createdAt.toISOString(),
        applicationsCount: job.applications.length,
        matchingCandidatesCount: totalMatches,
        strongCandidatesCount: strongMatches,
        newMatchesCount: newMatches,
        topMatchedSkills,
        ctaUrl,
      };
    });

    // 5. Calculate recently active discoverable candidates
    const recentlyActiveCount = discoverableCandidates.filter(
      (c) => c.updatedAt >= fourteenDaysAgo || c.createdAt >= fourteenDaysAgo
    ).length;

    // 6. Calculate real supply trends for main roles
    const engineeringTrend = await calculateTalentSupplyTrends("Engineering");
    const frontendTrend = await calculateTalentSupplyTrends("Frontend");
    const backendTrend = await calculateTalentSupplyTrends("Backend");
    const fullstackTrend = await calculateTalentSupplyTrends("Full Stack");

    const talentSupplyTrends = [
      {
        category: "Engineering Talent",
        trendPercentage: engineeringTrend.trendPercentage,
        trendDirection: engineeringTrend.trendDirection,
        description: engineeringTrend.description,
      },
      {
        category: "Frontend Developers",
        trendPercentage: frontendTrend.trendPercentage,
        trendDirection: frontendTrend.trendDirection,
        description: frontendTrend.description,
      },
      {
        category: "Backend Engineers",
        trendPercentage: backendTrend.trendPercentage,
        trendDirection: backendTrend.trendDirection,
        description: backendTrend.description,
      },
      {
        category: "Full Stack Developers",
        trendPercentage: fullstackTrend.trendPercentage,
        trendDirection: fullstackTrend.trendDirection,
        description: fullstackTrend.description,
      },
    ];

    // 7. Aggregate Real "Action Required" items
    // A. Unreviewed applications > 3 days
    const pendingApplications = await prisma.application.findMany({
      where: {
        job: { companyId: companyId || "" },
        status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      },
      include: {
        job: { select: { id: true, title: true } },
        applicant: { select: { id: true, name: true } },
      },
      orderBy: { appliedAt: "asc" },
      take: 10,
    });

    const slaWarnings = pendingApplications.filter((a) => a.appliedAt <= threeDaysAgo);
    const slaBreaches = pendingApplications.filter((a) => a.appliedAt <= sevenDaysAgo);

    // B. Expiring Jobs (> 27 days old)
    const twentySevenDaysAgo = new Date(now.getTime() - 27 * 24 * 60 * 60 * 1000);
    const expiringJobs = activeJobs.filter((j) => j.createdAt <= twentySevenDaysAgo);

    // C. Overdue Interview Feedback (> 24h past interview without status resolution)
    const pastInterviews = await prisma.interview.findMany({
      where: {
        application: { job: { companyId: companyId || "" } },
        scheduledAt: { lte: twentyFourHoursAgo },
        status: "PENDING",
      },
      include: {
        application: {
          include: {
            applicant: { select: { name: true } },
            job: { select: { title: true } },
          },
        },
      },
      take: 5,
    });

    // D. Upcoming interviews (next 48h)
    const upcomingInterviews = await prisma.interview.findMany({
      where: {
        application: { job: { companyId: companyId || "" } },
        scheduledAt: { gte: now, lte: fortyEightHoursAhead },
      },
      include: {
        application: {
          include: {
            applicant: { select: { name: true } },
            job: { select: { title: true } },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    });

    // E. Unread Messages (> 24h)
    const unreadMessagesCount = await prisma.message.count({
      where: {
        receiverId: authUser.id,
        read: false,
        createdAt: { lte: twentyFourHoursAgo },
      },
    });

    const actionRequired = {
      pendingApplicationsCount: pendingApplications.length,
      slaWarningsCount: slaWarnings.length,
      slaBreachesCount: slaBreaches.length,
      expiringJobsCount: expiringJobs.length,
      overdueFeedbackCount: pastInterviews.length,
      upcomingInterviewsCount: upcomingInterviews.length,
      unreadMessagesCount,
      items: [
        ...(slaBreaches.length > 0
          ? [
              {
                id: "sla-breach-alert",
                type: "SLA_BREACH",
                priority: "CRITICAL",
                title: `${slaBreaches.length} Application${slaBreaches.length > 1 ? "s" : ""} Breached 7-Day Hiring SLA`,
                description: `Candidate applications for "${slaBreaches[0]?.job?.title}" have been waiting longer than 7 days without a recruiter review.`,
                ctaText: "Review Applicants",
                ctaUrl: "/recruiter/applicants",
              },
            ]
          : []),
        ...(slaWarnings.length > 0 && slaBreaches.length === 0
          ? [
              {
                id: "sla-warning-alert",
                type: "SLA_WARNING",
                priority: "IMPORTANT",
                title: `${slaWarnings.length} Application${slaWarnings.length > 1 ? "s" : ""} Approaching SLA Review Target`,
                description: `Candidates have been awaiting evaluation for over 3 days. Review now to maintain prompt candidate communication.`,
                ctaText: "Review Applicants",
                ctaUrl: "/recruiter/applicants",
              },
            ]
          : []),
        ...(pastInterviews.length > 0
          ? [
              {
                id: "overdue-feedback-alert",
                type: "INTERVIEW_FEEDBACK",
                priority: "IMPORTANT",
                title: `${pastInterviews.length} Interview Scorecard${pastInterviews.length > 1 ? "s" : ""} Overdue`,
                description: `Interviews completed over 24 hours ago are awaiting feedback submission to advance candidates in the pipeline.`,
                ctaText: "Submit Feedback",
                ctaUrl: "/recruiter/applicants",
              },
            ]
          : []),
        ...(expiringJobs.length > 0
          ? [
              {
                id: "expiring-jobs-alert",
                type: "JOB_EXPIRING",
                priority: "IMPORTANT",
                title: `"${expiringJobs[0]?.title}" Expires in 3 Days`,
                description: `Your job posting is nearing its 30-day lifecycle limit. Renew or update the position to keep receiving candidate applications.`,
                ctaText: "Manage Job",
                ctaUrl: `/jobs/${expiringJobs[0]?.id}`,
              },
            ]
          : []),
        ...(unreadMessagesCount > 0
          ? [
              {
                id: "unread-messages-alert",
                type: "UNREAD_MESSAGES",
                priority: "NORMAL",
                title: `${unreadMessagesCount} Unread Candidate Message${unreadMessagesCount > 1 ? "s" : ""}`,
                description: `You have candidate replies waiting for response in your recruitment chat inbox.`,
                ctaText: "Open Messages",
                ctaUrl: "/messages",
              },
            ]
          : []),
      ],
    };

    // 8. Generate Actionable Intelligence Cards
    const intelligenceCards = [];
    if (allMatchingCandidateIds.size > 0) {
      intelligenceCards.push({
        id: "total-matching-talent",
        priority: "IMPORTANT",
        title: `${allMatchingCandidateIds.size} Candidates Match Your Active Roles`,
        description: `We identified ${allMatchingCandidateIds.size} discoverable candidates (${allStrongCandidateIds.size} strong skill matches) matching your published requirements.`,
        ctaText: "Explore Matching Talent",
        ctaUrl: activeJobs[0]
          ? `/recruiter/candidates?title=${encodeURIComponent(activeJobs[0].title)}`
          : "/recruiter/candidates",
      });
    }

    if (allNewMatchingCandidateIds.size > 0) {
      intelligenceCards.push({
        id: "new-matching-talent",
        priority: "IMPORTANT",
        title: `${allNewMatchingCandidateIds.size} New Matching Candidates Joined This Week`,
        description: `${allNewMatchingCandidateIds.size} new candidates with verified technical skills matching your open positions registered or updated profiles in the past 7 days.`,
        ctaText: "View New Matches",
        ctaUrl: "/recruiter/candidates",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        company: user?.company ? { id: user.company.id, name: user.company.name } : null,
        overview: {
          totalActiveJobs: activeJobs.length,
          totalMatchingCandidates: allMatchingCandidateIds.size,
          strongMatches: allStrongCandidateIds.size,
          newMatchesThisWeek: allNewMatchingCandidateIds.size,
          recentlyActiveCandidates: recentlyActiveCount,
        },
        topSkills,
        talentSupplyTrends,
        jobRadarCards,
        actionRequired,
        intelligenceCards,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/recruiter/talent-radar Error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to load Talent Radar intelligence" },
      { status: 500 }
    );
  }
}
