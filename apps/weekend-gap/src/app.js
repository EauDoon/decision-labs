import {
  createWeekendReviewPacket,
  replayWeekendReviewPacket,
  WEEKEND_REVIEW_TOOLS,
  analyzeWeekendReview,
  DEFAULT_SCENARIO,
  PRESETS,
  SIMULATION_HOURS,
  formatTime,
  weekendCloseOverlapNotice,
  mondaySaturdayHolidayNotice,
  runSimulation,
  sanitizeScenario,
  scenarioFromHash,
  scenarioFromJSON,
  scenarioToHash,
  scenarioToJSON,
  compareScenarios,
  planReserve,
  analysisToJSON,
  analyzeTimeline,
  attributeBottlenecks,
  bottleneckCountsToMarkdown,
  previewWindowShift,
  compareDemandProfiles,
  previewDemandProfileStep,
  buildGateGanttSvg,
  ganttToCSV,
  selectedGanttHourToMarkdown,
  remainingReserveAtHourToMarkdown,
  peakQueueHourToMarkdown,
  selectedVersusPeakHourToMarkdown,
  nextPayoutHourToMarkdown,
  closedGanttHoursToMarkdown,
  fxGanttHoursToMarkdown,
  weekendFxHourCountsToMarkdown,
  firstClosedFxHourToMarkdown,
  firstClosedBankHourToMarkdown,
  firstClosedIssuerHourToMarkdown,
  firstClosedPayoutHourToMarkdown,
  firstOpenPayoutHourToMarkdown,
  arrivalCohortsToMarkdown,
  firstClosedGanttHour,
  firstClosedFxGanttHour,
  firstClosedIssuerGanttHour,
  firstClosedPayoutGanttHour,
  ganttHourClosedOnAnyGate,
  ganttHourClosedOnEveryGate,
  ganttHourOpenOnEveryGate,
  ganttHourIsWeekend,
  ganttHourHasZeroQueue,
  ganttHourBankClosed,
  ganttHourIssuerClosed,
  ganttHourPayoutClosed,
  ganttHourFxClosed,
  ganttHourPayoutOpen,
  GANTT_GATE_FILTERS,
  gateDisplayLabels,
  GENERIC_GATE_LABELS,
  buildGateSchedule,
  compareGateSchedules,
  buildComparisonGanttSvg,
  buildQueueChartSvg,
  buildSensitivityBarsSvg,
  compareSavedExperiments,
  runSensitivity,
  libraryFromJSON,
  workspaceToJSON,
  workspaceFromJSON,
  createScenarioHistory,
  timelineToCSV,
  queueToCSV,
  reportToHTML,
  reportToMarkdown,
  dashboardToMarkdown,
  hoursToClearQueueToMarkdown,
  hoursToFirstSettlementToMarkdown,
  dashboardToCSV,
  compareScenarioFiles,
  compareThreeScenarioFiles
} from "./model.js";

let workspaceReady = false;
let lastValidPlan = { targetPercent: 100, deadlineHour: 72, ganttDensity: "snapshots", selectedHour: 0, ganttHourIndex: 0, selectedChart: "queue", ganttClosedOnly: false, ganttGateFilter: "all", queueBacklogOnly: false, ganttEveryGateClosed: false, hideWeekdayGanttHours: false, hideWeekendGanttHours: false, hideOpenGanttHours: false, hideClosedGanttHours: false, hideZeroQueueGanttHours: false, hideBankClosedGanttHours: false, hideIssuerClosedGanttHours: false, hidePayoutClosedGanttHours: false, hideFxClosedGanttHours: false, hidePayoutOpenGanttHours: false };
const WORKSPACE_KEY = "weekend-gap:workspace:v1";
const STORAGE_KEY = "weekend-gap:scenario:v1";
const standaloneMode = document.documentElement.dataset.weekendGapStandalone === "true";
const form = document.querySelector("#scenario-form");
const timelineRange = document.querySelector("#timeline-range");
const canvas = document.querySelector("#liquidity-chart");
const chartContext = canvas.getContext("2d");
const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
const elements = {
  title: document.querySelector("#scenario-title"),
  play: document.querySelector("#play-button"),
  timelineLabel: document.querySelector("#timeline-label"),
  immediate: document.querySelector("#immediate-value"),
  immediateDetail: document.querySelector("#immediate-detail"),
  queue: document.querySelector("#queue-value"),
  queueDetail: document.querySelector("#queue-detail"),
  ratio: document.querySelector("#ratio-value"),
  discount: document.querySelector("#discount-value"),
  outcomeSummary: document.querySelector("#outcome-summary"),
  settledTotal: document.querySelector("#settled-total-value"),
  finalQueue: document.querySelector("#final-queue-value"),
  peakQueue: document.querySelector("#peak-queue-value"),
  peakQueueHour: document.querySelector("#peak-queue-hour-value"),
  backlogHours: document.querySelector("#backlog-hours-value"),
  firstSettlement: document.querySelector("#first-settlement-value"),
  queueClear: document.querySelector("#queue-clear-value"),
  selectedGanttHour: document.querySelector("#selected-gantt-hour-value"),
  remainingReserve: document.querySelector("#remaining-reserve-value"),
  firstClosedFxHour: document.querySelector("#first-closed-fx-hour-value"),
  firstClosedBankHour: document.querySelector("#first-closed-bank-hour-value"),
  firstClosedIssuerHour: document.querySelector("#first-closed-issuer-hour-value"),
  firstClosedPayoutHour: document.querySelector("#first-closed-payout-hour-value"),
  outcomeExplanation: document.querySelector("#outcome-explanation"),
  gateSummary: document.querySelector("#gate-summary"),
  nextPayout: document.querySelector("#next-payout"),
  payoutExplanation: document.querySelector("#payout-explanation"),
  issuerGate: document.querySelector("#issuer-gate"),
  bankGate: document.querySelector("#bank-gate"),
  payoutGate: document.querySelector("#payout-gate"),
  fxGate: document.querySelector("#fx-gate"),
  table: document.querySelector("#timeline-table"),
  inputMessage: document.querySelector("#input-message")
};

let weekendReviewPacket = null;
let weekendReviewSequence = 0;
let weekendReviewDraftInvalid = false;
let scenario = { ...DEFAULT_SCENARIO };
let scenarioHistory = createScenarioHistory(scenario);
let simulation = runSimulation(scenario);
let baselineScenario = { ...scenario };
let comparison = compareScenarios(baselineScenario, scenario);
let reservePlan = null;
let windowShiftPreview = null;
let demandStepPreview = null;
let lastSensitivityRows = [];
let selectedHour = 0;
let playing = false;
let playTimer = null;
let userEdited = false;

function formatAud(value, compact = true) {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
  if (compact && safe >= 1000000) return `A$${(safe / 1000000).toFixed(safe >= 10000000 ? 0 : 1)}m`;
  if (compact && safe >= 1000) return `A$${(safe / 1000).toFixed(safe >= 100000 ? 0 : 1)}k`;
  return `A$${Math.round(safe).toLocaleString("en-AU")}`;
}

function formatPercent(value, decimals = 1) {
  return `${(Math.max(0, value) * 100).toFixed(decimals)}%`;
}

function writeForm() {
  for (const [field, value] of Object.entries(scenario)) {
    const input = form.elements.namedItem(field);
    if (!input) continue;
    if (input.type === "checkbox") input.checked = Boolean(value);
    else input.value = String(value);
    input.setAttribute("aria-invalid", "false");
  }
}

function readForm() {
  const raw = {};
  for (const field of Object.keys(DEFAULT_SCENARIO)) {
    const input = form.elements.namedItem(field);
    if (!input) {
      raw[field] = scenario[field];
      continue;
    }
    raw[field] = input.type === "checkbox" ? input.checked : input.value;
  }
  return raw;
}

function saveScenario() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenario));
    document.querySelector("#storage-status").textContent = "Current scenario saved locally.";
  } catch {
    document.querySelector("#storage-status").textContent = "Local autosave is unavailable. Edits remain in this tab; export a scenario or workspace to keep them.";
  }
}

function restoreScenario() {
  const fromHash = scenarioFromHash(window.location.hash);
  if (fromHash.scenario) {
    scenario = fromHash.scenario;
    setMessage("Loaded scenario from the share link.");
    return;
  }
  if (fromHash.errors.length) {
    setMessage(fromHash.errors[0]);
    return;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const restored = scenarioFromJSON(saved);
    if (restored.scenario) {
      scenario = restored.scenario;
      setMessage("Restored the last local scenario.");
    }
  } catch {
    setMessage("Saved local data could not be read. Defaults were kept.");
  }
}

function setMessage(message = "") {
  elements.inputMessage.textContent = message;
}

function setScenario(nextScenario, { normaliseForm = true, message = "", preserveShareHash = false, recordHistory = true, windowShiftStatus, demandStepStatus } = {}) {
  clearWeekendReview();
  weekendReviewDraftInvalid = false;
  const cleaned = sanitizeScenario(nextScenario);
  if (recordHistory) scenarioHistory.record(cleaned.scenario);
  scenario = cleaned.scenario;
  renderHistory();
  simulation = runSimulation(scenario);
  comparison = compareScenarios(baselineScenario, scenario);
  selectedHour = Math.min(selectedHour, SIMULATION_HOURS);
  if (!preserveShareHash && window.location.hash.startsWith("#scenario=")) {
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }
  if (normaliseForm) writeForm();
  saveScenario();
  render();
  renderPlanning();
  renderDiagnostics();
  renderDemandProfiles();
  document.querySelector("#sensitivity-rows").replaceChildren();
  document.querySelector("#sensitivity-tornado").innerHTML = "";
  lastSensitivityRows = [];
  document.querySelector("#sensitivity-status").textContent = "Assumptions changed. Run the experiment to refresh results.";
  clearWindowShiftPreview(windowShiftStatus || "Assumptions changed. Preview the window shift again before applying.");
  clearDemandStepPreview(demandStepStatus || "Assumptions changed. Preview the demand timing step again before applying.");
  if (message) setMessage(message);
  else if (cleaned.errors.length) setMessage(cleaned.errors.join(" "));
  else setMessage("");
  if (workspaceReady) saveWorkspace();
}

function applyGateDisplayLabels(redacted = false) {
  const labels = gateDisplayLabels(scenario, redacted);
  for (const key of Object.keys(GENERIC_GATE_LABELS)) {
    const live = document.querySelector(`#${key}-live-label`);
    const gantt = document.querySelector(`#${key}-gantt-live-label`);
    if (live) live.textContent = labels[key];
    if (gantt) gantt.textContent = labels[key];
  }
}

function gateText(open) {
  return open ? "Open" : "Closed";
}

function applyGateState(element, open) {
  element.textContent = gateText(open);
  element.className = open ? "state-open" : "state-closed";
}

function noPayoutExplanation(currentScenario, reserveRemainingAud) {
  if (reserveRemainingAud <= 0) return "No payout is available because the AUD reserve is exhausted.";
  const zeroThroughput = [
    [currentScenario.issuerThroughputAudPerHour, "issuer throughput"],
    [currentScenario.fxDepthAudPerHour, "FX depth"],
    [currentScenario.payoutThroughputAudPerHour, "payout throughput"]
  ].find(([capacity]) => capacity <= 0)?.[1];
  if (zeroThroughput) return `No payout is available because ${zeroThroughput} is zero.`;
  return "The edited business-hour windows do not overlap within the modeled search period.";
}

function currentScenarioHashError(error) {
  return error.replace("Defaults were kept.", "The current scenario was kept.");
}

