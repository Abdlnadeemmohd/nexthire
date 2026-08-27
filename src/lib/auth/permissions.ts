import { AuthUser, UserRole } from "@/lib/auth";

export type Permission =
  | "job:create"
  | "job:edit"
  | "job:delete"
  | "job:publish"
  | "job:close"
  | "application:view"
  | "application:update"
  | "application:reject"
  | "application:hire"
  | "candidate:view"
  | "candidate:message"
  | "company:view"
  | "company:edit"
  | "company:verify"
  | "billing:view"
  | "billing:manage"
  | "audit:view"
  | "user:suspend";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  JOB_SEEKER: [
    "job:create",
    "application:view",
    "company:view",
  ],
  RECRUITER: [
    "job:create",
    "job:edit",
    "job:publish",
    "job:close",
    "application:view",
    "application:update",
    "application:reject",
    "application:hire",
    "candidate:view",
    "candidate:message",
    "company:view",
    "company:edit",
    "billing:view",
    "billing:manage",
  ],
  RECRUITER_MANAGER: [
    "job:create",
    "job:edit",
    "job:publish",
    "job:close",
    "application:view",
    "application:update",
    "application:reject",
    "application:hire",
    "candidate:view",
    "candidate:message",
    "company:view",
    "company:edit",
    "billing:view",
    "billing:manage",
    "audit:view",
  ],
  COMPANY_ADMIN: [
    "job:create",
    "job:edit",
    "job:delete",
    "job:publish",
    "job:close",
    "application:view",
    "application:update",
    "application:reject",
    "application:hire",
    "candidate:view",
    "candidate:message",
    "company:view",
    "company:edit",
    "company:verify",
    "billing:view",
    "billing:manage",
    "audit:view",
  ],
  PLATFORM_ADMIN: [
    "job:create",
    "job:edit",
    "job:delete",
    "job:publish",
    "job:close",
    "application:view",
    "application:update",
    "application:reject",
    "application:hire",
    "candidate:view",
    "candidate:message",
    "company:view",
    "company:edit",
    "company:verify",
    "billing:view",
    "billing:manage",
    "audit:view",
    "user:suspend",
  ],
};

export function hasPermission(
  user: AuthUser | null,
  permission: Permission,
  resourceCompanyId?: string
): boolean {
  if (!user) return false;

  // Platform Admin override
  if (user.role === "PLATFORM_ADMIN") return true;

  const allowedPermissions = ROLE_PERMISSIONS[user.role] || [];
  if (!allowedPermissions.includes(permission)) return false;

  // Multi-tenant company UUID check for recruiters
  if (user.role === "RECRUITER" && resourceCompanyId) {
    if (user.companyId && user.companyId !== resourceCompanyId) {
      return false;
    }
  }

  return true;
}
