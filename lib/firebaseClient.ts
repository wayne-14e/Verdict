"use client";

import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import {
  getToken as getAppCheckTokenRaw,
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  type AppCheck,
} from "firebase/app-check";

function config(): FirebaseOptions {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

export function isFirebaseConfigured(): boolean {
  const c = config();
  return Boolean(c.apiKey && c.authDomain && c.projectId && c.appId);
}

function app(): FirebaseApp {
  if (!getApps().length) {
    if (!isFirebaseConfigured()) {
      throw new Error(
        "Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* vars to .env (see .env.example)."
      );
    }
    initializeApp(config());
  }
  return getApp();
}

export function firebaseAuth(): Auth {
  return getAuth(app());
}

export function firebaseDb(): Firestore {
  return getFirestore(app());
}

let _google: GoogleAuthProvider | null = null;
export function googleProvider(): GoogleAuthProvider {
  if (!_google) _google = new GoogleAuthProvider();
  return _google;
}

let _appCheck: AppCheck | null = null;

/**
 * Initialize App Check with reCAPTCHA Enterprise. Browser-only; no-op on the
 * server or when NEXT_PUBLIC_RECAPTCHA_SITE_KEY isn't set yet.
 */
export function firebaseAppCheck(): AppCheck | null {
  if (typeof window === "undefined") return null;
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) return null;
  if (!_appCheck) {
    _appCheck = initializeAppCheck(app(), {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }
  return _appCheck;
}

/** `X-Firebase-AppCheck` header for our own API routes. {} when unavailable. */
export async function getAppCheckHeader(): Promise<Record<string, string>> {
  try {
    const ac = firebaseAppCheck();
    if (!ac) return {};
    const { token } = await getAppCheckTokenRaw(ac);
    return token ? { "X-Firebase-AppCheck": token } : {};
  } catch {
    return {};
  }
}
