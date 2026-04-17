"use client";

import React, { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */

type Phase = "validation" | "live_store";

type MetricEntry = {
  id: string;
  week_ending: string;
  data_json: Record<string, string>;
  submitted_at: string;
};

type SubmitStatus = "idle" | "submitting" | "success" | "error";

type ValidationRow = {
  entry: MetricEntry;
  impressions: number | null;
  clicks: number | null;
  orders: number | null;
  profitPerSale: number | null;
  clickRate: number | null;
  buyRate: number | null;
  ordersWow: "up" | "down" | "flat" | null;
};

type LiveStoreRow = {
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

function entryPhase(entry: MetricEntry): Phase {
  return (entry.data_json.entry_type as Phase | undefined) ?? "live_store";
}

function computeValidation(entries: MetricEntry[]): ValidationRow[] {
  return entries.map((entry, i) => {
    const prior = entries[i + 1] ?? null;
    const impressions = parseNum(entry.data_json.impressions);
    const clicks = parseNum(entry.data_json.listing_clicks);
    const orders = parseNum(entry.data_json.orders);
    const profitPerSale = parseNum(entry.data_json.profit_per_sale);
    const clickRate =
      clicks !== null && impressions !== null && impressions > 0
        ? (clicks / impressions) * 100
        : null;
    const buyRate =
      orders !== null && clicks !== null && clicks > 0
        ? (orders / clicks) * 100
        : null;
    const priorOrders = prior ? parseNum(prior.data_json.orders) : null;
    return { entry, impressions, clicks, orders, profitPerSale, clickRate, buyRate, ordersWow: wow(orders, priorOrders) };
  });
}

function computeLiveStore(entries: MetricEntry[]): LiveStoreRow[] {
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

function clickRateVariant(rate: number | null): CellVariant {
  if (rate === null) return "muted";
  if (rate >= 5) return "green";
  if (rate >= 2) return "amber";
  return "red";
}

function buyRateVariant(rate: number | null): CellVariant {
  if (rate === null) return "muted";
  if (rate >= 3) return "green";
  if (rate >= 1) return "amber";
  return "red";
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
   Shared UI sub-components
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

const inputBase =
  "mt-1.5 block w-full rounded-xl border border-[#e2e4ea] bg-white px-4 py-2.5 text-sm text-[#003748] shadow-sm outline-none transition placeholder:text-[#b0b3be] focus:border-[#0053dc] focus:ring-1 focus:ring-[#0053dc] disabled:bg-[#f4f4f8] disabled:text-[#9a9ca8]";

/* ─────────────────────────────────────────────────────────────
   Phase selector
───────────────────────────────────────────────────────────── */

function PhaseSelector({ phase, onChange }: { phase: Phase; onChange: (p: Phase) => void }) {
  return (
    <div className="inline-flex rounded-xl border border-[#e2e6f5] bg-[#f4f6fb] p-1">
      <button
        type="button"
        onClick={() => onChange("validation")}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
          phase === "validation"
            ? "bg-white text-[#003748] shadow-sm"
            : "text-[#5d5f68] hover:text-[#003748]"
        }`}
      >
        Marketplace testing
      </button>
      <button
        type="button"
        onClick={() => onChange("live_store")}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
          phase === "live_store"
            ? "bg-white text-[#003748] shadow-sm"
            : "text-[#5d5f68] hover:text-[#003748]"
        }`}
      >
        Own store
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Find-help toggle (platform-agnostic guidance)
───────────────────────────────────────────────────────────── */

function FindHelp({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-semibold text-[#0053dc] hover:underline"
      >
        {open ? "Hide ↑" : "Where do I find this? ↓"}
      </button>
      {open && (
        <div className="mt-2 rounded-xl bg-[#eef4ff] px-4 py-3 text-xs leading-5 text-[#003da8]">
          {children}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Conversational question block
───────────────────────────────────────────────────────────── */

function Question({
  eyebrow,
  question,
  context,
  children,
  help,
}: {
  eyebrow: string;
  question: string;
  context?: string;
  children: React.ReactNode;
  help?: React.ReactNode;
}) {
  return (
    <div className="border-b border-[#eef0f7] pb-6 last:border-0 last:pb-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#545a95]">{eyebrow}</p>
      <p className="mt-2 font-[Manrope] text-base font-semibold text-[#003748]">{question}</p>
      {context && <p className="mt-1 text-sm text-[#5d5f68]">{context}</p>}
      <div className="mt-3">{children}</div>
      {help && <FindHelp>{help}</FindHelp>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Validation entry form
───────────────────────────────────────────────────────────── */

function ValidationForm({ onSaved }: { onSaved: () => void }) {
  const [form, setForm] = useState<Record<string, string>>({ week_ending: todayLabel() });
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = useCallback(async () => {
    if (!(form.week_ending ?? "").trim()) return;
    setStatus("submitting");
    try {
      const { week_ending, ...rest } = form;
      const res = await fetch("/api/v2/weekly-metrics", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week_ending, entry_type: "validation", data: rest }),
      });
      if (!res.ok) throw new Error("Save failed");
      setStatus("success");
      setForm({ week_ending: todayLabel() });
      timerRef.current = setTimeout(() => { setStatus("idle"); onSaved(); }, 1200);
    } catch {
      setStatus("error");
      timerRef.current = setTimeout(() => setStatus("idle"), 3000);
    }
  }, [form, onSaved]);

  const isSubmitting = status === "submitting";

  return (
    <div className="rounded-[1.5rem] border border-[#d9def2] bg-[#f7f9ff] px-6 py-7">
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0053dc]">Log this week</p>
        {status === "submitting" && <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0053dc]">Saving…</span>}
        {status === "success" && <span className="rounded-full bg-[#eefcf5] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#005e3f]">Saved ✓</span>}
        {status === "error" && <span className="rounded-full bg-[#fff1f1] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a83836]">Not saved</span>}
      </div>

      <div className="space-y-6">
        <Question
          eyebrow="Week"
          question="Which week are you logging?"
          context="Use the last day of the week you're reporting — usually a Sunday."
        >
          <input
            className={inputBase}
            value={form.week_ending ?? ""}
            onChange={(e) => set("week_ending", e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g. Sun 20 Apr 2025"
          />
        </Question>

        <Question
          eyebrow="Visibility"
          question="How many times did your listing appear in search results?"
          context="This tells you whether the marketplace is surfacing your product at all. If this number is low, the issue is discoverability — titles, tags, and category."
          help={
            <>
              <strong>Etsy:</strong> Stats → scroll down to your listing impressions.<br />
              <strong>eBay:</strong> Seller Hub → Performance → Traffic → Impressions.<br />
              <strong>Amazon:</strong> Reports → Business Reports → By ASIN → Sessions.<br />
              <strong>Vinted / Depop:</strong> Check individual listing views — not all platforms separate impressions from views yet, and that is fine.
            </>
          }
        >
          <input
            type="number"
            className={inputBase}
            value={form.impressions ?? ""}
            onChange={(e) => set("impressions", e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g. 1,200"
          />
        </Question>

        <Question
          eyebrow="Clicks"
          question="How many people clicked through to your listing?"
          context="Of everyone who saw your product in search, how many were interested enough to click? A low number here usually means the photo or title isn't compelling."
          help={
            <>
              <strong>Etsy:</strong> Stats → Views (this is clicks to your listing page, not page views of your shop).<br />
              <strong>eBay:</strong> Seller Hub → Performance → Traffic → Clicks.<br />
              <strong>Amazon:</strong> Same Business Report — Sessions count unique clicks to your product page.<br />
              If your platform only shows one number (not both impressions and clicks), enter what you have and leave the other blank.
            </>
          }
        >
          <input
            type="number"
            className={inputBase}
            value={form.listing_clicks ?? ""}
            onChange={(e) => set("listing_clicks", e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g. 87"
          />
        </Question>

        <Question
          eyebrow="Sales"
          question="How many orders did you get?"
          context="The most honest signal at this stage. Even one sale in week one is worth logging — it proves the idea converts."
        >
          <input
            type="number"
            className={inputBase}
            value={form.orders ?? ""}
            onChange={(e) => set("orders", e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g. 5"
          />
        </Question>

        <Question
          eyebrow="Economics"
          question="What did you make per sale, roughly?"
          context="Not revenue — actual profit. Take your selling price, subtract what you paid for the product, subtract the marketplace fee (shown in your payout breakdown), and subtract postage. The number left is what you actually kept."
        >
          <input
            className={inputBase}
            value={form.profit_per_sale ?? ""}
            onChange={(e) => set("profit_per_sale", e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g. £8.50"
          />
        </Question>

        <Question
          eyebrow="Reflection"
          question="What's the one thing you noticed this week?"
          context="Anything — a photo that seemed to work, a question a buyer asked, a price change that made a difference. The pattern emerges over weeks."
        >
          <textarea
            className={`${inputBase} min-h-[80px] resize-y`}
            value={form.noticed ?? ""}
            onChange={(e) => set("noticed", e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g. Relisted with better photos on listing 2 and clicks nearly doubled…"
          />
        </Question>
      </div>

      <div className="mt-7 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isSubmitting || !(form.week_ending ?? "").trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0053dc] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#003da8] disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : "Save this week"}
        </button>
        {status === "error" && (
          <span className="text-xs text-[#a83836]">Could not save — please try again.</span>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Validation history table
───────────────────────────────────────────────────────────── */

function ValidationHistory({ entries }: { entries: MetricEntry[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const rows = computeValidation(entries);

  const allOrders = rows.map((r) => r.orders).filter((n): n is number => n !== null);
  const totalOrders = allOrders.reduce((a, b) => a + b, 0);
  const latestProfitPerSale = rows[0]?.profitPerSale ?? null;
  const avgClickRate = (() => {
    const rates = rows.map((r) => r.clickRate).filter((n): n is number => n !== null);
    if (!rates.length) return null;
    return rates.reduce((a, b) => a + b, 0) / rates.length;
  })();
  const avgBuyRate = (() => {
    const rates = rows.map((r) => r.buyRate).filter((n): n is number => n !== null);
    if (!rates.length) return null;
    return rates.reduce((a, b) => a + b, 0) / rates.length;
  })();

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Weeks tracked" value={String(entries.length)} sub={entries.length === 1 ? "1 entry so far" : `${entries.length} entries`} />
        <SummaryCard label="Total orders" value={String(totalOrders)} sub="across all weeks" variant={totalOrders > 0 ? "green" : "neutral"} />
        <SummaryCard
          label="Latest profit / sale"
          value={latestProfitPerSale !== null ? `£${latestProfitPerSale.toFixed(2)}` : "—"}
          sub="After product cost, fees, postage"
          variant={latestProfitPerSale !== null ? (latestProfitPerSale > 0 ? "green" : "red") : "neutral"}
        />
        <SummaryCard label="Avg. buy rate" value={avgBuyRate !== null ? `${avgBuyRate.toFixed(1)}%` : "—"} sub="Of those who clicked, bought" variant={buyRateVariant(avgBuyRate)} />
      </div>

      {/* What the numbers mean */}
      <div className="rounded-2xl border border-[#e2e6f5] bg-white px-6 py-5">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8d99]">How to read these numbers</p>
        <div className="grid gap-x-8 gap-y-3 text-xs text-[#5d5f68] sm:grid-cols-3">
          <div>
            <p className="mb-1 font-semibold text-[#003748]">Click rate (impressions → clicks)</p>
            <p>How compelling your thumbnail and title are. <span className="text-[#005e3f]">≥5% strong</span> · <span className="text-[#835700]">2–5% ok</span> · <span className="text-[#a83836]">&lt;2% fix the listing</span></p>
          </div>
          <div>
            <p className="mb-1 font-semibold text-[#003748]">Buy rate (clicks → orders)</p>
            <p>How well your listing converts once people are in it. <span className="text-[#005e3f]">≥3% strong</span> · <span className="text-[#835700]">1–3% ok</span> · <span className="text-[#a83836]">&lt;1% fix photos/price</span></p>
          </div>
          <div>
            <p className="mb-1 font-semibold text-[#003748]">Diagnosing low orders</p>
            <p>Low click rate = discoverability problem (titles, tags). Good click rate + low buy rate = listing problem (photos, price, description).</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-[#e2e6f5] bg-white">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#eef0f7] bg-[#fafbff]">
              {["Week", "Orders", "Profit / sale", "Impressions", "Clicks", "Click rate", "Buy rate", "Notes"].map((h, i) => (
                <th
                  key={h}
                  className={`px-3 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b8d99] ${i === 0 ? "px-4 text-left" : i === 7 ? "text-center" : "text-right"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f2fa]">
            {rows.map((row, idx) => {
              const isExpanded = expandedId === row.entry.id;
              const hasNotes = !!row.entry.data_json.noticed;
              return (
                <React.Fragment key={row.entry.id}>
                  <tr className={`transition-colors ${isExpanded ? "bg-[#f7f9ff]" : idx === 0 ? "bg-[#fffef9]" : "bg-white hover:bg-[#fafbff]"}`}>
                    <td className="px-4 py-3 text-left">
                      <div className="flex items-center gap-2">
                        {idx === 0 && <span className="rounded-full bg-[#eef4ff] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#0053dc]">Latest</span>}
                        <span className="font-[Manrope] text-sm font-semibold text-[#003748]">{row.entry.week_ending}</span>
                      </div>
                    </td>
                    <Cell variant={wowVariant(row.ordersWow)}>
                      {row.orders !== null ? (<>{row.orders}<WowArrow dir={row.ordersWow} /></>) : <span className="text-[#c8cad4]">—</span>}
                    </Cell>
                    <Cell variant={row.profitPerSale !== null ? (row.profitPerSale > 0 ? "green" : "red") : "muted"}>
                      {row.profitPerSale !== null ? `£${row.profitPerSale.toFixed(2)}` : <span className="text-[#c8cad4]">—</span>}
                    </Cell>
                    <Cell variant="neutral">{row.impressions !== null ? row.impressions.toLocaleString("en-GB") : <span className="text-[#c8cad4]">—</span>}</Cell>
                    <Cell variant="neutral">{row.clicks !== null ? row.clicks.toLocaleString("en-GB") : <span className="text-[#c8cad4]">—</span>}</Cell>
                    <Cell variant={clickRateVariant(row.clickRate)}>{row.clickRate !== null ? `${row.clickRate.toFixed(1)}%` : <span className="text-[#c8cad4]">—</span>}</Cell>
                    <Cell variant={buyRateVariant(row.buyRate)}>{row.buyRate !== null ? `${row.buyRate.toFixed(1)}%` : <span className="text-[#c8cad4]">—</span>}</Cell>
                    <td className="px-3 py-3 text-center">
                      {hasNotes ? (
                        <button type="button" onClick={() => setExpandedId(isExpanded ? null : row.entry.id)} className="rounded-lg border border-[#d9def2] bg-[#f0f2fb] px-3 py-1 text-[11px] font-semibold text-[#545a95] transition hover:bg-[#e4e8f8]">
                          {isExpanded ? "Hide" : "View"}
                        </button>
                      ) : <span className="text-[#c8cad4]">—</span>}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-[#f7f9ff]">
                      <td colSpan={8} className="px-6 pb-5 pt-2">
                        <NoteCard label="Noticed" text={row.entry.data_json.noticed} variant="neutral" />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Live store entry form
───────────────────────────────────────────────────────────── */

function LiveStoreForm({ onSaved }: { onSaved: () => void }) {
  const [form, setForm] = useState<Record<string, string>>({ week_ending: todayLabel() });
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = useCallback(async () => {
    if (!(form.week_ending ?? "").trim() || !(form.revenue ?? "").trim()) return;
    setStatus("submitting");
    try {
      const { week_ending, ...rest } = form;
      const res = await fetch("/api/v2/weekly-metrics", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week_ending, entry_type: "live_store", data: rest }),
      });
      if (!res.ok) throw new Error("Save failed");
      setStatus("success");
      setForm({ week_ending: todayLabel() });
      timerRef.current = setTimeout(() => { setStatus("idle"); onSaved(); }, 1200);
    } catch {
      setStatus("error");
      timerRef.current = setTimeout(() => setStatus("idle"), 3000);
    }
  }, [form, onSaved]);

  const isSubmitting = status === "submitting";
  const canSubmit = !isSubmitting && (form.week_ending ?? "").trim() && (form.revenue ?? "").trim();

  return (
    <div className="rounded-[1.5rem] border border-[#d9def2] bg-[#f7f9ff] px-6 py-7">
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0053dc]">Log this week</p>
        {status === "submitting" && <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#0053dc]">Saving…</span>}
        {status === "success" && <span className="rounded-full bg-[#eefcf5] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#005e3f]">Saved ✓</span>}
        {status === "error" && <span className="rounded-full bg-[#fff1f1] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a83836]">Not saved</span>}
      </div>

      <div className="space-y-6">
        <Question eyebrow="Week" question="Which week are you logging?" context="Use the last day of the week — usually a Sunday.">
          <input className={inputBase} value={form.week_ending ?? ""} onChange={(e) => set("week_ending", e.target.value)} disabled={isSubmitting} placeholder="e.g. Sun 20 Apr 2025" />
        </Question>

        <Question eyebrow="Revenue" question="What was your total revenue this week?" context="Gross sales before fees and costs — the number your store reports.">
          <input className={inputBase} value={form.revenue ?? ""} onChange={(e) => set("revenue", e.target.value)} disabled={isSubmitting} placeholder="e.g. £420" />
        </Question>

        <Question eyebrow="Orders" question="How many orders did you receive?">
          <input type="number" className={inputBase} value={form.orders ?? ""} onChange={(e) => set("orders", e.target.value)} disabled={isSubmitting} placeholder="e.g. 18" />
        </Question>

        <Question eyebrow="Traffic" question="How many visitors came to your store?" context="Unique sessions or visitors — find this in your store analytics or Google Analytics.">
          <input type="number" className={inputBase} value={form.traffic ?? ""} onChange={(e) => set("traffic", e.target.value)} disabled={isSubmitting} placeholder="e.g. 840" />
        </Question>

        <Question eyebrow="Ad spend" question="How much did you spend on ads this week?" context="Leave blank if you're not running paid advertising yet.">
          <input className={inputBase} value={form.ad_spend ?? ""} onChange={(e) => set("ad_spend", e.target.value)} disabled={isSubmitting} placeholder="e.g. £60 (optional)" />
        </Question>

        <Question eyebrow="Reflection" question="What would you do differently next week?" context="One specific, actionable change. The most useful column in the whole log.">
          <textarea className={`${inputBase} min-h-[80px] resize-y`} value={form.what_to_change ?? ""} onChange={(e) => set("what_to_change", e.target.value)} disabled={isSubmitting} placeholder="e.g. Test a different hero image — current one isn't converting…" />
        </Question>
      </div>

      <div className="mt-7 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0053dc] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#003da8] disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : "Save this week"}
        </button>
        {status === "error" && <span className="text-xs text-[#a83836]">Could not save — please try again.</span>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Live store history table
───────────────────────────────────────────────────────────── */

function LiveStoreHistory({ entries, isDev, onSeedDone }: { entries: MetricEntry[]; isDev: boolean; onSeedDone: () => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const rows = computeLiveStore(entries);

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
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Weeks tracked" value={String(entries.length)} sub={entries.length === 1 ? "1 entry so far" : `${entries.length} entries`} />
        <SummaryCard label="Latest revenue" value={latestRevenue !== null ? `£${latestRevenue.toLocaleString("en-GB")}` : "—"} sub={wowLabel(latestRevenueWow) ?? "First entry"} variant={latestRevenueWow === "up" ? "green" : latestRevenueWow === "down" ? "red" : "neutral"} />
        <SummaryCard label="Best revenue week" value={bestRevenue !== null ? `£${bestRevenue.toLocaleString("en-GB")}` : "—"} sub={bestRevenue !== null ? `across ${revenues.length} weeks` : undefined} />
        <SummaryCard label="Avg. conversion" value={avgConv !== null ? `${avgConv.toFixed(1)}%` : "—"} sub="Orders ÷ traffic" variant={convVariant(avgConv)} />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-[#e2e6f5] bg-white">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#eef0f7] bg-[#fafbff]">
              {["Week", "Revenue", "Orders", "Traffic", "Conv %", "Ad Spend", "ROAS", "Notes"].map((h, i) => (
                <th key={h} className={`px-3 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b8d99] ${i === 0 ? "px-4 text-left" : i === 7 ? "text-center" : "text-right"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f2fa]">
            {rows.map((row, idx) => {
              const isExpanded = expandedId === row.entry.id;
              const hasNotes = row.entry.data_json.what_worked || row.entry.data_json.what_to_change || row.entry.data_json.notes;
              return (
                <React.Fragment key={row.entry.id}>
                  <tr className={`transition-colors ${isExpanded ? "bg-[#f7f9ff]" : idx === 0 ? "bg-[#fffef9]" : "bg-white hover:bg-[#fafbff]"}`}>
                    <td className="px-4 py-3 text-left">
                      <div className="flex items-center gap-2">
                        {idx === 0 && <span className="rounded-full bg-[#eef4ff] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#0053dc]">Latest</span>}
                        <span className="font-[Manrope] text-sm font-semibold text-[#003748]">{row.entry.week_ending}</span>
                      </div>
                    </td>
                    <Cell variant={wowVariant(row.revenueWow)}>{row.revenue !== null ? (<>£{row.revenue.toLocaleString("en-GB")}<WowArrow dir={row.revenueWow} /></>) : <span className="text-[#c8cad4]">—</span>}</Cell>
                    <Cell variant={wowVariant(row.ordersWow)}>{row.orders !== null ? (<>{row.orders}<WowArrow dir={row.ordersWow} /></>) : <span className="text-[#c8cad4]">—</span>}</Cell>
                    <Cell variant={wowVariant(row.trafficWow)}>{row.traffic !== null ? (<>{row.traffic.toLocaleString("en-GB")}<WowArrow dir={row.trafficWow} /></>) : <span className="text-[#c8cad4]">—</span>}</Cell>
                    <Cell variant={convVariant(row.convRate)}>{row.convRate !== null ? `${row.convRate.toFixed(2)}%` : <span className="text-[#c8cad4]">—</span>}</Cell>
                    <Cell variant="neutral">{row.adSpend !== null ? `£${row.adSpend.toLocaleString("en-GB")}` : <span className="text-[#c8cad4]">—</span>}</Cell>
                    <Cell variant={roasVariant(row.roas)}>{row.roas !== null ? `${row.roas.toFixed(1)}×` : <span className="text-[#c8cad4]">—</span>}</Cell>
                    <td className="px-3 py-3 text-center">
                      {hasNotes ? (
                        <button type="button" onClick={() => setExpandedId(isExpanded ? null : row.entry.id)} className="rounded-lg border border-[#d9def2] bg-[#f0f2fb] px-3 py-1 text-[11px] font-semibold text-[#545a95] transition hover:bg-[#e4e8f8]">
                          {isExpanded ? "Hide" : "View"}
                        </button>
                      ) : <span className="text-[#c8cad4]">—</span>}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-[#f7f9ff]">
                      <td colSpan={8} className="px-6 pb-5 pt-2">
                        <div className="grid gap-4 sm:grid-cols-3">
                          {row.entry.data_json.what_worked && <NoteCard label="What worked" text={row.entry.data_json.what_worked} variant="green" />}
                          {row.entry.data_json.what_to_change && <NoteCard label="What to change" text={row.entry.data_json.what_to_change} variant="amber" />}
                          {row.entry.data_json.notes && <NoteCard label="Notes" text={row.entry.data_json.notes} variant="neutral" />}
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

      {/* Thresholds key */}
      <div className="rounded-2xl border border-[#e2e6f5] bg-white px-6 py-5">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b8d99]">How thresholds are calculated</p>
        <div className="grid gap-x-8 gap-y-2 text-xs text-[#5d5f68] sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="mb-1 font-semibold text-[#003748]">Conversion %</p><p><span className="text-[#005e3f]">≥ 2%</span> · <span className="text-[#835700]">1–2%</span> · <span className="text-[#a83836]">&lt; 1%</span></p></div>
          <div><p className="mb-1 font-semibold text-[#003748]">ROAS</p><p><span className="text-[#005e3f]">≥ 3×</span> · <span className="text-[#835700]">1–3×</span> · <span className="text-[#a83836]">&lt; 1×</span></p></div>
          <div><p className="mb-1 font-semibold text-[#003748]">Revenue / Orders / Traffic</p><p><span className="text-[#005e3f]">▲ up week-over-week</span> · <span className="text-[#a83836]">▼ down</span></p></div>
        </div>
      </div>

      {isDev && <SeedButton onSeeded={onSeedDone} />}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Seed button (dev / demo helper)
───────────────────────────────────────────────────────────── */

function SeedButton({ onSeeded }: { onSeeded: () => void }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const handleSeed = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/v2/weekly-metrics/seed", { method: "POST", credentials: "same-origin" });
      const json = (await res.json()) as { ok?: boolean };
      if (!res.ok) throw new Error();
      setStatus("done");
      if (json.ok) setTimeout(onSeeded, 800);
    } catch {
      setStatus("error");
    }
  };
  return (
    <div className="flex items-center gap-3 border-t border-[#eef0f7] pt-4">
      <button type="button" onClick={() => void handleSeed()} disabled={status === "loading" || status === "done"} className="rounded-xl border border-[#d9def2] bg-white px-4 py-2 text-xs font-semibold text-[#545a95] transition hover:bg-[#f0f2fb] disabled:opacity-50">
        {status === "loading" ? "Seeding…" : status === "done" ? "Done ✓" : "Load 20 weeks of demo data"}
      </button>
      {status === "error" && <span className="text-xs text-[#a83836]">Seed failed — try again.</span>}
      <span className="text-xs text-[#b0b3be]">Fills in 20 weeks of realistic example data so you can see how the dashboard looks.</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Phase onboarding (no entries yet)
───────────────────────────────────────────────────────────── */

function PhaseOnboarding({ onChoose }: { onChoose: (p: Phase) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => onChoose("validation")}
        className="group rounded-[1.5rem] border border-[#d9def2] bg-white p-6 text-left transition hover:border-[#0053dc] hover:shadow-md"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#545a95]">Phase 1</p>
        <p className="mt-2 font-[Manrope] text-base font-semibold text-[#003748] group-hover:text-[#0053dc]">Testing on a marketplace</p>
        <p className="mt-2 text-sm leading-6 text-[#5d5f68]">
          You have listed a product on Etsy, eBay, Amazon, or similar to validate demand. Track views, clicks, orders, and profit per sale.
        </p>
      </button>
      <button
        type="button"
        onClick={() => onChoose("live_store")}
        className="group rounded-[1.5rem] border border-[#d9def2] bg-white p-6 text-left transition hover:border-[#0053dc] hover:shadow-md"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#545a95]">Phase 2</p>
        <p className="mt-2 font-[Manrope] text-base font-semibold text-[#003748] group-hover:text-[#0053dc]">Running my own store</p>
        <p className="mt-2 text-sm leading-6 text-[#5d5f68]">
          You have a live store and want to track weekly performance across revenue, traffic, conversion rate, and growth.
        </p>
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────── */

export function MetricsClient({ entries, authenticated, isDev = false }: {
  entries: MetricEntry[];
  authenticated: boolean;
  isDev?: boolean;
}) {
  const router = useRouter();

  // Derive initial phase from most recent entry; default to validation for new users
  const derivedPhase: Phase = entries.length > 0
    ? entryPhase(entries[0])
    : "validation";

  const [phase, setPhase] = useState<Phase>(derivedPhase);
  const [showForm, setShowForm] = useState(false);
  const [onboarding, setOnboarding] = useState(entries.length === 0);

  if (!authenticated) {
    return (
      <div className="rounded-2xl border border-[#e2e6f5] bg-white px-8 py-12 text-center">
        <p className="text-sm text-[#5d5f68]">Sign in to view your weekly metrics.</p>
      </div>
    );
  }

  // Filter entries to current phase
  const phaseEntries = entries.filter((e) => entryPhase(e) === phase);
  const otherPhaseCount = entries.length - phaseEntries.length;

  /* ── Onboarding: no entries yet ── */
  if (onboarding) {
    return (
      <div className="space-y-6">
        <div>
          <p className="font-[Manrope] text-lg font-semibold text-[#003748]">Where are you in the journey?</p>
          <p className="mt-1 text-sm text-[#5d5f68]">This sets which metrics you track. You can switch at any time.</p>
        </div>
        <PhaseOnboarding
          onChoose={(p) => {
            setPhase(p);
            setOnboarding(false);
            setShowForm(true);
          }}
        />
        {isDev && <SeedButton onSeeded={() => router.refresh()} />}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Phase selector + log button ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PhaseSelector phase={phase} onChange={(p) => { setPhase(p); setShowForm(false); }} />
        <div className="flex items-center gap-3">
          {otherPhaseCount > 0 && (
            <p className="text-xs text-[#8b8d99]">
              {otherPhaseCount} {phase === "validation" ? "own-store" : "marketplace"} {otherPhaseCount === 1 ? "entry" : "entries"} in other view
            </p>
          )}
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0053dc] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#003da8]"
            >
              + Log this week
            </button>
          )}
        </div>
      </div>

      {/* ── Entry form (toggleable) ── */}
      {showForm && (
        <div className="space-y-3">
          {phase === "validation" ? (
            <ValidationForm onSaved={() => { setShowForm(false); router.refresh(); }} />
          ) : (
            <LiveStoreForm onSaved={() => { setShowForm(false); router.refresh(); }} />
          )}
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="inline-flex items-center rounded-xl border border-[#d9def2] bg-white px-4 py-2 text-sm font-semibold text-[#545a95] transition hover:bg-[#f0f2fb]"
          >
            Cancel
          </button>
        </div>
      )}

      {/* ── History ── */}
      {phaseEntries.length === 0 ? (
        <div className="rounded-2xl border border-[#e2e6f5] bg-white px-8 py-10 text-center">
          <p className="text-sm text-[#5d5f68]">
            No {phase === "validation" ? "marketplace testing" : "own store"} entries yet.
            {!showForm && " Use the button above to log your first week."}
          </p>
        </div>
      ) : phase === "validation" ? (
        <ValidationHistory entries={phaseEntries} />
      ) : (
        <LiveStoreHistory entries={phaseEntries} isDev={isDev} onSeedDone={() => router.refresh()} />
      )}
    </div>
  );
}
