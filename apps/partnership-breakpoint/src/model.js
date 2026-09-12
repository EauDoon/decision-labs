/**
 * Partnership Breakpoint economic model.
 * All money values are monthly units in the currency selected by the user.
 *
 * @typedef {object} Deal
 * @property {number} monthlyVolume Planned transactions per month before `volumeShockPct`.
 * @property {number} feePerTransaction Gross fee collected per transaction.
 * @property {number} addressableVolume Maximum transactions available from demand.
 * @property {number} [volumeShockPct] Optional reduction from planned volume, 0 through 100.
 * @property {string} [title] Optional display name, 1 through 80 characters after trimming.
 * @property {string} [currency] Optional 3-letter uppercase display prefix such as USD. Omitted values keep the word units.
 * @property {string} [notes] Optional notes, 1 through 500 characters after trimming.
 *
 * @typedef {object} ParticipantInput
 * @property {string} id Unique identifier, at most 64 characters.
 * @property {string} name Display name, at most 80 characters.
 * @property {number} revenueShare Share of gross fee revenue, 0 through 1; all shares must sum to 1.
 * @property {number} variableCostPerTransaction
 * @property {number} fixedMonthlyCost
 * @property {number} minimumAcceptableProfit
 * @property {number|null} [capacity]
 * @property {number|null} [minimumCommitment]
 * @property {number} riskCost
 *
 * @typedef {object} StressSettings
 * @property {number} volumeDropPct 0 through 100.
 * @property {number} volumeGrowthPct 0 through 100.
 * @property {number} feeDropPct 0 through 100.
 * @property {number} variableCostRisePct 0 through 200.
 *
 * @typedef {object} PartnershipConfig
 * @property {Deal} deal
 * @property {ParticipantInput[]} participants
 * @property {StressSettings} [stress] Optional. Legacy cases omit this object.
 * @property {boolean} [collapseAllHoldCases] Optional display preference. Omitted files default to expanded.
 * @property {boolean} [hideHoldingParticipants] Optional roster display preference. Omitted files default to showing holders.
 * @property {boolean} [hideAllHoldLedger] Optional ledger display preference. Omitted files default to showing all-hold rows.
 * @property {boolean} [hideZeroShareParticipants] Optional roster display preference. Omitted files default to showing zero-share rows.
 * @property {boolean} [hideParticipantsOverCapacity] Optional roster display preference. Omitted files default to showing rows whose volume is above listed capacity.
 * @property {boolean} [hideParticipantsAtHold] Optional roster display preference. Omitted files default to showing rows whose volume headroom is at or above a hold with no listed capacity breach.
 * @property {boolean} [hideParticipantsWithoutCapacity] Optional roster display preference. Omitted files default to showing rows whose capacity is unbounded or omitted.
 * @property {boolean} [hideParticipantsWithSpareCapacity] Optional roster display preference. Omitted files default to showing rows that still have unused listed capacity.
 * @property {boolean} [hideParticipantsAtLeastHeadroom] Optional roster display preference. Omitted files default to showing the least-headroom roster row.
 * @property {boolean} [hideParticipantsWithinCapacity] Optional roster display preference. Omitted files default to showing roster rows that are within listed capacity.
 * @property {boolean} [hideFirstBreakpointParticipant] Optional roster display preference. Omitted files default to showing the first-breakpoint roster row.
 * @property {boolean} [hideFirstOverCapacityParticipant] Optional roster display preference. Omitted files default to showing the first over-capacity roster row.
 * @property {boolean} [hideLastOverCapacityParticipant] Optional roster display preference. Omitted files default to showing the last over-capacity roster row.
 * @property {boolean} [hideLastBreakpointParticipant] Optional roster display preference. Omitted files default to showing the last first-breakpoint roster row.
 * @property {boolean} [hideLastWithinCapacityParticipant] Optional roster display preference. Omitted files default to showing the last within-capacity roster row.
 * @property {boolean} [hideFirstWithinCapacityParticipant] Optional roster display preference. Omitted files default to showing the first within-capacity roster row.
 * @property {boolean} [hideLastSpareCapacityParticipant] Optional roster display preference. Omitted files default to showing the last roster row that currently has unused listed capacity.
 * @property {boolean} [hideFirstSpareCapacityParticipant] Optional roster display preference. Omitted files default to showing the first roster row that currently has unused listed capacity.
 * @property {boolean} [hideLastParticipantWithoutCapacity] Optional roster display preference. Omitted files default to showing the last roster row whose capacity is unbounded or omitted.
 * @property {boolean} [hideFirstParticipantWithoutCapacity] Optional roster display preference. Omitted files default to showing the first roster row whose capacity is unbounded or omitted.
 * @property {boolean} [hideLastParticipantAtHold] Optional roster display preference. Omitted files default to showing the last roster row currently at hold (remaining-to-hold is 0).
 * @property {boolean} [hideFirstParticipantAtHold] Optional roster display preference. Omitted files default to showing the first roster row currently at hold (remaining-to-hold is 0).
 * @property {boolean} [hideFirstZeroShareParticipant] Optional roster display preference. Omitted files default to showing the first roster row with zero revenue share.
 * @property {boolean} [hideLastZeroShareParticipant] Optional roster display preference. Omitted files default to showing the last roster row with zero revenue share.
 *
 * @typedef {object} ShockResult
 * @property {string} kind
 * @property {'bounded'|'unbounded'|'at-breakpoint'|'already-failing'} status
 * @property {number|null} breakpoint
 * @property {number|null} change
 * @property {number|null} changePct
 * @property {string} reason
 */

