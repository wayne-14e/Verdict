import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  GEMINI_SYSTEM_PROMPT,
  analyzeJsonSchema,
  parseGeminiResult,
  toneSchema,
  withTone,
} from "@/lib/analyzer";
import { adminDb, isAppCheckEnforced, monthStartMs, verifyAppCheckToken, verifyIdToken } from "@/lib/firebaseAdmin";
import {
  AllModelsFailedError,
  MAX_PROMPT_CHARS,
  failureSummary,
  runAcrossModels,
} from "@/lib/gemini";
import type { AnalysisResult } from "@/lib/types";
import { FREE_SCANS_PER_MONTH } from "@/lib/quota";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

async function extractText(req: NextRequest): Promise<{ name: string; text: string }> {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await req.json();
    const parsed = analyzeJsonSchema.parse(body);
    return { name: parsed.contractName || "Pasted Contract", text: parsed.text };
  }

  const form = await req.formData();
  const nameField = form.get("contractName");
  const textField = form.get("text");
  const file = form.get("file");

  if (typeof textField === "string" && textField.trim().length > 0) {
    const parsed = analyzeJsonSchema.parse({
      text: textField,
      contractName:
        typeof nameField === "string" && nameField ? nameField.slice(0, 200) : "Pasted Contract",
    });
    return { name: parsed.contractName || "Pasted Contract", text: parsed.text };
  }

  if (file && typeof file !== "string") {
    const f = file as File;
    if (f.size > MAX_FILE_BYTES) {
      throw Object.assign(new Error("File too large. Maximum size is 10 MB."), { status: 413 });
    }
    const buf = Buffer.from(await f.arrayBuffer());
    const filename = (f.name || "uploaded-contract").slice(0, 200);
    const lower = filename.toLowerCase();
    let text = "";
    if (lower.endsWith(".txt") || lower.endsWith(".md") || f.type.startsWith("text/")) {
      text = buf.toString("utf-8");
    } else if (lower.endsWith(".pdf") || f.type === "application/pdf") {
      const mod = (await import("pdf-parse")).default as unknown as (b: Buffer) => Promise<{
        text: string;
      }>;
      const data = await mod(buf);
      text = data.text || "";
    } else if (lower.endsWith(".docx") || f.type.includes("wordprocessingml")) {
      const mammoth = await import("mammoth");
      const out = await mammoth.extractRawText({ buffer: buf });
      text = out.value || "";
    } else {
      throw Object.assign(
        new Error("Unsupported file type. Upload a PDF, DOCX, or TXT file."),
        { status: 415 }
      );
    }
    const parsed = analyzeJsonSchema.parse({ text, contractName: filename });
    return { name: parsed.contractName || filename, text: parsed.text };
  }

  throw Object.assign(
    new Error("No readable contract text found. Paste at least a paragraph or upload a readable PDF/DOCX/TXT."),
    { status: 400 }
  );
}

export async function POST(req: NextRequest) {
  try {
    return await handleAnalyze(req);
  } catch (err) {
    console.error("Unhandled analyze error:", err instanceof Error ? err.stack : err);
    return NextResponse.json(
      { error: "Unexpected server error. Please try again." },
      { status: 500 }
    );
  }
}

