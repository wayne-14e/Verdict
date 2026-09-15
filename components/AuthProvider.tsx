"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { firebaseAuth, firebaseAppCheck, isFirebaseConfigured } from "@/lib/firebaseClient";
import { ensureUserProfile, type Plan } from "@/lib/scans";

interface AuthState {
  user: User | null;
  displayName: string | null;
  plan: Plan;
  authLoading: boolean;
  configured: boolean;
  getToken: () => Promise<string | null>;
  refreshPlan: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthCtx = createContext<AuthState>({
  user: null,
  displayName: null,
  plan: "free",
  authLoading: true,
  configured: false,
  getToken: async () => null,
  refreshPlan: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [authLoading, setAuthLoading] = useState(true);
  const configured = isFirebaseConfigured();

  useEffect(() => {
    // Warm up App Check first so Firestore/Auth calls carry tokens once configured.
    firebaseAppCheck();
    if (!configured) {
      setAuthLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(firebaseAuth(), async (u) => {
      setUser(u);
      setDisplayName(u?.displayName || null);
      if (u) {
        try {
          setPlan(await ensureUserProfile(u));
        } catch (err) {
          console.error("Failed to sync user profile:", err);
        }
      } else {
        setPlan("free");
      }
      setAuthLoading(false);
    });
    return unsub;
  }, [configured]);

  async function getToken(): Promise<string | null> {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch {
      return null;
    }
  }

  async function refreshPlan() {
    if (!user) return;
    const { getUserPlan } = await import("@/lib/scans");
    try {
      setPlan(await getUserPlan(user.uid));
    } catch {
      /* keep current */
    }
  }

  async function refreshUser() {
    const u = firebaseAuth().currentUser;
    if (!u) return;
    try {
      await u.reload();
    } catch {
      /* keep cached data */
    }
    setUser(u);
    setDisplayName(u.displayName || null);
  }

  return (
    <AuthCtx.Provider
      value={{ user, displayName, plan, authLoading, configured, getToken, refreshPlan, refreshUser }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthCtx);
}