export const EPSILON = 1e-9;
export const MAX_PARTICIPANTS = 24;
export const MAX_NUMERIC_INPUT = 1_000_000_000_000_000;
const CONFIG_KEYS = new Set(['deal', 'participants', 'stress', 'collapseAllHoldCases', 'hideHoldingParticipants', 'hideAllHoldLedger', 'hideZeroShareParticipants', 'hideParticipantsOverCapacity', 'hideParticipantsAtHold', 'hideParticipantsWithoutCapacity', 'hideParticipantsWithSpareCapacity', 'hideParticipantsAtLeastHeadroom', 'hideParticipantsWithinCapacity', 'hideFirstBreakpointParticipant', 'hideFirstOverCapacityParticipant', 'hideLastOverCapacityParticipant', 'hideLastBreakpointParticipant', 'hideLastWithinCapacityParticipant', 'hideFirstWithinCapacityParticipant', 'hideLastSpareCapacityParticipant', 'hideFirstSpareCapacityParticipant', 'hideLastParticipantWithoutCapacity', 'hideFirstParticipantWithoutCapacity', 'hideLastParticipantAtHold', 'hideFirstParticipantAtHold', 'hideFirstZeroShareParticipant', 'hideLastZeroShareParticipant']);
const DEAL_KEYS = new Set(['monthlyVolume', 'feePerTransaction', 'addressableVolume', 'volumeShockPct', 'title', 'currency', 'notes']);
const PARTICIPANT_KEYS = new Set(['id', 'name', 'revenueShare', 'variableCostPerTransaction', 'fixedMonthlyCost', 'minimumAcceptableProfit', 'capacity', 'minimumCommitment', 'riskCost']);
const RESERVED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
/** @type {Readonly<StressSettings>} Illustrative GUI defaults; not forecasts. */
export const DEFAULT_STRESS = Object.freeze({ volumeDropPct: 20, volumeGrowthPct: 20, feeDropPct: 10, variableCostRisePct: 20 });
const STRESS_LIMITS = Object.freeze({ volumeDropPct: 100, volumeGrowthPct: 100, feeDropPct: 100, variableCostRisePct: 200 });

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
  creatorTakeRate: {
    name: 'Creator take-rate',
    deal: { monthlyVolume: 50000, feePerTransaction: 2.5, addressableVolume: 80000, volumeShockPct: 0 },
    participants: [
      { id: 'creator', name: 'Creator', revenueShare: 0.7, variableCostPerTransaction: 0.15, fixedMonthlyCost: 400, minimumAcceptableProfit: 75000, capacity: 90000, minimumCommitment: 0, riskCost: 200 },
      { id: 'platform', name: 'Platform', revenueShare: 0.3, variableCostPerTransaction: 0.35, fixedMonthlyCost: 6000, minimumAcceptableProfit: 2000, capacity: 100000, minimumCommitment: 0, riskCost: 800 },
    ],
  },
  threePartyJv: {
    name: 'Three-party JV',
    deal: { monthlyVolume: 12000, feePerTransaction: 40, addressableVolume: 15000, volumeShockPct: 0 },
    participants: [
      { id: 'operator', name: 'Operator', revenueShare: 0.45, variableCostPerTransaction: 8, fixedMonthlyCost: 25000, minimumAcceptableProfit: 15000, capacity: 14000, minimumCommitment: 0, riskCost: 4000 },
      { id: 'capital', name: 'Capital Partner', revenueShare: 0.35, variableCostPerTransaction: 0, fixedMonthlyCost: 0, minimumAcceptableProfit: 80000, capacity: null, minimumCommitment: 0, riskCost: 12000 },
      { id: 'ip-owner', name: 'IP Owner', revenueShare: 0.2, variableCostPerTransaction: 1.5, fixedMonthlyCost: 8000, minimumAcceptableProfit: 20000, capacity: 20000, minimumCommitment: 5000, riskCost: 2000 },
    ],
  },
  twoPartyStudio: {
    name: 'Two-party 50/50 studio',
    deal: { monthlyVolume: 6000, feePerTransaction: 18, addressableVolume: 9000, volumeShockPct: 0 },
    participants: [
      { id: 'production-studio', name: 'Production studio', revenueShare: 0.5, variableCostPerTransaction: 4.5, fixedMonthlyCost: 12000, minimumAcceptableProfit: 8000, capacity: 7500, minimumCommitment: 1500, riskCost: 2000 },
      { id: 'distribution-studio', name: 'Distribution studio', revenueShare: 0.5, variableCostPerTransaction: 2.25, fixedMonthlyCost: 6000, minimumAcceptableProfit: 5000, capacity: 12000, minimumCommitment: 0, riskCost: 1500 },
    ],
  },
  fourPartyMarketplace: {
    name: 'Four-party marketplace',
    deal: { monthlyVolume: 25000, feePerTransaction: 1.2, addressableVolume: 40000, volumeShockPct: 0 },
    participants: [
      { id: 'marketplace', name: 'Marketplace', revenueShare: 0.28, variableCostPerTransaction: 0.05, fixedMonthlyCost: 2500, minimumAcceptableProfit: 3000, capacity: 38000, minimumCommitment: 0, riskCost: 400 },
      { id: 'seller', name: 'Seller', revenueShare: 0.42, variableCostPerTransaction: 0.12, fixedMonthlyCost: 1500, minimumAcceptableProfit: 7500, capacity: 45000, minimumCommitment: 5000, riskCost: 300 },
      { id: 'logistics', name: 'Logistics', revenueShare: 0.18, variableCostPerTransaction: 0.06, fixedMonthlyCost: 1200, minimumAcceptableProfit: 600, capacity: 32000, minimumCommitment: 4000, riskCost: 200 },
      { id: 'payments', name: 'Payments', revenueShare: 0.12, variableCostPerTransaction: 0.03, fixedMonthlyCost: 500, minimumAcceptableProfit: 1800, capacity: 26000, minimumCommitment: 0, riskCost: 100 },
    ],
  },
  licensorDistributor: {
    name: 'Licensor and distributor',
    deal: { monthlyVolume: 9000, feePerTransaction: 22, addressableVolume: 14000, volumeShockPct: 0 },
    participants: [
      { id: 'ip-licensor', name: 'IP licensor', revenueShare: 0.4, variableCostPerTransaction: 0.25, fixedMonthlyCost: 3500, minimumAcceptableProfit: 20000, capacity: null, minimumCommitment: 0, riskCost: 1500 },
      { id: 'territory-distributor', name: 'Territory distributor', revenueShare: 0.6, variableCostPerTransaction: 6.5, fixedMonthlyCost: 14000, minimumAcceptableProfit: 9000, capacity: 11000, minimumCommitment: 2500, riskCost: 2800 },
    ],
  },
  talentAgentPlatform: {
    name: 'Talent, agent, and platform',
    deal: { monthlyVolume: 7500, feePerTransaction: 24, addressableVolume: 11000, volumeShockPct: 0 },
    participants: [
      { id: 'talent', name: 'Talent', revenueShare: 0.62, variableCostPerTransaction: 1.2, fixedMonthlyCost: 10000, minimumAcceptableProfit: 25000, capacity: null, minimumCommitment: 0, riskCost: 2500 },
      { id: 'booking-agent', name: 'Booking agent', revenueShare: 0.18, variableCostPerTransaction: 0.35, fixedMonthlyCost: 2500, minimumAcceptableProfit: 4000, capacity: 10000, minimumCommitment: 2000, riskCost: 400 },
      { id: 'booking-platform', name: 'Platform', revenueShare: 0.2, variableCostPerTransaction: 0.9, fixedMonthlyCost: 5000, minimumAcceptableProfit: 3000, capacity: 12000, minimumCommitment: 0, riskCost: 700 },
    ],
  },
  threePartyJointVenture: {
    name: 'Three-party joint venture',
    deal: { monthlyVolume: 8000, feePerTransaction: 55, addressableVolume: 12000, volumeShockPct: 0 },
    participants: [
      { id: 'synthetic-operator', name: 'Synthetic operator', revenueShare: 0.4, variableCostPerTransaction: 6, fixedMonthlyCost: 18000, minimumAcceptableProfit: 12000, capacity: 10000, minimumCommitment: 0, riskCost: 3000 },
      { id: 'capital-partner', name: 'Capital partner', revenueShare: 0.38, variableCostPerTransaction: 0.5, fixedMonthlyCost: 2000, minimumAcceptableProfit: 50000, capacity: null, minimumCommitment: 0, riskCost: 8000 },
      { id: 'operator-talent', name: 'Operator-talent', revenueShare: 0.22, variableCostPerTransaction: 3, fixedMonthlyCost: 9000, minimumAcceptableProfit: 15000, capacity: 15000, minimumCommitment: 2000, riskCost: 1500 },
    ],
  },
  podcastHostNetwork: {
    name: 'Podcast host and network',
    deal: { monthlyVolume: 3500, feePerTransaction: 14, addressableVolume: 6000, volumeShockPct: 0 },
    participants: [
      { id: 'podcast-host', name: 'Podcast host', revenueShare: 0.58, variableCostPerTransaction: 2.2, fixedMonthlyCost: 3500, minimumAcceptableProfit: 7000, capacity: null, minimumCommitment: 0, riskCost: 800 },
      { id: 'podcast-network', name: 'Podcast network', revenueShare: 0.42, variableCostPerTransaction: 0.9, fixedMonthlyCost: 8000, minimumAcceptableProfit: 4500, capacity: 5000, minimumCommitment: 1000, riskCost: 1100 },
    ],
  },
  communityHallSplit: {
    name: 'Community hall split',
    deal: { monthlyVolume: 2000, feePerTransaction: 28, addressableVolume: 3500, volumeShockPct: 0 },
    participants: [
      { id: 'venue', name: 'Venue', revenueShare: 0.45, variableCostPerTransaction: 1.5, fixedMonthlyCost: 8000, minimumAcceptableProfit: 5000, capacity: 3000, minimumCommitment: 0, riskCost: 1200 },
      { id: 'promoter', name: 'Promoter', revenueShare: 0.35, variableCostPerTransaction: 4, fixedMonthlyCost: 2500, minimumAcceptableProfit: 3500, capacity: 4500, minimumCommitment: 400, riskCost: 800 },
      { id: 'sound', name: 'Sound', revenueShare: 0.2, variableCostPerTransaction: 2.8, fixedMonthlyCost: 1800, minimumAcceptableProfit: 2000, capacity: 2800, minimumCommitment: 0, riskCost: 400 },
    ],
  },
  festivalStallSplit: {
    name: 'Festival stall split',
    deal: { monthlyVolume: 2400, feePerTransaction: 18, addressableVolume: 3600, volumeShockPct: 0 },
    participants: [
      { id: 'stallholder', name: 'Stallholder', revenueShare: 0.48, variableCostPerTransaction: 4.2, fixedMonthlyCost: 1800, minimumAcceptableProfit: 4500, capacity: 3200, minimumCommitment: 400, riskCost: 500 },
      { id: 'site-manager', name: 'Site manager', revenueShare: 0.32, variableCostPerTransaction: 0.6, fixedMonthlyCost: 4200, minimumAcceptableProfit: 2800, capacity: 4000, minimumCommitment: 0, riskCost: 800 },
      { id: 'ticket-office', name: 'Ticket office', revenueShare: 0.2, variableCostPerTransaction: 1.4, fixedMonthlyCost: 900, minimumAcceptableProfit: 1200, capacity: 2800, minimumCommitment: 0, riskCost: 200 },
    ],
  },
  popupCinemaSplit: {
    name: 'Pop-up cinema split',
    deal: { monthlyVolume: 1600, feePerTransaction: 24, addressableVolume: 2800, volumeShockPct: 0 },
    participants: [
      { id: 'cinema-venue', name: 'Cinema venue', revenueShare: 0.42, variableCostPerTransaction: 1.8, fixedMonthlyCost: 7200, minimumAcceptableProfit: 4200, capacity: 2800, minimumCommitment: 0, riskCost: 1000 },
      { id: 'projectionist', name: 'Projectionist', revenueShare: 0.33, variableCostPerTransaction: 3.6, fixedMonthlyCost: 2100, minimumAcceptableProfit: 2800, capacity: 3600, minimumCommitment: 250, riskCost: 550 },
      { id: 'ticket-desk', name: 'Ticket desk', revenueShare: 0.25, variableCostPerTransaction: 0.95, fixedMonthlyCost: 1300, minimumAcceptableProfit: 1600, capacity: 2400, minimumCommitment: 0, riskCost: 280 },
    ],
  },
  communityRadioSplit: {
    name: 'Community radio split',
    deal: { monthlyVolume: 3200, feePerTransaction: 11, addressableVolume: 4800, volumeShockPct: 0 },
    participants: [
      { id: 'presenter', name: 'Presenter', revenueShare: 0.44, variableCostPerTransaction: 1.7, fixedMonthlyCost: 2400, minimumAcceptableProfit: 2800, capacity: 4000, minimumCommitment: 400, riskCost: 500 },
      { id: 'station', name: 'Station', revenueShare: 0.36, variableCostPerTransaction: 0.5, fixedMonthlyCost: 3600, minimumAcceptableProfit: 1800, capacity: 5200, minimumCommitment: 0, riskCost: 700 },
      { id: 'underwriter', name: 'Underwriter', revenueShare: 0.2, variableCostPerTransaction: 1.05, fixedMonthlyCost: 800, minimumAcceptableProfit: 1100, capacity: 3500, minimumCommitment: 0, riskCost: 260 },
    ],
  },
  schoolConcertSplit: {
    name: 'School concert split',
    deal: { monthlyVolume: 1800, feePerTransaction: 12, addressableVolume: 2600, volumeShockPct: 0 },
    participants: [
      { id: 'concert-venue', name: 'Concert venue', revenueShare: 0.46, variableCostPerTransaction: 1.2, fixedMonthlyCost: 2800, minimumAcceptableProfit: 1200, capacity: 2400, minimumCommitment: 0, riskCost: 400 },
      { id: 'pta', name: 'PTA', revenueShare: 0.31, variableCostPerTransaction: 0.85, fixedMonthlyCost: 700, minimumAcceptableProfit: 500, capacity: 2800, minimumCommitment: 200, riskCost: 150 },
      { id: 'ticketing', name: 'Ticketing', revenueShare: 0.23, variableCostPerTransaction: 0.35, fixedMonthlyCost: 400, minimumAcceptableProfit: 250, capacity: 2200, minimumCommitment: 0, riskCost: 80 },
    ],
  },
  sportsCarnivalSplit: {
    name: 'Sports carnival split',
    deal: { monthlyVolume: 2800, feePerTransaction: 16, addressableVolume: 4200, volumeShockPct: 0 },
    participants: [
      { id: 'carnival-committee', name: 'Carnival committee', revenueShare: 0.43, variableCostPerTransaction: 1.45, fixedMonthlyCost: 3100, minimumAcceptableProfit: 1500, capacity: 3600, minimumCommitment: 0, riskCost: 480 },
      { id: 'ride-operator', name: 'Ride operator', revenueShare: 0.35, variableCostPerTransaction: 3.2, fixedMonthlyCost: 2200, minimumAcceptableProfit: 1100, capacity: 4800, minimumCommitment: 350, riskCost: 360 },
      { id: 'ticket-booth', name: 'Ticket booth', revenueShare: 0.22, variableCostPerTransaction: 0.48, fixedMonthlyCost: 750, minimumAcceptableProfit: 400, capacity: 3200, minimumCommitment: 0, riskCost: 130 },
    ],
  },
  netballCarnivalSplit: {
    name: 'Netball carnival',
    deal: { monthlyVolume: 2100, feePerTransaction: 14, addressableVolume: 3100, volumeShockPct: 0 },
    participants: [
      { id: 'netball-committee', name: 'Carnival committee', revenueShare: 0.41, variableCostPerTransaction: 0.95, fixedMonthlyCost: 2600, minimumAcceptableProfit: 1100, capacity: 3000, minimumCommitment: 0, riskCost: 350 },
      { id: 'canteen', name: 'Canteen', revenueShare: 0.34, variableCostPerTransaction: 2.4, fixedMonthlyCost: 1400, minimumAcceptableProfit: 800, capacity: 3800, minimumCommitment: 250, riskCost: 220 },
      { id: 'first-aid', name: 'First-aid', revenueShare: 0.25, variableCostPerTransaction: 0.55, fixedMonthlyCost: 900, minimumAcceptableProfit: 350, capacity: 2800, minimumCommitment: 0, riskCost: 160 },
    ],
  },
  swimmingCarnivalSplit: {
    name: 'Swimming carnival split',
    deal: { monthlyVolume: 2300, feePerTransaction: 15, addressableVolume: 3400, volumeShockPct: 0 },
    participants: [
      { id: 'swimming-committee', name: 'Carnival committee', revenueShare: 0.4, variableCostPerTransaction: 1.05, fixedMonthlyCost: 2700, minimumAcceptableProfit: 1000, capacity: 3100, minimumCommitment: 0, riskCost: 380 },
      { id: 'pool-operations', name: 'Pool operations', revenueShare: 0.36, variableCostPerTransaction: 2.7, fixedMonthlyCost: 2100, minimumAcceptableProfit: 850, capacity: 4000, minimumCommitment: 300, riskCost: 450 },
      { id: 'swim-canteen', name: 'Canteen', revenueShare: 0.24, variableCostPerTransaction: 1.8, fixedMonthlyCost: 1200, minimumAcceptableProfit: 500, capacity: 2600, minimumCommitment: 0, riskCost: 190 },
    ],
  },
  athleticsCarnivalSplit: {
    name: 'Athletics carnival split',
    deal: { monthlyVolume: 2500, feePerTransaction: 13, addressableVolume: 3600, volumeShockPct: 0 },
    participants: [
      { id: 'athletics-committee', name: 'Carnival committee', revenueShare: 0.42, variableCostPerTransaction: 1.15, fixedMonthlyCost: 2900, minimumAcceptableProfit: 1300, capacity: 3300, minimumCommitment: 0, riskCost: 420 },
      { id: 'track-hire', name: 'Track hire', revenueShare: 0.33, variableCostPerTransaction: 2.9, fixedMonthlyCost: 1900, minimumAcceptableProfit: 900, capacity: 4200, minimumCommitment: 280, riskCost: 310 },
      { id: 'athletics-first-aid', name: 'First-aid', revenueShare: 0.25, variableCostPerTransaction: 0.62, fixedMonthlyCost: 1000, minimumAcceptableProfit: 400, capacity: 2700, minimumCommitment: 0, riskCost: 180 },
    ],
  },
  cricketCarnivalSplit: {
    name: 'Cricket carnival split',
    deal: { monthlyVolume: 2700, feePerTransaction: 12, addressableVolume: 3900, volumeShockPct: 0 },
    participants: [
      { id: 'cricket-committee', name: 'Carnival committee', revenueShare: 0.38, variableCostPerTransaction: 1.32, fixedMonthlyCost: 3150, minimumAcceptableProfit: 1150, capacity: 3450, minimumCommitment: 0, riskCost: 460 },
      { id: 'pitch-hire', name: 'Pitch hire', revenueShare: 0.37, variableCostPerTransaction: 2.35, fixedMonthlyCost: 1650, minimumAcceptableProfit: 780, capacity: 4600, minimumCommitment: 240, riskCost: 275 },
      { id: 'cricket-first-aid', name: 'First-aid', revenueShare: 0.25, variableCostPerTransaction: 0.71, fixedMonthlyCost: 880, minimumAcceptableProfit: 360, capacity: 3000, minimumCommitment: 0, riskCost: 155 },
    ],
  },
  tennisCarnivalSplit: {
    name: 'Tennis carnival split',
    deal: { monthlyVolume: 2900, feePerTransaction: 11, addressableVolume: 4100, volumeShockPct: 0 },
    participants: [
      { id: 'tennis-committee', name: 'Carnival committee', revenueShare: 0.39, variableCostPerTransaction: 1.22, fixedMonthlyCost: 3050, minimumAcceptableProfit: 1200, capacity: 3500, minimumCommitment: 0, riskCost: 440 },
      { id: 'court-hire', name: 'Court hire', revenueShare: 0.36, variableCostPerTransaction: 2.55, fixedMonthlyCost: 1750, minimumAcceptableProfit: 820, capacity: 4700, minimumCommitment: 260, riskCost: 290 },
      { id: 'tennis-first-aid', name: 'First-aid', revenueShare: 0.25, variableCostPerTransaction: 0.68, fixedMonthlyCost: 920, minimumAcceptableProfit: 380, capacity: 3100, minimumCommitment: 0, riskCost: 170 },
    ],
  },
  basketballCarnivalSplit: {
    name: 'Basketball carnival split',
    deal: { monthlyVolume: 3100, feePerTransaction: 10, addressableVolume: 4300, volumeShockPct: 0 },
    participants: [
      { id: 'basketball-committee', name: 'Carnival committee', revenueShare: 0.4, variableCostPerTransaction: 1.08, fixedMonthlyCost: 3280, minimumAcceptableProfit: 1280, capacity: 3750, minimumCommitment: 0, riskCost: 470 },
      { id: 'stadium-hire', name: 'Stadium hire', revenueShare: 0.35, variableCostPerTransaction: 2.48, fixedMonthlyCost: 1880, minimumAcceptableProfit: 860, capacity: 4950, minimumCommitment: 270, riskCost: 305 },
      { id: 'basketball-first-aid', name: 'First-aid', revenueShare: 0.25, variableCostPerTransaction: 0.73, fixedMonthlyCost: 970, minimumAcceptableProfit: 390, capacity: 3350, minimumCommitment: 0, riskCost: 175 },
    ],
  },
  volleyballCarnivalSplit: {
    name: 'Volleyball carnival split',
    deal: { monthlyVolume: 3300, feePerTransaction: 9.5, addressableVolume: 4500, volumeShockPct: 0 },
    participants: [
      { id: 'volleyball-committee', name: 'Carnival committee', revenueShare: 0.36, variableCostPerTransaction: 1.18, fixedMonthlyCost: 3180, minimumAcceptableProfit: 1220, capacity: 3900, minimumCommitment: 0, riskCost: 455 },
      { id: 'volleyball-court-hire', name: 'Court hire', revenueShare: 0.39, variableCostPerTransaction: 2.22, fixedMonthlyCost: 1820, minimumAcceptableProfit: 840, capacity: 5100, minimumCommitment: 250, riskCost: 285 },
      { id: 'volleyball-first-aid', name: 'First-aid', revenueShare: 0.25, variableCostPerTransaction: 0.76, fixedMonthlyCost: 940, minimumAcceptableProfit: 370, capacity: 3550, minimumCommitment: 0, riskCost: 165 },
    ],
  },
  rugbyCarnivalSplit: {
    name: 'Rugby carnival split',
    deal: { monthlyVolume: 3500, feePerTransaction: 9, addressableVolume: 4700, volumeShockPct: 0 },
    participants: [
      { id: 'rugby-committee', name: 'Carnival committee', revenueShare: 0.37, variableCostPerTransaction: 1.28, fixedMonthlyCost: 3320, minimumAcceptableProfit: 1260, capacity: 4200, minimumCommitment: 0, riskCost: 465 },
      { id: 'rugby-ground-hire', name: 'Ground hire', revenueShare: 0.38, variableCostPerTransaction: 2.35, fixedMonthlyCost: 1960, minimumAcceptableProfit: 880, capacity: 5300, minimumCommitment: 280, riskCost: 300 },
      { id: 'rugby-first-aid', name: 'First-aid', revenueShare: 0.25, variableCostPerTransaction: 0.81, fixedMonthlyCost: 990, minimumAcceptableProfit: 400, capacity: 3500, minimumCommitment: 0, riskCost: 180 },
    ],
  },
  hockeyCarnivalSplit: {
    name: 'Hockey carnival split',
    deal: { monthlyVolume: 3700, feePerTransaction: 8.5, addressableVolume: 4900, volumeShockPct: 0 },
    participants: [
      { id: 'hockey-committee', name: 'Carnival committee', revenueShare: 0.37, variableCostPerTransaction: 1.42, fixedMonthlyCost: 3380, minimumAcceptableProfit: 1280, capacity: 4500, minimumCommitment: 0, riskCost: 475 },
      { id: 'hockey-ice-hire', name: 'Ice hire', revenueShare: 0.38, variableCostPerTransaction: 2.05, fixedMonthlyCost: 2040, minimumAcceptableProfit: 860, capacity: 5600, minimumCommitment: 290, riskCost: 295 },
      { id: 'hockey-first-aid', name: 'First-aid', revenueShare: 0.25, variableCostPerTransaction: 0.88, fixedMonthlyCost: 1030, minimumAcceptableProfit: 410, capacity: 3700, minimumCommitment: 0, riskCost: 185 },
    ],
  },
  baseballCarnivalSplit: {
    name: 'Baseball carnival split',
    deal: { monthlyVolume: 3900, feePerTransaction: 8, addressableVolume: 5100, volumeShockPct: 0 },
    participants: [
      { id: 'baseball-committee', name: 'Carnival committee', revenueShare: 0.37, variableCostPerTransaction: 1.52, fixedMonthlyCost: 3440, minimumAcceptableProfit: 1300, capacity: 4800, minimumCommitment: 0, riskCost: 485 },
      { id: 'baseball-diamond-hire', name: 'Diamond hire', revenueShare: 0.38, variableCostPerTransaction: 2.15, fixedMonthlyCost: 2120, minimumAcceptableProfit: 880, capacity: 5900, minimumCommitment: 300, riskCost: 310 },
      { id: 'baseball-first-aid', name: 'First-aid', revenueShare: 0.25, variableCostPerTransaction: 0.95, fixedMonthlyCost: 1070, minimumAcceptableProfit: 420, capacity: 3900, minimumCommitment: 0, riskCost: 190 },
    ],
  },
  softballCarnivalSplit: {
    name: 'Softball carnival split',
    deal: { monthlyVolume: 4000, feePerTransaction: 8, addressableVolume: 5200, volumeShockPct: 0 },
    participants: [
      { id: 'softball-committee', name: 'Carnival committee', revenueShare: 0.37, variableCostPerTransaction: 1.62, fixedMonthlyCost: 3500, minimumAcceptableProfit: 1320, capacity: 4900, minimumCommitment: 0, riskCost: 495 },
      { id: 'softball-diamond-hire', name: 'Diamond hire', revenueShare: 0.38, variableCostPerTransaction: 2.08, fixedMonthlyCost: 2180, minimumAcceptableProfit: 860, capacity: 6000, minimumCommitment: 310, riskCost: 320 },
      { id: 'softball-first-aid', name: 'First-aid', revenueShare: 0.25, variableCostPerTransaction: 1.02, fixedMonthlyCost: 1110, minimumAcceptableProfit: 430, capacity: 4000, minimumCommitment: 0, riskCost: 200 },
    ],
  },
  lacrosseCarnivalSplit: {
    name: 'Lacrosse carnival split',
    deal: { monthlyVolume: 4100, feePerTransaction: 8, addressableVolume: 5300, volumeShockPct: 0 },
    participants: [
      { id: 'lacrosse-committee', name: 'Carnival committee', revenueShare: 0.37, variableCostPerTransaction: 1.64, fixedMonthlyCost: 3520, minimumAcceptableProfit: 1330, capacity: 5000, minimumCommitment: 0, riskCost: 500 },
      { id: 'lacrosse-ground-hire', name: 'Ground hire', revenueShare: 0.38, variableCostPerTransaction: 2.14, fixedMonthlyCost: 2220, minimumAcceptableProfit: 870, capacity: 6100, minimumCommitment: 320, riskCost: 330 },
      { id: 'lacrosse-first-aid', name: 'First-aid', revenueShare: 0.25, variableCostPerTransaction: 1.08, fixedMonthlyCost: 1140, minimumAcceptableProfit: 440, capacity: 4100, minimumCommitment: 0, riskCost: 210 },
    ],
  },
  waterPoloCarnivalSplit: {
    name: 'Water polo carnival split',
    deal: { monthlyVolume: 4200, feePerTransaction: 8, addressableVolume: 5400, volumeShockPct: 0 },
    participants: [
      { id: 'waterpolo-committee', name: 'Carnival committee', revenueShare: 0.37, variableCostPerTransaction: 1.66, fixedMonthlyCost: 3540, minimumAcceptableProfit: 1340, capacity: 5100, minimumCommitment: 0, riskCost: 505 },
      { id: 'waterpolo-pool-hire', name: 'Pool hire', revenueShare: 0.38, variableCostPerTransaction: 2.18, fixedMonthlyCost: 2260, minimumAcceptableProfit: 880, capacity: 6200, minimumCommitment: 330, riskCost: 340 },
      { id: 'waterpolo-first-aid', name: 'First-aid', revenueShare: 0.25, variableCostPerTransaction: 1.12, fixedMonthlyCost: 1170, minimumAcceptableProfit: 450, capacity: 4200, minimumCommitment: 0, riskCost: 220 },
    ],
  },
  rowingCarnivalSplit: {
    name: 'Rowing carnival split',
    deal: { monthlyVolume: 4300, feePerTransaction: 8, addressableVolume: 5500, volumeShockPct: 0 },
    participants: [
      { id: 'rowing-committee', name: 'Carnival committee', revenueShare: 0.37, variableCostPerTransaction: 1.68, fixedMonthlyCost: 3560, minimumAcceptableProfit: 1350, capacity: 5200, minimumCommitment: 0, riskCost: 510 },
      { id: 'rowing-boat-hire', name: 'Boat hire', revenueShare: 0.38, variableCostPerTransaction: 2.20, fixedMonthlyCost: 2300, minimumAcceptableProfit: 890, capacity: 6300, minimumCommitment: 340, riskCost: 350 },
      { id: 'rowing-first-aid', name: 'First-aid', revenueShare: 0.25, variableCostPerTransaction: 1.16, fixedMonthlyCost: 1200, minimumAcceptableProfit: 460, capacity: 4300, minimumCommitment: 0, riskCost: 230 },
    ],
  },
  sailingCarnivalSplit: {
    name: 'Sailing carnival split',
    deal: { monthlyVolume: 4400, feePerTransaction: 8, addressableVolume: 5600, volumeShockPct: 0 },
    participants: [
      { id: 'sailing-committee', name: 'Carnival committee', revenueShare: 0.37, variableCostPerTransaction: 1.70, fixedMonthlyCost: 3580, minimumAcceptableProfit: 1360, capacity: 5300, minimumCommitment: 0, riskCost: 515 },
      { id: 'sailing-yacht-hire', name: 'Yacht club hire', revenueShare: 0.38, variableCostPerTransaction: 2.22, fixedMonthlyCost: 2340, minimumAcceptableProfit: 900, capacity: 6400, minimumCommitment: 350, riskCost: 360 },
      { id: 'sailing-first-aid', name: 'First-aid', revenueShare: 0.25, variableCostPerTransaction: 1.20, fixedMonthlyCost: 1230, minimumAcceptableProfit: 470, capacity: 4400, minimumCommitment: 0, riskCost: 240 },
    ],
  },
  canoeingCarnivalSplit: {
    name: 'Canoeing carnival split',
    deal: { monthlyVolume: 4500, feePerTransaction: 8, addressableVolume: 5700, volumeShockPct: 0 },
    participants: [
      { id: 'canoeing-committee', name: 'Carnival committee', revenueShare: 0.37, variableCostPerTransaction: 1.72, fixedMonthlyCost: 3600, minimumAcceptableProfit: 1370, capacity: 5400, minimumCommitment: 0, riskCost: 520 },
      { id: 'canoeing-paddle-hire', name: 'Paddle club hire', revenueShare: 0.38, variableCostPerTransaction: 2.18, fixedMonthlyCost: 2380, minimumAcceptableProfit: 910, capacity: 6500, minimumCommitment: 360, riskCost: 370 },
      { id: 'canoeing-first-aid', name: 'First-aid', revenueShare: 0.25, variableCostPerTransaction: 1.24, fixedMonthlyCost: 1260, minimumAcceptableProfit: 480, capacity: 4500, minimumCommitment: 0, riskCost: 250 },
    ],
  },
  kayakingCarnivalSplit: {
    name: 'Kayaking carnival split',
    deal: { monthlyVolume: 4600, feePerTransaction: 8, addressableVolume: 5800, volumeShockPct: 0 },
    participants: [
      { id: 'kayaking-committee', name: 'Carnival committee', revenueShare: 0.37, variableCostPerTransaction: 1.74, fixedMonthlyCost: 3620, minimumAcceptableProfit: 1380, capacity: 5500, minimumCommitment: 0, riskCost: 525 },
      { id: 'kayaking-slalom-hire', name: 'Whitewater slalom hire', revenueShare: 0.38, variableCostPerTransaction: 2.16, fixedMonthlyCost: 2440, minimumAcceptableProfit: 900, capacity: 6600, minimumCommitment: 370, riskCost: 380 },
      { id: 'kayaking-first-aid', name: 'First-aid', revenueShare: 0.25, variableCostPerTransaction: 1.28, fixedMonthlyCost: 1290, minimumAcceptableProfit: 490, capacity: 4600, minimumCommitment: 0, riskCost: 260 },
    ],
  },
  dragonBoatCarnivalSplit: {
    name: 'Dragon boat carnival split',
    deal: { monthlyVolume: 4700, feePerTransaction: 8, addressableVolume: 5900, volumeShockPct: 0 },
    participants: [
      { id: 'dragonboat-committee', name: 'Carnival committee', revenueShare: 0.37, variableCostPerTransaction: 1.76, fixedMonthlyCost: 3640, minimumAcceptableProfit: 1390, capacity: 5600, minimumCommitment: 0, riskCost: 530 },
      { id: 'dragonboat-club-hire', name: 'Dragon boat club hire', revenueShare: 0.38, variableCostPerTransaction: 2.10, fixedMonthlyCost: 2500, minimumAcceptableProfit: 930, capacity: 6700, minimumCommitment: 380, riskCost: 390 },
      { id: 'dragonboat-first-aid', name: 'First-aid', revenueShare: 0.25, variableCostPerTransaction: 1.32, fixedMonthlyCost: 1320, minimumAcceptableProfit: 500, capacity: 4700, minimumCommitment: 0, riskCost: 270 },
    ],
  },
  surfCarnivalSplit: {
    name: 'Surf carnival split',
    deal: { monthlyVolume: 4800, feePerTransaction: 8, addressableVolume: 6000, volumeShockPct: 0 },
    participants: [
      { id: 'surf-committee', name: 'Carnival committee', revenueShare: 0.37, variableCostPerTransaction: 1.78, fixedMonthlyCost: 3660, minimumAcceptableProfit: 1400, capacity: 5700, minimumCommitment: 0, riskCost: 535 },
      { id: 'surf-club-hire', name: 'Surf club hire', revenueShare: 0.38, variableCostPerTransaction: 2.08, fixedMonthlyCost: 2560, minimumAcceptableProfit: 940, capacity: 6800, minimumCommitment: 390, riskCost: 400 },
      { id: 'surf-first-aid', name: 'First-aid', revenueShare: 0.25, variableCostPerTransaction: 1.36, fixedMonthlyCost: 1350, minimumAcceptableProfit: 510, capacity: 4800, minimumCommitment: 0, riskCost: 280 },
    ],
  },
  triathlonCarnivalSplit: {
    name: 'Triathlon carnival split',
    deal: { monthlyVolume: 4900, feePerTransaction: 8, addressableVolume: 6100, volumeShockPct: 0 },
    participants: [
      { id: 'triathlon-committee', name: 'Carnival committee', revenueShare: 0.37, variableCostPerTransaction: 1.80, fixedMonthlyCost: 3680, minimumAcceptableProfit: 1410, capacity: 5800, minimumCommitment: 0, riskCost: 540 },
      { id: 'triathlon-club-hire', name: 'Triathlon club hire', revenueShare: 0.38, variableCostPerTransaction: 2.06, fixedMonthlyCost: 2620, minimumAcceptableProfit: 950, capacity: 6900, minimumCommitment: 400, riskCost: 410 },
      { id: 'triathlon-first-aid', name: 'First-aid', revenueShare: 0.25, variableCostPerTransaction: 1.40, fixedMonthlyCost: 1380, minimumAcceptableProfit: 520, capacity: 4900, minimumCommitment: 0, riskCost: 290 },
    ],
  },
  cyclingCarnivalSplit: {
    name: 'Cycling carnival split',
    deal: { monthlyVolume: 5000, feePerTransaction: 8, addressableVolume: 6200, volumeShockPct: 0 },
    participants: [
      { id: 'cycling-committee', name: 'Carnival committee', revenueShare: 0.37, variableCostPerTransaction: 1.82, fixedMonthlyCost: 3700, minimumAcceptableProfit: 1420, capacity: 5900, minimumCommitment: 0, riskCost: 545 },
      { id: 'cycling-club-hire', name: 'Cycling club hire', revenueShare: 0.38, variableCostPerTransaction: 2.04, fixedMonthlyCost: 2680, minimumAcceptableProfit: 960, capacity: 7000, minimumCommitment: 410, riskCost: 420 },
      { id: 'cycling-first-aid', name: 'First-aid', revenueShare: 0.25, variableCostPerTransaction: 1.44, fixedMonthlyCost: 1410, minimumAcceptableProfit: 530, capacity: 5000, minimumCommitment: 0, riskCost: 300 },
    ],
  },
  mountainBikeCarnivalSplit: {
    name: 'Mountain bike carnival split',
    deal: { monthlyVolume: 5100, feePerTransaction: 8, addressableVolume: 6300, volumeShockPct: 0 },
    participants: [
      { id: 'mountainbike-committee', name: 'Carnival committee', revenueShare: 0.37, variableCostPerTransaction: 1.84, fixedMonthlyCost: 3720, minimumAcceptableProfit: 1430, capacity: 6000, minimumCommitment: 0, riskCost: 550 },
      { id: 'mountainbike-club-hire', name: 'Mountain bike club hire', revenueShare: 0.38, variableCostPerTransaction: 2.02, fixedMonthlyCost: 2740, minimumAcceptableProfit: 970, capacity: 7100, minimumCommitment: 420, riskCost: 430 },
      { id: 'mountainbike-first-aid', name: 'First-aid', revenueShare: 0.25, variableCostPerTransaction: 1.48, fixedMonthlyCost: 1440, minimumAcceptableProfit: 540, capacity: 5100, minimumCommitment: 0, riskCost: 310 },
    ],
  },
  bmxCarnivalSplit: {
    name: 'BMX carnival split',
    deal: { monthlyVolume: 5200, feePerTransaction: 8, addressableVolume: 6400, volumeShockPct: 0 },
    participants: [
      { id: 'bmx-committee', name: 'Carnival committee', revenueShare: 0.37, variableCostPerTransaction: 1.85, fixedMonthlyCost: 3730, minimumAcceptableProfit: 1440, capacity: 6100, minimumCommitment: 0, riskCost: 552 },
      { id: 'bmx-club-hire', name: 'BMX club hire', revenueShare: 0.38, variableCostPerTransaction: 2.00, fixedMonthlyCost: 2800, minimumAcceptableProfit: 980, capacity: 7200, minimumCommitment: 430, riskCost: 440 },
      { id: 'bmx-first-aid', name: 'First-aid', revenueShare: 0.25, variableCostPerTransaction: 1.52, fixedMonthlyCost: 1470, minimumAcceptableProfit: 550, capacity: 5200, minimumCommitment: 0, riskCost: 320 },
    ],
  },
  cycloCrossCarnivalSplit: {
    name: 'Cyclo-cross carnival split',
    deal: { monthlyVolume: 5300, feePerTransaction: 8, addressableVolume: 6500, volumeShockPct: 0 },
    participants: [
      { id: 'cyclo-cross-committee', name: 'Carnival committee', revenueShare: 0.37, variableCostPerTransaction: 1.86, fixedMonthlyCost: 3740, minimumAcceptableProfit: 1450, capacity: 6200, minimumCommitment: 0, riskCost: 554 },
      { id: 'cyclo-cross-club-hire', name: 'Cyclo-cross club hire', revenueShare: 0.38, variableCostPerTransaction: 1.98, fixedMonthlyCost: 2860, minimumAcceptableProfit: 990, capacity: 7300, minimumCommitment: 440, riskCost: 450 },
      { id: 'cyclo-cross-first-aid', name: 'First-aid', revenueShare: 0.25, variableCostPerTransaction: 1.56, fixedMonthlyCost: 1500, minimumAcceptableProfit: 560, capacity: 5300, minimumCommitment: 0, riskCost: 330 },
    ],
  },
  trackCyclingCarnivalSplit: {
    name: 'Track cycling carnival split',
    deal: { monthlyVolume: 5400, feePerTransaction: 8, addressableVolume: 6600, volumeShockPct: 0 },
    participants: [
      { id: 'track-cycling-committee', name: 'Carnival committee', revenueShare: 0.37, variableCostPerTransaction: 1.87, fixedMonthlyCost: 3750, minimumAcceptableProfit: 1460, capacity: 6300, minimumCommitment: 0, riskCost: 556 },
      { id: 'track-cycling-club-hire', name: 'Track cycling club hire', revenueShare: 0.38, variableCostPerTransaction: 1.96, fixedMonthlyCost: 2920, minimumAcceptableProfit: 1000, capacity: 7400, minimumCommitment: 450, riskCost: 460 },
      { id: 'track-cycling-first-aid', name: 'First-aid', revenueShare: 0.25, variableCostPerTransaction: 1.50, fixedMonthlyCost: 1530, minimumAcceptableProfit: 570, capacity: 5400, minimumCommitment: 0, riskCost: 340 },
    ],
  },
  gravelCyclingCarnivalSplit: {
    name: 'Gravel cycling carnival split',
    deal: { monthlyVolume: 5500, feePerTransaction: 8, addressableVolume: 6700, volumeShockPct: 0 },
    participants: [
      { id: 'gravel-cycling-committee', name: 'Carnival committee', revenueShare: 0.37, variableCostPerTransaction: 1.88, fixedMonthlyCost: 3760, minimumAcceptableProfit: 1470, capacity: 6400, minimumCommitment: 0, riskCost: 558 },
      { id: 'gravel-cycling-club-hire', name: 'Gravel cycling club hire', revenueShare: 0.38, variableCostPerTransaction: 1.94, fixedMonthlyCost: 2980, minimumAcceptableProfit: 1010, capacity: 7500, minimumCommitment: 460, riskCost: 470 },
      { id: 'gravel-cycling-first-aid', name: 'First-aid', revenueShare: 0.25, variableCostPerTransaction: 1.54, fixedMonthlyCost: 1560, minimumAcceptableProfit: 580, capacity: 5500, minimumCommitment: 0, riskCost: 350 },
    ],
  },
});

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function own(object, key) {
  return Object.hasOwn(object, key) ? object[key] : undefined;
}

