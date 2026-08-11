import {
  ScenarioError,
  aggregateDemand,
  clonePreset,
  decodeScenario,
  encodeScenario,
  evaluateMarket,
  validateScenario
} from "./model.js";

const STORAGE_KEY = "common-cart.scenario.v1";
const elements = {
  title: document.querySelector("#scenario-title"),
  currency: document.querySelector("#currency"),
  status: document.querySelector("#status"),
  buyerRows: document.querySelector("#buyer-rows"),
  offerRows: document.querySelector("#offer-rows"),
  buyerTemplate: document.querySelector("#buyer-row-template"),
  offerTemplate: document.querySelector("#offer-row-template"),
  resultRows: document.querySelector("#result-rows"),
  demandGroups: document.querySelector("#demand-groups"),
  chart: document.querySelector("#offer-chart"),
  winner: document.querySelector("#metric-winner"),
  winnerNote: document.querySelector("#metric-winner-note"),
  units: document.querySelector("#metric-units"),
  buyers: document.querySelector("#metric-buyers"),
  fulfilled: document.querySelector("#metric-fulfilled"),
  delivered: document.querySelector("#metric-delivered"),
  savings: document.querySelector("#metric-savings"),
  importFile: document.querySelector("#import-file")
};

let scenario = loadInitialScenario();
let saveTimer;
renderEditor();
refresh();
bindStaticEvents();

function loadInitialScenario() {
  const hashValue = window.location.hash.startsWith("#scenario=") ? window.location.hash.slice(10) : "";
  if (hashValue) {
    try {
      return decodeScenario(hashValue);
    } catch (error) {
      queueMicrotask(() => setStatus(messageOf(error)));
    }
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? validateScenario(JSON.parse(stored)) : clonePreset();
  } catch {
    return clonePreset();
  }
}

function bindStaticEvents() {
  elements.title.addEventListener("input", (event) => updateRoot("title", event.target.value));
  elements.currency.addEventListener("input", (event) => updateRoot("currency", event.target.value.toUpperCase()));

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      scenario = clonePreset(button.dataset.preset);
      document.querySelectorAll("[data-preset]").forEach((entry) => entry.classList.toggle("active", entry === button));
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      renderEditor();
      refresh();
      setStatus(`${button.textContent} example loaded.`, true);
    });
  });

  document.querySelector("#add-buyer").addEventListener("click", () => {
    const next = nextId(scenario.buyers, "B");
    scenario.buyers.push({
      id: next,
      label: `Buyer ${scenario.buyers.length + 1}`,
      category: scenario.buyers[0]?.category ?? "Product",
      quantity: 1,
      maxUnitPrice: 100,
      latestDeliveryDays: 7,
      allowedVariants: [scenario.offers[0]?.variant ?? "Standard"]
    });
    renderEditor();
    refresh();
    elements.buyerRows.lastElementChild?.querySelector("input")?.focus();
  });

  document.querySelector("#add-offer").addEventListener("click", () => {
    const next = nextId(scenario.offers, "O");
    scenario.offers.push({
      id: next,
      merchant: `Merchant ${scenario.offers.length + 1}`,
      category: scenario.buyers[0]?.category ?? "Product",
      variant: scenario.buyers[0]?.allowedVariants[0] ?? "Standard",
      unitPrice: 80,
      minimumUnits: 5,
      deliveryDays: 7,
      capacity: 20,
      shippingPerBuyer: 0
    });
    renderEditor();
    refresh();
    elements.offerRows.lastElementChild?.querySelector("input")?.focus();
  });

  document.querySelector("#import-button").addEventListener("click", () => elements.importFile.click());
  elements.importFile.addEventListener("change", importScenario);
  document.querySelector("#export-button").addEventListener("click", exportScenario);
  const shareButton = document.querySelector("#share-button");
  if (window.location.protocol === "file:") {
    shareButton.textContent = "Share via export";
    shareButton.addEventListener("click", () => setStatus("Use Export JSON to share a standalone scenario."));
  } else {
    shareButton.addEventListener("click", shareScenario);
  }
  document.querySelector("#reset-button").addEventListener("click", () => {
    scenario = clonePreset();
    localStorage.removeItem(STORAGE_KEY);
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    document.querySelectorAll("[data-preset]").forEach((entry) => entry.classList.toggle("active", entry.dataset.preset === "neighbourhood"));
    renderEditor();
    refresh();
    setStatus("The local room was reset.", true);
  });

  const tabs = [...document.querySelectorAll('[role="tab"]')];
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateTab(tab));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const targetIndex = event.key === "Home" ? 0
        : event.key === "End" ? tabs.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      activateTab(tabs[targetIndex]);
      tabs[targetIndex].focus();
    });
  });

  window.addEventListener("resize", () => {
    try { drawChart(evaluateMarket(scenario)); } catch { /* Invalid edits already have a visible message. */ }
  });
}

