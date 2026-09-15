import "server-only";

import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { getAppCheck } from "firebase-admin/app-check";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Server-only Firebase Admin helpers for Next.js API routes.
 *
 * - ID-token verification works with a projectId-only init (it only needs
 *   Google's public certs) — no service-account key required.
 * - Admin Firestore reads/writes DO need service credentials
 *   (GOOGLE_APPLICATION_CREDENTIALS). Where absent (e.g. plain local dev),
 *   adminDb() returns null and routes degrade gracefully (auth still enforced).
 */

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "verdict-2ef0b";

function adminApp(): App {
  const existing = getApps();
  if (existing.length) return existing[0] as App;
  // Hosted environments (e.g. Vercel) can't use a key file: paste the full
  // service-account JSON into FIREBASE_SERVICE_ACCOUNT instead.
  const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (saRaw) {
    try {
      const sa = JSON.parse(saRaw) as { private_key?: string };
      if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, "\n");
      return initializeApp({ projectId: PROJECT_ID, credential: cert(sa as never) });
    } catch (err) {
      console.error(
        "Invalid FIREBASE_SERVICE_ACCOUNT JSON, continuing without service credentials:",
        err instanceof Error ? err.message : err
      );
    }
  }
  return initializeApp({ projectId: PROJECT_ID });
}

/** Verify a Firebase ID token. Throws on missing/invalid/expired tokens. */
export async function verifyIdToken(token: string): Promise<DecodedIdToken> {
  return getAuth(adminApp()).verifyIdToken(token);
}

/**
 * True once the reCAPTCHA site key is configured (NEXT_PUBLIC_* is visible
 * server-side too). Routes only demand an App Check token from then on —
 * safe rollout: add the key, deploy, *then* flip enforcement in console.
 */
export function isAppCheckEnforced(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);
}

/** Verify an App Check token from `X-Firebase-AppCheck`. Throws when bad. */
export async function verifyAppCheckToken(token: string): Promise<void> {
  await getAppCheck(adminApp()).verifyToken(token);
}

function hasServiceCredentials(): boolean {
  return Boolean(
    process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT
  );
}

/** Admin Firestore, or null when service credentials aren't available. */
export function adminDb(): Firestore | null {
  if (!hasServiceCredentials()) return null;
  try {
    return getFirestore(adminApp());
  } catch {
    return null;
  }
}

export function monthStartMs(now = Date.now()): number {
  const d = new Date(now);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
