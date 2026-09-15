"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, OctagonAlert, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskFlag } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";

const SEV_STYLE = {
  RED: {
    icon: OctagonAlert,
    bar: "bg-[#EF4444]",
    badge: "badge-red",
    label: "Red Flag",
    glow: "0 0 12px rgba(239, 68, 68, 0.25)",
  },
  YELLOW: {
    icon: AlertTriangle,
    bar: "bg-[#F59E0B]",
    badge: "badge-yellow",
    label: "Caution",
    glow: "0 0 12px rgba(245, 158, 11, 0.20)",
  },
  GREEN: {
    icon: CheckCircle2,
    bar: "bg-[#10B981]",
    badge: "badge-green",
    label: "Safe",
    glow: "0 0 12px rgba(16, 185, 129, 0.25)",
  },
} as const;

export function FlagCard({ flag }: { flag: RiskFlag }) {
  const [open, setOpen] = useState(flag.severity === "RED");
  const [copied, setCopied] = useState(false);
  const s = SEV_STYLE[flag.severity];
  const Icon = s.icon;

  async function copyFix() {
    try {
      await navigator.clipboard.writeText(flag.suggestedRevision);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="card rise overflow-hidden">
      <div className={cn("h-1.5 w-full", s.bar)} style={{ boxShadow: s.glow }} />
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-start gap-3 p-4 text-left">
        <span className={cn("mt-0.5 rounded-lg border p-1.5", s.badge)}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-semibold tracking-tight text-slate-900 dark:text-slate-100">{flag.clauseTitle}</span>
            <span className={cn("chip", s.badge)}>{s.label}</span>
            <span className="chip border-slate-300 dark:border-slate-700/60 bg-slate-900/5 dark:bg-white/5 text-slate-500 dark:text-slate-400">
              {CATEGORY_LABELS[flag.category]}
            </span>
          </span>
          <span className="mt-1 block truncate text-sm leading-relaxed text-slate-500 dark:text-slate-400">{flag.plainEnglish}</span>
        </span>
        <ChevronDown className={cn("mt-1 h-4 w-4 shrink-0 text-slate-500 transition", open && "rotate-180")} />
      </button>

      {open && (
        <div className="grid gap-3 border-t border-slate-200 dark:border-slate-700/50 p-4 md:grid-cols-2">
          {/* Original Clause (Contract Text) — monospace legal extract */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#0F172A] p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Original Clause — Contract Text
            </p>
            <p className="mt-1.5 font-mono text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">“{flag.originalText}”</p>
          </div>
          {/* Plain-English Breakdown */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-white/[0.03] p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Plain-English Breakdown
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{flag.plainEnglish}</p>
          </div>
          <div className="rounded-xl border border-[#F59E0B]/30 bg-[#FFFBEB] dark:bg-[#453006]/60 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#F59E0B]">Why it matters</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{flag.whyItMatters}</p>
          </div>
          <div className="rounded-xl border border-[#6366F1]/40 bg-[#6366F1]/10 p-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#a5b4fc]">
                Suggested Redline Amendment
              </p>
              <button
                onClick={copyFix}
                className="inline-flex items-center gap-1 rounded-lg bg-[#6366F1] px-2 py-1 text-xs font-medium text-white hover:bg-[#5457e5]"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-1.5 font-mono text-[13px] leading-relaxed text-slate-900 dark:text-slate-100">{flag.suggestedRevision}</p>
          </div>
        </div>
      )}
    </div>
  );
}
