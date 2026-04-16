"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BoardKey, ColumnDef, ColumnKey, Ticket } from "../../lib/kanban/types";

type BoardState = Record<ColumnKey, Ticket[]>;

type BoardApiResponse = {
  board?: BoardKey;
  boardLabel?: string;
  columns?: ColumnDef[];
  tickets?: Ticket[];
};

const boardOptions: { key: BoardKey; title: string }[] = [
  { key: "execution", title: "Execution" },
  { key: "strategy", title: "Strategy" },
];

function emptyBoard(columns: ColumnDef[]): BoardState {
  return columns.reduce<BoardState>((acc, column) => {
    acc[column.key] = [];
    return acc;
  }, {});
}

function groupTickets(tickets: Ticket[], columns: ColumnDef[]): BoardState {
  const board = emptyBoard(columns);
  tickets.forEach((t) => {
    if (board[t.status]) board[t.status].push(t);
  });
  columns.forEach((column) => {
    board[column.key] = board[column.key].sort((a, b) => a.position - b.position);
  });
  return board;
}

function findTicket(board: BoardState, ticketId: string | null): Ticket | null {
  if (!ticketId) return null;
  for (const column of Object.keys(board) as ColumnKey[]) {
    const found = board[column].find((t) => t.id === ticketId);
    if (found) return found;
  }
  return null;
}

