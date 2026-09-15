"use client";

import { forwardRef } from "react";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisResult, Category, Severity, Tone } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { ScoreGauge } from "@/components/ScoreGauge";
import { FlagCard } from "@/components/FlagCard";
import { EmailPanel } from "@/components/EmailPanel";

const CATEGORIES: Array<Category | "ALL"> = [
  "ALL",
  "PAYMENT",
  "IP_RIGHTS",
  "LIABILITY",
  "REVISIONS",
  "NON_COMPETE",
  "TERMINATION",
  "CONFIDENTIALITY",
  "JURISDICTION",
  "OTHER",
];

interface ReportViewProps {
  result: AnalysisResult;
  tone: Tone;
  regenerating: boolean;
  onToneChange: (t: Tone) => void;
  sevFilter: Severity | "ALL";
  onSevFilter: (s: Severity | "ALL") => void;
  catFilter: Category | "ALL";
  onCatFilter: (c: Category | "ALL") => void;
}

/** Full verdict report: Health Index scorecard, flag cards, counter-offer panel. */
export const ReportView = forwardRef<HTMLDivElement, ReportViewProps>(function ReportView(
  { result, tone, regenerating, onToneChange, sevFilter, onSevFilter, catFilter, onCatFilter },
  ref
) {
  const reds = result.flags.filter((f) => f.severity === "RED").length;
  const yellows = result.flags.filter((f) => f.severity === "YELLOW").length;
  const greens = result.flags.filter((f) => f.severity === "GREEN").length;
  const filtered = result.flags.filter(
    (f) =>
      (sevFilter === "ALL" || f.severity === sevFilter) &&
      (catFilter === "ALL" || f.category === catFilter)
  );

  return (
    <div ref={ref} className="mt-8 scroll-mt-6 space-y-4">
      <div className="card p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Verdict Health Index
        </p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <h2 className="mt-1 font-mono text-lg font-medium tracking-tight text-slate-900 dark:text-white">
              {result.contractName}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Overall Risk:{" "}
              {result.overallRiskScore >= 70
                ? "SAFE"
                : result.overallRiskScore >= 45
                  ? "CAUTION"
                  : "HIGH RISK"}{" "}
              ({result.overallRiskScore}/100)
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {result.riskSummary}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="chip badge-red">● {reds} Red Flags</span>
              <span className="chip badge-yellow">● {yellows} Yellow Flags</span>
              <span className="chip badge-green">● {greens} Safe Clauses</span>
              <span className="chip border-slate-300 dark:border-slate-700/60 bg-slate-900/5 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                Gemini AI engine
              </span>
            </div>
          </div>
          <ScoreGauge score={result.overallRiskScore} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {/* Filters */}
          <div className="card flex flex-wrap items-center gap-2 p-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Severity:
            </span>
            {(["ALL", "RED", "YELLOW", "GREEN"] as const).map((s) => (
              <button
                key={s}
                onClick={() => onSevFilter(s)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition",
                  sevFilter === s
                    ? "border-[#6366F1] bg-[#6366F1] text-white"
                    : "border-slate-300 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500"
                )}
              >
                {s === "ALL" ? "All" : s}
              </button>
            ))}
            <span className="ml-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Category:
            </span>
            <select
              value={catFilter}
              onChange={(e) => onCatFilter(e.target.value as Category | "ALL")}
              className="rounded-lg border border-slate-300 dark:border-slate-700/60 bg-white dark:bg-[#0F172A] px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === "ALL" ? "All categories" : CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="card flex items-center gap-2 p-6 text-sm text-slate-600 dark:text-slate-300">
              <ShieldCheck className="h-5 w-5 text-[#10B981]" />
              No flags match this filter — the contract is clean in this slice.
            </div>
          ) : (
            filtered.map((f) => <FlagCard key={f.id} flag={f} />)
          )}
        </div>

        <div className="lg:col-span-1">
          <EmailPanel
            result={result}
            tone={tone}
            onToneChange={onToneChange}
            regenerating={regenerating}
          />
        </div>
      </div>
    </div>
  );
});
