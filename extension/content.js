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
  const title = text("#productTitle");
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
    // TODO: POST to Calm Commerce API
    console.log("[Scout] Add to board:", scraped);
    sendResponse({ ok: true });
    return true;
  }
});