function render() {
  const point = simulation.timeline[selectedHour];
  elements.title.textContent = scenario.name;
  timelineRange.value = String(selectedHour);
  timelineRange.setAttribute("aria-valuetext", point.timeLabel + ", hour " + selectedHour + " of 72");
  elements.timelineLabel.textContent = point.timeLabel;
  elements.immediate.textContent = formatAud(point.immediateAud);
  elements.immediateDetail.textContent = point.immediateAud > 0
    ? `${point.limitingGate} sets the hourly capacity`
    : "No complete issuer-to-AUD payout chain";
  elements.queue.textContent = formatAud(point.queuedAud);
  elements.queueDetail.textContent = `${formatAud(point.settledAud)} paid so far`;
  elements.ratio.textContent = formatPercent(point.liquidityRatio);
  elements.discount.textContent = formatPercent(point.discountBps / 10000, 2);
  const { totalDemandAud, totalSettledAud, finalQueuedAud, peakQueuedAud, peakQueueHour, hoursWithQueue, hoursToFirstSettlement, hoursToClearQueue } = simulation.summary;
  const settledShare = totalDemandAud > 0 ? totalSettledAud / totalDemandAud : 1;
  elements.outcomeSummary.textContent = `${formatPercent(settledShare)} of demand settled`;
  elements.settledTotal.textContent = formatAud(totalSettledAud, false);
  elements.finalQueue.textContent = formatAud(finalQueuedAud, false);
  elements.peakQueue.textContent = formatAud(peakQueuedAud, false);
  elements.peakQueueHour.textContent = peakQueuedAud > 0
    ? `${formatTime(peakQueueHour)} (hour ${peakQueueHour})`
    : "No queue in 72h";
  elements.backlogHours.textContent = `${hoursWithQueue} of ${SIMULATION_HOURS}`;
  elements.firstSettlement.textContent = hoursToFirstSettlement === null
    ? "No settlement in 72h"
    : `${hoursToFirstSettlement} hour${hoursToFirstSettlement === 1 ? "" : "s"}`;
  elements.queueClear.textContent = formatHoursToClearQueue(hoursToClearQueue, peakQueuedAud);
  if (elements.selectedGanttHour) {
    elements.selectedGanttHour.textContent = `${point.timeLabel} (hour ${selectedHour})`;
  }
  if (elements.remainingReserve) {
    elements.remainingReserve.textContent = formatAud(point.reserveRemainingAud);
  }
  if (elements.firstClosedFxHour) {
    const closedFxHour = firstClosedFxGanttHour(scenario);
    elements.firstClosedFxHour.textContent = closedFxHour === null
      ? "none"
      : `${formatTime(closedFxHour)} (hour ${closedFxHour})`;
  }
  if (elements.firstClosedBankHour) {
    const closedBankHour = firstClosedGanttHour(scenario);
    elements.firstClosedBankHour.textContent = closedBankHour === null
      ? "none"
      : `${formatTime(closedBankHour)} (hour ${closedBankHour})`;
  }
  if (elements.firstClosedIssuerHour) {
    const closedIssuerHour = firstClosedIssuerGanttHour(scenario);
    elements.firstClosedIssuerHour.textContent = closedIssuerHour === null
      ? "none"
      : `${formatTime(closedIssuerHour)} (hour ${closedIssuerHour})`;
  }
  if (elements.firstClosedPayoutHour) {
    const closedPayoutHour = firstClosedPayoutGanttHour(scenario);
    elements.firstClosedPayoutHour.textContent = closedPayoutHour === null
      ? "none"
      : `${formatTime(closedPayoutHour)} (hour ${closedPayoutHour})`;
  }
  const jumpFirst = document.querySelector("#jump-first-settlement");
  if (jumpFirst) {
    jumpFirst.disabled = hoursToFirstSettlement === null;
  }
  const jumpPeak = document.querySelector("#jump-peak");
  if (jumpPeak) {
    jumpPeak.disabled = !(peakQueuedAud > 0);
  }
  elements.outcomeExplanation.textContent = finalQueuedAud > 0
    ? `${formatAud(finalQueuedAud)} remains queued at ${formatTime(SIMULATION_HOURS)}. The peak queue was ${formatAud(peakQueuedAud)} at ${formatTime(peakQueueHour)}.`
    : `All synthetic demand settles within the 72-hour window. The peak queue was ${formatAud(peakQueuedAud)} at ${formatTime(peakQueueHour)}.`;
  elements.gateSummary.textContent = point.immediateAud > 0
    ? `Payout chain open · limited by ${point.limitingGate}`
    : `Payout chain closed · blocked at ${point.limitingGate}`;

  if (point.nextPayoutHour === selectedHour && point.immediateAud > 0) {
    elements.nextPayout.textContent = "Available now";
    elements.payoutExplanation.textContent = `A$${Math.round(point.immediateAud).toLocaleString("en-AU")} can move through the modeled chain this hour.`;
  } else if (point.nextPayoutHour === null) {
    elements.nextPayout.textContent = "Not found in seven days";
    elements.payoutExplanation.textContent = noPayoutExplanation(scenario, point.reserveRemainingAud);
  } else {
    const wait = point.nextPayoutHour - selectedHour;
    elements.nextPayout.textContent = `${formatTime(point.nextPayoutHour)} local`;
    elements.payoutExplanation.textContent = `The next complete issuer, bank and Australian AUD payout overlap begins in ${wait} hour${wait === 1 ? "" : "s"}.`;
  }

  applyGateState(elements.issuerGate, point.issuerOpen);
  applyGateState(elements.bankGate, point.bankOpen);
  applyGateState(elements.payoutGate, point.payoutOpen);
  applyGateDisplayLabels(false);
  elements.fxGate.textContent = !point.fxWeekday
    ? `${scenario.mondayHoliday && point.timeLabel.startsWith("Mon") ? "Holiday Monday" : scenario.saturdayHoliday && point.timeLabel.startsWith("Sat") ? "Holiday Saturday" : "Weekend"}: depth ÷ ${scenario.weekendFxMultiplier.toFixed(1)}, spread × ${scenario.weekendFxMultiplier.toFixed(1)}`
    : `${Math.round(point.fxSpreadBps)} bps weekday spread`;
  elements.fxGate.className = !point.fxWeekday ? "state-watch" : "state-open";
  const overlapNotice = weekendCloseOverlapNotice(scenario);
  const overlapNode = document.querySelector("#weekend-overlap-notice");
  if (overlapNode) {
    overlapNode.hidden = !overlapNotice;
    overlapNode.textContent = overlapNotice;
  }
  const mondaySaturdayNotice = mondaySaturdayHolidayNotice(scenario);
  const mondaySaturdayNode = document.querySelector("#monday-saturday-holiday-notice");
  if (mondaySaturdayNode) {
    mondaySaturdayNode.hidden = !mondaySaturdayNotice;
    mondaySaturdayNode.textContent = mondaySaturdayNotice;
  }

  for (const button of document.querySelectorAll("[data-preset]")) {
    button.classList.toggle("is-selected", Object.keys(PRESETS[button.dataset.preset]).every(key => PRESETS[button.dataset.preset][key] === scenario[key]));
  }
  renderTable();
  drawChart();
  renderGantt();
  renderCompareGantt();
  renderQueueSvg();
}

function renderTable() {
  const mode = document.querySelector("#table-density").value;
  const backlogOnly = Boolean(document.querySelector("#queue-backlog-only")?.checked);
  const peakHour = simulation.summary.peakQueueHour;
  const peakQueuedAud = simulation.summary.peakQueuedAud;
  const rowIndexes = new Set([selectedHour]);
  if (peakQueuedAud > 0) rowIndexes.add(peakHour);
  for (let hour = 0; hour <= SIMULATION_HOURS; hour += 1) {
    if (backlogOnly) {
      if (simulation.timeline[hour].queuedAud > 0) rowIndexes.add(hour);
      continue;
    }
    if(mode === "all" || (mode === "backlog" && simulation.timeline[hour].queuedAud > 0) || (mode === "snapshots" && hour % 6 === 0)) rowIndexes.add(hour);
  }
  const fragment = document.createDocumentFragment();
  [...rowIndexes].sort((a, b) => a - b).forEach((hour) => {
    const point = simulation.timeline[hour];
    const row = document.createElement("tr");
    const isPeak = peakQueuedAud > 0 && hour === peakHour;
    row.className = [hour === selectedHour ? "is-current" : "", isPeak ? "is-peak-queue" : ""].filter(Boolean).join(" ");
    const cells = [
      isPeak ? `${point.timeLabel} Peak queue` : point.timeLabel,
      formatAud(point.immediateAud),
      formatAud(point.queuedAud),
      formatPercent(point.liquidityRatio),
      formatPercent(point.discountBps / 10000, 2),
      point.immediateAud > 0 ? "Open" : `Blocked: ${point.limitingGate}`,
      formatAud(comparison.baseline.timeline[hour].queuedAud),
      formatAud(point.demandThisHour, false),
      formatAud(point.settledThisHour, false)
    ];
    cells.forEach((value, index) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      if (index === 5) cell.className = point.immediateAud > 0 ? "table-state state-open" : "table-state state-closed";
      row.append(cell);
    });
    fragment.append(row);
  });
  elements.table.replaceChildren(fragment);
  const note = document.querySelector("#peak-queue-row-note");
  if (note) {
    note.textContent = peakQueuedAud > 0
      ? `The highlighted row is the peak queue checkpoint at ${formatTime(peakHour)} (hour ${peakHour}).`
      : "No peak queue row is highlighted because demand never queued.";
  }
  const filterNote = document.querySelector("#queue-backlog-filter-note");
  if (filterNote) {
    const backlogCount = simulation.timeline.filter((point) => point.queuedAud > 0).length;
    filterNote.textContent = backlogOnly
      ? `Showing hours with backlog (${backlogCount} of ${SIMULATION_HOURS + 1} checkpoints). Dashboard counts are unchanged.`
      : `All checkpoints remain available. Use the backlog filter to hide hours with no queue. Dashboard counts are unchanged.`;
  }
}

function renderGantt() {
  const closedOnly = Boolean(document.querySelector("#gantt-closed-only")?.checked);
  const everyClosedOnly = Boolean(document.querySelector("#gantt-every-closed")?.checked);
  const hideWeekdayHours = Boolean(document.querySelector("#gantt-hide-weekdays")?.checked);
  const hideWeekendHours = Boolean(document.querySelector("#gantt-hide-weekends")?.checked);
  const hideOpenHours = Boolean(document.querySelector("#gantt-hide-open")?.checked);
  const hideClosedHours = Boolean(document.querySelector("#gantt-hide-closed")?.checked);
  const hideZeroQueueHours = Boolean(document.querySelector("#gantt-hide-zero-queue")?.checked);
  const hideBankClosedHours = Boolean(document.querySelector("#gantt-hide-bank-closed")?.checked);
  const hideIssuerClosedHours = Boolean(document.querySelector("#gantt-hide-issuer-closed")?.checked);
  const hidePayoutClosedHours = Boolean(document.querySelector("#gantt-hide-payout-closed")?.checked);
  const hideFxClosedHours = Boolean(document.querySelector("#gantt-hide-fx-closed")?.checked);
  const hidePayoutOpenHours = Boolean(document.querySelector("#gantt-hide-payout-open")?.checked);
  const rawGate = document.querySelector("#gantt-gate-filter")?.value || "all";
  const gateFilter = GANTT_GATE_FILTERS.includes(rawGate) ? rawGate : "all";
  document.querySelector("#gate-gantt").innerHTML = buildGateGanttSvg(scenario, selectedHour, { closedOnly, everyClosedOnly, hideWeekdayHours, hideWeekendHours, hideOpenHours, hideClosedHours, hideZeroQueueHours, hideBankClosedHours, hideIssuerClosedHours, hidePayoutClosedHours, hideFxClosedHours, hidePayoutOpenHours, gateFilter });
  const schedule = buildGateSchedule(scenario);
  const mode = document.querySelector("#gantt-density")?.value || "snapshots";
  const rowIndexes = new Set([selectedHour]);
  if (!closedOnly && !everyClosedOnly && !hideWeekdayHours && !hideWeekendHours && !hideOpenHours && !hideClosedHours && !hideZeroQueueHours && !hideBankClosedHours && !hideIssuerClosedHours && !hidePayoutClosedHours && !hideFxClosedHours && !hidePayoutOpenHours) {
    rowIndexes.add(0);
    rowIndexes.add(SIMULATION_HOURS);
  }
  for (let hour = 0; hour <= SIMULATION_HOURS; hour += 1) {
    const point = schedule.hours[hour];
    if (hideWeekdayHours && !ganttHourIsWeekend(point) && hour !== selectedHour) continue;
    if (hideWeekendHours && ganttHourIsWeekend(point) && hour !== selectedHour) continue;
    if (hideOpenHours && ganttHourOpenOnEveryGate(point) && hour !== selectedHour) continue;
    if (hideClosedHours && ganttHourClosedOnEveryGate(point) && hour !== selectedHour) continue;
    if (hideZeroQueueHours && ganttHourHasZeroQueue(simulation.timeline[hour]) && hour !== selectedHour) continue;
    if (hideBankClosedHours && ganttHourBankClosed(point) && hour !== selectedHour) continue;
    if (hideIssuerClosedHours && ganttHourIssuerClosed(point) && hour !== selectedHour) continue;
    if (hidePayoutClosedHours && ganttHourPayoutClosed(point) && hour !== selectedHour) continue;
    if (hideFxClosedHours && ganttHourFxClosed(point) && hour !== selectedHour) continue;
    if (hidePayoutOpenHours && ganttHourPayoutOpen(point) && hour !== selectedHour) continue;
    if (everyClosedOnly) {
      if (ganttHourClosedOnEveryGate(point)) rowIndexes.add(hour);
      continue;
    }
    if (closedOnly) {
      if (ganttHourClosedOnAnyGate(point)) rowIndexes.add(hour);
      continue;
    }
    if (mode === "all" || (mode === "snapshots" && hour % 6 === 0) || (mode === "open" && (point.issuerOpen || point.bankOpen || point.payoutOpen))) {
      rowIndexes.add(hour);
    }
  }
  const fragment = document.createDocumentFragment();
  [...rowIndexes].sort((a, b) => a - b).forEach((hour) => {
    const point = schedule.hours[hour];
    const row = document.createElement("tr");
    if (hour === selectedHour) row.className = "is-current";
    for (const value of [
      point.timeLabel,
      point.issuerOpen ? "Open" : "Closed",
      point.bankOpen ? "Open" : "Closed",
      point.payoutOpen ? "Open" : "Closed",
      point.fxWeekday ? "Weekday depth" : "Weekend thinned"
    ]) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }
    fragment.append(row);
  });
  document.querySelector("#gantt-table").replaceChildren(fragment);
  const firstOpen = simulation.timeline[0].nextPayoutHour;
  document.querySelector("#gantt-payout-note").textContent = firstOpen === null
    ? "No first payout window was found in the modeled search period."
    : `First payout window: ${formatTime(firstOpen)} (hour ${firstOpen}). The dashed green marker on the Gantt uses this hour.`;
  const filterNote = document.querySelector("#gantt-filter-note");
  if (filterNote) {
    const closedCount = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourClosedOnAnyGate(point)).length;
    const everyClosedCount = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourClosedOnEveryGate(point)).length;
    if (everyClosedOnly) {
      filterNote.textContent = `Showing hours where every gate is closed (${everyClosedCount} of ${SIMULATION_HOURS} chart hours). Uncheck to restore all hours. Display only. The model still contains ${SIMULATION_HOURS} hours.`;
    } else if (closedOnly) {
      filterNote.textContent = `Showing hours closed on at least one gate (${closedCount} of ${SIMULATION_HOURS} chart hours). The model still contains ${SIMULATION_HOURS} hours. This table and chart are a local drawing.`;
    } else {
      filterNote.textContent = `All ${SIMULATION_HOURS} model hours remain available. Use the closed-hours filter to hide fully open hours in this local drawing.`;
    }
    if (gateFilter !== "all") {
      const gateName = GENERIC_GATE_LABELS[gateFilter] || gateFilter;
      filterNote.textContent += ` Chart shows ${gateName} only. Simulation is unchanged.`;
    }
    if (hideWeekdayHours) {
      filterNote.textContent += ` Showing Saturday and Sunday hours only. Display only. The model still contains ${SIMULATION_HOURS} hours.`;
    }
    if (hideWeekendHours) {
      filterNote.textContent += ` Saturday and Sunday hours are hidden. Display only. The model still contains ${SIMULATION_HOURS} hours.`;
    }
    if (hideOpenHours) {
      filterNote.textContent += ` Hours open on every gate are hidden. Display only. The model still contains ${SIMULATION_HOURS} hours.`;
    }
    if (hideClosedHours) {
      filterNote.textContent += ` Hours closed on every gate are hidden. Display only. The model still contains ${SIMULATION_HOURS} hours.`;
    }
    if (hideZeroQueueHours) {
      filterNote.textContent += ` Hours whose synthetic queue is zero are hidden. Display only. The model still contains ${SIMULATION_HOURS} hours.`;
    }
    if (hideBankClosedHours) {
      filterNote.textContent += ` Hours where the bank gate is closed are hidden. Display only. The model still contains ${SIMULATION_HOURS} hours.`;
    }
    if (hideIssuerClosedHours) {
      filterNote.textContent += ` Hours where the issuer gate is closed are hidden. Display only. The model still contains ${SIMULATION_HOURS} hours.`;
    }
    if (hidePayoutClosedHours) {
      filterNote.textContent += ` Hours where the payout gate is closed are hidden. Display only. The model still contains ${SIMULATION_HOURS} hours.`;
    }
    if (hideFxClosedHours) {
      filterNote.textContent += ` Hours where the FX gate is closed are hidden. Display only. The model still contains ${SIMULATION_HOURS} hours.`;
    }
    if (hidePayoutOpenHours) {
      filterNote.textContent += ` Hours where the payout gate is open are hidden. Display only. The model still contains ${SIMULATION_HOURS} hours.`;
    }
  }
}

