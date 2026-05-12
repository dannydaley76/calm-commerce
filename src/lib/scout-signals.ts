const PAGE_SIGNAL_DEFINITIONS = [
  ["Title", ["idea_description", "raw_product_title"]],
  ["Image", ["product_image_url"]],
  ["Source URL", ["source_url"]],
  ["Listing price", ["observed_price"]],
  ["Orders", ["observed_order_count"]],
  ["Reviews", ["observed_review_count"]],
  ["Rating", ["observed_rating"]],
  ["Variants", ["variant_count"]],
] as const;

export function pageSignalsSummary(
  source: Record<string, string | number | null | undefined>,
): {
  label: string;
  detail: string;
  captured: number;
  total: number;
  capturedLabels: string[];
  missingLabels: string[];
} {
  const capturedLabels: string[] = [];
  const missingLabels: string[] = [];

  for (const [label, keys] of PAGE_SIGNAL_DEFINITIONS) {
    const captured = keys.some((key) => {
      const value = source[key];
      return value !== null && value !== undefined && String(value).trim() !== "";
    });
    if (captured) capturedLabels.push(label);
    else missingLabels.push(label);
  }

  const captured = capturedLabels.length;
  const total = PAGE_SIGNAL_DEFINITIONS.length;
  return {
    label: captured >= total ? "All page facts captured" : `${captured} of ${total} page facts captured`,
    detail: missingLabels.length ? `Missing ${missingLabels.join(", ")}` : "No missing page facts reported.",
    captured,
    total,
    capturedLabels,
    missingLabels,
  };
}
