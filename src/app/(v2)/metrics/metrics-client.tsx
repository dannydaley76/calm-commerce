"use client";

import React, { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */

type MetricEntry = {
  id: string;
  week_ending: string;
  data_json: Record<string, string>;
  submitted_at: string;
};

type ComputedRow = {
  entry: MetricEntry;
  revenue: number | null;
  orders: number | null;
  traffic: number | null;
  adSpend: number | null;
  emailSubs: number | null;
  refunds: number | null;
  convRate: number | null;
  roas: number | null;
  revenueWow: "up" | "down" | "flat" | null;
  ordersWow: "up" | "down" | "flat" | null;
  trafficWow: "up" | "down" | "flat" | null;
};

type SubmitStatus = "idle" | "submitting" | "success" | "error";

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */

function todayLabel(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function parseNum(val: string | undefined): number | null {
  if (!val) return null;
  const cleaned = val.replace(/[^0-9.\-]/g, "").trim();
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function wow(curr: number | null, prev: number | null): "up" | "down" | "flat" | null {
  if (curr === null || prev === null) return null;
  if (curr > prev) return "up";
  if (curr < prev) return "down";
  return "flat";
}

function compute(entries: MetricEntry[]): ComputedRow[] {
  return entries.map((entry, i) => {
    const prior = entries[i + 1] ?? null;
    const revenue = parseNum(entry.data_json.revenue);
    const orders = parseNum(entry.data_json.orders);
    const traffic = parseNum(entry.data_json.traffic);
    const adSpend = parseNum(entry.data_json.ad_spend);
    const emailSubs = parseNum(entry.data_json.new_email_subscribers);
    const refunds = parseNum(entry.data_json.refunds_returns);
    const convRate =
      orders !== null && traffic !== null && traffic > 0 ? (orders / traffic) * 100 : null;
    const roas =
      revenue !== null && adSpend !== null && adSpend > 0 ? revenue / adSpend : null;
    const priorRevenue = prior ? parseNum(prior.data_json.revenue) : null;
    const priorOrders = prior ? parseNum(prior.data_json.orders) : null;
    const priorTraffic = prior ? parseNum(prior.data_json.traffic) : null;
    return {
      entry, revenue, orders, traffic, adSpend, emailSubs, refunds, convRate, roas,
      revenueWow: wow(revenue, priorRevenue),
      ordersWow: wow(orders, priorOrders),
      trafficWow: wow(traffic, priorTraffic),
    };
  });
}

/* ─────────────────────────────────────────────────────────────
   Cell colour helpers
───────────────────────────────────────────────────────────── */

type CellVariant = "green" | "amber" | "red" | "neutral" | "muted";

function cellCls(variant: CellVariant): string {
  const map: Record<CellVariant, string> = {
    green: "bg-[#eefcf5] text-[#005e3f] font-semibold",
    amber: "bg-[#fff8e6] text-[#835700] font-semibold",
    red: "bg-[#fff1f1] text-[#a83836] font-semibold",
    neutral: "bg-transparent text-[#003748]",
    muted: "bg-transparent text-[#9a9ca8]",
  };
  return map[variant];
}

function wowVariant(dir: "up" | "down" | "flat" | null): CellVariant {
  if (dir === null || dir === "flat") return "neutral";
  return dir === "up" ? "green" : "red";
}

function convVariant(rate: number | null): CellVariant {
  if (rate === null) return "muted";
  if (rate >= 2) return "green";
  if (rate >= 1) return "amber";
  return "red";
}

function roasVariant(roas: number | null): CellVariant {
  if (roas === null) return "muted";
  if (roas >= 3) return "green";
  if (roas >= 1) return "amber";
  return "red";
}

function refundVariant(n: number | null): CellVariant {
  if (n === null) return "muted";
  if (n === 0) return "green";
  if (n <= 2) return "amber";
  return "red";
}

/* ─────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────── */

function WowArrow({ dir }: { dir: "up" | "down" | "flat" | null }) {
  if (!dir || dir === "flat") return null;
  return (
    <span className={`ml-1 text-[10px] ${dir === "up" ? "text-[#005e3f]" : "text-[#a83836]"}`}>
      {dir === "up" ? "▲" : "▼"}
    </span>
  );
}

function Cell({ children, variant = "neutral", center = false }: {
  children: React.ReactNode;
  variant?: CellVariant;
  center?: boolean;
}) {
  return (
    <td className={`whitespace-nowrap px-3 py-3 text-sm ${center ? "text-center" : "text-right"} ${cellCls(variant)}`}>
      {children}
    </td>
  );
}

function SummaryCard({ label, value, sub, variant = "neutral" }: {
  label: string;
  value: string;
  sub?: string;
  variant?: CellVariant;
}) {
  const valueColour: Record<CellVariant, string> = {
    green: "text-[#005e3f]",
    amber: "text-[#835700]",
    red: "text-[#a83836]",
    neutral: "text-[#003748]",
    muted: "text-[#9a9ca8]",
  };
  return (
    <div className="rounded-2xl border border-[#e2e6f5] bg-white px-5 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8d99]">{label}</p>
      <p className={`mt-1 font-[Manrope] text-2xl font-bold ${valueColour[variant]}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-[#5d5f68]">{sub}</p>}
    </div>
  );
}

function NoteCard({ label, text, variant }: {
  label: string;
  text: string;
  variant: "green" | "amber" | "neutral";
}) {
  const border = { green: "border-[#c3f0da] bg-[#f2fcf7]", amber: "border-[#fde8ad] bg-[#fffbf0]", neutral: "border-[#e2e6f5] bg-[#fafbff]" };
  const lc = { green: "text-[#005e3f]", amber: "text-[#835700]", neutral: "text-[#545a95]" };
  return (
    <div className={`rounded-xl border px-4 py-3 ${border[variant]}`}>
      <p className={`mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] ${lc[variant]}`}>{label}</p>
      <p className="text-sm leading-6 text-[#003748]">{text}</p>
    </div>
  );
}

function ThresholdRow({ label, good, watch, bad }: { label: string; good: string; watch: string; bad: string }) {
  return (
    <div>
      <p className="mb-1 font-semibold text-[#003748]">{label}</p>
      <div className="space-y-0.5">
        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-sm bg-[#eefcf5]" />{good}</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-sm bg-[#fff8e6]" />{watch}</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-sm bg-[#fff1f1]" />{bad}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Entry form (inline on the page)
───────────────────────────────────────────────────────────── */

const inputBase =
  "mt-1.5 block w-full rounded-xl border border-[#e2e4ea] bg-white px-4 py-2.5 text-sm text-[#003748] shadow-sm outline-none transition placeholder:text-[#b0b3be] focus:border-[#0053dc] focus:ring-1 focus:ring-[#0053dc] disabled:bg-[#f4f4f8] disabled:text-[#9a9ca8]";

type FormValues = Record<string, string>;

function EntryForm({ onSaved }: { onSaved: () => void }) {
  const [form, setForm] = useState<FormValues>({ week_ending: todayLabel() });
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = useCallback(async () => {
    const weekEnding = (form.week_ending ?? "").trim();
    if (!weekEnding || !(form.revenue ?? "").trim()) return;
    setStatus("submitting");
    try {
      const { week_ending, ...rest } = form;
      const res = await fetch("/api/v2/weekly-metrics", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week_ending: weekEnding, data: rest }),
      });
      if (!res.ok) throw new Error("Save failed");
      setStatus("success");
      setForm({ week_ending: todayLabel() });
      timerRef.current = setTimeout(() => {
        setStatus("idle");
        onSaved();
      }, 1200);
    } catch {
      setStatus("error");
      timerRef.current = setTimeout(() => setStatus("idle"), 3000);
    }
  }, [form, onSaved]);

  const isSubmitting = status === "submitting";
  const canSubmit = !isSubmitting && (form.week_ending ?? "").trim() && (form.revenue ?? "").trim();

  return (
    <div className="rounded-[1.5rem] border border-[#d9def2] bg-[#f7f9ff] p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0053dc]">
          Log this week
        </p>
        {status === "submitting" && (
          <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0053dc]">Saving…</span>
        )}
        {status === "success" && (
          <span className="rounded-full bg-[#eefcf5] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#005e3f]">Saved ✓</span>
        )}
        {status === "error" && (
          <span className="rounded-full bg-[#fff1f1] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a83836]">Not saved</span>
        )}
      </div>

      {/* Row 1: date + numeric metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="block text-sm font-semibold text-[#003748]">
            Week ending <span className="ml-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#0053dc] bg-[#eef4ff] px-1.5 py-0.5 rounded-full">Required</span>
          </label>
          <input className={inputBase} value={form.week_ending ?? ""} onChange={(e) => set("week_ending", e.target.value)} disabled={isSubmitting} placeholder="e.g. Sun 20 Apr" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#003748]">
            Revenue <span className="ml-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#0053dc] bg-[#eef4ff] px-1.5 py-0.5 rounded-full">Required</span>
          </label>
          <input className={inputBase} value={form.revenue ?? ""} onChange={(e) => set("revenue", e.target.value)} disabled={isSubmitting} placeholder="£0" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#003748]">Orders</label>
          <input type="number" className={inputBase} value={form.orders ?? ""} onChange={(e) => set("orders", e.target.value)} disabled={isSubmitting} placeholder="0" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#003748]">Traffic</label>
          <input type="number" className={inputBase} value={form.traffic ?? ""} onChange={(e) => set("traffic", e.target.value)} disabled={isSubmitting} placeholder="0" />
        </div>
      </div>

      {/* Row 2: spend + engagement */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-semibold text-[#003748]">Ad spend</label>
          <input className={inputBase} value={form.ad_spend ?? ""} onChange={(e) => set("ad_spend", e.target.value)} disabled={isSubmitting} placeholder="£0" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#003748]">New email subscribers</label>
          <input type="number" className={inputBase} value={form.new_email_subscribers ?? ""} onChange={(e) => set("new_email_subscribers", e.target.value)} disabled={isSubmitting} placeholder="0" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#003748]">Refunds / returns</label>
          <input type="number" className={inputBase} value={form.refunds_returns ?? ""} onChange={(e) => set("refunds_returns", e.target.value)} disabled={isSubmitting} placeholder="0" />
        </div>
      </div>

      {/* Row 3: qualitative */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-semibold text-[#003748]">What worked</label>
          <p className="mt-0.5 text-xs text-[#5d5f68]">One thing that performed well.</p>
          <textarea className={`${inputBase} mt-2 min-h-[72px] resize-y`} value={form.what_worked ?? ""} onChange={(e) => set("what_worked", e.target.value)} disabled={isSubmitting} placeholder="e.g. Instagram post drove 3 sales…" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#003748]">What to change</label>
          <p className="mt-0.5 text-xs text-[#5d5f68]">The single most important adjustment.</p>
          <textarea className={`${inputBase} mt-2 min-h-[72px] resize-y`} value={form.what_to_change ?? ""} onChange={(e) => set("what_to_change", e.target.value)} disabled={isSubmitting} placeholder="e.g. Fix the mobile checkout flow…" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#003748]">Notes</label>
          <p className="mt-0.5 text-xs text-[#5d5f68]">Anything else worth recording.</p>
          <textarea className={`${inputBase} mt-2 min-h-[72px] resize-y`} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} disabled={isSubmitting} placeholder="Optional…" />
        </div>
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0053dc] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#003da8] disabled:opacity-40"
        >
          {isSubmitting ? "Saving…" : "Save this week's entry"}
        </button>
        {status === "error" && (
          <span className="ml-3 text-xs text-[#a83836]">Could not save — please try again.</span>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Seed button (dev / demo helper — shown only when no entries)
───────────────────────────────────────────────────────────── */

function SeedButton({ onSeeded }: { onSeeded: () => void }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const handleSeed = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/v2/weekly-metrics/seed", {
        method: "POST",
        credentials: "same-origin",
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok) throw new Error();
      setStatus("done");
      if (json.ok) setTimeout(onSeeded, 800);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="flex items-center gap-3 border-t border-[#eef0f7] pt-4">
      <button
        type="button"
        onClick={() => void handleSeed()}
        disabled={status === "loading" || status === "done"}
        className="rounded-xl border border-[#d9def2] bg-white px-4 py-2 text-xs font-semibold text-[#545a95] transition hover:bg-[#f0f2fb] disabled:opacity-50"
      >
        {status === "loading" ? "Seeding…" : status === "done" ? "Done ✓" : "Load 20 weeks of demo data"}
      </button>
      {status === "error" && <span className="text-xs text-[#a83836]">Seed failed — try again.</span>}
      <span className="text-xs text-[#b0b3be]">Fills in 20 weeks of realistic example data so you can see how the dashboard looks.</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────── */

export function MetricsClient({ entries, authenticated }: {
  entries: MetricEntry[];
  authenticated: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(entries.length === 0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!authenticated) {
    return (
      <div className="rounded-2xl border border-[#e2e6f5] bg-white px-8 py-12 text-center">
        <p className="text-sm text-[#5d5f68]">Sign in to view your weekly metrics.</p>
      </div>
    );
  }

  /* ── Empty state: form open by default ── */
  if (entries.length === 0) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-[#5d5f68]">
          No entries yet. Log your first week below to start tracking.
        </p>
        <EntryForm onSaved={() => router.refresh()} />
        <SeedButton onSeeded={() => router.refresh()} />
      </div>
    );
  }

  const rows = compute(entries);
  const revenues = rows.map((r) => r.revenue).filter((n): n is number => n !== null);
  const bestRevenue = revenues.length ? Math.max(...revenues) : null;
  const latestRevenue = rows[0]?.revenue ?? null;
  const latestRevenueWow = rows[0]?.revenueWow ?? null;
  const avgConv = (() => {
    const rates = rows.map((r) => r.convRate).filter((n): n is number => n !== null);
    if (!rates.length) return null;
    return rates.reduce((a, b) => a + b, 0) / rates.length;
  })();

  const wowLabel = (dir: "up" | "down" | "flat" | null) => {
    if (dir === "up") return "▲ up on last week";
    if (dir === "down") return "▼ down on last week";
    return null;
  };

  return (
    <div className="space-y-8">
      {/* ── Summary cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Weeks tracked"
          value={String(entries.length)}
          sub={entries.length === 1 ? "1 entry so far" : `${entries.length} entries`}
        />
        <SummaryCard
          label="Latest revenue"
          value={latestRevenue !== null ? `£${latestRevenue.toLocaleString("en-GB")}` : "—"}
          sub={wowLabel(latestRevenueWow) ?? "First entry"}
          variant={latestRevenueWow === "up" ? "green" : latestRevenueWow === "down" ? "red" : "neutral"}
        />
        <SummaryCard
          label="Best revenue week"
          value={bestRevenue !== null ? `£${bestRevenue.toLocaleString("en-GB")}` : "—"}
          sub={bestRevenue !== null ? `across ${revenues.length} weeks` : undefined}
        />
        <SummaryCard
          label="Avg. conversion"
          value={avgConv !== null ? `${avgConv.toFixed(1)}%` : "—"}
          sub="Orders ÷ traffic"
          variant={convVariant(avgConv)}
        />
      </div>

      {/* ── Log entry panel (toggle) ── */}
      {showForm ? (
        <div className="space-y-3">
          <EntryForm
            onSaved={() => {
              setShowForm(false);
              router.refresh();
            }}
          />
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="text-xs text-[#8b8d99] hover:text-[#5d5f68] transition"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#5d5f68]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm bg-[#eefcf5]" />Good / above target
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm bg-[#fff8e6]" />Watch / borderline
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm bg-[#fff1f1]" />Needs attention
            </span>
            <span className="flex items-center gap-1.5 text-[#8b8d99]">
              <span className="text-[10px]">▲▼</span> Week-over-week
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[#0053dc] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#003da8]"
          >
            + Log this week
          </button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-2xl border border-[#e2e6f5] bg-white">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#eef0f7] bg-[#fafbff]">
              {["Week", "Revenue", "Orders", "Traffic", "Conv %", "Ad Spend", "ROAS", "Email Subs", "Refunds", "Notes"].map((h, i) => (
                <th
                  key={h}
                  className={`px-3 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b8d99] ${i === 0 ? "px-4 text-left" : i === 9 ? "text-center" : "text-right"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f2fa]">
            {rows.map((row, idx) => {
              const isExpanded = expandedId === row.entry.id;
              const hasNotes =
                row.entry.data_json.what_worked ||
                row.entry.data_json.what_to_change ||
                row.entry.data_json.notes;

              return (
                <React.Fragment key={row.entry.id}>
                  <tr className={`transition-colors ${isExpanded ? "bg-[#f7f9ff]" : idx === 0 ? "bg-[#fffef9]" : "bg-white hover:bg-[#fafbff]"}`}>
                    {/* Week */}
                    <td className="px-4 py-3 text-left">
                      <div className="flex items-center gap-2">
                        {idx === 0 && (
                          <span className="rounded-full bg-[#eef4ff] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#0053dc]">
                            Latest
                          </span>
                        )}
                        <span className="font-[Manrope] text-sm font-semibold text-[#003748]">
                          {row.entry.week_ending}
                        </span>
                      </div>
                    </td>

                    <Cell variant={wowVariant(row.revenueWow)}>
                      {row.revenue !== null ? (<>£{row.revenue.toLocaleString("en-GB")}<WowArrow dir={row.revenueWow} /></>) : <span className="text-[#c8cad4]">—</span>}
                    </Cell>

                    <Cell variant={wowVariant(row.ordersWow)}>
                      {row.orders !== null ? (<>{row.orders}<WowArrow dir={row.ordersWow} /></>) : <span className="text-[#c8cad4]">—</span>}
                    </Cell>

                    <Cell variant={wowVariant(row.trafficWow)}>
                      {row.traffic !== null ? (<>{row.traffic.toLocaleString("en-GB")}<WowArrow dir={row.trafficWow} /></>) : <span className="text-[#c8cad4]">—</span>}
                    </Cell>

                    <Cell variant={convVariant(row.convRate)}>
                      {row.convRate !== null ? `${row.convRate.toFixed(2)}%` : <span className="text-[#c8cad4]">—</span>}
                    </Cell>

                    <Cell variant="neutral">
                      {row.adSpend !== null ? `£${row.adSpend.toLocaleString("en-GB")}` : <span className="text-[#c8cad4]">—</span>}
                    </Cell>

                    <Cell variant={roasVariant(row.roas)}>
                      {row.roas !== null ? `${row.roas.toFixed(1)}×` : <span className="text-[#c8cad4]">—</span>}
                    </Cell>

                    <Cell variant={row.emailSubs !== null && row.emailSubs > 0 ? "green" : "muted"}>
                      {row.emailSubs !== null ? `+${row.emailSubs}` : <span className="text-[#c8cad4]">—</span>}
                    </Cell>

                    <Cell variant={refundVariant(row.refunds)}>
                      {row.refunds !== null ? row.refunds : <span className="text-[#c8cad4]">—</span>}
                    </Cell>

                    <td className="px-3 py-3 text-center">
                      {hasNotes ? (
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : row.entry.id)}
                          className="rounded-lg border border-[#d9def2] bg-[#f0f2fb] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#545a95] transition hover:bg-[#e4e8f8]"
                        >
                          {isExpanded ? "Hide" : "View"}
                        </button>
                      ) : (
                        <span className="text-[#c8cad4]">—</span>
                      )}
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-[#f7f9ff]">
                      <td colSpan={10} className="px-6 pb-5 pt-2">
                        <div className="grid gap-4 sm:grid-cols-3">
                          {row.entry.data_json.what_worked && (
                            <NoteCard label="What worked" text={row.entry.data_json.what_worked} variant="green" />
                          )}
                          {row.entry.data_json.what_to_change && (
                            <NoteCard label="What to change" text={row.entry.data_json.what_to_change} variant="amber" />
                          )}
                          {row.entry.data_json.notes && (
                            <NoteCard label="Notes" text={row.entry.data_json.notes} variant="neutral" />
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Thresholds key ── */}
      <div className="rounded-2xl border border-[#e2e6f5] bg-white px-6 py-5">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8d99]">
          How thresholds are calculated
        </p>
        <div className="grid gap-x-8 gap-y-2 text-xs text-[#5d5f68] sm:grid-cols-2 lg:grid-cols-4">
          <ThresholdRow label="Conversion %" good="≥ 2%" watch="1–2%" bad="< 1%" />
          <ThresholdRow label="ROAS" good="≥ 3×" watch="1–3×" bad="< 1×" />
          <ThresholdRow label="Refunds" good="0" watch="1–2" bad="3+" />
          <ThresholdRow label="Revenue / Orders / Traffic" good="Up vs prior week ▲" watch="No change" bad="Down vs prior week ▼" />
        </div>
      </div>

      {/* ── Footer nav ── */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/program"
          className="inline-flex items-center gap-2 rounded-xl border border-[#d9def2] bg-white px-5 py-2.5 text-sm font-semibold text-[#545a95] transition hover:bg-[#f0f2fb]"
        >
          Back to Program
        </Link>
        <SeedButton onSeeded={() => router.refresh()} />
      </div>
    </div>
  );
}
