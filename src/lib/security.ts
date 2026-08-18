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
   * Audit log interface compatibility helper (live records fetched from Neon via /api/admin/audit)
   */
  getInitialAuditLogs(): AuditLogEntry[] {
    return [];
  },
};
