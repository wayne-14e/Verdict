export const DEFAULT_MODEL = "gemini-3.5-flash";

// Verified against the Gemini v1beta catalog. `gemini-2.5-flash-lite` (dead —
// API says use 3.5-flash-lite) and `gemini-3-flash` (no such v1beta model) were
// dropped in favor of live IDs.
export const MODEL_FALLBACKS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
];

export function getGeminiModels(): string[] {
  const primary = (process.env.GEMINI_MODEL || DEFAULT_MODEL).trim() || DEFAULT_MODEL;
  return Array.from(new Set([primary, ...MODEL_FALLBACKS])).filter(Boolean);
}

export function modelErrorStatus(message: string): number {
  if (/quota|429|rate/i.test(message)) return 429;
  if (/503|unavailable|high demand|overloaded/i.test(message)) return 503;
  return 502;
}

export function isHardModelError(message: string): boolean {
  return /api key|invalid argument|bad request|permission denied|forbidden/i.test(message);
}

export function summarizeModelFailures(
  tried: string[],
  errors: { model: string; message: string }[]
): string {
  const last = errors[errors.length - 1];
  if (!last) return "AI analysis failed. Check GEMINI_API_KEY / GEMINI_MODEL.";
  return `AI analysis failed (tried: ${tried.join(", ")}). Last error (${last.model}): ${last.message} — check GEMINI_API_KEY / GEMINI_MODEL.`;
}