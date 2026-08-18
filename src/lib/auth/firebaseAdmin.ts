import { initializeApp, getApps, getApp, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import * as fs from "fs";
import * as path from "path";

/**
 * Safely normalizes and sanitizes the private key from environment variables.
 * Handles base64-encoded strings, escaped newlines (\\n, \\r\\n), unescaped newlines,
 * Windows CRLF, and surrounding single or double quotes.
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
  cleaned = cleaned.replace(/^["']|["']$/g, "").trim();

  // Replace all escaped variants of newlines with actual newline characters
  cleaned = cleaned
    .replace(/\\\\r\\\\n/g, "\n")
    .replace(/\\\\n/g, "\n")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n");

  return cleaned.trim();
}

/**
 * Attempts to parse a JSON service account string, escaped JSON string, or base64-encoded JSON blob.
 */
function parseServiceAccountJson(jsonString?: string): any | null {
  if (!jsonString) return null;
  let trimmed = jsonString.trim();

  // Remove outer wrapping quotes if double-stringified
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.substring(1, trimmed.length - 1).trim();
  }

  // Try direct JSON parse
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && (parsed.project_id || parsed.projectId)) {
      return parsed;
    }
  } catch {
    // Try unescaping literal \n and quotes if stringified JSON
    try {
      const unescaped = trimmed.replace(/\\n/g, "\n").replace(/\\"/g, '"');
      const parsed = JSON.parse(unescaped);
      if (parsed && typeof parsed === "object" && (parsed.project_id || parsed.projectId)) {
        return parsed;
      }
    } catch {
      // Try base64 decoding
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
  }

  return null;
}

export interface FirebaseAdminStatus {
  isConfigured: boolean;
  projectId?: string;
  credentialSource?: string;
  hasPrivateKey: boolean;
  hasClientEmail: boolean;
  initError?: string;
}

let adminStatus: FirebaseAdminStatus = {
  isConfigured: false,
  hasPrivateKey: false,
  hasClientEmail: false,
};

const APP_NAME = "NEXTHIRE_FIREBASE_ADMIN";

/**
 * Resolves server-side credentials and initializes Firebase Admin App.
 * Strict credential search order:
 * 1. FIREBASE_SERVICE_ACCOUNT (JSON string / Base64)
 * 2. FIREBASE_SERVICE_ACCOUNT_KEY (JSON string / Base64)
 * 3. FIREBASE_CONFIG (JSON string / Base64)
 * 4. Individual server-side env vars: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * 5. Local firebase-service-account.json (Development environment only)
 */
function resolveAndInitAdminApp(): App | null {
  const existingApps = getApps();
  const existingApp = existingApps.find((a) => a.name === APP_NAME) || existingApps[0];

  if (existingApp && adminStatus.isConfigured) {
    return existingApp;
  }

  let app: App | null = null;
  let resolvedProjectId: string | undefined = undefined;
  let credentialSource: string | undefined = undefined;

  // 1. Check FIREBASE_SERVICE_ACCOUNT env variable
  const sa1 = parseServiceAccountJson(process.env.FIREBASE_SERVICE_ACCOUNT);
  if (sa1 && (sa1.project_id || sa1.projectId) && (sa1.private_key || sa1.privateKey)) {
    try {
      const projectId = sa1.project_id || sa1.projectId;
      const clientEmail = sa1.client_email || sa1.clientEmail;
      const privateKey = sanitizePrivateKey(sa1.private_key || sa1.privateKey);

      if (projectId && clientEmail && privateKey) {
        app = initializeApp(
          {
            credential: cert({ projectId, clientEmail, privateKey }),
            projectId,
          },
          APP_NAME
        );
        resolvedProjectId = projectId;
        credentialSource = "FIREBASE_SERVICE_ACCOUNT";
      }
    } catch (err: any) {
      console.warn("[Firebase Admin] Init warning (FIREBASE_SERVICE_ACCOUNT):", err?.message || err);
    }
  }

  // 2. Check FIREBASE_SERVICE_ACCOUNT_KEY env variable
  if (!app) {
    const sa2 = parseServiceAccountJson(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    if (sa2 && (sa2.project_id || sa2.projectId) && (sa2.private_key || sa2.privateKey)) {
      try {
        const projectId = sa2.project_id || sa2.projectId;
        const clientEmail = sa2.client_email || sa2.clientEmail;
        const privateKey = sanitizePrivateKey(sa2.private_key || sa2.privateKey);

        if (projectId && clientEmail && privateKey) {
          app = initializeApp(
            {
              credential: cert({ projectId, clientEmail, privateKey }),
              projectId,
            },
            APP_NAME
          );
          resolvedProjectId = projectId;
          credentialSource = "FIREBASE_SERVICE_ACCOUNT_KEY";
        }
      } catch (err: any) {
        console.warn("[Firebase Admin] Init warning (FIREBASE_SERVICE_ACCOUNT_KEY):", err?.message || err);
      }
    }
  }

  // 3. Check FIREBASE_CONFIG env variable
  if (!app) {
    const sa3 = parseServiceAccountJson(process.env.FIREBASE_CONFIG);
    if (sa3 && (sa3.project_id || sa3.projectId) && (sa3.private_key || sa3.privateKey)) {
      try {
        const projectId = sa3.project_id || sa3.projectId;
        const clientEmail = sa3.client_email || sa3.clientEmail;
        const privateKey = sanitizePrivateKey(sa3.private_key || sa3.privateKey);

        if (projectId && clientEmail && privateKey) {
          app = initializeApp(
            {
              credential: cert({ projectId, clientEmail, privateKey }),
              projectId,
            },
            APP_NAME
          );
          resolvedProjectId = projectId;
          credentialSource = "FIREBASE_CONFIG";
        }
      } catch (err: any) {
        console.warn("[Firebase Admin] Init warning (FIREBASE_CONFIG):", err?.message || err);
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
        app = initializeApp(
          {
            credential: cert({
              projectId,
              clientEmail,
              privateKey: rawPrivateKey,
            }),
            projectId,
          },
          APP_NAME
        );
        resolvedProjectId = projectId;
        credentialSource = "INDIVIDUAL_ENV_VARS";
      } catch (err: any) {
        console.warn("[Firebase Admin] Init warning (INDIVIDUAL_ENV_VARS):", err?.message || err);
      }
    }
  }

  // 5. Check local service account JSON files on disk
  if (!app) {
    try {
      const candidateFiles = [
        "firebase-service-account.json",
        "nexthire-6cde3-firebase-adminsdk-fbsvc-87f50b0eda.json",
      ];

      // Also check GOOGLE_APPLICATION_CREDENTIALS if provided
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        candidateFiles.unshift(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      }

      // Also search root directory for any *firebase-adminsdk*.json
      try {
        const rootFiles = fs.readdirSync(process.cwd());
        for (const file of rootFiles) {
          if (file.endsWith(".json") && file.includes("firebase-adminsdk") && !candidateFiles.includes(file)) {
            candidateFiles.push(file);
          }
        }
      } catch {
        // Continue with candidate list
      }

      for (const filename of candidateFiles) {
        const serviceAccountPath = path.isAbsolute(filename)
          ? filename
          : path.join(process.cwd(), filename);

        if (fs.existsSync(serviceAccountPath)) {
          const fileContent = fs.readFileSync(serviceAccountPath, "utf8");
          const localSa = JSON.parse(fileContent);
          if (localSa && (localSa.project_id || localSa.projectId) && (localSa.private_key || localSa.privateKey)) {
            const privateKey = sanitizePrivateKey(localSa.private_key || localSa.privateKey);
            const projectId = localSa.project_id || localSa.projectId;
            const clientEmail = localSa.client_email || localSa.clientEmail;

            if (projectId && clientEmail && privateKey) {
              app = initializeApp(
                {
                  credential: cert({
                    projectId,
                    clientEmail,
                    privateKey,
                  }),
                  projectId,
                },
                APP_NAME
              );
              resolvedProjectId = projectId;
              credentialSource = `LOCAL_FILE (${path.basename(filename)})`;
              break;
            }
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
      hasPrivateKey: true,
      hasClientEmail: true,
    };
    if (process.env.NODE_ENV !== "production") {
      console.log(`[Firebase Admin] Initialized with ${credentialSource} (Project: ${resolvedProjectId})`);
    }
    return app;
  }

  adminStatus = {
    isConfigured: false,
    hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY || !!process.env.FIREBASE_SERVICE_ACCOUNT,
    hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    initError: "Server-side Firebase Admin credentials not found or incomplete.",
  };

  return null;
}

/**
 * Initializes and returns the official Firebase Admin Auth instance.
 */
export function getFirebaseAdminAuth(): Auth | null {
  const app = resolveAndInitAdminApp();
  if (!app) return null;
  return getAuth(app);
}

/**
 * Returns safe diagnostic configuration status without exposing any secrets.
 */
export function getFirebaseAdminStatus(): FirebaseAdminStatus {
  // Trigger resolution to return fresh status
  resolveAndInitAdminApp();
  return { ...adminStatus };
}

/**
 * Authoritative ID Token Verifier using official Firebase Admin SDK.
 * Fails safely with clear typed diagnostic categories.
 */
export async function verifyServerFirebaseIdToken(idToken: string, checkRevoked?: boolean) {
  const auth = getFirebaseAdminAuth();
  if (!auth || !adminStatus.isConfigured) {
    const error: any = new Error(
      "Firebase Admin server credentials are not configured on the server. Please configure FIREBASE_SERVICE_ACCOUNT or FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in your hosting environment."
    );
    error.category = "FIREBASE_ADMIN_NOT_CONFIGURED";
    throw error;
  }

  try {
    return await auth.verifyIdToken(idToken, checkRevoked);
  } catch (err: any) {
    const errMsg = err?.message || "";
    if (errMsg.includes("aud") || errMsg.includes("audience") || err?.code === "auth/argument-error") {
      const error: any = new Error("Firebase client and server project ID mismatch.");
      error.category = "FIREBASE_PROJECT_MISMATCH";
      throw error;
    }
    if (err?.code === "auth/id-token-expired") {
      const error: any = new Error("Firebase authentication token has expired. Please sign in again.");
      error.category = "TOKEN_EXPIRED";
      throw error;
    }
    const error: any = new Error(errMsg || "Invalid Firebase authentication token.");
    error.category = "TOKEN_INVALID";
    throw error;
  }
}

// Export lazy getter proxy for backward compatibility
export const firebaseAdminAuth = {
  verifyIdToken: async (token: string, checkRevoked?: boolean) => {
    return verifyServerFirebaseIdToken(token, checkRevoked);
  },
};