function gateCellLabel(open, fx = false) {
  if (fx) return open ? "Weekday depth" : "Weekend thinned";
  return open ? "Open" : "Closed";
}

function renderCompareGantt() {
  document.querySelector("#compare-gantt").innerHTML = buildComparisonGanttSvg(baselineScenario, scenario, selectedHour);
  const comparison = compareGateSchedules(baselineScenario, scenario);
  const rowIndexes = new Set([selectedHour]);
  comparison.hours.forEach((point) => {
    if (point.differs) rowIndexes.add(point.hour);
  });
  const fragment = document.createDocumentFragment();
  [...rowIndexes].sort((a, b) => a - b).forEach((hour) => {
    const point = comparison.hours[hour];
    const row = document.createElement("tr");
    if (hour === selectedHour) row.className = "is-current";
    for (const value of [
      point.timeLabel,
      gateCellLabel(point.current.issuerOpen),
      gateCellLabel(point.baseline.issuerOpen),
      gateCellLabel(point.current.bankOpen),
      gateCellLabel(point.baseline.bankOpen),
      gateCellLabel(point.current.payoutOpen),
      gateCellLabel(point.baseline.payoutOpen),
      gateCellLabel(point.current.fxWeekday, true),
      gateCellLabel(point.baseline.fxWeekday, true)
    ]) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }
    fragment.append(row);
  });
  document.querySelector("#compare-gantt-table").replaceChildren(fragment);
  document.querySelector("#compare-gantt-status").textContent = comparison.differingHours === 0
    ? "Current and baseline gate hours match. The table keeps the selected hour as a text equivalent."
    : `${comparison.differingHours} of 73 checkpoints differ between current and baseline. Matching hours are omitted except the selected hour.`;
}

function renderQueueSvg() {
  document.querySelector("#queue-svg").innerHTML = buildQueueChartSvg(scenario, baselineScenario, selectedHour);
}

function drawLine(context, points, getValue, color, dimensions, maximum) {
  const { left, top, width, height } = dimensions;
  context.beginPath();
  points.forEach((point, index) => {
    const x = left + (index / (points.length - 1)) * width;
    const y = top + height - (getValue(point) / maximum) * height;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.strokeStyle = color;
  context.lineWidth = 2.5;
  context.stroke();
}

function drawChart() {
  if (!chartContext) return;
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(bounds.width));
  const height = Math.max(1, Math.floor(bounds.height));
  if (canvas.width !== width * pixelRatio || canvas.height !== height * pixelRatio) {
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
  }
  chartContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  chartContext.clearRect(0, 0, width, height);

  const dimensions = { left: 52, top: 18, width: Math.max(1, width - 70), height: Math.max(1, height - 58) };
  const points = simulation.timeline;
  const maximum = Math.max(1, ...points.map((point) => Math.max(point.queuedAud, point.immediateAud)),
    ...comparison.baseline.timeline.map((point) => point.queuedAud));
  chartContext.font = "11px Arial, Helvetica, sans-serif";
  chartContext.fillStyle = "#aabac4";
  chartContext.strokeStyle = "rgba(211, 229, 235, 0.16)";
  chartContext.lineWidth = 1;

  for (let step = 0; step <= 4; step += 1) {
    const y = dimensions.top + (dimensions.height / 4) * step;
    chartContext.beginPath();
    chartContext.moveTo(dimensions.left, y);
    chartContext.lineTo(dimensions.left + dimensions.width, y);
    chartContext.stroke();
    const value = maximum * (1 - step / 4);
    chartContext.fillText(formatAud(value), 0, y + 4);
  }

  [0, 9, 33, 57, 72].forEach((hour) => {
    const x = dimensions.left + (hour / SIMULATION_HOURS) * dimensions.width;
    chartContext.fillText(formatTime(hour), Math.min(x, width - 46), height - 14);
  });

  drawLine(chartContext, points, (point) => point.queuedAud, "#f4b942", dimensions, maximum);
  drawLine(chartContext, points, (point) => point.immediateAud, "#64d59b", dimensions, maximum);
  chartContext.setLineDash([6, 4]);
  drawLine(chartContext, comparison.baseline.timeline, (point) => point.queuedAud, "#aac7ff", dimensions, maximum);
  chartContext.setLineDash([]);
  const selectedX = dimensions.left + (selectedHour / SIMULATION_HOURS) * dimensions.width;
  chartContext.beginPath();
  chartContext.moveTo(selectedX, dimensions.top);
  chartContext.lineTo(selectedX, dimensions.top + dimensions.height);
  chartContext.strokeStyle = "rgba(238, 244, 245, 0.62)";
  chartContext.lineWidth = 1;
  chartContext.stroke();
}

function setPlaying(nextPlaying) {
  if (nextPlaying && reducedMotion?.matches) {
    selectedHour = selectedHour >= SIMULATION_HOURS ? 0 : selectedHour + 1;
    render(); saveWorkspace(); return;
  }
  const wasPlaying = playing;
  playing = nextPlaying;
  elements.play.textContent = reducedMotion?.matches ? "Step hour" : playing ? "Pause" : "Play";
  elements.play.setAttribute("aria-pressed", String(playing));
  if (playTimer) window.clearInterval(playTimer);
  playTimer = null;
  if (!playing) { if (wasPlaying) saveWorkspace(); return; }
  playTimer = window.setInterval(() => {
    selectedHour = selectedHour >= SIMULATION_HOURS ? 0 : selectedHour + 1;
    render();
    if (selectedHour >= SIMULATION_HOURS) setPlaying(false);
  }, 700);
}

function downloadScenario() {
  const blob = new Blob([scenarioToJSON(scenario)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "weekend-gap-scenario.json";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setMessage("Scenario JSON exported.");
}

function planningAud(amount) {
  return `${amount.toLocaleString("en-US", { style: "currency", currency: "AUD" })} (rounded to cents)`;
}

function signedAud(amount) {
  const money = Math.abs(amount).toLocaleString("en-US", { style: "currency", currency: "AUD", minimumFractionDigits: 2 });
  return amount < 0 ? `(${money})` : amount > 0 ? `+${money}` : money;
}

function renderPlanning() {
  document.querySelector("#baseline-name").textContent = baselineScenario.name;
  const rows = [
    ["Starting reserve", comparison.baseline.scenario.reserveCashAud, scenario.reserveCashAud],
    ["Total demand", comparison.baseline.summary.totalDemandAud, simulation.summary.totalDemandAud],
    ["Settled by Monday 15:00", comparison.baseline.summary.totalSettledAud, simulation.summary.totalSettledAud],
    ["Remaining queue", comparison.baseline.summary.finalQueuedAud, simulation.summary.finalQueuedAud],
    ["Peak queue", comparison.baseline.summary.peakQueuedAud, simulation.summary.peakQueuedAud]
  ];
  document.querySelector("#comparison-rows").replaceChildren(...rows.map(([label, before, after]) => {
    const row = document.createElement("tr");
    for (const value of [label, before.toLocaleString("en-US", { style: "currency", currency: "AUD" }),
      after.toLocaleString("en-US", { style: "currency", currency: "AUD" }), signedAud(after - before)]) {
      const cell = document.createElement("td"); cell.textContent = value; row.append(cell);
    }
    return row;
  }), (() => {
    const row = document.createElement("tr");
    const before = comparison.baseline.summary.hoursToFirstSettlement;
    const after = simulation.summary.hoursToFirstSettlement;
    const delta = typeof before === "number" && typeof after === "number"
      ? after - before
      : before === after ? 0 : null;
    for (const value of [
      "Hours to first settlement",
      formatHoursToFirstSettlement(before),
      formatHoursToFirstSettlement(after),
      delta === null ? "Not comparable" : `${delta >= 0 ? "+" : ""}${delta}`
    ]) {
      const cell = document.createElement("td"); cell.textContent = value; row.append(cell);
    }
    return row;
  })(), (() => {
    const row = document.createElement("tr");
    const before = comparison.baseline.summary.hoursToClearQueue;
    const after = simulation.summary.hoursToClearQueue;
    const peakBefore = comparison.baseline.summary.peakQueuedAud;
    const peakAfter = simulation.summary.peakQueuedAud;
    const delta = typeof before === "number" && typeof after === "number"
      ? after - before
      : before === after ? 0 : null;
    for (const value of [
      "Hours to clear queue",
      formatHoursToClearQueue(before, peakBefore),
      formatHoursToClearQueue(after, peakAfter),
      delta === null ? "Not comparable" : `${delta >= 0 ? "+" : ""}${delta}`
    ]) {
      const cell = document.createElement("td"); cell.textContent = value; row.append(cell);
    }
    return row;
  })());
  document.querySelector("#changed-assumptions").textContent = comparison.changes.length
    ? comparison.changes.map(({ field, baseline, candidate }) => `${field}: ${baseline} to ${candidate}`).join("; ")
    : "No assumptions changed. Pin a baseline, then edit the scenario or choose a preset.";
  const output = document.querySelector("#reserve-result");
  const apply = document.querySelector("#apply-reserve");
  apply.disabled = true;
  reservePlan = null;
  try {
    reservePlan = planReserve(scenario, document.querySelector("#reserve-target").valueAsNumber,
      document.querySelector("#reserve-deadline").valueAsNumber);
    document.querySelector("#analysis-export").disabled = false;
    const p = reservePlan;
    const target = `${p.targetPercent}% of total 72-hour demand (${planningAud(p.targetAud)}) by ${formatTime(p.deadlineHour)}`;
    output.textContent = p.status === "reachable"
      ? `${target}: minimum starting reserve ${p.minimumReserveAud.toLocaleString("en-US", { style: "currency", currency: "AUD" })}. Change from current reserve: ${signedAud(p.reserveChangeAud)}. ${p.reason}`
      : `${target}: unreachable by reserve alone. Maximum modeled settlement: ${planningAud(p.maximumSettledAud)}. ${p.reason}`;
    apply.disabled = p.status !== "reachable" || p.minimumReserveAud === scenario.reserveCashAud;
  } catch (error) {
    output.textContent = error instanceof RangeError ? error.message : "Reserve analysis could not be calculated.";
    document.querySelector("#analysis-export").disabled = true;
  }
}

document.querySelector("#pin-baseline").addEventListener("click", () => {
  baselineScenario = { ...scenario };
  comparison = compareScenarios(baselineScenario, scenario);
  renderPlanning(); render();
  saveWorkspace();
});
document.querySelector("#restore-baseline").addEventListener("click", () => {
  setScenario(baselineScenario, { message: "Baseline restored to the scenario editor." });
});
for (const id of ["reserve-target", "reserve-deadline"]) {
  document.getElementById(id).addEventListener("input", () => { renderPlanning(); saveWorkspace(); });
}
document.querySelector("#apply-reserve").addEventListener("click", () => {
  if (reservePlan?.status !== "reachable") return;
  setScenario({ ...scenario, reserveCashAud: reservePlan.minimumReserveAud }, { message: "Calculated reserve applied. Other scenario assumptions and baseline were kept." });
});
document.querySelector("#analysis-export").addEventListener("click", () => {
  if (!reservePlan) return;
  const blob = new Blob([analysisToJSON(baselineScenario, scenario, reservePlan.targetPercent, reservePlan.deadlineHour)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.download = "weekend-gap-analysis.json";
  document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  setMessage("Analysis exported with both scenarios, changed assumptions, hourly queue comparison, and reserve plan.");
});

function hourDeltaLabel(delta) {
  return delta === null ? "Not comparable" : `${delta >= 0 ? "+" : ""}${delta}`;
}

document.querySelector("#compare-scenario-files").addEventListener("click", async () => {
  const fileA = document.querySelector("#compare-file-a").files?.[0];
  const fileB = document.querySelector("#compare-file-b").files?.[0];
  const status = document.querySelector("#file-compare-status");
  const body = document.querySelector("#file-compare-rows");
  if (!fileA || !fileB) {
    status.textContent = "Choose two scenario JSON files before comparing.";
    return;
  }
  if (fileA.size > 250000 || fileB.size > 250000) {
    status.textContent = "Compare failed. Each scenario file must be 250 KB or smaller.";
    body.replaceChildren();
    return;
  }
  try {
    const result = compareScenarioFiles(await fileA.text(), await fileB.text());
    if (!result.comparison) {
      status.textContent = "Compare failed: " + result.errors.join(" ");
      body.replaceChildren();
      return;
    }
    const left = result.comparison.baseline.summary;
    const right = result.comparison.candidate.summary;
    body.replaceChildren(...[
      ["Peak queue", planningAud(left.peakQueuedAud), planningAud(right.peakQueuedAud), signedAud(result.deltas.peakQueuedAud)],
      ["Remaining queue", planningAud(left.finalQueuedAud), planningAud(right.finalQueuedAud), signedAud(result.deltas.finalQueuedAud)],
      ["Settled total", planningAud(left.totalSettledAud), planningAud(right.totalSettledAud), signedAud(result.deltas.totalSettledAud)],
      ["Hours to first settlement", formatHoursToFirstSettlement(left.hoursToFirstSettlement), formatHoursToFirstSettlement(right.hoursToFirstSettlement), hourDeltaLabel(result.deltas.hoursToFirstSettlement)],
      ["Hours to clear queue", formatHoursToClearQueue(left.hoursToClearQueue, left.peakQueuedAud), formatHoursToClearQueue(right.hoursToClearQueue, right.peakQueuedAud), hourDeltaLabel(result.deltas.hoursToClearQueue)]
    ].map((cells) => {
      const row = document.createElement("tr");
      for (const value of cells) {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.append(cell);
      }
      return row;
    }));
    const leftName = result.comparison.baseline.scenario.name;
    const rightName = result.comparison.candidate.scenario.name;
    status.textContent = `Compared ${leftName} (file A) with ${rightName} (file B). Mixed settlement or queue-clear hours stay not comparable. This is not a ranking of issuers.`;
  } catch {
    status.textContent = "Compare failed. Choose two readable scenario JSON files.";
    body.replaceChildren();
  }
});

document.querySelector("#compare-three-scenario-files").addEventListener("click", async () => {
  const baselineFile = document.querySelector("#compare-file-baseline").files?.[0];
  const currentFile = document.querySelector("#compare-file-current").files?.[0];
  const importedFile = document.querySelector("#compare-file-imported").files?.[0];
  const status = document.querySelector("#three-file-compare-status");
  const body = document.querySelector("#three-file-compare-rows");
  if (!baselineFile || !currentFile || !importedFile) {
    status.textContent = "Choose three scenario JSON files before comparing.";
    return;
  }
  if (baselineFile.size > 250000 || currentFile.size > 250000 || importedFile.size > 250000) {
    status.textContent = "Compare failed. Each scenario file must be 250 KB or smaller.";
    body.replaceChildren();
    return;
  }
  try {
    const result = compareThreeScenarioFiles(await baselineFile.text(), await currentFile.text(), await importedFile.text());
    if (!result.runs) {
      status.textContent = "Compare failed: " + result.errors.join(" ");
      body.replaceChildren();
      return;
    }
    const peakHour = (run) => run.peakQueueHour === null ? "" : formatTime(run.peakQueueHour);
    body.replaceChildren(...[
      ["Name", result.runs[0].name, result.runs[1].name, result.runs[2].name],
      ["Peak queue", planningAud(result.runs[0].peakQueuedAud), planningAud(result.runs[1].peakQueuedAud), planningAud(result.runs[2].peakQueuedAud)],
      ["Remaining queue", planningAud(result.runs[0].finalQueuedAud), planningAud(result.runs[1].finalQueuedAud), planningAud(result.runs[2].finalQueuedAud)],
      ["Settled total", planningAud(result.runs[0].totalSettledAud), planningAud(result.runs[1].totalSettledAud), planningAud(result.runs[2].totalSettledAud)],
      ["Hours to first settlement", formatHoursToFirstSettlement(result.runs[0].hoursToFirstSettlement), formatHoursToFirstSettlement(result.runs[1].hoursToFirstSettlement), formatHoursToFirstSettlement(result.runs[2].hoursToFirstSettlement)],
      ["Hours to clear queue", formatHoursToClearQueue(result.runs[0].hoursToClearQueue, result.runs[0].peakQueuedAud), formatHoursToClearQueue(result.runs[1].hoursToClearQueue, result.runs[1].peakQueuedAud), formatHoursToClearQueue(result.runs[2].hoursToClearQueue, result.runs[2].peakQueuedAud)],
      ["Peak queue hour", peakHour(result.runs[0]), peakHour(result.runs[1]), peakHour(result.runs[2])]
    ].map((cells) => {
      const row = document.createElement("tr");
      for (const value of cells) {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.append(cell);
      }
      return row;
    }));
    status.textContent = `Compared ${result.runs[0].name}, ${result.runs[1].name} and ${result.runs[2].name}. The open scenario was not replaced. Null queue or settlement hours stay empty rather than treated as zero.`;
  } catch {
    status.textContent = "Compare failed. Choose three readable scenario JSON files.";
    body.replaceChildren();
  }
});

function clearWindowShiftPreview(status = "Choose a gate and whole-hour offsets, then preview. Nothing is applied until you confirm.") {
  windowShiftPreview = null;
  const apply = document.querySelector("#apply-window-shift");
  const rows = document.querySelector("#window-shift-rows");
  const output = document.querySelector("#window-shift-status");
  if (apply) apply.disabled = true;
  if (rows) rows.replaceChildren();
  if (output) output.textContent = status;
}

document.querySelector("#preview-window-shift").addEventListener("click", () => {
  const gate = document.querySelector("#window-shift-gate").value;
  const startDelta = document.querySelector("#window-shift-start").valueAsNumber;
  const endDelta = document.querySelector("#window-shift-end").valueAsNumber;
  try {
    if (!Number.isInteger(startDelta) || !Number.isInteger(endDelta)) {
      throw new RangeError("Window shifts must be whole hours.");
    }
    windowShiftPreview = previewWindowShift(scenario, gate, startDelta, endDelta);
    const preview = windowShiftPreview;
    document.querySelector("#window-shift-rows").replaceChildren(...[
      ["Operating window", `${preview.current.startHour}:00-${preview.current.endHour}:00`, `${preview.candidate.startHour}:00-${preview.candidate.endHour}:00`, `${startDelta >= 0 ? "+" : ""}${startDelta} / ${endDelta >= 0 ? "+" : ""}${endDelta} h`],
      ["Peak queue", planningAud(preview.current.peakQueuedAud), planningAud(preview.candidate.peakQueuedAud), signedAud(preview.deltas.peakQueuedAud)],
      ["Settled total", planningAud(preview.current.totalSettledAud), planningAud(preview.candidate.totalSettledAud), signedAud(preview.deltas.totalSettledAud)],
      ["Hours to first settlement", formatHoursToFirstSettlement(preview.current.hoursToFirstSettlement), formatHoursToFirstSettlement(preview.candidate.hoursToFirstSettlement), preview.deltas.hoursToFirstSettlement === null ? "Not comparable" : `${preview.deltas.hoursToFirstSettlement >= 0 ? "+" : ""}${preview.deltas.hoursToFirstSettlement}`]
    ].map((cells) => {
      const row = document.createElement("tr");
      for (const value of cells) {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.append(cell);
      }
      return row;
    }));
    document.querySelector("#apply-window-shift").disabled = preview.applied.issuerOpenStartHour === scenario.issuerOpenStartHour
      && preview.applied.issuerOpenEndHour === scenario.issuerOpenEndHour
      && preview.applied.bankOpenStartHour === scenario.bankOpenStartHour
      && preview.applied.bankOpenEndHour === scenario.bankOpenEndHour
      && preview.applied.payoutOpenStartHour === scenario.payoutOpenStartHour
      && preview.applied.payoutOpenEndHour === scenario.payoutOpenEndHour;
    document.querySelector("#window-shift-status").textContent = `Preview only. ${preview.gate} window becomes ${preview.candidate.startHour}:00 to ${preview.candidate.endHour}:00 local. Peak queue change ${signedAud(preview.deltas.peakQueuedAud)}; settled total change ${signedAud(preview.deltas.totalSettledAud)}. Apply to copy this window into the editor.`;
  } catch (error) {
    clearWindowShiftPreview(error instanceof RangeError ? error.message : "Window shift could not be previewed.");
  }
});
document.querySelector("#apply-window-shift").addEventListener("click", () => {
  if (!windowShiftPreview) return;
  const gate = windowShiftPreview.gate;
  const next = windowShiftPreview.applied;
  const start = next[`${gate}OpenStartHour`];
  const end = next[`${gate}OpenEndHour`];
  const notice = `Applied ${gate} window ${start}:00 to ${end}:00. Other assumptions and the pinned baseline were kept. Undo scenario edit reverts this window shift.`;
  setScenario(next, { message: notice, windowShiftStatus: notice });
});
for (const id of ["window-shift-gate", "window-shift-start", "window-shift-end"]) {
  document.getElementById(id).addEventListener("input", () => {
    clearWindowShiftPreview("Offsets changed. Preview again before applying.");
  });
}

function clearDemandStepPreview(status = "Preview an adjacent arrival profile. Friday burst is earlier, Monday rush is later, and flat sits between them. Nothing is applied until you confirm. There is no randomness.") {
  demandStepPreview = null;
  const apply = document.querySelector("#apply-demand-step");
  const rows = document.querySelector("#demand-step-rows");
  const output = document.querySelector("#demand-step-status");
  if (apply) apply.disabled = true;
  if (rows) rows.replaceChildren();
  if (output) output.textContent = status;
}

function previewDemandStep(direction) {
  try {
    demandStepPreview = previewDemandProfileStep(scenario, direction);
    const preview = demandStepPreview;
    document.querySelector("#demand-step-rows").replaceChildren(...[
      ["Arrival profile", preview.currentProfile, preview.candidateProfile, preview.unchanged ? "Already at this end" : preview.direction],
      ["Peak queue", planningAud(preview.current.peakQueuedAud), planningAud(preview.candidate.peakQueuedAud), signedAud(preview.deltas.peakQueuedAud)],
      ["Settled total", planningAud(preview.current.totalSettledAud), planningAud(preview.candidate.totalSettledAud), signedAud(preview.deltas.totalSettledAud)],
      ["Hours to first settlement", formatHoursToFirstSettlement(preview.current.hoursToFirstSettlement), formatHoursToFirstSettlement(preview.candidate.hoursToFirstSettlement), hourDeltaLabel(preview.deltas.hoursToFirstSettlement)]
    ].map((cells) => {
      const row = document.createElement("tr");
      for (const value of cells) {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.append(cell);
      }
      return row;
    }));
    document.querySelector("#apply-demand-step").disabled = preview.unchanged;
    document.querySelector("#demand-step-status").textContent = preview.unchanged
      ? `Already at the ${preview.direction} end of the arrival profiles. Total demand is unchanged. There is no randomness.`
      : `Preview only. Arrival profile becomes ${preview.candidateProfile}. Peak queue change ${signedAud(preview.deltas.peakQueuedAud)}; settled total change ${signedAud(preview.deltas.totalSettledAud)}. Apply to copy this timing into the editor. There is no randomness.`;
  } catch (error) {
    clearDemandStepPreview(error instanceof RangeError ? error.message : "Demand timing step could not be previewed.");
  }
}

document.querySelector("#preview-demand-earlier").addEventListener("click", () => previewDemandStep("earlier"));
document.querySelector("#preview-demand-later").addEventListener("click", () => previewDemandStep("later"));
document.querySelector("#apply-demand-step").addEventListener("click", () => {
  if (!demandStepPreview || demandStepPreview.unchanged) return;
  const next = demandStepPreview.applied;
  const notice = `Applied ${next.demandProfile} demand timing. Other assumptions and the pinned baseline were kept. Undo scenario edit reverts this timing step.`;
  setScenario(next, { message: notice, demandStepStatus: notice });
});

async function copyShareLink() {
  const hash = scenarioToHash(scenario);
  const url = `${window.location.origin}${window.location.pathname}${hash}`;
  history.replaceState(null, "", hash);
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(url);
    setMessage("Share link copied. It contains only the editable scenario.");
  } catch {
    window.prompt("Copy this scenario link", url);
    setMessage("Share link is ready to copy.");
  }
}

async function importScenario(file) {
  if (!file) return;
  if (file.size > 250_000) {
    setMessage("Import failed. Scenario JSON must be 250 KB or smaller.");
    return;
  }
  try {
    const imported = scenarioFromJSON(await file.text());
    if (!imported.scenario) {
      setMessage(imported.errors[0]);
      return;
    }
    userEdited = true;
    setScenario(imported.scenario, { message: imported.errors.length ? `Scenario imported with adjustments: ${imported.errors.join(" ")}` : "Scenario imported." });
  } catch {
    setMessage("Import failed. Choose a readable JSON file.");
  }
}

function applyFormEdit(normaliseForm) {
  clearWeekendReview();
  const raw = readForm();
  let invalid = false;
  for (const field of Object.keys(DEFAULT_SCENARIO)) {
    const input = form.elements.namedItem(field);
    if (!input || typeof DEFAULT_SCENARIO[field] !== "number") continue;
    const valid = typeof raw[field] === "string" && raw[field].trim() !== "" && Number.isFinite(Number(raw[field]));
    input.setAttribute("aria-invalid", String(!valid));
    if (!valid) invalid = true;
  }
  weekendReviewDraftInvalid = invalid;
  if (invalid) { setMessage("Complete the highlighted numeric assumptions with finite numbers. The previous simulation is kept."); return; }
  userEdited = true;
  setScenario(raw, { normaliseForm });
}
form.addEventListener("input", () => applyFormEdit(false));
form.addEventListener("change", () => applyFormEdit(true));
form.addEventListener("submit", event => event.preventDefault());

timelineRange.addEventListener("input", () => {
  selectedHour = Number(timelineRange.value);
  setPlaying(false);
  render();
  saveWorkspace();
});

elements.play.addEventListener("click", () => setPlaying(!playing));

document.querySelector("#reset-button").addEventListener("click", () => {
  userEdited = true;
  selectedHour = 0;
  setPlaying(false);
  setScenario(DEFAULT_SCENARIO, { message: "Scenario reset to Normal Friday." });
});

document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    userEdited = true;
    selectedHour = 0;
    setPlaying(false);
    setScenario(PRESETS[button.dataset.preset], { message: `${PRESETS[button.dataset.preset].name} applied.` });
  });
});

