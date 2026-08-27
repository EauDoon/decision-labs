/**
 * Deterministic model for a Friday afternoon to Monday afternoon AUD payout gap.
 * All amounts are AUD. All rates are AUD per hour. All time values are local hours.
 */

export const SIMULATION_HOURS = 72;
export const START_DAY_INDEX = 5; // Friday, where Sunday is 0.
export const START_HOUR = 15;

export const DEFAULT_SCENARIO = Object.freeze({
  name: "Normal Friday",
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
  redemptionDemandAud: 1200000
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
  })
});

const FIELD_RULES = Object.freeze({
  name: { type: "text", maxLength: 80 },
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
  redemptionDemandAud: { min: 0, max: 5000000000 }
});

export function finiteNumber(value, fallback) {
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
    if (rule.type === "text") {
      const name = typeof source[field] === "string" ? source[field].trim() : "";
      scenario[field] = (name || fallback).slice(0, rule.maxLength);
      if (source[field] !== undefined && scenario[field] !== source[field]) {
        errors.push(`${field} was normalised.`);
      }
      continue;
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

export function isBusinessDay(hourOffset) {
  const { dayIndex } = dayAndHourAt(hourOffset);
  return dayIndex >= 1 && dayIndex <= 5;
}

export function isWithinHours(hourOffset, startHour, endHour) {
  const { localHour } = dayAndHourAt(hourOffset);
  return localHour >= startHour && localHour < endHour;
}

export function isOperational(hourOffset, startHour, endHour) {
  return isBusinessDay(hourOffset) && isWithinHours(hourOffset, startHour, endHour);
}

export function getOperationalStatus(scenarioInput, hourOffset) {
  const { scenario } = sanitizeScenario(scenarioInput);
  const weekend = !isBusinessDay(hourOffset);
  const issuerOpen = isOperational(hourOffset, scenario.issuerOpenStartHour, scenario.issuerOpenEndHour);
  const bankOpen = isOperational(hourOffset, scenario.bankOpenStartHour, scenario.bankOpenEndHour);
  const payoutOpen = isOperational(hourOffset, scenario.payoutOpenStartHour, scenario.payoutOpenEndHour);
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

/** A flat, transparent demand schedule that conserves exactly the requested total. */
export function buildDemandSchedule(totalDemandAud, hours = SIMULATION_HOURS) {
  const total = Math.max(0, finiteNumber(totalDemandAud, 0));
  const count = Math.max(1, Math.floor(hours));
  return Array.from({ length: count }, () => total / count);
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
  const demandSchedule = buildDemandSchedule(scenario.redemptionDemandAud);
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
    timeline.push(createSnapshot(scenario, hour + 1, state, demandThisHour, settledThisHour, capacity.limitingGate));
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
    .map((key) => [key, candidate.summary[key] - baseline.summary[key]]));
  return { baseline, candidate, changes, deltas };
}

// Same hourly settlement recurrence as runSimulation, without chart snapshots.
function settlementByDeadline(scenario, reserveAud, deadlineHour) {
  let reserve = reserveAud;
  let queued = 0;
  let settled = 0;
  const demand = scenario.redemptionDemandAud / SIMULATION_HOURS;
  for (let hour = 0; hour < deadlineHour; hour += 1) {
    queued += demand;
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
  return JSON.stringify({ format: "weekend-gap-analysis", version: 1,
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
  return JSON.stringify({ format: "weekend-gap-scenario", version: 1, scenario }, null, 2);
}

export function scenarioFromJSON(text) {
  if (typeof text !== "string" || text.length > 250_000) {
    return { scenario: null, errors: ["Import failed. Scenario JSON must be 250 KB or smaller."] };
  }
  try {
    const parsed = JSON.parse(text);
    if (parsed?.format === "weekend-gap-analysis") throw new Error("Analysis reports are not scenario files.");
    const candidate = parsed?.scenario ?? parsed;
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) throw new Error("Scenario must be an object.");
    return sanitizeScenario(candidate);
  } catch {
    return { scenario: null, errors: ["Import failed. Choose a valid Weekend Gap scenario JSON file."] };
  }
}
