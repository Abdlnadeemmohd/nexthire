import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import * as fs from "fs";
import * as path from "path";

if (getApps().length === 0) {
  const serviceAccountPath = path.join(process.cwd(), "firebase-service-account.json");

  if (fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || "nexthire-6cde3",
      });
    } catch (e) {
      console.warn("Failed to load firebase-service-account.json:", e);
    }
  }

  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "nexthire-6cde3";
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && rawPrivateKey) {
      const formattedPrivateKey = rawPrivateKey.replace(/\\n/g, "\n");
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
      });
    } else {
      initializeApp({
        projectId,
      });
    }
  }
}

export const firebaseAdminAuth = getAuth();
