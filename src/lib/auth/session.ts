import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AuthUser, UserRole } from "@/lib/auth";

export const SESSION_COOKIE_NAME = "nexthire_auth_session";
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface SessionPayload {
  token: string;
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Creates an authoritative database session record in PostgreSQL.
 * Throws if the database is unavailable so phantom sessions are never issued.
 */
export async function createSession(
  userId: string
): Promise<{ token: string; expiresAt: Date }> {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  return { token: rawToken, expiresAt };
}

/**
 * Encodes session data for the HttpOnly cookie so Edge middleware can perform fast RBAC
 * and server routes can validate the database token.
 */
export function formatSessionCookie(payload: SessionPayload): string {
  return encodeURIComponent(JSON.stringify(payload));
}

/**
 * Parses and validates an authenticated user session.
 */
export async function getAuthenticatedUser(requestOrToken?: string | Request): Promise<AuthUser | null> {
  let cookieVal: string | undefined;

  if (typeof requestOrToken === "string") {
    cookieVal = requestOrToken;
  } else if (requestOrToken && typeof requestOrToken === "object" && "headers" in requestOrToken) {
    const rawCookie = (requestOrToken as Request).headers.get("cookie") || "";
    const match = rawCookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]*)`));
    cookieVal = match ? match[1] : undefined;
  }

  if (!cookieVal) {
    try {
      const cookieStore = cookies();
      cookieVal = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    } catch {
      cookieVal = undefined;
    }
  }

  if (!cookieVal) return null;

  // Extract raw token from cookie value (handles both structured JSON and plain token strings)
  let rawToken = cookieVal;

  try {
    const decoded = decodeURIComponent(cookieVal);
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed === "object" && parsed.token) {
      rawToken = parsed.token;
    }
  } catch {
    // If not JSON, rawToken is used directly
  }

  if (!rawToken || typeof rawToken !== "string") return null;

  const tokenHash = hashToken(rawToken);

  try {
    const dbSession = await prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            company: true,
            profile: true,
          },
        },
      },
    });

    if (!dbSession || dbSession.isRevoked || dbSession.expiresAt <= new Date()) {
      return null;
    }

    if (!dbSession.user) {
      return null;
    }

    // Update lastUsedAt asynchronously
    prisma.session
      .update({
        where: { id: dbSession.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {});

    const u = dbSession.user;
    const { getUserVerificationStatus } = await import("@/lib/auth/verification");
    const verificationStatus = await getUserVerificationStatus(u.id, u.role);

    let subscriptionTier = "TRIAL";
    try {
      if (u.role === "RECRUITER") {
        const { getRecruiterEntitlements } = await import("@/lib/billing/entitlements");
        const entitlements = await getRecruiterEntitlements(u.id);
        subscriptionTier = entitlements.planTier;
      }
    } catch {}

    const isVerified = verificationStatus === "VERIFIED";

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role as UserRole,
      avatar:
        u.avatar ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
      status: isVerified ? "VERIFIED" : "PENDING",
      verificationStatus,
      isVerified,
      subscriptionTier,
      companyId: u.companyId || u.company?.id || undefined,
      companyName: u.company?.name,
      headline: u.headline || undefined,
      country: u.location || undefined,
      bio: u.bio || undefined,
    };
  } catch (err) {
    console.error("[Session Auth Error]:", err);
    return null;
  }
}

export async function revokeSession(token: string): Promise<void> {
  if (!token) return;

  let rawToken = token;
  try {
    const decoded = decodeURIComponent(token);
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed === "object" && parsed.token) {
      rawToken = parsed.token;
    }
  } catch {
    // Plain token
  }

  const tokenHash = hashToken(rawToken);
  try {
    await prisma.session.updateMany({
      where: { tokenHash },
      data: { isRevoked: true },
    });
  } catch (err) {
    console.error("[Session Revoke Error]:", err);
  }
}
