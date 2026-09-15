"use client";

export function ScoreGauge({ score }: { score: number }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const color = score >= 70 ? "#10B981" : score >= 45 ? "#F59E0B" : "#EF4444";
  const bg =
    score >= 70 ? "var(--risk-green-bg)" : score >= 45 ? "var(--risk-amber-bg)" : "var(--risk-red-bg)";
  const label = score >= 70 ? "SAFE" : score >= 45 ? "CAUTION" : "HIGH RISK";

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 128 128" className="h-32 w-32 -rotate-90">
          <circle cx="64" cy="64" r={r} fill="none" stroke="var(--gauge-track)" strokeWidth="12" />
          <circle
            cx="64"
            cy="64"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            style={{
              transition: "stroke-dashoffset 0.8s ease, stroke 0.3s ease",
              filter: `drop-shadow(0 0 6px ${color}66)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">{score}</span>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">/ 100</span>
        </div>
      </div>
      <div>
        <div
          className="chip"
          style={{ color, borderColor: color + "66", background: bg, boxShadow: `0 0 12px ${color}40` }}
        >
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
          {label}
        </div>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {score >= 70
            ? "Strong safety index. Standard protections appear in place."
            : score >= 45
              ? "Mixed safety index. Negotiate the red flags before signing."
              : "Critical action required before signing."}
        </p>
      </div>
    </div>
  );
}
