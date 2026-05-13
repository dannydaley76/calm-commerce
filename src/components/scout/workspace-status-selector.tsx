"use client";

import type {
  ProductIdeaLifecycle,
  ProductIdeaWorkspaceStatus,
} from "@/lib/v2/worksheets/product-idea-lifecycle";

export const WORKSPACE_STATUS_OPTIONS: Array<{ value: ProductIdeaWorkspaceStatus; label: string }> = [
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "shortlist", label: "Shortlist" },
  { value: "testing", label: "Testing" },
  { value: "archived", label: "Archived" },
];

export function workspaceStatusLabel(status: ProductIdeaWorkspaceStatus): string {
  return WORKSPACE_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? "New";
}

function workspaceDotTone(status: ProductIdeaWorkspaceStatus): string {
  if (status === "shortlist") return "bg-[#007a52]";
  if (status === "reviewing") return "bg-cobalt-600";
  if (status === "testing") return "bg-[#b7791f]";
  if (status === "archived") return "bg-ink-300";
  return "bg-ink-400";
}

function workspaceSelectorTone(status: ProductIdeaWorkspaceStatus): string {
  if (status === "shortlist") return "border-success-100 bg-success-100 text-[#005e3f] hover:bg-[#d9f4e8]";
  if (status === "reviewing") return "border-cobalt-100 bg-[#eef4ff] text-cobalt-600 hover:bg-[#e2ecff]";
  if (status === "testing") return "border-amber-100 bg-[#fff8e6] text-[#835700] hover:bg-[#fff0c2]";
  if (status === "archived") return "border-ink-100 bg-surface-sunken text-ink-500 hover:bg-ink-50";
  return "border-ink-100 bg-surface-sunken text-ink-700 hover:bg-ink-50";
}

export function WorkspaceStatusSelector({
  idea,
  saving,
  saved,
  onChange,
}: {
  idea: Pick<ProductIdeaLifecycle, "workspaceStatus" | "workspaceStatusLabel">;
  saving: boolean;
  saved: boolean;
  onChange: (status: ProductIdeaWorkspaceStatus) => void;
}) {
  return (
    <details className="group relative">
      <summary
        title="Change status"
        className={[
          "inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] transition",
          "focus:outline-none focus:ring-2 focus:ring-cobalt-100",
          workspaceSelectorTone(idea.workspaceStatus),
          saved ? "ring-2 ring-success-100" : "",
        ].join(" ")}
      >
        <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${workspaceDotTone(idea.workspaceStatus)}`} />
        <span>{idea.workspaceStatusLabel}</span>
        <svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3 opacity-65">
          <path d="M3 4.5 6 7.5l3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="absolute left-0 z-30 mt-2 w-40 rounded-lg border border-ink-100 bg-white p-1 shadow-card">
        {WORKSPACE_STATUS_OPTIONS.map((item) => {
          const isCurrent = item.value === idea.workspaceStatus;
          return (
            <button
              key={item.value}
              type="button"
              disabled={saving}
              onClick={(event) => {
                event.currentTarget.closest("details")?.removeAttribute("open");
                if (!isCurrent) onChange(item.value);
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-semibold text-ink-700 hover:bg-surface-sunken disabled:opacity-60"
            >
              <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${workspaceDotTone(item.value)}`} />
              <span className="flex-1">{item.label}</span>
              {isCurrent ? (
                <svg aria-hidden="true" viewBox="0 0 12 12" className="h-3.5 w-3.5 text-cobalt-600">
                  <path d="m2.5 6 2 2 5-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </button>
          );
        })}
      </div>
    </details>
  );
}
