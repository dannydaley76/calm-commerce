"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { chapter1Slides } from "../../../../../lib/data/chapter1-slides";
import { chapterSlidesById } from "../../../../../lib/data/chapter2to5-slides";
import { chapters, worksheets } from "../../../../../lib/data/content";

function renderReadableBody(body: string) {
  const sections = body.split("\n\n").map((s) => s.trim()).filter(Boolean);

  return sections.map((section, i) => {
    const lines = section.split("\n").map((l) => l.trim()).filter(Boolean);

    const bullets = lines.length > 1 && lines.every((l) => l.startsWith("• "));
    if (bullets) {
      return (
        <ul key={i} className="list-disc space-y-2 pl-6 text-lg leading-8 text-foreground/90">
          {lines.map((line) => (
            <li key={line}>{line.replace(/^•\s*/, "")}</li>
          ))}
        </ul>
      );
    }

    const numbered = lines.length > 1 && lines.every((l) => /^\d+\)/.test(l));
    if (numbered) {
      return (
        <ol key={i} className="list-decimal space-y-2 pl-6 text-lg leading-8 text-foreground/90">
          {lines.map((line) => (
            <li key={line}>{line.replace(/^\d+\)\s*/, "")}</li>
          ))}
        </ol>
      );
    }

    const isPull = i === 0 || section.length < 90;
    if (isPull) {
      return <p key={i} className="text-2xl leading-snug text-foreground">{section}</p>;
    }

    return <p key={i} className="text-lg leading-8 text-muted">{section}</p>;
  });
}

export default function ChapterPage() {
  const params = useParams<{ projectId: string; chapterId: string }>();
  const projectId = params?.projectId ?? "";
  const chapterId = Number(params?.chapterId ?? "1");

  const chapter = chapters.find((c) => c.id === chapterId) ?? chapters[0];
  const worksheet = worksheets.find((w) => w.id === chapter.worksheetId) ?? worksheets[0];

  const slides = useMemo(() => {
    if (chapter.id === 1) return chapter1Slides;

    const mappedSlides = chapterSlidesById[chapter.id];
    if (mappedSlides && mappedSlides.length > 0) return mappedSlides;

    return [{ title: chapter.title, body: "Content setup in progress for this chapter." }];
  }, [chapter]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [workbookOpen, setWorkbookOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const slide = slides[slideIndex];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [slideIndex]);

  const goToSlide = (nextIndex: number) => {
    setSlideIndex(nextIndex);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8 rounded-2xl border border-border bg-surface p-6">
          <Link href={`/project/${projectId}`} className="text-sm text-muted underline">← Back to chapters</Link>
          <p className="mt-3 text-sm uppercase tracking-[0.16em] text-muted">Chapter {chapter.id}</p>
          <h1 className="font-heading mt-2 text-6xl font-semibold leading-[0.98] tracking-tight">{chapter.title}</h1>
          <p className="mt-3 text-muted">Slide {slideIndex + 1} of {slides.length}</p>
        </header>

        <section className="rounded-2xl border border-white/15 bg-surface p-8">
          {slide.image ? (
            <figure className="mb-6 overflow-hidden rounded-xl border border-border">
              <Image src={slide.image.src} alt={slide.image.alt} width={1400} height={840} className="h-80 w-full object-cover" />
              {slide.image.caption ? <figcaption className="border-t border-border px-3 py-2 text-xs text-muted">{slide.image.caption}</figcaption> : null}
            </figure>
          ) : null}

          <h2 className="font-heading text-5xl font-semibold tracking-tight">{slide.title}</h2>
          <div className="mt-5 space-y-5">{renderReadableBody(slide.body)}</div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => goToSlide(Math.max(0, slideIndex - 1))} disabled={slideIndex === 0} className="rounded-lg border border-border px-4 py-2 disabled:opacity-40">Back</button>
            <button onClick={() => goToSlide(Math.min(slides.length - 1, slideIndex + 1))} disabled={slideIndex === slides.length - 1} className="rounded-lg border border-white bg-white px-4 py-2 font-medium text-black disabled:opacity-40">Next</button>
            <button onClick={() => setWorkbookOpen(true)} className="rounded-lg border border-white bg-white px-4 py-2 font-medium text-black">Open {worksheet.title}</button>
          </div>
        </section>
      </div>

      <div className={`fixed inset-0 z-50 flex transition-opacity duration-300 ${workbookOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}>
        <button className="h-full flex-1 bg-black/60 transition-opacity duration-300" onClick={() => setWorkbookOpen(false)} aria-label="Close workbook" />
        <aside className={`h-full w-full max-w-xl overflow-y-auto border-l border-border bg-surface p-6 shadow-2xl transition-transform duration-300 ease-out ${workbookOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-2xl font-semibold">{worksheet.title}</h3>
            <button onClick={() => setWorkbookOpen(false)} className="rounded-lg border border-border px-3 py-1">Close</button>
          </div>
          <p className="mb-5 text-sm text-muted">{worksheet.description}</p>
          <div className="space-y-4">
            {worksheet.fields.map((field) => (
              <label key={field.id} className="block">
                <span className="mb-2 block text-sm font-medium">{field.label}</span>
                {field.type === "textarea" ? (
                  <textarea
                    className="min-h-28 w-full rounded-xl border border-border bg-background p-3 outline-none"
                    value={answers[field.id] ?? ""}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))}
                  />
                ) : (
                  <input
                    className="w-full rounded-xl border border-border bg-background p-3 outline-none"
                    value={answers[field.id] ?? ""}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))}
                  />
                )}
              </label>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
