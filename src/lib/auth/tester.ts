/**
 * Centralized QA & Live Test Account Policy & Utilities.
 *
 * Provides server-authoritative identification of:
 * - Designated QA/testing accounts (jobseeker@nexthire.cloud, recruiter@nexthire.cloud, owner@nexthire.cloud)
 * - Live realistic user testing fixtures (jb1@nexthire.cloud, rc1@nexthire.cloud, rcm@nexthire.cloud)
 * - Normal production user accounts (such as Gmail accounts).
 */

export const CANONICAL_TESTER_EMAILS = [
  "jobseeker@nexthire.cloud",
  "recruiter@nexthire.cloud",
  "owner@nexthire.cloud",
] as const;

export const CANONICAL_LIVE_TEST_EMAILS = [
  "jb1@nexthire.cloud",
  "rc1@nexthire.cloud",
  "rcm@nexthire.cloud",
] as const;

export const QA_TEST_DEFAULT_PASSWORD = "Password123!";

export type AccountType = "QA_TESTER" | "NORMAL";

/**
 * Server-authoritative check for whether a user or email is a designated QA tester.
 */
export function isTesterAccount(
  userOrEmail:
    | { id?: string; email?: string; isTester?: boolean }
    | string
    | null
    | undefined
): boolean {
  if (!userOrEmail) return false;
  if (typeof userOrEmail === "string") {
    const normalized = userOrEmail.toLowerCase().trim();
    return CANONICAL_TESTER_EMAILS.includes(normalized as any);
  }
  if (userOrEmail.isTester === true) return true;
  if (userOrEmail.email) {
    const normalized = userOrEmail.email.toLowerCase().trim();
    return CANONICAL_TESTER_EMAILS.includes(normalized as any);
  }
  return false;
}

/**
 * Returns true if the account is one of the designated live testing fixtures.
 */
export function isLiveTestAccount(
  userOrEmail: { email?: string } | string | null | undefined
): boolean {
  if (!userOrEmail) return false;
  const email = typeof userOrEmail === "string" ? userOrEmail : userOrEmail.email;
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return CANONICAL_LIVE_TEST_EMAILS.includes(normalized as any);
}

/**
 * Returns the account classification: QA_TESTER or NORMAL.
 */
export function getAccountType(
  userOrEmail:
    | { id?: string; email?: string; isTester?: boolean }
    | string
    | null
    | undefined
): AccountType {
  return isTesterAccount(userOrEmail) ? "QA_TESTER" : "NORMAL";
}

/**
 * Checks if an account has full permission to test all subscription tiers bidirectionally.
 */
export function canTestAllSubscriptionTiers(
  userOrEmail:
    | { id?: string; email?: string; isTester?: boolean; role?: string }
    | string
    | null
    | undefined
): boolean {
  return isTesterAccount(userOrEmail);
}
