export const DEFAULT_MODEL = "gemini-3.1-flash-lite";

// Lite-only chain (less loaded than the full flash tier). All IDs verified
// against the Gemini v1beta catalog + live calls. `gemini-2.5-flash-lite` (dead —
// API says use 3.5-flash-lite) and `gemini-3-flash` (no such v1beta model) excluded.
export const MODEL_FALLBACKS = [
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
];

export const MAX_PROMPT_CHARS = 60_000;

export function getGeminiModels(): string[] {
  const primary = (process.env.GEMINI_MODEL || DEFAULT_MODEL).trim() || DEFAULT_MODEL;
  return Array.from(new Set([primary, ...MODEL_FALLBACKS])).filter(Boolean);
}

export interface ModelTry {
  model: string;
  message: string;
  status: number | null;
}

export function classifyModelError(err: unknown): { message: string; status: number | null } {
  const status =
    err && typeof err === "object" && "status" in err && typeof (err as { status: unknown }).status === "number"
      ? (err as { status: number }).status
      : null;
  const message = err instanceof Error ? err.message : String(err);
  return { message, status };
}

export function isHardModelError(message: string, status: number | null): boolean {
  if (status === 400 || status === 401 || status === 403) return true;
  return /api key|invalid argument|bad request|permission denied|forbidden/i.test(message);
}

/**
 * Runs `attempt` across every model in the chain (primary first), abiding by a
 * total `budgetMs` and a per-attempt `timeoutMs`. The first success wins; the
 * worst failure is thrown as `AllModelsFailedError`.
 */
export async function runAcrossModels<T>(
  attempt: (model: string, timeoutMs: number) => Promise<T>,
  opts: { budgetMs: number; maxAttemptTimeoutMs?: number; startedAt?: number }
): Promise<{ value: T; model: string }> {
  const { budgetMs, maxAttemptTimeoutMs = 28_000 } = opts;
  const startedAt = opts.startedAt ?? Date.now();
  const tries: ModelTry[] = [];
  for (const model of getGeminiModels()) {
    const remaining = budgetMs - (Date.now() - startedAt);
    if (remaining <= 0) break;
    try {
      const value = await attempt(model, Math.min(remaining, maxAttemptTimeoutMs));
      return { value, model };
    } catch (err) {
      const { message, status } = classifyModelError(err);
      tries.push({ model, message, status });
      console.error("Gemini model %s failed:", model, message);
      if (isHardModelError(message, status)) break;
    }
  }
  const timedOut = Date.now() - startedAt >= budgetMs;
  throw new AllModelsFailedError(tries, timedOut);
}

export class AllModelsFailedError extends Error {
  tries: ModelTry[];
  timedOut: boolean;

  constructor(tries: ModelTry[], timedOut: boolean) {
    super(
      `All Gemini models failed after ${tries.length} attempt(s)${timedOut ? " (server budget exhausted)" : ""}.`
    );
    this.name = "AllModelsFailedError";
    this.tries = tries;
    this.timedOut = timedOut;
  }
}

/**
 * Picks the most informative message + status for the client from the set of
 * failed model attempts.
 */
export function failureSummary(e: AllModelsFailedError): {
  error: string;
  status: number;
} {
  const tried = e.tries.map((t) => t.model).join(", ");
  const any429 = e.tries.some((t) => t.status === 429 || /quota|429|rate/i.test(t.message));
  const any503 = e.tries.some((t) => t.status === 503 || /503|unavailable|high demand/i.test(t.message));
  if (e.timedOut) {
    return {
      error: `AI request exceeded the server time budget while trying ${tried || "the models"}. Please try again or use a shorter contract excerpt.`,
      status: 504,
    };
  }
  if (any429) {
    return {
      error: "AI rate limit or quota reached across all models. Please wait a moment and try again.",
      status: 429,
    };
  }
  if (any503) {
    return {
      error: "All AI models are temporarily overloaded (high demand). Please try again in a few minutes.",
      status: 503,
    };
  }
  const last = e.tries[e.tries.length - 1];
  return {
    error: `AI analysis failed (tried: ${tried}). Last error (${last?.model ?? "?"}): ${last?.message ?? "unknown"} — check GEMINI_API_KEY / GEMINI_MODEL.`,
    status: 502,
  };
}