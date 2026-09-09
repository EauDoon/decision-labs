import {
  ScenarioError,
  aggregateDemand,
  deliveryHeatmap,
  variantOverlapMatrix,
  clonePreset,
  compareScenarios,
  compareThreeRooms,
  computeResidualCoverage,
  createScenarioHistory,
  createMerchantReport,
  createMerchantResidualReport,
  createBuyerCsv,
  createDeliveryHeatmapCsv,
  importBuyersFromCsv,
  buyerCsvTemplate,
  redactBuyerLabels,
  createOrganizerBriefing,
  decodeScenario,
  duplicateEntry,
  copyOfferAsNewTierSet,
  encodeScenario,
  encodeRedactedScenario,
  evaluateMarket,
  unitsToNextTier,
  capacityBar,
  groupExclusionReasons,
  validateWorkspace,
  validateScenario
} from "./model.js";

const STORAGE_KEY = "common-cart.scenario.v1";
const WORKSPACE_KEY = "common-cart.workspace.v1";
const COACH_KEY = "common-cart.coach.v1";
const elements = {
  title: document.querySelector("#scenario-title"),
  currency: document.querySelector("#currency"),
  status: document.querySelector("#status"),
  buyerRows: document.querySelector("#buyer-rows"),
  offerRows: document.querySelector("#offer-rows"),
  tierEditors: document.querySelector("#tier-editors"),
  tierRows: document.querySelector("#tier-progress-rows"),
  merchantResults: document.querySelector("#merchant-result-rows"),
  buyerTemplate: document.querySelector("#buyer-row-template"),
  offerTemplate: document.querySelector("#offer-row-template"),
  resultRows: document.querySelector("#result-rows"),
  inspector: document.querySelector("#offer-inspector"),
  inspectorRows: document.querySelector("#inspector-rows"),
  inspectorSummary: document.querySelector("#inspector-summary"),
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

let scenarioReadFailed = false;
let scenario = loadInitialScenario();
const history = createScenarioHistory(scenario);
let invalidDraft = false;
let workspaceReadFailed = false;
let savedRooms = loadWorkspace();
let baseline = null;
let savedState = "pending";
let inspectedOfferId = scenario.offers[0]?.id ?? "";
let screenshotMode = false;
let saveTimer;
renderEditor();
refresh();
bindStaticEvents();
renderWorkspace();
maybeShowCoach();

function loadWorkspace() {
  try {
    const raw = localStorage.getItem(WORKSPACE_KEY);
    if (!raw) return [];
    return validateWorkspace(JSON.parse(raw)).rooms;
  } catch (error) {
    workspaceReadFailed = true;
    queueMicrotask(() => setStatus(`Saved rooms could not be opened: ${messageOf(error)} Export your current room before closing.`));
    return [];
  }
}

function renderWorkspace() {
  const picker = document.querySelector("#saved-rooms");
  picker.replaceChildren(...savedRooms.map((room, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${index + 1}. ${room.title}`;
    return option;
  }));
  picker.disabled = savedRooms.length === 0;
  document.querySelector("#load-room").disabled = savedRooms.length === 0;
  document.querySelector("#delete-room").disabled = savedRooms.length === 0;
  document.querySelector("#save-room").disabled = workspaceReadFailed || savedRooms.length >= 12;
  for (const id of ["compare-room-a", "compare-room-b"]) {
    const select = document.querySelector(`#${id}`);
    if (!select) continue;
    select.replaceChildren(...savedRooms.map((room, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = `${index + 1}. ${room.title}`;
      return option;
    }));
    select.disabled = savedRooms.length < 2;
  }
  const selectB = document.querySelector("#compare-room-b");
  if (selectB && savedRooms.length > 1 && selectB.value === document.querySelector("#compare-room-a")?.value) {
    selectB.value = "1";
  }
  const compareThree = document.querySelector("#compare-three");
  if (compareThree) compareThree.disabled = savedRooms.length < 2;
}

function storeWorkspace(rooms) {
  const clean = validateWorkspace({ version: 1, rooms });
  localStorage.setItem(WORKSPACE_KEY, JSON.stringify(clean));
  savedRooms = clean.rooms;
  renderWorkspace();
}

function loadInitialScenario() {
  const hashValue = window.location.hash.startsWith("#scenario=") ? window.location.hash.slice(10) : "";
  let shareFailed = false;
  if (hashValue) {
    try {
      return decodeScenario(hashValue);
    } catch (error) {
      shareFailed = true;
      queueMicrotask(() => setStatus(`Share link could not be opened: ${messageOf(error)}`));
    }
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return clonePreset();
    let parsed;
    try {
      parsed = JSON.parse(stored);
    } catch (error) {
      throw new ScenarioError(`the saved JSON is not valid${appJsonSyntaxHint(error)}.`);
    }
    return validateScenario(parsed);
  } catch (error) {
    if (!shareFailed) {
      queueMicrotask(() => setStatus(`Saved room could not be restored: ${messageOf(error)} Starting from the neighbourhood example.`));
    }
    scenarioReadFailed = true;
    return clonePreset();
  }
}

function bindStaticEvents() {
  document.querySelector("#buyer-report").addEventListener("click", () => {
    try {
      downloadFile(createBuyerCsv(scenario, inspectedOfferId), "common-cart-private-buyer-report.csv", "text/csv;charset=utf-8");
      setStatus("Private buyer report exported for the inspected offer. It contains labels and individual allocations.", true);
    } catch (error) { setStatus(`Report failed: ${messageOf(error)}`); }
  });
  document.querySelector("#organizer-briefing").addEventListener("click", () => {
    try {
      downloadFile(createOrganizerBriefing(scenario), "common-cart-organizer-briefing.md", "text/markdown;charset=utf-8");
      setStatus("Organizer briefing exported. It uses aggregates only and omits private buyer rows.", true);
    } catch (error) { setStatus(`Briefing failed: ${messageOf(error)}`); }
  });
  document.querySelector("#merchant-report").addEventListener("click", () => {
    try {
      downloadFile(`${JSON.stringify(createMerchantReport(scenario), null, 2)}\n`, "common-cart-merchant-report.json", "application/json");
      setStatus("Aggregate merchant report exported. It omits buyer labels, budgets, IDs, and individual allocations.", true);
    } catch (error) { setStatus(`Report failed: ${messageOf(error)}`); }
  });
  document.querySelector("#merchant-residual-report").addEventListener("click", () => {
    try {
      downloadFile(`${JSON.stringify(createMerchantResidualReport(scenario), null, 2)}\n`, "common-cart-residual-coverage.json", "application/json");
      setStatus("Residual coverage exported as aggregates. Buyer IDs and labels are omitted. This is not a dual checkout.", true);
    } catch (error) { setStatus(`Report failed: ${messageOf(error)}`); }
  });
  document.querySelector("#heatmap-csv").addEventListener("click", () => {
    try {
      downloadFile(createDeliveryHeatmapCsv(scenario), "common-cart-delivery-heatmap.csv", "text/csv;charset=utf-8");
      setStatus("Delivery heatmap CSV exported. It contains aggregate deadline buckets only.", true);
    } catch (error) { setStatus(`Heatmap export failed: ${messageOf(error)}`); }
  });
  document.querySelector("#pin-baseline").addEventListener("click", () => {
    try { baseline = validateScenario(scenario); renderComparison(); setStatus("Baseline pinned for this session.", true); }
    catch (error) { setStatus(messageOf(error)); }
  });
  document.querySelector("#clear-baseline").addEventListener("click", () => {
    baseline = null; renderComparison();
  });
  document.querySelector("#compare-three").addEventListener("click", () => {
    try {
      const first = savedRooms[Number(document.querySelector("#compare-room-a").value)];
      const second = savedRooms[Number(document.querySelector("#compare-room-b").value)];
      if (!first || !second) return setStatus("Save at least two snapshots to compare three rooms.");
      const comparison = compareThreeRooms(scenario, first, second);
      renderThreeRoomComparison(comparison);
      setStatus("Compared the open room with two snapshots. Totals are not savings.", true);
    } catch (error) { setStatus(messageOf(error)); }
  });
  document.querySelector("#save-room").addEventListener("click", () => {
    try {
      storeWorkspace([...savedRooms, validateScenario(scenario)]);
      document.querySelector("#saved-rooms").value = String(savedRooms.length - 1);
      setStatus("Named snapshot saved locally. Later edits do not alter it.", true);
    } catch (error) { setStatus(`Could not save snapshot: ${messageOf(error)}`); }
  });
  document.querySelector("#load-room").addEventListener("click", () => {
    if (!allowReplaceDraft()) return;
    const room = savedRooms[Number(document.querySelector("#saved-rooms").value)];
    if (!room) return;
    scenario = validateScenario(room);
    renderEditor(); refresh();
    setStatus("Saved snapshot loaded. Undo returns to the previous valid room.", true);
  });
  document.querySelector("#delete-room").addEventListener("click", () => {
    const index = Number(document.querySelector("#saved-rooms").value);
    if (!savedRooms[index] || !window.confirm(`Delete saved snapshot "${savedRooms[index].title}"? The open room stays available.`)) return;
    try { storeWorkspace(savedRooms.filter((_, i) => i !== index)); setStatus("Saved snapshot deleted.", true); }
    catch (error) { setStatus(`Could not delete snapshot: ${messageOf(error)}`); }
  });
  document.querySelector("#show-coach").addEventListener("click", () => openCoach());
  const coachDialog = document.querySelector("#coach-dialog");
  coachDialog.addEventListener("close", () => {
    try { localStorage.setItem(COACH_KEY, "dismissed"); } catch { /* Coach memory is optional. */ }
  });
  coachDialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") coachDialog.close("dismiss");
  });
  document.querySelector("#undo-button").addEventListener("click", () => restoreHistory(false));
  document.querySelector("#redo-button").addEventListener("click", () => restoreHistory(true));
  elements.title.addEventListener("input", (event) => updateRoot("title", event.target.value));
  elements.currency.addEventListener("input", (event) => updateRoot("currency", event.target.value.toUpperCase()));
  elements.inspector.addEventListener("change", () => {
    inspectedOfferId = elements.inspector.value;
    try { renderInspector(evaluateMarket(scenario)); } catch { /* Invalid edits already have a visible message. */ }
  });

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!allowReplaceDraft()) return;
      scenario = clonePreset(button.dataset.preset);
      inspectedOfferId = scenario.offers[0]?.id ?? "";
      document.querySelectorAll("[data-preset]").forEach((entry) => entry.classList.toggle("active", entry === button));
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      renderEditor();
      refresh();
      setStatus(`${button.textContent} example loaded.`, true);
    });
  });

  document.querySelector("#add-buyer").addEventListener("click", () => {
    if (scenario.buyers.length >= 40) return setStatus("A room can have at most 40 buyers.");
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
    if (scenario.offers.length >= 40) return setStatus("A room can have at most 40 offers.");
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
      shippingPerBuyer: 0,
      fulfillment: "shipping"
    });
    inspectedOfferId = next;
    renderEditor();
    refresh();
    elements.offerRows.lastElementChild?.querySelector("input")?.focus();
  });

  document.querySelector("#import-button").addEventListener("click", () => elements.importFile.click());
  elements.importFile.addEventListener("change", importScenario);
  document.querySelector("#import-buyers").addEventListener("click", () => document.querySelector("#import-buyers-file").click());
  document.querySelector("#buyer-csv-template").addEventListener("click", () => {
    downloadFile(buyerCsvTemplate(), "common-cart-buyers-template.csv", "text/csv;charset=utf-8");
    setStatus("Buyer CSV template downloaded. Fill the header row, then import.", true);
  });
  document.querySelector("#import-buyers-file").addEventListener("change", importBuyersCsv);
  document.querySelector("#export-button").addEventListener("click", exportScenario);
  document.querySelector("#screenshot-mode").addEventListener("click", () => {
    screenshotMode = !screenshotMode;
    document.querySelector("#screenshot-mode").setAttribute("aria-pressed", String(screenshotMode));
    document.querySelector("#screenshot-mode").textContent = screenshotMode ? "Screenshot mode on" : "Screenshot mode";
    renderEditor();
    refresh();
    setStatus(screenshotMode
      ? "Screenshot mode replaces buyer labels in this view with Buyer 1, Buyer 2, and so on. The saved room is unchanged until you export redacted JSON."
      : "Screenshot mode off. Private labels are visible in the organizer view again.", true);
  });
  document.querySelector("#export-redacted").addEventListener("click", () => {
    try {
      const clean = redactBuyerLabels(scenario);
      downloadFile(`${JSON.stringify(clean, null, 2)}\n`, "common-cart-redacted.json", "application/json");
      setStatus("Redacted JSON exported. Buyer labels are Buyer 1 through N. IDs and constraints are unchanged.", true);
    } catch (error) {
      setStatus(`Redacted export failed: ${messageOf(error)}`);
    }
  });
  const shareButton = document.querySelector("#share-button");
  const shareRedactedButton = document.querySelector("#share-redacted-button");
  if (window.location.protocol === "file:") {
    shareButton.textContent = "Share via export";
    shareButton.addEventListener("click", () => setStatus("Use Export JSON to share a standalone scenario."));
    if (shareRedactedButton) {
      shareRedactedButton.textContent = "Share redacted via export";
      shareRedactedButton.addEventListener("click", () => setStatus("Use Export redacted JSON to share a standalone scenario with Buyer 1 through N labels."));
    }
  } else {
    shareButton.addEventListener("click", () => shareScenario(false));
    shareRedactedButton?.addEventListener("click", () => shareScenario(true));
  }
  document.querySelector("#reset-button").addEventListener("click", () => {
    if (!allowReplaceDraft()) return;
    if (scenarioReadFailed && !window.confirm("Replace the unreadable autosave with the example room? This removes its recovery data. Export any browser-storage recovery copy first.")) return;
    scenarioReadFailed = false;
    scenario = clonePreset();
    inspectedOfferId = scenario.offers[0]?.id ?? "";
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
  window.addEventListener("beforeunload", event => {
    if (invalidDraft || savedState === "failed" || savedState === "pending") {
      event.preventDefault(); event.returnValue = "";
    }
  });
  document.querySelector("#shortcut-help-close").addEventListener("click", () => document.querySelector("#shortcut-help").close());
  window.addEventListener("keydown", handleShortcut);
}

function isTypingTarget(target) {
  if (!(target instanceof Element)) return false;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

function openShortcutHelp() {
  const dialog = document.querySelector("#shortcut-help");
  if (dialog.open) {
    dialog.close();
    return;
  }
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
  document.querySelector("#shortcut-help-close")?.focus();
}

function handleShortcut(event) {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
  const helpOpen = document.querySelector("#shortcut-help")?.open;
  const coachOpen = document.querySelector("#coach-dialog")?.open;
  if (event.key === "Escape") {
    document.querySelector("#shortcut-help")?.close();
    return;
  }
  if (isTypingTarget(event.target) && event.key !== "Escape") return;
  if (event.key === "?" || (event.shiftKey && event.key === "/")) {
    event.preventDefault();
    openShortcutHelp();
    return;
  }
  if (helpOpen || coachOpen) return;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (key === "u") {
    event.preventDefault();
    if (!document.querySelector("#undo-button").disabled) restoreHistory(false);
    return;
  }
  if (key === "r") {
    event.preventDefault();
    if (!document.querySelector("#redo-button").disabled) restoreHistory(true);
    return;
  }
  if (key === "e") {
    event.preventDefault();
    exportScenario();
    return;
  }
  if (key === "n") {
    event.preventDefault();
    document.querySelector("#add-buyer").click();
    return;
  }
  if (key === "m") {
    event.preventDefault();
    focusMerchantInspector();
  }
}

function focusMerchantInspector() {
  const merchantTab = document.querySelector("#merchant-tab");
  const buyerTab = document.querySelector("#buyer-tab");
  if (merchantTab?.getAttribute("aria-selected") === "true") {
    document.querySelector("#merchant-panel")?.focus();
    return;
  }
  if (buyerTab) activateTab(buyerTab);
  document.querySelector("#merchant-inspector-region")?.focus();
}

function maybeShowCoach() {
  if (window.location.hash.startsWith("#scenario=")) return;
  try {
    if (localStorage.getItem(COACH_KEY) === "dismissed") return;
  } catch {
    return;
  }
  openCoach();
}

function openCoach() {
  const dialog = document.querySelector("#coach-dialog");
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
  document.querySelector("#coach-dismiss")?.focus();
}

function allowReplaceDraft() {
  return !invalidDraft || window.confirm("Discard the current invalid draft? Undo restores only the last valid room.");
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
  const addBuyer = document.querySelector("#add-buyer");
  const addOffer = document.querySelector("#add-offer");
  addBuyer.disabled = scenario.buyers.length >= 40;
  addOffer.disabled = scenario.offers.length >= 40;
  addBuyer.title = addBuyer.disabled ? "A room can have at most 40 buyers." : "";
  addOffer.title = addOffer.disabled ? "A room can have at most 40 offers." : "";
  renderTierEditors();
}

function buyerDisplayLabel(buyer) {
  if (!screenshotMode) return buyer.label;
  const index = scenario.buyers.findIndex((entry) => entry.id === buyer.id);
  return `Buyer ${index + 1}`;
}

function renderBuyerRow(entry) {
  const row = elements.buyerTemplate.content.firstElementChild.cloneNode(true);
  row.dataset.id = entry.id;
  addDuplicateAction(row, "buyers", entry);
  row.querySelectorAll("[data-field]").forEach((input) => {
    const field = input.dataset.field;
    input.value = field === "allowedVariants"
      ? entry[field].join(", ")
      : field === "label" && screenshotMode
        ? buyerDisplayLabel(entry)
        : entry[field] ?? "";
    if (field === "label" && screenshotMode) {
      input.readOnly = true;
      input.title = "Screenshot mode hides the private label. Turn it off to edit.";
    }
    input.addEventListener("input", () => {
      if (field === "label" && screenshotMode) return;
      const target = scenario.buyers.find((buyer) => buyer.id === row.dataset.id);
      if (field === "maxOrderTotal" && input.value === "") {
        delete target.maxOrderTotal;
        refresh();
        return;
      }
      target[field] = field === "allowedVariants"
        ? input.value.split(",").map((value) => value.trim()).filter(Boolean)
        : input.value;
      refresh();
    });
  });
  row.querySelector(".remove-row").addEventListener("click", () => {
    if (scenario.buyers.length === 1) return setStatus("A room needs at least one buyer.");
    const index = scenario.buyers.findIndex(({ id }) => id === row.dataset.id);
    scenario.buyers = scenario.buyers.filter(({ id }) => id !== row.dataset.id);
    renderEditor();
    refresh();
    elements.buyerRows.children[Math.min(index, scenario.buyers.length - 1)]?.querySelector("input")?.focus();
  });
  return row;
}

function renderOfferRow(entry) {
  const row = elements.offerTemplate.content.firstElementChild.cloneNode(true);
  row.dataset.id = entry.id;
  addDuplicateAction(row, "offers", entry);
  row.querySelectorAll("[data-field]").forEach((input) => {
    const field = input.dataset.field;
    input.value = entry[field] ?? (field === "fulfillment" ? "shipping" : "");
    input.addEventListener("input", () => {
      const target = scenario.offers.find((offer) => offer.id === row.dataset.id);
      target[field] = input.value;
      if (field === "merchant") {
        elements.tierEditors.querySelectorAll("legend")[scenario.offers.indexOf(target)].textContent = `${target.merchant} (${target.id})`;
      }
      refresh();
    });
  });
  row.querySelector(".remove-row").addEventListener("click", () => {
    if (scenario.offers.length === 1) return setStatus("A room needs at least one offer.");
    const index = scenario.offers.findIndex(({ id }) => id === row.dataset.id);
    scenario.offers = scenario.offers.filter(({ id }) => id !== row.dataset.id);
    renderEditor();
    refresh();
    elements.offerRows.children[Math.min(index, scenario.offers.length - 1)]?.querySelector("input")?.focus();
  });
  return row;
}

function renderTierEditors() {
  elements.tierEditors.replaceChildren(...scenario.offers.map((entry) => {
    const card = document.createElement("fieldset");
    card.className = "tier-editor";
    const legend = document.createElement("legend");
    legend.textContent = `${entry.merchant} (${entry.id})`;
    card.append(legend);
    for (const [index, tier] of (entry.tiers ?? []).entries()) {
      const row = document.createElement("div");
      row.className = "tier-input-row";
      for (const [field, labelText] of [["minimumUnits", "Minimum units"], ["unitPrice", "Price per unit"]]) {
        const label = document.createElement("label");
        label.textContent = `Tier ${index + 1}: ${labelText}`;
        const input = document.createElement("input");
        input.type = "number";
        input.min = field === "minimumUnits" ? "1" : "0";
        input.max = field === "minimumUnits" ? "5000" : "1000000";
        input.step = field === "minimumUnits" ? "1" : "0.01";
        input.value = tier[field];
        input.addEventListener("input", () => {
          scenario.offers.find(({ id }) => id === entry.id).tiers[index][field] = input.value;
          refresh();
        });
        label.append(input);
        row.append(label);
      }
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Remove tier";
      remove.setAttribute("aria-label", `Remove tier ${index + 1} for ${entry.merchant}`);
      remove.addEventListener("click", () => {
        scenario.offers.find(({ id }) => id === entry.id).tiers.splice(index, 1);
        renderTierEditors();
        refresh();
      });
      row.append(remove);
      card.append(row);
    }
    const add = document.createElement("button");
    add.type = "button";
    add.textContent = "Add price tier";
    add.setAttribute("aria-label", `Add price tier for ${entry.merchant}`);
    add.disabled = (entry.tiers?.length ?? 0) >= 8;
    add.addEventListener("click", () => {
      const target = scenario.offers.find(({ id }) => id === entry.id);
      const previous = target.tiers?.at(-1) ?? target;
      if (Number(previous.minimumUnits) >= Number(target.capacity) || Number(previous.unitPrice) <= 0) {
        return setStatus("Increase capacity or the previous price before adding a lower-price tier.");
      }
      target.tiers ??= [];
      target.tiers.push({ minimumUnits: Number(previous.minimumUnits) + 1, unitPrice: Math.floor(Number(previous.unitPrice) * 50) / 100 });
      const offerIndex = scenario.offers.indexOf(target);
      renderTierEditors();
      refresh();
      elements.tierEditors.querySelectorAll("fieldset")[offerIndex]?.querySelector(".tier-input-row:last-of-type input")?.focus();
    });
    card.append(add);
    return card;
  }));
}

function updateRoot(field, value) {
  scenario[field] = value;
  refresh();
}

function refresh() {
  try {
    const market = evaluateMarket(scenario);
    scenario = market.scenario;
    if (window.location.hash.startsWith("#scenario=")) window.history.replaceState(null, "", window.location.pathname + window.location.search);
    invalidDraft = false;
    history.record(scenario);
    updateHistoryButtons();
    renderComparison();
    renderSummary(market);
    renderResults(market);
    renderInspector(market);
    renderResidualCoverage(market.scenario);
    renderDemand(market.scenario);
    renderDeliveryHeatmap(market.scenario);
    renderVariantOverlap(market.scenario);
    drawChart(market);
    scheduleSave(market.scenario);
    setStatus("");
  } catch (error) {
    invalidDraft = true;
    document.querySelector("#save-state").textContent = "Invalid draft, not autosaved. Undo restores the last valid room.";
    document.querySelector("#comparison-summary").textContent = "Correct invalid inputs to compare this room.";
    updateHistoryButtons();
    clearTimeout(saveTimer);
    elements.winner.textContent = "Check inputs";
    elements.winnerNote.textContent = "Results are unavailable until the scenario is valid.";
    for (const element of [elements.units, elements.buyers, elements.fulfilled, elements.delivered, elements.savings]) element.textContent = "Not available";
    setEmptyState(elements.resultRows, 8, "Ranked offers will appear once every field is valid.");
    setEmptyState(elements.inspectorRows, 9, "Buyer outcomes will appear once every field is valid.");
    setEmptyState(document.querySelector("#exclusion-groups"), 3, "Exclusion groups will appear once every field is valid.");
    setEmptyState(elements.tierRows, 6, "Price-band feasibility will appear once every field is valid.");
    setEmptyState(elements.merchantResults, 7, "Aggregate offer outcomes will appear once every field is valid.");
    const residualSummary = document.querySelector("#residual-summary");
    if (residualSummary) {
      residualSummary.replaceChildren();
      const residualEmpty = document.createElement("p");
      residualEmpty.className = "canvas-note";
      residualEmpty.textContent = "Residual coverage will appear once every field is valid.";
      residualSummary.append(residualEmpty);
    }
    const residualNote = document.querySelector("#residual-note");
    if (residualNote) residualNote.textContent = "";
    elements.demandGroups.replaceChildren();
    const demandNote = document.createElement("p");
    demandNote.className = "canvas-note";
    demandNote.textContent = "Aggregate demand will appear once every field is valid.";
    elements.demandGroups.append(demandNote);
    const heatmapText = document.querySelector("#delivery-heatmap-text");
    if (heatmapText) heatmapText.textContent = "Delivery heatmap will appear once every field is valid.";
    document.querySelector("#delivery-heatmap")?.replaceChildren();
    const overlapNote = document.querySelector("#variant-overlap-note");
    if (overlapNote) overlapNote.textContent = "Variant overlap will appear once every field is valid.";
    document.querySelector("#variant-overlap-head")?.replaceChildren();
    const overlapRows = document.querySelector("#variant-overlap-rows");
    if (overlapRows) setEmptyState(overlapRows, 2, "Variant overlap will appear once every field is valid.");
    elements.inspectorSummary.textContent = "Correct the named input error to inspect allocations.";
    elements.chart.getContext("2d").clearRect(0, 0, elements.chart.width, elements.chart.height);
    setStatus(messageOf(error));
  }
}

function renderComparison() {
  const summary = document.querySelector("#comparison-summary");
  document.querySelector("#clear-baseline").disabled = !baseline;
  if (!baseline) { summary.textContent = "Pin this room, then change constraints or load another snapshot to compare winners, participation, and cost. Baselines last until this page closes."; return; }
  const comparison = compareScenarios(baseline, scenario);
  const { baseline: before, current: after } = comparison;
  const rows = [
    ["Winner", before.winner, after.winner],
    ["Requested units", before.requested, after.requested],
    ["Fulfilled units", before.fulfilled, after.fulfilled],
    ["Included buyers", before.buyers, after.buyers],
    ["Leftover buyers after winner", before.leftoverBuyers, after.leftoverBuyers],
    ["Leftover units after winner", before.leftoverUnits, after.leftoverUnits],
    ["Unfilled buyers after residual", before.unfilledBuyers, after.unfilledBuyers],
    ["Unfilled units after residual", before.unfilledUnits, after.unfilledUnits]
  ];
  if (comparison.sameCurrency) rows.push(["Landed total", before.cost === null ? "No allocation" : money(scenario.currency).format(before.cost), after.cost === null ? "No allocation" : money(scenario.currency).format(after.cost)]);
  const table = document.createElement("table");
  const caption = document.createElement("caption"); caption.textContent = `Pinned: ${baseline.title}. Current: ${scenario.title}.`;
  const head = document.createElement("thead"); const header = document.createElement("tr");
  for (const text of ["Metric", "Baseline", "Current"]) { const th = document.createElement("th"); th.scope = "col"; th.textContent = text; header.append(th); }
  head.append(header); table.append(caption, head);
  const body = document.createElement("tbody");
  for (const values of rows) { const tr = document.createElement("tr"); for (const value of values) addCell(tr, String(value)); body.append(tr); }
  table.append(body);
  const note = document.createElement("p");
  note.textContent = `${comparison.sameDemand ? "Buyer demand is unchanged." : "Buyer demand changed; cost differences are not like-for-like savings."} ${comparison.sameCurrency ? "Totals may cover different allocated orders." : "Currencies differ; monetary comparisons are omitted."}`;
  summary.replaceChildren(table, note);
}

function renderThreeRoomComparison(comparison) {
  const host = document.querySelector("#three-room-summary");
  if (!host) return;
  const table = document.createElement("table");
  const caption = document.createElement("caption");
  caption.textContent = comparison.sameCurrency
    ? "Current room and two snapshots. Landed totals may cover different allocated orders."
    : "Current room and two snapshots. Currencies differ, so monetary totals are omitted.";
  const head = document.createElement("thead");
  const header = document.createElement("tr");
  for (const text of ["Metric", "Current", "Snapshot A", "Snapshot B"]) {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = text;
    header.append(th);
  }
  head.append(header);
  table.append(caption, head);
  const body = document.createElement("tbody");
  const rows = [
    ["Room", ...comparison.rooms.map((room) => room.title)],
    ["Winner", ...comparison.rooms.map((room) => room.winner)],
    ["Requested units", ...comparison.rooms.map((room) => room.requested)],
    ["Fulfilled units", ...comparison.rooms.map((room) => room.fulfilled)],
    ["Included buyers", ...comparison.rooms.map((room) => room.buyers)],
    ["Leftover buyers after winner", ...comparison.rooms.map((room) => room.leftoverBuyers)],
    ["Leftover units after winner", ...comparison.rooms.map((room) => room.leftoverUnits)],
    ["Unfilled buyers after residual", ...comparison.rooms.map((room) => room.unfilledBuyers)],
    ["Unfilled units after residual", ...comparison.rooms.map((room) => room.unfilledUnits)]
  ];
  if (comparison.sameCurrency) {
    rows.push(["Landed total", ...comparison.rooms.map((room) => room.cost === null ? "No allocation" : money(room.currency).format(room.cost))]);
  }
  for (const values of rows) {
    const tr = document.createElement("tr");
    for (const value of values) addCell(tr, String(value));
    body.append(tr);
  }
  table.append(body);
  host.replaceChildren(table);
}

function addDuplicateAction(row, kind, entry) {
  row.querySelector(".remove-row").setAttribute("aria-label", `Remove ${kind === "buyers" ? buyerDisplayLabel(entry) : entry.merchant} (${entry.id})`);
  row.querySelector(".remove-row").disabled = scenario[kind].length === 1;
  row.querySelectorAll("input").forEach(input => input.setAttribute("aria-label", `${input.getAttribute("aria-label")} (${entry.id})`));
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Copy";
  button.setAttribute("aria-label", `Duplicate ${kind === "buyers" ? buyerDisplayLabel(entry) : entry.merchant}`);
  button.disabled = scenario[kind].length >= 40;
  button.addEventListener("click", () => {
    try {
      scenario = duplicateEntry(scenario, kind, entry.id);
      renderEditor(); refresh();
      const body = kind === "buyers" ? elements.buyerRows : elements.offerRows;
      body.lastElementChild.querySelector("input").focus();
      setStatus("Independent copy added. Edit its constraints to test an alternative.", true);
    } catch (error) { setStatus(messageOf(error)); }
  });
  row.lastElementChild.append(button);
  if (kind !== "offers") return;
  const tierSet = document.createElement("button");
  tierSet.type = "button";
  tierSet.textContent = "As tier set";
  tierSet.setAttribute("aria-label", `Copy ${entry.merchant} as a new price-tier set`);
  tierSet.disabled = scenario.offers.length >= 40;
  tierSet.addEventListener("click", () => {
    try {
      scenario = copyOfferAsNewTierSet(scenario, entry.id);
      inspectedOfferId = scenario.offers.at(-1).id;
      renderEditor();
      refresh();
      elements.offerRows.lastElementChild.querySelector("input").focus();
      setStatus("Copied this offer as a new tier set. The extra band is a planning draft, not a merchant quote.", true);
    } catch (error) { setStatus(messageOf(error)); }
  });
  row.lastElementChild.append(tierSet);
}

function updateHistoryButtons() {
  document.querySelector("#undo-button").disabled = !invalidDraft && !history.canUndo;
  document.querySelector("#redo-button").disabled = invalidDraft || !history.canRedo;
}

function restoreHistory(forward) {
  scenario = invalidDraft ? history.current() : forward ? history.redo() : history.undo();
  renderEditor();
  refresh();
  setStatus(forward ? "Change restored." : "Previous valid room restored.", true);
}

function renderSummary(market) {
  const winner = market.winner;
  const formatter = money(market.scenario.currency);
  elements.units.textContent = String(market.totalRequestedUnits);
  elements.buyers.textContent = `${market.buyerCount} ${market.buyerCount === 1 ? "buyer" : "buyers"}`;
  elements.winner.textContent = winner ? `${winner.offer.merchant} / ${winner.offer.variant}` : "Not unlocked";
  elements.winnerNote.textContent = winner
    ? `${winner.fulfilledUnits} units at ${formatter.format(winner.averageLandedUnitCost)} landed per unit. ${computeResidualCoverage(market.scenario).leftoverUnits} units leftover after the winner.`
    : "No bid reaches its minimum with compatible whole orders.";
  elements.fulfilled.textContent = winner ? percent(winner.fulfillmentRate) : "0%";
  elements.delivered.textContent = winner ? `${winner.deliveredBuyers} buyers included` : "0 buyers included";
  elements.savings.textContent = formatter.format(winner?.savings ?? 0);
}

function renderResults(market) {
  const formatter = money(market.scenario.currency);
  const labels = new Map(market.scenario.buyers.map((buyer) => [buyer.id, buyerDisplayLabel(buyer)]));
  const rows = market.ranked.map((result) => {
    const row = document.createElement("tr");
    addCell(row, `${result.offer.merchant} / ${result.offer.variant}`);
    addCell(row, result.qualifies ? "Unlocked" : result.offer.tiers?.length ? "No feasible tier" : `${result.unitsShort} short`, result.qualifies ? "status-pass" : "status-short");
    addCell(row, String(result.fulfilledUnits));
    addCell(row, result.effectiveUnitPrice === null ? "Not available" : formatter.format(result.effectiveUnitPrice));
    addCell(row, result.averageLandedUnitCost === null ? "Not available" : formatter.format(result.averageLandedUnitCost));
    addCell(row, formatter.format(result.basePriceDiscount));
    addCell(row, formatter.format(result.savings));
    addCell(row, result.qualifies
      ? result.selectedBuyerIds.map((id) => labels.get(id) ?? id).join(", ")
      : "No complete buyer set");
    return row;
  });
  elements.resultRows.replaceChildren(...rows);
  elements.merchantResults.replaceChildren(...market.ranked.map((result) => {
    const row = document.createElement("tr");
    const gap = unitsToNextTier(market.scenario, result.offer.id);
    addCell(row, result.offer.merchant);
    addCell(row, result.qualifies ? "Unlocked" : "Locked");
    addCell(row, String(result.fulfilledUnits));
    addCell(row, String(result.deliveredBuyers));
    addCell(row, result.effectiveUnitPrice === null ? "Not available" : formatter.format(result.effectiveUnitPrice));
    addCell(row, formatter.format(result.totalCost));
    addCell(row, gap.unitsNeeded === null ? gap.reason : `${gap.unitsNeeded} units (${gap.supplierBuyerCount} excluded buyers, ${gap.supplierUnits} units they hold)`);
    return row;
  }));
}

function renderResidualCoverage(rawScenario) {
  const summary = document.querySelector("#residual-summary");
  const note = document.querySelector("#residual-note");
  if (!summary || !note) return;
  const coverage = computeResidualCoverage(rawScenario);
  note.textContent = coverage.note;
  const formatter = money(rawScenario.currency);
  const list = document.createElement("dl");
  if (!coverage.primary) {
    appendDetail(list, "Winning offer", "None unlocked");
    appendDetail(list, "Unfilled buyers", coverage.unfilledBuyerCount);
    appendDetail(list, "Unfilled units", coverage.unfilledUnits);
    summary.replaceChildren(list);
    return;
  }
  appendDetail(list, "Winning offer", `${coverage.primary.merchant} / ${coverage.primary.variant}`);
  appendDetail(list, "Winner units", coverage.primary.fulfilledUnits);
  appendDetail(list, "Winner included buyers", coverage.primary.deliveredBuyers);
  appendDetail(list, "Winner landed total", formatter.format(coverage.primary.totalCost));
  appendDetail(list, "Leftover after winner", `${coverage.leftoverBuyerCount} buyers, ${coverage.leftoverUnits} units`);
  if (coverage.secondary) {
    appendDetail(list, "Next-best leftover offer", `${coverage.secondary.merchant} / ${coverage.secondary.variant}`);
    appendDetail(list, "Leftover units that fit", coverage.secondary.fulfilledUnits);
    appendDetail(list, "Leftover buyers that fit", coverage.secondary.deliveredBuyers);
  } else {
    appendDetail(list, "Next-best leftover offer", "No other qualifying offer on leftover whole orders");
  }
  if (coverage.tertiary) {
    appendDetail(list, "Third leftover offer", `${coverage.tertiary.merchant} / ${coverage.tertiary.variant}`);
    appendDetail(list, "Tertiary units that fit", coverage.tertiary.fulfilledUnits);
    appendDetail(list, "Tertiary buyers that fit", coverage.tertiary.deliveredBuyers);
  } else {
    appendDetail(list, "Third leftover offer", "No third distinct offer on remaining whole orders");
  }
  appendDetail(list, "Still unfilled", `${coverage.unfilledBuyerCount} buyers, ${coverage.unfilledUnits} units`);
  summary.replaceChildren(list);
}

function renderInspector(market) {
  if (!market.results.some(({ offer }) => offer.id === inspectedOfferId)) {
    inspectedOfferId = market.winner?.offer.id ?? market.ranked[0]?.offer.id ?? "";
  }
  const options = market.results.map((result) => {
    const option = document.createElement("option");
    option.value = result.offer.id;
    option.textContent = `${result.offer.merchant} / ${result.offer.variant}`;
    option.selected = result.offer.id === inspectedOfferId;
    return option;
  });
  elements.inspector.replaceChildren(...options);

  const result = market.results.find(({ offer }) => offer.id === inspectedOfferId);
  if (!result) {
    elements.inspectorSummary.textContent = "No offer is available to inspect.";
    elements.inspectorRows.replaceChildren();
    return;
  }
  elements.inspectorSummary.textContent = result.qualifies
    ? `${result.deliveredBuyers} buyers and ${result.fulfilledUnits} units are included at ${money(market.scenario.currency).format(result.effectiveUnitPrice)} per item. ${result.activeTierIndex === 0 ? "Base price" : `Tier ${result.activeTierIndex}`} applies to every included unit. Fulfillment is ${result.offer.fulfillment === "pickup" ? "pickup, so shipping is not charged" : "shipping"}.`
    : "No whole-buyer cohort reaches a valid price band. The table below shows each band's allocation shortfall.";
  const formatter = money(market.scenario.currency);
  elements.tierRows.replaceChildren(...result.tierProgress.map((tier) => {
    const row = document.createElement("tr");
    addCell(row, tier.index === 0 ? "Base" : `Tier ${tier.index}`);
    addCell(row, tier.maximumUnits < tier.minimumUnits ? `Minimum ${tier.minimumUnits} exceeds capacity ${tier.maximumUnits}` : `${tier.minimumUnits} to ${tier.maximumUnits}`);
    addCell(row, formatter.format(tier.unitPrice));
    addCell(row, String(tier.compatibleUnits));
    addCell(row, String(tier.allocatedUnits));
    addCell(row, tier.selected ? "Selected" : tier.qualifies ? "Feasible" : `${tier.unitsShort} short`, tier.selected ? "status-pass" : "");
    return row;
  }));
  const buyers = new Map(market.scenario.buyers.map((buyer) => [buyer.id, buyer]));
  const allocations = new Map(result.allocations.map((allocation) => [allocation.buyerId, allocation]));
  const rows = result.buyerOutcomes.map((outcome) => {
    const buyer = buyers.get(outcome.buyerId);
    const row = document.createElement("tr");
    addCell(row, buyer ? buyerDisplayLabel(buyer) : outcome.buyerId);
    addCell(row, String(buyer?.quantity ?? 0));
    const presentation = outcomePresentation(outcome);
    addCell(row, presentation.status, presentation.className);
    addCell(row, presentation.explanation);
    const allocation = allocations.get(outcome.buyerId);
    for (const field of ["itemsCost", "shippingCost", "totalCost", "landedUnitCost"]) {
      addCell(row, allocation ? formatter.format(allocation[field]) : "Not allocated");
    }
    addCell(row, allocation ? allocation.exceedsCeilingAfterShipping
      ? `${formatter.format(-allocation.headroom)} over item ceiling after shipping`
      : `${formatter.format(allocation.headroom)} remaining` : "Not allocated", allocation?.exceedsCeilingAfterShipping ? "status-short" : "");
    return row;
  });
  elements.inspectorRows.replaceChildren(...rows);
  renderExclusionGroups(market.scenario, result.offer.id, buyers);
  renderNextTierGap(market.scenario, result.offer.id, buyers, formatter);
  renderCapacityBar(market.scenario, result.offer.id);
}

function renderCapacityBar(rawScenario, offerId) {
  const text = document.querySelector("#capacity-bar-text");
  const svg = document.querySelector("#capacity-bar");
  if (!text || !svg) return;
  const bar = capacityBar(rawScenario, offerId);
  const next = bar.nextTierThreshold === null ? "No cheaper tier threshold." : `Next cheaper tier starts at ${bar.nextTierThreshold} units.`;
  text.textContent = bar.qualifies
    ? `${bar.filledUnits} of ${bar.capacity} capacity units are filled. ${bar.leftoverUnits} units remain unused. Offer minimum is ${bar.minimumUnits}. ${next}`
    : `No units are filled. Capacity is ${bar.capacity} and the offer minimum is ${bar.minimumUnits}. ${next}`;
  const width = 400;
  const height = 48;
  const pad = 8;
  const trackWidth = width - pad * 2;
  const scale = (units) => pad + (units / Math.max(bar.capacity, 1)) * trackWidth;
  const filledWidth = Math.max(0, scale(bar.filledUnits) - pad);
  const minX = scale(Math.min(bar.minimumUnits, bar.capacity));
  const nextX = bar.nextTierThreshold === null ? null : scale(Math.min(bar.nextTierThreshold, bar.capacity));
  svg.replaceChildren();
  const ns = "http://www.w3.org/2000/svg";
  const append = (name, attrs) => {
    const node = document.createElementNS(ns, name);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
    svg.append(node);
    return node;
  };
  append("rect", { x: pad, y: 16, width: trackWidth, height: 16, fill: "#d8d0c3" });
  append("rect", { x: pad, y: 16, width: filledWidth, height: 16, fill: bar.qualifies ? "#f36f3d" : "#a9a090" });
  append("line", { x1: minX, y1: 10, x2: minX, y2: 38, stroke: "#211f55", "stroke-width": 2 });
  if (nextX !== null) append("line", { x1: nextX, y1: 10, x2: nextX, y2: 38, stroke: "#16745a", "stroke-width": 2, "stroke-dasharray": "4 3" });
  append("text", { x: pad, y: 12, fill: "#636174", "font-size": "10" }).textContent = "0";
  append("text", { x: width - pad, y: 12, fill: "#636174", "font-size": "10", "text-anchor": "end" }).textContent = String(bar.capacity);
}

function renderNextTierGap(rawScenario, offerId, buyers, formatter) {
  const summary = document.querySelector("#next-tier-summary");
  const names = document.querySelector("#next-tier-buyers");
  if (!summary) return;
  const gap = unitsToNextTier(rawScenario, offerId);
  const list = document.createElement("dl");
  appendDetail(list, "Current fulfilled units", gap.currentUnits);
  if (gap.nextMinimum === null) {
    appendDetail(list, "Next cheaper tier", "None");
  } else {
    appendDetail(list, "Next cheaper tier", `${gap.nextMinimum} units at ${formatter.format(gap.nextPrice)}`);
    appendDetail(list, "Whole units still needed", gap.unitsNeeded === null ? "Not available" : gap.unitsNeeded);
    appendDetail(list, "Compatible units at next price", gap.compatibleUnitsAtNext);
    appendDetail(list, "Whole units that already fit next band", gap.allocatedUnitsAtNext);
    appendDetail(list, "Excluded buyers who could add units", `${gap.supplierBuyerCount} buyers, ${gap.supplierUnits} units`);
  }
  appendDetail(list, "Reachable with current buyers", gap.reachable ? "Yes" : "No");
  const reason = document.createElement("p");
  reason.className = "canvas-note";
  reason.textContent = gap.reason;
  summary.replaceChildren(list, reason);
  if (!names) return;
  if (gap.supplierBuyerIds.length === 0) {
    names.textContent = "No currently excluded buyer can add whole units at the next cheaper price.";
    return;
  }
  names.textContent = `Organizer view: ${gap.supplierBuyerIds.map((id) => buyerDisplayLabel(buyers.get(id) ?? { id, label: id })).join(", ")}. Merchant-facing views show counts only.`;
}

function renderExclusionGroups(rawScenario, offerId, buyers) {
  const body = document.querySelector("#exclusion-groups");
  if (!body) return;
  const groups = groupExclusionReasons(rawScenario, offerId);
  if (groups.length === 0) {
    setEmptyState(body, 3, "No buyers are excluded from this offer.");
    return;
  }
  const copy = {
    price: "Unit price is above the item ceiling.",
    delivery: "Delivery is later than the buyer's limit.",
    variant: "The offered variant is not accepted.",
    category: "The product category does not match.",
    budget: "Items plus shipping exceed the order budget.",
    capacity_leftover: "The whole order fits merchant capacity but was omitted from the maximizing cohort.",
    quantity_vs_capacity: "The whole order is larger than merchant capacity.",
    minimum: "Constraints pass, but the offer misses its minimum."
  };
  const titles = {
    price: "Price",
    delivery: "Delivery",
    variant: "Variant",
    category: "Category",
    budget: "Budget",
    capacity_leftover: "Capacity leftover",
    quantity_vs_capacity: "Quantity vs remaining capacity",
    minimum: "Below minimum"
  };
  body.replaceChildren(...groups.map((group) => {
    const row = document.createElement("tr");
    addCell(row, titles[group.code] ?? group.code);
    addCell(row, String(group.count));
    const names = group.buyerIds.map((id) => buyerDisplayLabel(buyers.get(id) ?? { id, label: id })).join(", ");
    addCell(row, `${copy[group.code] ?? group.code} Organizer detail: ${names}.`);
    return row;
  }));
}

function outcomePresentation(outcome) {
  if (outcome.status === "included") {
    return { status: "Included", className: "status-pass", explanation: "All constraints pass and the whole order fits capacity." };
  }
  if (outcome.status === "minimum") {
    return { status: "Offer locked", className: "status-short", explanation: "All constraints pass and the order fits capacity, but the offer misses its minimum." };
  }
  if (outcome.status === "capacity") {
    return { status: "Capacity", className: "status-short", explanation: "All constraints pass, but this whole order is outside the capacity-maximizing cohort." };
  }
  const explanations = {
    category: "category differs",
    variant: "variant is not accepted",
    price: "unit price exceeds the ceiling",
    budget: "items plus shipping exceed the order budget",
    delivery: "delivery exceeds the limit"
  };
  return {
    status: "Incompatible",
    className: "status-short",
    explanation: outcome.reasons.map((reason) => explanations[reason]).join("; ")
  };
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

function renderDeliveryHeatmap(rawScenario) {
  const text = document.querySelector("#delivery-heatmap-text");
  const svg = document.querySelector("#delivery-heatmap");
  if (!text || !svg) return;
  const map = deliveryHeatmap(rawScenario);
  text.textContent = map.buckets.map((bucket) => `${bucket.label}: ${bucket.buyerCount} buyers, ${bucket.units} units`).join(". ") + ".";
  svg.replaceChildren();
  const ns = "http://www.w3.org/2000/svg";
  const maxUnits = Math.max(1, ...map.buckets.map((bucket) => bucket.units));
  const append = (name, attrs) => {
    const node = document.createElementNS(ns, name);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
    svg.append(node);
    return node;
  };
  map.buckets.forEach((bucket, index) => {
    const x = 8 + index * 78;
    const barHeight = (bucket.units / maxUnits) * 48;
    append("rect", { x, y: 64 - barHeight, width: 64, height: barHeight, fill: bucket.units ? "#f36f3d" : "#d8d0c3" });
    append("text", { x: x + 32, y: 80, fill: "#636174", "font-size": "9", "text-anchor": "middle" }).textContent = bucket.key;
  });
}

function renderVariantOverlap(rawScenario) {
  const note = document.querySelector("#variant-overlap-note");
  const head = document.querySelector("#variant-overlap-head");
  const body = document.querySelector("#variant-overlap-rows");
  if (!note || !head || !body) return;
  const matrix = variantOverlapMatrix(rawScenario);
  note.textContent = matrix.variants.map((entry) => `${entry.variant}: ${entry.buyerCount} buyers, ${entry.units} units (${entry.offerCount} offers)`).join(". ") + ".";
  const headerRow = document.createElement("tr");
  const corner = document.createElement("th");
  corner.scope = "col";
  corner.textContent = "Accepted variant";
  headerRow.append(corner);
  for (const entry of matrix.variants) {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = entry.variant;
    headerRow.append(th);
  }
  head.replaceChildren(headerRow);
  body.replaceChildren(...matrix.cells.map((row, index) => {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.scope = "row";
    th.textContent = matrix.variants[index].variant;
    tr.append(th);
    for (const cell of row) addCell(tr, String(cell.buyerCount));
    return tr;
  }));
}

function addCell(row, text, className = "") {
  const cell = document.createElement("td");
  cell.textContent = text;
  if (className) cell.className = className;
  row.append(cell);
}

function setEmptyState(body, columns, message) {
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.colSpan = columns;
  cell.className = "empty-state";
  cell.textContent = message;
  row.append(cell);
  body.replaceChildren(row);
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
  const height = Math.max(280, market.results.length * 64 + 40);
  canvas.style.height = `${height}px`;
  canvas.width = Math.floor(bounds.width * ratio);
  canvas.height = Math.floor(height * ratio);
  const context = canvas.getContext("2d");
  context.scale(ratio, ratio);
  const width = bounds.width;
  context.clearRect(0, 0, width, height);
  context.font = "12px system-ui";
  context.textBaseline = "middle";
  const left = Math.min(150, Math.max(95, width * 0.28));
  const right = 42;
  const top = 20;
  const rowHeight = 64;
  const threshold = result => result.tierProgress.find(tier => tier.selected)?.minimumUnits ?? result.offer.minimumUnits;
  const max = Math.max(1, ...market.results.map((result) => Math.max(result.fulfilledUnits, threshold(result))));

  market.results.forEach((result, index) => {
    const y = top + index * rowHeight;
    context.fillStyle = "#d8d0c3";
    context.fillRect(left, y + 14, width - left - right, 20);
    const candidateWidth = (result.fulfilledUnits / max) * (width - left - right);
    context.fillStyle = result.qualifies ? "#f36f3d" : "#a9a090";
    context.fillRect(left, y + 14, candidateWidth, 20);
    const minimumX = left + (threshold(result) / max) * (width - left - right);
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
    context.fillText(`${result.fulfilledUnits} fulfilled / ${threshold(result)} minimum`, left, y + 49);
  });
}

function trimLabel(value, limit) {
  return value.length <= limit ? value : `${value.slice(0, limit - 1)}…`;
}

function scheduleSave(cleanScenario) {
  clearTimeout(saveTimer);
  if (scenarioReadFailed) {
    savedState = "failed";
    document.querySelector("#save-state").textContent = "Previous autosave could not be read and is preserved. Export current edits as JSON. Reset this room explicitly to replace the unreadable save.";
    return;
  }
  savedState = "pending";
  document.querySelector("#save-state").textContent = "Saving locally…";
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanScenario));
      savedState = "saved";
      document.querySelector("#save-state").textContent = "Current valid room saved in this browser.";
    } catch {
      savedState = "failed";
      document.querySelector("#save-state").textContent = "Autosave unavailable. Export JSON before closing this page.";
      setStatus("This browser could not autosave the room.");
    }
  }, 180);
}