function activateTab(active) {
  document.querySelectorAll('[role="tab"]').forEach((tab) => {
    const selected = tab === active;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    document.querySelector(`#${tab.getAttribute("aria-controls")}`).hidden = !selected;
  });
  if (active.id === "buyer-tab") requestAnimationFrame(() => {
    try { drawChart(evaluateMarket(scenario)); } catch { /* Invalid edits already have a visible message. */ }
  });
}

function renderEditor() {
  elements.title.value = scenario.title;
  elements.currency.value = scenario.currency;
  elements.buyerRows.replaceChildren(...scenario.buyers.map(renderBuyerRow));
  elements.offerRows.replaceChildren(...scenario.offers.map(renderOfferRow));
}

function renderBuyerRow(entry) {
  const row = elements.buyerTemplate.content.firstElementChild.cloneNode(true);
  row.dataset.id = entry.id;
  row.querySelectorAll("[data-field]").forEach((input) => {
    const field = input.dataset.field;
    input.value = field === "allowedVariants" ? entry[field].join(", ") : entry[field];
    input.addEventListener("input", () => {
      const target = scenario.buyers.find((buyer) => buyer.id === row.dataset.id);
      target[field] = field === "allowedVariants"
        ? input.value.split(",").map((value) => value.trim()).filter(Boolean)
        : numericField(field) ? Number(input.value) : input.value;
      refresh();
    });
  });
  row.querySelector(".remove-row").addEventListener("click", () => {
    if (scenario.buyers.length === 1) return setStatus("A room needs at least one buyer.");
    scenario.buyers = scenario.buyers.filter(({ id }) => id !== row.dataset.id);
    renderEditor();
    refresh();
  });
  return row;
}

function renderOfferRow(entry) {
  const row = elements.offerTemplate.content.firstElementChild.cloneNode(true);
  row.dataset.id = entry.id;
  row.querySelectorAll("[data-field]").forEach((input) => {
    const field = input.dataset.field;
    input.value = entry[field];
    input.addEventListener("input", () => {
      const target = scenario.offers.find((offer) => offer.id === row.dataset.id);
      target[field] = numericField(field) ? Number(input.value) : input.value;
      refresh();
    });
  });
  row.querySelector(".remove-row").addEventListener("click", () => {
    if (scenario.offers.length === 1) return setStatus("A room needs at least one offer.");
    scenario.offers = scenario.offers.filter(({ id }) => id !== row.dataset.id);
    renderEditor();
    refresh();
  });
  return row;
}

function numericField(field) {
  return new Set([
    "quantity", "maxUnitPrice", "latestDeliveryDays", "unitPrice", "minimumUnits",
    "deliveryDays", "capacity", "shippingPerBuyer"
  ]).has(field);
}

function updateRoot(field, value) {
  scenario[field] = value;
  refresh();
}

function refresh() {
  try {
    const market = evaluateMarket(scenario);
    scenario = market.scenario;
    renderSummary(market);
    renderResults(market);
    renderDemand(market.scenario);
    drawChart(market);
    scheduleSave(market.scenario);
    setStatus("");
  } catch (error) {
    setStatus(messageOf(error));
  }
}

function renderSummary(market) {
  const winner = market.winner;
  const formatter = money(market.scenario.currency);
  elements.units.textContent = String(market.totalRequestedUnits);
  elements.buyers.textContent = `${market.buyerCount} ${market.buyerCount === 1 ? "buyer" : "buyers"}`;
  elements.winner.textContent = winner ? `${winner.offer.merchant} / ${winner.offer.variant}` : "Not unlocked";
  elements.winnerNote.textContent = winner
    ? `${winner.fulfilledUnits} units at ${formatter.format(winner.averageLandedUnitCost)} landed per unit`
    : "No bid reaches its minimum with compatible whole orders.";
  elements.fulfilled.textContent = winner ? percent(winner.fulfillmentRate) : "0%";
  elements.delivered.textContent = winner ? `${winner.deliveredBuyers} buyers included` : "0 buyers included";
  elements.savings.textContent = formatter.format(winner?.savings ?? 0);
}

function renderResults(market) {
  const formatter = money(market.scenario.currency);
  const rows = market.ranked.map((result) => {
    const row = document.createElement("tr");
    addCell(row, `${result.offer.merchant} / ${result.offer.variant}`);
    addCell(row, result.qualifies ? "Unlocked" : `${result.unitsShort} short`, result.qualifies ? "status-pass" : "status-short");
    addCell(row, String(result.fulfilledUnits));
    addCell(row, result.averageLandedUnitCost === null ? "Not available" : formatter.format(result.averageLandedUnitCost));
    addCell(row, formatter.format(result.savings));
    return row;
  });
  elements.resultRows.replaceChildren(...rows);
}