function nonNegative(value, field, errors, { optional = false, max = MAX_NUMERIC_INPUT } = {}) {
  if (optional && (value === null || value === undefined)) return null;
  if (!isFiniteNumber(value) || value < 0 || value > max) {
    errors.push(`${field} must be a finite number from zero through ${max}.`);
    return null;
  }
  return value;
}

function rejectUnknownKeys(value, allowed, field, errors) {
  for (const key of Object.getOwnPropertyNames(value)) {
    if (RESERVED_KEYS.has(key)) errors.push(`${field} contains a reserved field: ${key}.`);
    else if (!allowed.has(key)) errors.push(`${field} contains an unknown field: ${key}.`);
  }
}

function stringValue(value, field, errors, maxLength = 80) {
  if (typeof value !== 'string' || value.trim() === '' || value.trim().length > maxLength) {
    errors.push(`${field} must be a non-empty string no longer than ${maxLength} characters.`);
    return '';
  }
  return value.trim();
}

/**
 * Returns validation errors without throwing, so forms can report all issues at once.
 * @param {unknown} config
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateConfiguration(config) {
  const errors = [];
  if (!isPlainObject(config)) {
    return { valid: false, errors: ['Configuration must be an object.'] };
  }
  rejectUnknownKeys(config, CONFIG_KEYS, 'Configuration', errors);
  if (Object.hasOwn(config, 'collapseAllHoldCases')) {
    const collapse = own(config, 'collapseAllHoldCases');
    if (collapse !== true && collapse !== false) {
      errors.push('Collapse all-hold cases must be a boolean.');
    }
  }
  if (Object.hasOwn(config, 'hideHoldingParticipants')) {
    const hideHolders = own(config, 'hideHoldingParticipants');
    if (hideHolders !== true && hideHolders !== false) {
      errors.push('Hide holding participants must be a boolean.');
    }
  }
  if (Object.hasOwn(config, 'hideAllHoldLedger')) {
    const hideLedger = own(config, 'hideAllHoldLedger');
    if (hideLedger !== true && hideLedger !== false) {
      errors.push('Hide all-hold ledger must be a boolean.');
    }
  }
  if (Object.hasOwn(config, 'hideZeroShareParticipants')) {
    const hideZero = own(config, 'hideZeroShareParticipants');
    if (hideZero !== true && hideZero !== false) {
      errors.push('Hide zero-share participants must be a boolean.');
    }
  }
  if (Object.hasOwn(config, 'hideParticipantsOverCapacity')) {
    const hideOver = own(config, 'hideParticipantsOverCapacity');
    if (hideOver !== true && hideOver !== false) {
      errors.push('Hide participants over capacity must be a boolean.');
    }
  }
  if (Object.hasOwn(config, 'hideParticipantsAtHold')) {
    const hideAtHold = own(config, 'hideParticipantsAtHold');
    if (hideAtHold !== true && hideAtHold !== false) {
      errors.push('Hide participants at hold must be a boolean.');
    }
  }
  if (Object.hasOwn(config, 'hideParticipantsWithoutCapacity')) {
    const hideWithout = own(config, 'hideParticipantsWithoutCapacity');
    if (hideWithout !== true && hideWithout !== false) {
      errors.push('Hide participants without capacity must be a boolean.');
    }
  }
  if (Object.hasOwn(config, 'hideParticipantsWithSpareCapacity')) {
    const hideSpare = own(config, 'hideParticipantsWithSpareCapacity');
    if (hideSpare !== true && hideSpare !== false) {
      errors.push('Hide participants with spare capacity must be a boolean.');
    }
  }
  if (Object.hasOwn(config, 'hideParticipantsAtLeastHeadroom')) {
    const hideLeast = own(config, 'hideParticipantsAtLeastHeadroom');
    if (hideLeast !== true && hideLeast !== false) {
      errors.push('Hide participants at least headroom must be a boolean.');
    }
  }
  if (Object.hasOwn(config, 'hideParticipantsWithinCapacity')) {
    const hideWithin = own(config, 'hideParticipantsWithinCapacity');
    if (hideWithin !== true && hideWithin !== false) {
      errors.push('Hide participants within capacity must be a boolean.');
    }
  }
  if (Object.hasOwn(config, 'hideFirstBreakpointParticipant')) {
    const hideFirst = own(config, 'hideFirstBreakpointParticipant');
    if (hideFirst !== true && hideFirst !== false) {
      errors.push('Hide first-breakpoint participant must be a boolean.');
    }
  }
  if (Object.hasOwn(config, 'hideFirstOverCapacityParticipant')) {
    const hideFirstOver = own(config, 'hideFirstOverCapacityParticipant');
    if (hideFirstOver !== true && hideFirstOver !== false) {
      errors.push('Hide first over-capacity participant must be a boolean.');
    }
  }
  if (Object.hasOwn(config, 'hideLastOverCapacityParticipant')) {
    const hideLastOver = own(config, 'hideLastOverCapacityParticipant');
    if (hideLastOver !== true && hideLastOver !== false) {
      errors.push('Hide last over-capacity participant must be a boolean.');
    }
  }
  if (Object.hasOwn(config, 'hideLastBreakpointParticipant')) {
    const hideLastBreakpoint = own(config, 'hideLastBreakpointParticipant');
    if (hideLastBreakpoint !== true && hideLastBreakpoint !== false) {
      errors.push('Hide last first-breakpoint participant must be a boolean.');
    }
  }
  if (Object.hasOwn(config, 'hideLastWithinCapacityParticipant')) {
    const hideLastWithin = own(config, 'hideLastWithinCapacityParticipant');
    if (hideLastWithin !== true && hideLastWithin !== false) {
      errors.push('Hide last within-capacity participant must be a boolean.');
    }
  }
  if (Object.hasOwn(config, 'hideFirstWithinCapacityParticipant')) {
    const hideFirstWithin = own(config, 'hideFirstWithinCapacityParticipant');
    if (hideFirstWithin !== true && hideFirstWithin !== false) {
      errors.push('Hide first within-capacity participant must be a boolean.');
    }
  }
  if (Object.hasOwn(config, 'hideLastSpareCapacityParticipant')) {
    const hideLastSpare = own(config, 'hideLastSpareCapacityParticipant');
    if (hideLastSpare !== true && hideLastSpare !== false) {
      errors.push('Hide last spare-capacity participant must be a boolean.');
    }
  }
  if (Object.hasOwn(config, 'hideFirstSpareCapacityParticipant')) {
    const hideFirstSpare = own(config, 'hideFirstSpareCapacityParticipant');
    if (hideFirstSpare !== true && hideFirstSpare !== false) {
      errors.push('Hide first spare-capacity participant must be a boolean.');
    }
  }
  if (Object.hasOwn(config, 'hideLastParticipantWithoutCapacity')) {
    const hideLastWithout = own(config, 'hideLastParticipantWithoutCapacity');
    if (hideLastWithout !== true && hideLastWithout !== false) {
      errors.push('Hide last participant without capacity must be a boolean.');
    }
  }
  if (Object.hasOwn(config, 'hideFirstParticipantWithoutCapacity')) {
    const hideFirstWithout = own(config, 'hideFirstParticipantWithoutCapacity');
    if (hideFirstWithout !== true && hideFirstWithout !== false) {
      errors.push('Hide first participant without capacity must be a boolean.');
    }
  }
  if (Object.hasOwn(config, 'hideLastParticipantAtHold')) {
    const hideLastAtHold = own(config, 'hideLastParticipantAtHold');
    if (hideLastAtHold !== true && hideLastAtHold !== false) {
      errors.push('Hide last participant at hold must be a boolean.');
    }
  }
  if (Object.hasOwn(config, 'hideFirstParticipantAtHold')) {
    const hideFirstAtHold = own(config, 'hideFirstParticipantAtHold');
    if (hideFirstAtHold !== true && hideFirstAtHold !== false) {
      errors.push('Hide first participant at hold must be a boolean.');
    }
  }
  if (Object.hasOwn(config, 'hideFirstZeroShareParticipant')) {
    const hideFirstZero = own(config, 'hideFirstZeroShareParticipant');
    if (hideFirstZero !== true && hideFirstZero !== false) {
      errors.push('Hide first zero-share participant must be a boolean.');
    }
  }
  if (Object.hasOwn(config, 'hideLastZeroShareParticipant')) {
    const hideLastZero = own(config, 'hideLastZeroShareParticipant');
    if (hideLastZero !== true && hideLastZero !== false) {
      errors.push('Hide last zero-share participant must be a boolean.');
    }
  }
  if (Object.hasOwn(config, 'stress')) {
    const stress = own(config, 'stress');
    if (!isPlainObject(stress)) {
      errors.push('Stress settings must be an object.');
    } else {
      rejectUnknownKeys(stress, new Set(Object.keys(STRESS_LIMITS)), 'Stress settings', errors);
      for (const [key, limit] of Object.entries(STRESS_LIMITS)) {
        const value = own(stress, key);
        if (!isFiniteNumber(value) || value < 0 || value > limit) {
          errors.push(`Stress ${key} must be a finite percentage from 0 through ${limit}.`);
        }
      }
    }
  }

  const deal = own(config, 'deal');
  if (!isPlainObject(deal)) {
    errors.push('Deal must be an object.');
  } else {
    rejectUnknownKeys(deal, DEAL_KEYS, 'Deal', errors);
    nonNegative(own(deal, 'monthlyVolume'), 'Deal monthly volume', errors);
    nonNegative(own(deal, 'feePerTransaction'), 'Deal fee per transaction', errors);
    nonNegative(own(deal, 'addressableVolume'), 'Deal addressable volume', errors);
    if (Object.hasOwn(deal, 'volumeShockPct')) {
      const shock = own(deal, 'volumeShockPct');
      if (!isFiniteNumber(shock) || shock < 0 || shock > 100) {
        errors.push('Deal volume shock must be a finite percentage from 0 through 100.');
      }
    }
    if (Object.hasOwn(deal, 'title')) {
      const title = own(deal, 'title');
      if (typeof title !== 'string' || title.trim() === '' || title.trim().length > 80) {
        errors.push('Deal title must be a string of 1 to 80 characters after trimming.');
      }
    }
    if (Object.hasOwn(deal, 'currency')) {
      const currency = own(deal, 'currency');
      if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) {
        errors.push('Deal currency must be a 3-letter uppercase code such as USD.');
      }
    }
    if (Object.hasOwn(deal, 'notes')) {
      const notes = own(deal, 'notes');
      if (typeof notes !== 'string' || notes.trim() === '' || notes.trim().length > 500) {
        errors.push('Deal notes must be a string of 1 to 500 characters after trimming.');
      }
    }
  }

  const participants = own(config, 'participants');
  if (!Array.isArray(participants) || participants.length < 2 || participants.length > MAX_PARTICIPANTS) {
    errors.push(`Between 2 and ${MAX_PARTICIPANTS} participants are required.`);
  } else {
    const ids = new Set();
    let shareTotal = 0;
    participants.forEach((participant, index) => {
      const prefix = `Participant ${index + 1}`;
      if (!isPlainObject(participant)) {
        errors.push(`${prefix} must be an object.`);
        return;
      }
      rejectUnknownKeys(participant, PARTICIPANT_KEYS, prefix, errors);
      const id = stringValue(own(participant, 'id'), `${prefix} id`, errors, 64);
      if (id && ids.has(id)) errors.push(`${prefix} id must be unique.`);
      ids.add(id);
      stringValue(own(participant, 'name'), `${prefix} name`, errors);
      const share = nonNegative(own(participant, 'revenueShare'), `${prefix} revenue share`, errors, { max: 1 });
      if (share !== null) shareTotal += share;
      nonNegative(own(participant, 'variableCostPerTransaction'), `${prefix} variable cost per transaction`, errors);
      nonNegative(own(participant, 'fixedMonthlyCost'), `${prefix} fixed monthly cost`, errors);
      nonNegative(own(participant, 'minimumAcceptableProfit'), `${prefix} minimum acceptable monthly profit`, errors);
      nonNegative(own(participant, 'capacity'), `${prefix} capacity`, errors, { optional: true });
      nonNegative(own(participant, 'minimumCommitment'), `${prefix} minimum commitment`, errors, { optional: true });
      nonNegative(own(participant, 'riskCost'), `${prefix} risk cost`, errors);
    });
    if (Math.abs(shareTotal - 1) > EPSILON) {
      errors.push(`Participant revenue shares must sum to 1. Current total: ${shareTotal.toFixed(6)}.`);
    }
  }
  return { valid: errors.length === 0, errors };
}

/** @param {unknown} config @returns {PartnershipConfig} */
export function assertValidConfiguration(config) {
  const validation = validateConfiguration(config);
  if (!validation.valid) throw new ValidationError(validation.errors);
  return config;
}

