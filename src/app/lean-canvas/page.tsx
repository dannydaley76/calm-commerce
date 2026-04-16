import Link from "next/link";
import { Card, Eyebrow, PageHero, Panel, PrimaryButton, ProgressBar, SecondaryButton, SectionShell } from "@/components/design-system";
import { LearnerShell } from "@/components/learner-shell";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import { getAccessStateForCurrentUser } from "@/lib/auth/get-access-state";
import { getCurrencyMeta } from "@/lib/profile/currency";

const OPERATING_SECTIONS = [
  { title: "Time budget", key: "time_budget_hours_per_week" },
  { title: "Money cap", key: "money_cap_per_month" },
  { title: "Experiment duration", key: "minimum_experiment_duration" },
  { title: "Success metrics", key: "success_metrics" },
  { title: "Continue criteria", key: "continue_criteria" },
  { title: "Escalation criteria", key: "escalation_criteria" },
  { title: "Kill criteria", key: "kill_criteria" },
  { title: "Red-line rules", key: "red_line_rules" },
] as const;

const PLACEHOLDER_SECTIONS = [
  {
    title: "Problem",
    futureSource: "Future customer-pain and problem-discovery work",
  },
  {
    title: "Customer segments",
    futureSource: "Future audience and customer-definition work",
  },
  {
    title: "Unique value proposition",
    futureSource: "Future positioning and offer-clarity work",
  },
  {
    title: "Solution",
    futureSource: "Future product-shaping and offer-design work",
  },
  {
    title: "Channels",
    futureSource: "Future acquisition and distribution planning",
  },
  {
    title: "Revenue streams",
    futureSource: "Future offer, pricing, and monetisation work",
  },
  {
    title: "Cost structure",
    futureSource: "Future cost planning and operating-model work",
  },
  {
    title: "Unfair advantage",
    futureSource: "Future defensibility and differentiation work",
  },
] as const;

const OPERATING_GROUPS = [
  {
    title: "Constraints",
    description: "The limits that keep the business realistic and survivable while you learn.",
    keys: ["time_budget_hours_per_week", "money_cap_per_month", "minimum_experiment_duration"],
  },
  {
    title: "Success signals",
    description: "The evidence that tells you whether to continue, invest further, or stay patient.",
    keys: ["success_metrics", "continue_criteria", "escalation_criteria"],
  },
  {
    title: "Stop and risk rules",
    description: "The lines that protect you from forcing a weak idea or making pressure-driven decisions.",
    keys: ["kill_criteria", "red_line_rules"],
  },
] as const;

type ResponseMap = Record<string, string>;

type OperatingSectionKey = (typeof OPERATING_SECTIONS)[number]["key"];

type CanvasInsight = {
  title: string;
  body: string;
  tone: "good" | "warn" | "neutral";
};

function normalizeText(value: string | undefined) {
  return (value ?? "").trim();
}

function toBulletList(value: string | undefined) {
  const text = normalizeText(value);
  if (!text) return [] as string[];

  const pieces = text
    .split(/\n+|•|\u2022|;+/)
    .map((item) => item.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean);

  return pieces.length > 1 ? pieces : [];
}

function formatValue(value: string | undefined) {
  const text = normalizeText(value);
  if (!text) return null;

  const bullets = toBulletList(text);
  if (bullets.length > 1) {
    return { kind: "bullets" as const, bullets, text };
  }

  return { kind: "text" as const, text };
}

function getSectionStatusLabel(key: OperatingSectionKey, value: string | undefined) {
  if (normalizeText(value)) return "Set";

  if (key === "success_metrics") return "Needed for judging progress";
  if (key === "continue_criteria") return "Needed for staying the course";
  if (key === "escalation_criteria") return "Needed for investing more";
  if (key === "kill_criteria") return "Needed for stopping weak ideas";
  if (key === "red_line_rules") return "Needed for protecting boundaries";
  return "Pending";
}

function getSectionEmptyState(key: OperatingSectionKey) {
  if (key === "time_budget_hours_per_week") return "Your realistic weekly time limit is not defined yet.";
  if (key === "money_cap_per_month") return "Your safe monthly spend cap is not defined yet.";
  if (key === "minimum_experiment_duration") return "You have not set the minimum time you will give a test before judging it.";
  if (key === "success_metrics") return "You have not yet defined the signals that would count as genuine progress.";
  if (key === "continue_criteria") return "You have not yet defined what evidence is strong enough to justify continuing.";
  if (key === "escalation_criteria") return "You have not yet defined what result would justify investing more time or money.";
  if (key === "kill_criteria") return "You have not yet defined the result that would tell you to stop.";
  return "You have not yet defined the rules you refuse to break under pressure.";
}

