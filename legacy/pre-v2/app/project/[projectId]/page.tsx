"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { chapters } from "../../../lib/data/content";

export default function ProjectPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId ?? "";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8 rounded-2xl border border-border bg-surface p-6">
          <Link href="/" className="text-sm text-muted underline">← Back to dashboard</Link>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Project Journey</h1>
          <p className="mt-2 text-muted">Pick a chapter to start reading. Workbook opens as a slide panel in chapter view.</p>
        </header>

        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-5 text-2xl font-semibold">Chapters</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {chapters.map((chapter) => (
              <Link
                key={chapter.id}
                href={`/project/${projectId}/chapter/${chapter.id}`}
                className="rounded-xl border border-border p-4 transition hover:border-white/60 hover:bg-white/10"
              >
                <p className="text-sm text-muted">Chapter {chapter.id}</p>
                <h3 className="mt-1 text-xl font-semibold">{chapter.title}</h3>
                <p className="mt-2 text-sm text-muted">Workbook: Worksheet {chapter.worksheetId}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
