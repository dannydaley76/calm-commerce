import Link from "next/link";
import type { ContentBlock } from "@/lib/v2/types/domain";

const TOOLTIP_TERMS: Record<string, string> = {
  SKU: "Stock Keeping Unit. A unique version of a product that you track separately, such as one size, colour, or bundle.",
  SKUs: "Stock Keeping Units. Each product variant you sell and track separately, such as each size or colour.",
  CPA: "Cost per acquisition. The average amount you spend on ads to get one sale.",
  CTR: "Click-through rate. The percentage of people who saw something and clicked it.",
  AOV: "Average order value. Total revenue divided by number of orders.",
};

const tooltipPattern = new RegExp(`\\b(${Object.keys(TOOLTIP_TERMS).join("|")})\\b`, "g");

function renderWithTooltips(text: string) {
  const parts = text.split(tooltipPattern);

  return parts.map((part, index) => {
    const definition = TOOLTIP_TERMS[part];
    if (!definition) return part;

    return (
      <span
        key={`${part}-${index}`}
        className="cursor-help border-b border-dotted border-cobalt-600 text-ink-900"
        title={definition}
      >
        {part}
      </span>
    );
  });
}

export function ContentBlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "heading":
      return block.level === 2 ? (
        <h2 className="font-[Manrope] text-3xl font-extrabold tracking-tight text-ink-900">
          {block.content}
        </h2>
      ) : (
        <h3 className="font-[Manrope] text-2xl font-bold tracking-tight text-ink-900">
          {block.content}
        </h3>
      );

    case "paragraph":
      return <p className="text-lg leading-8 text-ink-700">{renderWithTooltips(block.content)}</p>;

    case "bullets":
      return (
        <ul className="list-disc space-y-3 pl-6 text-lg leading-8 text-ink-700 marker:text-cobalt-600">
          {block.items.map((item) => (
            <li key={item}>{renderWithTooltips(item)}</li>
          ))}
        </ul>
      );

    case "numbered":
      return (
        <ol className="list-decimal space-y-3 pl-6 text-lg leading-8 text-ink-700 marker:text-cobalt-600">
          {block.items.map((item) => (
            <li key={item}>{renderWithTooltips(item)}</li>
          ))}
        </ol>
      );

    case "table":
      return (
        <div className="overflow-x-auto rounded-[1.5rem] border border-ink-100 bg-surface-raised">
          <table className="min-w-full text-left text-sm text-ink-900">
            <thead className="bg-surface-sunken text-ink-500">
              <tr>
                {block.headers.map((header) => (
                  <th key={header} className="px-4 py-3 font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, index) => (
                <tr key={`${row.join("-")}-${index}`} className="border-t border-ink-100">
                  {row.map((cell, cellIndex) => (
                    <td key={`${cell}-${cellIndex}`} className="px-4 py-3 align-top text-ink-700">
                      {renderWithTooltips(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "quote":
      return (
        <blockquote className="rounded-[1.5rem] bg-surface-sunken p-6 text-lg leading-8 text-ink-700">
          &ldquo;{block.content}&rdquo;
        </blockquote>
      );

    case "callout":
      return (
        <div className={`rounded-[1.5rem] p-6 ${
          block.style === "insight"
            ? "bg-success-100 text-success-600"
            : "bg-amber-100 text-amber-700"
        }`}>
          {block.title && (
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]">{block.title}</p>
          )}
          <p className="mt-3 text-base leading-7">{block.content}</p>
        </div>
      );

    case "tooltip":
      return (
        <span
          className="inline cursor-help border-b border-dotted border-cobalt-600 text-ink-900"
          title={block.definition}
        >
          {block.term}
        </span>
      );

    case "image":
      return (
        <figure className="my-8 rounded-[1.5rem] border border-ink-100 bg-surface-sunken p-6 text-center">
          <div className="mb-2 text-3xl text-ink-300">◌</div>
          <figcaption className="text-sm text-ink-500">{block.alt ?? "Image placeholder"}</figcaption>
        </figure>
      );

    case "loop":
      return (
        <div className="rounded-[1.5rem] border border-ink-100 border-l-4 border-l-[#545a95] bg-surface-raised p-6 text-ink-700">
          <p className="text-base leading-7">{block.message}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {block.targets.map((target) => (
              <Link
                key={`${target.chapterSlug}-${target.stepId ?? "chapter"}`}
                href={`/chapter/${target.chapterSlug}/steps${target.stepId ? `?step=${target.stepId}` : ""}`}
                className="inline-flex items-center justify-center rounded-lg bg-[#545a95] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                {target.label}
              </Link>
            ))}
          </div>
        </div>
      );
  }
}
