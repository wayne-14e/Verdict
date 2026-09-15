# PROJECT_CONTEXT.md — Verdict (single source of truth)

> Brand: **Verdict** — *Know what you're signing before you sign.* (rebranded from The Freelancer's Lawyer)

## Status: LIGHT/DARK THEME SWITCH SHIPPED (verified `npm run build`; Firestore rules deployed)

## Theme (light is primary/default)
- Light is the default theme; dark is opt-in via a fixed bottom-left toggle (`ThemeSwitch`, `fixed bottom-6 left-6 z-50`).
- `html` carries `class="light"` + `suppressHydrationWarning`; Tailwind `darkMode: "class"` toggles `.dark` on `document.documentElement`.
- `components/ThemeProvider.tsx`: React context (`useTheme()`), defaults to `"light"`, persists selection to `localStorage` key `verdict-theme`, always renders the Provider (wrapping `AuthProvider`) so auth/firebase state never remounts. In `app/layout.tsx`: `<ThemeProvider><AuthProvider>…<ThemeSwitch/></AuthProvider></ThemeProvider>`.
- Dual-theme conversion pattern across pages/components: light-first utility + `dark:` variant, e.g. `text-slate-500 dark:text-slate-400`, `border-slate-200 dark:border-slate-700/50`, `bg-white dark:bg-[#0F172A]`. Brand `#6366F1` surfaces keep `text-white`. Appl: `app/page.tsx`, `app/app/page.tsx`, and `components/{ReportView,FlagCard,EmailPanel,ScoreGauge,AuthModal}.tsx` are all dual-themed.
- `ScoreGauge.tsx` uses inline `var(--gauge-track, #e2e8f0)` and the light/dark risk-bg CSS variables for its chip.

## Auth-gated redirects
- `/` (landing) redirects to `/app` via `useEffect` + `router.replace("/app")` when user is signed in.
- While auth is loading or user is signed in, the landing page renders `null` to prevent flash.
- Sign-out from `/app` (Profile tab) returns user to the landing page.

## Stack
- Next.js 14.2.18 App Router, React 18, TypeScript, Tailwind CSS 3
- `@google/generative-ai` (Gemini 1.5 Flash via **required** `GEMINI_API_KEY` in `.env`), `pdf-parse`, `mammoth`, `lucide-react`, `zod`, `firebase` (client Auth + Firestore), `firebase-admin` (server ID-token verification)
- Backend: Firebase project **Verdict** (`verdict-2ef0b`) — Auth (email/password + Google), Firestore `(default)` in `nam5`. No custom servers; Next.js API routes + Firebase.
- `.env` (gitignored) holds `GEMINI_*` + `NEXT_PUBLIC_FIREBASE_*` + `FIREBASE_PROJECT_ID`; `.env.example` documents all vars. Next.js loads `.env` automatically (build log: `Environments: .env`).
- Fonts: Inter / Plus Jakarta Sans (sans, semibold headings tracking-tight), JetBrains Mono / Fira Code (mono for legal extracts + redlines) via Google Fonts in `app/layout.tsx`

## Design System — Verdict (trust / high-contrast risk / fast decisions)
- **Light (default):** body bg `#F8FAFC`, card white, Primary Brand `#6366F1` (actions, glows); text slate-900/muted slate-500, borders slate-200/300
- **Dark:** Base Dark `#0F172A` (body bg), Card Surface `#1E293B` (containers), Primary Brand `#6366F1`; text slate-100/muted slate-400, borders slate-700/50-60
- Risk indicators: Red/Critical `#EF4444` on `#451A1A` (light: `#FEF2F2`), Amber/Caution `#F59E0B` on `#453006` (light: `#FFFBEB`), Green/Safe `#10B981` on `#064E3B` (light: `#F0FDF4`)
- Surfaces: `rounded-xl` cards, `rounded-lg` buttons, borders via `border-slate-200 dark:border-slate-700/50`
- Glow: red `0 0 12px rgba(239,68,68,.25)`, amber `0 0 12px rgba(245,158,11,.20)`, green `0 0 12px rgba(16,185,129,.25)`, brand `0 0 16px rgba(99,102,241,.35)`
- Tokens in `app/globals.css` (CSS vars `--bg/--card/--brand/--border/--text/--risk-*/--gauge-track` in `:root` light + `.dark`, plus `.card`, `.btn-primary`, `.btn-ghost`, `.chip`, `.badge-red/.badge-yellow/.badge-green`, color-scheme light/dark for form controls)

