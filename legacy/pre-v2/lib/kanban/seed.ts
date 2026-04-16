import type { Ticket } from "./types";

export const seedTickets: Omit<Ticket, "id">[] = [
  { code: "KAN-006", title: "Chapter 6 verbatim copy pass", status: "backlog", position: 1 },
  { code: "KAN-007", title: "Chapter 7 verbatim copy pass", status: "backlog", position: 2 },
  { code: "KAN-008", title: "Chapter 8 verbatim copy pass", status: "backlog", position: 3 },
  { code: "KAN-009", title: "Chapter 9 verbatim copy pass", status: "backlog", position: 4 },
  { code: "KAN-010", title: "Chapter 10 verbatim copy pass", status: "backlog", position: 5 },
  { code: "KAN-011", title: "Chapter 11–18 rollout plan", status: "backlog", position: 6 },
  { code: "KAN-005", title: "Chapter 5 verbatim copy pass", status: "next", position: 1 },
  { code: "KAN-004", title: "Chapter 4 verbatim copy pass (awaiting your marked slide splits)", status: "doing", position: 1 },
  { code: "KAN-012", title: "Chapter 2 workbook mapping QA (Worksheet 2 opens correctly from Chapter 2)", status: "review", position: 1 },
  { code: "KAN-018", title: "Chapter 3 workbook mapping QA (Worksheet 3 opens correctly from Chapter 3)", status: "review", position: 2 },
  { code: "KAN-002", title: "Chapter 2 verbatim copy pass (source parity + slide chunking)", status: "done", position: 1 },
  { code: "KAN-003", title: "Chapter 3 verbatim copy pass", status: "done", position: 2 },
  { code: "KAN-013", title: "Architecture split: dashboard → project → chapter view", status: "done", position: 3 },
  { code: "KAN-014", title: "Workbook side panel pattern implemented", status: "done", position: 4 },
  { code: "KAN-015", title: "Black/white baseline style implemented", status: "done", position: 5 },
  { code: "KAN-016", title: "Outfit selected as heading font", status: "done", position: 6 },
  { code: "KAN-017", title: "Hover/readability polish baseline complete", status: "done", position: 7 }
];
