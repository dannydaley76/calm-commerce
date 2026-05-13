"use client";

import { useEffect, useState } from "react";
import { PrimaryButton, SecondaryButton } from "@/components/design-system";

declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage?: (
          extensionId: string,
          message: unknown,
          callback?: (response?: { ok?: boolean; error?: string }) => void,
        ) => void;
        lastError?: { message?: string };
      };
    };
  }
}

type Props = {
  extensionId: string;
  token: string;
  apiBaseUrl: string;
  expiresAt: string;
};

export function ScoutExtensionConnectClient({ extensionId, token, apiBaseUrl, expiresAt }: Props) {
  const [state, setState] = useState<"connecting" | "connected" | "error">("connecting");
  const [message, setMessage] = useState("Connecting Scout Pro to your browser extension…");

  useEffect(() => {
    if (!extensionId) {
      setState("error");
      setMessage("Open this page from the Scout extension so we know which extension to connect.");
      return;
    }

    if (!window.chrome?.runtime?.sendMessage) {
      setState("error");
      setMessage("Chrome extension messaging is not available in this browser.");
      return;
    }

    window.chrome.runtime.sendMessage(
      extensionId,
      {
        source: "calm_commerce",
        action: "connectScoutPro",
        token,
        apiBaseUrl,
        expiresAt,
      },
      (response) => {
        if (window.chrome?.runtime?.lastError) {
          setState("error");
          setMessage(window.chrome.runtime.lastError.message || "Could not reach the Scout extension.");
          return;
        }

        if (!response?.ok) {
          setState("error");
          setMessage(response?.error || "The Scout extension did not accept the connection.");
          return;
        }

        setState("connected");
        setMessage("Scout Pro is connected. You can return to the product page and scan with AI research.");
      },
    );
  }, [apiBaseUrl, expiresAt, extensionId, token]);

  return (
    <div className="rounded-2xl border border-ink-100 bg-surface-raised p-8 shadow-card">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-600">Scout Pro</p>
      <h1 className="mt-3 font-[Manrope] text-3xl font-bold text-ink-900">
        {state === "connected" ? "Extension connected" : state === "error" ? "Connection needs attention" : "Connecting extension"}
      </h1>
      <p className="mt-3 text-sm leading-7 text-ink-600">{message}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <PrimaryButton href="/ideas">Open Workspace</PrimaryButton>
        <SecondaryButton href="/account">Account</SecondaryButton>
      </div>
    </div>
  );
}
