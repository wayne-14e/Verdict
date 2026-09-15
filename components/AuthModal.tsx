"use client";

import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type AuthError,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { Chrome, Eye, EyeOff, Gavel, KeyRound, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { firebaseAuth, googleProvider } from "@/lib/firebaseClient";

export type AuthMode = "signup" | "signin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function friendlyError(err: unknown): string {
  const code =
    err instanceof FirebaseError
      ? err.code
      : (err as AuthError)?.code || "";
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists — try signing in.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password. Try again or create an account.";
    case "auth/too-many-requests":
      return "Too many attempts — please wait a minute and try again.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was closed before completing.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google popup. Allow popups and retry.";
    case "auth/operation-not-allowed":
      return "This sign-in method isn't enabled yet. Contact support.";
    case "auth/network-request-failed":
      return "Network error — check your connection and retry.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function AuthModal({
  open,
  initialMode,
  onClose,
  onSuccess,
}: {
  open: boolean;
  initialMode: AuthMode;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<"email" | "google" | "reset" | null>(null);

  // Reset state whenever the modal is (re)opened
  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setName("");
      setEmail("");
      setPassword("");
      setShowPassword(false);
      setResetSent(false);
      setError("");
      setLoading(null);
      document.body.style.overflow = "hidden";
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
      window.addEventListener("keydown", onKey);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", onKey);
      };
    }
  }, [open, initialMode, onClose]);

  if (!open) return null;

  function randomChar(set: string): string {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return set[buf[0] % set.length];
  }

  /** 16-char cryptographically random password, guaranteed mixed classes. */
  function generatePassword() {
    const lowers = "abcdefghijkmnopqrstuvwxyz";
    const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const digits = "23456789";
    const symbols = "!@#$%^&*-_+=?";
    const all = lowers + uppers + digits + symbols;
    const chars = [
      randomChar(lowers),
      randomChar(uppers),
      randomChar(uppers),
      randomChar(digits),
      randomChar(digits),
      randomChar(symbols),
    ];
    for (let i = chars.length; i < 16; i++) chars.push(randomChar(all));
    // Fisher–Yates shuffle
    for (let i = chars.length - 1; i > 0; i--) {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      const j = buf[0] % (i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    setPassword(chars.join(""));
    setShowPassword(true);
    setError("");
  }

  async function submitEmail() {
    setError("");
    if (mode === "signup" && name.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading("email");
    try {
      const auth = firebaseAuth();
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) {
          await updateProfile(cred.user, { displayName: name.trim() });
        }
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      onSuccess();
    } catch (err) {
      setError(friendlyError(err));
      setLoading(null);
    }
  }

  async function submitGoogle() {
    setError("");
    setLoading("google");
    try {
      await signInWithPopup(firebaseAuth(), googleProvider());
      onSuccess();
    } catch (err) {
      setError(friendlyError(err));
      setLoading(null);
    }
  }

  async function sendReset() {
    setError("");
    setResetSent(false);
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter your email address above, then try again.");
      return;
    }
    setLoading("reset");
    try {
      await sendPasswordResetEmail(firebaseAuth(), email.trim());
      setResetSent(true);
    } catch (err) {
      // Don't reveal whether the email is registered.
      if (err instanceof FirebaseError && err.code === "auth/user-not-found") {
        setResetSent(true);
      } else {
        setError(friendlyError(err));
      }
    } finally {
      setLoading(null);
    }
  }

  const busy = loading !== null;
  const isSignup = mode === "signup";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isSignup ? "Create your Verdict account" : "Sign in to Verdict"}
    >
      <div className="card rise w-full max-w-md p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="rounded-xl bg-[#6366F1] p-2 text-white"
              style={{ boxShadow: "0 0 16px rgba(99,102,241,0.45)" }}
            >
              <Gavel className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-semibold leading-tight tracking-tight text-white">
                {isSignup ? "Create your account" : "Welcome back"}
              </p>
              <p className="text-xs text-slate-400">
                {isSignup ? "Start analyzing contracts in seconds." : "Pick up where you left off."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl border border-slate-700/60 bg-[#0F172A] p-1">
          {(["signup", "signin"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError("");
              }}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-semibold transition",
                mode === m ? "bg-[#6366F1] text-white" : "text-slate-300 hover:text-white"
              )}
              style={mode === m ? { boxShadow: "0 0 16px rgba(99,102,241,0.35)" } : undefined}
            >
              {m === "signup" ? "Sign up" : "Sign in"}
            </button>
          ))}
        </div>

        <button onClick={submitGoogle} disabled={busy} className="btn-ghost mt-4 w-full">
          {loading === "google" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Chrome className="h-4 w-4" />
          )}
          Continue with Google
        </button>

        <div className="my-4 flex items-center gap-3 text-xs text-slate-500">
          <span className="h-px flex-1 bg-slate-700/60" /> or with email{" "}
          <span className="h-px flex-1 bg-slate-700/60" />
        </div>

        <div className="space-y-3">
          {isSignup && (
            <div>
              <label htmlFor="auth-name" className="text-sm font-semibold text-slate-200">
                Full name
              </label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                autoComplete="name"
                className="mt-1.5 w-full rounded-xl border border-slate-700/60 bg-[#0F172A] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
              />
            </div>
          )}
          <div>
            <label htmlFor="auth-email" className="text-sm font-semibold text-slate-200">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@studio.co"
              autoComplete="email"
              className="mt-1.5 w-full rounded-xl border border-slate-700/60 bg-[#0F172A] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="auth-password" className="text-sm font-semibold text-slate-200">
                Password
              </label>
              {isSignup && (
                <button
                  onClick={generatePassword}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#a5b4fc] hover:underline"
                >
                  <KeyRound className="h-3.5 w-3.5" /> Generate
                </button>
              )}
            </div>
            <div className="relative mt-1.5">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitEmail()}
                placeholder="Minimum 6 characters"
                autoComplete={isSignup ? "new-password" : "current-password"}
                className="w-full rounded-xl border border-slate-700/60 bg-[#0F172A] px-3.5 py-2.5 pr-11 text-sm text-slate-100 placeholder:text-slate-500"
              />
              <button
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {!isSignup && (
              <div className="mt-2 text-right">
                <button
                  onClick={sendReset}
                  disabled={busy}
                  className="text-xs font-semibold text-[#a5b4fc] hover:underline disabled:opacity-50"
                >
                  {loading === "reset" ? "Sending…" : "Forgot password?"}
                </button>
              </div>
            )}
          </div>
        </div>

        {error && <p className="mt-3 text-sm font-medium text-[#EF4444]">{error}</p>}
        {resetSent && (
          <p className="mt-3 text-sm font-medium text-[#10B981]">
            Reset link sent — check your inbox (and spam folder). The link expires in 1 hour.
          </p>
        )}

        <button onClick={submitEmail} disabled={busy} className="btn-primary mt-4 w-full">
          {loading === "email" && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading === "email" ? "Please wait…" : isSignup ? "Get started free" : "Sign in"}
        </button>

        <p className="mt-3 text-center text-xs leading-relaxed text-slate-500">
          Secured by Firebase Authentication. Free plan includes 4 scans per month.
        </p>
      </div>
    </div>
  );
}
