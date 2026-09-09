import {
  DEFAULT_SCENARIO,
  PRESETS,
  SIMULATION_HOURS,
  formatTime,
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
  previewWindowShift,
  compareDemandProfiles,
  buildGateGanttSvg,
  buildGateSchedule,
  buildQueueChartSvg,
  buildSensitivityBarsSvg,
  compareSavedExperiments,
  runSensitivity,
  libraryFromJSON,
  workspaceToJSON,
  workspaceFromJSON,
  createScenarioHistory,
  timelineToCSV,
  reportToHTML
} from "./model.js";

let workspaceReady = false;
let lastValidPlan = { targetPercent: 100, deadlineHour: 72 };
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
  backlogHours: document.querySelector("#backlog-hours-value"),
  firstSettlement: document.querySelector("#first-settlement-value"),
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

let scenario = { ...DEFAULT_SCENARIO };
let scenarioHistory = createScenarioHistory(scenario);
let simulation = runSimulation(scenario);
let baselineScenario = { ...scenario };
let comparison = compareScenarios(baselineScenario, scenario);
let reservePlan = null;
let windowShiftPreview = null;
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

function setScenario(nextScenario, { normaliseForm = true, message = "", preserveShareHash = false, recordHistory = true } = {}) {
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
  clearWindowShiftPreview("Assumptions changed. Preview the window shift again before applying.");
  if (message) setMessage(message);
  else if (cleaned.errors.length) setMessage(cleaned.errors.join(" "));
  else setMessage("");
  if (workspaceReady) saveWorkspace();
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
  const { totalDemandAud, totalSettledAud, finalQueuedAud, peakQueuedAud, peakQueueHour, hoursWithQueue, hoursToFirstSettlement } = simulation.summary;
  const settledShare = totalDemandAud > 0 ? totalSettledAud / totalDemandAud : 1;
  elements.outcomeSummary.textContent = `${formatPercent(settledShare)} of demand settled`;
  elements.settledTotal.textContent = formatAud(totalSettledAud, false);
  elements.finalQueue.textContent = formatAud(finalQueuedAud, false);
  elements.peakQueue.textContent = formatAud(peakQueuedAud, false);
  elements.backlogHours.textContent = `${hoursWithQueue} of ${SIMULATION_HOURS}`;
  elements.firstSettlement.textContent = hoursToFirstSettlement === null
    ? "No settlement in 72h"
    : `${hoursToFirstSettlement} hour${hoursToFirstSettlement === 1 ? "" : "s"}`;
  const jumpFirst = document.querySelector("#jump-first-settlement");
  if (jumpFirst) {
    jumpFirst.disabled = hoursToFirstSettlement === null;
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
  elements.fxGate.textContent = point.weekend
    ? `${scenario.mondayHoliday && point.timeLabel.startsWith("Mon") ? "Holiday Monday" : "Weekend"}: depth ÷ ${scenario.weekendFxMultiplier.toFixed(1)}, spread × ${scenario.weekendFxMultiplier.toFixed(1)}`
    : `${Math.round(point.fxSpreadBps)} bps weekday spread`;
  elements.fxGate.className = point.weekend ? "state-watch" : "state-open";

  for (const button of document.querySelectorAll("[data-preset]")) {
    button.classList.toggle("is-selected", Object.keys(PRESETS[button.dataset.preset]).every(key => PRESETS[button.dataset.preset][key] === scenario[key]));
  }
  renderTable();
  drawChart();
  renderGantt();
  renderQueueSvg();
}

function renderTable() {
  const mode = document.querySelector("#table-density").value;
  const rowIndexes = new Set([selectedHour]);
  for (let hour = 0; hour <= SIMULATION_HOURS; hour += 1) {
    if(mode === "all" || (mode === "backlog" && simulation.timeline[hour].queuedAud > 0) || (mode === "snapshots" && hour % 6 === 0)) rowIndexes.add(hour);
  }
  const fragment = document.createDocumentFragment();
  [...rowIndexes].sort((a, b) => a - b).forEach((hour) => {
    const point = simulation.timeline[hour];
    const row = document.createElement("tr");
    if (hour === selectedHour) row.className = "is-current";
    const cells = [
      point.timeLabel,
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
}

function renderGantt() {
  document.querySelector("#gate-gantt").innerHTML = buildGateGanttSvg(scenario, selectedHour);
  const schedule = buildGateSchedule(scenario);
  const mode = document.querySelector("#gantt-density")?.value || "snapshots";
  const rowIndexes = new Set([0, selectedHour, SIMULATION_HOURS]);
  for (let hour = 0; hour <= SIMULATION_HOURS; hour += 1) {
    const point = schedule.hours[hour];
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
  const next = windowShiftPreview.applied;
  setScenario(next, { message: `Applied ${windowShiftPreview.gate} window ${next[`${windowShiftPreview.gate}OpenStartHour`]}:00 to ${next[`${windowShiftPreview.gate}OpenEndHour`]}:00. Other assumptions and the pinned baseline were kept.` });
});
for (const id of ["window-shift-gate", "window-shift-start", "window-shift-end"]) {
  document.getElementById(id).addEventListener("input", () => {
    clearWindowShiftPreview("Offsets changed. Preview again before applying.");
  });
}

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
  const raw = readForm();
  let invalid = false;
  for (const field of Object.keys(DEFAULT_SCENARIO)) {
    const input = form.elements.namedItem(field);
    if (!input || typeof DEFAULT_SCENARIO[field] !== "number") continue;
    const valid = typeof raw[field] === "string" && raw[field].trim() !== "" && Number.isFinite(Number(raw[field]));
    input.setAttribute("aria-invalid", String(!valid));
    if (!valid) invalid = true;
  }
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
    deadlineHour:document.querySelector("#reserve-deadline").valueAsNumber, selectedHour, notes:document.querySelector("#workspace-notes").value });
}
function saveWorkspace() {
  if(!workspaceReady) return;
  try {
    let serialized;
    let controlsValid = true;
    try {
      serialized = currentWorkspace();
      const saved = JSON.parse(serialized);
      lastValidPlan = { targetPercent: saved.targetPercent, deadlineHour: saved.deadlineHour };
    } catch {
      controlsValid = false;
      serialized = workspaceToJSON(scenario, baselineScenario, { ...lastValidPlan, selectedHour, notes: document.querySelector("#workspace-notes").value });
    }
    localStorage.setItem(WORKSPACE_KEY, serialized);
    document.querySelector("#workspace-status").textContent = controlsValid
      ? "Workspace autosaved locally, including the baseline, notes and reserve target."
      : "Scenario edits saved. Incomplete planner fields were excluded; the last valid target and deadline were kept for recovery.";
  } catch { document.querySelector("#workspace-status").textContent="Workspace could not be saved. Edits remain in this tab; export a valid workspace to keep them."; }
}
function applyWorkspace(saved) {
  lastValidPlan = { targetPercent: saved.targetPercent, deadlineHour: saved.deadlineHour };
  baselineScenario={...saved.baseline}; selectedHour=saved.selectedHour;setPlaying(false);
  document.querySelector("#reserve-target").value=String(saved.targetPercent);
  document.querySelector("#reserve-deadline").value=String(saved.deadlineHour);
  document.querySelector("#workspace-notes").value=saved.notes;
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
document.querySelector("#gantt-density").addEventListener("change",renderGantt);
document.querySelector("#export-gantt").addEventListener("click",()=>{
  downloadText(buildGateGanttSvg(scenario,selectedHour),"weekend-gap-gantt.svg","image/svg+xml;charset=utf-8");
  setMessage("Gantt SVG downloaded. It is a synthetic operating calendar, not a live market chart.");
});
document.querySelector("#export-queue-svg").addEventListener("click",()=>{
  downloadText(buildQueueChartSvg(scenario,baselineScenario,selectedHour),"weekend-gap-queue.svg","image/svg+xml;charset=utf-8");
  setMessage("Queue SVG downloaded. It is a synthetic path, not a live market chart.");
});
document.querySelector("#jump-peak").addEventListener("click",()=>{
  selectedHour=simulation.summary.peakQueueHour;setPlaying(false);render();saveWorkspace();
});
document.querySelector("#jump-first-settlement").addEventListener("click",()=>{
  const hours=simulation.summary.hoursToFirstSettlement;
  if(hours===null) return;
  selectedHour=hours+1;setPlaying(false);render();saveWorkspace();
});
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
