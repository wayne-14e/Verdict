"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { firebaseDb } from "./firebaseClient";
import type { AnalysisResult } from "./types";
import { monthStartMs } from "./quota";

export type Plan = "free" | "pro";

export interface ScanRecord extends AnalysisResult {
  id: string;
  userId: string;
  createdAtMs: number;
}

const scansCol = (uid: string) => collection(firebaseDb(), `users/${uid}/scans`);

/** Create/merge the user profile doc on sign-in. Never downgrades plan. */
export async function ensureUserProfile(user: User): Promise<Plan> {
  const ref = doc(firebaseDb(), `users/${user.uid}`);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? (snap.data() as DocumentData) : null;
  const plan: Plan = existing?.plan === "pro" ? "pro" : "free";
  await setDoc(
    ref,
    {
      email: user.email || "",
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      plan,
      lastSeenAt: serverTimestamp(),
      ...(existing ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true }
  );
  return plan;
}

export async function getUserPlan(uid: string): Promise<Plan> {
  const snap = await getDoc(doc(firebaseDb(), `users/${uid}`));
  return snap.exists() && (snap.data() as DocumentData).plan === "pro" ? "pro" : "free";
}

/** Persist a completed analysis to the user's history. */
export async function saveScan(uid: string, result: AnalysisResult): Promise<string> {
  const ref = await addDoc(scansCol(uid), {
    ...result,
    userId: uid,
    createdAtMs: Date.now(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Most recent scans, newest first. */
export async function listScans(uid: string, max = 20): Promise<ScanRecord[]> {
  const q = query(scansCol(uid), orderBy("createdAtMs", "desc"), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as DocumentData;
    return {
      id: d.id,
      userId: uid,
      contractName: String(data.contractName || "Untitled Contract"),
      overallRiskScore: Number(data.overallRiskScore ?? 0),
      riskSummary: String(data.riskSummary || ""),
      flags: Array.isArray(data.flags) ? data.flags : [],
      emailTemplate: {
        subject: String(data.emailTemplate?.subject || ""),
        body: String(data.emailTemplate?.body || ""),
      },
      engine: "gemini",
      analyzedAt: String(data.analyzedAt || new Date(data.createdAtMs || Date.now()).toISOString()),
      createdAtMs: Number(data.createdAtMs || 0),
    } satisfies ScanRecord;
  });
}

/** Scans used in the current calendar month (for free-plan quota). */
export async function countScansThisMonth(uid: string): Promise<number> {
  const q = query(
    scansCol(uid),
    where("createdAtMs", ">=", monthStartMs()),
    orderBy("createdAtMs", "desc"),
    limit(100)
  );
  const snap = await getDocs(q);
  return snap.size;
}

export async function deleteScan(uid: string, scanId: string): Promise<void> {
  await deleteDoc(doc(firebaseDb(), `users/${uid}/scans/${scanId}`));
}