## Routes
- `GET /` — Marketing landing: sticky header (anchor nav, Sign in / Get started, mobile menu, real-user state via `AuthProvider`), hero + illustrative preview, capability stats, features grid, 3-step how-it-works, live-demo samples, personas, Free/Pro pricing, FAQ accordion, final CTA, footer. Auth via `AuthModal` (real Firebase Auth: email/password + Google popup, friendly error map; success → `/app`)
- `GET /app` — Analyzer tool, **sign-in required** (gate card otherwise). Sticky-style header with responsive tab nav (**Analyze** = upload/samples/fresh-result engine, **History** = past-reports list w/ inline full-report view + back button + delete, **Profile** = editable display name, plan chip, monthly usage bar, sign out; hamburger menu on mobile). Free-plan quota gate (`FREE_SCANS_PER_MONTH = 4`, Pro unlimited) with remaining-scans chip.
- `POST /api/analyze?tone=…` — requires `Authorization: Bearer <Firebase ID token>` (`401` otherwise); verifies via Admin SDK (projectId-only init, no SA key needed); **App Check**: when `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set, requires valid `X-Firebase-AppCheck` (`403` otherwise); server-side free-quota check when service credentials exist (`402` when exceeded); then Gemini analysis as before (`503` no key, `502/429` AI failure)
- `POST /api/counter-offer` — requires valid Bearer ID token (`401` otherwise) + App Check token when configured (`403`); drafts via Gemini, deterministic template fallback over real flags only

## Key files
- `app/page.tsx` (landing: sticky header/hero/preview/stats/features/how/samples/personas/pricing/FAQ/CTA/footer + AuthModal state), `app/app/page.tsx` (analyzer tool: Analyze/History/Profile tabs), `app/layout.tsx` (title `Verdict — Know what you're signing before you sign`, fonts, `class="light"`, `ThemeProvider → AuthProvider → ThemeSwitch`), `app/globals.css` (light + dark CSS custom properties, risk tokens, gauge-track)
- `app/api/analyze/route.ts`, `app/api/counter-offer/route.ts`
- `lib/types.ts` (Severity, Category, RiskFlag, AnalysisResult w/ `engine: "gemini"`, Tone), `lib/analyzer.ts` (Gemini system prompt, zod output/request schemas, `parseGeminiResult`, tone-aware `buildEmail` template formatter — **local rule engine removed**), `lib/samples.ts` (3 demo inputs), `lib/utils.ts`
- `lib/firebaseClient.ts` (lazy client init from `NEXT_PUBLIC_FIREBASE_*`, `firebaseAuth()`, `firebaseDb()`, Google provider, App Check reCAPTCHA Enterprise init + `getAppCheckHeader()`), `lib/firebaseAdmin.ts` (`server-only`: `verifyIdToken`, `verifyAppCheckToken`/`isAppCheckEnforced`, `adminDb()` null without service credentials), `lib/scans.ts` (profile merge, plan, `saveScan`/`listScans`/`countScansThisMonth`/`deleteScan` under `users/{uid}/scans`), `lib/quota.ts` (`FREE_SCANS_PER_MONTH = 4`)
- `components/AuthProvider.tsx` (session context: user/**displayName**/plan/loading/`getToken`/`refreshPlan`/`refreshUser`; syncs profile on sign-in), `components/AuthModal.tsx` (real Firebase email + Google auth, no backend stub), `components/ReportView.tsx` (shared full verdict report: Health Index, filters, flag cards, counter-offer — fresh scans in Analyze, inline detail in History), `components/ScoreGauge.tsx`, `components/FlagCard.tsx`, `components/EmailPanel.tsx`, `components/ThemeProvider.tsx` (light-default theme context + localStorage), `components/ThemeSwitch.tsx` (fixed bottom-left light/dark toggle)
- `firestore.rules` (owner-only: `users/{uid}` + `users/{uid}/scans/{scanId}`, deny-all default — **deployed**), `firebase.json` (firestore + auth provider config), `.firebaserc`, `firestore.indexes.json`
- `.env.example` (`GEMINI_*`, `NEXT_PUBLIC_FIREBASE_*`, `FIREBASE_PROJECT_ID`, optional `GOOGLE_APPLICATION_CREDENTIALS`, optional `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`), `README.md` (setup, routes, security model)

## Features shipped (per IDEA.md MVP, now under Verdict brand)
1. Multi-format ingestion (PDF/DOCX/TXT/paste, drag-drop)
2. Verdict Health Index scorecard (0–100, HIGH RISK/CAUTION/SAFE, `● N Red Flags ● N Yellow Flags ● N Safe Clauses`)
3. Side-by-side clause translator (mono legalese vs plain English + why-it-matters + copyable redline)
4. 1-click counter-offer (polite/firm/strict tones, copy subject/body)
5. 3 pre-loaded samples: Trap Agency, Unlimited Revisions, Fair Freelance
6. Firebase Auth (email/password + Google) gating scans; per-user scan history (save/re-view/delete)
7. Free-plan quota (4 scans/month, Pro unlimited via `plan` on user doc; grant Pro by setting `plan: "pro"` in Firestore)

## Run
- `npm install` → copy `.env.example` to `.env`, set **required** `GEMINI_API_KEY` + `NEXT_PUBLIC_FIREBASE_*` (SDK config) → `npm run dev` → open http://localhost:3000
- Firebase deploys: rules are live (`firestore` deploy succeeded); re-deploy with a Firebase-tools deploy of `firestore` after editing `firestore.rules`. Grant Pro: Firestore console → `users/{uid}` → set `plan` to `"pro"`.
