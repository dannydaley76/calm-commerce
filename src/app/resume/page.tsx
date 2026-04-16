import Link from "next/link";
import { LearnerShell } from "@/components/learner-shell";
import { getActiveProjectForCurrentUser } from "@/lib/auth/get-active-project";

const CHAPTER_ROUTE = "/chapter/set-your-founder-rules";
const WORKSHEET_ROUTE = "/chapter/set-your-founder-rules/worksheet";

type ResumeViewState = {
  authenticated: boolean;
  destination: string;
  title: string;
  description: string;
  cta: string;
};

async function getResumeState(): Promise<ResumeViewState> {
  try {
    const { supabase, user, projectId } = await getActiveProjectForCurrentUser();

    if (!user) {
      return {
        authenticated: false,
        destination: "/login",
        title: "Sign in to continue",
        description: "You need to sign in before we can restore your learner progress.",
        cta: "Go to login",
      };
    }

    if (!projectId) {
      return {
        authenticated: true,
        destination: CHAPTER_ROUTE,
        title: "Start Chapter 3",
        description: "We could not find an active learner project yet, so we’ll take you to the start of the active chapter.",
        cta: "Open Chapter 3",
      };
    }

    const { data: resume } = await supabase
      .from("project_resume_state")
      .select("resume_path, chapter_id, last_location_type")
      .eq("project_id", projectId)
      .maybeSingle();

    const { data: progress } = await supabase
      .from("chapter_progress")
      .select("status, last_location_type, worksheet_completion_percent")
      .eq("project_id", projectId)
      .eq("chapter_id", "chapter-4")
      .maybeSingle();

    const progressStatus = progress?.status as "not_started" | "in_progress" | "completed" | undefined;
    const progressLocation = progress?.last_location_type as "chapter" | "worksheet" | "completion" | undefined;
    const progressPercent = Math.round(progress?.worksheet_completion_percent ?? 0);

    if (resume?.chapter_id === "chapter-4" && resume.resume_path) {
      if (resume.resume_path === WORKSHEET_ROUTE) {
        return {
          authenticated: true,
          destination: WORKSHEET_ROUTE,
          title: "Continue your Founder Rules Sheet",
          description: `Your Founder Rules Sheet is still in progress (${progressPercent}% complete). We’ll take you back to the worksheet so you can finish it cleanly.`,
          cta: "Continue worksheet",
        };
      }

      return {
        authenticated: true,
        destination: resume.resume_path,
        title: progressStatus === "completed" ? "Review your completed Founder Rules" : "Continue Chapter 3",
        description:
          progressStatus === "completed"
            ? "Your Founder Rules Sheet is complete. We’ll take you back to Chapter 3 so you can review the finished work and carry those rules forward into the next stage."
            : "We’ll take you back to Chapter 3 so you can continue reading or open the worksheet.",
        cta: progressStatus === "completed" ? "Review completed chapter" : "Open Chapter 3",
      };
    }

    if (progressStatus === "in_progress" && progressLocation === "worksheet") {
      return {
        authenticated: true,
        destination: WORKSHEET_ROUTE,
        title: "Continue your Founder Rules Sheet",
        description: `Your Founder Rules Sheet is still in progress (${progressPercent}% complete). We’ll take you back to the worksheet so you can finish it cleanly.`,
        cta: "Continue worksheet",
      };
    }

    if (progressStatus === "completed" || progressLocation === "completion") {
      return {
        authenticated: true,
        destination: CHAPTER_ROUTE,
        title: "Review your completed Founder Rules",
        description: "Your Founder Rules Sheet is complete. We’ll take you back to Chapter 3 so you can review the finished work and carry those rules forward into the next stage.",
        cta: "Review completed chapter",
      };
    }

    return {
      authenticated: true,
      destination: CHAPTER_ROUTE,
      title: "Continue Chapter 3",
      description: "We’ll take you back to the active chapter so you can continue reading or open the worksheet.",
      cta: "Open Chapter 3",
    };
  } catch {
    return {
      authenticated: true,
      destination: CHAPTER_ROUTE,
      title: "Continue Chapter 3",
      description: "We hit a problem restoring your exact position, so we’ll take you back to Chapter 3.",
      cta: "Open Chapter 3",
    };
  }
}

export default async function ResumePage() {
  const state = await getResumeState();

  return (
    <LearnerShell
      items={[
        { href: "/", label: "Dashboard" },
        { href: "/program", label: "Program" },
        { href: "/resume", label: "Resume", active: true },
        { href: "/chapter/set-your-founder-rules", label: "Chapter 3" },
      ]}
      title="Resume"
      subtitle="Get back to the right place without relying on whatever CTA happened to be on the last page you visited."
    >
      <div className="mx-auto max-w-2xl rounded-[2rem] bg-white p-8 shadow-[0px_24px_48px_rgba(48,50,59,0.08)] lg:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#5d5f68]">Resume</p>
        <h2 className="mt-4 font-[Manrope] text-4xl font-extrabold tracking-tight">{state.title}</h2>
        <p className="mt-4 text-base leading-8 text-[#5d5f68]">{state.description}</p>

        <div className="mt-8 rounded-2xl bg-[#f4f3fa] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#5d5f68]">Destination</p>
          <p className="mt-2 font-mono text-sm text-[#30323b]">{state.destination}</p>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link href={state.destination} className="inline-flex items-center justify-center rounded-xl bg-[#0053dc] px-6 py-4 font-semibold !text-white">
            {state.cta}
          </Link>
          <Link href="/" className="inline-flex items-center justify-center rounded-xl border border-[#d7d9e6] bg-white px-6 py-4 font-semibold text-[#30323b]">
            Back to dashboard
          </Link>
        </div>
      </div>
    </LearnerShell>
  );
}
