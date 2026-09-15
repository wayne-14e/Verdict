# ⚖️ Verdict

> **Tagline:** Don't get burned by bad contracts. Instant, AI-powered contract analysis, risk detection, and automated negotiation for independent workers.

---

## 1. Executive Summary

**Verdict** is an AI agent web application designed to protect freelancers, agency owners, and independent contractors from predatory client contracts. By analyzing legal agreements in seconds using advanced LLMs, the app identifies hidden financial risks (e.g., Net-90 payment terms, broad IP transfers, unlimited liability, endless revision clauses), translates legal jargon into plain English, and automatically generates professional negotiation counter-offers.

---

## 2. Problem Statement & Financial Impact

### The Problem
When freelancers sign contracts provided by client legal teams, they face asymmetric information. Corporate attorneys write contracts to maximize client leverage, while freelancers lack the $300–$500/hour needed to hire legal counsel.

### Key Pain Points & Financial Pitfalls
1. **Payment Delays & Non-Payment:**
   * *Net-60 / Net-90 Terms:* Freelancers act as interest-free lenders to corporations for 2 to 3 months.
   * *Pay-When-Paid / Pay-If-Paid:* Clauses that tie contractor payment to whether the client's end-customer pays them.
2. **Scope Creep & Unpaid Labour:**
   * *Unlimited Revisions:* "Contractor shall revise work until Client is satisfied," leading to 2x–3x estimated project hours without extra compensation.
3. **Intellectual Property (IP) Overreach:**
   * Clients claiming ownership over contractor pre-existing tools, libraries, design frameworks, or personal portfolio rights.
4. **Catastrophic Liability Traps:**
   * Absence of a liability cap, exposing an individual freelancer to lawsuits for thousands of dollars over minor software bugs or delays.
5. **Career-Crushing Non-Competes:**
   * Overly broad restrictive covenants preventing freelancers from working in their main industry for 12–24 months.

---

## 3. Target Audience & Personas

* **Primary Persona:** Software Developers & DevOps Engineers (freelance / contract)
* **Secondary Persona:** UI/UX & Graphic Designers
* **Tertiary Persona:** Copywriters, Content Strategists, and Marketing Consultants

---

## 4. Product Overview & Key Features (MVP Scope)

```
[ Upload Contract (PDF / DOCX) ] 
               │
               ▼
   [ AI Ingestion & Parsing ]
               │
               ▼
 ┌──────────────────────────┐
 │  Traffic Light Audit     │ ──▶ Red (Critical), Yellow (Caution), Green (Safe)
 └──────────────────────────┘
               │
               ▼
 ┌──────────────────────────┐
 │ Side-by-Side Translator  │ ──▶ Legalese vs. Plain English
 └──────────────────────────┘
               │
               ▼
 ┌──────────────────────────┐
 │ 1-Click Counter-Offer    │ ──▶ Auto-generates polite, protective email response
 └──────────────────────────┘
```

### Feature 1: Multi-Format Contract Ingestion
* Drag-and-drop support for PDF, DOCX, or plain text pasting.
* Multi-page text extraction powered by multimodal AI capabilities.

### Feature 2: Traffic-Light Risk Scorecard
* **Overall Contract Health Score:** 0–100 Safety Index.
* **Red Flags (Critical Risk):**
  * Unlimited liability / missing liability caps.
  * Payment terms > Net-30.
  * Broad pre-payment IP transfer.
  * Broad non-compete clauses.
* **Yellow Flags (Moderate Risk):**
  * Vague revision policies.
  * Unclear kill fee / cancellation terms.
  * Ambiguous milestone deliverables.
* **Green Flags (Standard / Safe):**
  * Mutual confidentiality (NDA).
  * Standard jurisdiction/governing law.

### Feature 3: Side-by-Side Plain-English Translator
* Highlights exact legal text and provides direct, concise translations.
* Example:
  * *Legal Text:* "Contractor hereby assigns all right, title, and interest in and to all Work Product..."
  * *Plain English:* "The client owns everything you create, even pre-existing tools or code snippets you brought to the project."

### Feature 4: 1-Click Counter-Offer & Redline Generator
* Generates professionally worded email responses proposing concrete contract modifications.
* Customizable negotiation aggressive levels (e.g., *Polite & Professional*, *Firm Business Standard*, *Strict Defense*).
* Copy-paste ready clauses to send directly to the client's hiring manager or legal team.

