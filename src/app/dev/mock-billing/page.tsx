"use client";

import { useState } from "react";
import Link from "next/link";

const STATES = [
  { value: "preview", label: "Set preview" },
  { value: "active", label: "Set active paid" },
  { value: "expired", label: "Set expired" },
  { value: "cancelled", label: "Set cancelled" },
] as const;

export default function MockBillingPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const updateState = async (status: string) => {
    setLoading(status);
    setMessage("");

    try {
      const res = await fetch("/api/dev/set-entitlement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string; status?: string; accessLevel?: string };
      if (!res.ok) throw new Error(data.error || "Failed to update entitlement.");

      setMessage(`Mock entitlement set to ${data.status} (${data.accessLevel}).`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to update entitlement.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#faf8fe] px-6 py-10 text-ink-900">
      <div className="mx-auto max-w-2xl rounded-[2rem] bg-white p-8 shadow-[0px_24px_48px_rgba(11,42,57,0.08)] lg:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#5b48d6]">Dev only</p>
        <h1 className="mt-4 font-[Manrope] text-4xl font-extrabold tracking-tight">Mock billing controls</h1>
        <p className="mt-4 text-sm leading-7 text-ink-500">
          Use this local testing page to switch the current learner between preview, active paid, expired, and cancelled states without using Stripe.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {STATES.map((item) => (
            <button
              key={item.value}
              onClick={() => updateState(item.value)}
              disabled={loading !== null}
              className="rounded-xl bg-[#5b48d6] px-5 py-4 font-semibold !text-white disabled:opacity-60"
            >
              {loading === item.value ? "Updating…" : item.label}
            </button>
          ))}
        </div>

        {message ? <p className="mt-6 text-sm text-ink-500">{message}</p> : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="inline-flex items-center justify-center rounded-xl border border-ink-100 bg-white px-5 py-3 font-semibold text-ink-900">
            Back to dashboard
          </Link>
          <Link href="/upgrade" className="inline-flex items-center justify-center rounded-xl border border-ink-100 bg-white px-5 py-3 font-semibold text-ink-900">
            View upgrade page
          </Link>
        </div>
      </div>
    </main>
  );
}