document.querySelector("#export-button").addEventListener("click", downloadScenario);
document.querySelector("#import-button").addEventListener("click", () => document.querySelector("#import-file").click());
const shareButton = document.querySelector("#share-button");
if (standaloneMode) {
  shareButton.disabled = true;
  shareButton.title = "Sharing is unavailable in the standalone file. Export JSON instead.";
  shareButton.textContent = "Sharing unavailable in standalone file";
} else {
  shareButton.addEventListener("click", copyShareLink);
}
document.querySelector("#import-file").addEventListener("change", (event) => { const file = event.target.files?.[0]; event.target.value = ""; return importScenario(file); });

if (!standaloneMode) {
  window.addEventListener("hashchange", () => {
    const fromHash = scenarioFromHash(window.location.hash);
    if (!fromHash.scenario) {
      if (fromHash.errors.length) setMessage(currentScenarioHashError(fromHash.errors[0]));
      return;
    }
    selectedHour = 0;
    setPlaying(false);
    setScenario(fromHash.scenario, { message: "Loaded scenario from the share link.", preserveShareHash: true });
  });
}

window.addEventListener("resize", drawChart);

restoreScenario();
baselineScenario = { ...scenario };
simulation = runSimulation(scenario);
comparison = compareScenarios(baselineScenario, scenario);
writeForm();
render();
renderPlanning();
if (!userEdited && !window.location.hash) saveScenario();

function renderDiagnostics() {
  const d = analyzeTimeline(scenario);
  document.querySelector("#diagnostic-summary").textContent = d.backlogIntervals + " of 72 intervals end with backlog. Longest uninterrupted run: " + d.longestBacklogRun + " hours. Queue exposure: " + formatAud(d.queueAudHours, false) + "·hours.";
  const list = document.querySelector("#bottleneck-list");
  list.replaceChildren(...d.blockers.map(item => {
    const li = document.createElement("li"); li.textContent = item.label + ": " + item.intervals + " backlog intervals"; return li;
  }));
  if (!d.blockers.length) list.textContent = "No end-of-hour backlog in this run.";
  document.querySelector("#milestone-summary").textContent = [
    ["First backlog",d.firstBacklogHour], ["Reserve exhausted",d.reserveExhaustionHour], ["Last settlement checkpoint",d.lastSettlementHour]
  ].map(([label,hour])=>label + ": " + (hour === null ? "not observed" : formatTime(hour))).join(". ");
  const attribution = attributeBottlenecks(scenario);
  const active = attribution.rows.filter((row) => row.hours > 0);
  document.querySelector("#bottleneck-hours").replaceChildren(...attribution.rows.map((row) => {
    const tr = document.createElement("tr");
    for (const value of [row.label, String(row.hours), `${(row.share * 100).toFixed(1)}%`]) {
      const td = document.createElement("td");
      td.textContent = value;
      tr.append(td);
    }
    return tr;
  }));
  document.querySelector("#bottleneck-explanation").textContent = active.length
    ? `Of 72 hours, ${active.map((row) => `${row.hours} were limited by ${row.label}`).join(", ")}. Hours labeled none had no recorded limiter. This does not say which assumption to change.`
    : "No limiting-gate hours were recorded for this run.";
}

