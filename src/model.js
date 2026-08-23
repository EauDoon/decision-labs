/**
 * Partnership Breakpoint economic model.
 * All money values are monthly units in the currency selected by the user.
 */

export const EPSILON = 1e-9;
export const MAX_PARTICIPANTS = 24;
export const MAX_NUMERIC_INPUT = 1_000_000_000_000_000;
const CONFIG_KEYS = new Set(['deal', 'participants']);
const DEAL_KEYS = new Set(['monthlyVolume', 'feePerTransaction', 'addressableVolume', 'volumeShockPct']);
const PARTICIPANT_KEYS = new Set(['id', 'name', 'revenueShare', 'variableCostPerTransaction', 'fixedMonthlyCost', 'minimumAcceptableProfit', 'capacity', 'minimumCommitment', 'riskCost']);

export class ValidationError extends Error {
  constructor(errors) {
    super('Invalid partnership configuration.');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export const PRESETS = Object.freeze({
  balanced: {
    name: 'Balanced',
    deal: { monthlyVolume: 100000, feePerTransaction: 0.2, addressableVolume: 140000, volumeShockPct: 0 },
    participants: [
      { id: 'platform', name: 'Platform', revenueShare: 0.4, variableCostPerTransaction: 0.04, fixedMonthlyCost: 1800, minimumAcceptableProfit: 1200, capacity: 130000, minimumCommitment: 0, riskCost: 300 },
      { id: 'distributor', name: 'Distributor', revenueShare: 0.35, variableCostPerTransaction: 0.055, fixedMonthlyCost: 500, minimumAcceptableProfit: 500, capacity: 120000, minimumCommitment: 0, riskCost: 100 },
      { id: 'liquidity-partner', name: 'Liquidity Partner', revenueShare: 0.25, variableCostPerTransaction: 0.03, fixedMonthlyCost: 1400, minimumAcceptableProfit: 100, capacity: 115000, minimumCommitment: 0, riskCost: 300 },
    ],
  },
  thinMargin: {
    name: 'Thin Margin',
    deal: { monthlyVolume: 100000, feePerTransaction: 0.16, addressableVolume: 120000, volumeShockPct: 0 },
    participants: [
      { id: 'platform', name: 'Platform', revenueShare: 0.4, variableCostPerTransaction: 0.035, fixedMonthlyCost: 1800, minimumAcceptableProfit: 700, capacity: 120000, minimumCommitment: 0, riskCost: 300 },
      { id: 'distributor', name: 'Distributor', revenueShare: 0.35, variableCostPerTransaction: 0.046, fixedMonthlyCost: 500, minimumAcceptableProfit: 400, capacity: 115000, minimumCommitment: 0, riskCost: 100 },
      { id: 'liquidity-partner', name: 'Liquidity Partner', revenueShare: 0.25, variableCostPerTransaction: 0.024, fixedMonthlyCost: 1300, minimumAcceptableProfit: 100, capacity: 110000, minimumCommitment: 0, riskCost: 200 },
    ],
  },
  growthAtCost: {
    name: 'Growth at a Cost',
    deal: { monthlyVolume: 180000, feePerTransaction: 0.16, addressableVolume: 260000, volumeShockPct: 0 },
    participants: [
      { id: 'platform', name: 'Platform', revenueShare: 0.43, variableCostPerTransaction: 0.028, fixedMonthlyCost: 2800, minimumAcceptableProfit: 2500, capacity: 225000, minimumCommitment: 0, riskCost: 600 },
      { id: 'distributor', name: 'Distributor', revenueShare: 0.33, variableCostPerTransaction: 0.044, fixedMonthlyCost: 750, minimumAcceptableProfit: 500, capacity: 190000, minimumCommitment: 0, riskCost: 250 },
      { id: 'liquidity-partner', name: 'Liquidity Partner', revenueShare: 0.24, variableCostPerTransaction: 0.024, fixedMonthlyCost: 2000, minimumAcceptableProfit: 0, capacity: 210000, minimumCommitment: 0, riskCost: 500 },
    ],
  },
});

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function nonNegative(value, field, errors, { optional = false } = {}) {
  if (optional && (value === null || value === undefined)) return null;
  if (!isFiniteNumber(value) || value < 0 || value > MAX_NUMERIC_INPUT) {
    errors.push(`${field} must be a finite number from zero through ${MAX_NUMERIC_INPUT}.`);
    return null;
  }
  return value;
}

function rejectUnknownKeys(value, allowed, field, errors) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) errors.push(`${field} contains an unknown field: ${key}.`);
  }
}

