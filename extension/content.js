/**
 * Scout content script — runs on supported marketplace pages.
 * Scrapes the active product listing and returns structured data
 * to the popup when requested.
 */

/* ── Platform detection ── */

function detectPlatform() {
  const host = location.hostname;
  if (host.includes("etsy.com"))   return "etsy";
  if (host.includes("ebay.co.uk") || host.includes("ebay.com")) return "ebay";
  if (host.includes("amazon.co.uk") || host.includes("amazon.com")) return "amazon";
  if (host.includes("aliexpress.com")) return "aliexpress";
  if (host.includes("vinted.co.uk")) return "vinted";
  if (host.includes("depop.com"))    return "depop";
  return null;
}

/* ── Scrapers ── */

function text(selector, root = document) {
  return root.querySelector(selector)?.textContent?.trim() ?? null;
}

function attr(selector, attribute, root = document) {
  return root.querySelector(selector)?.getAttribute(attribute) ?? null;
}

function productImage() {
  return (
    attr("meta[property='og:image']", "content") ||
    attr("meta[name='twitter:image']", "content") ||
    attr("img[data-old-hires]", "data-old-hires") ||
    attr("#landingImage", "src") ||
    attr("img", "src")
  );
}

function pageTitleFallback() {
  return attr("meta[property='og:title']", "content") ?? document.title.replace(/\s+[|-].*$/, "").trim();
}

function scrapeEtsy() {
  const title = text("h1[data-buy-box-listing-title]") ?? text("h1");
  const price = text("[data-buy-box-region] .currency-value")
    ?? text(".wt-text-title-largest");
  const reviews = text("[data-reviews-summary-and-count] a");
  const sales = text("[data-listing-shop-info] a");

  return {
    platform: "Etsy",
    title,
    price,
    signals: [
      reviews  ? { text: `${reviews} reviews`, tone: "green" }  : null,
      sales    ? { text: `${sales} from this shop`, tone: "neutral" } : null,
    ].filter(Boolean),
  };
}

function scrapeEbay() {
  const title = text("#itemTitle") ?? text(".x-item-title__mainTitle");
  const price = text("#prcIsum") ?? text(".x-price-primary .ux-textspans");
  const sold  = text(".vi-qtyS-hot-red") ?? text("[data-testid='QUANTITY_SOLD']");

  return {
    platform: "eBay",
    title,
    price,
    signals: [
      sold ? { text: `${sold} sold`, tone: "green" } : null,
    ].filter(Boolean),
  };
}

function scrapeAmazon() {
  const title = text("#productTitle") ?? pageTitleFallback();
  const price = text(".a-price .a-offscreen") ?? text("#priceblock_ourprice");
  const rating = attr("#acrPopover", "title");
  const ratingCount = text("#acrCustomerReviewText");
  const bsr   = text("#SalesRank") ?? text("[data-csa-c-slot-id='dp-bsr-rank'] .a-list-item");

  return {
    platform: "Amazon",
    title,
    price,
    signals: [
      rating       ? { text: rating, tone: "neutral" } : null,
      ratingCount  ? { text: ratingCount, tone: "neutral" } : null,
      bsr          ? { text: `BSR: ${bsr.replace(/\n/g, " ").slice(0, 60)}`, tone: "neutral" } : null,
    ].filter(Boolean),
  };
}

function scrapeAliExpress() {
  const title = text("h1[data-pl='product-title']")
    ?? text("h1")
    ?? pageTitleFallback();
  const price = text("[class*='product-price']")
    ?? text("[class*='price--current']")
    ?? text("[class*='snow-price']")
    ?? text("meta[property='product:price:amount']");
  const rating = text("[class*='reviewer--box'] strong")
    ?? text("[class*='rating']")
    ?? attr("meta[itemprop='ratingValue']", "content");
  const orders = text("[class*='orders']")
    ?? text("[class*='sold']");

  return {
    platform: "AliExpress",
    title,
    price,
    signals: [
      rating ? { text: `Rating: ${rating}`, tone: "neutral" } : null,
      orders ? { text: orders, tone: "green" } : null,
    ].filter(Boolean),
  };
}