async function importScenario(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (file.size === 0) return setStatus("Import failed: the file is empty.");
  if (file.size > 250_000) return setStatus("Import files must be smaller than 250 KB.");
  try {
    const beforeRead = JSON.stringify(scenario);
    const text = await file.text();
    if (!text.trim()) return setStatus("Import failed: the file is empty.");
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      return setStatus(`Import failed: the file is not valid JSON${appJsonSyntaxHint(error)}.`);
    }
    const imported = validateScenario(parsed);
    if (beforeRead !== JSON.stringify(scenario) && !window.confirm("The room changed while the file was read. Replace it with the imported room? Undo keeps the previous valid room.")) return;
    if (!allowReplaceDraft()) return;
    scenario = imported;
    inspectedOfferId = scenario.offers[0]?.id ?? "";
    renderEditor();
    refresh();
    setStatus("Scenario imported.", true);
  } catch (error) {
    setStatus(`Import failed: ${messageOf(error)}`);
  }
}

async function importBuyersCsv(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (file.size === 0) return setStatus("Buyer CSV import failed: the file is empty.");
  if (file.size > 250_000) return setStatus("Buyer CSV files must be smaller than 250 KB.");
  try {
    const text = await file.text();
    if (!text.trim()) return setStatus("Buyer CSV import failed: the file is empty.");
    const imported = importBuyersFromCsv(scenario, text);
    if (!allowReplaceDraft()) return;
    scenario = imported;
    renderEditor();
    refresh();
    setStatus(`Imported ${imported.buyers.length} buyers from CSV. Offers were left unchanged.`, true);
  } catch (error) {
    setStatus(`Buyer CSV import failed: ${messageOf(error)}`);
  }
}

