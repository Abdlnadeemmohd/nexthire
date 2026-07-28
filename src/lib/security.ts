export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  resource: string;
  ipAddress: string;
  status: "SUCCESS" | "WARNING" | "FAILURE";
}

let activeImpersonatedUser: { email: string; role: "JOB_SEEKER" | "RECRUITER" | "PLATFORM_ADMIN" } | null = null;

export const Security = {
  /**
   * Sanitizes input strings against basic XSS script injection tags
   */
  sanitizeInput(str: string): string {
    if (!str) return "";
    return str
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/script/gi, "")
      .replace(/javascript:/gi, "");
  },

  /**
   * Generates a CSRF token
   */
  generateCSRFToken(): string {
    return `csrf-${Math.random().toString(36).substring(2)}${Date.now()}`;
  },

  /**
   * Validates Role-Based Access Control permissions
   */
  hasPermission(userRole: string, requiredRole: "JOB_SEEKER" | "RECRUITER" | "PLATFORM_ADMIN"): boolean {
    if (!userRole) return false;
    if (userRole === "PLATFORM_ADMIN") return true; // Admin has full system access
    if (userRole === "RECRUITER" && (requiredRole === "RECRUITER" || requiredRole === "JOB_SEEKER")) return true;
    return userRole === requiredRole;
  },

  /**
   * User Impersonation switcher for Platform Admins
   */
  impersonateUser(targetEmail: string, targetRole: "JOB_SEEKER" | "RECRUITER" | "PLATFORM_ADMIN") {
    activeImpersonatedUser = { email: targetEmail, role: targetRole };
  },

  getImpersonatedUser() {
    return activeImpersonatedUser;
  },

  clearImpersonation() {
    activeImpersonatedUser = null;
  },

  /**
   * Returns mock security audit logs for Platform Owner admin portal
   */
  getInitialAuditLogs(): AuditLogEntry[] {
    return [
      {
        id: "log-101",
        timestamp: new Date().toLocaleString(),
        actorEmail: "admin@nexthire.ai",
        actorRole: "PLATFORM_ADMIN",
        action: "COMPANY_VERIFIED",
        resource: "Company: Stellar Systems (c-1)",
        ipAddress: "192.168.1.10",
        status: "SUCCESS",
      },
      {
        id: "log-102",
        timestamp: new Date(Date.now() - 3600000).toLocaleString(),
        actorEmail: "sarah.recruiter@stellarsystems.com",
        actorRole: "RECRUITER",
        action: "OFFER_EXTENDED",
        resource: "Applicant: Alex Morgan (app-881)",
        ipAddress: "74.125.204.102",
        status: "SUCCESS",
      },
      {
        id: "log-103",
        timestamp: new Date(Date.now() - 7200000).toLocaleString(),
        actorEmail: "unknown@suspicious-ip.net",
        actorRole: "UNAUTHENTICATED",
        action: "FAILED_LOGIN_ATTEMPT",
        resource: "Auth Service /login",
        ipAddress: "185.220.101.5",
        status: "FAILURE",
      },
    ];
  },
};
