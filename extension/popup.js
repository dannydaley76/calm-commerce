/**
 * Scout popup — orchestrates UI state and communicates with the
 * content script running on the active marketplace tab.
 */

/* ── State machine ── */

const STATES = ["idle", "loading", "product", "error"];
const CALM_COMMERCE_URL = "https://www.calmcommerce.net";

function showState(name) {
  STATES.forEach((s) => {
    document.getElementById(`state-${s}`)?.classList.toggle("hidden", s !== name);
  });
}

/* ── Product rendering ── */

function ratingClass(value, thresholds) {
  if (value === null || value === undefined) return "";
  if (value >= thresholds.good) return "good";
  if (value >= thresholds.warn) return "warn";
  return "poor";
}

function renderProduct(data) {
  document.getElementById("product-title").textContent = data.title ?? "Unknown product";
  document.getElementById("product-meta").textContent =
    [data.platform, data.price].filter(Boolean).join(" · ") || "—";

  // Score cards
  const demand = document.getElementById("score-demand");
  const competition = document.getElementById("score-competition");
  const margin = document.getElementById("score-margin");

  demand.querySelector(".score-value").textContent =
    data.demandScore !== null ? `${data.demandScore}` : "—";
  demand.className = `score-card ${ratingClass(data.demandScore, { good: 7, warn: 4 })}`;

  competition.querySelector(".score-value").textContent =
    data.competitionScore !== null ? `${data.competitionScore}` : "—";
  // Invert: lower competition = better
  competition.className = `score-card ${ratingClass(
    data.competitionScore !== null ? 10 - data.competitionScore : null,
    { good: 6, warn: 3 }
  )}`;

  margin.querySelector(".score-value").textContent =
    data.marginEstimate !== null ? `${data.marginEstimate}%` : "—";
  margin.className = `score-card ${ratingClass(data.marginEstimate, { good: 30, warn: 15 })}`;

  // Signals
  const list = document.getElementById("signals-list");
  list.innerHTML = "";
  (data.signals ?? []).slice(0, 4).forEach(({ text, tone }) => {
    const el = document.createElement("div");
    el.className = "signal";
    el.innerHTML = `<span class="signal-dot ${tone ?? "neutral"}"></span><span>${text}</span>`;
    list.appendChild(el);
  });

  showState("product");
}

/* ── Messaging ── */

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function requestAnalysis(tabId) {
  showState("loading");
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: "SCOUT_ANALYSE" });
    if (response?.ok) {
      renderProduct(response.data);
    } else {
      showState("idle");
    }
  } catch {
    // Content script not injected on this page = idle, not an error
    showState("idle");
  }
}

/* ── Board ── */

async function addToBoard(tabId) {
  const btn = document.getElementById("btn-add-board");
  btn.disabled = true;
  btn.textContent = "Opening…";
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: "SCOUT_ADD_TO_BOARD",
      appBaseUrl: CALM_COMMERCE_URL,
    });
    if (!response?.ok || !response.importUrl) {
      throw new Error("Unable to create import link");
    }
    await chrome.tabs.create({ url: response.importUrl });
    btn.textContent = "Opened ✓";
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = "Save to Workspace →";
    }, 2000);
  } catch {
    btn.disabled = false;
    btn.textContent = "Save to Workspace →";
  }
}

/* ── Init ── */

document.addEventListener("DOMContentLoaded", async () => {
  const tab = await getActiveTab();

  if (tab?.id) {
    await requestAnalysis(tab.id);
  } else {
    showState("idle");
  }

  document.getElementById("btn-add-board")?.addEventListener("click", () => {
    if (tab?.id) addToBoard(tab.id);
  });

  document.getElementById("btn-analyse")?.addEventListener("click", () => {
    if (tab?.id) requestAnalysis(tab.id);
  });

  document.getElementById("btn-retry")?.addEventListener("click", () => {
    if (tab?.id) requestAnalysis(tab.id);
  });

  document.getElementById("btn-settings")?.addEventListener("click", () => {
    chrome.runtime.openOptionsPage?.();
  });

  document.getElementById("btn-board")?.addEventListener("click", () => {
    chrome.tabs.create({ url: `${CALM_COMMERCE_URL}/ideas` });
  });
});