function getCompletionSummary(filledCount: number) {
  if (filledCount === 0) return "No operating rules captured yet.";
  if (filledCount < 3) return "The canvas has started, but it is still too thin to guide real decisions.";
  if (filledCount < OPERATING_SECTIONS.length) return "The canvas is partially useful, but some decision rules are still missing.";
  return "The operating canvas is complete enough to guide your next stage of decision-making.";
}

function buildOperatingSummary(responses: ResponseMap, currencySymbol: string) {
  const timeBudget = normalizeText(responses.time_budget_hours_per_week);
  const moneyCap = normalizeText(responses.money_cap_per_month);
  const experimentDuration = normalizeText(responses.minimum_experiment_duration);

  const normalizedMoneyCap = moneyCap
    ? moneyCap.replaceAll("£", "").replaceAll("$", "").replaceAll("€", "").trim() || moneyCap
    : "";

  const parts = [
    timeBudget ? `work within ${timeBudget} hrs/week` : null,
    moneyCap ? `keep spend within ${normalizedMoneyCap} ${currencySymbol}/month` : null,
    experimentDuration ? `judge experiments over at least ${experimentDuration} weeks` : null,
  ].filter(Boolean);

  if (parts.length === 0) {
    return "You have not yet defined the basic operating constraints for this idea.";
  }

  return `Right now, your operating rule is to ${parts.join(", ")}.`;
}

function buildDecisionSummary(responses: ResponseMap) {
  const successMetrics = normalizeText(responses.success_metrics);
  const continueCriteria = normalizeText(responses.continue_criteria);
  const escalationCriteria = normalizeText(responses.escalation_criteria);
  const killCriteria = normalizeText(responses.kill_criteria);

  const fragments = [
    successMetrics ? `watch ${successMetrics}` : null,
    continueCriteria ? `continue when ${continueCriteria}` : null,
    escalationCriteria ? `invest more when ${escalationCriteria}` : null,
    killCriteria ? `stop when ${killCriteria}` : null,
  ].filter(Boolean);

  if (fragments.length === 0) {
    return "You have not yet defined enough decision signals to make this canvas genuinely actionable.";
  }

  return `Your current decision model is to ${fragments.join(", ")}.`;
}

function buildRiskSummary(responses: ResponseMap) {
  const redLines = normalizeText(responses.red_line_rules);
  const killCriteria = normalizeText(responses.kill_criteria);

  if (!redLines && !killCriteria) {
    return "You have not yet defined the boundaries that stop emotion or sunk-cost thinking from taking over.";
  }

  if (redLines && killCriteria) {
    return `You have both hard stop signals and explicit non-negotiables, which makes the operating model more disciplined under pressure.`;
  }

  if (redLines) {
    return "You have defined non-negotiables, but your stop signals could still be clearer.";
  }

  return "You have defined a stop condition, but your non-negotiables could still be clearer.";
}

function buildCanvasInsights(responses: ResponseMap, currencySymbol: string): CanvasInsight[] {
  const filledCount = getFilledCount(responses);
  const insights: CanvasInsight[] = [];

  insights.push({
    title: "Operating summary",
    body: buildOperatingSummary(responses, currencySymbol),
    tone: filledCount >= 3 ? "good" : "neutral",
  });

  insights.push({
    title: "Decision summary",
    body: buildDecisionSummary(responses),
    tone: normalizeText(responses.success_metrics) && normalizeText(responses.kill_criteria) ? "good" : "warn",
  });

  insights.push({
    title: "Risk posture",
    body: buildRiskSummary(responses),
    tone: normalizeText(responses.red_line_rules) ? "good" : "warn",
  });

  return insights;
}

