"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = useMemo(() => {
    if (typeof window === "undefined") return `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback?next=/reset-password`;
    const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    const baseUrl = configuredSiteUrl && configuredSiteUrl.length > 0 ? configuredSiteUrl : window.location.origin;
    return `${baseUrl.replace(/\/$/, "")}/auth/callback?next=/reset-password`;
  }, []);

  const handleResetRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setErrorMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) throw error;

      setMessage("Password reset instructions have been sent. Check your inbox and follow the link to set a new password.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to send password reset instructions.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-6">
        <p className="text-sm text-muted">Calm Commerce OS</p>
        <h1 className="mt-1 text-2xl font-semibold">Forgot password</h1>
        <p className="mt-2 text-sm text-muted">Enter your email and we’ll send you a link to set a new password so you can get back to your learner progress.</p>

        <form onSubmit={handleResetRequest} className="mt-6 space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl border border-[#0053dc]/20 bg-[#0053dc] px-4 py-3 font-medium !text-white hover:bg-[#0047bc] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Sending…" : "Send reset instructions"}
          </button>
        </form>

        <div className="mt-5 rounded-xl bg-[#f4f8ff] p-4 text-sm text-[#23408e]">
          <p className="font-semibold">After you reset your password</p>
          <p className="mt-2 leading-6">You’ll be able to sign back in and continue from your dashboard, worksheet, or Lean Canvas without starting over.</p>
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
