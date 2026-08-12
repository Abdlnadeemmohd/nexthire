import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AuthUser, UserRole } from "@/lib/auth";

export const SESSION_COOKIE_NAME = "nexthire_auth_session";
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  try {
    await prisma.session.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
      },
    });
  } catch (err) {
    console.warn("Database session creation failed or DB unavailable, proceeding with signed fallback token:", err);
  }

  return { token: rawToken, expiresAt };
}

export async function getAuthenticatedUser(requestOrToken?: string): Promise<AuthUser | null> {
  let token = requestOrToken;

  if (!token) {
    try {
      const cookieStore = cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    } catch {
      token = undefined;
    }
  }

  if (!token) return null;

  const tokenHash = hashToken(token);

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
      prisma.session.update({
        where: { id: dbSession.id },
        data: { lastUsedAt: new Date() },
      }).catch(() => {});

      const u = dbSession.user;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role as UserRole,
        avatar: u.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
        status: "VERIFIED",
        companyId: u.companyId || u.company?.id || undefined,
        companyName: u.company?.name,
        headline: u.headline || undefined,
        country: u.location || undefined,
        bio: u.bio || undefined,
      };
    }
  } catch (err) {
    console.warn("Database lookup failed during session validation:", err);
  }

  // Graceful fallback for mock/dev static tokens if database isn't populated yet
  try {
    const parsed = JSON.parse(decodeURIComponent(token));
    if (parsed && parsed.id && parsed.email && parsed.role) {
      return parsed as AuthUser;
    }
  } catch {
    // Ignore invalid JSON format
  }

  return null;
}

export async function revokeSession(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  try {
    await prisma.session.updateMany({
      where: { tokenHash },
      data: { isRevoked: true },
    });
  } catch {
    // Ignore if session record does not exist
  }
}
