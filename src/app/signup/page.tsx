"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/browser";

function getEmailRedirectTo() {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/auth/callback`;
}

function normalizeAuthError(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("already registered") || lower.includes("user already registered")) {
    return "An account with that email already exists. Try signing in instead.";
  }

  if (lower.includes("password")) {
    return message;
  }

  return message;
}

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [nextDestination, setNextDestination] = useState("/");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    setNextDestination(next?.startsWith("/") ? next : "/");
  }, []);

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setErrorMessage("");
    setNeedsConfirmation(false);

    if (password !== confirmPassword) {
      setErrorMessage("Your password confirmation does not match.");
      setIsSubmitting(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getEmailRedirectTo(),
        },
      });

      if (error) throw error;

      if (data.session) {
        const bootstrapResponse = await fetch("/api/auth/bootstrap", { method: "POST" });
        if (!bootstrapResponse.ok) {
          const payload = (await bootstrapResponse.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error || "Account created, but initial setup did not complete.");
        }

        setMessage("Account created. Redirecting...");
        window.location.href = nextDestination;
        return;
      }

      setNeedsConfirmation(true);
      setMessage("Account created. Check your email to confirm your account, then return here to sign in.");
    } catch (error) {
      const resolved = error instanceof Error ? error.message : "Unable to create account.";
      setErrorMessage(normalizeAuthError(resolved));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendConfirmation = async () => {
    const targetEmail = email.trim();
    if (!targetEmail) {
      setErrorMessage("Enter your email address first, then resend the confirmation email.");
      return;
    }

    setIsResending(true);
    setMessage("");
    setErrorMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: targetEmail,
        options: {
          emailRedirectTo: getEmailRedirectTo(),
        },
      });

      if (error) throw error;
      setNeedsConfirmation(true);
      setMessage("Confirmation email sent. Check your inbox and spam folder, then return here to sign in.");
    } catch (error) {
      const resolved = error instanceof Error ? error.message : "Unable to resend confirmation email.";
      setErrorMessage(normalizeAuthError(resolved));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-6">
        <p className="text-sm text-muted">Calm Commerce OS</p>
        <h1 className="mt-1 text-2xl font-semibold">Create account</h1>
        <p className="mt-2 text-sm text-muted">Set up your learner account so you can save progress, worksheet answers, and your operating canvas.</p>

        <form onSubmit={handleSignup} className="mt-6 space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent"
          />
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl border border-cobalt-600/20 bg-cobalt-600 px-4 py-3 font-medium !text-white hover:bg-[#0047bc] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        {needsConfirmation ? (
          <div className="mt-5 rounded-xl bg-[#f4f8ff] p-4 text-sm text-[#23408e]">
            <p className="font-semibold">Confirm your email</p>
            <p className="mt-2 leading-6">
              We sent a confirmation link to {email}. Open that email first, then come back and sign in.
            </p>
            <p className="mt-2 leading-6">
              No email yet? Check spam or resend the confirmation email.
            </p>
            <button
              type="button"
              onClick={() => void handleResendConfirmation()}
              disabled={isResending}
              className="mt-3 rounded-xl border border-[#d9def2] bg-white px-4 py-2 text-sm font-semibold text-[#23408e] transition hover:bg-[#edf3ff] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isResending ? "Sending…" : "Resend confirmation email"}
            </button>
          </div>
        ) : (
          <div className="mt-5 rounded-xl bg-[#f4f8ff] p-4 text-sm text-[#23408e]">
            <p className="font-semibold">What you get with an account</p>
            <p className="mt-2 leading-6">Your Chapter 3 progress, worksheet responses, and next-step flow stay attached to your learner account instead of disappearing between sessions.</p>
          </div>
        )}

        <div className="mt-5 text-sm">
          <Link
            href={`/login?next=${encodeURIComponent(nextDestination)}`}
            className="text-cobalt-600 hover:underline"
          >
            Back to sign in
          </Link>
        </div>

        {message ? <p className="mt-4 text-sm text-muted">{message}</p> : null}
        {errorMessage ? <p className="mt-4 text-sm text-red-600">{errorMessage}</p> : null}
      </div>
    </main>
  );
}