function formatHoursToFirstSettlement(hours) {
  return hours === null ? "No settlement in 72h" : `${hours} hour${hours === 1 ? "" : "s"}`;
}

function formatHoursToClearQueue(hours, peakQueuedAud = 0) {
  if (hours === null) return peakQueuedAud > 0 ? "queue remains" : "No queue in 72h";
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

function renderDemandProfiles() {
  const rows = compareDemandProfiles(scenario);
  document.querySelector("#demand-compare-rows").replaceChildren(...rows.map((item) => {
    const tr = document.createElement("tr");
    if (item.demandProfile === scenario.demandProfile) tr.className = "is-current";
    for (const value of [
      item.label,
      planningAud(item.peakQueuedAud),
      planningAud(item.finalQueuedAud),
      planningAud(item.totalSettledAud),
      formatHoursToFirstSettlement(item.hoursToFirstSettlement)
    ]) {
      const td = document.createElement("td");
      td.textContent = value;
      tr.append(td);
    }
    return tr;
  }));
  document.querySelector("#demand-compare-status").textContent = "Highlighted row is the currently selected arrival profile. The other two rows are the same scenario with only demand timing changed. This is not a forecast.";
}
renderDiagnostics();
renderDemandProfiles();

function renderSensitivityTornado() {
  const metric = document.querySelector("#sensitivity-metric").value;
  document.querySelector("#sensitivity-tornado").innerHTML = lastSensitivityRows.length
    ? buildSensitivityBarsSvg(lastSensitivityRows, metric)
    : "";
}

document.querySelector("#run-sensitivity").addEventListener("click", () => {
  const field = document.querySelector("#sensitivity-field").value;
  lastSensitivityRows = runSensitivity(scenario, field);
  document.querySelector("#sensitivity-rows").replaceChildren(...lastSensitivityRows.map(result => {
    const row = document.createElement("tr");
    for (const value of [result.multiplier * 100 + "%", planningAud(result.effectiveValue) + (result.adjusted ? " (capped)" : ""),
      planningAud(result.summary.totalSettledAud), planningAud(result.summary.peakQueuedAud),
      planningAud(result.summary.finalQueuedAud), signedAud(result.settlementDeltaAud)]) {
      const cell=document.createElement("td");cell.textContent=value;row.append(cell);
    }
    const cell=document.createElement("td"), button=document.createElement("button");
    button.type="button";button.textContent="Apply " + result.multiplier * 100 + "%";
    button.addEventListener("click",()=>setScenario(result.scenario,{message:"Sensitivity case applied. The pinned baseline was kept."}));
    cell.append(button);row.append(cell);return row;
  }));
  renderSensitivityTornado();
  document.querySelector("#sensitivity-status").textContent = "Five cases around the current scenario. All other assumptions held fixed. Bars and table use the same cases. Changes are relative to the current scenario, not the pinned baseline.";
});
document.querySelector("#sensitivity-field").addEventListener("change",()=>{
  lastSensitivityRows = [];
  document.querySelector("#sensitivity-rows").replaceChildren();
  document.querySelector("#sensitivity-tornado").innerHTML = "";
  document.querySelector("#sensitivity-status").textContent="Run the experiment for the selected assumption.";
});
document.querySelector("#sensitivity-metric").addEventListener("change", renderSensitivityTornado);

const LIBRARY_KEY = "weekend-gap:library:v1";
let scenarioLibrary = [];
function persistLibrary() {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify({ format: "weekend-gap-library", version: 1, scenarios: scenarioLibrary }));
    document.querySelector("#library-status").textContent = "Saved on this browser. " + scenarioLibrary.length + " of 12 slots used.";
  } catch { document.querySelector("#library-status").textContent = "Library changes are in memory only. Browser storage is unavailable; export important scenarios."; }
}
function renderLibrary() {
  const makeOptions = () => scenarioLibrary.map((item,index)=>{
    const option=document.createElement("option");option.value=String(index);option.textContent=(index+1)+". "+item.name;return option;
  });
  document.querySelector("#scenario-library").replaceChildren(...makeOptions());
  document.querySelector("#experiment-picks").replaceChildren(...makeOptions());
  document.querySelector("#load-library").disabled = scenarioLibrary.length === 0;
  document.querySelector("#delete-library").disabled = scenarioLibrary.length === 0;
  document.querySelector("#save-library").disabled = scenarioLibrary.length >= 12;
  document.querySelector("#compare-experiments").disabled = scenarioLibrary.length < 2;
}
document.querySelector("#save-library").addEventListener("click",()=>{
  if(scenarioLibrary.length>=12) return;
  scenarioLibrary.push({...scenario});persistLibrary();renderLibrary();
  document.querySelector("#scenario-library").value=String(scenarioLibrary.length-1);
});
document.querySelector("#compare-experiments").addEventListener("click",()=>{
  const picked = [...document.querySelector("#experiment-picks").children].filter((option) => option.selected).map((option) => Number(option.value));
  const unique = [...new Set(picked)].filter((index) => Number.isInteger(index) && index >= 0 && index < scenarioLibrary.length);
  if (unique.length < 2 || unique.length > 3) {
    document.querySelector("#experiment-compare-status").textContent = "Select two or three library copies, then compare.";
    return;
  }
  try {
    const rows = compareSavedExperiments(unique.map((index) => scenarioLibrary[index]));
    document.querySelector("#experiment-compare-rows").replaceChildren(...rows.map((item) => {
      const tr = document.createElement("tr");
      for (const value of [
        item.name,
        planningAud(item.peakQueuedAud),
        planningAud(item.finalQueuedAud),
        planningAud(item.totalSettledAud),
        item.hoursToFirstSettlement === null ? "No settlement in 72h" : `${item.hoursToFirstSettlement} hour${item.hoursToFirstSettlement === 1 ? "" : "s"}`
      ]) {
        const td = document.createElement("td");
        td.textContent = value;
        tr.append(td);
      }
      return tr;
    }));
    document.querySelector("#experiment-compare-status").textContent = `Compared ${rows.length} synthetic library copies. This is not a ranking of real issuers.`;
  } catch (error) {
    document.querySelector("#experiment-compare-status").textContent = error instanceof RangeError ? error.message : "The selected copies could not be compared.";
  }
});
document.querySelector("#load-library").addEventListener("click",()=>{
  const saved=scenarioLibrary[Number(document.querySelector("#scenario-library").value)];
  if(saved) setScenario(saved,{message:"Saved scenario loaded. The pinned baseline was kept."});
});
document.querySelector("#delete-library").addEventListener("click",()=>{
  const index=Number(document.querySelector("#scenario-library").value);
  if(!Number.isInteger(index)||index<0||index>=scenarioLibrary.length) return;
  scenarioLibrary.splice(index,1);persistLibrary();renderLibrary();
});
try {
  const raw=localStorage.getItem(LIBRARY_KEY);
  if(raw) {
    const restored=libraryFromJSON(raw);
    if(restored.scenarios) scenarioLibrary=restored.scenarios;
    document.querySelector("#library-status").textContent=restored.errors.length ? "Saved library: "+restored.errors.join(" ") : "Restored "+scenarioLibrary.length+" saved scenarios.";
  }
} catch { document.querySelector("#library-status").textContent="Saved library could not be read. Existing browser data was kept."; }
renderLibrary();