export default function KanbanPage() {
  const [activeBoard, setActiveBoard] = useState<BoardKey>("execution");
  const [columns, setColumns] = useState<ColumnDef[]>([]);
  const [board, setBoard] = useState<BoardState>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newTicketTitle, setNewTicketTitle] = useState("");
  const [newTicketDetails, setNewTicketDetails] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const selectedTicket = useMemo(() => findTicket(board, selectedTicketId), [board, selectedTicketId]);
  const [editTitle, setEditTitle] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const counts = useMemo(
    () => columns.map((c) => ({ key: c.key, title: c.title, count: board[c.key]?.length ?? 0 })),
    [board, columns],
  );

  const endpoint = useMemo(() => `/api/kanban/tickets?board=${activeBoard}`, [activeBoard]);

  const loadBoard = async () => {
    setLoading(true);
    setError(null);

    const seedRes = await fetch(endpoint, { method: "PUT" });
    if (!seedRes.ok) {
      const text = await seedRes.text();
      setError(text || "Failed to seed board");
      setLoading(false);
      return;
    }

    const res = await fetch(endpoint);
    if (!res.ok) {
      const text = await res.text();
      setError(text || "Failed to load board");
      setLoading(false);
      return;
    }

    const data = (await res.json()) as BoardApiResponse;
    const nextColumns = data.columns ?? [];
    setColumns(nextColumns);
    setBoard(groupTickets(data.tickets ?? [], nextColumns));
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBoard();
  }, [endpoint]);

  const onDropCard = async (targetColumn: ColumnKey, e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    const payload = e.dataTransfer.getData("application/json");
    if (!payload) return;

    const parsed = JSON.parse(payload) as { source: ColumnKey; ticketId: string };
    if (!parsed.source || !parsed.ticketId) return;
    if (parsed.source === targetColumn) return;

    const movingTicket = board[parsed.source]?.find((t) => t.id === parsed.ticketId);
    if (!movingTicket) return;

    const nextPosition = (board[targetColumn]?.length ?? 0) + 1;

    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: movingTicket.id, status: targetColumn, position: nextPosition }),
    });

    if (!res.ok) return;
    await loadBoard();
  };

  const createTicket = async () => {
    const title = newTicketTitle.trim();
    if (!title) return;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, details: newTicketDetails.trim() }),
    });

    if (!res.ok) return;
    setNewTicketTitle("");
    setNewTicketDetails("");
    await loadBoard();
  };

  const openEditor = (ticket: Ticket) => {
    setSelectedTicketId(ticket.id);
    setEditTitle(ticket.title);
    setEditDetails(ticket.details ?? "");
    setSaveStatus("idle");
  };

  const persistTicket = async (ticketId: string, closeAfterSave = false) => {
    setSaveStatus("saving");
    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticketId,
        title: editTitle.trim() || "Untitled ticket",
        details: editDetails,
      }),
    });

    if (!res.ok) {
      setSaveStatus("error");
      return;
    }

    setSaveStatus("saved");
    await loadBoard();
    if (closeAfterSave) setSelectedTicketId(null);
  };

  const deleteTicket = async () => {
    if (!selectedTicketId) return;

    const res = await fetch(endpoint, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: selectedTicketId }),
    });

    if (!res.ok) {
      setSaveStatus("error");
      return;
    }

    setSelectedTicketId(null);
    setSaveStatus("idle");
    await loadBoard();
  };

  useEffect(() => {
    if (!selectedTicket) return;

    const titleChanged = (editTitle.trim() || "Untitled ticket") !== selectedTicket.title;
    const detailsChanged = editDetails !== (selectedTicket.details ?? "");
    if (!titleChanged && !detailsChanged) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      void persistTicket(selectedTicket.id);
    }, 700);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [editTitle, editDetails, selectedTicket]);

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-2xl border border-border bg-surface p-6">
          <p className="text-sm text-muted">Digital Product App</p>
          <h1 className="font-heading text-5xl font-semibold tracking-tight">Kanban Board</h1>
          <p className="mt-2 text-sm text-muted">File-backed tickets with drag/drop, editing, and board switching.</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted">Board:</span>
            {boardOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => {
                  setSelectedTicketId(null);
                  setActiveBoard(option.key);
                }}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  activeBoard === option.key ? "border-white bg-white text-black" : "border-border text-muted"
                }`}
              >
                {option.title}
              </button>
            ))}
          </div>

          <div className="mt-5 grid max-w-2xl gap-2">
            <input
              value={newTicketTitle}
              onChange={(e) => setNewTicketTitle(e.target.value)}
              placeholder="Ticket title..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none"
            />
            <textarea
              value={newTicketDetails}
              onChange={(e) => setNewTicketDetails(e.target.value)}
              placeholder={"User story / acceptance criteria...\n\nAs a...\nI want...\nSo that...\n\nAcceptance criteria:\n- ...\n- ..."}
              className="min-h-28 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none"
            />
            <button
              onClick={createTicket}
              className="w-fit rounded-lg border border-white bg-white px-4 py-2 font-medium text-black"
            >
              Add ticket
            </button>
          </div>
        </header>

        {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}
        {loading ? <p className="mb-4 text-sm text-muted">Loading board…</p> : null}

        <div className="mb-4 flex flex-wrap gap-2 text-sm text-muted">
          {counts.map((c) => (
            <span key={c.key} className="rounded-full border border-border px-3 py-1">
              {c.title}: {c.count}
            </span>
          ))}
        </div>

        <div className={`grid gap-4 ${columns.length >= 5 ? "md:grid-cols-2 xl:grid-cols-5" : "md:grid-cols-3"}`}>
          {columns.map((column) => (
            <section
              key={column.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDropCard(column.key, e)}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <h2 className="font-heading mb-3 text-xl font-semibold">{column.title}</h2>
              <div className="min-h-24 space-y-2">
                {(board[column.key]?.length ?? 0) === 0 ? <p className="text-sm text-muted">Drop cards here</p> : null}
                {(board[column.key] ?? []).map((ticket) => (
                  <article
                    key={ticket.id}
                    draggable
                    onClick={() => openEditor(ticket)}
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        "application/json",
                        JSON.stringify({ source: column.key, ticketId: ticket.id }),
                      );
                    }}
                    className="active:cursor-grabbing cursor-grab rounded-xl border border-border bg-black/20 p-3 text-sm leading-6"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs uppercase tracking-wide text-muted">{ticket.code}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void navigator.clipboard.writeText(ticket.code);
                          setCopiedCode(ticket.code);
                          setTimeout(() => setCopiedCode((curr) => (curr === ticket.code ? null : curr)), 1200);
                        }}
                        className="rounded border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted"
                        title="Copy ticket ID"
                      >
                        {copiedCode === ticket.code ? "Copied" : "Copy ID"}
                      </button>
                    </div>
                    <p className="mt-1 font-medium text-foreground">{ticket.title}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {selectedTicket ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-6">
            <p className="text-xs uppercase tracking-wide text-muted">{selectedTicket.code}</p>
            <h3 className="font-heading mt-1 text-2xl font-semibold">Edit ticket</h3>

            <div className="mt-4 grid gap-3">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none"
              />
              <textarea
                value={editDetails}
                onChange={(e) => setEditDetails(e.target.value)}
                className="min-h-40 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none"
              />
            </div>

            <div className="mt-5 flex items-center gap-2">
              <button
                onClick={() => void persistTicket(selectedTicket.id, true)}
                className="rounded-lg border border-white bg-white px-4 py-2 font-medium text-black"
              >
                Save & close
              </button>
              <button onClick={() => setSelectedTicketId(null)} className="rounded-lg border border-border px-4 py-2">
                Close
              </button>
              <button onClick={deleteTicket} className="ml-auto rounded-lg border border-red-400 px-4 py-2 text-red-200">
                Delete
              </button>
            </div>
            <p className="mt-2 text-xs text-muted">
              {saveStatus === "saving" ? "Saving…" : null}
              {saveStatus === "saved" ? "All changes saved" : null}
              {saveStatus === "error" ? "Couldn’t save changes" : null}
              {saveStatus === "idle" ? "Changes auto-save while you type" : null}
            </p>
          </div>
        </div>
      ) : null}
    </main>
  );
}
