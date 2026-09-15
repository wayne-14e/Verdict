import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { buildEmail, toneSchema } from "@/lib/analyzer";
import { isAppCheckEnforced, verifyAppCheckToken, verifyIdToken } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const maxDuration = 30;

const DEFAULT_MODEL = "gemini-1.5-flash";

const counterOfferSchema = z.object({
  tone: toneSchema.default("polite"),
  contractName: z.string().min(1).max(200).default("Agreement"),
  overallRiskScore: z.number().min(0).max(100).default(50),
  flags: z
    .array(
      z.object({
        severity: z.enum(["RED", "YELLOW", "GREEN"]),
        category: z.string().max(50),
        clauseTitle: z.string().min(1).max(200),
        originalText: z.string().max(600).default(""),
        plainEnglish: z.string().max(2000).default(""),
        whyItMatters: z.string().max(2000).default(""),
        suggestedRevision: z.string().min(1).max(2000),
      })
    )
    .max(30)
    .default([]),
});

async function draftWithGemini(
  apiKey: string,
  model: string,
  input: z.infer<typeof counterOfferSchema>
): Promise<{ subject: string; body: string } | null> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const generativeModel = genAI.getGenerativeModel({
      model,
      generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
    });
    const bullets = input.flags
      .filter((f) => f.severity !== "GREEN")
      .slice(0, 5)
      .map((f) => `- ${f.clauseTitle} [${f.severity}/${f.category}]: ${f.suggestedRevision}`)
      .join("\n");
    const prompt = `You are "Verdict", drafting a freelancer counter-offer email. Tone: ${input.tone} (polite = warm/professional, firm = business-standard, strict = non-negotiable).
Contract: ${input.contractName} (safety score ${input.overallRiskScore}/100).
Negotiation points:\n${bullets || "- Standard Net-15 payment terms."}
Return STRICT JSON ONLY: {"subject": string, "body": string}. Keep the body under 300 words, professional, with the points as a bulleted list and a courteous close.`;
    const res = await generativeModel.generateContent(prompt);
    const raw = res.response
      .text()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/g, "")
      .trim();
    const parsed = JSON.parse(raw);
    const v = z
      .object({ subject: z.string().min(1).max(300), body: z.string().min(1).max(8000) })
      .parse(parsed);
    return v;
  } catch (err) {
    console.error("Gemini counter-offer failed, using template fallback:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  // Firebase Auth required (counter-offers are AI-drafted under the caller's account).
  const idToken = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!idToken) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  try {
    await verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Your session expired. Please sign in again." }, { status: 401 });
  }
  if (isAppCheckEnforced()) {
    const acToken = (req.headers.get("x-firebase-appcheck") || "").trim();
    if (!acToken) {
      return NextResponse.json({ error: "Security check missing. Please reload and try again." }, { status: 403 });
    }
    try {
      await verifyAppCheckToken(acToken);
    } catch {
      return NextResponse.json({ error: "Security check failed. Please reload and try again." }, { status: 403 });
    }
  }

  try {
    const body = await req.json();
    const parsed = counterOfferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid counter-offer request." },
        { status: 400 }
      );
    }
    const input = parsed.data;

    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const model = (process.env.GEMINI_MODEL || DEFAULT_MODEL).trim() || DEFAULT_MODEL;

    // Prefer Gemini (same .env key); fall back to deterministic template of REAL flags.
    if (apiKey) {
      const ai = await draftWithGemini(apiKey, model, input);
      if (ai) return NextResponse.json(ai);
    }

    const email = buildEmail(
      input.contractName,
      input.flags.map((f, i) => ({
        id: `flag-${i}`,
        severity: f.severity,
        category: (f.category as "OTHER") || "OTHER",
        clauseTitle: f.clauseTitle,
        originalText: f.originalText,
        plainEnglish: f.plainEnglish,
        whyItMatters: f.whyItMatters,
        suggestedRevision: f.suggestedRevision,
      })),
      input.tone,
      input.overallRiskScore
    );
    return NextResponse.json(email);
  } catch (err) {
    console.error("Counter-offer route error:", err);
    return NextResponse.json({ error: "Failed to generate counter-offer." }, { status: 500 });
  }
}