function currentWorkspace() {
  return workspaceToJSON(scenario,baselineScenario,{ targetPercent:document.querySelector("#reserve-target").valueAsNumber,
    deadlineHour:document.querySelector("#reserve-deadline").valueAsNumber, selectedHour, ganttHourIndex: selectedHour, notes:document.querySelector("#workspace-notes").value,
    ganttDensity: document.querySelector("#gantt-density").value,
    selectedChart: document.querySelector("#selected-chart").value,
    ganttClosedOnly: Boolean(document.querySelector("#gantt-closed-only")?.checked),
    ganttGateFilter: GANTT_GATE_FILTERS.includes(document.querySelector("#gantt-gate-filter")?.value) ? document.querySelector("#gantt-gate-filter").value : "all",
    queueBacklogOnly: Boolean(document.querySelector("#queue-backlog-only")?.checked),
    ganttEveryGateClosed: Boolean(document.querySelector("#gantt-every-closed")?.checked),
    hideWeekdayGanttHours: Boolean(document.querySelector("#gantt-hide-weekdays")?.checked),
    hideWeekendGanttHours: Boolean(document.querySelector("#gantt-hide-weekends")?.checked),
    hideOpenGanttHours: Boolean(document.querySelector("#gantt-hide-open")?.checked),
    hideClosedGanttHours: Boolean(document.querySelector("#gantt-hide-closed")?.checked),
    hideZeroQueueGanttHours: Boolean(document.querySelector("#gantt-hide-zero-queue")?.checked),
    hideBankClosedGanttHours: Boolean(document.querySelector("#gantt-hide-bank-closed")?.checked),
    hideIssuerClosedGanttHours: Boolean(document.querySelector("#gantt-hide-issuer-closed")?.checked),
    hidePayoutClosedGanttHours: Boolean(document.querySelector("#gantt-hide-payout-closed")?.checked),
    hideFxClosedGanttHours: Boolean(document.querySelector("#gantt-hide-fx-closed")?.checked),
    hidePayoutOpenGanttHours: Boolean(document.querySelector("#gantt-hide-payout-open")?.checked) });
}
function saveWorkspace() {
  if(!workspaceReady) return;
  try {
    let serialized;
    let controlsValid = true;
    try {
      serialized = currentWorkspace();
      const saved = JSON.parse(serialized);
      lastValidPlan = { targetPercent: saved.targetPercent, deadlineHour: saved.deadlineHour, ganttDensity: saved.ganttDensity, selectedHour: saved.selectedHour, ganttHourIndex: saved.ganttHourIndex ?? saved.selectedHour, selectedChart: saved.selectedChart, ganttClosedOnly: saved.ganttClosedOnly === true, ganttGateFilter: GANTT_GATE_FILTERS.includes(saved.ganttGateFilter) ? saved.ganttGateFilter : "all", queueBacklogOnly: saved.queueBacklogOnly === true, ganttEveryGateClosed: saved.ganttEveryGateClosed === true, hideWeekdayGanttHours: saved.hideWeekdayGanttHours === true, hideWeekendGanttHours: saved.hideWeekendGanttHours === true, hideOpenGanttHours: saved.hideOpenGanttHours === true, hideClosedGanttHours: saved.hideClosedGanttHours === true, hideZeroQueueGanttHours: saved.hideZeroQueueGanttHours === true, hideBankClosedGanttHours: saved.hideBankClosedGanttHours === true, hideIssuerClosedGanttHours: saved.hideIssuerClosedGanttHours === true, hidePayoutClosedGanttHours: saved.hidePayoutClosedGanttHours === true, hideFxClosedGanttHours: saved.hideFxClosedGanttHours === true, hidePayoutOpenGanttHours: saved.hidePayoutOpenGanttHours === true };
    } catch {
      controlsValid = false;
      serialized = workspaceToJSON(scenario, baselineScenario, { ...lastValidPlan, selectedHour, ganttHourIndex: selectedHour, notes: document.querySelector("#workspace-notes").value });
    }
    localStorage.setItem(WORKSPACE_KEY, serialized);
    document.querySelector("#workspace-status").textContent = controlsValid
      ? "Workspace autosaved locally, including the baseline, notes and reserve target."
      : "Scenario edits saved. Incomplete planner fields were excluded; the last valid target and deadline were kept for recovery.";
  } catch { document.querySelector("#workspace-status").textContent="Workspace could not be saved. Edits remain in this tab; export a valid workspace to keep them."; }
}
function applyWorkspace(saved) {
  lastValidPlan = { targetPercent: saved.targetPercent, deadlineHour: saved.deadlineHour, ganttDensity: saved.ganttDensity || "snapshots", selectedHour: saved.ganttHourIndex ?? saved.selectedHour ?? 0, ganttHourIndex: saved.ganttHourIndex ?? saved.selectedHour ?? 0, selectedChart: saved.selectedChart || "queue", ganttClosedOnly: saved.ganttClosedOnly === true, ganttGateFilter: GANTT_GATE_FILTERS.includes(saved.ganttGateFilter) ? saved.ganttGateFilter : "all", queueBacklogOnly: saved.queueBacklogOnly === true, ganttEveryGateClosed: saved.ganttEveryGateClosed === true, hideWeekdayGanttHours: saved.hideWeekdayGanttHours === true, hideWeekendGanttHours: saved.hideWeekendGanttHours === true, hideOpenGanttHours: saved.hideOpenGanttHours === true, hideClosedGanttHours: saved.hideClosedGanttHours === true, hideZeroQueueGanttHours: saved.hideZeroQueueGanttHours === true, hideBankClosedGanttHours: saved.hideBankClosedGanttHours === true, hideIssuerClosedGanttHours: saved.hideIssuerClosedGanttHours === true, hidePayoutClosedGanttHours: saved.hidePayoutClosedGanttHours === true, hideFxClosedGanttHours: saved.hideFxClosedGanttHours === true, hidePayoutOpenGanttHours: saved.hidePayoutOpenGanttHours === true };
  baselineScenario={...saved.baseline}; selectedHour=saved.ganttHourIndex ?? saved.selectedHour ?? 0;setPlaying(false);
  document.querySelector("#reserve-target").value=String(saved.targetPercent);
  document.querySelector("#reserve-deadline").value=String(saved.deadlineHour);
  document.querySelector("#workspace-notes").value=saved.notes;
  document.querySelector("#gantt-density").value = saved.ganttDensity || "snapshots";
  document.querySelector("#selected-chart").value = saved.selectedChart || "queue";
  document.querySelector("#gantt-closed-only").checked = saved.ganttClosedOnly === true;
  document.querySelector("#gantt-gate-filter").value = GANTT_GATE_FILTERS.includes(saved.ganttGateFilter) ? saved.ganttGateFilter : "all";
  document.querySelector("#queue-backlog-only").checked = saved.queueBacklogOnly === true;
  document.querySelector("#gantt-every-closed").checked = saved.ganttEveryGateClosed === true;
  document.querySelector("#gantt-hide-weekdays").checked = saved.hideWeekdayGanttHours === true;
  document.querySelector("#gantt-hide-weekends").checked = saved.hideWeekendGanttHours === true;
  document.querySelector("#gantt-hide-open").checked = saved.hideOpenGanttHours === true;
  document.querySelector("#gantt-hide-closed").checked = saved.hideClosedGanttHours === true;
  document.querySelector("#gantt-hide-zero-queue").checked = saved.hideZeroQueueGanttHours === true;
  document.querySelector("#gantt-hide-bank-closed").checked = saved.hideBankClosedGanttHours === true;
  document.querySelector("#gantt-hide-issuer-closed").checked = saved.hideIssuerClosedGanttHours === true;
  document.querySelector("#gantt-hide-payout-closed").checked = saved.hidePayoutClosedGanttHours === true;
  document.querySelector("#gantt-hide-fx-closed").checked = saved.hideFxClosedGanttHours === true;
  document.querySelector("#gantt-hide-payout-open").checked = saved.hidePayoutOpenGanttHours === true;
  setScenario(saved.current,{message:"Workspace restored with its baseline, notes and reserve target."});
}
function downloadText(text,filename,type) {
  const url=URL.createObjectURL(new Blob([text],{type})),link=document.createElement("a");
  link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
document.querySelector("#workspace-notes").addEventListener("input",saveWorkspace);
document.querySelector("#export-workspace").addEventListener("click",()=>{
  try { downloadText(currentWorkspace(),"weekend-gap-workspace.json","application/json");document.querySelector("#workspace-status").textContent="Workspace exported. Includes baseline, current assumptions, notes, target and selected hour."; }
  catch(error) { document.querySelector("#workspace-status").textContent=error.message; }
});
document.querySelector("#import-workspace").addEventListener("click",()=>document.querySelector("#workspace-file").click());
document.querySelector("#workspace-file").addEventListener("change",async(event)=>{
  const file=event.target.files?.[0];event.target.value="";if(!file) return;
  if(file.size>250000) { document.querySelector("#workspace-status").textContent="Import failed. Workspace must be 250 KB or smaller.";return; }
  try {
    const result=workspaceFromJSON(await file.text());
    if(!result.workspace) { document.querySelector("#workspace-status").textContent="Import failed: "+result.errors.join(" ");return; }
    applyWorkspace(result.workspace);
    if(result.errors.length) document.querySelector("#workspace-status").textContent="Workspace imported with adjustments: "+result.errors.join(" ");
  } catch { document.querySelector("#workspace-status").textContent="Import failed. Choose a readable workspace JSON file."; }
});
if(!window.location.hash) {
  try {
    const raw=localStorage.getItem(WORKSPACE_KEY);
    if(raw) {
      const result=workspaceFromJSON(raw);
      if(result.workspace) applyWorkspace(result.workspace);
      document.querySelector("#workspace-status").textContent=result.errors.length ? "Saved workspace: "+result.errors.join(" ") : "Restored the previous local workspace.";
    }
  } catch { document.querySelector("#workspace-status").textContent="Saved workspace could not be read. Current scenario was kept."; }
}
workspaceReady=true;

function renderHistory() {
  document.querySelector("#undo-scenario").disabled=!scenarioHistory.canUndo;
  document.querySelector("#redo-scenario").disabled=!scenarioHistory.canRedo;
}
document.querySelector("#undo-scenario").addEventListener("click",()=>{
  setPlaying(false);setScenario(scenarioHistory.undo(),{recordHistory:false,message:"Previous scenario edit restored. Baseline and notes were kept."});
});
document.querySelector("#redo-scenario").addEventListener("click",()=>{
  setPlaying(false);setScenario(scenarioHistory.redo(),{recordHistory:false,message:"Scenario edit reapplied. Baseline and notes were kept."});
});
scenarioHistory=createScenarioHistory(scenario);renderHistory();

document.querySelector("#table-density").addEventListener("change",renderTable);
document.querySelector("#queue-backlog-only").addEventListener("change",()=>{
  renderTable();
  saveWorkspace();
});
document.querySelector("#gantt-density").addEventListener("change",()=>{
  renderGantt();
  saveWorkspace();
});
document.querySelector("#gantt-closed-only").addEventListener("change",()=>{
  renderGantt();
  saveWorkspace();
});
document.querySelector("#gantt-every-closed").addEventListener("change",()=>{
  renderGantt();
  saveWorkspace();
});
document.querySelector("#gantt-hide-weekdays").addEventListener("change",()=>{
  renderGantt();
  saveWorkspace();
});
document.querySelector("#gantt-hide-weekends").addEventListener("change",()=>{
  renderGantt();
  saveWorkspace();
});
document.querySelector("#gantt-hide-open").addEventListener("change",()=>{
  renderGantt();
  saveWorkspace();
});
document.querySelector("#gantt-hide-closed").addEventListener("change",()=>{
  renderGantt();
  saveWorkspace();
});
document.querySelector("#gantt-hide-zero-queue").addEventListener("change",()=>{
  renderGantt();
  saveWorkspace();
});
document.querySelector("#gantt-hide-bank-closed").addEventListener("change",()=>{
  renderGantt();
  saveWorkspace();
});
document.querySelector("#gantt-hide-issuer-closed").addEventListener("change",()=>{
  renderGantt();
  saveWorkspace();
});
document.querySelector("#gantt-hide-payout-closed").addEventListener("change",()=>{
  renderGantt();
  saveWorkspace();
});
document.querySelector("#gantt-hide-fx-closed").addEventListener("change",()=>{
  renderGantt();
  saveWorkspace();
});
document.querySelector("#gantt-hide-payout-open").addEventListener("change",()=>{
  renderGantt();
  saveWorkspace();
});
document.querySelector("#gantt-gate-filter").addEventListener("change",()=>{
  renderGantt();
  saveWorkspace();
});
document.querySelector("#selected-chart").addEventListener("change",()=>{
  const view = document.querySelector("#selected-chart").value;
  saveWorkspace();
  if (view === "gantt") jumpToGantt();
  else jumpToQueueChart();
});
document.querySelector("#export-gantt").addEventListener("click",()=>{
  downloadText(buildGateGanttSvg(scenario,selectedHour),"weekend-gap-gantt.svg","image/svg+xml;charset=utf-8");
  setMessage("Gantt SVG downloaded. It is a synthetic operating calendar, not a live market chart.");
});
document.querySelector("#export-gantt-csv").addEventListener("click",()=>{
  downloadText(ganttToCSV(scenario),"weekend-gap-gantt.csv","text/csv;charset=utf-8");
  setMessage("Gantt CSV downloaded. Open and closed hours match the 72 chart cells.");
});
async function copyTextWithFallback(text, fallbackId, successMessage) {
  const fallback = document.querySelector(fallbackId);
  try {
    const clipboard = globalThis.navigator?.clipboard;
    if (clipboard && typeof clipboard.writeText === "function") {
      await clipboard.writeText(text);
      if (fallback) {
        fallback.hidden = true;
        fallback.value = "";
      }
      setMessage(successMessage);
      return;
    }
    throw new Error("Clipboard unavailable");
  } catch {
    if (fallback) {
      fallback.hidden = false;
      fallback.value = text;
      fallback.focus();
      if (typeof fallback.select === "function") fallback.select();
      setMessage("Clipboard unavailable. Copy the Markdown from the text box.");
      return;
    }
    setMessage("Clipboard unavailable. Markdown could not be copied.");
  }
}
document.querySelector("#copy-gantt-hour").addEventListener("click", async () => {
  await copySelectedGanttHourMarkdown();
});
document.querySelector("#copy-remaining-reserve").addEventListener("click", async () => {
  await copyRemainingReserveMarkdown();
});
document.querySelector("#copy-peak-hour").addEventListener("click", async () => {
  const text = peakQueueHourToMarkdown(scenario);
  await copyTextWithFallback(text, "#peak-hour-copy-fallback", "Peak-queue hour copied as Markdown. This is a synthetic snapshot, not a live bank or payout queue.");
});
document.querySelector("#copy-selected-versus-peak").addEventListener("click", async () => {
  await copySelectedVersusPeakHourMarkdown();
});
document.querySelector("#copy-next-payout").addEventListener("click", async () => {
  await copyNextPayoutHourMarkdown();
});
document.querySelector("#copy-closed-hours").addEventListener("click", async () => {
  await copyClosedHoursMarkdown();
});
document.querySelector("#copy-fx-hours").addEventListener("click", async () => {
  await copyFxHoursMarkdown();
});
document.querySelector("#copy-weekend-fx-counts").addEventListener("click", async () => {
  await copyWeekendFxHourCountsMarkdown();
});
document.querySelector("#copy-first-closed-fx").addEventListener("click", async () => {
  await copyFirstClosedFxHourMarkdown();
});
document.querySelector("#copy-first-closed-bank").addEventListener("click", async () => {
  await copyFirstClosedBankHourMarkdown();
});
document.querySelector("#copy-first-closed-issuer").addEventListener("click", async () => {
  await copyFirstClosedIssuerHourMarkdown();
});
document.querySelector("#copy-first-closed-payout").addEventListener("click", async () => {
  await copyFirstClosedPayoutHourMarkdown();
});
document.querySelector("#copy-first-open-payout").addEventListener("click", async () => {
  await copyFirstOpenPayoutHourMarkdown();
});
document.querySelector("#copy-cohort-markdown").addEventListener("click", async () => {
  const text = arrivalCohortsToMarkdown(scenario);
  await copyTextWithFallback(text, "#cohort-copy-fallback", "Arrival-cohort table copied as Markdown. This is a synthetic ledger, not a forecast.");
});
document.querySelector("#copy-bottleneck-markdown").addEventListener("click", async () => {
  const text = bottleneckCountsToMarkdown(scenario);
  await copyTextWithFallback(text, "#bottleneck-copy-fallback", "Limiting-gate counts copied as Markdown. These are observation counts, not a causal ranking.");
});
document.querySelector("#export-queue-svg").addEventListener("click",()=>{
  downloadText(buildQueueChartSvg(scenario,baselineScenario,selectedHour),"weekend-gap-queue.svg","image/svg+xml;charset=utf-8");
  setMessage("Queue SVG downloaded. It is a synthetic path, not a live market chart.");
});
document.querySelector("#export-queue-csv").addEventListener("click",()=>{
  downloadText(queueToCSV(scenario,baselineScenario),"weekend-gap-queue.csv","text/csv;charset=utf-8");
  setMessage("Queue CSV downloaded. Hour labels and queue size are formula-safe spreadsheet cells.");
});
document.querySelector("#jump-peak").addEventListener("click",()=>{
  jumpToPeakQueue();
});
function jumpToPeakQueue() {
  if (!(simulation.summary.peakQueuedAud > 0)) return false;
  selectedHour = simulation.summary.peakQueueHour;
  setPlaying(false);
  render();
  saveWorkspace();
  return true;
}
function jumpToFirstSettlement() {
  const hours = simulation.summary.hoursToFirstSettlement;
  if (hours === null) return false;
  selectedHour = hours + 1;
  setPlaying(false);
  render();
  saveWorkspace();
  return true;
}
document.querySelector("#jump-first-settlement").addEventListener("click",()=>{
  jumpToFirstSettlement();
});
function jumpToFirstClosedBank() {
  const hour = firstClosedGanttHour(scenario);
  if (hour === null) {
    setMessage("No closed bank or gate hour in this 72-hour calendar.");
    return false;
  }
  selectedHour = hour;
  setPlaying(false);
  render();
  saveWorkspace();
  setMessage(`Jumped to the first closed bank hour at ${formatTime(hour)} (hour ${hour}).`);
  return true;
}
function jumpToScenarioInputs() {
  const heading = document.querySelector("#assumptions-title");
  if (!heading) return false;
  heading.setAttribute("tabindex", "-1");
  heading.focus();
  heading.scrollIntoView?.({ block: "start" });
  return true;
}
function jumpToDashboard() {
  const heading = document.querySelector("#outcome-title");
  if (!heading) return false;
  heading.setAttribute("tabindex", "-1");
  heading.focus();
  heading.scrollIntoView?.({ block: "start" });
  return true;
}
function rememberChart(view) {
  const select = document.querySelector("#selected-chart");
  if (!select || (view !== "queue" && view !== "gantt")) return;
  if (select.value !== view) select.value = view;
  saveWorkspace();
}
function jumpToQueueChart() {
  const heading = document.querySelector("#chart-title");
  if (!heading) return false;
  heading.setAttribute("tabindex", "-1");
  heading.focus();
  heading.scrollIntoView?.({ block: "start" });
  rememberChart("queue");
  return true;
}
function jumpToGantt() {
  const heading = document.querySelector("#gantt-title");
  if (!heading) return false;
  heading.setAttribute("tabindex", "-1");
  heading.focus();
  heading.scrollIntoView?.({ block: "start" });
  rememberChart("gantt");
  return true;
}
function jumpToSelectedGanttHour() {
  const row = document.querySelector("#gantt-hour-row");
  if (!row) return jumpToGantt();
  row.setAttribute("tabindex", "-1");
  row.focus();
  row.scrollIntoView?.({ block: "start" });
  rememberChart("gantt");
  return true;
}
function jumpToHoursToClearCopy() {
  const control = document.querySelector("#copy-hours-to-clear");
  if (control) {
    control.focus();
    control.scrollIntoView?.({ block: "start" });
    return true;
  }
  return jumpToDashboard();
}
function jumpToPrint() {
  const control = document.querySelector("#print");
  if (control) {
    control.focus();
    control.scrollIntoView?.({ block: "start" });
    return true;
  }
  const heading = document.querySelector("#print-heading");
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus();
    heading.scrollIntoView?.({ block: "start" });
    return true;
  }
  return false;
}
function jumpToHoursToClear() {
  const line = document.querySelector("#hours-to-clear-line");
  if (!line) return false;
  line.setAttribute("tabindex", "-1");
  line.focus();
  line.scrollIntoView?.({ block: "start" });
  return true;
}
function jumpToHoursToFirstSettlementLine() {
  const line = document.querySelector("#hours-to-first-settlement-line");
  if (!line) return jumpToDashboard();
  line.setAttribute("tabindex", "-1");
  line.focus();
  line.scrollIntoView?.({ block: "start" });
  return true;
}
function jumpToFirstPayoutMarker() {
  const hour = simulation.timeline[0].nextPayoutHour;
  if (hour === null) return jumpToGantt();
  const marker = document.querySelector("#gantt-first-payout-marker");
  if (!marker) return jumpToGantt();
  marker.setAttribute("tabindex", "-1");
  marker.focus();
  marker.scrollIntoView?.({ block: "start" });
  rememberChart("gantt");
  return true;
}
function jumpToAnalysisExport() {
  const controls = document.querySelector("#analysis-export-controls");
  if (!controls) return false;
  controls.setAttribute("tabindex", "-1");
  controls.focus();
  controls.scrollIntoView?.({ block: "start" });
  return true;
}
function jumpToGanttBankRow() {
  const rawGate = document.querySelector("#gantt-gate-filter")?.value || "all";
  const gateFilter = GANTT_GATE_FILTERS.includes(rawGate) ? rawGate : "all";
  if (gateFilter !== "all" && gateFilter !== "bank") return jumpToGantt();
  const row = document.querySelector("#gantt-bank-row");
  if (!row) return jumpToGantt();
  row.setAttribute("tabindex", "-1");
  row.focus();
  row.scrollIntoView?.({ block: "start" });
  rememberChart("gantt");
  return true;
}
function jumpToGanttIssuerRow() {
  const rawGate = document.querySelector("#gantt-gate-filter")?.value || "all";
  const gateFilter = GANTT_GATE_FILTERS.includes(rawGate) ? rawGate : "all";
  if (gateFilter !== "all" && gateFilter !== "issuer") return jumpToGantt();
  const row = document.querySelector("#gantt-issuer-row");
  if (!row) return jumpToGantt();
  row.setAttribute("tabindex", "-1");
  row.focus();
  row.scrollIntoView?.({ block: "start" });
  rememberChart("gantt");
  return true;
}
function jumpToGanttFxRow() {
  const rawGate = document.querySelector("#gantt-gate-filter")?.value || "all";
  const gateFilter = GANTT_GATE_FILTERS.includes(rawGate) ? rawGate : "all";
  if (gateFilter !== "all" && gateFilter !== "fx") return jumpToGantt();
  const row = document.querySelector("#gantt-fx-row");
  if (!row) return jumpToGantt();
  row.setAttribute("tabindex", "-1");
  row.focus();
  row.scrollIntoView?.({ block: "start" });
  rememberChart("gantt");
  return true;
}
function jumpToGanttPayoutRow() {
  const rawGate = document.querySelector("#gantt-gate-filter")?.value || "all";
  const gateFilter = GANTT_GATE_FILTERS.includes(rawGate) ? rawGate : "all";
  if (gateFilter !== "all" && gateFilter !== "payout") return jumpToGantt();
  const row = document.querySelector("#gantt-payout-row");
  if (!row) return jumpToGantt();
  row.setAttribute("tabindex", "-1");
  row.focus();
  row.scrollIntoView?.({ block: "start" });
  rememberChart("gantt");
  return true;
}
function jumpToCompareGantt() {
  const heading = document.querySelector("#compare-gantt-title");
  if (!heading) return jumpToGantt();
  heading.setAttribute("tabindex", "-1");
  heading.focus();
  heading.scrollIntoView?.({ block: "start" });
  rememberChart("gantt");
  return true;
}
function jumpToTimingReview() {
  const panel = document.querySelector("#weekend-review");
  const heading = document.querySelector("#weekend-review-title");
  if (!heading) return false;
  if (panel) panel.open = true;
  heading.setAttribute("tabindex", "-1");
  heading.focus();
  heading.scrollIntoView?.({ block: "start" });
  return true;
}
function copySelectedGanttHourMarkdown() {
  const text = selectedGanttHourToMarkdown(scenario, selectedHour);
  return copyTextWithFallback(text, "#gantt-hour-copy-fallback", "Selected Gantt hour copied as Markdown. This is a synthetic calendar, not a live bank or payout queue.");
}
function copySelectedVersusPeakHourMarkdown() {
  const text = selectedVersusPeakHourToMarkdown(scenario, selectedHour);
  return copyTextWithFallback(text, "#selected-versus-peak-copy-fallback", "Selected hour versus peak-queue hour copied as Markdown. This is not a forecast.");
}
function copyNextPayoutHourMarkdown() {
  const text = nextPayoutHourToMarkdown(scenario, selectedHour);
  return copyTextWithFallback(text, "#next-payout-copy-fallback", "Next-payout hour copied as one-line Markdown. This is a synthetic label, not a live payout time.");
}
function jumpToRemainingReserveCopy() {
  const control = document.querySelector("#copy-remaining-reserve");
  if (control) {
    control.focus();
    control.scrollIntoView?.({ block: "start" });
    return true;
  }
  return jumpToDashboard();
}
function copyRemainingReserveMarkdown() {
  const text = remainingReserveAtHourToMarkdown(scenario, selectedHour);
  return copyTextWithFallback(text, "#remaining-reserve-copy-fallback", "Remaining reserve and queued AUD copied as one-line Markdown. This is a synthetic snapshot, not live market data.");
}
function copyClosedHoursMarkdown() {
  const text = closedGanttHoursToMarkdown(scenario);
  return copyTextWithFallback(text, "#closed-hours-copy-fallback", "Closed hours copied as Markdown. This list is a local drawing, not a bank feed.");
}
function copyFxHoursMarkdown() {
  const text = fxGanttHoursToMarkdown(scenario);
  return copyTextWithFallback(text, "#fx-hours-copy-fallback", "FX hours copied as Markdown. This list is a local drawing, not a bank feed.");
}
function copyWeekendFxHourCountsMarkdown() {
  const text = weekendFxHourCountsToMarkdown(scenario);
  return copyTextWithFallback(text, "#weekend-fx-counts-copy-fallback", "Weekend FX hour counts copied as Markdown. These are counts of modeled hours, not a bank calendar.");
}
function jumpToFirstClosedFxCopy() {
  const control = document.querySelector("#copy-first-closed-fx");
  if (control) {
    control.focus();
    control.scrollIntoView?.({ block: "start" });
    return true;
  }
  if (jumpToGanttFxRow()) return true;
  return jumpToDashboard();
}
function jumpToFirstClosedFxCopyOrGantt() {
  const control = document.querySelector("#copy-first-closed-fx");
  if (control) {
    control.focus();
    control.scrollIntoView?.({ block: "start" });
    return true;
  }
  return jumpToGantt();
}
function copyFirstClosedFxHourMarkdown() {
  const text = firstClosedFxHourToMarkdown(scenario);
  return copyTextWithFallback(text, "#first-closed-fx-copy-fallback", "First closed FX hour copied as one-line Markdown. These are counts of modeled hours, not a bank calendar.");
}
function copyFirstClosedBankHourMarkdown() {
  const text = firstClosedBankHourToMarkdown(scenario);
  return copyTextWithFallback(text, "#first-closed-bank-copy-fallback", "First closed bank hour copied as one-line Markdown. These are counts of modeled hours, not a bank calendar.");
}
function copyFirstClosedIssuerHourMarkdown() {
  const text = firstClosedIssuerHourToMarkdown(scenario);
  return copyTextWithFallback(text, "#first-closed-issuer-copy-fallback", "First closed issuer hour copied as one-line Markdown. This is a synthetic label, not live issuer data.");
}
function copyFirstClosedPayoutHourMarkdown() {
  const text = firstClosedPayoutHourToMarkdown(scenario);
  return copyTextWithFallback(text, "#first-closed-payout-copy-fallback", "First closed payout hour copied as one-line Markdown. This is a synthetic label, not live payout data.");
}
function copyFirstOpenPayoutHourMarkdown() {
  const text = firstOpenPayoutHourToMarkdown(scenario);
  return copyTextWithFallback(text, "#first-open-payout-copy-fallback", "First open payout hour copied as one-line Markdown. This is a synthetic label, not live payout data.");
}
function jumpToFirstClosedBankCopy() {
  const control = document.querySelector("#copy-first-closed-bank");
  if (control) {
    control.focus();
    control.scrollIntoView?.({ block: "start" });
    return true;
  }
  return jumpToGantt();
}
function jumpToFirstClosedIssuerCopy() {
  const control = document.querySelector("#copy-first-closed-issuer");
  if (control) {
    control.focus();
    control.scrollIntoView?.({ block: "start" });
    return true;
  }
  return jumpToGantt();
}
function jumpToFirstClosedPayoutCopy() {
  const control = document.querySelector("#copy-first-closed-payout");
  if (control) {
    control.focus();
    control.scrollIntoView?.({ block: "start" });
    return true;
  }
  return jumpToGantt();
}
function jumpToFirstOpenPayoutCopy() {
  const control = document.querySelector("#copy-first-open-payout");
  if (control) {
    control.focus();
    control.scrollIntoView?.({ block: "start" });
    return true;
  }
  return jumpToGantt();
}
function jumpToHideZeroQueueFilter() {
  const control = document.querySelector("#gantt-hide-zero-queue");
  if (control) {
    control.focus();
    control.scrollIntoView?.({ block: "start" });
    return true;
  }
  return jumpToGantt();
}
function jumpToHideBankClosedFilter() {
  const control = document.querySelector("#gantt-hide-bank-closed");
  if (control) {
    control.focus();
    control.scrollIntoView?.({ block: "start" });
    return true;
  }
  return jumpToGantt();
}
function jumpToHideIssuerClosedFilter() {
  const control = document.querySelector("#gantt-hide-issuer-closed");
  if (control) {
    control.focus();
    control.scrollIntoView?.({ block: "start" });
    return true;
  }
  return jumpToGantt();
}
function jumpToHidePayoutClosedFilter() {
  const control = document.querySelector("#gantt-hide-payout-closed");
  if (control) {
    control.focus();
    control.scrollIntoView?.({ block: "start" });
    return true;
  }
  return jumpToGantt();
}
function jumpToHideFxClosedFilter() {
  const control = document.querySelector("#gantt-hide-fx-closed");
  if (control) {
    control.focus();
    control.scrollIntoView?.({ block: "start" });
    return true;
  }
  return jumpToGantt();
}
document.querySelector("#jump-monday").addEventListener("click",()=>{
  selectedHour=65;setPlaying(false);render();saveWorkspace();
});
document.querySelector("#export-timeline").addEventListener("click",()=>{
  downloadText(timelineToCSV(scenario,baselineScenario),"weekend-gap-timeline.csv","text/csv;charset=utf-8");
  setMessage("Exported all 73 checkpoints. Flow columns describe the preceding interval; capacity describes the next hour.");
});

