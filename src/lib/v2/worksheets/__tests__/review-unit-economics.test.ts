import { describe, expect, it } from "vitest";
import { calculateUnitEconomics, reviewUnitEconomicsIdeas } from "../review-unit-economics";

describe("reviewUnitEconomicsIdeas", () => {
  it("favours a low-risk simple idea over a higher-margin complex idea", () => {
    const reviews = reviewUnitEconomicsIdeas([
      {
        idea_name: "High margin chaos",
        selling_price: "£50",
        product_cost: "£10",
        shipping_to_customer: "£5",
        platform_fees: "10%",
        variant_complexity: "16+ SKUs: very complex",
        upfront_cost_risk: "High: meaningful stock order needed",
        test_speed: "Slow: needs production, customisation, or more setup",
        numbers_confidence: "High: real quotes and known fees",
        viable: "Yes: proceed",
      },
      {
        idea_name: "Calm first test",
        selling_price: "£30",
        product_cost: "£10",
        shipping_to_customer: "£4",
        platform_fees: "10%",
        variant_complexity: "1 SKU: simple",
        upfront_cost_risk: "Low: can test without buying much stock",
        test_speed: "Fast: can list this week",
        numbers_confidence: "High: real quotes and known fees",
        viable: "Yes: proceed",
      },
    ]);

    expect(reviews[0].ideaName).toBe("Calm first test");
    expect(reviews[0].label).toBe("Strongest first test");
  });

  it("flags missing costs as needing better numbers", () => {
    const [review] = reviewUnitEconomicsIdeas([
      {
        idea_name: "Guessy idea",
        selling_price: "£25",
        variant_complexity: "1 SKU: simple",
        upfront_cost_risk: "Unknown: need supplier numbers",
        test_speed: "Fast: can list this week",
        numbers_confidence: "Unknown: missing key costs",
      },
    ]);

    expect(review.label).toBe("Needs better numbers");
    expect(review.cautions.join(" ")).toContain("missing");
  });

  it("flags very thin margins", () => {
    const [review] = reviewUnitEconomicsIdeas([
      {
        idea_name: "Thin margin idea",
        selling_price: "£20",
        product_cost: "£14",
        shipping_to_customer: "£4",
        platform_fees: "10%",
        variant_complexity: "1 SKU: simple",
        upfront_cost_risk: "Low: can test without buying much stock",
        test_speed: "Fast: can list this week",
        numbers_confidence: "High: real quotes and known fees",
      },
    ]);

    expect(review.label).toBe("Margin too thin");
  });

  it("adds a caution for high SKU complexity", () => {
    const [review] = reviewUnitEconomicsIdeas([
      {
        idea_name: "Many variants",
        selling_price: "£40",
        product_cost: "£8",
        shipping_to_customer: "£4",
        platform_fees: "10%",
        variant_complexity: "16+ SKUs: very complex",
        upfront_cost_risk: "Low: can test without buying much stock",
        test_speed: "Fast: can list this week",
        numbers_confidence: "High: real quotes and known fees",
      },
    ]);

    expect(review.label).toBe("Operationally complex");
    expect(review.cautions.join(" ")).toContain("variants");
  });

  it("calculates margin per unit from the raw inputs", () => {
    const economics = calculateUnitEconomics({
      selling_price: "£30",
      product_cost: "£10",
      shipping_to_customer: "£4",
      platform_fees: "10%",
    });

    expect(economics.margin).toBe(13);
    expect(economics.marginPercent).toBeCloseTo(43.33, 2);
  });

  it("calculates structured percentage and fixed fee rows", () => {
    const economics = calculateUnitEconomics({
      selling_price: "£20",
      product_cost: "£10",
      shipping_to_customer: "£2",
      platform_fees: JSON.stringify([
        { id: "fee_1", name: "Stripe", type: "percent", value: "2.9" },
        { id: "fee_2", name: "Payment fixed", type: "fixed", value: "0.20" },
      ]),
    });

    expect(economics.margin).toBeCloseTo(7.22, 2);
    expect(economics.marginPercent).toBeCloseTo(36.1, 1);
  });

  it("requires raw costs rather than accepting a manual margin", () => {
    const [review] = reviewUnitEconomicsIdeas([
      {
        idea_name: "Manual margin",
        selling_price: "£25",
        margin_per_unit: "£11",
        variant_complexity: "1 SKU: simple",
        upfront_cost_risk: "Low: can test without buying much stock",
        test_speed: "Fast: can list this week",
        numbers_confidence: "High: real quotes and known fees",
        viable: "Yes: proceed",
      },
    ]);

    expect(review.label).toBe("Needs better numbers");
  });
});
