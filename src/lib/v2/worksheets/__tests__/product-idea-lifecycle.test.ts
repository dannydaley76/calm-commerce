import { describe, expect, it } from "vitest";
import { getProductIdeaLifecycles } from "../product-idea-lifecycle";
import { ensureProductIdeaIds } from "../product-idea-identity";

describe("getProductIdeaLifecycles", () => {
  it("marks a Chapter 3-only idea as draft", () => {
    const ideas = ensureProductIdeaIds([{ idea_description: "Desk shelf" }]);
    const [lifecycle] = getProductIdeaLifecycles({
      product_ideas: JSON.stringify(ideas),
    });

    expect(lifecycle.status).toBe("draft");
    expect(lifecycle.label).toBe("Desk shelf");
  });

  it("marks an idea with economics as checked", () => {
    const ideas = ensureProductIdeaIds([{ idea_description: "Desk shelf" }]);
    const [lifecycle] = getProductIdeaLifecycles({
      product_ideas: JSON.stringify(ideas),
      idea_economics: JSON.stringify([{ idea_id: ideas[0].idea_id, viable: "Yes: proceed" }]),
    });

    expect(lifecycle.status).toBe("economics_checked");
    expect(lifecycle.latestSignal).toContain("Yes: proceed");
  });

  it("matches legacy economics rows by position when no idea ID or name exists", () => {
    const ideas = ensureProductIdeaIds([{ idea_description: "Desk shelf" }]);
    const [lifecycle] = getProductIdeaLifecycles({
      product_ideas: JSON.stringify(ideas),
      idea_economics: JSON.stringify([{ viable: "Yes: proceed" }]),
    });

    expect(lifecycle.status).toBe("economics_checked");
  });

  it("marks the chosen idea as selected", () => {
    const ideas = ensureProductIdeaIds([
      { idea_description: "Desk shelf" },
      { idea_description: "Cable tidy" },
    ]);
    const lifecycles = getProductIdeaLifecycles({
      product_ideas: JSON.stringify(ideas),
      chosen_idea: ideas[1].idea_id,
    });

    expect(lifecycles[1].status).toBe("selected");
    expect(lifecycles[1].isChosen).toBe(true);
  });

  it("marks the tested idea as running, reviewed, or decided", () => {
    const ideas = ensureProductIdeaIds([{ idea_description: "Desk shelf" }]);

    expect(getProductIdeaLifecycles({
      product_ideas: JSON.stringify(ideas),
      test_idea: ideas[0].idea_id,
      result: "Still running",
    })[0].status).toBe("test_running");

    expect(getProductIdeaLifecycles({
      product_ideas: JSON.stringify(ideas),
      test_idea: ideas[0].idea_id,
      result: "Interest but no sale",
    })[0].status).toBe("test_reviewed");

    expect(getProductIdeaLifecycles({
      product_ideas: JSON.stringify(ideas),
      test_idea: ideas[0].idea_id,
      decision: "Iterate and retest: adjust listing or price",
    })[0].status).toBe("retest");
  });

  it("supports legacy selected labels", () => {
    const ideas = ensureProductIdeaIds([{ idea_description: "Desk shelf" }]);
    const [lifecycle] = getProductIdeaLifecycles({
      product_ideas: JSON.stringify(ideas),
      chosen_idea: "Desk shelf",
    });

    expect(lifecycle.status).toBe("selected");
  });

  it("builds an ordered idea timeline", () => {
    const ideas = ensureProductIdeaIds([{ idea_description: "Desk shelf", demand_evidence: "Search demand" }]);
    const [lifecycle] = getProductIdeaLifecycles({
      product_ideas: JSON.stringify(ideas),
      idea_economics: JSON.stringify([{ idea_id: ideas[0].idea_id, viable: "Yes: proceed" }]),
      chosen_idea: ideas[0].idea_id,
      test_idea: ideas[0].idea_id,
      test_marketplace: "Etsy",
      result: "Sold: strong demand",
      units_sold: "3",
      decision: "Proceed: build the store",
    });

    expect(lifecycle.timeline.map((event) => event.key)).toEqual([
      "captured",
      "economics",
      "selected",
      "test-planned",
      "test-result",
      "test-decision",
    ]);
    expect(lifecycle.timeline[4].detail).toContain("Units sold: 3");
  });

  it("adds metric entries to the idea timeline when they are linked by idea ID", () => {
    const ideas = ensureProductIdeaIds([{ idea_description: "Desk shelf" }]);
    const [lifecycle] = getProductIdeaLifecycles(
      {
        product_ideas: JSON.stringify(ideas),
      },
      [
        {
          id: "metric-1",
          week_ending: "2026-05-03",
          data_json: {
            entry_type: "validation",
            product_idea_id: ideas[0].idea_id,
            impressions: "100",
            listing_clicks: "8",
            orders: "1",
          },
        },
      ],
    );

    expect(lifecycle.metricEntries).toHaveLength(1);
    expect(lifecycle.timeline.at(-1)?.key).toBe("metric-metric-1");
    expect(lifecycle.timeline.at(-1)?.detail).toContain("100 impressions");
  });

  it("adds idea notes to the idea timeline when linked by idea ID", () => {
    const ideas = ensureProductIdeaIds([{ idea_description: "Desk shelf" }]);
    const [lifecycle] = getProductIdeaLifecycles({
      product_ideas: JSON.stringify(ideas),
      product_idea_notes: JSON.stringify([
        {
          note_id: "note-1",
          idea_id: ideas[0].idea_id,
          created_at: "2026-05-06",
          note: "Supplier confirmed lower MOQ after follow-up.",
        },
      ]),
    });

    expect(lifecycle.notes).toHaveLength(1);
    expect(lifecycle.timeline.at(-1)?.key).toBe("note-note-1");
    expect(lifecycle.timeline.at(-1)?.detail).toContain("Supplier confirmed lower MOQ");
  });

  it("derives a next action from the idea status", () => {
    const ideas = ensureProductIdeaIds([{ idea_description: "Desk shelf" }]);

    expect(getProductIdeaLifecycles({
      product_ideas: JSON.stringify(ideas),
    })[0].nextAction).toEqual({
      label: "Add economics",
      href: "/chapter/know-your-numbers/steps?step=chapter-5-step-4-score-with-real-numbers",
      note: "Check margin, costs, and first-test risk before committing.",
    });

    expect(getProductIdeaLifecycles({
      product_ideas: JSON.stringify(ideas),
      test_idea: ideas[0].idea_id,
      decision: "Proceed: build the store",
    })[0].nextAction.href).toBe("/chapter/pick-your-customer/steps?step=chapter-7-step-2-define-niche-customer");
  });
});
