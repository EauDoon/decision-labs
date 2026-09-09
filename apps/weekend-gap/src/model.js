/**
 * Deterministic model for a Friday afternoon to Monday afternoon AUD payout gap.
 * All amounts are AUD. All rates are AUD per hour. All time values are local hours.
 */

export const SIMULATION_HOURS = 72;
export const START_DAY_INDEX = 5; // Friday, where Sunday is 0.
export const START_HOUR = 15;

const SCENARIO_FORMAT = "weekend-gap-scenario";
const SCENARIO_VERSION = 1;
const ANALYSIS_FORMAT = "weekend-gap-analysis";

export const DEFAULT_SCENARIO = Object.freeze({
  name: "Normal Friday",
  demandProfile: "flat",
  nominalLiquidityAud: 10000000,
  reserveCashAud: 6500000,
  issuerThroughputAudPerHour: 450000,
  issuerOpenStartHour: 8,
  issuerOpenEndHour: 17,
  bankOpenStartHour: 8,
  bankOpenEndHour: 17,
  fxDepthAudPerHour: 700000,
  fxSpreadBps: 18,
  weekendFxMultiplier: 2.5,
  payoutThroughputAudPerHour: 300000,
  payoutOpenStartHour: 8,
  payoutOpenEndHour: 17,
  redemptionDemandAud: 1200000,
  mondayHoliday: false,
  saturdayHoliday: false
});

export const PRESETS = Object.freeze({
  normal: Object.freeze({ ...DEFAULT_SCENARIO, name: "Normal Friday" }),
  weekendRush: Object.freeze({
    ...DEFAULT_SCENARIO,
    name: "Weekend Rush",
    reserveCashAud: 5200000,
    issuerThroughputAudPerHour: 300000,
    fxDepthAudPerHour: 380000,
    fxSpreadBps: 28,
    weekendFxMultiplier: 3.5,
    payoutThroughputAudPerHour: 180000,
    redemptionDemandAud: 3100000
  }),
  marketStress: Object.freeze({
    ...DEFAULT_SCENARIO,
    name: "Market Stress",
    reserveCashAud: 3400000,
    issuerThroughputAudPerHour: 150000,
    issuerOpenEndHour: 16,
    fxDepthAudPerHour: 170000,
    fxSpreadBps: 70,
    weekendFxMultiplier: 6,
    payoutThroughputAudPerHour: 95000,
    redemptionDemandAud: 7200000
  }),
  thinFxTightWindows: Object.freeze({
    ...DEFAULT_SCENARIO,
    name: "Thin FX, Tight Windows (synthetic)",
    reserveCashAud: 4800000,
    issuerThroughputAudPerHour: 220000,
    issuerOpenStartHour: 10,
    issuerOpenEndHour: 15,
    bankOpenStartHour: 10,
    bankOpenEndHour: 14,
    fxDepthAudPerHour: 90000,
    fxSpreadBps: 45,
    weekendFxMultiplier: 4.5,
    payoutThroughputAudPerHour: 140000,
    payoutOpenStartHour: 11,
    payoutOpenEndHour: 14,
    redemptionDemandAud: 2800000,
    mondayHoliday: true
  })
});

const FIELD_RULES = Object.freeze({
  name: { type: "text", maxLength: 80 },
  demandProfile: { type: "choice", values: ["flat", "fridayBurst", "mondayRush"] },
  nominalLiquidityAud: { min: 10000, max: 5000000000 },
  reserveCashAud: { min: 0, max: 5000000000 },
  issuerThroughputAudPerHour: { min: 0, max: 1000000000 },
  issuerOpenStartHour: { min: 0, max: 23, integer: true },
  issuerOpenEndHour: { min: 1, max: 24, integer: true },
  bankOpenStartHour: { min: 0, max: 23, integer: true },
  bankOpenEndHour: { min: 1, max: 24, integer: true },
  fxDepthAudPerHour: { min: 0, max: 1000000000 },
  fxSpreadBps: { min: 0, max: 10000 },
  weekendFxMultiplier: { min: 1, max: 100 },
  payoutThroughputAudPerHour: { min: 0, max: 1000000000 },
  payoutOpenStartHour: { min: 0, max: 23, integer: true },
  payoutOpenEndHour: { min: 1, max: 24, integer: true },
  redemptionDemandAud: { min: 0, max: 5000000000 },
  mondayHoliday: { type: "boolean" },
  saturdayHoliday: { type: "boolean" }
});