/**
 * Actual monthly transactions are limited by addressable demand after the chosen volume shock.
 * @param {Deal} deal
 * @returns {number}
 */
export function effectiveVolume(deal) {
  const shockedVolume = deal.monthlyVolume * (1 - (deal.volumeShockPct ?? 0) / 100);
  return Math.min(shockedVolume, deal.addressableVolume);
}

/** @param {ParticipantInput} participant @param {number} feePerTransaction @returns {number} */
export function contributionPerTransaction(participant, feePerTransaction) {
  return participant.revenueShare * feePerTransaction - participant.variableCostPerTransaction;
}

/**
 * The transaction volume at which accounting profit equals zero.
 * @param {Pick<ParticipantInput, 'revenueShare'|'variableCostPerTransaction'|'fixedMonthlyCost'|'riskCost'>} participant
 * @param {number} feePerTransaction
 * @returns {number|null}
 */
export function breakEvenVolume(participant, feePerTransaction) {
  const contribution = contributionPerTransaction(participant, feePerTransaction);
  const monthlyOverhead = participant.fixedMonthlyCost + participant.riskCost;
  if (contribution <= 0) return monthlyOverhead === 0 ? 0 : null;
  return monthlyOverhead / contribution;
}

/**
 * The minimum volume that clears the participant's monthly profit and commitment exit tests.
 * @param {ParticipantInput} participant
 * @param {number} feePerTransaction
 * @returns {number|null}
 */
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
 * @param {ParticipantInput} participant
 * @param {Deal} deal
 * @param {number} [volume]
 * @returns {{volume: ShockResult, volumeIncrease: ShockResult, fee: ShockResult, variableCost: ShockResult, currentProfit: number}}
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
    : capacity > deal.addressableVolume
      ? { kind: 'volumeIncrease', status: 'unbounded', breakpoint: null, change: null, changePct: null, reason: 'Addressable demand prevents volume from reaching this participant capacity.' }
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