---

## 5. System Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   React / Next.js Frontend                  │
│  (Upload Dropzone, Audit Dashboard, Diff/Translation View)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Next.js API Routes / Backend                │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       AI Agent Engine                       │
│  - System Prompt: Legal Risk Classification Schema          │
│  - LLM Integration: Direct PDF/Text Parsing                 │
│  - JSON Structured Output Generation                        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Structured JSON Data                    │
│ { score, risks: [{ level, clause, summary, recommendation }] }│
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Recommended Tech Stack (Optimized for 48-Hour AI Build)

| Layer | Technology | Reason for Choice |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14+ (App Router) / React | Fast setup, server components, easy routing |
| **Styling** | Tailwind CSS + Shadcn UI | Instant high-quality UI components and dark mode |
| **AI LLM Engine** | Gemini 1.5 Flash / Pro API | Massive context window (1M+ tokens), multimodal PDF support, high speed, cost-effective |
| **AI Integration** | Vercel AI SDK or Google Gen AI SDK | Native React hooks (`useCompletion`, `useObject`) for streaming responses |
| **Icons & Visuals** | Lucide-React | Clean traffic light badges, icons, and indicators |
| **Hosting** | Vercel / Netlify | One-click deployment with zero backend setup |

---

## 7. AI Prompt Strategy & Structured Schema

### JSON Output Schema Definition
To ensure the UI renders reliably, the AI agent must return a strict JSON payload:

```json
{
  "contractName": "string",
  "overallRiskScore": "number (0-100)",
  "riskSummary": "string",
  "flags": [
    {
      "id": "string",
      "severity": "RED | YELLOW | GREEN",
      "category": "PAYMENT | IP_RIGHTS | LIABILITY | REVISIONS | NON_COMPETE | OTHER",
      "clauseTitle": "string",
      "originalText": "string",
      "plainEnglish": "string",
      "whyItMatters": "string",
      "suggestedRevision": "string"
    }
  ],
  "emailTemplate": {
    "subject": "string",
    "body": "string"
  }
}
```

---

## 8. 48-Hour Build Roadmap

### Phase 1: Hours 0 – 12 | Core Setup & Data Flow
* Set up Next.js repository with Tailwind CSS and Shadcn UI.
* Integrate AI SDK and configure system prompts with strict JSON schema output.
* Create a simple text dropzone / file upload interface.

### Phase 2: Hours 12 – 24 | Dashboard UI & Audit Rendering
* Build the visual scorecard UI (Risk level header, score meter).
* Implement Red/Yellow/Green flag cards with accordion expandable original vs. plain-English text.
* Add category filtering (Payment, IP, Liability).

### Phase 3: Hours 24 – 36 | Counter-Offer Email Generator & Polish
* Implement the 1-Click Counter-Offer generator with customizable negotiation tones.
* Add a "Copy Email to Clipboard" feature.
* Include 3 pre-loaded sample predatory contracts (e.g., "The Trap Agency Contract", "The Unlimited Revisions Dev Agreement") for instant demoing.

### Phase 4: Hours 36 – 48 | Testing, UX Polish & Demo Pitch Prep
* Test edge cases (unsupported formats, empty files, huge contracts).
* Refine UI animations and responsive styling.
* Record a 2-minute pitch video and rehearse live demo flow.

---

## 9. Hackathon Winning Pitch Strategy

1. **The Hook (0:00 - 0:30):**
   * *"Meet Alex, a freelance software engineer. Last month, Alex signed a contract with a client, worked for 60 days, and was forced to deliver 5 rounds of unpaid revisions due to a hidden Net-90 unlimited revision clause. Today, we're fixing this asymmetric legal power dynamic forever."*
2. **The Solution (0:30 - 1:30):**
   * Upload a predatory 10-page agreement live on screen.
   * Watch the AI agent parse it in under 3 seconds.
   * Highlight 2 glaring Red Flags (Unlimited Liability + Net-90 Payment).
   * Show the Plain-English side-by-side view.
   * Click **"Generate Counter-Offer"** to show a perfectly crafted, professional email requesting Net-15 terms and a liability cap.
3. **The Vision & Market (1:30 - 2:00):**
   * Emphasize the massive shift toward independent work (over 70M freelancers in the US alone).
   * Discuss potential monetization (Freemium: 1 free scan/month, Pro: $15/month unlimited scans + lawyer-approved templates).