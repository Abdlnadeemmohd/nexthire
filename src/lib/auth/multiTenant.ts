import { AuthUser } from "@/lib/auth";

export class CompanyAccessError extends Error {
  constructor(message: string = "Forbidden: Access restricted to assigned company tenant") {
    super(message);
    this.name = "CompanyAccessError";
  }
}

/**
 * P0 Multi-Tenant Ownership Assertion (UUID Based)
 * Strictly verifies companyId UUID ownership. Never relies on companyName strings.
 */
export function assertCompanyAccess(
  authUser: AuthUser | null,
  targetCompanyId?: string | null
): void {
  if (!authUser) {
    throw new CompanyAccessError("Unauthorized: Missing session");
  }

  // Platform Admins retain cross-tenant administrative access
  if (authUser.role === "PLATFORM_ADMIN") return;

  if (authUser.role === "RECRUITER") {
    if (!targetCompanyId) return; // Unassigned resource

    const userCompanyId = authUser.companyId;

    // Strict UUID multi-tenant verification
    if (userCompanyId && targetCompanyId !== userCompanyId) {
      throw new CompanyAccessError(
        `Forbidden: Recruiter with company ID '${userCompanyId}' cannot access company '${targetCompanyId}' resources.`
      );
    }
  }
}
