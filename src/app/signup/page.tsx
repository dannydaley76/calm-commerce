"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "../../lib/supabase/browser";

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

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setErrorMessage("");

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
      });

      if (error) throw error;

      if (data.session) {
        const bootstrapResponse = await fetch("/api/auth/bootstrap", { method: "POST" });
        if (!bootstrapResponse.ok) {
          const payload = (await bootstrapResponse.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error || "Account created, but initial setup did not complete.");
        }

        setMessage("Account created. Redirecting to your dashboard...");
        window.location.href = "/";
        return;
      }

      setMessage("Account created. If email confirmation is required, check your inbox. Otherwise you can sign in now.");
    } catch (error) {
      const resolved = error instanceof Error ? error.message : "Unable to create account.";
      setErrorMessage(normalizeAuthError(resolved));
    } finally {
      setIsSubmitting(false);
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
            className="w-full rounded-xl border border-[#0053dc]/20 bg-[#0053dc] px-4 py-3 font-medium !text-white hover:bg-[#0047bc] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="mt-5 rounded-xl bg-[#f4f8ff] p-4 text-sm text-[#23408e]">
          <p className="font-semibold">What you get with an account</p>
          <p className="mt-2 leading-6">Your Chapter 3 progress, worksheet responses, and next-step flow stay attached to your learner account instead of disappearing between sessions.</p>
        </div>

        <div className="mt-5 text-sm">
          <Link href="/login" className="text-[#0053dc] hover:underline">
            Back to sign in
          </Link>
        </div>

        {message ? <p className="mt-4 text-sm text-muted">{message}</p> : null}
        {errorMessage ? <p className="mt-4 text-sm text-red-600">{errorMessage}</p> : null}
      </div>
    </main>
  );
}
