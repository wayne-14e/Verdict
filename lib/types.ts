export type Severity = "RED" | "YELLOW" | "GREEN";
export type Category =
  | "PAYMENT"
  | "IP_RIGHTS"
  | "LIABILITY"
  | "REVISIONS"
  | "NON_COMPETE"
  | "TERMINATION"
  | "CONFIDENTIALITY"
  | "JURISDICTION"
  | "OTHER";

export type Tone = "polite" | "firm" | "strict";

export interface RiskFlag {
  id: string;
  severity: Severity;
  category: Category;
  clauseTitle: string;
  originalText: string;
  plainEnglish: string;
  whyItMatters: string;
  suggestedRevision: string;
}

export interface EmailTemplate {
  subject: string;
  body: string;
}

export interface AnalysisResult {
  contractName: string;
  overallRiskScore: number; // 0-100 safety index, higher = safer
  riskSummary: string;
  flags: RiskFlag[];
  emailTemplate: EmailTemplate;
  engine: "gemini";
  analyzedAt: string;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  PAYMENT: "Payment",
  IP_RIGHTS: "IP Rights",
  LIABILITY: "Liability",
  REVISIONS: "Revisions",
  NON_COMPETE: "Non-Compete",
  TERMINATION: "Termination",
  CONFIDENTIALITY: "Confidentiality",
  JURISDICTION: "Jurisdiction",
  OTHER: "Other",
};

export const TONE_LABELS: Record<Tone, string> = {
  polite: "Polite & Professional",
  firm: "Firm Business Standard",
  strict: "Strict Defense",
};