function renderDemand(rawScenario) {
  const groups = aggregateDemand(rawScenario);
  const formatter = money(rawScenario.currency);
  const cards = groups.map((group) => {
    const card = document.createElement("article");
    card.className = "demand-card";
    const title = document.createElement("strong");
    title.textContent = group.category;
    const variants = document.createElement("p");
    variants.textContent = `Accepted variants: ${group.variants.join(", ")}`;
    const list = document.createElement("dl");
    appendDetail(list, "Buyers", group.buyerCount);
    appendDetail(list, "Units", group.units);
    appendDetail(list, "Ceiling range", `${formatter.format(group.priceFloor)} to ${formatter.format(group.priceCeiling)}`);
    appendDetail(list, "Delivery range", `${group.earliestDelivery} to ${group.latestDelivery} days`);
    card.append(title, variants, list);
    return card;
  });
  elements.demandGroups.replaceChildren(...cards);
}

function addCell(row, text, className = "") {
  const cell = document.createElement("td");
  cell.textContent = text;
  if (className) cell.className = className;
  row.append(cell);
}

function appendDetail(list, term, value) {
  const wrapper = document.createElement("div");
  const dt = document.createElement("dt");
  const dd = document.createElement("dd");
  dt.textContent = term;
  dd.textContent = String(value);
  wrapper.append(dt, dd);
  list.append(wrapper);
}

function drawChart(market) {
  const canvas = elements.chart;
  const bounds = canvas.getBoundingClientRect();
  if (bounds.width === 0) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(bounds.width * ratio);
  canvas.height = Math.floor(280 * ratio);
  const context = canvas.getContext("2d");
  context.scale(ratio, ratio);
  const width = bounds.width;
  const height = 280;
  context.clearRect(0, 0, width, height);
  context.font = "12px system-ui";
  context.textBaseline = "middle";
  const left = Math.min(150, Math.max(95, width * 0.28));
  const right = 42;
  const top = 20;
  const rowHeight = Math.min(62, (height - 40) / Math.max(1, market.results.length));
  const max = Math.max(1, ...market.results.map((result) => Math.max(result.fulfilledUnits, result.offer.minimumUnits)));

  market.results.forEach((result, index) => {
    const y = top + index * rowHeight;
    context.fillStyle = "#d8d0c3";
    context.fillRect(left, y + 14, width - left - right, 20);
    const candidateWidth = (result.fulfilledUnits / max) * (width - left - right);
    context.fillStyle = result.qualifies ? "#f36f3d" : "#a9a090";
    context.fillRect(left, y + 14, candidateWidth, 20);
    const minimumX = left + (result.offer.minimumUnits / max) * (width - left - right);
    context.strokeStyle = "#211f55";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(minimumX, y + 9);
    context.lineTo(minimumX, y + 39);
    context.stroke();
    context.fillStyle = "#17162b";
    context.textAlign = "right";
    context.fillText(trimLabel(result.offer.merchant, 18), left - 10, y + 24);
    context.textAlign = "left";
    context.fillText(`${result.fulfilledUnits} fulfilled / ${result.offer.minimumUnits} minimum`, left, y + 49);
  });
}

function trimLabel(value, limit) {
  return value.length <= limit ? value : `${value.slice(0, limit - 1)}…`;
}

function scheduleSave(cleanScenario) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanScenario)); } catch { setStatus("This browser could not autosave the room."); }
  }, 180);
}

async function importScenario(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (file.size > 250_000) return setStatus("Import files must be smaller than 250 KB.");
  try {
    scenario = validateScenario(JSON.parse(await file.text()));
    renderEditor();
    refresh();
    setStatus("Scenario imported.", true);
  } catch (error) {
    setStatus(`Import failed: ${messageOf(error)}`);
  }
}

function exportScenario() {
  try {
    const clean = validateScenario(scenario);
    const blob = new Blob([`${JSON.stringify(clean, null, 2)}\n`], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "common-cart-scenario.json";
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus("Scenario exported.", true);
  } catch (error) {
    setStatus(messageOf(error));
  }
}

async function shareScenario() {
  try {
    const encoded = encodeScenario(scenario);
    const url = new URL(window.location.href);
    url.hash = `scenario=${encoded}`;
    window.history.replaceState(null, "", url);
    await navigator.clipboard.writeText(url.href);
    setStatus("Share link copied. It contains this scenario's data.", true);
  } catch (error) {
    setStatus(error?.name === "NotAllowedError" ? "The share link is in the address bar, but clipboard access was denied." : messageOf(error));
  }
}

function nextId(entries, prefix) {
  let number = entries.length + 1;
  while (entries.some(({ id }) => id === `${prefix}${String(number).padStart(2, "0")}`)) number += 1;
  return `${prefix}${String(number).padStart(2, "0")}`;
}

function money(currency) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 });
  } catch {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
  }
}

function percent(value) {
  return new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 0 }).format(value);
}

function setStatus(message, success = false) {
  elements.status.textContent = message;
  elements.status.classList.toggle("success", success);
}

function messageOf(error) {
  return error instanceof ScenarioError || error instanceof Error ? error.message : "The scenario is invalid.";
}
