import { describe, expect, it } from "vitest";
import { buildScannerImportDraft, normalizeScannerImportPayload } from "../scanner-import";

describe("scanner import economics mapping", () => {
  it("treats AliExpress observed price as estimated product cost, not selling price", () => {
    const payload = normalizeScannerImportPayload({
      source: "scanner",
      sourcePlatform: "aliexpress",
      sourceUrl: "https://www.aliexpress.com/item/example.html",
      productTitle: "AliExpress test product",
      observedPrice: "£10.00",
      observedPriceType: "supplier_cost",
    });

    const draft = buildScannerImportDraft(payload);

    expect(draft.productCost).toBe("£10.00");
    expect(draft.sellingPrice).toBe("");
  });

  it("keeps Amazon observed price out of product cost and selling price", () => {
    const payload = normalizeScannerImportPayload({
      source: "scanner",
      sourcePlatform: "amazon",
      sourceUrl: "https://www.amazon.co.uk/dp/example",
      productTitle: "Amazon test product",
      observedPrice: "£20.00",
      observedPriceType: "retail_price",
    });

    const draft = buildScannerImportDraft(payload);

    expect(draft.productCost).toBe("");
    expect(draft.sellingPrice).toBe("");
    expect(draft.demandEvidence).toContain("Observed retail price: £20.00");
  });
});