export function finiteNumber(value, fallback) {
  if (typeof value !== "number" && (typeof value !== "string" || value.trim() === "")) return fallback;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function normaliseWindow(start, end) {
  const safeStart = clamp(Math.round(start), 0, 23);
  const safeEnd = clamp(Math.round(end), 1, 24);
  return safeEnd <= safeStart ? [safeStart, Math.min(24, safeStart + 1)] : [safeStart, safeEnd];
}

/**
 * Coerces an untrusted scenario to bounded values. Clamps are returned so callers
 * can keep the simulator usable instead of failing on a malformed saved scenario.
 */
export function sanitizeScenario(raw = {}) {
  const errors = [];
  const source = raw && typeof raw === "object" ? raw : {};
  const scenario = {};

  for (const [field, rule] of Object.entries(FIELD_RULES)) {
    const fallback = DEFAULT_SCENARIO[field];
    if (rule.type === "choice") {
      scenario[field] = rule.values.includes(source[field]) ? source[field] : fallback;
      if (source[field] !== undefined && scenario[field] !== source[field]) errors.push(`${field} was unsupported; the default was used.`);
      continue;
    }
    if (rule.type === "boolean") {
      if (source[field] === undefined) {
        scenario[field] = fallback;
      } else if (source[field] === true || source[field] === false) {
        scenario[field] = source[field];
      } else {
        scenario[field] = fallback;
        errors.push(`${field} was unsupported; the default was used.`);
      }
      continue;
    }
    if (rule.type === "text") {
      const name = typeof source[field] === "string" ? source[field].trim() : "";
      scenario[field] = (name || fallback).slice(0, rule.maxLength);
      if (source[field] !== undefined && scenario[field] !== source[field]) {
        errors.push(`${field} was normalised.`);
      }
      continue;
    }
    const validNumeric = finiteNumber(source[field], NaN);
    if (source[field] !== undefined && !Number.isFinite(validNumeric)) {
      errors.push(`${field} was not a finite number; the default was used.`);
    }
    const numeric = finiteNumber(source[field], fallback);
    const rounded = rule.integer ? Math.round(numeric) : numeric;
    const bounded = clamp(rounded, rule.min, rule.max);
    scenario[field] = bounded;
    if (source[field] !== undefined && bounded !== numeric) {
      errors.push(`${field} was clamped to its allowed range.`);
    }
  }

  scenario.reserveCashAud = Math.min(scenario.reserveCashAud, scenario.nominalLiquidityAud);
  if (scenario.reserveCashAud !== finiteNumber(source.reserveCashAud, DEFAULT_SCENARIO.reserveCashAud)) {
    errors.push("reserveCashAud cannot exceed nominalLiquidityAud.");
  }

  for (const prefix of ["issuer", "bank", "payout"]) {
    const startKey = `${prefix}OpenStartHour`;
    const endKey = `${prefix}OpenEndHour`;
    const [start, end] = normaliseWindow(scenario[startKey], scenario[endKey]);
    if (start !== scenario[startKey] || end !== scenario[endKey]) {
      errors.push(`${prefix} operating hours were adjusted to a one-hour minimum window.`);
    }
    scenario[startKey] = start;
    scenario[endKey] = end;
  }

  return { scenario, errors: [...new Set(errors)] };
}

export function dayAndHourAt(hourOffset) {
  const absoluteHour = START_HOUR + Math.max(0, Math.floor(hourOffset));
  return {
    dayIndex: (START_DAY_INDEX + Math.floor(absoluteHour / 24)) % 7,
    localHour: absoluteHour % 24
  };
}

export function formatTime(hourOffset) {
  const { dayIndex, localHour } = dayAndHourAt(hourOffset);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${days[dayIndex]} ${String(localHour).padStart(2, "0")}:00`;
}

export function isBusinessDay(hourOffset, mondayHoliday = false, saturdayHoliday = false) {
  const { dayIndex } = dayAndHourAt(hourOffset);
  if (mondayHoliday && dayIndex === 1) return false;
  if (saturdayHoliday && dayIndex === 6) return false;
  return dayIndex >= 1 && dayIndex <= 5;
}

export function isWithinHours(hourOffset, startHour, endHour) {
  const { localHour } = dayAndHourAt(hourOffset);
  return localHour >= startHour && localHour < endHour;
}

export function isOperational(hourOffset, startHour, endHour, mondayHoliday = false, saturdayHoliday = false) {
  return isBusinessDay(hourOffset, mondayHoliday, saturdayHoliday) && isWithinHours(hourOffset, startHour, endHour);
}

export function getOperationalStatus(scenarioInput, hourOffset) {
  const { scenario } = sanitizeScenario(scenarioInput);
  const weekend = !isBusinessDay(hourOffset, scenario.mondayHoliday, scenario.saturdayHoliday);
  const issuerOpen = isOperational(hourOffset, scenario.issuerOpenStartHour, scenario.issuerOpenEndHour, scenario.mondayHoliday, scenario.saturdayHoliday);
  const bankOpen = isOperational(hourOffset, scenario.bankOpenStartHour, scenario.bankOpenEndHour, scenario.mondayHoliday, scenario.saturdayHoliday);
  const payoutOpen = isOperational(hourOffset, scenario.payoutOpenStartHour, scenario.payoutOpenEndHour, scenario.mondayHoliday, scenario.saturdayHoliday);
  const fxMultiplier = weekend ? scenario.weekendFxMultiplier : 1;
  return {
    issuerOpen,
    bankOpen,
    payoutOpen,
    weekend,
    fxDepthAudPerHour: scenario.fxDepthAudPerHour / fxMultiplier,
    fxSpreadBps: scenario.fxSpreadBps * fxMultiplier
  };
}

/** Weighted synthetic arrivals, bounded to 720 hours and conserving total demand. */
export function buildDemandSchedule(totalDemandAud, hours = SIMULATION_HOURS, profile = "flat") {
  const total = Math.max(0, finiteNumber(totalDemandAud, 0));
  if (!Number.isInteger(hours) || hours < 1 || hours > 720) throw new RangeError("Demand schedule requires 1 to 720 whole hours.");
  if (!["flat", "fridayBurst", "mondayRush"].includes(profile)) throw new RangeError("Unknown demand profile.");
  const weights = Array.from({ length: hours }, (_, hour) =>
    profile === "fridayBurst" && hour < 9 ? 8 : profile === "mondayRush" && hour >= 57 ? 8 : 1);
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map(weight => total * (weight / weightTotal));
}

export function capacityForHour(scenarioInput, hourOffset, reserveRemainingAud) {
  const { scenario } = sanitizeScenario(scenarioInput);
  const status = getOperationalStatus(scenario, hourOffset);
  const gatesOpen = status.issuerOpen && status.bankOpen && status.payoutOpen;
  if (!gatesOpen || reserveRemainingAud <= 0) {
    return { capacityAud: 0, status, limitingGate: !status.issuerOpen ? "issuer" : !status.bankOpen ? "bank" : !status.payoutOpen ? "payout" : "reserve" };
  }
  const capacityAud = Math.max(0, Math.min(
    scenario.issuerThroughputAudPerHour,
    status.fxDepthAudPerHour,
    scenario.payoutThroughputAudPerHour,
    reserveRemainingAud
  ));
  const limits = [
    [scenario.issuerThroughputAudPerHour, "issuer throughput"],
    [status.fxDepthAudPerHour, "FX depth"],
    [scenario.payoutThroughputAudPerHour, "payout throughput"],
    [reserveRemainingAud, "AUD reserve"]
  ];
  const limitingGate = limits.find(([value]) => value === capacityAud)?.[1] || "none";
  return { capacityAud, status, limitingGate };
}

export function estimateDiscountBps({ immediateAud, nominalLiquidityAud, queuedAud, totalDemandAud, fxSpreadBps }) {
  const liquidityRatio = nominalLiquidityAud > 0 ? immediateAud / nominalLiquidityAud : 0;
  const queuePressure = totalDemandAud > 0 ? queuedAud / totalDemandAud : 0;
  const accessPenalty = (1 - clamp(liquidityRatio, 0, 1)) * 550;
  const queuePenalty = clamp(queuePressure, 0, 2) * 400;
  return Math.round(clamp(fxSpreadBps + accessPenalty + queuePenalty, 0, 10000));
}

export function nextPayoutTime(scenarioInput, fromHour, reserveRemainingAud) {
  const { scenario } = sanitizeScenario(scenarioInput);
  const reserve = reserveRemainingAud === undefined ? scenario.reserveCashAud : Math.max(0, finiteNumber(reserveRemainingAud, 0));
  for (let offset = Math.max(0, Math.floor(fromHour)); offset <= fromHour + 7 * 24; offset += 1) {
    if (capacityForHour(scenario, offset, reserve).capacityAud > 0) return offset;
  }
  return null;
}

/** Hour offset of the first settling interval, or null when none settle in 72 hours. */
export function hoursToFirstSettlement(timeline) {
  if (!Array.isArray(timeline)) return null;
  const point = timeline.find((item) => item.settledThisHour > 0);
  return point ? point.hour - 1 : null;
}

/** First checkpoint where queued AUD is 0 after having been positive, or null if it never clears. */
export function hoursToClearQueue(timeline) {
  if (!Array.isArray(timeline)) return null;
  let seenPositive = false;
  for (const point of timeline) {
    if (point.queuedAud > 0) {
      seenPositive = true;
      continue;
    }
    if (seenPositive && point.queuedAud === 0) return point.hour;
  }
  return null;
}

export function createSnapshot(scenario, hour, state, demandThisHour = 0, settledThisHour = 0, limitingGate = "none") {
  const capacity = capacityForHour(scenario, hour, state.reserveRemainingAud);
  const immediateAud = capacity.capacityAud;
  const liquidityRatio = scenario.nominalLiquidityAud > 0 ? immediateAud / scenario.nominalLiquidityAud : 0;
  const discountBps = estimateDiscountBps({
    immediateAud,
    nominalLiquidityAud: scenario.nominalLiquidityAud,
    queuedAud: state.queuedAud,
    totalDemandAud: scenario.redemptionDemandAud,
    fxSpreadBps: capacity.status.fxSpreadBps
  });
  return Object.freeze({
    hour,
    timeLabel: formatTime(hour),
    reserveRemainingAud: state.reserveRemainingAud,
    queuedAud: state.queuedAud,
    settledAud: state.settledAud,
    demandArrivedAud: state.demandArrivedAud,
    immediateAud,
    liquidityRatio,
    discountBps,
    nextPayoutHour: nextPayoutTime(scenario, hour, state.reserveRemainingAud),
    demandThisHour,
    settledThisHour,
    limitingGate: limitingGate === "none" ? capacity.limitingGate : limitingGate,
    ...capacity.status
  });
}

/**
 * Runs an entirely deterministic discrete-event simulation. Demand joins a queue
 * each hour; a payout settles only when issuer, bank and payout windows all open.
 */
export function runSimulation(input = {}) {
  const { scenario, errors } = sanitizeScenario(input);
  const demandSchedule = buildDemandSchedule(scenario.redemptionDemandAud, SIMULATION_HOURS, scenario.demandProfile);
  const state = { reserveRemainingAud: scenario.reserveCashAud, queuedAud: 0, settledAud: 0, demandArrivedAud: 0 };
  const timeline = [createSnapshot(scenario, 0, state)];

  for (let hour = 0; hour < SIMULATION_HOURS; hour += 1) {
    const demandThisHour = demandSchedule[hour];
    state.demandArrivedAud += demandThisHour;
    state.queuedAud += demandThisHour;
    const capacity = capacityForHour(scenario, hour, state.reserveRemainingAud);
    const settledThisHour = Math.min(state.queuedAud, capacity.capacityAud);
    state.queuedAud = Math.max(0, state.queuedAud - settledThisHour);
    state.reserveRemainingAud = Math.max(0, state.reserveRemainingAud - settledThisHour);
    state.settledAud += settledThisHour;
    timeline.push(createSnapshot(scenario, hour + 1, state, demandThisHour, settledThisHour));
  }

  return Object.freeze({
    scenario: Object.freeze({ ...scenario }),
    errors: Object.freeze(errors),
    demandSchedule: Object.freeze(demandSchedule),
    timeline: Object.freeze(timeline),
    summary: Object.freeze({
      totalDemandAud: scenario.redemptionDemandAud,
      totalSettledAud: state.settledAud,
      finalQueuedAud: state.queuedAud,
      finalReserveAud: state.reserveRemainingAud,
      peakQueuedAud: timeline.reduce((peak, point) => Math.max(peak, point.queuedAud), 0),
      peakQueueHour: timeline.reduce(
        (peak, point) => point.queuedAud > peak.queuedAud ? point : peak,
        timeline[0],
      ).hour,
      hoursWithQueue: timeline.filter((point) => point.queuedAud > 0).length,
      hoursToFirstSettlement: hoursToFirstSettlement(timeline),
      hoursToClearQueue: hoursToClearQueue(timeline),
    })
  });
}

/** Compare detached canonical inputs; positive deltas mean candidate minus baseline. */
export function compareScenarios(baselineInput, candidateInput) {
  const baseline = runSimulation(baselineInput);
  const candidate = runSimulation(candidateInput);
  const changes = Object.keys(DEFAULT_SCENARIO)
    .filter((key) => baseline.scenario[key] !== candidate.scenario[key])
    .map((key) => ({ field: key, baseline: baseline.scenario[key], candidate: candidate.scenario[key] }));
  const deltas = Object.fromEntries(Object.keys(baseline.summary)
    .map((key) => {
      const before = baseline.summary[key];
      const after = candidate.summary[key];
      if (typeof before === "number" && typeof after === "number") return [key, after - before];
      return [key, before === after ? 0 : null];
    }));
  return { baseline, candidate, changes, deltas };
}

// Same hourly settlement recurrence as runSimulation, without chart snapshots.
function settlementByDeadline(scenario, reserveAud, deadlineHour) {
  let reserve = reserveAud;
  let queued = 0;
  let settled = 0;
  const demand = buildDemandSchedule(scenario.redemptionDemandAud, SIMULATION_HOURS, scenario.demandProfile);
  for (let hour = 0; hour < deadlineHour; hour += 1) {
    queued += demand[hour];
    const amount = Math.min(queued, capacityForHour(scenario, hour, reserve).capacityAud);
    queued = Math.max(0, queued - amount);
    reserve = Math.max(0, reserve - amount);
    settled += amount;
  }
  return settled;
}

/** Minimum whole-cent starting reserve for a share of TOTAL 72-hour demand. */
export function planReserve(input, targetPercent = 100, deadlineHour = SIMULATION_HOURS) {
  if (typeof targetPercent !== "number" || !Number.isFinite(targetPercent) || targetPercent < 0 || targetPercent > 100) {
    throw new RangeError("Settlement target must be a number from 0 to 100.");
  }
  if (!Number.isInteger(deadlineHour) || deadlineHour < 1 || deadlineHour > SIMULATION_HOURS) {
    throw new RangeError("Deadline must be a whole hour from 1 to 72.");
  }
  const { scenario } = sanitizeScenario(input);
  const targetAud = scenario.redemptionDemandAud * targetPercent / 100;
  const scaledCap = scenario.nominalLiquidityAud * 100;
  const maximumCents = Math.floor(scaledCap + Number.EPSILON * Math.max(1, scaledCap));
  const maximumReserveAud = maximumCents / 100;
  const currentSettledAud = settlementByDeadline(scenario, scenario.reserveCashAud, deadlineHour);
  const maximumSettledAud = settlementByDeadline(scenario, maximumReserveAud, deadlineHour);
  // Scale with at most 72 hourly additions; stay well below one cent at the cap.
  // No absolute floor: tiny positive targets must never pass with zero settlement.
  const meets = (amount) => amount >= targetAud ||
    targetAud - amount <= 128 * Number.EPSILON * Math.max(Math.abs(amount), Math.abs(targetAud));
  const shared = { targetPercent, deadlineHour, targetAud, currentSettledAud, maximumSettledAud, maximumReserveAud };
  if (!meets(maximumSettledAud)) {
    return { ...shared, status: "unreachable", minimumReserveAud: null, reserveChangeAud: null,
      reason: "The target cannot be reached by changing reserve alone within nominal liquidity. Demand arrival, operating windows, throughput, or the nominal cap also constrain settlement." };
  }
  let low = 0;
  let high = maximumCents;
  let iterations = 0;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (meets(settlementByDeadline(scenario, mid / 100, deadlineHour))) high = mid;
    else low = mid + 1;
    iterations += 1;
  }
  const minimumReserveAud = low / 100;
  return { ...shared, status: "reachable", minimumReserveAud,
    reserveChangeAud: minimumReserveAud - scenario.reserveCashAud,
    achievedSettledAud: settlementByDeadline(scenario, minimumReserveAud, deadlineHour), iterations,
    reason: "Minimum whole-cent reserve under the unchanged scenario assumptions. This is a synthetic funding calculation, not a liquidity recommendation." };
}

export function analysisToJSON(baselineInput, candidateInput, targetPercent = 100, deadlineHour = SIMULATION_HOURS) {
  const comparison = compareScenarios(baselineInput, candidateInput);
  return JSON.stringify({ format: ANALYSIS_FORMAT, version: 1,
    baseline: comparison.baseline.scenario, candidate: comparison.candidate.scenario,
    changes: comparison.changes, deltas: comparison.deltas,
    baselineSummary: comparison.baseline.summary, candidateSummary: comparison.candidate.summary,
    reservePlan: planReserve(candidateInput, targetPercent, deadlineHour),
    timeline: comparison.candidate.timeline.map((point, index) => ({
      hour: point.hour, time: point.timeLabel, baselineQueuedAud: comparison.baseline.timeline[index].queuedAud,
      candidateQueuedAud: point.queuedAud, candidateSettledAud: point.settledAud,
      candidateReserveAud: point.reserveRemainingAud
    })) }, null, 2);
}

export function scenarioToHash(scenarioInput) {
  const { scenario } = sanitizeScenario(scenarioInput);
  return `#scenario=${encodeURIComponent(JSON.stringify(scenario))}`;
}

export function scenarioFromHash(hash) {
  if (typeof hash !== "string" || !hash.startsWith("#scenario=")) return { scenario: null, errors: [] };
  if (hash.length > 60_000) return { scenario: null, errors: ["The shared scenario link is too large. Defaults were kept."] };
  try {
    const decoded = decodeURIComponent(hash.slice("#scenario=".length));
    const parsed = JSON.parse(decoded);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Scenario must be an object.");
    return sanitizeScenario(parsed);
  } catch {
    return { scenario: null, errors: ["The shared scenario link could not be read. Defaults were kept."] };
  }
}

export function scenarioToJSON(scenarioInput) {
  const { scenario } = sanitizeScenario(scenarioInput);
  return JSON.stringify({ format: SCENARIO_FORMAT, version: SCENARIO_VERSION, scenario }, null, 2);
}

export function scenarioFromJSON(text) {
  if (typeof text !== "string" || text.length > 250_000) {
    return { scenario: null, errors: ["Import failed. Scenario JSON must be 250 KB or smaller."] };
  }
  try {
    const parsed = JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Scenario must be an object.");
    }
    if (parsed.format === ANALYSIS_FORMAT) {
      return { scenario: null, errors: ["Import failed. Analysis reports are not scenario files."] };
    }

    const isClaimedEnvelope = ["format", "version", "scenario"].some((field) =>
      Object.prototype.hasOwnProperty.call(parsed, field)
    );
    if (isClaimedEnvelope && (parsed.format !== SCENARIO_FORMAT || parsed.version !== SCENARIO_VERSION)) {
      return { scenario: null, errors: ["Import failed. This scenario format or version is not supported."] };
    }
    const candidate = isClaimedEnvelope ? parsed.scenario : parsed;
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) throw new Error("Scenario must be an object.");
    return sanitizeScenario(candidate);
  } catch {
    return { scenario: null, errors: ["Import failed. Choose a valid Weekend Gap scenario JSON file."] };
  }
}

