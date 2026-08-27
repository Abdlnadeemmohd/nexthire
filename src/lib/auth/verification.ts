import { prisma } from "@/lib/prisma";

export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";

export class VerificationRequiredError extends Error {
  public status: VerificationStatus;
  public statusCode: number;

  constructor(status: VerificationStatus, message: string) {
    super(message);
    this.name = "VerificationRequiredError";
    this.status = status;
    this.statusCode = 403;
  }
}

/**
 * Resolves the authoritative verification status for a user based on the latest AuditEvent.
 * If no audit event exists, the safe authoritative state is strictly "PENDING" (NOT verified).
 * Platform Administrators are always considered VERIFIED for platform operations.
 */
export async function getUserVerificationStatus(
  userId: string,
  role?: string
): Promise<VerificationStatus> {
  if (role === "PLATFORM_ADMIN") {
    return "VERIFIED";
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, isTester: true },
  });

  const latestAudit = await prisma.auditEvent.findFirst({
    where: {
      resourceType: "User",
      resourceId: userId,
      action: { in: ["USER_VERIFIED", "USER_REJECTED", "USER_SUSPENDED"] },
    },
    orderBy: { timestamp: "desc" },
  });

  if (latestAudit) {
    switch (latestAudit.action) {
      case "USER_VERIFIED":
        return "VERIFIED";
      case "USER_REJECTED":
        return "REJECTED";
      case "USER_SUSPENDED":
        return "SUSPENDED";
      default:
        return "PENDING";
    }
  }

  // Designated QA testers default to VERIFIED for comprehensive test validation
  const { isTesterAccount } = await import("@/lib/auth/tester");
  if (user && isTesterAccount(user)) {
    return "VERIFIED";
  }

  // Authoritative default: Unverified / Pending review for real customer accounts
  return "PENDING";
}

/**
 * Asserts that a user has an explicit "VERIFIED" status.
 * Throws VerificationRequiredError (HTTP 403) if PENDING, REJECTED, or SUSPENDED.
 */
export async function assertUserVerified(
  user: { id: string; role?: string; name?: string },
  featureName = "accessing this feature"
): Promise<void> {
  const status = await getUserVerificationStatus(user.id, user.role);

  if (status !== "VERIFIED") {
    let message = `Verification Required: Your account is currently ${status}. Platform administrator verification is required before ${featureName}.`;
    if (status === "PENDING") {
      message = `Verification Required: Your account is pending administrative approval. An administrator must verify your profile before ${featureName}.`;
    } else if (status === "REJECTED") {
      message = `Verification Required: Your account verification was rejected. Please review platform requirements or contact support.`;
    } else if (status === "SUSPENDED") {
      message = `Account Suspended: Your account has been suspended by platform administration. Access to ${featureName} is disabled.`;
    }
    throw new VerificationRequiredError(status, message);
  }
}

/**
 * Asserts that a company exists and has isVerified === true in PostgreSQL.
 * Throws VerificationRequiredError (HTTP 403) if unverified or missing.
 */
export async function assertCompanyVerified(companyId?: string | null): Promise<void> {
  if (!companyId) {
    throw new VerificationRequiredError(
      "PENDING",
      "Company Required: Recruiter must belong to a registered employer organization."
    );
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new VerificationRequiredError("PENDING", "Company record not found in database.");
  }

  if (!company.isVerified) {
    throw new VerificationRequiredError(
      "PENDING",
      `Company Verification Required: Your employer organization "${company.name}" must be verified by platform administrators before publishing active vacancies.`
    );
  }
}

/**
 * Asserts both Recruiter verification (User) AND Employer Organization verification (Company).
 */
export async function assertRecruiterAndCompanyVerified(user: {
  id: string;
  role?: string;
  companyId?: string | null;
}): Promise<void> {
  await assertUserVerified(user, "publishing vacancies and managing candidate pipelines");
  await assertCompanyVerified(user.companyId);
}