async function getCanvasData(): Promise<{ authenticated: boolean; responses: ResponseMap; currencyCode: string }> {
  try {
    const { supabase, user, projectId } = await getActiveProjectForCurrentUser();

    if (!user || !projectId) {
      return { authenticated: false, responses: {}, currencyCode: "GBP" };
    }

    const { data } = await supabase
      .from("worksheet_responses")
      .select("field_key, value_json")
      .eq("project_id", projectId)
      .eq("worksheet_id", "founder-rules-sheet");

    const responses = Object.fromEntries(
      (data ?? []).map((row) => [row.field_key, typeof row.value_json === "string" ? row.value_json : String(row.value_json ?? "")]),
    );

    return { authenticated: true, responses, currencyCode: "GBP" };
  } catch {
    return { authenticated: false, responses: {}, currencyCode: "GBP" };
  }
}

function getFilledCount(responses: ResponseMap) {
  return OPERATING_SECTIONS.filter((section) => (responses[section.key] ?? "").trim().length > 0).length;
}

function getAccessBadge(status: string | null, level: string | null) {
  if (status === "active" && level === "full") return { label: "Paid access active", tone: "bg-[#eafaf2] text-[#0f7b53]" };
  if (status === "expired" || status === "cancelled") return { label: "Access inactive", tone: "bg-[#fff1f0] text-[#a83836]" };
  return { label: "Preview access", tone: "bg-[#f4f3fa] text-[#5b48d6]" };
}

