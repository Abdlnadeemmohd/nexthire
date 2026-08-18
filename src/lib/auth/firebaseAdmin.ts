import { initializeApp, getApps, getApp, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import * as fs from "fs";
import * as path from "path";

/**
 * Safely normalizes and sanitizes the private key from environment variables.
 * Handles base64-encoded strings, escaped newlines (\\n), unescaped newlines,
 * and surrounding single or double quotes.
 */
function sanitizePrivateKey(key?: string): string | undefined {
  if (!key) return undefined;
  let cleaned = key.trim();

  // If the key is base64 encoded (common in CI/CD and Vercel environments)
  if (
    !cleaned.includes("-----BEGIN PRIVATE KEY-----") &&
    (cleaned.startsWith("LS0t") || (cleaned.includes("==") && !cleaned.includes("\n")))
  ) {
    try {
      const decoded = Buffer.from(cleaned, "base64").toString("utf-8");
      if (decoded.includes("BEGIN PRIVATE KEY")) {
        cleaned = decoded.trim();
      }
    } catch {
      // Continue with original string if base64 decoding fails
    }
  }

  // Remove surrounding quotes if present
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }

  // Replace literal escaped newlines with actual newline characters
  cleaned = cleaned.replace(/\\n/g, "\n");

  return cleaned;
}

/**
 * Attempts to parse a JSON service account string or base64-encoded JSON blob.
 */
function parseServiceAccountJson(jsonString?: string): any | null {
  if (!jsonString) return null;
  const trimmed = jsonString.trim();

  // Try direct JSON parse
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && (parsed.project_id || parsed.projectId)) {
      return parsed;
    }
  } catch {
    // Try base64 decoding first
    try {
      const decoded = Buffer.from(trimmed, "base64").toString("utf-8");
      const parsed = JSON.parse(decoded);
      if (parsed && typeof parsed === "object" && (parsed.project_id || parsed.projectId)) {
        return parsed;
      }
    } catch {
      // Not valid JSON
    }
  }

  return null;
}

interface FirebaseAdminStatus {
  isConfigured: boolean;
  projectId?: string;
  credentialSource?: string;
  initError?: string;
}

let adminStatus: FirebaseAdminStatus = {
  isConfigured: false,
};

/**
 * Initializes and returns the official Firebase Admin Auth instance.
 * Resolves credentials in strict order of preference:
 * 1. FIREBASE_SERVICE_ACCOUNT (JSON string / Base64)
 * 2. FIREBASE_SERVICE_ACCOUNT_KEY (JSON string / Base64)
 * 3. FIREBASE_CONFIG (JSON string / Base64)
 * 4. Individual server-side env vars: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * 5. Local firebase-service-account.json (Development environment only)
 */