document.querySelector("#export-report").addEventListener("click",()=>{
  try {
    const saved=JSON.parse(currentWorkspace());
    downloadText(reportToHTML(saved.current,saved.baseline,saved),"weekend-gap-report.html","text/html;charset=utf-8");
    document.querySelector("#workspace-status").textContent="Report exported. Open the HTML file offline and use your browser Print command. Editable state is in the separate workspace export.";
  } catch(error) { document.querySelector("#workspace-status").textContent=error.message; }
});
document.querySelector("#print").addEventListener("click", () => {
  window.print();
  document.querySelector("#workspace-status").textContent = "Print keeps dashboard numbers, hours to clear the queue when a queue exists, with an honest empty when none, the first closed FX hour when one exists, with an honest empty when none, the first closed bank hour when one exists, with an honest empty when none, the first closed issuer hour when one exists, with an honest empty when none, the first closed payout hour when one exists, with an honest empty when none, and the Gantt. These are counts of modeled hours, not a bank calendar. The saved scenario was not changed.";
});
document.querySelector("#print-redacted").addEventListener("click", () => {
  document.body.classList.add("print-redacted");
  applyGateDisplayLabels(true);
  const closedOnly = Boolean(document.querySelector("#gantt-closed-only")?.checked);
  const everyClosedOnly = Boolean(document.querySelector("#gantt-every-closed")?.checked);
  const hideWeekdayHours = Boolean(document.querySelector("#gantt-hide-weekdays")?.checked);
  const hideWeekendHours = Boolean(document.querySelector("#gantt-hide-weekends")?.checked);
  const hideOpenHours = Boolean(document.querySelector("#gantt-hide-open")?.checked);
  const hideClosedHours = Boolean(document.querySelector("#gantt-hide-closed")?.checked);
  const hideZeroQueueHours = Boolean(document.querySelector("#gantt-hide-zero-queue")?.checked);
  const hideBankClosedHours = Boolean(document.querySelector("#gantt-hide-bank-closed")?.checked);
  const hideIssuerClosedHours = Boolean(document.querySelector("#gantt-hide-issuer-closed")?.checked);
  const hidePayoutClosedHours = Boolean(document.querySelector("#gantt-hide-payout-closed")?.checked);
  const hideFxClosedHours = Boolean(document.querySelector("#gantt-hide-fx-closed")?.checked);
  const hidePayoutOpenHours = Boolean(document.querySelector("#gantt-hide-payout-open")?.checked);
  const rawGate = document.querySelector("#gantt-gate-filter")?.value || "all";
  const gateFilter = GANTT_GATE_FILTERS.includes(rawGate) ? rawGate : "all";
  document.querySelector("#gate-gantt").innerHTML = buildGateGanttSvg(scenario, selectedHour, { closedOnly, everyClosedOnly, hideWeekdayHours, hideWeekendHours, hideOpenHours, hideClosedHours, hideZeroQueueHours, hideBankClosedHours, hideIssuerClosedHours, hidePayoutClosedHours, hideFxClosedHours, hidePayoutOpenHours, gateFilter, redacted: true });
  window.print();
  document.body.classList.remove("print-redacted");
  applyGateDisplayLabels(false);
  renderGantt();
  document.querySelector("#workspace-status").textContent = "Print redacted uses generic Issuer, Bank, Payout and FX labels when custom names exist. Hours to clear the queue stay on the printed brief when a queue exists, with an honest empty when none, and the selected Gantt hour stay on the printed brief. Remaining reserve at that hour stays on the printed brief. Hours to first settlement stay on the printed brief. The first closed FX hour label stays on the printed brief when one exists, with an honest empty when none. The first closed bank hour stays on the printed brief when one exists, with an honest empty when none. The first closed issuer hour stays on the printed brief when one exists, with an honest empty when none. The first closed payout hour stays on the printed brief when one exists, with an honest empty when none. These are counts of modeled hours, not a bank calendar. The saved scenario was not changed.";
});
document.querySelector("#copy-hours-to-clear").addEventListener("click", async () => {
  await copyHoursToClearMarkdown();
});
document.querySelector("#copy-hours-to-first-settlement").addEventListener("click", async () => {
  await copyHoursToFirstSettlementMarkdown();
});
function copyHoursToClearMarkdown() {
  const text = hoursToClearQueueToMarkdown(scenario);
  return copyTextWithFallback(text, "#hours-to-clear-copy-fallback", "Hours to clear copied as one-line Markdown. This is a synthetic snapshot, not live market data.");
}
function copyHoursToFirstSettlementMarkdown() {
  const text = hoursToFirstSettlementToMarkdown(scenario);
  return copyTextWithFallback(text, "#hours-to-first-settlement-copy-fallback", "Hours to first settlement copied as one-line Markdown. This is a synthetic snapshot, not live market data.");
}
document.querySelector("#copy-dashboard-markdown").addEventListener("click", async () => {
  try {
    const text = dashboardToMarkdown(scenario);
    const clipboard = globalThis.navigator?.clipboard;
    if (clipboard && typeof clipboard.writeText === "function") {
      await clipboard.writeText(text);
      document.querySelector("#workspace-status").textContent = "Dashboard numbers copied as Markdown. Hours to clear, peak hour and first settlement are included.";
      return;
    }
    downloadText(text, "weekend-gap-dashboard.md", "text/markdown;charset=utf-8");
    document.querySelector("#workspace-status").textContent = "Clipboard unavailable. Dashboard Markdown downloaded instead.";
  } catch (error) {
    document.querySelector("#workspace-status").textContent = error.message;
  }
});
document.querySelector("#export-dashboard-csv").addEventListener("click", () => {
  downloadText(dashboardToCSV(scenario), "weekend-gap-dashboard.csv", "text/csv;charset=utf-8");
  setMessage("Dashboard CSV downloaded. Hours to clear and first settlement are empty when those events never occur. Cells are formula-safe and have no timestamps.");
});
document.querySelector("#copy-markdown-report").addEventListener("click", async () => {
  try {
    const saved = JSON.parse(currentWorkspace());
    const text = reportToMarkdown(saved.current, saved.baseline, saved);
    const clipboard = globalThis.navigator?.clipboard;
    if (clipboard && typeof clipboard.writeText === "function") {
      await clipboard.writeText(text);
      document.querySelector("#workspace-status").textContent = "Markdown report copied. It includes hours to clear the queue and the peak queue hour.";
      return;
    }
    downloadText(text, "weekend-gap-report.md", "text/markdown;charset=utf-8");
    document.querySelector("#workspace-status").textContent = "Clipboard unavailable. Markdown report downloaded instead.";
  } catch (error) {
    document.querySelector("#workspace-status").textContent = error.message;
  }
});

