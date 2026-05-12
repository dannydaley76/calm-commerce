export type EconomicsFeeType = "percent" | "fixed";

export type EconomicsFeeRow = {
  id: string;
  name: string;
  type: EconomicsFeeType;
  value: string;
};

function parseMoney(value: string | undefined): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.\-]/g, "");
  if (!cleaned) return null;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function isFeeRow(value: unknown): value is EconomicsFeeRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<EconomicsFeeRow>;
  return (
    typeof row.id === "string" &&
    typeof row.name === "string" &&
    (row.type === "percent" || row.type === "fixed") &&
    typeof row.value === "string"
  );
}

export function parseFeeRows(value: string | undefined): EconomicsFeeRow[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(isFeeRow) : [];
  } catch {
    return [];
  }
}

export function serializeFeeRows(rows: EconomicsFeeRow[]): string {
  return JSON.stringify(rows);
}

export function calculateFeeRowAmount(row: EconomicsFeeRow, sellingPrice: number): number | null {
  const parsed = parseMoney(row.value);
  if (parsed === null) return null;
  return row.type === "percent" ? sellingPrice * (parsed / 100) : parsed;
}

export function calculateFeeRowsTotal(rows: EconomicsFeeRow[], sellingPrice: number): number | null {
  let total = 0;
  for (const row of rows) {
    const amount = calculateFeeRowAmount(row, sellingPrice);
    if (amount === null) return null;
    total += amount;
  }
  return total;
}
