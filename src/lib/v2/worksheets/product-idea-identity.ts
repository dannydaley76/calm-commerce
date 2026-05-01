export const PRODUCT_ID_FIELD = "idea_id";

export type ProductIdeaRow = Record<string, string | undefined>;

function hashString(value: string): string {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function fallbackSeed(row: ProductIdeaRow, index: number): string {
  return [
    row.idea_description,
    row.demand_evidence,
    row.competition_notes,
    row.seasonality,
    String(index),
  ]
    .map((part) => (part ?? "").trim())
    .join("|");
}

export function getProductIdeaId(row: ProductIdeaRow, index: number): string {
  const existing = (row[PRODUCT_ID_FIELD] ?? "").trim();
  if (existing) return existing;
  return `idea_${hashString(fallbackSeed(row, index))}`;
}

export function ensureProductIdeaIds<T extends ProductIdeaRow>(rows: T[]): Array<T & { idea_id: string }> {
  return rows.map((row, index) => ({
    ...row,
    [PRODUCT_ID_FIELD]: getProductIdeaId(row, index),
  }));
}

export function getProductIdeaLabel(row: ProductIdeaRow, index: number): string {
  return (row.idea_description ?? "").trim() || `Idea ${index + 1}`;
}

export function findProductIdeaByIdOrLabel(
  rows: ProductIdeaRow[],
  value: string | undefined,
): ProductIdeaRow | null {
  const selected = (value ?? "").trim();
  if (!selected) return null;
  const rowsWithIds = ensureProductIdeaIds(rows);
  return (
    rowsWithIds.find((row, index) => getProductIdeaId(row, index) === selected) ??
    rowsWithIds.find((row) => (row.idea_description ?? "").trim() === selected) ??
    null
  );
}
