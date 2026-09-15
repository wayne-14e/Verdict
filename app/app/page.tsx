"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Eye,
  FileText,
  FlaskConical,
  Gavel,
  History,
  Loader2,
  Lock,
  LogOut,
  Menu,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Trash2,
  UploadCloud,
  User,
  X,
  Zap,
} from "lucide-react";
import { signOut as fbSignOut, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { SAMPLES } from "@/lib/samples";
import type { AnalysisResult, Category, Severity, Tone } from "@/lib/types";
import { ReportView } from "@/components/ReportView";
import { AuthModal, type AuthMode } from "@/components/AuthModal";
import { useAuth } from "@/components/AuthProvider";
import { firebaseAuth, firebaseDb, getAppCheckHeader } from "@/lib/firebaseClient";
import { FREE_SCANS_PER_MONTH } from "@/lib/quota";
import {
  countScansThisMonth,
  deleteScan,
  listScans,
  saveScan,
  type ScanRecord,
} from "@/lib/scans";

const ACCEPT = ".pdf,.docx,.txt,.md";

type View = "analyze" | "history" | "profile";

const TABS: Array<{ id: View; label: string; icon: typeof Zap }> = [
  { id: "analyze", label: "Analyze", icon: Zap },
  { id: "history", label: "History", icon: History },
  { id: "profile", label: "Profile", icon: User },
];

function scoreLabel(score: number) {
  return score >= 70 ? "SAFE" : score >= 45 ? "CAUTION" : "HIGH RISK";
}

function scoreColor(score: number) {
  return score >= 70 ? "text-[#10B981]" : score >= 45 ? "text-[#F59E0B]" : "text-[#EF4444]";
}

export default function AnalyzePage() {
  const { user, displayName, plan, authLoading, configured, getToken, refreshPlan, refreshUser } =
    useAuth();
  const uid = user?.uid ?? null;

  const [view, setView] = useState<View>("analyze");
  const [menuOpen, setMenuOpen] = useState(false);
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [tone, setTone] = useState<Tone>("polite");
  const [regen, setRegen] = useState(false);
  const [sevFilter, setSevFilter] = useState<Severity | "ALL">("ALL");
  const [catFilter, setCatFilter] = useState<Category | "ALL">("ALL");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [usage, setUsage] = useState<number | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const historyDetailRef = useRef<HTMLDivElement>(null);

  const refreshHistory = useCallback(async () => {
    if (!uid) {
      setHistory([]);
      setUsage(null);
      return;
    }
    setHistoryLoading(true);
    try {
      const [scans, used] = await Promise.all([listScans(uid), countScansThisMonth(uid)]);
      setHistory(scans);
      setUsage(used);
    } catch (e) {
      console.error("Failed to load scan history:", e);
    } finally {
      setHistoryLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    void refreshHistory();
    void refreshPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  useEffect(() => {
    if (view === "profile") {
      setEditName(displayName || user?.email?.split("@")[0] || "");
      setProfileMsg("");
    }
  }, [view, displayName, user]);

  const pickFile = useCallback((f: File | undefined) => {
    if (!f) return;
    setFile(f);
    setFileName(f.name);
    setError("");
  }, []);

  function go(v: View) {
    setView(v);
    setMenuOpen(false);
    if (v === "analyze") setSelectedScanId(null);
    if (v === "history") void refreshHistory();
  }

  function requireAuth(): boolean {
    if (!user || !uid) {
      setAuthMode("signin");
      setAuthOpen(true);
      setError("Please sign in to run a contract analysis.");
      return false;
    }
    return true;
  }

  async function authHeaders(json: boolean): Promise<HeadersInit> {
    const token = await getToken();
    const h: Record<string, string> = {};
    if (json) h["Content-Type"] = "application/json";
    if (token) h["Authorization"] = `Bearer ${token}`;
    return { ...h, ...(await getAppCheckHeader()) };
  }

  async function analyze(payload: FormData | { text: string; contractName: string }, nextTone: Tone) {
    if (!requireAuth() || !uid) return;
    setLoading(true);
    setError("");
    try {
      let res: Response;
      if (payload instanceof FormData) {
        res = await fetch(`/api/analyze?tone=${nextTone}`, {
          method: "POST",
          headers: await authHeaders(false),
          body: payload,
        });
      } else {
        res = await fetch(`/api/analyze?tone=${nextTone}`, {
          method: "POST",
          headers: await authHeaders(true),
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (res.status === 401) {
        setAuthMode("signin");
        setAuthOpen(true);
        throw new Error("Your session expired. Please sign in again.");
      }
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      const parsed = data as AnalysisResult;
      setResult(parsed);
      setSelectedScanId(null);
      setTone(nextTone);
      try {
        await saveScan(uid, parsed);
        await refreshHistory();
      } catch (e) {
        console.error("Failed to save scan to history:", e);
      }
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!requireAuth() || !uid) return;
    // Free-plan quota gate (client-side; API additionally requires valid auth).
    if (plan !== "pro") {
      try {
        const used = await countScansThisMonth(uid);
        setUsage(used);
        if (used >= FREE_SCANS_PER_MONTH) {
          setError(
            `Free plan limit reached (${FREE_SCANS_PER_MONTH} scans/month). Upgrade to Pro for unlimited scans.`
          );
          return;
        }
      } catch (e) {
        console.error("Quota check failed, proceeding:", e);
      }
    }
    if (file) {
      const fd = new FormData();
      fd.append("file", file);
      if (fileName) fd.append("contractName", fileName);
      if (text.trim()) fd.append("text", text);
      void analyze(fd, tone);
    } else if (text.trim().length >= 50) {
      void analyze({ text, contractName: fileName || "Pasted Contract" }, tone);
    } else {
      setError("Upload a PDF/DOCX/TXT file or paste at least a paragraph of contract text.");
    }
  }

  function loadSample(id: string) {
    const s = SAMPLES.find((x) => x.id === id);
    if (!s) return;
    setText(s.text);
    setFile(null);
    setFileName(s.filename);
    setError("");
  }

  async function changeTone(next: Tone) {
    setTone(next);
    if (!result) return;
    setRegen(true);
    try {
      const res = await fetch("/api/counter-offer", {
        method: "POST",
        headers: await authHeaders(true),
        body: JSON.stringify({
          tone: next,
          contractName: result.contractName,
          overallRiskScore: result.overallRiskScore,
          flags: result.flags,
        }),
      });
      const data = await res.json();
      if (res.ok) setResult({ ...result, emailTemplate: data });
    } finally {
      setRegen(false);
    }
  }

  function reset() {
    setText("");
    setFile(null);
    setFileName("");
    setResult(null);
    setSelectedScanId(null);
    setError("");
    setSevFilter("ALL");
    setCatFilter("ALL");
  }

  async function openScan(scan: ScanRecord) {
    setResult(scan);
    setTone("polite");
    setError("");
    setSelectedScanId(scan.id);
    setTimeout(() => historyDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  async function removeScan(scanId: string) {
    if (!uid) return;
    try {
      await deleteScan(uid, scanId);
      setHistory((h) => h.filter((s) => s.id !== scanId));
      if (scanId === selectedScanId) {
        setSelectedScanId(null);
        setResult(null);
      }
      setUsage(await countScansThisMonth(uid));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete scan.");
    }
  }

  async function saveName() {
    const trimmed = editName.trim();
    if (trimmed.length < 2) {
      setProfileMsg("Name must be at least 2 characters.");
      return;
    }
    if (!uid) return;
    setSavingName(true);
    setProfileMsg("");
    try {
      const u = firebaseAuth().currentUser;
      if (u && u.displayName !== trimmed) await updateProfile(u, { displayName: trimmed });
      await setDoc(
        doc(firebaseDb(), `users/${uid}`),
        { displayName: trimmed, updatedAt: serverTimestamp() },
        { merge: true }
      );
      await refreshUser();
      setProfileMsg("Profile saved.");
    } catch (e) {
      setProfileMsg(e instanceof Error ? e.message : "Failed to save profile.");
    } finally {
      setSavingName(false);
    }
  }

  async function handleSignOut() {
    try {
      await fbSignOut(firebaseAuth());
    } catch {
      /* noop */
    }
    setView("analyze");
    setMenuOpen(false);
    reset();
    setHistory([]);
    setUsage(null);
  }

  const used = usage ?? 0;
  const remaining = Math.max(0, FREE_SCANS_PER_MONTH - used);
  const name = displayName || user?.email?.split("@")[0] || "Member";
  const detailScan = selectedScanId
    ? (history.find((s) => s.id === selectedScanId) ?? (result as ScanRecord | null))
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6">
      {/* Header with tab navigation */}
      <header className="flex items-center justify-between gap-3">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span
            className="rounded-xl bg-[#6366F1] p-2 text-white"
            style={{ boxShadow: "0 0 16px rgba(99,102,241,0.45)" }}
          >
            <Gavel className="h-5 w-5" />
          </span>
          <div className="hidden sm:block">
            <p className="text-base font-semibold leading-tight tracking-tight text-white">Verdict</p>
            <p className="text-xs text-slate-400">Know what you&apos;re signing before you sign.</p>
          </div>
        </Link>

        {user && (
          <nav className="hidden items-center gap-1 rounded-xl border border-slate-700/60 bg-[#1E293B] p-1 md:flex">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => go(t.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition",
                  view === t.id ? "bg-[#6366F1] text-white" : "text-slate-300 hover:text-white"
                )}
                style={view === t.id ? { boxShadow: "0 0 16px rgba(99,102,241,0.35)" } : undefined}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-3 rounded-xl border border-slate-700/60 bg-[#1E293B] py-1.5 pl-3.5 pr-1.5">
              <span className="hidden items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-300 sm:inline-flex">
                <Sparkles className="h-3.5 w-3.5 text-[#6366F1]" />
                {plan === "pro"
                  ? "Pro · unlimited"
                  : `${remaining} free scan${remaining === 1 ? "" : "s"} left`}
              </span>
              <span className="hidden h-5 w-px bg-slate-700/60 sm:block" />
              <span className="inline-flex items-center text-sm font-semibold text-slate-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6366F1] text-xs font-bold text-white">
                  {name.charAt(0).toUpperCase()}
                </span>
              </span>
              <span className="h-5 w-px bg-slate-700/60" />
              <button
                onClick={handleSignOut}
                aria-label="Sign out"
                className="hidden rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white md:block"
              >
                <LogOut className="h-4 w-4" />
              </button>
              <button
                className="rounded-lg p-1.5 text-slate-300 hover:bg-white/5 md:hidden"
                aria-label="Toggle menu"
                onClick={() => setMenuOpen((v) => !v)}
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          ) : (
            !authLoading && (
              <button
                onClick={() => {
                  setAuthMode("signin");
                  setAuthOpen(true);
                }}
                className="btn-ghost !py-2"
              >
                Sign in
              </button>
            )
          )}
        </div>
      </header>

      {user && menuOpen && (
        <div className="card mt-3 space-y-1 p-2 md:hidden">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => go(t.id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                view === t.id ? "bg-[#6366F1] text-white" : "text-slate-200 hover:bg-white/5"
              )}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
          <div className="flex items-center justify-between border-t border-slate-700/50 px-3 py-2.5 text-sm text-slate-400">
            <span>
              {plan === "pro" ? "Pro · unlimited" : `${remaining} free scans left`}
            </span>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 font-semibold text-slate-300 hover:text-white"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      )}

      {authLoading ? (
        <div className="card mt-8 flex items-center justify-center gap-2 p-12 text-sm text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin text-[#6366F1]" /> Loading your account…
        </div>
      ) : !configured ? (
        <div className="card mt-8 border-[#EF4444]/40 p-8 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-[#EF4444]" />
          <h1 className="mt-3 text-xl font-semibold tracking-tight text-white">
            Backend not configured
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Firebase credentials are missing. Add the <code className="font-mono">NEXT_PUBLIC_FIREBASE_*</code> vars
            to <code className="font-mono">.env</code> (see <code className="font-mono">.env.example</code>) and restart.
          </p>
        </div>
      ) : !user ? (
        <div className="card mx-auto mt-8 max-w-lg p-8 text-center sm:p-10">
          <span
            className="mx-auto inline-flex rounded-xl bg-[#6366F1]/10 p-3 text-[#a5b4fc]"
            style={{ boxShadow: "0 0 16px rgba(99,102,241,0.35)" }}
          >
            <Lock className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
            Sign in to analyze contracts
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Your scans run on Gemini under your account and are saved to your private history.
            Free plan includes {FREE_SCANS_PER_MONTH} scans per month.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              onClick={() => {
                setAuthMode("signup");
                setAuthOpen(true);
              }}
              className="btn-primary"
            >
              Create free account
            </button>
            <button
              onClick={() => {
                setAuthMode("signin");
                setAuthOpen(true);
              }}
              className="btn-ghost"
            >
              Sign in
            </button>
          </div>
          {error && <p className="mt-4 text-sm font-medium text-[#EF4444]">{error}</p>}
        </div>
      ) : view === "profile" ? (
        <section className="mx-auto mt-6 max-w-2xl space-y-4">
          <div className="card p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6366F1] text-2xl font-bold text-white"
                style={{ boxShadow: "0 0 16px rgba(99,102,241,0.45)" }}
              >
                {name.charAt(0).toUpperCase()}
              </span>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-white">{name}</h1>
                <p className="text-sm text-slate-400">{user.email}</p>
              </div>
              <span
                className={cn(
                  "chip ml-auto",
                  plan === "pro" ? "badge-green" : "border-slate-700/60 bg-white/5 text-slate-300"
                )}
              >
                {plan === "pro" ? "Pro plan" : "Free plan"}
              </span>
            </div>

            <div className="mt-6">
              <label htmlFor="profile-name" className="text-sm font-semibold text-slate-200">
                Display name
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="profile-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                  placeholder="Alex Rivera"
                  autoComplete="name"
                  className="w-full rounded-xl border border-slate-700/60 bg-[#0F172A] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
                />
                <button onClick={saveName} disabled={savingName} className="btn-primary shrink-0 !px-4 !py-2.5">
                  {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </button>
              </div>
              {profileMsg && (
                <p
                  className={cn(
                    "mt-2 text-sm font-medium",
                    profileMsg === "Profile saved." ? "text-[#10B981]" : "text-[#EF4444]"
                  )}
                >
                  {profileMsg}
                </p>
              )}
            </div>
          </div>

          <div className="card p-6 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-wider text-slate-400">Usage this month</p>
            {plan === "pro" ? (
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Unlimited scans on Pro — you&apos;ve run <strong className="text-white">{used}</strong> this month.
              </p>
            ) : (
              <>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
                  {used}
                  <span className="text-base font-normal text-slate-400"> / {FREE_SCANS_PER_MONTH} scans used</span>
                </p>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#0F172A]">
                  <div
                    className="h-full rounded-full bg-[#6366F1] transition-all"
                    style={{ width: `${Math.min(100, (used / FREE_SCANS_PER_MONTH) * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  {remaining} scan{remaining === 1 ? "" : "s"} left. Need more?{" "}
                  <Link href="/#pricing" className="font-semibold text-[#a5b4fc] hover:underline">
                    See Pro →
                  </Link>
                </p>
              </>
            )}
          </div>

          <div className="card p-6 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-wider text-slate-400">Account</p>
            <p className="mt-2 truncate text-sm text-slate-300">{user.email}</p>
            <button onClick={handleSignOut} className="btn-ghost mt-4">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </section>
      ) : view === "history" ? (
        <section className="mt-6 scroll-mt-6">
          {selectedScanId && detailScan ? (
            <div>
              <button onClick={() => setSelectedScanId(null)} className="btn-ghost mb-4">
                <ChevronLeft className="h-4 w-4" /> Back to past reports
              </button>
              <ReportView
                ref={historyDetailRef}
                result={detailScan}
                tone={tone}
                regenerating={regen}
                onToneChange={changeTone}
                sevFilter={sevFilter}
                onSevFilter={setSevFilter}
                catFilter={catFilter}
                onCatFilter={setCatFilter}
              />
            </div>
          ) : (
          <div className="card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
                <History className="h-5 w-5 text-[#6366F1]" /> Past reports
              </h1>
              {historyLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            </div>
            {history.length === 0 && !historyLoading ? (
              <div className="mt-3 rounded-xl border border-slate-700/50 bg-[#0F172A] p-8 text-center">
                <FileText className="mx-auto h-8 w-8 text-slate-600" />
                <p className="mt-2 text-sm font-semibold text-slate-200">No reports yet</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">
                  Run your first analysis and it will be saved here for one-click re-view.
                </p>
                <button onClick={() => go("analyze")} className="btn-primary mt-4">
                  <Zap className="h-4 w-4" /> Analyze a contract
                </button>
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-slate-700/50">
                {history.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 py-3">
                    <span className={cn("w-10 shrink-0 text-lg font-semibold tabular-nums", scoreColor(s.overallRiskScore))}>
                      {s.overallRiskScore}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-100">{s.contractName}</p>
                      <p className="text-xs text-slate-500">
                        {scoreLabel(s.overallRiskScore)} · {s.flags.length} flags ·{" "}
                        {new Date(s.createdAtMs).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => openScan(s)}
                      aria-label={`View ${s.contractName}`}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeScan(s.id)}
                      aria-label={`Delete ${s.contractName}`}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-[#EF4444]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
                </ul>
              )}
          </div>
          )}
        </section>
      ) : (
        <>
          {/* Upload */}
          <section className="mt-6 grid gap-4 lg:grid-cols-5">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                pickFile(e.dataTransfer.files?.[0]);
              }}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "card cursor-pointer p-6 text-center transition lg:col-span-2",
                dragging ? "border-[#6366F1] bg-[#6366F1]/10" : "hover:border-slate-500"
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
              <UploadCloud className="mx-auto h-10 w-10 text-[#6366F1]" />
              <p className="mt-3 font-semibold tracking-tight text-slate-100">
                {file ? file.name : "Drop contract here or click to browse"}
              </p>
              <p className="mt-1 text-sm text-slate-400">PDF, DOCX, or TXT • parsed server-side</p>
              {file && (
                <p className="badge-green mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold">
                  <FileText className="h-3.5 w-3.5" /> {(file.size / 1024).toFixed(1)} KB ready
                </p>
              )}
            </div>

            <div className="card p-5 lg:col-span-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold tracking-tight text-slate-100">Or paste contract text</label>
                {fileName && <span className="font-mono text-xs text-slate-400">{fileName}</span>}
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste the agreement text here… (Section 1. Payment: Net-90… Contractor hereby assigns all right, title…)"
                rows={7}
                className="mt-2 w-full resize-y rounded-xl border border-slate-700/60 bg-[#0F172A] p-3 font-mono text-[13px] leading-relaxed text-slate-200 placeholder:text-slate-500"
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button onClick={handleAnalyze} disabled={loading} className="btn-primary">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                  {loading ? "Analyzing contract…" : "Analyze contract"}
                </button>
                <button onClick={reset} className="btn-ghost">
                  <RotateCcw className="h-4 w-4" /> Reset
                </button>
              </div>
              {error && <p className="mt-2 text-sm font-medium text-[#EF4444]">{error}</p>}
            </div>
          </section>

          {/* Samples */}
          <section className="mt-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-300">
              <FlaskConical className="h-4 w-4 text-[#6366F1]" /> No contract handy? Try a pre-loaded demo:
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {SAMPLES.map((s) => (
                <button key={s.id} onClick={() => loadSample(s.id)} className="card p-4 text-left transition hover:border-slate-500">
                  <p className="font-semibold tracking-tight text-slate-100">{s.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{s.tagline}</p>
                  <p className="mt-2 text-xs font-semibold text-[#a5b4fc] underline underline-offset-2">Load sample →</p>
                </button>
              ))}
            </div>
          </section>

          {/* Results — Verdict Health Index */}
          {result && !selectedScanId && (
            <ReportView
              ref={resultRef}
              result={result}
              tone={tone}
              regenerating={regen}
              onToneChange={changeTone}
              sevFilter={sevFilter}
              onSevFilter={setSevFilter}
              catFilter={catFilter}
              onCatFilter={setCatFilter}
            />
          )}
        </>
      )}

      <footer className="mt-12 border-t border-slate-700/50 pt-6 text-xs leading-relaxed text-slate-500">
        <p className="font-semibold tracking-tight text-slate-300">
          Verdict — Know what you&apos;re signing before you sign.
        </p>
        <p className="mt-1">
          Verdict is a decision-support tool, not a law firm. Outputs are informational drafts —
          consult a licensed attorney for binding advice. Analysis is powered by Gemini.
        </p>
      </footer>

      <AuthModal
        open={authOpen}
        initialMode={authMode}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => setAuthOpen(false)}
      />
    </div>
  );
}
