import { LearnerShell } from "@/components/learner-shell";
import { PrimaryButton, SecondaryButton } from "@/components/design-system";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import { getAccessStateForCurrentUser } from "@/lib/auth/get-access-state";
import {
  getProductIdeaLifecycles,
  type ProductIdeaLifecycle,
} from "@/lib/v2/worksheets/product-idea-lifecycle";
import { IdeasImportNotice } from "./ideas-import-notice";
import { IdeasIndexClient } from "./ideas-index-client";

type ResponseMap = Record<string, string>;
type MetricEntry = {
  id: string;
  week_ending: string;
  data_json: Record<string, string>;
};

async function getIdeaData(): Promise<{
  authenticated: boolean;
  canAccessOsContent: boolean;
  canUseScannerImport: boolean;
  canUseResearchWorkspace: boolean;
  ideas: ProductIdeaLifecycle[];
  error?: string;
}> {
  try {
    const { supabase, user, projectId } = await getActiveProjectForCurrentUser();
    if (!user || !projectId) {
      return { authenticated: false, canAccessOsContent: false, canUseScannerImport: false, canUseResearchWorkspace: false, ideas: [] };
    }

    const access = await getAccessStateForCurrentUser();
    const responseQuery = supabase
      .from("worksheet_responses")
      .select("field_key, value_json")
      .eq("project_id", projectId);
    const scopedResponseQuery = access.canAccessOsContent
      ? responseQuery
      : responseQuery.in("worksheet_id", ["ideas-worksheet", "unit-economics-worksheet"]);

    const { data } = await scopedResponseQuery;
    const metricRows = access.canAccessOsContent
      ? (
        await supabase
          .from("weekly_metrics")
          .select("id, week_ending, data_json")
          .eq("project_id", projectId)
          .order("week_ending", { ascending: false })
      ).data
      : [];

    const responses: ResponseMap = Object.fromEntries(
      (data ?? []).map((row) => [
        row.field_key,
        typeof row.value_json === "string" ? row.value_json : String(row.value_json ?? ""),
      ]),
    );

    return {
      authenticated: true,
      canAccessOsContent: access.canAccessOsContent,
      canUseScannerImport: access.canUseScannerImport,
      canUseResearchWorkspace: access.canUseResearchWorkspace,
      ideas: getProductIdeaLifecycles(responses, (metricRows ?? []) as MetricEntry[]),
    };
  } catch (error) {
    return {
      authenticated: true,
      canAccessOsContent: false,
      canUseScannerImport: false,
      canUseResearchWorkspace: false,
      ideas: [],
      error: error instanceof Error ? error.message : "Unable to load your ideas right now.",
    };
  }
}

function EmptyIdeas() {
  const scoutExtensionUrl = process.env.NEXT_PUBLIC_SCOUT_EXTENSION_URL || "/scout";

  return (
    <section className="rounded-xl border border-dashed border-ink-100 bg-surface-raised p-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-600">
        Scout Workspace
      </p>
      <h2 className="mt-2 font-[Manrope] text-2xl font-bold text-ink-900">
        No products captured yet
      </h2>
      <p className="mt-3 max-w-[620px] text-sm leading-7 text-ink-600">
        Scan products with Scout. This workspace is where new products become a shortlist you can review, test, or archive.
      </p>
      <div className="mt-5">
        <PrimaryButton href={scoutExtensionUrl}>
          Get Scout extension
        </PrimaryButton>
      </div>
    </section>
  );
}