function stringValue(value, field, errors, maxLength = 80) {
  if (typeof value !== 'string' || value.trim() === '' || value.trim().length > maxLength) {
    errors.push(`${field} must be a non-empty string no longer than ${maxLength} characters.`);
    return '';
  }
  return value.trim();
}

/** Returns validation errors without throwing, so forms can report all issues at once. */
export function validateConfiguration(config) {
  const errors = [];
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return { valid: false, errors: ['Configuration must be an object.'] };
  }
  rejectUnknownKeys(config, CONFIG_KEYS, 'Configuration', errors);

  const deal = config.deal;
  if (!deal || typeof deal !== 'object' || Array.isArray(deal)) {
    errors.push('Deal must be an object.');
  } else {
    rejectUnknownKeys(deal, DEAL_KEYS, 'Deal', errors);
    nonNegative(deal.monthlyVolume, 'Deal monthly volume', errors);
    nonNegative(deal.feePerTransaction, 'Deal fee per transaction', errors);
    nonNegative(deal.addressableVolume, 'Deal addressable volume', errors);
    const shock = deal.volumeShockPct ?? 0;
    if (!isFiniteNumber(shock) || shock < 0 || shock > 100) {
      errors.push('Deal volume shock must be a finite percentage from 0 through 100.');
    }
  }

  if (!Array.isArray(config.participants) || config.participants.length < 2 || config.participants.length > MAX_PARTICIPANTS) {
    errors.push(`Between 2 and ${MAX_PARTICIPANTS} participants are required.`);
  } else {
    const ids = new Set();
    let shareTotal = 0;
    config.participants.forEach((participant, index) => {
      const prefix = `Participant ${index + 1}`;
      if (!participant || typeof participant !== 'object' || Array.isArray(participant)) {
        errors.push(`${prefix} must be an object.`);
        return;
      }
      rejectUnknownKeys(participant, PARTICIPANT_KEYS, prefix, errors);
      const id = stringValue(participant.id, `${prefix} id`, errors, 64);
      if (id && ids.has(id)) errors.push(`${prefix} id must be unique.`);
      ids.add(id);
      stringValue(participant.name, `${prefix} name`, errors);
      const share = nonNegative(participant.revenueShare, `${prefix} revenue share`, errors);
      if (share !== null) shareTotal += share;
      nonNegative(participant.variableCostPerTransaction, `${prefix} variable cost per transaction`, errors);
      nonNegative(participant.fixedMonthlyCost, `${prefix} fixed monthly cost`, errors);
      nonNegative(participant.minimumAcceptableProfit, `${prefix} minimum acceptable monthly profit`, errors);
      nonNegative(participant.capacity, `${prefix} capacity`, errors, { optional: true });
      nonNegative(participant.minimumCommitment, `${prefix} minimum commitment`, errors, { optional: true });
      nonNegative(participant.riskCost, `${prefix} risk cost`, errors);
    });
    if (Math.abs(shareTotal - 1) > EPSILON) {
      errors.push(`Participant revenue shares must sum to 1. Current total: ${shareTotal.toFixed(6)}.`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function assertValidConfiguration(config) {
  const validation = validateConfiguration(config);
  if (!validation.valid) throw new ValidationError(validation.errors);
  return config;
}

/**
 * Actual monthly transactions are limited by addressable demand after the chosen volume shock.
 */
export function effectiveVolume(deal) {
  const shockedVolume = deal.monthlyVolume * (1 - (deal.volumeShockPct ?? 0) / 100);
  return Math.min(shockedVolume, deal.addressableVolume);
}

export function contributionPerTransaction(participant, feePerTransaction) {
  return participant.revenueShare * feePerTransaction - participant.variableCostPerTransaction;
}

/** The transaction volume at which accounting profit equals zero. */
export function breakEvenVolume(participant, feePerTransaction) {
  const contribution = contributionPerTransaction(participant, feePerTransaction);
  const monthlyOverhead = participant.fixedMonthlyCost + participant.riskCost;
  if (contribution <= 0) return monthlyOverhead === 0 ? 0 : null;
  return monthlyOverhead / contribution;
}

/** The minimum volume that clears the participant's monthly profit and commitment exit tests. */
export function exitVolume(participant, feePerTransaction) {
  const contribution = contributionPerTransaction(participant, feePerTransaction);
  const requiredProfit = participant.minimumAcceptableProfit + participant.fixedMonthlyCost + participant.riskCost;
  let profitVolume;
  if (contribution > 0) profitVolume = requiredProfit / contribution;
  else if (requiredProfit === 0) profitVolume = 0;
  else return null;
  return Math.max(profitVolume, participant.minimumCommitment ?? 0);
}

function economicConstraint(participant, feePerTransaction, exitThreshold) {
  if (exitThreshold === null) return { kind: 'profit', label: 'minimum acceptable profit' };
  const contribution = contributionPerTransaction(participant, feePerTransaction);
  const requiredProfit = participant.minimumAcceptableProfit + participant.fixedMonthlyCost + participant.riskCost;
  const profitVolume = contribution > 0 ? requiredProfit / contribution : 0;
  return (participant.minimumCommitment ?? 0) > profitVolume + EPSILON
    ? { kind: 'commitment', label: 'minimum commitment' }
    : { kind: 'profit', label: 'minimum acceptable profit' };
}

function shockResult({ kind, breakpoint, current, direction, reason }) {
  if (breakpoint === null) return { kind, status: 'unbounded', breakpoint: null, change: null, changePct: null, reason };
  const rawChange = direction === 'decrease' ? current - breakpoint : breakpoint - current;
  const change = Math.max(0, rawChange);
  return {
    kind,
    status: change <= EPSILON ? 'at-breakpoint' : 'bounded',
    breakpoint,
    change,
    changePct: current === 0 ? null : (change / current) * 100,
    reason,
  };
}

/**
 * Returns the threshold and required adverse movement. At a threshold, any additional adverse movement fails.
 */
export function participantShocks(participant, deal, volume = effectiveVolume(deal)) {
  const currentProfit = participant.revenueShare * deal.feePerTransaction * volume
    - participant.variableCostPerTransaction * volume
    - participant.fixedMonthlyCost
    - participant.riskCost;
  const currentExit = evaluateParticipant(participant, deal, volume);
  if (!currentExit.viable) {
    const immediate = { status: 'already-failing', breakpoint: null, change: 0, changePct: 0, reason: 'The current scenario already fails this participant exit criterion.' };
    return {
      volume: { kind: 'volume', ...immediate },
      volumeIncrease: { kind: 'volumeIncrease', ...immediate },
      fee: { kind: 'fee', ...immediate },
      variableCost: { kind: 'variableCost', ...immediate },
      currentProfit,
    };
  }

  const targetVolume = exitVolume(participant, deal.feePerTransaction);
  const volumeShock = targetVolume === null || targetVolume <= 0
    ? { kind: 'volume', status: 'unbounded', breakpoint: null, change: null, changePct: null, reason: 'Lower volume does not breach the participant exit criterion under these inputs.' }
    : shockResult({ kind: 'volume', breakpoint: targetVolume, current: volume, direction: 'decrease', reason: 'Volume where the profit or commitment exit threshold is reached.' });
  const capacity = participant.capacity ?? null;
  const volumeIncrease = capacity === null
    ? { kind: 'volumeIncrease', status: 'unbounded', breakpoint: null, change: null, changePct: null, reason: 'No participant capacity limit is supplied.' }
    : shockResult({ kind: 'volumeIncrease', breakpoint: capacity, current: volume, direction: 'increase', reason: 'Volume where the participant capacity limit is reached.' });

  const revenueUnits = volume * participant.revenueShare;
  const feeBreakpoint = revenueUnits <= EPSILON
    ? null
    : (participant.minimumAcceptableProfit + volume * participant.variableCostPerTransaction + participant.fixedMonthlyCost + participant.riskCost) / revenueUnits;
  const feeShock = feeBreakpoint === null || feeBreakpoint <= EPSILON
    ? { kind: 'fee', status: 'unbounded', breakpoint: null, change: null, changePct: null, reason: 'No non-negative fee decrease breaches this participant profit threshold.' }
    : shockResult({ kind: 'fee', breakpoint: feeBreakpoint, current: deal.feePerTransaction, direction: 'decrease', reason: 'Fee where the monthly-profit exit threshold is reached.' });

  const costBreakpoint = volume <= EPSILON
    ? null
    : (participant.revenueShare * deal.feePerTransaction * volume - participant.fixedMonthlyCost - participant.riskCost - participant.minimumAcceptableProfit) / volume;
  const costShock = costBreakpoint === null
    ? { kind: 'variableCost', status: 'unbounded', breakpoint: null, change: null, changePct: null, reason: 'A variable-cost increase cannot change this participant profit at zero volume.' }
    : shockResult({ kind: 'variableCost', breakpoint: costBreakpoint, current: participant.variableCostPerTransaction, direction: 'increase', reason: 'Variable cost where the monthly-profit exit threshold is reached.' });

  return { volume: volumeShock, volumeIncrease, fee: feeShock, variableCost: costShock, currentProfit };
}

export function evaluateParticipant(participant, deal, volume = effectiveVolume(deal)) {
  const revenue = volume * deal.feePerTransaction * participant.revenueShare;
  const variableCost = volume * participant.variableCostPerTransaction;
  const fixedCost = participant.fixedMonthlyCost;
  const riskCost = participant.riskCost;
  const totalCosts = variableCost + fixedCost + riskCost;
  const monthlyProfit = revenue - totalCosts;
  const margin = revenue === 0 ? null : monthlyProfit / revenue;
  const commitment = participant.minimumCommitment ?? 0;
  const capacity = participant.capacity ?? null;
  const profitPass = monthlyProfit >= participant.minimumAcceptableProfit - EPSILON;
  const commitmentPass = volume >= commitment - EPSILON;
  const capacityPass = capacity === null || volume <= capacity + EPSILON;
  const exitThreshold = exitVolume(participant, deal.feePerTransaction);
  const headroomToExit = exitThreshold === null ? null : volume - exitThreshold;
  const capacityHeadroom = capacity === null ? Infinity : capacity - volume;
  const fragilityHeadroom = Math.min(headroomToExit ?? -Infinity, capacityHeadroom);
  const economicLimit = economicConstraint(participant, deal.feePerTransaction, exitThreshold);
  const bindingConstraint = capacityHeadroom < (headroomToExit ?? -Infinity) - EPSILON
    ? { kind: 'capacity', label: 'capacity' }
    : economicLimit;
  const failureReasons = [];
  if (!profitPass) failureReasons.push('monthly profit is below the minimum acceptable profit');
  if (!commitmentPass) failureReasons.push('volume is below the minimum commitment');
  if (!capacityPass) failureReasons.push('volume exceeds capacity');
  return {
    ...participant,
    volume,
    revenue,
    variableCost,
    fixedCost,
    riskCost,
    totalCosts,
    monthlyProfit,
    margin,
    contributionPerTransaction: contributionPerTransaction(participant, deal.feePerTransaction),
    breakEvenVolume: breakEvenVolume(participant, deal.feePerTransaction),
    exitVolume: exitThreshold,
    headroomToExit,
    capacityHeadroom,
    fragilityHeadroom,
    bindingConstraint,
    profitPass,
    commitmentPass,
    capacityPass,
    viable: profitPass && commitmentPass && capacityPass,
    failureReasons,
  };
}

const SHOCK_ORDER = Object.freeze(['volume', 'fee', 'variableCost']);

/**
 * Identifies the first adverse movement in the current scenario, using the
 * smallest percentage change from the current value as the comparison unit.
 * This is a prioritisation aid, not a probability or a claim about behaviour.
 */
export function firstBreakpoint(result) {
  const candidates = [];
  result.participants.forEach((participant, participantIndex) => {
    SHOCK_ORDER.forEach((kind, kindIndex) => {
      const shock = participant.shocks?.[kind];
      if (!shock || shock.status === 'unbounded') return;
      const priority = shock.status === 'already-failing' || shock.status === 'at-breakpoint'
        ? 0
        : shock.changePct === null ? Number.POSITIVE_INFINITY : shock.changePct;
      candidates.push({ participantIndex, kindIndex, kind, participant, shock, priority });
    });
  });
  candidates.sort((a, b) => a.priority - b.priority || a.participantIndex - b.participantIndex || a.kindIndex - b.kindIndex);
  const selected = candidates[0];
  if (!selected) {
    return { status: 'unbounded', participant: null, kind: null, shock: null, comparison: 'relative-change' };
  }
  return {
    status: selected.shock.status,
    participant: selected.participant,
    kind: selected.kind,
    shock: selected.shock,
    comparison: 'relative-change',
  };
}

export function calculatePartnership(config) {
  assertValidConfiguration(config);
  const volume = effectiveVolume(config.deal);
  const participants = config.participants.map((participant) => {
    const result = evaluateParticipant(participant, config.deal, volume);
    return { ...result, shocks: participantShocks(participant, config.deal, volume) };
  });
  const totalRevenue = volume * config.deal.feePerTransaction;
  const totalProfit = participants.reduce((sum, participant) => sum + participant.monthlyProfit, 0);
  const viable = participants.every((participant) => participant.viable);
  const weakestParticipant = [...participants].sort((a, b) => {
    return a.fragilityHeadroom - b.fragilityHeadroom || a.monthlyProfit - b.monthlyProfit || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  })[0];
  const capacityCeiling = participants.reduce((ceiling, participant) => (
    participant.capacity === null ? ceiling : Math.min(ceiling, participant.capacity)
  ), config.deal.addressableVolume);
  const result = {
    deal: { ...config.deal },
    effectiveVolume: volume,
    volumeCappedByAddressableDemand: volume < config.deal.monthlyVolume * (1 - (config.deal.volumeShockPct ?? 0) / 100) - EPSILON,
    totalRevenue,
    totalProfit,
    participants,
    viable,
    weakestParticipant,
    capacityCeiling,
  };
  return { ...result, firstBreakpoint: firstBreakpoint(result) };
}

/** Creates a safe immutable copy for UI state or JSON export. */
export function clonePreset(key) {
  const preset = PRESETS[key];
  if (!preset) throw new Error(`Unknown preset: ${key}`);
  return JSON.parse(JSON.stringify({ deal: preset.deal, participants: preset.participants }));
}

export function makeParticipant(id) {
  return {
    id,
    name: 'New participant',
    revenueShare: 0,
    variableCostPerTransaction: 0,
    fixedMonthlyCost: 0,
    minimumAcceptableProfit: 0,
    capacity: null,
    minimumCommitment: null,
    riskCost: 0,
  };
}