export default async function LeanCanvasPage() {
  const [{ authenticated, responses, currencyCode }, access] = await Promise.all([getCanvasData(), getAccessStateForCurrentUser()]);
  const filledCount = getFilledCount(responses);
  const accessBadge = getAccessBadge(access.entitlementStatus, access.accessLevel);
  const currency = getCurrencyMeta(currencyCode);
  const insights = buildCanvasInsights(responses, currency.symbol);

  return (
    <LearnerShell
      items={[
        { href: "/", label: "Dashboard" },
        { href: "/program", label: "Program" },
        { href: "/lean-canvas", label: "Lean Canvas", active: true },
        { href: "/resume", label: "Resume" },
      ]}
      title="Lean Canvas"
      subtitle="A first MVP business canvas derived from your current worksheet answers."
    >
      <div className="space-y-8">
        <PageHero label="Lean Canvas" title="A clearer operating model from your worksheet" description="This page turns your Founder Rules worksheet into a clearer decision artifact. It should feel more useful than the raw worksheet, while still staying honest about what has and has not been defined yet.">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-[10px] font-medium ${accessBadge.tone}`}>{accessBadge.label}</span>
            <span className="rounded-full bg-[rgba(84,90,149,0.1)] px-[10px] py-[3px] text-[11px] font-medium text-[#545a95]">{filledCount}/{OPERATING_SECTIONS.length} sections filled</span>
          </div>
          <div className="mt-4 max-w-[360px]">
            <ProgressBar value={(filledCount / OPERATING_SECTIONS.length) * 100} />
          </div>
        </PageHero>

        <SectionShell>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <Eyebrow>Current payoff</Eyebrow>
              <p className="mt-3 text-sm leading-7 text-[#003748]">{getCompletionSummary(filledCount)}</p>
            </Card>
            <Card>
              <Eyebrow>What this helps with</Eyebrow>
              <p className="mt-3 text-sm leading-7 text-[#003748]">Use it to judge whether the current idea fits your real limits, signals, and stop rules.</p>
            </Card>
            <Card>
              <Eyebrow>What comes later</Eyebrow>
              <p className="mt-3 text-sm leading-7 text-[#003748]">As more worksheets are added, this can grow into a fuller business-model view without inventing things early.</p>
            </Card>
          </div>
          {!authenticated ? (
            <Panel className="mt-6 bg-[#fff7ed]">
              <Eyebrow>Nothing to show yet</Eyebrow>
              <p className="mt-3 text-sm leading-7 text-[#7a4b00]">
                Your Lean Canvas becomes useful after you complete the Founder Rules Sheet. Right now there is no saved worksheet data to turn into an operating model.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <PrimaryButton href="/chapter/set-your-founder-rules/worksheet">Complete Founder Rules Sheet</PrimaryButton>
                <SecondaryButton href="/chapter/set-your-founder-rules">Back to Chapter 3</SecondaryButton>
              </div>
            </Panel>
          ) : (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <PrimaryButton href="/chapter/set-your-founder-rules/worksheet">Edit Founder Rules Sheet</PrimaryButton>
              <SecondaryButton href="/chapter/set-your-founder-rules">Back to Chapter 3</SecondaryButton>
            </div>
          )}
        </SectionShell>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h3 className="font-[Manrope] text-2xl font-bold tracking-tight">Current operating canvas</h3>
              <p className="mt-2 text-sm text-[#5d5f68]">This is the current business operating layer generated from your Founder Rules worksheet.</p>
            </div>
          </div>

          {filledCount === 0 ? (
            <div className="rounded-[1.75rem] bg-[#fbfcff] p-6 ring-1 ring-[#eef1f7]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0053dc]">Start here</p>
              <h3 className="mt-3 font-[Manrope] text-2xl font-bold tracking-tight">Complete Founder Rules before using the canvas</h3>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5d5f68]">
                The Lean Canvas becomes genuinely useful once you have defined your time limits, money limits, success signals, and stop rules. Until then, this page is just showing the shape of what will be generated later.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link href="/chapter/set-your-founder-rules/worksheet" className="inline-flex items-center justify-center rounded-xl bg-[#0053dc] px-5 py-3 font-semibold !text-white">
                  Go to Founder Rules Sheet
                </Link>
                <Link href="/program" className="inline-flex items-center justify-center rounded-xl border border-[#d7d9e6] bg-white px-5 py-3 font-semibold text-[#30323b]">
                  Back to Program
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 grid gap-4 lg:grid-cols-3">
                {insights.map((insight) => (
                  <div
                    key={insight.title}
                    className={`rounded-[1.5rem] p-5 ${
                      insight.tone === "good"
                        ? "bg-[#eefcf5] text-[#0f5132]"
                        : insight.tone === "warn"
                          ? "bg-[#fff8ef] text-[#7a4b00]"
                          : "bg-[#f4f3fa] text-[#30323b]"
                    }`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em]">{insight.title}</p>
                    <p className="mt-3 text-sm leading-7">{insight.body}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                {OPERATING_GROUPS.map((group) => (
                  <div key={group.title} className="rounded-[1.75rem] bg-white p-6 shadow-[0px_8px_24px_rgba(48,50,59,0.06)]">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0053dc]">{group.title}</p>
                        <p className="mt-2 text-sm text-[#5d5f68]">{group.description}</p>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {group.keys.map((key) => {
                        const section = OPERATING_SECTIONS.find((item) => item.key === key)!;
                        const value = responses[section.key];
                        const formatted = formatValue(value);
                        const statusLabel = getSectionStatusLabel(section.key, value);
                        const filled = !!normalizeText(value);
                        return (
                          <div key={section.key} className="rounded-[1.25rem] bg-[#f8f8fb] p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0053dc]">{section.title}</p>
                                {section.key === "money_cap_per_month" ? (
                                  <p className="mt-2 text-xs text-[#5d5f68]">Shown in {currency.code}</p>
                                ) : null}
                              </div>
                              <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${filled ? "bg-[#eefcf5] text-[#0f7b53]" : "bg-[#f4f3fa] text-[#5d5f68]"}`}>{statusLabel}</span>
                            </div>
                            {formatted?.kind === "bullets" ? (
                              <ul className="mt-4 space-y-2 text-sm leading-7 text-[#30323b]">
                                {formatted.bullets.map((item) => (
                                  <li key={item} className="flex gap-2">
                                    <span className="mt-[0.6rem] h-1.5 w-1.5 rounded-full bg-[#0053dc]"></span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : formatted?.kind === "text" ? (
                              <p className="mt-4 text-sm leading-7 text-[#30323b]">{formatted.text}</p>
                            ) : (
                              <p className="mt-4 text-sm leading-7 text-[#5d5f68]">{getSectionEmptyState(section.key)}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h3 className="font-[Manrope] text-2xl font-bold tracking-tight">Classic Lean Canvas sections still to fill later</h3>
              <p className="mt-2 text-sm text-[#5d5f68]">
                These are intentionally shown as future sections so the learner can see what the fuller business model view will eventually include.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {PLACEHOLDER_SECTIONS.map((section) => (
              <div key={section.title} className="rounded-[1.5rem] border border-dashed border-[#d7d9e6] bg-[#fafbff] p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#5d5f68]">{section.title}</p>
                <p className="mt-4 text-sm leading-7 text-[#5d5f68]">This section will be unlocked by {section.futureSource.toLowerCase()}, so nothing is being invented here yet.</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </LearnerShell>
  );
}
