import { redirect } from "next/navigation";

export default async function ChapterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (slug === "set-your-founder-rules") {
    redirect(`/chapter/${slug}/steps`);
  }

  redirect(`/chapter/${slug}/steps`);
}
