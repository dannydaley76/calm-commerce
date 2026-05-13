"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { PrimaryButton } from "@/components/design-system";

type ImportNoticeProps = {
  title: string;
  body: string;
  tone: "success" | "error";
  cta?: string;
};

export function IdeasImportNotice({ title, body, tone, cta }: ImportNoticeProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (tone !== "success") return;

    const timeout = window.setTimeout(() => setDismissed(true), 5000);
    return () => window.clearTimeout(timeout);
  }, [tone]);

  function dismiss() {
    setDismissed(true);
  }

  if (dismissed) return null;

  if (tone === "success") {
    return (
      <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border border-success-100 bg-white px-5 py-4 text-sm leading-6 text-[#005e3f] shadow-[0_18px_48px_rgba(11,42,57,0.18)]">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success-100 text-xs font-black">
            ✓
          </span>
          <div className="min-w-0">
            <h2 className="font-[Manrope] text-base font-bold">{title}</h2>
            <p className="mt-1">{body}</p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss notification"
            className="ml-auto rounded-md px-2 py-1 text-xs font-bold text-ink-500 transition hover:bg-surface-sunken hover:text-ink-900 focus:outline-none focus:ring-2 focus:ring-cobalt-500"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  const errorStyle: CSSProperties | undefined = tone === "error"
    ? {
      borderColor: "var(--error-700)",
      backgroundColor: "var(--error-100)",
      color: "var(--error-700)",
      "--tw-ring-color": "var(--error-100)",
    } as CSSProperties
    : undefined;

  return (
    <section
      className={[
        "rounded-xl border px-5 py-4 text-sm leading-6 shadow-card",
        tone === "error"
          ? "border-2 ring-2"
          : "border-success-100 bg-success-100 text-[#005e3f]",
      ].join(" ")}
      style={errorStyle}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          {tone === "error" ? (
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-white text-lg font-black shadow-sm"
              style={{
                borderColor: "var(--error-700)",
                color: "var(--error-700)",
              }}
            >
              !
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 className="font-[Manrope] text-lg font-bold">{title}</h2>
            <p className="mt-1">{body}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {cta ? (
            <PrimaryButton href="/upgrade">
              {cta}
            </PrimaryButton>
          ) : null}
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg border border-current/20 bg-white/50 px-3 py-2 text-sm font-semibold transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-cobalt-500 focus:ring-offset-2"
          >
            Dismiss
          </button>
        </div>
      </div>
    </section>
  );
}
