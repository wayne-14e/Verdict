# Verdict — Know what you're signing before you sign.

AI-powered contract analysis for freelancers: upload any client agreement and get a risk verdict, plain-English clause translations, and a ready-to-send counter-offer — in seconds.

## Features

- **Multi-format ingestion** — drag-and-drop PDF, DOCX, or TXT (up to 10 MB / 120K chars), or paste text directly
- **Verdict Health Index** — 0–100 safety score with HIGH RISK / CAUTION / SAFE verdicts and red/yellow/green flag counts
- **Side-by-side translator** — original legalese vs. plain English, plus why-it-matters and a copy-ready redline per flag
- **1-click counter-offer** — professional negotiation email in polite, firm, or strict tone
- **Accounts & history** — Firebase Auth (email/password + Google), private per-user scan history with re-view and delete
- **Free-plan quota** — 4 scans/month free, unlimited on Pro
- **Marketing landing page** — sticky header, hero, features, how-it-works, samples, pricing, FAQ, auth modals

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS 3, custom dark design tokens, Lucide icons |
| AI engine | Gemini 3.5 Flash via `@google/generative-ai` (sole engine — no mock fallback) |
| Backend | Firebase (Auth + Firestore) on project `verdict-2ef0b` |
| Server auth | `firebase-admin` ID-token + App Check verification in API routes |
| Validation | Zod on every API input and on Gemini's structured output |

## Routes

| Route | Description |
|---|---|
| `GET /` | Marketing landing page with sign-up/sign-in modals |
| `GET /app` | Analyzer tool (sign-in required) with Analyze / History / Profile tabs |
| `POST /api/analyze?tone=polite\|firm\|strict` | Contract analysis. Requires `Authorization: Bearer <ID token>` |
| `POST /api/counter-offer` | Tone-aware counter-offer draft. Requires auth |

API errors are explicit: `401` unauthenticated/expired session, `402` free quota exceeded, `403` App Check failure, `503` Gemini key missing, `502/429` AI failure.

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
# open http://localhost:3000
```

### 1. Gemini key (required)

Get a key at <https://aistudio.google.com/app/apikey> and set:

```env
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-3.5-flash
```

### 2. Firebase config (required)

Firebase console → Project settings → Your apps → SDK setup, then set the
`NEXT_PUBLIC_FIREBASE_*` vars plus `FIREBASE_PROJECT_ID` (see `.env.example`).
Enable **Email/Password** and **Google** providers under Authentication.

### 3. Service account (enables strict server-side quota)

Without it, quota is enforced in the app UI only. With it, `/api/analyze`
rejects over-quota scans with `402`:

1. Firebase console → Project settings → Service accounts → Generate new private key
2. **Local dev:** save the JSON **outside the repo** and set `GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json`
3. **Vercel/hosted:** paste the full JSON content into `FIREBASE_SERVICE_ACCOUNT` (no file needed)
4. Restart/redeploy — the server picks it up automatically

### Deploying to Vercel

Add these under Project → Settings → Environment Variables (all environments,
or Production + Preview as you prefer):

| Variable | Required? | Notes |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Server-only; never expose to the browser |
| `GEMINI_MODEL` | No | Defaults to `gemini-1.5-flash` if unset |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Bake-in at build time — redeploy after changing |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | Same as above |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Same as above |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | Same as above |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | Same as above |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | Same as above |
| `FIREBASE_PROJECT_ID` | Yes | Server-only, needed for token verification |
| `FIREBASE_SERVICE_ACCOUNT` | For strict quota | Full service-account JSON (use this on Vercel, **not** a file path) |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | For App Check | Only set once the key is registered; enforcement activates on deploy |
| `GOOGLE_APPLICATION_CREDENTIALS` | No | Local-dev only — do **not** copy your Windows path to Vercel |

So: everything except `GOOGLE_APPLICATION_CREDENTIALS` (local path, useless on Vercel)
and the two optionals you don't use. After deploying, finish these console steps:

1. Firebase console → Authentication → Settings → **Authorized domains** → add your `*.vercel.app` domain (else Google sign-in is blocked)
2. reCAPTCHA Enterprise key settings → add the Vercel domain to allowed domains
3. Firebase console → App Check → flip enforcement on (only after the above work)

### 4. App Check with reCAPTCHA Enterprise (optional, recommended)

1. Firebase console → App Check → register the web app with your reCAPTCHA Enterprise site key
2. Set `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` in `.env` and restart
3. Test a scan end-to-end, **then** flip enforcement on in the console

Until the site key is set, the API skips App Check verification so nothing breaks mid-setup.

### 5. Firestore rules

Owner-only rules live in `firestore.rules` and are already deployed. Re-deploy after edits with a Firebase-tools deploy of `firestore`.

## Key files

```
app/page.tsx            Landing page (sticky header, sections, auth modal state)
app/app/page.tsx        Analyzer tool (Analyze / History / Profile tabs)
app/api/analyze/       Gemini analysis route (auth + quota + validation)
app/api/counter-offer/ Tone-aware email draft route
components/AuthModal.tsx     Sign-up/sign-in, Google, password reset, generator
components/AuthProvider.tsx  Session context (user, plan, tokens, profile refresh)
components/ReportView.tsx    Shared verdict report (fresh scans + history detail)
lib/analyzer.ts         Gemini prompt, zod schemas, email template formatter
lib/firebaseClient.ts   Lazy Firebase client init + App Check
lib/firebaseAdmin.ts    Server-only token/quota/App Check helpers
lib/scans.ts            Firestore profile, plans, scan history CRUD
lib/quota.ts            FREE_SCANS_PER_MONTH = 4
lib/samples.ts          3 demo contracts (Trap Agency, Unlimited Revisions, Fair Freelance)
firestore.rules         Owner-only security rules (deployed)
```

## Plans & quotas

- **Free** — 4 scans per calendar month, enforced client-side always and server-side when service credentials exist
- **Pro** — unlimited scans. Grant manually: Firestore console → `users/{uid}` → set `plan` to `"pro"` (self-serve checkout is on the roadmap)

## Security model

- Every scan is tied to a verified Firebase user (`401` without a valid ID token)
- Users can only read/write their own profile and scans (Firestore rules, deny-all default)
- App Check rejects traffic from outside the real app once configured
- Changing email tone calls the counter-offer endpoint (AI-drafted) but never consumes scan quota
- `.env` (with live keys) is gitignored — never commit it

## Disclaimer

Verdict is a decision-support tool, not a law firm. Outputs are informational drafts — consult a licensed attorney for binding advice.