document.addEventListener("visibilitychange",()=>{ if(document.hidden) setPlaying(false); });
reducedMotion?.addEventListener?.("change",()=>setPlaying(false));
setPlaying(false);

const COACH_KEY = "weekend-gap:coach:v1";
const coachOverlay = document.querySelector("#coach-overlay");
const shortcutOverlay = document.querySelector("#shortcut-overlay");
function closeCoach() {
  coachOverlay.hidden = true;
  try { localStorage.setItem(COACH_KEY, "dismissed"); } catch { /* dismissal is best-effort */ }
}
function closeShortcutHelp() {
  shortcutOverlay.hidden = true;
}
function openShortcutHelp() {
  shortcutOverlay.hidden = false;
  document.querySelector("#shortcut-dismiss").focus();
}
function openCoach() {
  coachOverlay.hidden = false;
  document.querySelector("#coach-dismiss").focus();
}
function replayCoach() {
  closeShortcutHelp();
  openCoach();
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
function isEditableTarget(target) {
  if (!target) return false;
  const tag = (target.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (target.isContentEditable) return true;
  return typeof target.closest === "function" && Boolean(target.closest("input, textarea, select, [contenteditable=true]"));
}
document.querySelector("#coach-dismiss").addEventListener("click", closeCoach);
document.querySelector("#coach-replay").addEventListener("click", replayCoach);
document.querySelector("#coach-replay-method").addEventListener("click", replayCoach);
document.querySelector("#shortcut-dismiss").addEventListener("click", closeShortcutHelp);
document.querySelector("#shortcut-open").addEventListener("click", openShortcutHelp);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (!shortcutOverlay.hidden) {
      event.preventDefault();
      closeShortcutHelp();
      return;
    }
    if (!coachOverlay.hidden) {
      event.preventDefault();
      closeCoach();
    }
    return;
  }
  if (isEditableTarget(event.target)) return;
  if (event.key === "?") {
    event.preventDefault();
    if (shortcutOverlay.hidden) openShortcutHelp();
    else closeShortcutHelp();
    return;
  }
  if (!shortcutOverlay.hidden || !coachOverlay.hidden) return;
  if (event.key === " ") {
    event.preventDefault();
    setPlaying(!playing);
    return;
  }
  if (event.key === "j" || event.key === "J") {
    event.preventDefault();
    jumpToFirstSettlement();
    return;
  }
  if (event.key === "f" || event.key === "F") {
    event.preventDefault();
    jumpToFirstClosedBank();
    return;
  }
  if (event.key === "s" || event.key === "S") {
    event.preventDefault();
    jumpToScenarioInputs();
    return;
  }
  if (event.key === "d" || event.key === "D") {
    event.preventDefault();
    jumpToDashboard();
    return;
  }
  if (event.key === "q" || event.key === "Q") {
    event.preventDefault();
    jumpToQueueChart();
    return;
  }
  if (event.key === "g" || event.key === "G") {
    event.preventDefault();
    jumpToGantt();
    return;
  }
  if (event.key === "h" || event.key === "H") {
    event.preventDefault();
    jumpToSelectedGanttHour();
    return;
  }
  if (event.key === "k" || event.key === "K") {
    event.preventDefault();
    jumpToHoursToClear();
    return;
  }
  if (event.key === "y" || event.key === "Y") {
    event.preventDefault();
    jumpToHoursToFirstSettlementLine();
    return;
  }
  if (event.key === "l" || event.key === "L" || event.key === ",") {
    event.preventDefault();
    copyHoursToFirstSettlementMarkdown();
    return;
  }
  if (event.key === ";") {
    event.preventDefault();
    copyHoursToClearMarkdown();
    return;
  }
  if (event.key === "[") {
    event.preventDefault();
    jumpToHoursToClearCopy();
    return;
  }
  if (event.key === "]") {
    event.preventDefault();
    jumpToPrint();
    return;
  }
  if (event.key === ".") {
    event.preventDefault();
    jumpToFirstClosedFxCopy();
    return;
  }
  if (event.key === "/") {
    event.preventDefault();
    jumpToRemainingReserveCopy();
    return;
  }
  if (event.key === "'") {
    event.preventDefault();
    copyFirstClosedBankHourMarkdown();
    return;
  }
  if (event.key === ":") {
    event.preventDefault();
    copyFirstClosedIssuerHourMarkdown();
    return;
  }
  if (event.key === '"') {
    event.preventDefault();
    copyFirstClosedPayoutHourMarkdown();
    return;
  }
  if (event.key === "}") {
    event.preventDefault();
    copyFirstClosedFxHourMarkdown();
    return;
  }
  if (event.key === "~") {
    event.preventDefault();
    copyFirstOpenPayoutHourMarkdown();
    return;
  }
  if (event.key === "<") {
    event.preventDefault();
    jumpToFirstClosedBankCopy();
    return;
  }
  if (event.key === "-") {
    event.preventDefault();
    jumpToFirstClosedIssuerCopy();
    return;
  }
  if (event.key === "_") {
    event.preventDefault();
    jumpToFirstClosedPayoutCopy();
    return;
  }
  if (event.key === "+") {
    event.preventDefault();
    jumpToFirstClosedFxCopyOrGantt();
    return;
  }
  if (event.key === "!") {
    event.preventDefault();
    jumpToFirstOpenPayoutCopy();
    return;
  }
  if (event.key === ">") {
    event.preventDefault();
    jumpToHideZeroQueueFilter();
    return;
  }
  if (event.key === "=") {
    event.preventDefault();
    jumpToHideBankClosedFilter();
    return;
  }
  if (event.key === "{") {
    event.preventDefault();
    jumpToHideIssuerClosedFilter();
    return;
  }
  if (event.key === "|") {
    event.preventDefault();
    jumpToHidePayoutClosedFilter();
    return;
  }
  if (event.key === "@") {
    event.preventDefault();
    jumpToHideFxClosedFilter();
    return;
  }
  if (event.key === "n" || event.key === "N") {
    event.preventDefault();
    jumpToFirstPayoutMarker();
    return;
  }
  if (event.key === "o" || event.key === "O") {
    event.preventDefault();
    jumpToGanttPayoutRow();
    return;
  }
  if (event.key === "a" || event.key === "A") {
    event.preventDefault();
    jumpToAnalysisExport();
    return;
  }
  if (event.key === "b" || event.key === "B") {
    event.preventDefault();
    jumpToGanttBankRow();
    return;
  }
  if (event.key === "i" || event.key === "I") {
    event.preventDefault();
    jumpToGanttIssuerRow();
    return;
  }
  if (event.key === "w" || event.key === "W") {
    event.preventDefault();
    jumpToGanttFxRow();
    return;
  }
  if (event.key === "m" || event.key === "M") {
    event.preventDefault();
    jumpToCompareGantt();
    return;
  }
  if (event.key === "p" || event.key === "P") {
    event.preventDefault();
    jumpToPeakQueue();
    return;
  }
  if (event.key === "c" || event.key === "C") {
    event.preventDefault();
    copySelectedGanttHourMarkdown();
    return;
  }
  if (event.key === "z" || event.key === "Z") {
    event.preventDefault();
    copyRemainingReserveMarkdown();
    return;
  }
  if (event.key === "v" || event.key === "V") {
    event.preventDefault();
    copySelectedVersusPeakHourMarkdown();
    return;
  }
  if (event.key === "x" || event.key === "X") {
    event.preventDefault();
    copyClosedHoursMarkdown();
    return;
  }
  if (event.key === "t" || event.key === "T") {
    event.preventDefault();
    jumpToTimingReview();
    return;
  }
  if (event.key === "u" || event.key === "U") {
    if (!scenarioHistory.canUndo) return;
    event.preventDefault();
    setPlaying(false);
    setScenario(scenarioHistory.undo(), { recordHistory: false, message: "Previous scenario edit restored. Baseline and notes were kept." });
    return;
  }
  if (event.key === "r" || event.key === "R") {
    if (!scenarioHistory.canRedo) return;
    event.preventDefault();
    setPlaying(false);
    setScenario(scenarioHistory.redo(), { recordHistory: false, message: "Scenario edit reapplied. Baseline and notes were kept." });
    return;
  }
  if (event.key === "e" || event.key === "E") {
    event.preventDefault();
    downloadScenario();
  }
});
maybeShowCoach();

function clearWeekendReview() {
 weekendReviewPacket=null;weekendReviewSequence++;
 const exportButton=document.querySelector('#weekend-review-export');if(exportButton)exportButton.disabled=true;
 const origin=document.querySelector('#weekend-review-origin');if(origin)origin.textContent='';
 const output=document.querySelector('#weekend-review-output');
 if(output) output.textContent='Run a review for the current valid inputs. Results clear when the case changes.';
}
function showWeekendReview(review) {
 const output=document.querySelector('#weekend-review-output');output.replaceChildren();
 const title=document.createElement('h2');title.textContent=review.title;const note=document.createElement('p');note.textContent=review.note;output.append(title,note);
 const scroll=document.createElement('div');scroll.className='review-scroll';scroll.tabIndex=0;
 const table=document.createElement('table');const caption=document.createElement('caption');caption.textContent='Declared-input review. Monetary values use '+review.currency+'. Blank cells mean unavailable or unbounded as explained above.';table.append(caption);
 const head=document.createElement('thead');const headings=document.createElement('tr');for(const label of review.columns){const th=document.createElement('th');th.scope='col';th.textContent=label;headings.append(th);}head.append(headings);table.append(head);
 const body=document.createElement('tbody');for(const values of review.rows){const row=document.createElement('tr');for(const value of values){const cell=document.createElement('td');cell.textContent=value===null?'':typeof value==='number'?new Intl.NumberFormat('en-US',{maximumSignificantDigits:10}).format(value):value;row.append(cell);}body.append(row);}table.append(body);scroll.append(table);output.append(scroll);
}
function initializeWeekendReview(){
 const select=document.querySelector('#weekend-review-tool');if(!select)return;
 for(const tool of WEEKEND_REVIEW_TOOLS){const option=document.createElement('option');option.value=tool.id;option.textContent=tool.title;select.append(option);}
 select.value='days';select.addEventListener('change',clearWeekendReview);
 document.querySelector('#weekend-review-run').addEventListener('click',()=>{clearWeekendReview();try{if(weekendReviewDraftInvalid)throw new TypeError("Complete invalid scenario inputs before reviewing.");weekendReviewPacket=createWeekendReviewPacket(scenario,select.value);showWeekendReview(weekendReviewPacket.review);document.querySelector('#weekend-review-export').disabled=false;document.querySelector('#weekend-review-origin').textContent='Current case: '+(scenario.name);}catch(error){clearWeekendReview();document.querySelector('#weekend-review-output').textContent='Review unavailable. '+(error.errors?.join(' ')||error.message);}});
}
initializeWeekendReview();

function initializeWeekendReviewPacket(){
 const button=document.querySelector('#weekend-review-export');if(!button)return;
 button.addEventListener('click',()=>{if(weekendReviewPacket)downloadText(JSON.stringify(weekendReviewPacket),'weekend-review.json','application/json');});
 document.querySelector('#weekend-review-import').addEventListener('click',()=>document.querySelector('#weekend-review-file').click());
 document.querySelector('#weekend-review-file').addEventListener('change',async event=>{
  const file=event.target.files[0];event.target.value='';if(!file)return;clearWeekendReview();const sequence=weekendReviewSequence;
  try{
   if(file.size>1048576)throw new Error('Review packet exceeds 1 MiB.');
   const text=await file.text();if(sequence!==weekendReviewSequence)return;
   const packet=replayWeekendReviewPacket(JSON.parse(text));weekendReviewPacket=packet;
   document.querySelector('#weekend-review-tool').value=packet.tool;showWeekendReview(packet.review);button.disabled=false;
   document.querySelector('#weekend-review-origin').textContent='Inspected saved case: '+(packet.scenario.name)+'. Current case and autosave unchanged.';
  }catch(error){if(sequence!==weekendReviewSequence)return;clearWeekendReview();document.querySelector('#weekend-review-output').textContent='Review rejected: '+(error.errors?.join(' ')||error.message);}
 });
}
initializeWeekendReviewPacket();
