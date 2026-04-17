import Link from "next/link";
import { AccessStatusBadge } from "@/components/access-status-badge";
import { Card, Eyebrow, PageHero, Panel, PrimaryButton, ProgressBar, SecondaryButton, SectionShell } from "@/components/design-system";
import { LearnerShell } from "@/components/learner-shell";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";
import { getAccessStateForCurrentUser } from "@/lib/auth/get-access-state";

type ChapterStatus = "not_started" | "in_progress" | "completed";

type DashboardState = {
  authenticated: boolean;
  status: ChapterStatus;
  progressPercent: number;
};

const chapterCards = [
  {
    slug: "set-your-founder-rules",
    number: 3,
    title: "Set Your Founder Rules",
    description: "Define the operating rules for time, budget, and decision-making.",
    href: "/chapter/set-your-founder-rules",
    badge: "Current",
  },
  {
    slug: "welcome-you-can-do-this",
    number: 4,
    title: "Pick product ideas worth testing",
    description: "Stress-test your hypotheses against market reality.",
    href: "/chapter/welcome-you-can-do-this/steps",
    badge: "Next",
  },
];

async function getDashboardState(): Promise<DashboardState> {
  try {
    const { supabase, user, projectId } = await getActiveProjectForCurrentUser();

    if (!user) return { authenticated: false, status: "not_started", progressPercent: 0 };
    if (!projectId) return { authenticated: true, status: "not_started", progressPercent: 0 };

    const { data: progress } = await supabase
      .from("chapter_progress")
      .select("status, worksheet_completion_percent")
      .eq("project_id", projectId)
      .eq("chapter_id", "chapter-4")
      .maybeSingle();

    return {
      authenticated: true,
      status: (progress?.status as ChapterStatus | undefined) ?? "not_started",
      progressPercent: Math.round(progress?.worksheet_completion_percent ?? 0),
    };
  } catch {
    return { authenticated: false, status: "not_started", progressPercent: 0 };
  }
}

function getPrimaryCta(state: DashboardState) {
  if (!state.authenticated) {
    return {
      href: "/login",
      label: "Sign in to continue",
      subtext: "Sign in to load your learner progress and saved worksheet answers.",
    };
  }

  if (state.status === "completed") {
    return {
      href: "/lean-canvas",
      label: "Open operating canvas",
      subtext: "Your Founder Rules Sheet is complete. The best next move is to see the operating model built from your worksheet answers.",
    };
  }

  if (state.status === "in_progress") {
    return {
      href: "/resume",
      label: "Complete the worksheet",
      subtext: "You are building the foundations of your e-commerce business. Chapter 3 helps you set the rules that will guide your decisions.",
    };
  }

  return {
    href: "/chapter/set-your-founder-rules",
    label: "Start Chapter 3",
    subtext: "You are building the foundations of your e-commerce business. Chapter 3 helps you set the rules that will guide your decisions.",
  };
}

function getStatusLabel(status: ChapterStatus) {
  if (status === "completed") return "Completed";
  if (status === "in_progress") return "In progress";
  return "Not started";
}

