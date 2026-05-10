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
  const storageKey = `ideas-import-notice:${tone}:${title}:${body}`;
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(window.sessionStorage.getItem(storageKey) === "dismissed");
  }, [storageKey]);

  function dismiss() {
    window.sessionStorage.setItem(storageKey, "dismissed");
    setDismissed(true);
  }

  if (dismissed) return null;

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
            <PrimaryButton href="/upgrade?plan=scout_basic">
              {cta}
            </PrimaryButton>
          ) : null}
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg border border-current/20 bg-white/50 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-cobalt-500 focus:ring-offset-2"
          >
            Dismiss
          </button>
        </div>
      </div>
    </section>
  );
}