/**
 * Evaluates one participant against profit, commitment, and capacity tests at a volume.
 * `fragilityHeadroom` is the volume-distance ranking used by `weakestParticipant`.
 * @param {ParticipantInput} participant
 * @param {Deal} deal
 * @param {number} [volume]
 */
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
  const capacityUtilization = capacity === null
    ? null
    : capacity <= EPSILON
      ? (volume <= EPSILON ? 0 : Number.POSITIVE_INFINITY)
      : volume / capacity;
  const exitThreshold = exitVolume(participant, deal.feePerTransaction);
  const headroomToExit = exitThreshold === null ? null : volume - exitThreshold;
  const capacityHeadroom = capacity === null || capacity > deal.addressableVolume ? Infinity : capacity - volume;
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
    capacityUtilization,
    fragilityHeadroom,
    bindingConstraint,
    profitPass,
    commitmentPass,
    capacityPass,
    viable: profitPass && commitmentPass && capacityPass,
    failureReasons,
  };
}

const SHOCK_ORDER = Object.freeze(['volume', 'volumeIncrease', 'fee', 'variableCost']);

/**
 * Identifies the first adverse movement in the current scenario, using the
 * smallest percentage change from the current value as the comparison unit.
 * This is a prioritisation aid, not a probability or a claim about behaviour.
 * It can name a different participant than `weakestParticipant`.
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

/**
 * Baseline monthly partnership evaluation for a valid configuration.
 * `weakestParticipant` is the smallest volume-headroom ranking.
 * `firstBreakpoint` is a separate ranking of bounded shocks by percentage movement.
 * @param {PartnershipConfig} config
 */
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
    participant.capacity == null ? ceiling : Math.min(ceiling, participant.capacity)
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

// Exact fractions are used only to verify a proposed split. Display calculations
// keep their existing Number semantics, but cannot certify their own roundoff.
function exactNumber(value) {
  if (value === 0) return { numerator: 0n, denominator: 1n };
  const bytes = new DataView(new ArrayBuffer(8));
  bytes.setFloat64(0, value);
  const bits = bytes.getBigUint64(0);
  const encodedExponent = Number((bits >> 52n) & 0x7ffn);
  const significand = (bits & ((1n << 52n) - 1n)) + (encodedExponent === 0 ? 0n : 1n << 52n);
  const signed = bits >> 63n ? -significand : significand;
  const exponent = encodedExponent === 0 ? -1074 : encodedExponent - 1075;
  return exponent < 0
    ? { numerator: signed, denominator: 1n << BigInt(-exponent) }
    : { numerator: signed << BigInt(exponent), denominator: 1n };
}

function exactAdd(left, right) {
  return { numerator: left.numerator * right.denominator + right.numerator * left.denominator,
    denominator: left.denominator * right.denominator };
}

function exactMultiply(left, right) {
  return { numerator: left.numerator * right.numerator, denominator: left.denominator * right.denominator };
}

function exactNegative(value) {
  return { numerator: -value.numerator, denominator: value.denominator };
}

function exactAtLeast(left, right) {
  return left.numerator * right.denominator >= right.numerator * left.denominator;
}

function exactPercentFactor(percent) {
  const value = exactNumber(percent);
  return { numerator: 100n * value.denominator + value.numerator, denominator: 100n * value.denominator };
}

function exactProposalPasses(config, scenarios, proposal) {
  const tolerance = exactNumber(EPSILON);
  const demand = exactNumber(config.deal.addressableVolume);
  const planned = exactMultiply(exactNumber(config.deal.monthlyVolume), exactPercentFactor(-(config.deal.volumeShockPct ?? 0)));
  const baseVolume = exactAtLeast(planned, demand) ? demand : planned;
  const proposedShareTotal = proposal.map((participant) => exactNumber(participant.revenueShare)).reduce(exactAdd);
  return scenarios.every((scenario) => {
    const shocked = exactMultiply(baseVolume, exactPercentFactor(scenario.volumeChangePct));
    const volume = exactAtLeast(shocked, demand) ? demand : shocked;
    const fee = exactMultiply(exactNumber(config.deal.feePerTransaction), exactPercentFactor(-scenario.feeDropPct));
    const grossRevenue = exactMultiply(volume, fee);
    const availableRevenue = exactAdd(grossRevenue, tolerance);
    if (!exactAtLeast(availableRevenue, exactMultiply(grossRevenue, proposedShareTotal))) return false;
    let aggregateRequiredRevenue = exactNumber(0);
    const individualPasses = config.participants.every((participant, index) => {
      if (!exactAtLeast(exactAdd(volume, tolerance), exactNumber(participant.minimumCommitment ?? 0))) return false;
      if (participant.capacity != null && !exactAtLeast(exactAdd(exactNumber(participant.capacity), tolerance), volume)) return false;
      const variableCost = exactMultiply(exactNumber(participant.variableCostPerTransaction), exactPercentFactor(scenario.variableCostRisePct));
      const revenue = exactMultiply(grossRevenue, exactNumber(proposal[index].revenueShare));
      const requiredRevenue = [exactMultiply(volume, variableCost), exactNumber(participant.fixedMonthlyCost),
        exactNumber(participant.riskCost), exactNumber(participant.minimumAcceptableProfit)]
        .reduce(exactAdd);
      aggregateRequiredRevenue = exactAdd(aggregateRequiredRevenue, requiredRevenue);
      const gap = exactAdd(revenue, exactNegative(requiredRevenue));
      return exactAtLeast(exactAdd(gap, tolerance), exactNumber(0));
    });
    return individualPasses && exactAtLeast(availableRevenue, aggregateRequiredRevenue);
  });
}

/**
 * Finite compound scenarios. Counts describe tested cases, never probabilities.
 * @param {PartnershipConfig} config
 */
export function evaluateStressGrid(config) {
  assertValidConfiguration(config);
  const settings = { ...(config.stress ?? DEFAULT_STRESS) };
  const baseVolume = effectiveVolume(config.deal);
  const unique = (values) => [...new Set(values)];
  const volumes = unique([0, -settings.volumeDropPct, settings.volumeGrowthPct]);
  const fees = unique([0, settings.feeDropPct / 2, settings.feeDropPct]);
  const costs = unique([0, settings.variableCostRisePct / 2, settings.variableCostRisePct]);
  const scenarios = [];
  for (const volumeChangePct of volumes) {
    for (const feeDropPct of fees) {
      for (const variableCostRisePct of costs) {
        const volume = Math.min(baseVolume * (1 + volumeChangePct / 100), config.deal.addressableVolume);
        const fee = config.deal.feePerTransaction * (1 - feeDropPct / 100);
        const participants = config.participants.map((participant) => evaluateParticipant({
          ...participant,
          variableCostPerTransaction: participant.variableCostPerTransaction * (1 + variableCostRisePct / 100),
        }, { ...config.deal, feePerTransaction: fee }, volume));
        scenarios.push({
          id: `case-${scenarios.length + 1}`,
          volumeChangePct, feeDropPct, variableCostRisePct,
          volume, fee, participants,
          viable: participants.every((participant) => participant.viable),
          totalProfit: participants.reduce((sum, participant) => sum + participant.monthlyProfit, 0),
        });
      }
    }
  }
  const operationalFailures = [];
  const participants = config.participants.map((participant, index) => {
    let requiredShare = 0;
    let requiredShareScenarioId = scenarios[0].id;
    let worst = null;
    let passCount = 0;
    for (const scenario of scenarios) {
      const tested = scenario.participants[index];
      const profitGap = tested.monthlyProfit - participant.minimumAcceptableProfit;
      if (!worst || profitGap < worst.profitGap) {
        worst = { scenarioId: scenario.id, profitGap, monthlyProfit: tested.monthlyProfit };
      }
      if (tested.viable) passCount += 1;
      if (!tested.commitmentPass || !tested.capacityPass) {
        operationalFailures.push({ participantId: participant.id, scenarioId: scenario.id,
          commitmentPass: tested.commitmentPass, capacityPass: tested.capacityPass });
      }
      const requiredRevenue = scenario.volume * tested.variableCostPerTransaction
        + participant.fixedMonthlyCost + participant.riskCost + participant.minimumAcceptableProfit;
      const grossRevenue = scenario.volume * scenario.fee;
      const ratio = grossRevenue === 0 ? (requiredRevenue === 0 ? 0 : null) : requiredRevenue / grossRevenue;
      const minimumShare = ratio === null || !Number.isFinite(ratio) ? null : ratio;
      if (requiredShare !== null && (minimumShare === null || minimumShare > requiredShare)) {
        requiredShare = minimumShare;
        requiredShareScenarioId = scenario.id;
      }
    }
    return { id: participant.id, name: participant.name, currentShare: participant.revenueShare,
      passCount, worst, requiredShare, requiredShareScenarioId };
  });
  const requiredShareTotal = participants.some((participant) => participant.requiredShare === null)
    ? null : participants.reduce((sum, participant) => sum + participant.requiredShare, 0);
  // Allow accumulated division/summation roundoff only, then recheck the actual split.
  const shareTolerance = Number.EPSILON * Math.max(1, requiredShareTotal ?? 0) * participants.length * 4;
  let status = operationalFailures.length ? 'operational-breach'
    : requiredShareTotal === null ? 'no-revenue'
      : requiredShareTotal - 1 > shareTolerance ? 'insufficient-revenue' : 'feasible';
  let proposal = null;
  if (status === 'feasible') {
    const residual = Math.max(0, 1 - requiredShareTotal);
    proposal = participants.map((participant) => ({ id: participant.id,
      revenueShare: participant.requiredShare + residual * participant.currentShare }));
    const total = proposal.reduce((sum, participant) => sum + participant.revenueShare, 0);
    // Put floating-point reconciliation in the largest share, never a zero-share participant.
    const largest = proposal.reduce((best, participant, index) => participant.revenueShare > proposal[best].revenueShare ? index : best, 0);
    proposal[largest].revenueShare += 1 - total;
    const candidate = { ...config, participants: config.participants.map((participant, index) => ({
      ...participant, revenueShare: proposal[index].revenueShare,
    })) };
    const passes = validateConfiguration(candidate).valid && exactProposalPasses(config, scenarios, proposal)
      && scenarios.every((scenario) => scenario.participants.every((participant, index) =>
      evaluateParticipant({ ...participant, revenueShare: proposal[index].revenueShare },
        { ...config.deal, feePerTransaction: scenario.fee }, scenario.volume).viable));
    if (!passes) {
      status = 'precision-limit';
      proposal = null;
    }
  }
  return { settings, scenarios, caseCount: scenarios.length, passCount: scenarios.filter((scenario) => scenario.viable).length,
    participants, negotiation: { status, requiredShareTotal, operationalFailures, proposal } };
}

/**
 * Explicit user action only. Leaves the original inputs untouched.
 * @param {PartnershipConfig} config
 * @returns {PartnershipConfig}
 */
export function applyStressProposal(config) {
  const proposal = evaluateStressGrid(config).negotiation.proposal;
  if (!proposal) throw new ValidationError(['No verified fixed-share proposal is available for these stress cases.']);
  return { ...config, deal: { ...config.deal }, ...(config.stress ? { stress: { ...config.stress } } : {}),
    participants: config.participants.map((participant, index) => ({ ...participant, revenueShare: proposal[index].revenueShare })) };
}

/**
 * Creates a safe copy of a named preset. Stress settings are omitted so legacy
 * v1 exports remain valid; the GUI applies {@link DEFAULT_STRESS} when missing.
 * @param {keyof typeof PRESETS} key
 * @returns {PartnershipConfig}
 */
export function clonePreset(key) {
  const preset = PRESETS[key];
  if (!preset) throw new Error(`Unknown preset: ${key}`);
  return JSON.parse(JSON.stringify({ deal: preset.deal, participants: preset.participants }));
}

/** @param {string} id @returns {ParticipantInput} */
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

/** @param {ParticipantInput[]} participants @param {string} [prefix] */
export function nextUnusedParticipantId(participants, prefix = 'participant') {
  const used = new Set(participants.map((item) => item.id));
  let sequence = 1;
  while (used.has(`${prefix}-${sequence}`)) sequence += 1;
  return `${prefix}-${sequence}`;
}

/**
 * Copies costs and constraints. The duplicate receives a unique id, a name suffix,
 * and a zero revenue share so the original allocation still sums to the same total.
 * @param {ParticipantInput[]} participants
 * @param {number} index
 */
export function duplicateParticipant(participants, index) {
  if (!Array.isArray(participants) || !Number.isInteger(index) || index < 0 || index >= participants.length) {
    throw new ValidationError(['Choose a current participant.']);
  }
  if (participants.length >= MAX_PARTICIPANTS) {
    throw new ValidationError([`Between 2 and ${MAX_PARTICIPANTS} participants are required.`]);
  }
  const source = participants[index];
  let name = `${source.name} copy`;
  if (name.length > 80) name = name.slice(0, 80);
  if (name.trim() === '') name = 'Participant copy';
  const copy = { ...source, id: nextUnusedParticipantId(participants), name, revenueShare: 0 };
  const next = participants.map((item) => ({ ...item }));
  next.splice(index + 1, 0, copy);
  return next;
}