/** End-of-interval exposure and simultaneous blockers, never causal attribution. */
export function analyzeTimeline(input) {
  const result = runSimulation(input);
  const rows = [];
  const counts = new Map();
  let queueAudHours = 0;
  let backlogIntervals = 0;
  let longestBacklogRun = 0;
  let currentRun = 0;
  for (let hour = 0; hour < SIMULATION_HOURS; hour += 1) {
    const before = result.timeline[hour];
    const after = result.timeline[hour + 1];
    const capacity = capacityForHour(result.scenario, hour, before.reserveRemainingAud);
    const blockers = [];
    if (!capacity.status.issuerOpen) blockers.push("Issuer closed");
    if (!capacity.status.bankOpen) blockers.push("Bank closed");
    if (!capacity.status.payoutOpen) blockers.push("Payout closed");
    if (before.reserveRemainingAud <= 0) blockers.push("Reserve exhausted");
    if (capacity.capacityAud === 0 && blockers.length === 0) blockers.push("Zero throughput or FX depth");
    if (after.queuedAud > 0 && blockers.length === 0) blockers.push(capacity.limitingGate);
    const backlog = after.queuedAud > 0;
    if (backlog) {
      backlogIntervals += 1;
      currentRun += 1;
      for (const blocker of blockers) counts.set(blocker, (counts.get(blocker) || 0) + 1);
    } else currentRun = 0;
    longestBacklogRun = Math.max(longestBacklogRun, currentRun);
    queueAudHours += after.queuedAud;
    rows.push({ hour, endHour: hour + 1, demandAud: after.demandThisHour,
      settledAud: after.settledThisHour, queuedAud: after.queuedAud, capacityAud: capacity.capacityAud, blockers });
  }
  return { rows, queueAudHours, backlogIntervals, longestBacklogRun,
    blockers: [...counts].map(([label, intervals]) => ({ label, intervals })),
    firstBacklogHour: result.timeline.find(point => point.queuedAud > 0)?.hour ?? null,
    reserveExhaustionHour: result.scenario.reserveCashAud > 0 ? result.timeline.find(point => point.reserveRemainingAud === 0)?.hour ?? null : 0,
    lastSettlementHour: [...result.timeline].reverse().find(point => point.settledThisHour > 0)?.hour ?? null,
    peakQueueHour: result.summary.peakQueueHour };
}

