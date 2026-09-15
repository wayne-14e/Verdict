import { z } from "zod";
import type { AnalysisResult, EmailTemplate, RiskFlag, Tone } from "./types";

/**
 * Verdict — production analysis helpers.
 *
 * Gemini is the ONLY analysis engine. There is no local/mock fallback:
 * if GEMINI_API_KEY is missing or Gemini fails, API routes return a
 * 5xx error instead of fabricated results.
 */

export const GEMINI_SYSTEM_PROMPT = `You are "Verdict", an AI contract-risk analyst. Tagline: Know what you're signing before you sign. You protect freelancers.
Analyze the contract text and return STRICT JSON ONLY (no markdown, no code fences) matching this schema:
{"contractName": string, "overallRiskScore": number 0-100 (100=safest), "riskSummary": string, "flags": [{"id": string, "severity": "RED"|"YELLOW"|"GREEN", "category": "PAYMENT"|"IP_RIGHTS"|"LIABILITY"|"REVISIONS"|"NON_COMPETE"|"TERMINATION"|"CONFIDENTIALITY"|"JURISDICTION"|"OTHER", "clauseTitle": string, "originalText": string (verbatim excerpt <=400 chars), "plainEnglish": string, "whyItMatters": string, "suggestedRevision": string}], "emailTemplate": {"subject": string, "body": string}}
Rules: flag Net-60/90, pay-when-paid as RED PAYMENT; unlimited liability / one-sided indemnity as RED LIABILITY; broad IP assignment as RED IP_RIGHTS; non-competes as RED NON_COMPETE; vague revisions / missing kill fee as YELLOW; mutual NDA, liability caps, Net-15/30 as GREEN. Score: start 100, -25 per RED, -10 per YELLOW, floor 5. Email: polite professional counter-offer listing top fixes.`;

// --- Strict validation for Gemini structured output (production guardrail) ---

const flagSchema = z.object({
  id: z.string().min(1),
  severity: z.enum(["RED", "YELLOW", "GREEN"]),
  category: z.enum([
    "PAYMENT",
    "IP_RIGHTS",
    "LIABILITY",
    "REVISIONS",
    "NON_COMPETE",
    "TERMINATION",
    "CONFIDENTIALITY",
    "JURISDICTION",
    "OTHER",
  ]),
  clauseTitle: z.string().min(1).max(200),
  originalText: z.string().min(1).max(600),
  plainEnglish: z.string().min(1).max(2000),
  whyItMatters: z.string().min(1).max(2000),
  suggestedRevision: z.string().min(1).max(2000),
});

const geminiResultSchema = z.object({
  contractName: z.string().min(1).max(200),
  overallRiskScore: z.number().min(0).max(100),
  riskSummary: z.string().min(1).max(2000),
  flags: z.array(flagSchema).min(1).max(30),
  emailTemplate: z.object({
    subject: z.string().min(1).max(300),
    body: z.string().min(1).max(8000),
  }),
});

/** Parse + validate raw Gemini JSON text. Throws on any mismatch. */
export function parseGeminiResult(raw: string, fallbackName: string): AnalysisResult {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/g, "")
    .trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Gemini returned malformed JSON.");
  }
  const v = geminiResultSchema.parse(parsed);
  return {
    contractName: v.contractName || fallbackName,
    overallRiskScore: Math.round(v.overallRiskScore),
    riskSummary: v.riskSummary,
    flags: v.flags as RiskFlag[],
    emailTemplate: v.emailTemplate,
    engine: "gemini",
    analyzedAt: new Date().toISOString(),
  };
}

// --- Request validation schemas ---

export const toneSchema = z.enum(["polite", "firm", "strict"]);

export const analyzeJsonSchema = z.object({
  text: z.string().min(50, "Paste at least a paragraph of contract text.").max(120_000),
  contractName: z.string().max(200).optional().default("Pasted Contract"),
});

/** Deterministic email template built from REAL Gemini flags (not analysis).
 *  Used only when re-rendering an existing tone client-side/server-side fails
 *  to reach Gemini — it formats verified flags, never invents them. */
export function buildEmail(
  contractName: string,
  flags: RiskFlag[],
  tone: Tone,
  score: number
): EmailTemplate {
  const actionable = flags.filter((f) => f.severity !== "GREEN").slice(0, 5);
  const openers: Record<Tone, string> = {
    polite:
      "Thank you so much for sending over the agreement — I'm excited about the project and keen to get started on the right footing.",
    firm: "Thanks for sharing the agreement. I'm interested in moving forward, and I'd like to align a few standard business terms first.",
    strict:
      "Thank you for the draft agreement. Before I can proceed, several clauses need to be corrected to meet professional contracting standards.",
  };
  const closers: Record<Tone, string> = {
    polite:
      "I hope these small tweaks work for you — I'm flexible on the details and happy to hop on a quick call. Looking forward to collaborating!",
    firm: "These are standard terms I agree with all my clients. Once updated, I can sign promptly and lock in the start date.",
    strict:
      "I can only proceed once these protections are in place. Please send a revised draft reflecting the points above.",
  };
  const introVerb: Record<Tone, string> = {
    polite: "I noticed a few small points we might smooth out",
    firm: "I need the following business-standard adjustments",
    strict: "I require the following non-negotiable corrections",
  };

  const bullets =
    actionable.length === 0
      ? "- Payment on Net-15 with a 1.5% monthly late fee (standard freelance terms)."
      : actionable.map((f) => `- ${f.clauseTitle}: ${f.suggestedRevision}`).join("\n");

  const subject =
    actionable.length === 0
      ? `Re: ${contractName || "Agreement"} — ready to sign, one small request`
      : `Re: ${contractName || "Agreement"} — proposed standard revisions (score ${score}/100)`;

  const body = `${openers[tone]}

${introVerb[tone]}:

${bullets}

${closers[tone]}

Best regards`;

  return { subject, body };
}

export function withTone(result: AnalysisResult, tone: Tone): AnalysisResult {
  return {
    ...result,
    emailTemplate: buildEmail(result.contractName, result.flags, tone, result.overallRiskScore),
  };
}