/**
 * Names that appear more than once after trimming. This is a label warning,
 * not a claim that the parties are the same or that the case is invalid.
 * @param {ParticipantInput[]} participants
 * @returns {{name: string, indexes: number[]}[]}
 */
export function duplicateDisplayNames(participants) {
  if (!Array.isArray(participants)) return [];
  const groups = new Map();
  participants.forEach((item, index) => {
    if (!isPlainObject(item)) return;
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    if (!name) return;
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(index);
  });
  return [...groups.entries()]
    .filter(([, indexes]) => indexes.length > 1)
    .map(([name, indexes]) => ({ name, indexes: indexes.slice() }));
}

/**
 * Reorders one participant. Out-of-range moves return a shallow copy unchanged.
 * @param {ParticipantInput[]} participants
 * @param {number} index
 * @param {'up'|'down'} direction
 */
export function moveParticipant(participants, index, direction) {
  const target = index + (direction === 'up' ? -1 : 1);
  if (!Array.isArray(participants) || !Number.isInteger(index) || index < 0 || index >= participants.length
    || target < 0 || target >= participants.length) {
    return Array.isArray(participants) ? participants.map((item) => ({ ...item })) : [];
  }
  const next = participants.map((item) => ({ ...item }));
  const displaced = next[target];
  next[target] = next[index];
  next[index] = displaced;
  return next;
}

/**
 * Swaps two adjacent participants at `index` and `index + 1`. Identifiers and
 * shares stay with each participant. Out-of-range indexes return a shallow copy.
 * @param {ParticipantInput[]} participants
 * @param {number} index
 */
export function swapAdjacentParticipants(participants, index) {
  if (!Array.isArray(participants) || !Number.isInteger(index) || index < 0 || index >= participants.length - 1) {
    return Array.isArray(participants) ? participants.map((item) => ({ ...item })) : [];
  }
  return moveParticipant(participants, index, 'down');
}

/**
 * Removes one participant and reallocates that share across whoever remains.
 * Remaining participants keep their relative weights. The last remaining
 * participant absorbs floating-point remainder so a previously valid split
 * still sums to 1. The last two participants cannot be removed.
 * @param {ParticipantInput[]} participants
 * @param {number} index
 */
export function dropAndReallocate(participants, index) {
  if (!Array.isArray(participants) || participants.length <= 2) {
    throw new ValidationError(['At least two participants must remain.']);
  }
  if (!Number.isInteger(index) || index < 0 || index >= participants.length) {
    throw new ValidationError(['Choose a current participant.']);
  }
  const originalSum = participants.reduce((sum, item) => sum + item.revenueShare, 0);
  const droppedShare = participants[index].revenueShare;
  const remaining = participants.filter((_, itemIndex) => itemIndex !== index).map((item) => ({ ...item }));
  const remainingTotal = remaining.reduce((sum, item) => sum + item.revenueShare, 0);
  if (Number.isFinite(droppedShare) && droppedShare > 0) {
    if (remainingTotal > 0) {
      let assigned = 0;
      remaining.forEach((item, itemIndex) => {
        if (itemIndex === remaining.length - 1) item.revenueShare += droppedShare - assigned;
        else {
          const add = droppedShare * (item.revenueShare / remainingTotal);
          item.revenueShare += add;
          assigned += add;
        }
      });
    } else {
      let assigned = 0;
      remaining.forEach((item, itemIndex) => {
        if (itemIndex === remaining.length - 1) item.revenueShare += droppedShare - assigned;
        else {
          const add = droppedShare / remaining.length;
          item.revenueShare += add;
          assigned += add;
        }
      });
    }
  }
  if (Number.isFinite(originalSum)) {
    const now = remaining.reduce((sum, item) => sum + item.revenueShare, 0);
    remaining[remaining.length - 1].revenueShare += originalSum - now;
  }
  return remaining;
}

/** Fee floors at current effective volume and fixed shares, not a demand forecast. */
export function calculateFeeRequirements(config) {
  assertValidConfiguration(config);
  const volume = effectiveVolume(config.deal);
  const participants = config.participants.map((participant) => {
    const overhead = participant.fixedMonthlyCost + participant.riskCost + participant.minimumAcceptableProfit;
    const needsRevenue = overhead > 0 || (volume > 0 && participant.variableCostPerTransaction > 0);
    const floor = !needsRevenue ? 0 : volume > 0 && participant.revenueShare > 0
      ? (participant.variableCostPerTransaction + overhead / volume) / participant.revenueShare : null;
    const requiredFee = floor !== null && Number.isFinite(floor) && floor <= MAX_NUMERIC_INPUT ? floor : null;
    const operationalFailures = [];
    if (volume < (participant.minimumCommitment ?? 0)) operationalFailures.push('minimum commitment');
    if (participant.capacity != null && volume > participant.capacity) operationalFailures.push('capacity');
    return { id: participant.id, name: participant.name, requiredFee, operationalFailures };
  });
  const requiredFee = participants.some((item) => item.requiredFee === null) ? null : Math.max(...participants.map((item) => item.requiredFee));
  return { volume, requiredFee, operationallyFeasible: participants.every((item) => !item.operationalFailures.length), participants };
}

/** Materialize one displayed compound case as new baseline inputs. */
export function materializeStressCase(config, scenarioId) {
  const scenario = evaluateStressGrid(config).scenarios.find((item) => item.id === scenarioId);
  if (!scenario) throw new ValidationError(['Choose a current compound case.']);
  const candidate = { ...config, deal: { ...config.deal, monthlyVolume: scenario.volume, feePerTransaction: scenario.fee, volumeShockPct: 0 }, participants: config.participants.map((item) => ({ ...item, variableCostPerTransaction: item.variableCostPerTransaction * (1 + scenario.variableCostRisePct / 100) })), ...(config.stress ? { stress: { ...config.stress } } : {}) };
  assertValidConfiguration(candidate);
  return candidate;
}

/**
 * Rebuilds the split so `targetId` receives `targetShare` and everyone else
 * keeps their relative claim on the leftover. The last remaining participant
 * absorbs floating-point remainder so the shares sum to 1.
 * @param {ParticipantInput[]} participants
 * @param {string} targetId
 * @param {number} targetShare
 */
export function proposalWithTargetShare(participants, targetId, targetShare) {
  const targetIndex = participants.findIndex((item) => item.id === targetId);
  if (targetIndex < 0) throw new ValidationError(['Choose a current participant.']);
  if (!isFiniteNumber(targetShare) || targetShare < 0 || targetShare > 1) {
    throw new ValidationError(['Target share must be a finite number from zero through 1.']);
  }
  const leftover = 1 - targetShare;
  const others = participants.map((_, index) => index).filter((index) => index !== targetIndex);
  const othersTotal = others.reduce((sum, index) => sum + participants[index].revenueShare, 0);
  const next = participants.map((item) => ({ ...item }));
  next[targetIndex].revenueShare = targetShare;
  if (!others.length) return next;
  if (othersTotal > 0) {
    let assigned = 0;
    others.forEach((index, order) => {
      if (order === others.length - 1) next[index].revenueShare = leftover - assigned;
      else {
        const share = leftover * (participants[index].revenueShare / othersTotal);
        next[index].revenueShare = share;
        assigned += share;
      }
    });
  } else {
    let assigned = 0;
    others.forEach((index, order) => {
      if (order === others.length - 1) next[index].revenueShare = leftover - assigned;
      else {
        const share = leftover / others.length;
        next[index].revenueShare = share;
        assigned += share;
      }
    });
  }
  const total = next.reduce((sum, item) => sum + item.revenueShare, 0);
  next[others[others.length - 1]].revenueShare += 1 - total;
  return next;
}

function targetHoldsAtShare(config, participantId, share) {
  const participants = proposalWithTargetShare(config.participants, participantId, share);
  const participant = participants.find((item) => item.id === participantId);
  return evaluateParticipant(participant, config.deal).viable;
}

/**
 * Binary-searches the minimum revenue share in [0, 1] at which `participantId`
 * holds, while remaining participants keep their relative shares of the leftover.
 * Does not assign probabilities. Capacity and commitment failures that persist
 * at a 100% share are reported as impossible.
 * @param {PartnershipConfig} config
 * @param {string} participantId
 */
export function solveMinimumShareToHold(config, participantId) {
  assertValidConfiguration(config);
  if (!config.participants.some((item) => item.id === participantId)) {
    throw new ValidationError(['Choose a current participant.']);
  }
  if (targetHoldsAtShare(config, participantId, 0)) {
    return {
      status: 'possible',
      share: 0,
      participantId,
      proposal: proposalWithTargetShare(config.participants, participantId, 0),
      reason: 'This participant holds even with a zero revenue share under the current volume, fee, costs, capacity, and commitment.',
    };
  }
  if (!targetHoldsAtShare(config, participantId, 1)) {
    const participant = config.participants.find((item) => item.id === participantId);
    const atFull = evaluateParticipant({ ...participant, revenueShare: 1 }, config.deal);
    const detail = atFull.failureReasons.length ? atFull.failureReasons.join('; ') : 'fee revenue cannot fund the profit floor';
    return {
      status: 'impossible',
      share: null,
      participantId,
      proposal: null,
      reason: `Even a 100% revenue share cannot make this participant hold (${detail}). Revenue share cannot repair capacity or commitment failures.`,
    };
  }
  let low = 0;
  let high = 1;
  for (let step = 0; step < 60; step += 1) {
    const mid = (low + high) / 2;
    if (targetHoldsAtShare(config, participantId, mid)) high = mid;
    else low = mid;
  }
  const share = targetHoldsAtShare(config, participantId, high) ? high : 1;
  return {
    status: 'possible',
    share,
    participantId,
    proposal: proposalWithTargetShare(config.participants, participantId, share),
    reason: 'Minimum revenue share at which this participant holds. Remaining participants keep their relative shares of the leftover.',
  };
}

/**
 * Portable case JSON with participant display names replaced and the deal title and notes cleared.
 * Identifiers, shares, costs, and stress settings are unchanged.
 * @param {PartnershipConfig} config
 */
export function redactConfiguration(config) {
  assertValidConfiguration(config);
  const copy = {
    deal: { ...config.deal },
    participants: config.participants.map((item) => ({ ...item })),
    ...(Object.hasOwn(config, 'stress') ? { stress: { ...config.stress } } : {}),
  };
  delete copy.deal.title;
  delete copy.deal.notes;
  copy.participants.forEach((item, index) => {
    item.name = `Participant ${index + 1}`;
  });
  return copy;
}

const CSV_COLUMNS = Object.freeze({
  name: Object.freeze(['name', 'participant', 'participant name']),
  revenueShare: Object.freeze(['revenue share', 'share', 'revenueshare', 'revenue_share']),
  variableCostPerTransaction: Object.freeze(['variable cost', 'variable cost per transaction', 'variablecost', 'variable_cost']),
  fixedMonthlyCost: Object.freeze(['fixed cost', 'fixed monthly cost', 'fixedcost', 'fixed_cost']),
  minimumAcceptableProfit: Object.freeze(['min profit', 'minimum profit', 'minimum acceptable profit', 'min_profit']),
  capacity: Object.freeze(['capacity', 'capacity / month', 'capacity/month']),
  minimumCommitment: Object.freeze(['commitment', 'minimum commitment', 'min commitment']),
  riskCost: Object.freeze(['risk', 'risk cost', 'risk cost / month', 'riskcost']),
});
const CSV_REQUIRED_FIELDS = Object.freeze([
  'name', 'revenueShare', 'variableCostPerTransaction', 'fixedMonthlyCost', 'minimumAcceptableProfit', 'riskCost',
]);

/**
 * Treats a leading apostrophe as spreadsheet quoting, not as part of the value,
 * when the remaining text looks like a formula prefix.
 * @param {unknown} value
 * @returns {string}
 */
