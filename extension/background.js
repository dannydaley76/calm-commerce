/**
 * Scout service worker — handles extension lifecycle and cross-tab messaging.
 * Manifest V3 requires a service worker rather than a persistent background page.
 */

/* ── Install / update ── */

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    // Open onboarding on first install
    chrome.tabs.create({ url: "https://app.calmcommerce.co" });
  }
});

/* ── Icon badge: show when on a supported marketplace ── */

const SUPPORTED_PATTERNS = [
  /etsy\.com/,
  /ebay\.(co\.uk|com)/,
  /amazon\.(co\.uk|com)/,
  /vinted\.co\.uk/,
  /depop\.com/,
];

function isSupportedUrl(url) {
  return SUPPORTED_PATTERNS.some((p) => p.test(url));
}

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  updateBadge(tabId, tab?.url ?? "");
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    updateBadge(tabId, tab.url ?? "");
  }
});

function updateBadge(tabId, url) {
  if (isSupportedUrl(url)) {
    chrome.action.setBadgeText({ text: "✦", tabId });
    chrome.action.setBadgeBackgroundColor({ color: "#0D9488", tabId });
  } else {
    chrome.action.setBadgeText({ text: "", tabId });
  }
}
