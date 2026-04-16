"use client";

import Link from "next/link";

export function WeeklyMetricsCard({
  chapterSlug: _chapterSlug,
  chapterId: _chapterId,
  worksheetDefinition: _worksheetDefinition,
}: {
  chapterSlug: string;
  chapterId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  worksheetDefinition: any;
}) {
  return (
    <div className="mt-8 rounded-[1.5rem] border border-[#d9def2] bg-[#f7f9ff] p-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0053dc]">
        Weekly metrics
      </p>
      <p className="mt-3 text-sm leading-6 text-[#003748]">
        Log your numbers for the week and see how your store is performing over time — revenue,
        orders, traffic, conversion rate, ROAS, and more, with week-on-week comparisons.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/metrics"
          className="inline-flex items-center gap-2 rounded-xl bg-[#0053dc] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#003da8]"
        >
          Open metrics dashboard →
        </Link>
      </div>
    </div>
  );
}
