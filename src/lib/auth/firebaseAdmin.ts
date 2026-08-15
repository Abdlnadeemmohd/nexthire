import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import * as fs from "fs";
import * as path from "path";

/**
 * Normalizes and cleans the private key from environment variables,
 * handling escaped newlines, unescaped newlines, and surrounding quotes from Vercel.
 */
function sanitizePrivateKey(key?: string): string | undefined {
  if (!key) return undefined;
  let cleaned = key.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }
  return cleaned.replace(/\\n/g, "\n");
}

export function getFirebaseAdminAuth() {
  if (getApps().length === 0) {
    let initialized = false;

    // 1. Try loading from service account JSON file if present on disk
    try {
      const serviceAccountPath = path.join(process.cwd(), "firebase-service-account.json");
      if (fs.existsSync(serviceAccountPath)) {
        const fileContent = fs.readFileSync(serviceAccountPath, "utf8");
        const serviceAccount = JSON.parse(fileContent);
        if (serviceAccount && serviceAccount.project_id && serviceAccount.private_key) {
          initializeApp({
            credential: cert(serviceAccount),
            projectId: serviceAccount.project_id || "nexthire-6cde3",
          });
          initialized = true;
        }
      }
    } catch (e) {
      console.warn("Notice: Local firebase-service-account.json not loaded, falling back to environment variables:", e);
    }

    // 2. Fall back to production environment variables
    if (!initialized) {
      const projectId =
        process.env.FIREBASE_PROJECT_ID ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
        "nexthire-6cde3";
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const rawPrivateKey = sanitizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

      if (projectId && clientEmail && rawPrivateKey) {
        try {
          initializeApp({
            credential: cert({
              projectId,
              clientEmail,
              privateKey: rawPrivateKey,
            }),
            projectId,
          });
          initialized = true;
        } catch (initErr) {
          console.warn("Failed to initialize Firebase Admin with environment credentials:", initErr);
        }
      }

      if (!initialized) {
        // Fallback initialization with project ID only (allows build to complete safely)
        try {
          initializeApp({ projectId });
        } catch {
          // Ignore fallback init error
        }
      }
    }
  }

  const app = getApps().length > 0 ? getApp() : undefined;
  return getAuth(app);
}

// Export lazy getter proxy for backward compatibility
export const firebaseAdminAuth = {
  verifyIdToken: async (token: string, checkRevoked?: boolean) => {
    const auth = getFirebaseAdminAuth();
    return auth.verifyIdToken(token, checkRevoked);
  },
};