export function neutralizeCsvCell(value) {
  const text = String(value ?? '');
  if (/^'[\s\u0000-\u001F]*[=+\-@]/.test(text)) return text.slice(1);
  return text;
}

/**
 * RFC 4180-style records with a single-character delimiter. Does not execute formulas.
 * Empty rows are dropped.
 * @param {unknown} text
 * @param {string} [delimiter]
 * @returns {string[][]}
 */
export function parseDelimited(text, delimiter = ',') {
  if (typeof text !== 'string') {
    throw new ValidationError(['CSV must be text.']);
  }
  if (typeof delimiter !== 'string' || delimiter.length !== 1) {
    throw new ValidationError(['CSV delimiter must be a single character.']);
  }
  const source = text.replace(/^\uFEFF/, '');
  if (source.trim() === '') {
    throw new ValidationError(['CSV is empty.']);
  }
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (inQuotes) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (ch === '\r') {
      if (source[i + 1] === '\n') continue;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (inQuotes) {
    throw new ValidationError(['CSV has an unterminated quoted field.']);
  }
  row.push(cell);
  if (row.some((item) => item !== '')) rows.push(row);
  return rows.filter((item) => item.some((value) => String(value).trim() !== ''));
}

/**
 * RFC 4180-style records. Does not execute formulas. Empty rows are dropped.
 * @param {unknown} text
 * @returns {string[][]}
 */
export function parseCsv(text) {
  return parseDelimited(text, ',');
}

/**
 * Uses a tab delimiter when the first line contains a tab; otherwise comma.
 * @param {unknown} text
 * @returns {','|'\t'}
 */
export function detectRosterDelimiter(text) {
  if (typeof text !== 'string') return ',';
  const source = text.replace(/^\uFEFF/, '');
  const end = source.search(/\r\n|\n|\r/);
  const first = end === -1 ? source : source.slice(0, end);
  return first.includes('\t') ? '\t' : ',';
}

function normalizeCsvHeader(value) {
  return neutralizeCsvCell(value).trim().toLowerCase().replace(/\s+/g, ' ');
}

function mapCsvHeaders(headerRow, errors) {
  const indexByField = {};
  headerRow.forEach((raw, index) => {
    const header = normalizeCsvHeader(raw);
    if (header === '') {
      errors.push(`CSV header ${index + 1} is empty.`);
      return;
    }
    let matched = null;
    for (const [field, aliases] of Object.entries(CSV_COLUMNS)) {
      if (aliases.includes(header)) {
        matched = field;
        break;
      }
    }
    if (!matched) {
      errors.push(`CSV contains an unknown column: ${header}.`);
      return;
    }
    if (Object.hasOwn(indexByField, matched)) {
      errors.push(`CSV column ${CSV_COLUMNS[matched][0]} is duplicated.`);
      return;
    }
    indexByField[matched] = index;
  });
  CSV_REQUIRED_FIELDS.forEach((field) => {
    if (!Object.hasOwn(indexByField, field)) {
      errors.push(`CSV is missing required column: ${CSV_COLUMNS[field][0]}.`);
    }
  });
  return indexByField;
}

function csvNumber(raw, label, errors, { optional = false, max = MAX_NUMERIC_INPUT } = {}) {
  const text = neutralizeCsvCell(raw).trim();
  if (optional && text === '') return null;
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(text)) {
    errors.push(`${label} must be a finite decimal number.`);
    return null;
  }
  const value = Number(text);
  if (!Number.isFinite(value) || value < 0 || value > max) {
    errors.push(`${label} must be a finite number from zero through ${max}.`);
    return null;
  }
  return value;
}

function csvName(raw, label, errors) {
  const text = neutralizeCsvCell(raw).trim();
  if (text === '' || text.length > 80) {
    errors.push(`${label} must be a non-empty string no longer than 80 characters.`);
    return '';
  }
  return text;
}

function idFromParticipantName(name, used) {
  let base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (!base) base = 'participant';
  if (base.length > 64) base = base.slice(0, 64).replace(/-+$/g, '') || 'participant';
  let id = base;
  let sequence = 2;
  while (used.has(id)) {
    const suffix = `-${sequence}`;
    id = `${base.slice(0, Math.max(1, 64 - suffix.length))}${suffix}`;
    sequence += 1;
  }
  used.add(id);
  return id;
}

/**
 * Builds a replacement roster from CSV. Deal terms are not read. Capacity and
 * commitment columns may be omitted; empty cells become null. Shares must still
 * sum to 1. Formula prefixes are treated as text.
 * @param {unknown} text
 * @returns {ParticipantInput[]}
 */
export function participantsFromCsv(text) {
  if (typeof text !== 'string') {
    throw new ValidationError(['CSV must be text.']);
  }
  if (text.length > 250_000) {
    throw new ValidationError(['CSV must be 250 KB or smaller.']);
  }
  const rows = parseCsv(text);
  if (rows.length < 3) {
    throw new ValidationError(['CSV must include a header row and at least 2 participant rows.']);
  }
  if (rows.length - 1 > MAX_PARTICIPANTS) {
    throw new ValidationError([`Between 2 and ${MAX_PARTICIPANTS} participants are required.`]);
  }
  const errors = [];
  const headerMap = mapCsvHeaders(rows[0], errors);
  if (errors.length) throw new ValidationError(errors);

  const usedIds = new Set();
  const participants = [];
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    const rowLabel = `Row ${index + 1}`;
    const cell = (field) => (headerMap[field] == null ? '' : (row[headerMap[field]] ?? ''));
    const name = csvName(cell('name'), `${rowLabel} name`, errors);
    const revenueShare = csvNumber(cell('revenueShare'), `${rowLabel} revenue share`, errors, { max: 1 });
    const variableCostPerTransaction = csvNumber(cell('variableCostPerTransaction'), `${rowLabel} variable cost`, errors);
    const fixedMonthlyCost = csvNumber(cell('fixedMonthlyCost'), `${rowLabel} fixed cost`, errors);
    const minimumAcceptableProfit = csvNumber(cell('minimumAcceptableProfit'), `${rowLabel} min profit`, errors);
    const riskCost = csvNumber(cell('riskCost'), `${rowLabel} risk`, errors);
    const capacity = Object.hasOwn(headerMap, 'capacity')
      ? csvNumber(cell('capacity'), `${rowLabel} capacity`, errors, { optional: true })
      : null;
    const minimumCommitment = Object.hasOwn(headerMap, 'minimumCommitment')
      ? csvNumber(cell('minimumCommitment'), `${rowLabel} commitment`, errors, { optional: true })
      : null;
    if (!name) continue;
    participants.push({
      id: idFromParticipantName(name, usedIds),
      name,
      revenueShare: revenueShare ?? Number.NaN,
      variableCostPerTransaction: variableCostPerTransaction ?? Number.NaN,
      fixedMonthlyCost: fixedMonthlyCost ?? Number.NaN,
      minimumAcceptableProfit: minimumAcceptableProfit ?? Number.NaN,
      capacity,
      minimumCommitment,
      riskCost: riskCost ?? Number.NaN,
    });
  }
  if (errors.length) throw new ValidationError(errors);
  const probe = {
    deal: { monthlyVolume: 0, feePerTransaction: 0, addressableVolume: 0 },
    participants,
  };
  const validation = validateConfiguration(probe);
  if (!validation.valid) throw new ValidationError(validation.errors);
  return participants;
}

/**
 * Builds a replacement roster from pasted CSV or TSV. Tab-separated first lines
 * are converted to CSV, then {@link participantsFromCsv} validates the roster.
 * @param {unknown} text
 * @returns {ParticipantInput[]}
 */
export function participantsFromRosterText(text) {
  if (typeof text !== 'string') {
    throw new ValidationError(['CSV must be text.']);
  }
  if (text.length > 250_000) {
    throw new ValidationError(['CSV must be 250 KB or smaller.']);
  }
  const delimiter = detectRosterDelimiter(text);
  if (delimiter === ',') return participantsFromCsv(text);
  const rows = parseDelimited(text, '\t');
  const csv = `${rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n')}\n`;
  return participantsFromCsv(csv);
}

const PARTICIPANT_CSV_HEADER = Object.freeze([
  'name', 'revenue share', 'variable cost', 'fixed cost', 'min profit', 'capacity', 'commitment', 'risk',
]);

/**
 * Writes the current roster using the same columns as participant CSV import.
 * Empty optional capacity and commitment cells round-trip to null. Formula-like
 * names are prefixed with an apostrophe. Identifiers are not exported because
 * import regenerates them from names.
 * @param {PartnershipConfig} config
 * @returns {string}
 */
export function participantsToCsv(config) {
  assertValidConfiguration(config);
  const rows = [PARTICIPANT_CSV_HEADER.slice()];
  for (const participant of config.participants) {
    rows.push([
      participant.name,
      participant.revenueShare,
      participant.variableCostPerTransaction,
      participant.fixedMonthlyCost,
      participant.minimumAcceptableProfit,
      participant.capacity == null ? '' : participant.capacity,
      participant.minimumCommitment == null ? '' : participant.minimumCommitment,
      participant.riskCost,
    ]);
  }
  return `${rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')}\r\n`;
}

/**
 * Aligns two saved snapshots with the current case by participant id.
 * Missing roster members are flagged rather than silently dropped.
 * @param {PartnershipConfig} currentConfig
 * @param {PartnershipConfig} firstConfig
 * @param {PartnershipConfig} secondConfig
 */
export function compareThreeSnapshots(currentConfig, firstConfig, secondConfig) {
  assertValidConfiguration(currentConfig);
  assertValidConfiguration(firstConfig);
  assertValidConfiguration(secondConfig);
  const current = calculatePartnership(currentConfig);
  const first = calculatePartnership(firstConfig);
  const second = calculatePartnership(secondConfig);
  const order = [];
  const seen = new Set();
  for (const list of [first.participants, second.participants, current.participants]) {
    for (const item of list) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        order.push(item.id);
      }
    }
  }
  const idsOf = (result) => new Set(result.participants.map((item) => item.id));
  const firstIds = idsOf(first);
  const secondIds = idsOf(second);
  const currentIds = idsOf(current);
  const sameRoster = firstIds.size === secondIds.size && secondIds.size === currentIds.size
    && [...firstIds].every((id) => secondIds.has(id) && currentIds.has(id));
  const pick = (result, id) => {
    const item = result.participants.find((participant) => participant.id === id);
    if (!item) return null;
    return { id: item.id, name: item.name, monthlyProfit: item.monthlyProfit, viable: item.viable };
  };
  const rows = order.map((id) => {
    const firstRow = pick(first, id);
    const secondRow = pick(second, id);
    const currentRow = pick(current, id);
    return {
      id,
      name: currentRow?.name ?? secondRow?.name ?? firstRow?.name ?? id,
      first: firstRow,
      second: secondRow,
      current: currentRow,
      rosterMismatch: !(firstRow && secondRow && currentRow),
    };
  });
  return {
    sameRoster,
    rows,
    firstViable: first.viable,
    secondViable: second.viable,
    currentViable: current.viable,
    firstTotalProfit: first.totalProfit,
    secondTotalProfit: second.totalProfit,
    currentTotalProfit: current.totalProfit,
  };
}

/**
 * Aligns the current case with an imported JSON case by participant id.
 * Missing identifiers are labeled rather than filled with zeros.
 * @param {PartnershipConfig} currentConfig
 * @param {PartnershipConfig} importedConfig
 */
export function compareImportedCase(currentConfig, importedConfig) {
  assertValidConfiguration(currentConfig);
  assertValidConfiguration(importedConfig);
  const current = calculatePartnership(currentConfig);
  const imported = calculatePartnership(importedConfig);
  const order = [];
  const seen = new Set();
  for (const list of [current.participants, imported.participants]) {
    for (const item of list) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        order.push(item.id);
      }
    }
  }
  const currentIds = new Set(current.participants.map((item) => item.id));
  const importedIds = new Set(imported.participants.map((item) => item.id));
  const sameRoster = currentIds.size === importedIds.size && [...currentIds].every((id) => importedIds.has(id));
  const pick = (result, id) => {
    const item = result.participants.find((participant) => participant.id === id);
    if (!item) return null;
    return { id: item.id, name: item.name, monthlyProfit: item.monthlyProfit, viable: item.viable };
  };
  const rows = order.map((id) => {
    const currentRow = pick(current, id);
    const importedRow = pick(imported, id);
    return {
      id,
      name: currentRow?.name ?? importedRow?.name ?? id,
      current: currentRow,
      imported: importedRow,
      rosterMismatch: !(currentRow && importedRow),
    };
  });
  return {
    sameRoster,
    rows,
    currentViable: current.viable,
    importedViable: imported.viable,
    currentTotalProfit: current.totalProfit,
    importedTotalProfit: imported.totalProfit,
  };
}

/**
 * Lowercase hyphenated slug for download names. Path separators and punctuation
 * collapse. Empty or unusable titles return an empty string.
 * @param {unknown} title
 * @returns {string}
 */
export function sanitizeExportSlug(title) {
  if (typeof title !== 'string') return '';
  const slug = title.trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
  return slug;
}

/**
 * @param {'json'|'redacted'|'report'|'brief'|'csv'|'csv-visible'|'participants'|'tornado'|'waterfall'} kind
 * @param {unknown} title
 */
export function exportDownloadName(kind, title) {
  const slug = sanitizeExportSlug(title);
  if (kind === 'json') return slug ? `partnership-breakpoint-${slug}.json` : 'partnership-breakpoint.json';
  if (kind === 'redacted') return slug ? `partnership-breakpoint-${slug}-redacted.json` : 'partnership-breakpoint-redacted.json';
  if (kind === 'report') return slug ? `partnership-breakpoint-${slug}-report.md` : 'partnership-breakpoint-report.md';
  if (kind === 'brief') return slug ? `partnership-breakpoint-${slug}-brief.md` : 'partnership-breakpoint-brief.md';
  if (kind === 'csv') return slug ? `partnership-breakpoint-${slug}-stress.csv` : 'partnership-breakpoint-stress.csv';
  if (kind === 'csv-visible') return slug ? `partnership-breakpoint-${slug}-stress-visible.csv` : 'partnership-breakpoint-stress-visible.csv';
  if (kind === 'participants') return slug ? `partnership-breakpoint-${slug}-participants.csv` : 'partnership-breakpoint-participants.csv';
  if (kind === 'tornado') return slug ? `partnership-breakpoint-${slug}-tornado.svg` : 'partnership-breakpoint-tornado.svg';
  if (kind === 'waterfall') return slug ? `partnership-breakpoint-${slug}-waterfall.svg` : 'partnership-breakpoint-waterfall.svg';
  return slug ? `partnership-breakpoint-${slug}.json` : 'partnership-breakpoint.json';
}

/**
 * Minimum fee per transaction at which every participant holds, with volume
 * and shares held fixed. Capacity and commitment failures cannot be repaired.
 * @param {PartnershipConfig} config
 */
export function solveFeeForAllHold(config) {
  assertValidConfiguration(config);
  const guide = calculateFeeRequirements(config);
  if (!guide.operationallyFeasible) {
    return {
      status: 'impossible',
      fee: null,
      reason: 'Capacity or commitment failures cannot be repaired by changing the fee.',
    };
  }
  if (guide.requiredFee === null) {
    return {
      status: 'impossible',
      fee: null,
      reason: 'No finite fee can fund every participant profit floor at the current volume and shares.',
    };
  }
  return {
    status: 'possible',
    fee: guide.requiredFee,
    reason: 'Minimum fee per transaction at which every participant holds, with volume and shares held fixed. Demand response is not included.',
  };
}

function targetHoldsAtMonthlyVolume(config, participantId, monthlyVolume) {
  const participant = config.participants.find((item) => item.id === participantId);
  const deal = { ...config.deal, monthlyVolume };
  return evaluateParticipant(participant, deal).viable;
}

/**
 * Highest monthly volume searched for a hold. Effective volume stays inside
 * addressable demand and, when supplied, that participant's capacity, so a
 * capacity breach at a larger volume cannot hide a lower holding volume.
 * @param {PartnershipConfig} config
 * @param {ParticipantInput} participant
 */
export function maxMonthlyVolumeForHoldSearch(config, participant) {
  const shock = config.deal.volumeShockPct ?? 0;
  const factor = 1 - shock / 100;
  const demand = config.deal.addressableVolume;
  const capacity = participant.capacity;
  const maxEffective = capacity == null ? demand : Math.min(demand, capacity);
  if (factor <= EPSILON) return 0;
  const needed = maxEffective / factor;
  if (!Number.isFinite(needed) || needed < 0) return 0;
  return needed > MAX_NUMERIC_INPUT ? MAX_NUMERIC_INPUT : needed;
}

/**
 * Binary-searches the minimum monthly volume at which `participantId` holds,
 * with fee, shares, addressable demand, and volume shock held fixed. The search
 * is deterministic and does not assign probability. Capacity and addressable
 * demand cap the search so an upper-bound failure cannot hide a lower hold.
 * @param {PartnershipConfig} config
 * @param {string} participantId
 */
export function solveMinimumVolumeToHold(config, participantId) {
  assertValidConfiguration(config);
  const participant = config.participants.find((item) => item.id === participantId);
  if (!participant) {
    throw new ValidationError(['Choose a current participant.']);
  }
  if (targetHoldsAtMonthlyVolume(config, participantId, 0)) {
    const deal = { ...config.deal, monthlyVolume: 0 };
    return {
      status: 'possible',
      monthlyVolume: 0,
      effectiveVolume: effectiveVolume(deal),
      participantId,
      reason: 'This participant holds even at zero monthly volume under the current fee, shares, costs, capacity, and commitment.',
    };
  }
  const highBound = maxMonthlyVolumeForHoldSearch(config, participant);
  if (!targetHoldsAtMonthlyVolume(config, participantId, highBound)) {
    const deal = { ...config.deal, monthlyVolume: highBound };
    const atHigh = evaluateParticipant(participant, deal);
    const detail = atHigh.failureReasons.length ? atHigh.failureReasons.join('; ') : 'fee revenue cannot fund the profit floor';
    return {
      status: 'impossible',
      monthlyVolume: null,
      effectiveVolume: null,
      participantId,
      reason: `No monthly volume at or below the addressable and capacity limits can make this participant hold (${detail}). Fee and shares stay fixed.`,
    };
  }
  let low = 0;
  let high = highBound;
  for (let step = 0; step < 60; step += 1) {
    const mid = (low + high) / 2;
    if (targetHoldsAtMonthlyVolume(config, participantId, mid)) high = mid;
    else low = mid;
  }
  const monthlyVolume = targetHoldsAtMonthlyVolume(config, participantId, high) ? high : highBound;
  const deal = { ...config.deal, monthlyVolume };
  return {
    status: 'possible',
    monthlyVolume,
    effectiveVolume: effectiveVolume(deal),
    participantId,
    reason: 'Minimum monthly volume at which this participant holds, with fee and shares held fixed. Addressable demand and volume shock stay unchanged.',
  };
}

