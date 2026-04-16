"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "../../lib/supabase/browser";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordReset = async (event: React.FormEvent<HTMLFormElement>) => {
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
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setMessage("Your password has been updated. You can now sign in with your new password.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-6">
        <p className="text-sm text-muted">Calm Commerce OS</p>
        <h1 className="mt-1 text-2xl font-semibold">Set new password</h1>
        <p className="mt-2 text-sm text-muted">Choose a new password for your learner account.</p>

        <form onSubmit={handlePasswordReset} className="mt-6 space-y-4">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent"
          />
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl border border-[#0053dc]/20 bg-[#0053dc] px-4 py-3 font-medium !text-white hover:bg-[#0047bc] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Updating…" : "Update password"}
          </button>
        </form>

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
