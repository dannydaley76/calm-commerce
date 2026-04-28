"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/browser";

function normalizeAuthError(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "That email/password combination did not work. Check your details and try again.";
  }

  if (lower.includes("email not confirmed")) {
    return "Your email address still needs confirmation before you can sign in.";
  }

  return message;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error) {
      setErrorMessage(normalizeAuthError(error));
      setMessage("");
    }
  }, []);

  const handlePasswordSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setErrorMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const bootstrapResponse = await fetch("/api/auth/bootstrap", { method: "POST" });
      if (!bootstrapResponse.ok) {
        const payload = (await bootstrapResponse.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Signed in, but could not finish account setup.");
      }

      setMessage("Signed in successfully. Redirecting...");
      window.location.href = "/";
    } catch (error) {
      const resolved = error instanceof Error ? error.message : "Unable to sign in.";
      setErrorMessage(normalizeAuthError(resolved));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-6">
        <p className="text-sm text-muted">Calm Commerce OS</p>
        <h1 className="mt-1 text-2xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-muted">Use your email and password to pick up your progress, worksheet answers, and operating canvas.</p>

        <form onSubmit={handlePasswordSignIn} className="mt-6 space-y-4">
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
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl border border-cobalt-600/20 bg-cobalt-600 px-4 py-3 font-medium !text-white hover:bg-[#0047bc] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-5 rounded-xl bg-[#f4f8ff] p-4 text-sm text-[#23408e]">
          <p className="font-semibold">What happens after sign-in?</p>
          <p className="mt-2 leading-6">You’ll return to your learner dashboard, where you can continue Chapter 3, resume unfinished worksheet work, or open your Lean Canvas.</p>
        </div>

        <div className="mt-5 flex flex-col gap-2 text-sm">
          <Link href="/signup" className="text-cobalt-600 hover:underline">
            Create account
          </Link>
          <Link href="/forgot-password" className="text-cobalt-600 hover:underline">
            Forgot password?
          </Link>
        </div>

        {message ? <p className="mt-4 text-sm text-muted">{message}</p> : null}
        {errorMessage ? <p className="mt-4 text-sm text-red-600">{errorMessage}</p> : null}
      </div>
    </main>
  );
}
