import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { BoardKey, ColumnDef, ColumnKey } from "../../../../lib/kanban/types";

type Ticket = {
  id: string;
  code: string;
  title: string;
  details?: string;
  status: ColumnKey;
  position: number;
};

type BoardFile = {
  tickets: Ticket[];
};

type BoardConfig = {
  key: BoardKey;
  label: string;
  dataPath: string;
  codePrefix: string;
  columns: ColumnDef[];
  defaultCreateStatus: ColumnKey;
};

const BOARD_CONFIGS: Record<BoardKey, BoardConfig> = {
  execution: {
    key: "execution",
    label: "Execution",
    dataPath: path.resolve(process.cwd(), "../knowledge/kanban.json"),
    codePrefix: "KAN-",
    columns: [
      { key: "backlog", title: "Backlog" },
      { key: "next", title: "Next" },
      { key: "doing", title: "Doing" },
      { key: "review", title: "Review" },
      { key: "done", title: "Done" },
    ],
    defaultCreateStatus: "backlog",
  },
  strategy: {
    key: "strategy",
    label: "Strategy",
    dataPath: path.resolve(process.cwd(), "../knowledge/kanban-strategy.json"),
    codePrefix: "STRAT-",
    columns: [
      { key: "now", title: "Now" },
      { key: "next", title: "Next" },
      { key: "later", title: "Later" },
    ],
    defaultCreateStatus: "now",
  },
};

function getBoardConfig(request: Request): BoardConfig {
  const { searchParams } = new URL(request.url);
  const board = searchParams.get("board");
  if (board === "strategy") return BOARD_CONFIGS.strategy;
  return BOARD_CONFIGS.execution;
}

async function readData(config: BoardConfig): Promise<BoardFile> {
  const raw = await fs.readFile(config.dataPath, "utf8");
  const parsed = JSON.parse(raw) as BoardFile;
  return { tickets: parsed.tickets ?? [] };
}

async function writeData(config: BoardConfig, data: BoardFile) {
  await fs.writeFile(config.dataPath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function nextCode(tickets: Ticket[], prefix: string) {
  const max = tickets.reduce((acc, t) => {
    if (!t.code.startsWith(prefix)) return acc;
    const n = Number(t.code.replace(prefix, ""));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

function isAllowedStatus(config: BoardConfig, status: string): status is ColumnKey {
  return config.columns.some((c) => c.key === status);
}

export async function GET(req: Request) {
  const config = getBoardConfig(req);
  const data = await readData(config);
  return NextResponse.json({
    board: config.key,
    boardLabel: config.label,
    columns: config.columns,
    tickets: data.tickets,
  });
}

export async function PUT(req: Request) {
  const config = getBoardConfig(req);
  return NextResponse.json({ ok: true, seeded: false, mode: "file", board: config.key });
}

export async function POST(req: Request) {
  const config = getBoardConfig(req);
  const body = await req.json().catch(() => ({}));
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const details = typeof body?.details === "string" ? body.details : "";
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const data = await readData(config);
  const targetStatus = config.defaultCreateStatus;
  const columnTickets = data.tickets
    .filter((t) => t.status === targetStatus)
    .sort((a, b) => a.position - b.position);
  const position = (columnTickets.at(-1)?.position ?? 0) + 1;

  const ticket: Ticket = {
    id: crypto.randomUUID(),
    code: nextCode(data.tickets, config.codePrefix),
    title,
    details,
    status: targetStatus,
    position,
  };

  data.tickets.push(ticket);
  await writeData(config, data);
  return NextResponse.json({ ticket }, { status: 201 });
}

export async function PATCH(req: Request) {
  const config = getBoardConfig(req);
  const body = await req.json().catch(() => ({}));
  const ticketId = typeof body?.ticketId === "string" ? body.ticketId : "";
  if (!ticketId) return NextResponse.json({ error: "ticketId required" }, { status: 400 });

  const data = await readData(config);
  const idx = data.tickets.findIndex((t) => t.id === ticketId);
  if (idx === -1) return NextResponse.json({ error: "ticket not found" }, { status: 404 });

  const current = data.tickets[idx];
  const patch: Partial<Ticket> = {};
  if (typeof body?.title === "string") patch.title = body.title.trim() || "Untitled ticket";
  if (typeof body?.details === "string") patch.details = body.details;
  if (typeof body?.status === "string") {
    if (!isAllowedStatus(config, body.status)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }
    patch.status = body.status;
  }
  if (typeof body?.position === "number") patch.position = body.position;

  data.tickets[idx] = { ...current, ...patch };
  await writeData(config, data);
  return NextResponse.json({ ticket: data.tickets[idx] });
}

export async function DELETE(req: Request) {
  const config = getBoardConfig(req);
  const body = await req.json().catch(() => ({}));
  const ticketId = typeof body?.ticketId === "string" ? body.ticketId : "";
  if (!ticketId) return NextResponse.json({ error: "ticketId required" }, { status: 400 });

  const data = await readData(config);
  const nextTickets = data.tickets.filter((t) => t.id !== ticketId);
  if (nextTickets.length === data.tickets.length) {
    return NextResponse.json({ error: "ticket not found" }, { status: 404 });
  }

  data.tickets = nextTickets;
  await writeData(config, data);
  return NextResponse.json({ ok: true });
}