export default async function DashboardPage() {
  const [state, access] = await Promise.all([getDashboardState(), getAccessStateForCurrentUser()]);
  const primaryCta = getPrimaryCta(state);
  const [currentChapter, nextChapter] = chapterCards;
  const visualProgress = state.authenticated ? Math.max(state.progressPercent, 35) : 35;

  return (
    <LearnerShell
      items={[
        { href: "/", label: "Dashboard", active: true },
        { href: "/program", label: "Program" },
        { href: "/lean-canvas", label: "Lean Canvas" },
        { href: "/metrics", label: "Metrics" },
        { href: "/account", label: "Account" },
      ]}
      title="Dashboard"
    >
      <div className="space-y-16">
        <PageHero label="Current focus" title="Focusing your journey." description={primaryCta.subtext}>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <AccessStatusBadge status={access.entitlementStatus} level={access.accessLevel} compact />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <ProgressBar value={visualProgress} />
            </div>
            <span className="text-[12px] font-medium text-[#006b5f]">{state.authenticated ? `${visualProgress}% complete` : "Preview mode"}</span>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div>
              <Eyebrow>Current chapter</Eyebrow>
              <p className="mt-1 font-[Manrope] text-[14px] font-semibold text-[#003748]">3. Set your founder rules</p>
            </div>
            <div>
              <Eyebrow>Worksheet status</Eyebrow>
              <p className="mt-1 font-[Manrope] text-[14px] font-semibold text-[#003748]">{state.authenticated ? getStatusLabel(state.status) : "Sign in to load"}</p>
            </div>
            <div>
              <Eyebrow>Best next action</Eyebrow>
              <p className="mt-1 font-[Manrope] text-[14px] font-semibold text-[#003748]">{primaryCta.label}</p>
            </div>
          </div>
        </PageHero>

        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <Eyebrow>Chapter 3</Eyebrow>
            <p className="mt-1 font-[Manrope] text-[16px] font-semibold text-[#003748]">Set your founder rules</p>
            <p className="mt-2 text-[13px] leading-[1.5] text-[#49636f]">Market validation and archetype definition.</p>
            <span className="mt-3 inline-block rounded-full bg-[rgba(84,90,149,0.1)] px-[8px] py-[2px] text-[11px] font-medium text-[#545a95]">
              {state.authenticated ? getStatusLabel(state.status) : "Preview"}
            </span>
          </Card>

          <Card>
            <Eyebrow>Worksheet progress</Eyebrow>
            <p className="mt-1 font-[Manrope] text-[16px] font-semibold text-[#003748]">{state.authenticated ? `${Math.round((visualProgress / 100) * 8)} of 8 fields` : "No saved data"}</p>
            <p className="mt-2 text-[13px] leading-[1.5] text-[#49636f]">Founder Rules sheet nearly complete.</p>
            <span className="mt-3 inline-block rounded-full bg-[rgba(0,107,95,0.1)] px-[8px] py-[2px] text-[11px] font-medium text-[#006b5f]">
              {state.authenticated ? `${visualProgress}% done` : "Preview"}
            </span>
          </Card>

          <Card>
            <Eyebrow>Best next action</Eyebrow>
            <p className="mt-1 font-[Manrope] text-[16px] font-semibold text-[#003748]">{primaryCta.label}</p>
            <p className="mt-2 text-[13px] leading-[1.5] text-[#49636f]">Then view your Lean Canvas to see the operating model.</p>
          </Card>
        </div>

        <SectionShell label="Curriculum path" title="Where you are" description="Your current chapter and what comes next.">
          <div className="grid gap-3 md:grid-cols-2">
            <Card className="outline outline-2 outline-[#545a95]">
              <Eyebrow>Chapter {currentChapter.number}</Eyebrow>
              <h3 className="mt-2 font-[Manrope] text-[15px] font-semibold text-[#003748]">{currentChapter.title}</h3>
              <p className="mt-2 text-[13px] leading-[1.5] text-[#49636f]">{currentChapter.description}</p>
              <div className="mt-3">
                <ProgressBar value={Math.max(state.progressPercent, 75)} />
              </div>
              <span className="mt-3 inline-block rounded-full bg-[rgba(84,90,149,0.12)] px-[8px] py-[2px] text-[10px] font-medium text-[#545a95]">
                {currentChapter.badge}
              </span>
            </Card>

            <Card>
              <Eyebrow>Chapter {nextChapter.number}</Eyebrow>
              <h3 className="mt-2 font-[Manrope] text-[15px] font-semibold text-[#003748]">{nextChapter.title}</h3>
              <p className="mt-2 text-[13px] leading-[1.5] text-[#49636f]">{nextChapter.description}</p>
              <div className="mt-3">
                <ProgressBar value={0} />
              </div>
              <span className="mt-3 inline-block rounded-full bg-[rgba(73,99,111,0.1)] px-[8px] py-[2px] text-[10px] font-medium text-[#49636f]">
                {nextChapter.badge}
              </span>
            </Card>
          </div>

          <Panel className="mt-6">
            <Eyebrow>Your lean canvas</Eyebrow>
            <h3 className="mt-2 font-[Manrope] text-[16px] font-semibold text-[#003748]">Operating model preview</h3>
            <p className="mt-2 text-[13px] leading-[1.5] text-[#49636f]">Your worksheet answers feed into this evolving business artifact.</p>

            <div className="mt-4 grid grid-cols-4 gap-[6px]">
              {[
                "Problem",
                "Solution",
                "Key metrics",
                "Value prop",
                "Channels",
                "Customers",
                "Cost",
                "Revenue",
              ].map((label, index) => (
                <div
                  key={label}
                  className={[
                    "rounded px-2 py-2 font-[Inter] text-[10px] font-medium uppercase tracking-[0.03em]",
                    index < 4 ? "bg-[rgba(255,255,255,0.9)] text-[#003748]" : "bg-[rgba(255,255,255,0.6)] text-[#49636f]",
                  ].join(" ")}
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="mt-4">
              <SecondaryButton href="/lean-canvas">View lean canvas</SecondaryButton>
            </div>
          </Panel>
        </SectionShell>

        <div className="flex justify-center">
          <PrimaryButton href={primaryCta.href}>{primaryCta.label}</PrimaryButton>
        </div>
      </div>
    </LearnerShell>
  );
}
