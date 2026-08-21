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
   * Validates remote URLs to prevent Server-Side Request Forgery (SSRF).
   * Blocks localhost, private IP ranges (RFC 1918), link-local (169.254.x.x),
   * cloud metadata services, and internal domains.
   */
  isSafeRemoteUrl(urlStr: string): boolean {
    try {
      const parsed = new URL(urlStr);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return false;
      }

      const hostname = parsed.hostname.toLowerCase();

      // Block local/loopback and metadata hostnames
      const blockedHostnames = [
        "localhost",
        "127.0.0.1",
        "::1",
        "0.0.0.0",
        "169.254.169.254",
        "metadata.google.internal",
        "metadata.platform.internal",
        "instance-data",
      ];
      if (blockedHostnames.includes(hostname)) {
        return false;
      }

      // Block private IP ranges (IPv4)
      if (
        /^127\./.test(hostname) ||
        /^10\./.test(hostname) ||
        /^192\.168\./.test(hostname) ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
        /^169\.254\./.test(hostname) ||
        /^0\./.test(hostname)
      ) {
        return false;
      }

      // Block internal domain suffixes
      if (
        hostname.endsWith(".internal") ||
        hostname.endsWith(".local") ||
        hostname.endsWith(".lan") ||
        hostname.endsWith(".localdomain")
      ) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  },

  /**
   * Sanitizes local paths to prevent directory traversal attacks
   */
  sanitizeLocalPath(pathStr: string): string | null {
    if (!pathStr || pathStr.includes("..") || pathStr.includes("\0")) {
      return null;
    }
    return pathStr.replace(/^\/+/, "");
  },

  /**
   * Audit log interface compatibility helper (live records fetched from Neon via /api/admin/audit)
   */
  getInitialAuditLogs(): AuditLogEntry[] {
    return [];
  },
};
