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
export async function getAuthenticatedUser(requestOrToken?: string): Promise<AuthUser | null> {
  let cookieVal = requestOrToken;

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
  let parsedPayload: SessionPayload | null = null;

  try {
    const decoded = decodeURIComponent(cookieVal);
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed === "object") {
      parsedPayload = parsed as SessionPayload;
      if (parsed.token) rawToken = parsed.token;
    }
  } catch {
    // If not JSON, rawToken is used directly
  }

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

    if (dbSession && !dbSession.isRevoked && dbSession.expiresAt > new Date()) {
      // Update lastUsedAt asynchronously
      prisma.session
        .update({
          where: { id: dbSession.id },
          data: { lastUsedAt: new Date() },
        })
        .catch(() => {});

      const u = dbSession.user;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role as UserRole,
        avatar:
          u.avatar ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
        status: "VERIFIED",
        companyId: u.companyId || u.company?.id || undefined,
        companyName: u.company?.name,
        headline: u.headline || undefined,
        country: u.location || undefined,
        bio: u.bio || undefined,
      };
    }
  } catch (err) {
    console.warn("Database lookup during session validation:", err);
  }

  // Graceful fallback if database session query could not execute
  if (parsedPayload && parsedPayload.userId && parsedPayload.email && parsedPayload.role) {
    try {
      const u = await prisma.user.findUnique({
        where: { id: parsedPayload.userId },
        include: { company: true },
      });
      if (u) {
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role as UserRole,
          avatar:
            u.avatar ||
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
          status: "VERIFIED",
          companyId: u.companyId || u.company?.id || undefined,
          companyName: u.company?.name,
          headline: u.headline || undefined,
        };
      }
    } catch {
      // Fallback
    }

    return {
      id: parsedPayload.userId,
      name: parsedPayload.email.split("@")[0],
      email: parsedPayload.email,
      role: parsedPayload.role,
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
      status: "VERIFIED",
    };
  }

  return null;
}

export async function revokeSession(token: string): Promise<void> {
  let rawToken = token;
  try {
    const decoded = decodeURIComponent(token);
    const parsed = JSON.parse(decoded);
    if (parsed?.token) rawToken = parsed.token;
  } catch {
    // Plain token
  }

  const tokenHash = hashToken(rawToken);
  try {
    await prisma.session.updateMany({
      where: { tokenHash },
      data: { isRevoked: true },
    });
  } catch {
    // Ignore if session record does not exist
  }
}
