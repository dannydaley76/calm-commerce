export type ColumnKey = string;

export type Ticket = {
  id: string;
  code: string;
  title: string;
  details?: string;
  status: ColumnKey;
  position: number;
};

export type ColumnDef = { key: ColumnKey; title: string };

export type BoardKey = "execution" | "strategy";
