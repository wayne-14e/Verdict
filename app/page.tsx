"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut as fbSignOut } from "firebase/auth";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Code2,
  FileText,
  Gauge,
  Gavel,
  Languages,
  Lock,
  LogOut,
  Mail,
  Menu,
  Palette,
  PenLine,
  PenTool,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SAMPLES } from "@/lib/samples";
import { ScoreGauge } from "@/components/ScoreGauge";
import { AuthModal, type AuthMode } from "@/components/AuthModal";
import { useAuth } from "@/components/AuthProvider";
import { firebaseAuth } from "@/lib/firebaseClient";

const NAV = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#samples", label: "Samples" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

const STATS = [
  { value: "PDF · DOCX · TXT", label: "Upload or paste text" },
  { value: "9 categories", label: "Payment, IP, liability & more" },
  { value: "3 tones", label: "Polite, firm & strict counter-offers" },
  { value: "120K chars", label: "Max contract length per scan" },
];

const FEATURES = [
  {
    icon: UploadCloud,
    title: "Multi-format ingestion",
    body: "Drag-and-drop PDF, DOCX, or TXT — or paste the text directly. Long agreements up to 120K characters, parsed server-side.",
  },
  {
    icon: Gauge,
    title: "Verdict Health Index",
    body: "A 0–100 safety score with HIGH RISK / CAUTION / SAFE verdicts and red, yellow, and green flag counts at a glance.",
  },
  {
    icon: Languages,
    title: "Plain-English translator",
    body: "Every flagged clause shown side-by-side: the original legalese next to what it actually means for you.",
  },
  {
    icon: ShieldAlert,
    title: "Predatory-clause detection",
    body: "Net-60/90 terms, pay-when-paid traps, unlimited liability, IP grabs, and non-competes — surfaced before you sign.",
  },
  {
    icon: PenLine,
    title: "Copy-ready redlines",
    body: "Each flag ships with a suggested revision you can paste straight back to the client's legal team.",
  },
  {
    icon: Mail,
    title: "1-click counter-offer",
    body: "A professional negotiation email in polite, firm, or strict tone — subject line and body ready to copy.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Upload your contract",
    body: "Drop in a PDF, DOCX, or TXT file — or paste the agreement text. Pick a negotiation tone.",
  },
  {
    n: "02",
    title: "Get your verdict",
    body: "Gemini reads the full agreement and returns a Health Index score with every risky clause translated.",
  },
  {
    n: "03",
    title: "Counter with confidence",
    body: "Copy the redlines and the ready-to-send email, and negotiate from a position of knowledge.",
  },
];

const PERSONAS = [
  {
    icon: Code2,
    title: "Developers & DevOps",
    body: "Net-90 terms, unlimited revision loops, and uncapped liability for bugs — caught before you commit.",
  },
  {
    icon: Palette,
    title: "Designers",
    body: "IP grabs over your toolkit, lost portfolio rights, and satisfaction-based endless revisions — flagged.",
  },
  {
    icon: PenTool,
    title: "Writers & marketers",
    body: "Pay-if-paid clauses, broad non-competes, and missing kill fees — translated into plain English.",
  },
];

