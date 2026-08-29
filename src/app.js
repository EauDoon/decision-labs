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
  analysisToJSON
} from "./model.js";

const STORAGE_KEY = "weekend-gap:scenario:v1";
const standaloneMode = document.documentElement.dataset.weekendGapStandalone === "true";
const form = document.querySelector("#scenario-form");
const timelineRange = document.querySelector("#timeline-range");
const canvas = document.querySelector("#liquidity-chart");
const chartContext = canvas.getContext("2d");
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
let simulation = runSimulation(scenario);
let baselineScenario = { ...scenario };
let comparison = compareScenarios(baselineScenario, scenario);
let reservePlan = null;
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
    if (input) input.value = String(value);
  }
}

function readForm() {
  const raw = {};
  for (const field of Object.keys(DEFAULT_SCENARIO)) {
    const input = form.elements.namedItem(field);
    raw[field] = input ? input.value : scenario[field];
  }
  return raw;
}

function saveScenario() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenario));
  } catch {
    setMessage("Local autosave is unavailable in this browser.");
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

function setScenario(nextScenario, { normaliseForm = true, message = "", preserveShareHash = false } = {}) {
  const cleaned = sanitizeScenario(nextScenario);
  scenario = cleaned.scenario;
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
  if (message) setMessage(message);
  else if (cleaned.errors.length) setMessage(cleaned.errors[0]);
  else setMessage("");
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
  elements.timelineLabel.textContent = point.timeLabel;
  elements.immediate.textContent = formatAud(point.immediateAud);
  elements.immediateDetail.textContent = point.immediateAud > 0
    ? `${point.limitingGate} sets the hourly capacity`
    : "No complete issuer-to-AUD payout chain";
  elements.queue.textContent = formatAud(point.queuedAud);
  elements.queueDetail.textContent = `${formatAud(point.settledAud)} paid so far`;
  elements.ratio.textContent = formatPercent(point.liquidityRatio);
  elements.discount.textContent = formatPercent(point.discountBps / 10000, 2);
  const { totalDemandAud, totalSettledAud, finalQueuedAud, peakQueuedAud, peakQueueHour, hoursWithQueue } = simulation.summary;
  const settledShare = totalDemandAud > 0 ? totalSettledAud / totalDemandAud : 1;
  elements.outcomeSummary.textContent = `${formatPercent(settledShare)} of demand settled`;
  elements.settledTotal.textContent = formatAud(totalSettledAud, false);
  elements.finalQueue.textContent = formatAud(finalQueuedAud, false);
  elements.peakQueue.textContent = formatAud(peakQueuedAud, false);
  elements.backlogHours.textContent = `${hoursWithQueue} of ${SIMULATION_HOURS + 1}`;
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
    ? `Weekend: depth ÷ ${scenario.weekendFxMultiplier.toFixed(1)}, spread × ${scenario.weekendFxMultiplier.toFixed(1)}`
    : `${Math.round(point.fxSpreadBps)} bps weekday spread`;
  elements.fxGate.className = point.weekend ? "state-watch" : "state-open";

  for (const button of document.querySelectorAll("[data-preset]")) {
    button.classList.toggle("is-selected", PRESETS[button.dataset.preset].name === scenario.name);
  }
  renderTable();
  drawChart();
}

function renderTable() {
  const rowIndexes = new Set([0, SIMULATION_HOURS, selectedHour]);
  for (let hour = 6; hour < SIMULATION_HOURS; hour += 6) rowIndexes.add(hour);
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
      formatAud(comparison.baseline.timeline[hour].queuedAud)
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
  playing = nextPlaying;
  elements.play.textContent = playing ? "Pause" : "Play";
  elements.play.setAttribute("aria-pressed", String(playing));
  if (playTimer) window.clearInterval(playTimer);
  playTimer = null;
  if (!playing) return;
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
  }));
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
});
document.querySelector("#restore-baseline").addEventListener("click", () => {
  setScenario(baselineScenario, { message: "Baseline restored to the scenario editor." });
});
for (const id of ["reserve-target", "reserve-deadline"]) {
  document.getElementById(id).addEventListener("input", renderPlanning);
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
    setScenario(imported.scenario, { message: "Scenario imported and autosaved." });
  } catch {
    setMessage("Import failed. Choose a readable JSON file.");
  }
}

form.addEventListener("input", () => {
  userEdited = true;
  setScenario(readForm(), { normaliseForm: false });
});

form.addEventListener("change", () => {
  setScenario(readForm(), { normaliseForm: true });
});

timelineRange.addEventListener("input", () => {
  selectedHour = Number(timelineRange.value);
  setPlaying(false);
  render();
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
document.querySelector("#import-file").addEventListener("change", (event) => importScenario(event.target.files?.[0]));

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