/** A bounded one-factor experiment, with effective values after model caps. */
export function runSensitivity(input, field) {
  const fields = ["reserveCashAud", "redemptionDemandAud", "issuerThroughputAudPerHour", "fxDepthAudPerHour", "payoutThroughputAudPerHour"];
  if (!fields.includes(field)) throw new RangeError("Choose a supported sensitivity assumption.");
  const base = runSimulation(input);
  return [0.5, 0.75, 1, 1.25, 1.5].map(multiplier => {
    const requestedValue = base.scenario[field] * multiplier;
    const candidate = runSimulation({ ...base.scenario, [field]: requestedValue });
    return { multiplier, requestedValue, effectiveValue: candidate.scenario[field],
      adjusted: requestedValue !== candidate.scenario[field], scenario: candidate.scenario,
      summary: candidate.summary, settlementDeltaAud: candidate.summary.totalSettledAud - base.summary.totalSettledAud };
  });
}

/** A small local library, decoded atomically before any UI state is replaced. */
export function libraryFromJSON(text) {
  try {
    if (typeof text !== "string" || text.length > 250000) throw new Error("Library exceeds 250 KB.");
    const parsed = JSON.parse(text);
    if (parsed?.format !== "weekend-gap-library" || parsed.version !== 1 || !Array.isArray(parsed.scenarios) || parsed.scenarios.length > 12) throw new Error("Unsupported library format or more than 12 scenarios.");
    const errors = [];
    const scenarios = parsed.scenarios.map(raw => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Every library entry must be a scenario object.");
      const result = sanitizeScenario(raw); errors.push(...result.errors); return result.scenario;
    });
    return { scenarios, errors };
  } catch (error) { return { scenarios: null, errors: [error.message || "Library could not be read."] }; }
}

/** Portable editing state; computed results are always regenerated on restore. */
export function workspaceToJSON(current, baseline, options = {}) {
  const { targetPercent = 100, deadlineHour = 72, selectedHour = 0, notes = "", ganttDensity = "snapshots" } = options;
  if (!Number.isFinite(targetPercent) || targetPercent < 0 || targetPercent > 100 || !Number.isInteger(deadlineHour) || deadlineHour < 1 || deadlineHour > 72 || !Number.isInteger(selectedHour) || selectedHour < 0 || selectedHour > 72) throw new RangeError("Workspace target, deadline or selected hour is invalid.");
  if (typeof notes !== "string" || notes.length > 4000) throw new RangeError("Workspace notes must be 4000 characters or fewer.");
  if (!["snapshots", "all", "open"].includes(ganttDensity)) throw new RangeError("Workspace Gantt density is invalid.");
  return JSON.stringify({ format: "weekend-gap-workspace", version: 1, current: sanitizeScenario(current).scenario,
    baseline: sanitizeScenario(baseline).scenario, targetPercent, deadlineHour, selectedHour, notes, ganttDensity }, null, 2);
}
export function workspaceFromJSON(text) {
  try {
    if (typeof text !== "string" || text.length > 250000) throw new Error("Workspace must be 250 KB or smaller.");
    const raw = JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
    if (raw?.format !== "weekend-gap-workspace" || raw.version !== 1) throw new Error("Unsupported workspace format.");
    for (const field of ["current", "baseline"]) if (!raw[field] || typeof raw[field] !== "object" || Array.isArray(raw[field])) throw new Error("Workspace requires current and baseline scenario objects.");
    const current = sanitizeScenario(raw.current), baseline = sanitizeScenario(raw.baseline);
    const options = {
      targetPercent: raw.targetPercent,
      deadlineHour: raw.deadlineHour,
      selectedHour: raw.selectedHour === undefined ? 0 : raw.selectedHour,
      notes: raw.notes,
      ganttDensity: raw.ganttDensity === undefined ? "snapshots" : raw.ganttDensity
    };
    const workspace = JSON.parse(workspaceToJSON(current.scenario, baseline.scenario, options));
    return { workspace, errors: [...current.errors, ...baseline.errors] };
  } catch (error) { return { workspace: null, errors: [error.message || "Workspace could not be read."] }; }
}