export function getFirebaseAdminAuth(): Auth {
  if (getApps().length === 0) {
    let app: App | null = null;
    let resolvedProjectId: string | undefined = undefined;
    let credentialSource: string | undefined = undefined;

    // 1. Check FIREBASE_SERVICE_ACCOUNT env variable (JSON string or Base64)
    const sa1 = parseServiceAccountJson(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (sa1 && (sa1.project_id || sa1.projectId) && (sa1.private_key || sa1.privateKey)) {
      try {
        const projectId = sa1.project_id || sa1.projectId;
        const clientEmail = sa1.client_email || sa1.clientEmail;
        const privateKey = sanitizePrivateKey(sa1.private_key || sa1.privateKey);

        if (projectId && clientEmail && privateKey) {
          app = initializeApp({
            credential: cert({ projectId, clientEmail, privateKey }),
            projectId,
          });
          resolvedProjectId = projectId;
          credentialSource = "FIREBASE_SERVICE_ACCOUNT";
        }
      } catch (err: any) {
        console.warn("[Firebase Admin] Error initializing with FIREBASE_SERVICE_ACCOUNT:", err?.message || err);
      }
    }

    // 2. Check FIREBASE_SERVICE_ACCOUNT_KEY env variable (JSON string or Base64)
    if (!app) {
      const sa2 = parseServiceAccountJson(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      if (sa2 && (sa2.project_id || sa2.projectId) && (sa2.private_key || sa2.privateKey)) {
        try {
          const projectId = sa2.project_id || sa2.projectId;
          const clientEmail = sa2.client_email || sa2.clientEmail;
          const privateKey = sanitizePrivateKey(sa2.private_key || sa2.privateKey);

          if (projectId && clientEmail && privateKey) {
            app = initializeApp({
              credential: cert({ projectId, clientEmail, privateKey }),
              projectId,
            });
            resolvedProjectId = projectId;
            credentialSource = "FIREBASE_SERVICE_ACCOUNT_KEY";
          }
        } catch (err: any) {
          console.warn("[Firebase Admin] Error initializing with FIREBASE_SERVICE_ACCOUNT_KEY:", err?.message || err);
        }
      }
    }

    // 3. Check FIREBASE_CONFIG env variable (JSON string or Base64)
    if (!app) {
      const sa3 = parseServiceAccountJson(process.env.FIREBASE_CONFIG);
      if (sa3 && (sa3.project_id || sa3.projectId) && (sa3.private_key || sa3.privateKey)) {
        try {
          const projectId = sa3.project_id || sa3.projectId;
          const clientEmail = sa3.client_email || sa3.clientEmail;
          const privateKey = sanitizePrivateKey(sa3.private_key || sa3.privateKey);

          if (projectId && clientEmail && privateKey) {
            app = initializeApp({
              credential: cert({ projectId, clientEmail, privateKey }),
              projectId,
            });
            resolvedProjectId = projectId;
            credentialSource = "FIREBASE_CONFIG";
          }
        } catch (err: any) {
          console.warn("[Firebase Admin] Error initializing with FIREBASE_CONFIG:", err?.message || err);
        }
      }
    }

    // 4. Check individual server-side environment variables
    if (!app) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const rawPrivateKey = sanitizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

      if (projectId && clientEmail && rawPrivateKey) {
        try {
          app = initializeApp({
            credential: cert({
              projectId,
              clientEmail,
              privateKey: rawPrivateKey,
            }),
            projectId,
          });
          resolvedProjectId = projectId;
          credentialSource = "INDIVIDUAL_ENV_VARS";
        } catch (err: any) {
          console.warn("[Firebase Admin] Error initializing with individual env vars:", err?.message || err);
        }
      }
    }

    // 5. Check local firebase-service-account.json file on disk (Development only)
    if (!app && process.env.NODE_ENV !== "production") {
      try {
        const serviceAccountPath = path.join(process.cwd(), "firebase-service-account.json");
        if (fs.existsSync(serviceAccountPath)) {
          const fileContent = fs.readFileSync(serviceAccountPath, "utf8");
          const localSa = JSON.parse(fileContent);
          if (localSa && localSa.project_id && localSa.private_key) {
            const privateKey = sanitizePrivateKey(localSa.private_key);
            if (privateKey) {
              app = initializeApp({
                credential: cert({
                  projectId: localSa.project_id,
                  clientEmail: localSa.client_email,
                  privateKey,
                }),
                projectId: localSa.project_id,
              });
              resolvedProjectId = localSa.project_id;
              credentialSource = "LOCAL_FILE";
            }
          }
        }
      } catch (err: any) {
        console.warn("[Firebase Admin] Notice: Local service account file not loaded:", err?.message || err);
      }
    }

    if (app && resolvedProjectId) {
      adminStatus = {
        isConfigured: true,
        projectId: resolvedProjectId,
        credentialSource,
      };
      if (process.env.NODE_ENV !== "production") {
        console.log(`[Firebase Admin] Initialized successfully with ${credentialSource} (Project: ${resolvedProjectId})`);
      }
    } else {
      adminStatus = {
        isConfigured: false,
        initError: "Server-side Firebase Admin credentials not found or incomplete.",
      };
      // Fallback app initialization with project ID only to allow static builds to proceed
      const fallbackProjectId = process.env.FIREBASE_PROJECT_ID || "nexthire-fallback";
      try {
        app = initializeApp({ projectId: fallbackProjectId });
      } catch {
        // App already initialized
      }
    }
  }

  const defaultApp = getApps().length > 0 ? getApp() : undefined;
  return getAuth(defaultApp);
}

/**
 * Returns diagnostic configuration status without exposing any secrets.
 */
export function getFirebaseAdminStatus(): FirebaseAdminStatus {
  return { ...adminStatus };
}

/**
 * Authoritative ID Token Verifier using official Firebase Admin SDK.
 * Fails safely with a clear configuration diagnostic error if credentials are not configured.
 */
export async function verifyServerFirebaseIdToken(idToken: string, checkRevoked?: boolean) {
  const auth = getFirebaseAdminAuth();
  if (!adminStatus.isConfigured && getApps().length === 0) {
    throw new Error(
      "Firebase Admin credentials are not configured on the server. Please configure FIREBASE_SERVICE_ACCOUNT or FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY."
    );
  }
  return auth.verifyIdToken(idToken, checkRevoked);
}

// Export lazy getter proxy for backward compatibility
export const firebaseAdminAuth = {
  verifyIdToken: async (token: string, checkRevoked?: boolean) => {
    return verifyServerFirebaseIdToken(token, checkRevoked);
  },
};