/**
 * Builds a unique display name by appending ` copy`, then ` copy 2`, and so on.
 * Names stay within `maxLength`. This is a label helper, not a timestamp.
 * @param {unknown} base
 * @param {Iterable<string>} used
 * @param {number} [maxLength]
 */
export function uniqueCopyName(base, used, maxLength = 80) {
  const source = typeof base === 'string' && base.trim() !== '' ? base.trim() : 'Current case';
  const usedSet = new Set(used);
  const suffix = ' copy';
  const fit = (stem, extra) => {
    const room = maxLength - extra.length;
    const clipped = room < 1 ? extra.trim().slice(0, maxLength) : `${stem.slice(0, room)}${extra}`;
    const trimmed = clipped.trim();
    return trimmed === '' ? extra.trim().slice(0, maxLength) : trimmed;
  };
  let name = fit(source, suffix);
  if (!usedSet.has(name)) return name;
  let sequence = 2;
  while (sequence < 10000) {
    name = fit(source, `${suffix} ${sequence}`);
    if (!usedSet.has(name)) return name;
    sequence += 1;
  }
  throw new ValidationError(['Could not assign a unique copy name.']);
}

/**
 * Spreadsheet-safe CSV cell. Formula prefixes on strings get a leading apostrophe.
 * Negative numbers are not treated as formulas.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeCsvCell(value) {
  let text = String(value ?? '');
  if (typeof value === 'string' && /^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

const STRESS_CSV_OPTION_KEYS = new Set(['scenarioIds']);
const STRESS_CSV_HEADER = Object.freeze([
  'Case', 'Volume change percent', 'Fee reduction percent', 'Variable cost increase percent',
  'Effective volume', 'Fee per transaction', 'Participant ID', 'Participant', 'Revenue share',
  'Revenue', 'Variable cost', 'Fixed cost', 'Risk cost', 'Monthly profit', 'Minimum profit',
  'Profit gap', 'Participant holds', 'Failure reasons',
]);

/**
 * One row per participant in each selected compound case. Counts are not likelihoods.
 * Omit options or omit `scenarioIds` to include every tested case. Grid order is preserved.
 * @param {PartnershipConfig} config
 * @param {{ scenarioIds?: string[] }} [options]
 */
export function stressGridCsv(config, options) {
  const stress = evaluateStressGrid(config);
  let scenarios = stress.scenarios;
  if (options !== undefined) {
    if (!isPlainObject(options)) {
      throw new ValidationError(['CSV options must be an object.']);
    }
    const errors = [];
    rejectUnknownKeys(options, STRESS_CSV_OPTION_KEYS, 'CSV options', errors);
    if (Object.hasOwn(options, 'scenarioIds')) {
      const ids = own(options, 'scenarioIds');
      if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string')) {
        errors.push('CSV scenarioIds must be an array of case identifiers.');
      } else {
        const allowed = new Set(ids);
        scenarios = stress.scenarios.filter((scenario) => allowed.has(scenario.id));
      }
    }
    if (errors.length) throw new ValidationError(errors);
  }
  const rows = [STRESS_CSV_HEADER.slice()];
  for (const scenario of scenarios) {
    scenario.participants.forEach((participant, index) => {
      const input = config.participants[index];
      rows.push([
        scenario.id,
        scenario.volumeChangePct,
        scenario.feeDropPct,
        scenario.variableCostRisePct,
        scenario.volume,
        scenario.fee,
        participant.id,
        participant.name,
        input.revenueShare,
        participant.revenue,
        participant.variableCost,
        participant.fixedCost,
        participant.riskCost,
        participant.monthlyProfit,
        input.minimumAcceptableProfit,
        participant.monthlyProfit - input.minimumAcceptableProfit,
        participant.viable,
        participant.failureReasons.join('; '),
      ]);
    });
  }
  return `${rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')}\r\n`;
}

export const PARTNERSHIP_REVIEW_TOOLS = Object.freeze([
  {id:'interval',title:'Feasible effective volume interval'},
  {id:'slack',title:'Constraint slack ledger'},
  {id:'fixed',title:'Fixed-cost allowance'},
  {id:'variable',title:'Variable-cost allowance'},
  {id:'shares',title:'Revenue-share funding needs'},
  {id:'fees',title:'Common fee scenarios'},
  {id:'operations',title:'Commitment and capacity conflicts'},
  {id:'volumes',title:'Effective-volume scenarios'},
  {id:'zero',title:'Zero-volume obligations'},
// PB_REVIEW_TOOLS
]);

/** Bounded declared-input reviews. Rows contain display primitives only. */
export function analyzePartnershipReview(rawConfig, tool) {
 const config=assertValidConfiguration(rawConfig);
 const selected=PARTNERSHIP_REVIEW_TOOLS.find(entry=>entry.id===tool);
 if(!selected) throw new ValidationError(['Unknown partnership review.']);
 const result=calculatePartnership(config);
 const report=(columns,rows,note)=>({tool,title:selected.title,currency:config.deal.currency??'units',columns,rows:rows.map(row=>row.map(value=>typeof value==='number'&&!Number.isFinite(value)?null:value)),note:note+' A blank numeric result can also mean it exceeds finite arithmetic bounds.'});
 switch(tool){
 case 'interval': {

      let lower=0,upper=config.deal.addressableVolume; const impossible=[];
      for(const p of config.participants){
        const contribution=p.revenueShare*config.deal.feePerTransaction-p.variableCostPerTransaction;
        const obligation=p.fixedMonthlyCost+p.riskCost+p.minimumAcceptableProfit;
        lower=Math.max(lower,p.minimumCommitment??0); upper=Math.min(upper,p.capacity??upper);
        if(contribution>0) lower=Math.max(lower,obligation/contribution);
        else if(obligation>0) impossible.push(p.name+' cannot fund its profit floor');
        else if(contribution<0) upper=0;
      }
      const feasible=!impossible.length&&lower<=upper;
      return report(['Required effective volume','Maximum effective volume','Interval','Reason'],[[lower,upper,feasible?'Feasible':'Empty',impossible.join('; ')||(lower>upper?'Lower bound exceeds upper bound':'All declared constraints overlap')]],'Continuous effective transactions, with fee, shares and costs fixed. Bounds use exact inequalities; the existing evaluator has a tiny numerical tolerance. This is not planned pre-shock volume or evidence that demand will occur.');

 }
 case 'slack': {

 return report(['Participant','Profit above floor','Volume above commitment','Capacity remaining','Current tests'],result.participants.map(p=>[p.name,p.monthlyProfit-p.minimumAcceptableProfit,p.volume-(p.minimumCommitment??0),p.capacity==null?null:p.capacity-p.volume,p.viable?'Hold':p.failureReasons.join('; ')]),'Signed slack uses current effective volume. Negative values are breaches; a blank capacity is unbounded. Monetary and transaction slacks are distinct units and cannot be added.');

 }
 case 'fixed': {

 return report(['Participant','Current fixed cost','Maximum fixed cost','Change allowance','Interpretation'],result.participants.map(p=>{const maximum=p.volume*p.contributionPerTransaction-p.riskCost-p.minimumAcceptableProfit;return[p.name,p.fixedMonthlyCost,maximum<0?null:Math.min(MAX_NUMERIC_INPUT,maximum),p.monthlyProfit-p.minimumAcceptableProfit,maximum<0?'Even zero fixed cost misses the profit floor':maximum>MAX_NUMERIC_INPUT?'Ceiling capped at model input limit':'Profit-only ceiling'];}),'Each row changes only that participant fixed cost. Capacity and commitment remain separate tests; a positive allowance does not establish partnership viability.');

 }
 case 'variable': {

 return report(['Participant','Current variable cost','Maximum variable cost / transaction','Change allowance / transaction','Interpretation'],result.participants.map(p=>{const maximum=p.volume>0?p.revenueShare*config.deal.feePerTransaction-(p.fixedMonthlyCost+p.riskCost+p.minimumAcceptableProfit)/p.volume:null;return[p.name,p.variableCostPerTransaction,maximum===null||maximum<0?null:Math.min(MAX_NUMERIC_INPUT,maximum),p.volume>0?(p.monthlyProfit-p.minimumAcceptableProfit)/p.volume:null,maximum===null?'No transactions; variable cost has no effect':maximum<0?'Zero variable cost is insufficient':'Profit-only ceiling'];}),'Current effective volume, fee, shares and monthly costs stay fixed. Blank means no nonnegative ceiling can be calculated. This does not model demand response or negotiated cost changes.');

 }
 case 'shares': {

 const gross=result.effectiveVolume*config.deal.feePerTransaction;
 const rows=result.participants.map(p=>{const needs=p.variableCost+p.fixedCost+p.riskCost+p.minimumAcceptableProfit;const share=gross>0?needs/gross:needs===0?0:null;return[p.name,p.revenueShare,share,share===null?null:p.revenueShare-share];});
 const total=rows.every(r=>r[2]!==null)?rows.reduce((sum,r)=>sum+r[2],0):null;
 rows.push(['Total funding need',config.participants.reduce((sum,p)=>sum+p.revenueShare,0),total,total===null?null:1-total]);
 return report(['Participant','Current share','Minimum funding share','Share above requirement'],rows,'Shares are fractions of the same revenue pool, not independent offers. A total requirement above 1 cannot be funded at these terms. Blank means positive obligations with no gross revenue. Operational constraints are not repaired by a split.');

 }
 case 'fees': {

 const rows=[.75,1,1.25,1.5].map(factor=>{const fee=Math.min(MAX_NUMERIC_INPUT,config.deal.feePerTransaction*factor);const evaluated=calculatePartnership({...config,deal:{...config.deal,feePerTransaction:fee}});return[factor,fee,evaluated.participants.filter(p=>p.viable).length,evaluated.totalProfit,Math.min(...evaluated.participants.map(p=>p.monthlyProfit-p.minimumAcceptableProfit)),evaluated.viable?'All hold':'At least one exits'];});
 return report(['Fee multiplier','Tested fee','Participants holding','Total monthly profit','Lowest profit slack','Outcome'],rows,'Four illustrative fee levels, capped at the model input limit. Only the common fee changes. Volume, shares, costs and operational limits stay fixed; these points are not an optimum or forecast.');

 }
 case 'operations': {

 const required=Math.max(...config.participants.map(p=>p.minimumCommitment??0));const ceiling=Math.min(config.deal.addressableVolume,...config.participants.map(p=>p.capacity??config.deal.addressableVolume));
 return report(['Participant','Commitment','Capacity','Demand ceiling','Gap from shared requirement'],config.participants.map(p=>[p.name,p.minimumCommitment??0,p.capacity??null,config.deal.addressableVolume,Math.min(p.capacity??config.deal.addressableVolume,config.deal.addressableVolume)-required]).concat([['Shared operational interval',required,ceiling,config.deal.addressableVolume,ceiling-required]]),'Every participant handles the same effective volume. A negative shared gap means no volume satisfies all commitments, capacities and stated demand. A nonnegative gap does not establish profitability.');

 }
 case 'volumes': {

 const rows=[];for(const share of [0,.25,.5,.75,1]){const volume=config.deal.addressableVolume*share;const evaluated=calculatePartnership({...config,deal:{...config.deal,monthlyVolume:volume,volumeShockPct:0}});for(const p of evaluated.participants)rows.push([share,volume,p.name,p.monthlyProfit,p.viable?'Hold':p.failureReasons.join('; ')]);}
 return report(['Fraction of demand ceiling','Effective volume','Participant','Monthly profit','Current tests'],rows,'Five effective-volume points from zero through declared addressable demand. The counterfactual resets the volume shock to zero so it is not counted twice. Capacity violations remain visible; inputs are not changed.');

 }
 case 'zero': {

 return report(['Participant','Monthly cash cost at zero','Profit at zero','Unfunded profit requirement','Minimum committed transactions','Zero-volume tests'],config.participants.map(p=>{const tested=evaluateParticipant(p,config.deal,0);return[p.name,p.fixedMonthlyCost+p.riskCost,tested.monthlyProfit,p.fixedMonthlyCost+p.riskCost+p.minimumAcceptableProfit,p.minimumCommitment??0,tested.viable?'Hold':tested.failureReasons.join('; ')];}),'At zero transactions, modeled variable cost and fee revenue are zero. Fixed and risk costs remain. Unfunded profit requirement includes the declared profit floor, so it is not the same as a cash bill. No exit or legal obligation is inferred.');

 }
// PB_REVIEW_CASES
 default: throw new ValidationError(['Unavailable partnership review.']);
 }
}

export function createPartnershipReviewPacket(rawConfig, tool) {
  const scenario = JSON.parse(JSON.stringify(assertValidConfiguration(rawConfig)));
  const packet = { format: 'partnership-review', version: 1, tool, scenario, inputJSON: JSON.stringify(scenario), review: analyzePartnershipReview(scenario, tool) };
  if (new TextEncoder().encode(JSON.stringify(packet)).length > 1048576) throw new Error('Review packet exceeds 1 MiB. Choose a narrower review.');
  return packet;
}

export function replayPartnershipReviewPacket(candidate) {
  const fields = ['format', 'version', 'tool', 'scenario', 'inputJSON', 'review'];
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate) || Object.keys(candidate).length !== fields.length || !fields.every((field) => Object.hasOwn(candidate, field)) || candidate.format !== 'partnership-review' || candidate.version !== 1) throw new Error('Unsupported review packet.');
  const current = createPartnershipReviewPacket(candidate.scenario, candidate.tool);
  if (candidate.inputJSON !== current.inputJSON) throw new Error('Review input snapshot changed. Run a new review.');
  const supplied = candidate.review, expected = current.review;
  if (!supplied || typeof supplied !== 'object' || Array.isArray(supplied) || Object.keys(supplied).length !== Object.keys(expected).length || !Object.keys(expected).every((field) => Object.hasOwn(supplied, field))) throw new Error('Review result fields changed.');
  for (const field of ['tool', 'title', 'currency', 'note']) if (supplied[field] !== expected[field]) throw new Error('Review result does not match the input snapshot.');
  if (!Array.isArray(supplied.columns) || supplied.columns.length !== expected.columns.length || expected.columns.some((value, index) => !Object.hasOwn(supplied.columns, index) || supplied.columns[index] !== value) || !Array.isArray(supplied.rows) || supplied.rows.length !== expected.rows.length || expected.rows.some((row, index) => !Object.hasOwn(supplied.rows, index) || !Array.isArray(supplied.rows[index]) || supplied.rows[index].length !== row.length || row.some((value, column) => !Object.hasOwn(supplied.rows[index], column) || supplied.rows[index][column] !== value))) throw new Error('Review result does not match the input snapshot.');
  return current;
}