/** In-memory, bounded scenario recovery. Returned values cannot mutate history. */
export function createScenarioHistory(initial, limit = 40) {
  if (!Number.isInteger(limit) || limit < 2 || limit > 100) throw new RangeError("History limit must be 2 to 100.");
  let entries = [sanitizeScenario(initial).scenario], index = 0;
  const copy = () => ({ ...entries[index] });
  return {
    record(next) {
      const scenario = sanitizeScenario(next).scenario;
      if (JSON.stringify(scenario) === JSON.stringify(entries[index])) return copy();
      entries = entries.slice(0,index + 1); entries.push(scenario);
      if (entries.length > limit) entries.shift();
      index = entries.length - 1; return copy();
    },
    undo() { if (index > 0) index -= 1; return copy(); },
    redo() { if (index < entries.length - 1) index += 1; return copy(); },
    get canUndo() { return index > 0; }, get canRedo() { return index < entries.length - 1; },
    get size() { return entries.length; }
  };
}

function spreadsheetUnsafeCell(text) {
  return /^[\s\u0000-\u001f]*[=+@-]/u.test(text);
}

function csvCell(value) {
  let text = String(value);
  if (typeof value === "string" && spreadsheetUnsafeCell(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function csvTable(rows) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

/** All 73 checkpoints; demand/settlement columns describe the preceding interval. */
export function timelineToCSV(current, baseline = current) {
  const comparison = compareScenarios(baseline, current);
  const headers = ["checkpoint_hour", "local_time", "interval_start_hour", "arrived_previous_interval_aud", "settled_previous_interval_aud", "cumulative_settled_aud", "queued_aud", "reserve_remaining_aud", "next_hour_capacity_aud", "baseline_queued_aud"];
  const rows = comparison.candidate.timeline.map((point, index) => [point.hour, point.timeLabel, point.hour === 0 ? "" : point.hour - 1,
    point.demandThisHour, point.settledThisHour, point.settledAud, point.queuedAud, point.reserveRemainingAud, point.immediateAud, comparison.baseline.timeline[index].queuedAud]);
  return [headers, ...rows].map(row => row.join(",")).join("\r\n") + "\r\n";
}

/** Formula-safe hourly queue path: hour label and queue size at every checkpoint. */
export function queueToCSV(current, baseline = current) {
  const comparison = compareScenarios(baseline, current);
  const headers = ["hour", "time_label", "queued_aud", "baseline_queued_aud", "scenario_name"];
  const rows = comparison.candidate.timeline.map((point, index) => [
    point.hour,
    point.timeLabel,
    point.queuedAud,
    comparison.baseline.timeline[index].queuedAud,
    comparison.candidate.scenario.name
  ]);
  return csvTable([headers, ...rows]);
}

/** Static, script-free report. Escape every user-controlled value before HTML output. */
export function reportToHTML(current, baseline, options = {}) {
  const workspace = JSON.parse(workspaceToJSON(current, baseline, options));
  const comparison = compareScenarios(workspace.baseline, workspace.current);
  const diagnostics = analyzeTimeline(workspace.current);
  const plan = planReserve(workspace.current, workspace.targetPercent, workspace.deadlineHour);
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const money = value => value.toLocaleString("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 2 });
  const summaryRows = [["Total demand", "totalDemandAud"], ["Settled by Monday 15:00", "totalSettledAud"], ["Final queue", "finalQueuedAud"], ["Peak queue", "peakQueuedAud"], ["Final reserve", "finalReserveAud"]]
    .map(([label, field]) => "<tr><th scope=row>" + escape(label) + "</th><td>" + escape(money(comparison.baseline.summary[field])) + "</td><td>" + escape(money(comparison.candidate.summary[field])) + "</td></tr>").join("");
  const assumptionRows = Object.keys(DEFAULT_SCENARIO).map(field => "<tr><th scope=row>" + escape(field) + "</th><td>" + escape(workspace.baseline[field]) + "</td><td>" + escape(workspace.current[field]) + "</td></tr>").join("");
  const planText = plan.status === "reachable" ? "Minimum whole-cent starting reserve: " + money(plan.minimumReserveAud) : "Unreachable by reserve alone. Maximum modeled settlement: " + money(plan.maximumSettledAud);
  const firstSettlementText = (hours) => hours === null ? "No settlement in 72h" : hours + " hour" + (hours === 1 ? "" : "s");
  const firstSettlementRow = "<tr><th scope=row>" + escape("Hours to first settlement") + "</th><td>" + escape(firstSettlementText(comparison.baseline.summary.hoursToFirstSettlement)) + "</td><td>" + escape(firstSettlementText(comparison.candidate.summary.hoursToFirstSettlement)) + "</td></tr>";
  const queueClearText = (hours, peak) => hours === null ? (peak > 0 ? "queue remains" : "No queue in 72h") : hours + " hour" + (hours === 1 ? "" : "s");
  const queueClearRow = "<tr><th scope=row>" + escape("Hours to clear queue") + "</th><td>" + escape(queueClearText(comparison.baseline.summary.hoursToClearQueue, comparison.baseline.summary.peakQueuedAud)) + "</td><td>" + escape(queueClearText(comparison.candidate.summary.hoursToClearQueue, comparison.candidate.summary.peakQueuedAud)) + "</td></tr>";
  const bottleneckRows = attributeBottlenecks(workspace.current).rows.map((row) =>
    "<tr><th scope=row>" + escape(row.label) + "</th><td>" + escape(String(row.hours)) + "</td><td>" + escape((row.share * 100).toFixed(1) + "%") + "</td></tr>").join("");
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;; base-uri &#39;none&#39;; form-action &#39;none&#39;"><title>Weekend Gap experiment report</title><style>body{font:16px/1.5 system-ui,sans-serif;color:#172b35;background:white;max-width:1000px;margin:2rem auto;padding:1rem}h1,h2{line-height:1.2}table{border-collapse:collapse;width:100%;margin:1rem 0}th,td{border:1px solid #9aa9b0;padding:.55rem;text-align:left;overflow-wrap:anywhere}th{background:#eff3f5}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}.notice{border-left:4px solid #54727f;padding:1rem;background:#f2f5f6}@media print{body{margin:0;padding:0;font-size:10pt}h2{break-after:avoid}tr{break-inside:avoid}thead{display:table-header-group}}</style></head><body><main><h1>Weekend Gap experiment report</h1><p class="notice">Synthetic educational analysis. No live data, issuer claims, financial advice or payout operations. 72-hour horizon: Friday 15:00 to Monday 15:00, using abstract local time.</p><p>Current: <strong>' + escape(workspace.current.name) + '</strong>. Baseline: <strong>' + escape(workspace.baseline.name) + '</strong>.</p><h2>Experiment notes</h2><pre>' + escape(workspace.notes || "No experiment notes provided.") + '</pre><h2>Outcome comparison</h2><p>AUD display values are rounded to cents. Compare total demand alongside settlement and queue size.</p><table><thead><tr><th scope="col">Metric</th><th scope="col">Baseline</th><th scope="col">Current</th></tr></thead><tbody>' + summaryRows + firstSettlementRow + queueClearRow + '</tbody></table><h2>Queue diagnostics</h2><p>' + diagnostics.backlogIntervals + ' of 72 intervals end with backlog. Longest run: ' + diagnostics.longestBacklogRun + ' hours. End-of-hour queue exposure: ' + escape(money(diagnostics.queueAudHours)) + '·hours.</p><ul>' + diagnostics.blockers.map(item => '<li>' + escape(item.label) + ': ' + item.intervals + ' backlog intervals</li>').join("") + '</ul><p>Concurrent blockers overlap. Counts describe observations, not marginal causal impact.</p><h2>Gate Gantt</h2><p>Open versus closed hours for the current scenario. The green dashed marker is the first hour the payout chain can settle given starting reserve. The solid marker is the selected hour from the workspace.</p>' + buildGateGanttSvg(workspace.current, workspace.selectedHour) + '<h2>Baseline versus current Gantt</h2><p>Paired rows compare current and baseline operating calendars. This is not a forecast.</p>' + buildComparisonGanttSvg(workspace.baseline, workspace.current, workspace.selectedHour) + '<h2>Queue path</h2><p>Printable queued AUD versus hour for the current scenario. The dashed path is the pinned baseline. The vertical line is the selected workspace hour.</p>' + buildQueueChartSvg(workspace.current, workspace.baseline, workspace.selectedHour) + '<h2>Hourly limiting gate</h2><p>Count of the 72 interval-start limitingGate values on the current scenario. Closed issuer, bank or payout gates are named before throughput or reserve. This is an observation count, not a ranking of which change would raise settlement.</p><table><thead><tr><th scope="col">Limiter</th><th scope="col">Hours</th><th scope="col">Share of 72h</th></tr></thead><tbody>' + bottleneckRows + '</tbody></table><h2>Reserve experiment</h2><p>Target: ' + workspace.targetPercent + '% of total 72-hour demand by ' + escape(formatTime(workspace.deadlineHour)) + '. ' + escape(planText) + '.</p><p>' + escape(plan.reason) + '</p><h2>Complete assumptions</h2><table><thead><tr><th scope="col">Assumption</th><th scope="col">Baseline</th><th scope="col">Current</th></tr></thead><tbody>' + assumptionRows + '</tbody></table><h2>Method and limits</h2><p>Demand joins once per hour under the selected deterministic arrival profile. Settlement requires all three business-day operating windows to overlap. Capacity is the minimum of issuer throughput, FX depth, payout throughput and remaining starting reserve. No reserve replenishment occurs. Queue exposure sums end-of-hour balances; it is not a customer waiting-time estimate. The optional Monday and Saturday holiday flags are modeled. Other public holidays, time zones, settlement uncertainty and counterparty risk are not modeled. No result is a liquidity recommendation.</p><p>Report format: weekend-gap-report v1. Export the separate workspace JSON for editable inputs and hourly CSV for the complete ledger. Use your browser Print command to save or print this report.</p></main></body></html>';
}

function hoursToClearLabel(hours, peak) {
  if (hours === null) return peak > 0 ? "queue remains" : "No queue in 72h";
  return hours + " hour" + (hours === 1 ? "" : "s");
}

function peakQueueHourLabel(summary) {
  if (!(summary.peakQueuedAud > 0)) return "No queue in 72h";
  return formatTime(summary.peakQueueHour) + " (hour " + summary.peakQueueHour + ")";
}

function markdownPlain(value) {
  return String(value).replace(/\r\n?/g, " ").replace(/[|#*`<>]/g, "");
}

/** Copyable Markdown outcome brief. Includes hours to clear and peak queue hour. */
export function reportToMarkdown(current, baseline, options = {}) {
  const workspace = JSON.parse(workspaceToJSON(current, baseline, options));
  const comparison = compareScenarios(workspace.baseline, workspace.current);
  const notes = markdownPlain(workspace.notes || "No experiment notes provided.");
  return [
    "# Weekend Gap experiment report",
    "",
    "Synthetic educational analysis. No live data, issuer claims, financial advice or payout operations.",
    "",
    "Current: " + markdownPlain(workspace.current.name),
    "Baseline: " + markdownPlain(workspace.baseline.name),
    "",
    "## Experiment notes",
    "",
    notes,
    "",
    "## Outcome",
    "",
    "| Metric | Baseline | Current |",
    "| --- | --- | --- |",
    "| Hours to clear queue | " + hoursToClearLabel(comparison.baseline.summary.hoursToClearQueue, comparison.baseline.summary.peakQueuedAud) + " | " + hoursToClearLabel(comparison.candidate.summary.hoursToClearQueue, comparison.candidate.summary.peakQueuedAud) + " |",
    "| Peak queue hour | " + peakQueueHourLabel(comparison.baseline.summary) + " | " + peakQueueHourLabel(comparison.candidate.summary) + " |",
    "| Peak queue | " + comparison.baseline.summary.peakQueuedAud + " | " + comparison.candidate.summary.peakQueuedAud + " |",
    "",
    "This is a synthetic comparison, not a liquidity recommendation.",
    ""
  ].join("\n");
}

export const BOTTLENECK_LABELS = Object.freeze([
  "issuer",
  "bank",
  "payout",
  "reserve",
  "issuer throughput",
  "FX depth",
  "payout throughput",
  "AUD reserve",
  "none"
]);

/** Count of the 72 interval-start limiting gates. Observation only, not causal impact. */
export function attributeBottlenecks(input) {
  const result = runSimulation(input);
  const counts = Object.fromEntries(BOTTLENECK_LABELS.map((label) => [label, 0]));
  for (let hour = 0; hour < SIMULATION_HOURS; hour += 1) {
    const label = result.timeline[hour].limitingGate;
    counts[label] = (counts[label] || 0) + 1;
  }
  const rows = Object.freeze(BOTTLENECK_LABELS.map((label) => Object.freeze({
    label,
    hours: counts[label] || 0,
    share: (counts[label] || 0) / SIMULATION_HOURS
  })));
  const extra = Object.keys(counts).filter((label) => !BOTTLENECK_LABELS.includes(label));
  const extraRows = extra.map((label) => Object.freeze({
    label,
    hours: counts[label],
    share: counts[label] / SIMULATION_HOURS
  }));
  return Object.freeze({
    hours: SIMULATION_HOURS,
    counts: Object.freeze(counts),
    rows: Object.freeze([...rows, ...extraRows])
  });
}

export const WINDOW_GATES = Object.freeze(["issuer", "bank", "payout"]);

/** Shift one operating window by whole hours, then clamp to a valid one-hour-minimum window. */
export function shiftOperatingWindow(scenarioInput, gate, startDeltaHours, endDeltaHours) {
  if (!WINDOW_GATES.includes(gate)) throw new RangeError("Choose issuer, bank or payout.");
  if (!Number.isInteger(startDeltaHours) || !Number.isInteger(endDeltaHours)) {
    throw new RangeError("Window shifts must be whole hours.");
  }
  const { scenario } = sanitizeScenario(scenarioInput);
  const startKey = `${gate}OpenStartHour`;
  const endKey = `${gate}OpenEndHour`;
  const [start, end] = normaliseWindow(scenario[startKey] + startDeltaHours, scenario[endKey] + endDeltaHours);
  return sanitizeScenario({ ...scenario, [startKey]: start, [endKey]: end }).scenario;
}

/** Re-run the simulation after a window shift. Does not mutate the input scenario. */
export function previewWindowShift(scenarioInput, gate, startDeltaHours, endDeltaHours) {
  const current = runSimulation(scenarioInput);
  const applied = shiftOperatingWindow(current.scenario, gate, startDeltaHours, endDeltaHours);
  const candidate = runSimulation(applied);
  const startKey = `${gate}OpenStartHour`;
  const endKey = `${gate}OpenEndHour`;
  return Object.freeze({
    gate,
    startDeltaHours,
    endDeltaHours,
    applied,
    current: Object.freeze({
      peakQueuedAud: current.summary.peakQueuedAud,
      totalSettledAud: current.summary.totalSettledAud,
      hoursToFirstSettlement: current.summary.hoursToFirstSettlement,
      startHour: current.scenario[startKey],
      endHour: current.scenario[endKey]
    }),
    candidate: Object.freeze({
      peakQueuedAud: candidate.summary.peakQueuedAud,
      totalSettledAud: candidate.summary.totalSettledAud,
      hoursToFirstSettlement: candidate.summary.hoursToFirstSettlement,
      startHour: applied[startKey],
      endHour: applied[endKey]
    }),
    deltas: Object.freeze({
      peakQueuedAud: candidate.summary.peakQueuedAud - current.summary.peakQueuedAud,
      totalSettledAud: candidate.summary.totalSettledAud - current.summary.totalSettledAud,
      hoursToFirstSettlement: typeof current.summary.hoursToFirstSettlement === "number" && typeof candidate.summary.hoursToFirstSettlement === "number"
        ? candidate.summary.hoursToFirstSettlement - current.summary.hoursToFirstSettlement
        : current.summary.hoursToFirstSettlement === candidate.summary.hoursToFirstSettlement ? 0 : null
    })
  });
}

export const DEMAND_PROFILES = Object.freeze(["flat", "fridayBurst", "mondayRush"]);

const DEMAND_PROFILE_LABELS = Object.freeze({
  flat: "Even across 72 hours",
  fridayBurst: "Friday burst",
  mondayRush: "Monday rush"
});

/** Same other inputs, three arrival timings. Timing experiment, not a forecast. */
export function compareDemandProfiles(input) {
  const { scenario } = sanitizeScenario(input);
  return Object.freeze(DEMAND_PROFILES.map((demandProfile) => {
    const result = runSimulation({ ...scenario, demandProfile });
    return Object.freeze({
      demandProfile,
      label: DEMAND_PROFILE_LABELS[demandProfile],
      peakQueuedAud: result.summary.peakQueuedAud,
      finalQueuedAud: result.summary.finalQueuedAud,
      totalSettledAud: result.summary.totalSettledAud,
      hoursToFirstSettlement: result.summary.hoursToFirstSettlement
    });
  }));
}

function svgEscape(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

/** Hourly open/closed state for issuer, bank, payout and weekday vs weekend FX. */
export function buildGateSchedule(input) {
  const { scenario } = sanitizeScenario(input);
  const hours = [];
  for (let hour = 0; hour <= SIMULATION_HOURS; hour += 1) {
    const status = getOperationalStatus(scenario, hour);
    hours.push(Object.freeze({
      hour,
      timeLabel: formatTime(hour),
      issuerOpen: status.issuerOpen,
      bankOpen: status.bankOpen,
      payoutOpen: status.payoutOpen,
      fxWeekday: !status.weekend
    }));
  }
  return Object.freeze({ scenario: Object.freeze({ ...scenario }), hours: Object.freeze(hours) });
}

/** Light, print-friendly SVG of 72 operating hours plus a selected-hour marker. */
export function buildGateGanttSvg(input, selectedHour = 0) {
  const schedule = buildGateSchedule(input);
  const markerHour = clamp(Math.round(finiteNumber(selectedHour, 0)), 0, SIMULATION_HOURS);
  const width = 720;
  const rowHeight = 28;
  const labelWidth = 88;
  const top = 20;
  const plotWidth = width - labelWidth - 16;
  const rows = [
    ["Issuer", (hour) => schedule.hours[hour].issuerOpen, "#2f9e6b", "#c45c54"],
    ["Bank", (hour) => schedule.hours[hour].bankOpen, "#2f9e6b", "#c45c54"],
    ["Payout", (hour) => schedule.hours[hour].payoutOpen, "#2f9e6b", "#c45c54"],
    ["FX", (hour) => schedule.hours[hour].fxWeekday, "#3d7ea6", "#c9a227"]
  ];
  const height = top + rows.length * rowHeight + 32;
  const hourWidth = plotWidth / SIMULATION_HOURS;
  const firstPayout = nextPayoutTime(schedule.scenario, 0);
  let cells = "";
  rows.forEach((row, rowIndex) => {
    const y = top + rowIndex * rowHeight;
    for (let hour = 0; hour < SIMULATION_HOURS; hour += 1) {
      const open = row[1](hour);
      const x = labelWidth + hour * hourWidth;
      cells += `<rect x="${x.toFixed(2)}" y="${y + 5}" width="${Math.max(0.4, hourWidth).toFixed(2)}" height="${rowHeight - 10}" fill="${open ? row[2] : row[3]}" />`;
    }
  });
  const markerX = labelWidth + (markerHour / SIMULATION_HOURS) * plotWidth;
  const labels = rows.map((row, index) => `<text x="8" y="${top + index * rowHeight + 18}" font-size="12" fill="#17324a">${row[0]}</text>`).join("");
  const ticks = [0, 9, 33, 57, 72].map((hour) => {
    const x = labelWidth + (hour / SIMULATION_HOURS) * plotWidth;
    return `<text x="${x.toFixed(1)}" y="${height - 8}" font-size="10" text-anchor="middle" fill="#3e5360">${svgEscape(formatTime(hour))}</text>`;
  }).join("");
  const selectedLabel = `<text x="${width - 8}" y="14" font-size="11" text-anchor="end" fill="#17324a">Selected ${svgEscape(formatTime(markerHour))}</text>`;
  const payoutX = firstPayout === null || firstPayout > SIMULATION_HOURS ? null : labelWidth + (firstPayout / SIMULATION_HOURS) * plotWidth;
  const payoutMark = payoutX === null ? "" :
    `<line x1="${payoutX.toFixed(2)}" y1="${top}" x2="${payoutX.toFixed(2)}" y2="${top + rows.length * rowHeight}" stroke="#2f9e6b" stroke-width="2" stroke-dasharray="4 3" />` +
    `<text x="${Math.min(width - 80, Math.max(labelWidth, payoutX + 6)).toFixed(1)}" y="${top + 12}" font-size="10" fill="#1f6b49">First payout ${svgEscape(formatTime(firstPayout))}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="72-hour gate Gantt for issuer, bank, payout and FX. Current hour is the solid vertical marker. First payout window is the dashed green marker. A table follows.">` +
    `<rect width="${width}" height="${height}" fill="#f7fafb"/>` +
    selectedLabel + labels + cells + payoutMark +
    `<line x1="${markerX.toFixed(2)}" y1="${top}" x2="${markerX.toFixed(2)}" y2="${top + rows.length * rowHeight}" stroke="#17324a" stroke-width="2" />` +
    ticks +
    "</svg>";
}

/** Gate open/closed for the same 72 hours drawn on the Gantt chart. */
export function ganttToCSV(input) {
  const schedule = buildGateSchedule(input);
  const headers = ["hour", "time_label", "issuer", "bank", "payout", "fx"];
  const rows = [];
  for (let hour = 0; hour < SIMULATION_HOURS; hour += 1) {
    const point = schedule.hours[hour];
    rows.push([
      point.hour,
      point.timeLabel,
      point.issuerOpen ? "open" : "closed",
      point.bankOpen ? "open" : "closed",
      point.payoutOpen ? "open" : "closed",
      point.fxWeekday ? "weekday" : "weekend"
    ]);
  }
  return csvTable([headers, ...rows]);
}

/** Hourly current versus baseline gate state. Observation only, not a ranking. */
export function compareGateSchedules(baselineInput, currentInput) {
  const baseline = buildGateSchedule(baselineInput);
  const current = buildGateSchedule(currentInput);
  const hours = [];
  for (let hour = 0; hour <= SIMULATION_HOURS; hour += 1) {
    const before = baseline.hours[hour];
    const after = current.hours[hour];
    const differs = before.issuerOpen !== after.issuerOpen
      || before.bankOpen !== after.bankOpen
      || before.payoutOpen !== after.payoutOpen
      || before.fxWeekday !== after.fxWeekday;
    hours.push(Object.freeze({
      hour,
      timeLabel: after.timeLabel,
      differs,
      current: Object.freeze({
        issuerOpen: after.issuerOpen,
        bankOpen: after.bankOpen,
        payoutOpen: after.payoutOpen,
        fxWeekday: after.fxWeekday
      }),
      baseline: Object.freeze({
        issuerOpen: before.issuerOpen,
        bankOpen: before.bankOpen,
        payoutOpen: before.payoutOpen,
        fxWeekday: before.fxWeekday
      })
    }));
  }
  return Object.freeze({
    hours: Object.freeze(hours),
    differingHours: hours.filter((row) => row.differs).length
  });
}

/** Paired-row Gantt: current above baseline for each gate. */
export function buildComparisonGanttSvg(baselineInput, currentInput, selectedHour = 0) {
  const currentSchedule = buildGateSchedule(currentInput);
  const baselineSchedule = buildGateSchedule(baselineInput);
  const markerHour = clamp(Math.round(finiteNumber(selectedHour, 0)), 0, SIMULATION_HOURS);
  const width = 720;
  const rowHeight = 24;
  const labelWidth = 132;
  const top = 28;
  const plotWidth = width - labelWidth - 16;
  const hourWidth = plotWidth / SIMULATION_HOURS;
  const pairs = [
    ["Issuer current", currentSchedule, (point) => point.issuerOpen, "#2f9e6b", "#c45c54"],
    ["Issuer baseline", baselineSchedule, (point) => point.issuerOpen, "#2f9e6b", "#c45c54"],
    ["Bank current", currentSchedule, (point) => point.bankOpen, "#2f9e6b", "#c45c54"],
    ["Bank baseline", baselineSchedule, (point) => point.bankOpen, "#2f9e6b", "#c45c54"],
    ["Payout current", currentSchedule, (point) => point.payoutOpen, "#2f9e6b", "#c45c54"],
    ["Payout baseline", baselineSchedule, (point) => point.payoutOpen, "#2f9e6b", "#c45c54"],
    ["FX current", currentSchedule, (point) => point.fxWeekday, "#3d7ea6", "#c9a227"],
    ["FX baseline", baselineSchedule, (point) => point.fxWeekday, "#3d7ea6", "#c9a227"]
  ];
  const height = top + pairs.length * rowHeight + 32;
  let cells = "";
  const labels = pairs.map((row, rowIndex) => {
    const y = top + rowIndex * rowHeight;
    for (let hour = 0; hour < SIMULATION_HOURS; hour += 1) {
      const open = row[2](row[1].hours[hour]);
      const x = labelWidth + hour * hourWidth;
      cells += `<rect x="${x.toFixed(2)}" y="${y + 4}" width="${Math.max(0.4, hourWidth).toFixed(2)}" height="${rowHeight - 8}" fill="${open ? row[3] : row[4]}" />`;
    }
    return `<text x="8" y="${y + 16}" font-size="11" fill="#17324a">${svgEscape(row[0])}</text>`;
  }).join("");
  const markerX = labelWidth + (markerHour / SIMULATION_HOURS) * plotWidth;
  const ticks = [0, 9, 33, 57, 72].map((hour) => {
    const x = labelWidth + (hour / SIMULATION_HOURS) * plotWidth;
    return `<text x="${x.toFixed(1)}" y="${height - 8}" font-size="10" text-anchor="middle" fill="#3e5360">${svgEscape(formatTime(hour))}</text>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="Two-row gate Gantt comparing current and baseline issuer, bank, payout and FX hours. A table follows.">` +
    `<rect width="${width}" height="${height}" fill="#f7fafb"/>` +
    `<text x="8" y="16" font-size="12" fill="#17324a">Current versus baseline, paired rows</text>` +
    labels + cells +
    `<line x1="${markerX.toFixed(2)}" y1="${top}" x2="${markerX.toFixed(2)}" y2="${top + pairs.length * rowHeight}" stroke="#17324a" stroke-width="2" />` +
    ticks +
    "</svg>";
}

/** Printable SVG of queued AUD versus hour, with optional baseline and playhead. */
export function buildQueueChartSvg(currentInput, baselineInput = currentInput, selectedHour = 0) {
  const comparison = compareScenarios(baselineInput, currentInput);
  const current = comparison.candidate.timeline;
  const baseline = comparison.baseline.timeline;
  const width = 720;
  const height = 220;
  const left = 56;
  const top = 18;
  const plotWidth = width - 72;
  const plotHeight = height - 50;
  const maximum = Math.max(1, ...current.map((point) => point.queuedAud), ...baseline.map((point) => point.queuedAud));
  const markerHour = clamp(Math.round(finiteNumber(selectedHour, 0)), 0, SIMULATION_HOURS);
  const xAt = (hour) => left + (hour / SIMULATION_HOURS) * plotWidth;
  const yAt = (value) => top + plotHeight - (value / maximum) * plotHeight;
  const pathFor = (points) => points.map((point, index) => `${index ? "L" : "M"}${xAt(point.hour).toFixed(2)} ${yAt(point.queuedAud).toFixed(2)}`).join(" ");
  const ticks = [0, 9, 33, 57, 72].map((hour) => {
    const x = xAt(hour);
    return `<text x="${x.toFixed(1)}" y="${height - 8}" font-size="10" text-anchor="middle" fill="#3e5360">${svgEscape(formatTime(hour))}</text>`;
  }).join("");
  const yLabels = [0, 0.5, 1].map((share) => {
    const value = maximum * share;
    const y = yAt(value);
    return `<text x="8" y="${(y + 4).toFixed(1)}" font-size="10" fill="#3e5360">${svgEscape((value / 1000000).toFixed(value >= 10000000 ? 0 : 1) + "m")}</text>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="Printable queued AUD versus hour. The vertical line is the selected hour. A data table follows.">` +
    `<rect width="${width}" height="${height}" fill="#f7fafb"/>` +
    yLabels +
    `<path d="${pathFor(baseline)}" fill="none" stroke="#7f93b8" stroke-width="2" stroke-dasharray="6 4" />` +
    `<path d="${pathFor(current)}" fill="none" stroke="#b57914" stroke-width="2.5" />` +
    `<line x1="${xAt(markerHour).toFixed(2)}" y1="${top}" x2="${xAt(markerHour).toFixed(2)}" y2="${top + plotHeight}" stroke="#17324a" stroke-width="1.5" />` +
    ticks +
    "</svg>";
}

/** Horizontal bars for one-factor sensitivity cases. Table remains the text equivalent. */
export function buildSensitivityBarsSvg(rows, metric = "totalSettledAud") {
  if (metric !== "totalSettledAud" && metric !== "peakQueuedAud") {
    throw new RangeError("Choose settled total or peak queue.");
  }
  if (!Array.isArray(rows) || rows.length === 0) return "";
  const width = 720;
  const rowHeight = 28;
  const left = 70;
  const top = 24;
  const plotWidth = width - left - 140;
  const height = top + rows.length * rowHeight + 16;
  const values = rows.map((row) => row.summary[metric]);
  const maximum = Math.max(1, ...values);
  const bars = rows.map((row, index) => {
    const value = row.summary[metric];
    const y = top + index * rowHeight;
    const barWidth = (value / maximum) * plotWidth;
    const label = `${Math.round(row.multiplier * 100)}%`;
    const amount = value.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
    return `<text x="8" y="${y + 16}" font-size="12" fill="#17324a">${label}</text>` +
      `<rect x="${left}" y="${y + 6}" width="${Math.max(0.5, barWidth).toFixed(2)}" height="16" fill="${metric === "peakQueuedAud" ? "#c9a227" : "#2f9e6b"}" />` +
      `<text x="${(left + Math.max(8, barWidth) + 8).toFixed(1)}" y="${y + 18}" font-size="11" fill="#3e5360">${svgEscape(amount)}</text>`;
  }).join("");
  const title = metric === "peakQueuedAud" ? "Peak queue" : "Settled total";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="${title} for five sensitivity cases. A table follows.">` +
    `<rect width="${width}" height="${height}" fill="#f7fafb"/>` +
    `<text x="8" y="16" font-size="12" fill="#17324a">${title}</text>` +
    bars +
    "</svg>";
}

/** Compare two or three canonical scenarios. Observation only, not a ranking. */
export function compareSavedExperiments(scenarios) {
  if (!Array.isArray(scenarios) || scenarios.length < 2 || scenarios.length > 3) {
    throw new RangeError("Compare two or three saved experiments.");
  }
  return Object.freeze(scenarios.map((input) => {
    const result = runSimulation(input);
    return Object.freeze({
      name: result.scenario.name,
      peakQueuedAud: result.summary.peakQueuedAud,
      finalQueuedAud: result.summary.finalQueuedAud,
      totalSettledAud: result.summary.totalSettledAud,
      hoursToFirstSettlement: result.summary.hoursToFirstSettlement
    });
  }));
}