async function handleAnalyze(req: NextRequest): Promise<Response> {
  // 0. Firebase Auth is required for every scan.
  const idToken = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!idToken) {
    return NextResponse.json(
      { error: "Sign in required. Please sign in and try again." },
      { status: 401 }
    );
  }
  let uid: string;
  try {
    const decoded = await verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.json(
      { error: "Your session expired. Please sign in again." },
      { status: 401 }
    );
  }

  // 0b. App Check — demanded only once the reCAPTCHA site key is configured.
  if (isAppCheckEnforced()) {
    const acToken = (req.headers.get("x-firebase-appcheck") || "").trim();
    if (!acToken) {
      return NextResponse.json(
        { error: "Security check missing. Please reload the app and try again." },
        { status: 403 }
      );
    }
    try {
      await verifyAppCheckToken(acToken);
    } catch {
      return NextResponse.json(
        { error: "Security check failed. Please reload the app and try again." },
        { status: 403 }
      );
    }
  }

  // 1. Gemini API key is required — loaded from .env (Next.js loads .env automatically).
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Server is not configured: GEMINI_API_KEY is missing. Add it to the .env file (see .env.example) and restart the server.",
      },
      { status: 503 }
    );
  }

  // 2. Validate tone param
  const url = new URL(req.url);
  const toneRaw = url.searchParams.get("tone") || "polite";
  const toneParsed = toneSchema.safeParse(toneRaw);
  if (!toneParsed.success) {
    return NextResponse.json(
      { error: "Invalid tone. Use polite, firm, or strict." },
      { status: 400 }
    );
  }
  const tone = toneParsed.data;

  // 3. Extract + validate input
  let name: string;
  let cleaned: string;
  try {
    const extracted = await extractText(req);
    name = extracted.name;
    cleaned = (extracted.text || "").replace(/\0/g, "").trim();
    if (!cleaned || cleaned.length < 50) {
      return NextResponse.json(
        {
          error:
            "No readable contract text found. Paste at least a paragraph or upload a readable PDF/DOCX/TXT.",
        },
        { status: 400 }
      );
    }
  } catch (err) {
    if (err instanceof Error && "status" in err && typeof (err as { status: unknown }).status === "number") {
      return NextResponse.json(
        { error: err.message },
        { status: (err as { status: number }).status }
      );
    }
    // Zod validation error from extractText
    const message =
      err instanceof Error ? err.message : "Invalid request payload.";
    const status = /too large/i.test(message) ? 413 : 400;
    return NextResponse.json({ error: message }, { status });
  }

  // 4. Free-plan monthly quota (server-enforced when service credentials exist;
  //    the client also gates this for UX — scans are written post-analysis).
  try {
    const db = adminDb();
    if (db) {
      const profile = await db.doc(`users/${uid}`).get();
      if (profile.data()?.plan !== "pro") {
        const used = await db
          .collection(`users/${uid}/scans`)
          .where("createdAtMs", ">=", monthStartMs())
          .limit(FREE_SCANS_PER_MONTH + 1)
          .get();
        if (used.size >= FREE_SCANS_PER_MONTH) {
          return NextResponse.json(
            {
              error: `Free plan limit reached (${FREE_SCANS_PER_MONTH} scans/month). Upgrade to Pro for unlimited scans.`,
            },
            { status: 402 }
          );
        }
      }
    }
  } catch (err) {
    console.error("Quota check unavailable, proceeding:", err instanceof Error ? err.message : err);
  }

  // 5. Gemini-only analysis with per-model fallback, a hard time budget and a
//    per-attempt fetch timeout (so we never blow the 60s function cap while
//    trying several overloaded models).
  const analysisBudgetMs = 52_000;
  const genAI = new GoogleGenerativeAI(apiKey);
  const startedAt = Date.now();
  const truncated = cleaned.slice(0, MAX_PROMPT_CHARS);
  const prompt = `Contract filename: ${name}\n\nContract text:\n${truncated}`;
  try {
    const { value: result } = await runAcrossModels<AnalysisResult>(
      async (model, timeoutMs) => {
        const generativeModel = genAI.getGenerativeModel(
          {
            model,
            systemInstruction: GEMINI_SYSTEM_PROMPT,
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2,
              maxOutputTokens: 8192,
            },
          },
          { timeout: timeoutMs }
        );
        const res = await generativeModel.generateContent(prompt);
        const base = parseGeminiResult(res.response.text(), name);
        const result = withTone(base, tone);
        result.engine = "gemini";
        return result;
      },
      { budgetMs: analysisBudgetMs, startedAt }
    );
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AllModelsFailedError) {
      const { error, status } = failureSummary(err);
      return NextResponse.json({ error }, { status });
    }
    throw err;
  }
}