function exportScenario() {
  try {
    const clean = validateScenario(scenario);
    downloadFile(`${JSON.stringify(clean, null, 2)}\n`, "common-cart-scenario.json", "application/json");
    setStatus("Scenario exported.", true);
  } catch (error) {
    setStatus(`Export failed: ${messageOf(error)}`);
  }
}

function downloadFile(content, filename, type) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([content], { type }));
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

async function shareScenario(redacted = false) {
  try {
    const encoded = redacted ? encodeRedactedScenario(scenario) : encodeScenario(scenario);
    const url = new URL(window.location.href);
    url.hash = `scenario=${encoded}`;
    window.history.replaceState(null, "", url);
    await navigator.clipboard.writeText(url.href);
    setStatus(redacted
      ? "Redacted share link copied. Buyer labels are Buyer 1 through N. IDs and constraints are unchanged."
      : "Share link copied. It contains this scenario's data.", true);
  } catch (error) {
    setStatus(error?.name === "NotAllowedError" ? "The share link is in the address bar, but clipboard access was denied." : `Share failed: ${messageOf(error)}`);
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

function appJsonSyntaxHint(error) {
  const message = String(error?.message ?? "").replace(/\s+/g, " ").trim();
  if (!message) return "";
  const lineColumn = message.match(/line (\d+)(?: column (\d+))?/i);
  if (lineColumn?.[2]) return ` (line ${lineColumn[1]}, column ${lineColumn[2]})`;
  if (lineColumn) return ` (line ${lineColumn[1]})`;
  const position = message.match(/position (\d+)/i);
  if (position) return ` (at position ${position[1]})`;
  return ` (${message})`;
}
