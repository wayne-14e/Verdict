"use client";

import { useState } from "react";
import { Copy, Check, Mail, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisResult, Tone } from "@/lib/types";
import { TONE_LABELS } from "@/lib/types";

const TONES: Tone[] = ["polite", "firm", "strict"];

export function EmailPanel({
  result,
  tone,
  onToneChange,
  regenerating,
}: {
  result: AnalysisResult;
  tone: Tone;
  onToneChange: (t: Tone) => void;
  regenerating: boolean;
}) {
  const [copied, setCopied] = useState<"subject" | "body" | null>(null);

  async function copy(text: string, which: "subject" | "body") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-semibold tracking-tight text-white">
          <Mail className="h-5 w-5 text-[#6366F1]" /> 1-Click Counter-Offer
        </h3>
        <span className="text-xs text-slate-400">via Gemini AI</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {TONES.map((t) => (
          <button
            key={t}
            onClick={() => onToneChange(t)}
            disabled={regenerating}
            className={cn(
              "rounded-lg border px-3.5 py-1.5 text-sm font-medium transition",
              tone === t
                ? "border-[#6366F1] bg-[#6366F1] text-white"
                : "border-slate-700/60 bg-transparent text-slate-300 hover:border-slate-500"
            )}
            style={tone === t ? { boxShadow: "0 0 16px rgba(99,102,241,0.35)" } : undefined}
          >
            {TONE_LABELS[t]}
          </button>
        ))}
        {regenerating && (
          <span className="inline-flex items-center gap-1.5 text-sm text-slate-400">
            <RefreshCw className="h-4 w-4 animate-spin" /> Updating…
          </span>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-slate-700/50 bg-[#0F172A] p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Subject</p>
            <button onClick={() => copy(result.emailTemplate.subject, "subject")} className="btn-ghost !px-2.5 !py-1.5 !text-xs">
              {copied === "subject" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === "subject" ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-100">{result.emailTemplate.subject}</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-[#0F172A] p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Email body</p>
            <button onClick={() => copy(result.emailTemplate.body, "body")} className="btn-ghost !px-2.5 !py-1.5 !text-xs">
              {copied === "body" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === "body" ? "Copied" : "Copy email"}
            </button>
          </div>
          <pre className="mt-1 whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-200">
            {result.emailTemplate.body}
          </pre>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        Draft aid only — not legal advice. Have a licensed attorney review before sending on high-value deals.
      </p>
    </div>
  );
}
