import { describe, expect, it } from "vitest";
import {
  ensureProductIdeaIds,
  findProductIdeaByIdOrLabel,
  getProductIdeaId,
} from "../product-idea-identity";

describe("product idea identity", () => {
  it("keeps an existing idea_id", () => {
    const [row] = ensureProductIdeaIds([{ idea_id: "idea_existing", idea_description: "Desk shelf" }]);

    expect(row.idea_id).toBe("idea_existing");
  });

  it("creates a deterministic fallback ID for legacy rows", () => {
    const row = {
      idea_description: "Desk shelf",
      demand_evidence: "Marketplace reviews",
    };

    expect(getProductIdeaId(row, 0)).toBe(getProductIdeaId(row, 0));
  });

  it("matches a selected idea by ID or legacy label", () => {
    const rows = ensureProductIdeaIds([
      { idea_description: "Desk shelf" },
      { idea_description: "Cable tidy" },
    ]);

    expect(findProductIdeaByIdOrLabel(rows, rows[1].idea_id ?? "")?.idea_description).toBe("Cable tidy");
    expect(findProductIdeaByIdOrLabel(rows, "Desk shelf")?.idea_description).toBe("Desk shelf");
  });
});