function importNotice(importStatus?: string, importError?: string) {
  if (importStatus === "added") {
    return {
      title: "Added to Scout Workspace",
      body: "The product was captured from Scout and is ready to sort, note, promote, or delete.",
      tone: "success",
    };
  }
  if (importStatus === "updated") {
    return {
      title: "Existing product updated",
      body: "Scout found this source URL already in Workspace, so the saved product was refreshed instead of duplicated.",
      tone: "success",
    };
  }
  if (!importError) return null;
  const messages: Record<string, string> = {
    missing: "Scout did not include product data. Open Scout on a product page and try Save to Workspace again.",
    invalid: "Scout sent product data we could not read. Reload the extension and try again.",
    expired: "That Scout capture is too old. Scan the product again to save fresh data.",
    scout_save_limit: "Scout tried to save this product, but your free Workspace saves are used up. Upgrade Scout to save more product ideas.",
    failed: "The Scout capture could not be saved. Try again from the extension.",
  };
  if (importError === "scout_save_limit") {
    return {
      title: "Workspace limit reached",
      body: messages.scout_save_limit,
      tone: "error",
      cta: "Upgrade Scout",
    };
  }
  return {
    title: "Scout import did not save",
    body: messages[importError] ?? messages.failed,
    tone: "error",
    cta: importError === "scout_save_limit" ? "Upgrade Scout" : null,
  };
}

export default async function IdeasPage({
  searchParams,
}: {
  searchParams?: Promise<{ imported?: string; importStatus?: string; importError?: string }>;
}) {
  const params = await searchParams;
  const data = await getIdeaData();
  const notice = importNotice(params?.importStatus, params?.importError);
  const navItems = data.canAccessOsContent
    ? [
      { href: "/",            label: "Dashboard" },
      { href: "/program",     label: "Program" },
      { href: "/ideas",       label: "Ideas", active: true },
      { href: "/lean-canvas", label: "Lean Canvas" },
      { href: "/metrics",     label: "Metrics" },
      { href: "/account",     label: "Account" },
    ]
    : [
      { href: "/ideas",   label: "Scout Workspace", active: true },
      { href: "/account", label: "Account" },
    ];

  return (
    <LearnerShell
      items={navItems}
      homeHref={data.canAccessOsContent ? "/" : "/ideas"}
      showLogout={data.authenticated}
    >
      <div className="space-y-5">
        <section className="rounded-xl border border-ink-100 bg-surface-raised px-5 py-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-600">
                Product candidates
              </p>
              <h1 className="mt-1 font-[Manrope] text-2xl font-bold text-ink-900">
                Scout Workspace
              </h1>
              <p className="mt-1 max-w-[720px] text-sm leading-6 text-ink-600">
                Review captured products, sort by signal strength, build a shortlist, and archive the noise.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {!data.authenticated ? (
                <PrimaryButton href="/login?next=/ideas">
                  Sign in to view ideas
                </PrimaryButton>
              ) : null}
              {data.authenticated && data.canAccessOsContent ? (
                <SecondaryButton href="/chapter/brainstorm-with-discipline/steps?step=chapter-3-step-4-score-and-shortlist">
                  {data.ideas.length > 0 ? "Add another idea" : "Add first idea"}
                </SecondaryButton>
              ) : null}
            </div>
          </div>
        </section>

        {notice ? (
          <IdeasImportNotice
            title={notice.title}
            body={notice.body}
            tone={notice.tone as "success" | "error"}
            cta={notice.cta ?? undefined}
          />
        ) : null}

        {data.error ? (
          <section className="rounded-xl border border-error-100 bg-surface-raised p-6 text-sm leading-6 text-ink-700">
            <h2 className="font-[Manrope] text-lg font-bold text-ink-900">Ideas could not be loaded</h2>
            <p className="mt-2 text-ink-600">
              Your session is active, but the idea history did not load. Refresh the page, or try signing in again if this persists.
            </p>
          </section>
        ) : !data.authenticated ? null : data.ideas.length === 0 ? (
          <EmptyIdeas />
        ) : (
          <IdeasIndexClient
            ideas={data.ideas}
            canAccessOsContent={data.canAccessOsContent}
            canUseScannerImport={data.canUseScannerImport}
            canUseResearchWorkspace={data.canUseResearchWorkspace}
            highlightedIdeaId={params?.imported}
          />
        )}
      </div>
    </LearnerShell>
  );
}