function scrapeVinted() {
  const title = text("[data-testid='item-page-summary-plugin'] h1")
    ?? text(".ItemPage_title__1uU5I");
  const price = text("[data-testid='item-price']");

  return { platform: "Vinted", title, price, signals: [] };
}

function scrapeDepop() {
  const title = text("[class*='ProductDetailsSticky_title']")
    ?? text("h1");
  const price = text("[class*='ProductDetailsSticky_price']");
  const likes = text("[data-testid='product-likes-count']");

  return {
    platform: "Depop",
    title,
    price,
    signals: [
      likes ? { text: `${likes} likes`, tone: likes > 10 ? "green" : "neutral" } : null,
    ].filter(Boolean),
  };
}

function scrapeCurrentPage() {
  const platform = detectPlatform();
  switch (platform) {
    case "etsy":   return scrapeEtsy();
    case "ebay":   return scrapeEbay();
    case "amazon": return scrapeAmazon();
    case "aliexpress": return scrapeAliExpress();
    case "vinted": return scrapeVinted();
    case "depop":  return scrapeDepop();
    default:       return null;
  }
}

/* ── Scoring ── (placeholder — replace with real AI scoring) ── */

function scoreProduct(scraped) {
  // TODO: call Scout AI scoring API
  return {
    demandScore:      null,
    competitionScore: null,
    marginEstimate:   null,
  };
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function platformForPayload(platform) {
  const normalized = (platform ?? "").toLowerCase();
  if (normalized === "amazon") return "amazon";
  if (normalized === "aliexpress") return "aliexpress";
  return "other";
}

function evidenceFromSignals(signals) {
  return (signals ?? []).map((signal) => signal.text).filter(Boolean).join("\n");
}

function base64UrlEncodeJson(value) {
  const json = JSON.stringify(value);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function buildImportPayload(scraped) {
  const scores = scoreProduct(scraped);
  return {
    source: "scanner",
    sourcePlatform: platformForPayload(scraped.platform),
    sourceUrl: location.href,
    scannedAt: todayISO(),
    productTitle: scraped.title,
    displayTitle: scraped.title,
    productImageUrl: productImage() ?? "",
    observedPrice: scraped.price ?? "",
    demandScore: scores.demandScore ?? undefined,
    competitionScore: scores.competitionScore ?? undefined,
    opportunityScore: undefined,
    confidenceScore: 30,
    missingSignals: ["trend", "competition_density", "verified_margin"],
    demandEvidence: evidenceFromSignals(scraped.signals),
    competitionNotes: "Competition notes need a deeper Scout Pro scan.",
    seasonality: "",
    estimatedProductCost: platformForPayload(scraped.platform) === "aliexpress" ? scraped.price ?? "" : "",
    estimatedSellingPrice: platformForPayload(scraped.platform) === "amazon" ? scraped.price ?? "" : "",
    notes: `Captured from ${scraped.platform || "product page"} with Scout.`,
  };
}

/* ── Message listener ── */

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SCOUT_ANALYSE") {
    const scraped = scrapeCurrentPage();
    if (!scraped || !scraped.title) {
      sendResponse({ ok: false });
      return true;
    }
    const scores = scoreProduct(scraped);
    sendResponse({ ok: true, data: { ...scraped, ...scores } });
    return true;
  }

  if (message.type === "SCOUT_ADD_TO_BOARD") {
    const scraped = scrapeCurrentPage();
    if (!scraped || !scraped.title) {
      sendResponse({ ok: false });
      return true;
    }
    const appBaseUrl = message.appBaseUrl || "https://www.calmcommerce.net";
    const payload = base64UrlEncodeJson(buildImportPayload(scraped));
    sendResponse({
      ok: true,
      importUrl: `${appBaseUrl.replace(/\/$/, "")}/ideas/import?payload=${encodeURIComponent(payload)}`,
    });
    return true;
  }
});
