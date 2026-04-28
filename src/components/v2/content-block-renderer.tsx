import Link from "next/link";
import type { ContentBlock } from "@/lib/v2/types/domain";

export function ContentBlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "heading":
      return block.level === 2 ? (
        <h2 className="font-[Manrope] text-3xl font-extrabold tracking-tight">{block.content}</h2>
      ) : (
        <h3 className="font-[Manrope] text-2xl font-bold tracking-tight text-ink-900">{block.content}</h3>
      );

    case "paragraph":
      return <p className="text-lg leading-8 text-ink-500">{block.content}</p>;

    case "bullets":
      return (
        <ul className="list-disc space-y-3 pl-6 text-lg leading-8 text-ink-500 marker:text-cobalt-600">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );

    case "numbered":
      return (
        <ol className="list-decimal space-y-3 pl-6 text-lg leading-8 text-ink-500 marker:text-cobalt-600">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      );

    case "table":
      return (
        <div className="overflow-x-auto rounded-[1.5rem] border border-[#e2e4ea] bg-white">
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
                <tr key={`${row.join("-")}-${index}`} className="border-t border-[#ececf2]">
                  {row.map((cell, cellIndex) => (
                    <td key={`${cell}-${cellIndex}`} className="px-4 py-3 align-top text-ink-500">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "quote":
      return <blockquote className="rounded-[1.5rem] bg-surface-sunken p-6 text-lg leading-8 text-[#4d5160]">“{block.content}”</blockquote>;

    case "callout":
      return (
        <div className={`rounded-[1.5rem] p-6 ${block.style === "insight" ? "bg-success-100 text-[#005e3f]" : "bg-[#fff7eb] text-[#8a4b00]"}`}>
          {block.title ? <p className="text-[10px] font-bold uppercase tracking-[0.18em]">{block.title}</p> : null}
          <p className="mt-3 text-base leading-7">{block.content}</p>
        </div>
      );

    case "tooltip":
      return (
        <span className="inline cursor-help border-b border-dotted border-cobalt-600 text-ink-900" title={block.definition}>
          {block.term}
        </span>
      );

    case "image":
      return (
        <figure className="my-8 rounded-[1.5rem] border border-[#e2e4ea] bg-[#f8f9fb] p-6 text-center">
          <div className="mb-2 text-3xl text-[#b0b3be]">◌</div>
          <figcaption className="text-sm text-ink-500">{block.alt ?? "Image placeholder"}</figcaption>
        </figure>
      );

    case "loop":
      return (
        <div className="rounded-[1.5rem] border-l-4 border-[#7a5cff] bg-[#f6f2ff] p-6 text-[#4f3d8a]">
          <p className="text-base leading-7">{block.message}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {block.targets.map((target) => (
              <Link
                key={`${target.chapterSlug}-${target.stepId ?? 'chapter'}`}
                href={`/chapter/${target.chapterSlug}/steps${target.stepId ? `?step=${target.stepId}` : ""}`}
                className="inline-flex items-center justify-center rounded-xl bg-[#7a5cff] px-4 py-2 text-sm font-semibold !text-white"
              >
                {target.label}
              </Link>
            ))}
          </div>
        </div>
      );
  }
}