const FAQS = [
  {
    q: "Is Verdict legal advice?",
    a: "No. Verdict is a decision-support tool that spots risky language and drafts negotiation starting points. For binding advice on high-value deals, consult a licensed attorney.",
  },
  {
    q: "What files can I analyze?",
    a: "PDF, DOCX, and TXT/Markdown files up to 10 MB — or just paste the contract text. Everything is extracted server-side and sent to Gemini for analysis.",
  },
  {
    q: "What happens to my contract data?",
    a: "Analysis is stateless: your text is sent to the Gemini API to produce the report and is not stored in a Verdict database. Don't upload anything you aren't comfortable sharing with an AI provider.",
  },
  {
    q: "Do I need an account?",
    a: "Yes — running a scan requires a free account (email or Google). Your reports are saved to your private history, and the Free plan includes 4 scans per month.",
  },
  {
    q: "How is the Health Index score computed?",
    a: "100 is safest. Each critical red flag lowers the score significantly, cautions lower it moderately, and healthy clauses nudge it up. Anything under 45 reads HIGH RISK.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { user, authLoading, displayName: ctxName } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/app");
    }
  }, [authLoading, user, router]);

  const displayName =
    ctxName || user?.email?.split("@")[0] || "Member";

  function openAuth(mode: AuthMode) {
    setAuthMode(mode);
    setAuthOpen(true);
    setMenuOpen(false);
  }

  function handleAuthSuccess() {
    setAuthOpen(false);
    router.push("/app");
  }

  async function signOut() {
    try {
      await fbSignOut(firebaseAuth());
    } catch {
      /* noop */
    }
  }

  if (authLoading || user) return null;

  return (
    <div className="min-h-screen">
      {/* ── Sticky header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-700/50 bg-[#0F172A]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span
              className="rounded-xl bg-[#6366F1] p-2 text-white"
              style={{ boxShadow: "0 0 16px rgba(99,102,241,0.45)" }}
            >
              <Gavel className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-semibold leading-tight tracking-tight text-white">
                Verdict
              </p>
              <p className="hidden text-xs text-slate-400 sm:block">
                Know what you&apos;re signing before you sign.
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {NAV.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-slate-300 transition hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {authLoading ? null : user ? (
              <>
                <span className="chip border-slate-700/60 bg-white/5 normal-case text-slate-200">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#6366F1] text-[11px] font-bold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  {displayName}
                </span>
                <Link href="/app" className="btn-primary !px-4 !py-2">
                  Open app <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  onClick={signOut}
                  aria-label="Sign out"
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => openAuth("signin")} className="btn-ghost !py-2">
                  Sign in
                </button>
                <button onClick={() => openAuth("signup")} className="btn-primary !px-4 !py-2">
                  Get started <ArrowRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          <button
            className="rounded-lg p-2 text-slate-300 hover:bg-white/5 lg:hidden"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-700/50 px-4 py-3 lg:hidden">
            <nav className="flex flex-col gap-1">
              {NAV.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/5"
                >
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="mt-3 flex gap-2">
              {user ? (
                <Link href="/app" className="btn-primary flex-1">
                  Open app <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <button onClick={() => openAuth("signin")} className="btn-ghost flex-1">
                    Sign in
                  </button>
                  <button onClick={() => openAuth("signup")} className="btn-primary flex-1">
                    Get started
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* ── Hero ────────────────────────────────────────────────── */}
        <section className="grid items-center gap-8 pb-14 pt-12 lg:grid-cols-2 lg:pt-20">
          <div>
            <span className="chip border-[#6366F1]/40 bg-[#6366F1]/10 text-[#a5b4fc]">
              <Sparkles className="h-3.5 w-3.5" /> AI-powered contract intelligence
            </span>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl">
              Know what you&apos;re signing{" "}
              <span className="text-[#a5b4fc]">before you sign.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Upload any client agreement. Verdict flags hidden payment traps, IP grabs, and
              liability landmines — translates legalese into plain English — and drafts your
              counter-offer in seconds.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => openAuth("signup")} className="btn-primary">
                Get started free <ArrowRight className="h-4 w-4" />
              </button>
              <Link href="/app" className="btn-ghost">
                <Zap className="h-4 w-4 text-[#6366F1]" /> Try the live analyzer
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              {["Net-90 detection", "IP overreach", "Liability caps", "Non-competes"].map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 font-medium text-slate-200 ring-1 ring-slate-700/60"
                >
                  <Check className="h-3.5 w-3.5 text-[#10B981]" /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Illustrative preview (static marketing visual, not an analysis) */}
          <div className="card rise p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Verdict Health Index
              </p>
              <span className="chip border-slate-700/60 bg-white/5 text-slate-400">
                Illustrative preview
              </span>
            </div>
            <div className="mt-4 flex justify-center">
              <ScoreGauge score={28} />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 rounded-xl border border-[#EF4444]/30 bg-[#451A1A]/60 px-3 py-2.5 text-sm">
                <ShieldAlert className="h-4 w-4 shrink-0 text-[#EF4444]" />
                <span className="font-medium text-slate-100">Net-90 payment terms</span>
                <span className="chip badge-red ml-auto">Red flag</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-[#EF4444]/30 bg-[#451A1A]/60 px-3 py-2.5 text-sm">
                <ShieldAlert className="h-4 w-4 shrink-0 text-[#EF4444]" />
                <span className="font-medium text-slate-100">Unlimited liability</span>
                <span className="chip badge-red ml-auto">Red flag</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-[#10B981]/30 bg-[#064E3B]/40 px-3 py-2.5 text-sm">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#10B981]" />
                <span className="font-medium text-slate-100">Mutual confidentiality</span>
                <span className="chip badge-green ml-auto">Safe</span>
              </div>
            </div>
            <Link
              href="/app"
              className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-[#a5b4fc] underline-offset-2 hover:underline"
            >
              Run a real analysis in the app <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* ── Stats strip ─────────────────────────────────────────── */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="card p-4 text-center sm:p-5">
              <p className="text-lg font-semibold tracking-tight text-white sm:text-xl">{s.value}</p>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">{s.label}</p>
            </div>
          ))}
        </section>

        {/* ── Features ────────────────────────────────────────────── */}
        <section id="features" className="scroll-mt-20 pt-16 sm:pt-20">
          <p className="text-xs font-bold uppercase tracking-widest text-[#a5b4fc]">
            Features
          </p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Everything between “looks fine” and signing with confidence.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-5">
                <span className="inline-flex rounded-xl border border-[#6366F1]/40 bg-[#6366F1]/10 p-2 text-[#a5b4fc]">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-semibold tracking-tight text-slate-100">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ────────────────────────────────────────── */}
        <section id="how" className="scroll-mt-20 pt-16 sm:pt-20">
          <p className="text-xs font-bold uppercase tracking-widest text-[#a5b4fc]">
            How it works
          </p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            From upload to counter-offer in three steps.
          </h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="card p-6">
                <p className="font-mono text-sm font-semibold text-[#6366F1]">{s.n}</p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Samples ─────────────────────────────────────────────── */}
        <section id="samples" className="scroll-mt-20 pt-16 sm:pt-20">
          <p className="text-xs font-bold uppercase tracking-widest text-[#a5b4fc]">
            Live demo
          </p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            No contract handy? Try a pre-loaded demo.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
            Each sample opens in the analyzer and is scored live by Gemini — nothing is
            pre-baked.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {SAMPLES.map((s) => (
              <Link
                key={s.id}
                href="/app"
                className="card group p-5 transition hover:border-slate-500"
              >
                <span className="inline-flex rounded-xl border border-[#6366F1]/40 bg-[#6366F1]/10 p-2 text-[#a5b4fc]">
                  <FileText className="h-5 w-5" />
                </span>
                <p className="mt-3 font-semibold tracking-tight text-slate-100">{s.title}</p>
                <p className="mt-1 text-xs text-slate-400">{s.tagline}</p>
                <p className="mt-3 text-xs font-semibold text-[#a5b4fc] underline-offset-2 group-hover:underline">
                  Open in analyzer →
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Personas ────────────────────────────────────────────── */}
        <section className="pt-16 sm:pt-20">
          <p className="text-xs font-bold uppercase tracking-widest text-[#a5b4fc]">
            Who it&apos;s for
          </p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Built for independent workers.
          </h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {PERSONAS.map((p) => (
              <div key={p.title} className="card p-5">
                <span className="inline-flex rounded-xl border border-[#6366F1]/40 bg-[#6366F1]/10 p-2 text-[#a5b4fc]">
                  <p.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-semibold tracking-tight text-slate-100">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pricing ─────────────────────────────────────────────── */}
        <section id="pricing" className="scroll-mt-20 pt-16 sm:pt-20">
          <p className="text-xs font-bold uppercase tracking-widest text-[#a5b4fc]">Pricing</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Cheaper than one billable hour with a lawyer.
          </h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="card p-6 sm:p-8">
              <p className="text-sm font-bold uppercase tracking-wider text-slate-400">Free</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-white">
                $0
                <span className="text-base font-normal text-slate-400"> / month</span>
              </p>
              <ul className="mt-5 space-y-2.5 text-sm text-slate-300">
                {[
                  "4 contract scans per month",
                  "Health Index score + flag breakdown",
                  "Plain-English clause translations",
                  "3 pre-loaded demo contracts",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#10B981]" /> {t}
                  </li>
                ))}
              </ul>
              <button onClick={() => openAuth("signup")} className="btn-ghost mt-6 w-full">
                Start for free
              </button>
            </div>
            <div
              className="card relative p-6 sm:p-8"
              style={{ borderColor: "rgba(99,102,241,0.5)", boxShadow: "0 0 24px rgba(99,102,241,0.25)" }}
            >
              <span className="absolute -top-3 left-6 rounded-full bg-[#6366F1] px-3 py-1 text-xs font-bold text-white">
                MOST POPULAR
              </span>
              <p className="text-sm font-bold uppercase tracking-wider text-[#a5b4fc]">Pro</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-white">
                $15
                <span className="text-base font-normal text-slate-400"> / month</span>
              </p>
              <ul className="mt-5 space-y-2.5 text-sm text-slate-300">
                {[
                  "Unlimited contract scans",
                  "1-click counter-offer emails (3 tones)",
                  "Copy-ready redline amendments",
                  "Lawyer-approved clause templates",
                  "Priority analysis speed",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#10B981]" /> {t}
                  </li>
                ))}
              </ul>
              <button onClick={() => openAuth("signup")} className="btn-primary mt-6 w-full">
                Get started <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-slate-500">
            Prices in USD. Cancel anytime. Self-serve Pro checkout is coming soon.
          </p>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────── */}
        <section id="faq" className="scroll-mt-20 pt-16 sm:pt-20">
          <p className="text-xs font-bold uppercase tracking-widest text-[#a5b4fc]">FAQ</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Questions, answered.
          </h2>
          <div className="mt-8 space-y-3">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.q} className="card overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between gap-3 p-4 text-left sm:p-5"
                  >
                    <span className="font-semibold tracking-tight text-slate-100">{f.q}</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-slate-400 transition",
                        open && "rotate-180"
                      )}
                    />
                  </button>
                  {open && (
                    <p className="border-t border-slate-700/50 px-4 py-4 text-sm leading-relaxed text-slate-300 sm:px-5">
                      {f.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────────────────────── */}
        <section className="py-16 sm:py-20">
          <div
            className="card p-8 text-center sm:p-12"
            style={{ boxShadow: "0 0 32px rgba(99,102,241,0.20)" }}
          >
            <span className="chip mx-auto border-[#6366F1]/40 bg-[#6366F1]/10 text-[#a5b4fc]">
              <Lock className="h-3.5 w-3.5" /> Don&apos;t sign blind
            </span>
            <h2 className="mx-auto mt-4 max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Your next contract could cost you thousands. Read it first.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-400 sm:text-base">
              Join Verdict free, upload your first agreement, and see exactly what you&apos;re
              signing — before you sign it.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button onClick={() => openAuth("signup")} className="btn-primary">
                Get started free <ArrowRight className="h-4 w-4" />
              </button>
              <Link href="/app" className="btn-ghost">
                Try the live analyzer
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-700/50">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col justify-between gap-6 sm:flex-row">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="rounded-xl bg-[#6366F1] p-2 text-white">
                  <Gavel className="h-4 w-4" />
                </span>
                <p className="font-semibold tracking-tight text-white">Verdict</p>
              </div>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-slate-500">
                Know what you&apos;re signing before you sign. Verdict is a decision-support
                tool, not a law firm — outputs are informational drafts. Consult a licensed
                attorney for binding advice.
              </p>
            </div>
            <nav className="flex gap-10 text-sm">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Product</p>
                {NAV.slice(0, 3).map((l) => (
                  <a key={l.href} href={l.href} className="text-slate-300 hover:text-white">
                    {l.label}
                  </a>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Company</p>
                {NAV.slice(3).map((l) => (
                  <a key={l.href} href={l.href} className="text-slate-300 hover:text-white">
                    {l.label}
                  </a>
                ))}
                <Link href="/app" className="text-slate-300 hover:text-white">
                  Open app
                </Link>
              </div>
            </nav>
          </div>
          <p className="mt-8 border-t border-slate-700/50 pt-6 text-xs text-slate-500">
            © 2026 Verdict. All rights reserved.
          </p>
        </div>
      </footer>

      <AuthModal
        open={authOpen}
        initialMode={authMode}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
