export function isPreviewChapterSlug(slug: string) {
  return slug === "welcome-you-can-do-this";
}

export function isPaidChapterSlug(slug: string) {
  return !isPreviewChapterSlug(slug);
}
