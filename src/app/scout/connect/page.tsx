import Link from "next/link";
import { PrimaryButton, SecondaryButton } from "@/components/design-system";
import { getAccessStateForCurrentUser } from "@/lib/auth/get-access-state";
import { canIssueScoutExtensionTokens, createScoutExtensionToken } from "@/lib/scout/extension-token";
import { isScoutMcpConfigured } from "@/lib/scout/mcp-proxy";
import { ScoutExtensionConnectClient } from "./scout-extension-connect-client";

export default async function ScoutConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ extensionId?: string }>;
}) {
  const [params, access] = await Promise.all([searchParams, getAccessStateForCurrentUser()]);
  const extensionId = (params.extensionId ?? "").trim();
  const next = `/scout/connect${extensionId ? `?extensionId=${encodeURIComponent(extensionId)}` : ""}`;

  if (!access.authenticated) {
    return (
      <main className="min-h-screen bg-background px-6 py-10 text-foreground">
        <div className="mx-auto max-w-xl rounded-2xl border border-ink-100 bg-surface-raised p-8 shadow-card">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-600">Scout Pro</p>
          <h1 className="mt-3 font-[Manrope] text-3xl font-bold text-ink-900">Sign in to connect Scout Pro</h1>
          <p className="mt-3 text-sm leading-7 text-ink-600">
            Sign in with the account that has Scout Pro, then we’ll connect the extension automatically.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryButton href={`/login?next=${encodeURIComponent(next)}`}>Sign in</PrimaryButton>
            <SecondaryButton href={`/signup?next=${encodeURIComponent(next)}`}>Create account</SecondaryButton>
          </div>
        </div>
      </main>
    );
  }

  if (!access.canUseMcpResearch) {
    return (
      <main className="min-h-screen bg-background px-6 py-10 text-foreground">
        <div className="mx-auto max-w-xl rounded-2xl border border-ink-100 bg-surface-raised p-8 shadow-card">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-600">Scout Pro</p>
          <h1 className="mt-3 font-[Manrope] text-3xl font-bold text-ink-900">Upgrade to connect AI research</h1>
          <p className="mt-3 text-sm leading-7 text-ink-600">
            Your extension is installed. Upgrade to Scout Pro to scan beyond Amazon and AliExpress with AI-assisted research.
          </p>
          <div className="mt-6">
            <PrimaryButton href="/upgrade?plan=scout_pro">View Scout Pro</PrimaryButton>
          </div>
        </div>
      </main>
    );
  }

  if (!extensionId || !access.learnerId || !canIssueScoutExtensionTokens() || !isScoutMcpConfigured()) {
    return (
      <main className="min-h-screen bg-background px-6 py-10 text-foreground">
        <div className="mx-auto max-w-xl rounded-2xl border border-ink-100 bg-surface-raised p-8 shadow-card">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-600">Scout Pro</p>
          <h1 className="mt-3 font-[Manrope] text-3xl font-bold text-ink-900">Connection not ready</h1>
          <p className="mt-3 text-sm leading-7 text-ink-600">
            Open this page from the Scout extension after the production token and MCP environment variables are configured.
          </p>
          <Link href="/account" className="mt-6 inline-flex text-sm font-semibold text-cobalt-600 underline-offset-4 hover:underline">
            Back to account
          </Link>
        </div>
      </main>
    );
  }

  const { token, expiresAt } = createScoutExtensionToken(access.learnerId);
  const apiBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.calmcommerce.net";

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-xl">
        <ScoutExtensionConnectClient
          extensionId={extensionId}
          token={token}
          apiBaseUrl={apiBaseUrl}
          expiresAt={expiresAt}
        />
      </div>
    </main>
  );
}
