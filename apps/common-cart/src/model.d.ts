/** Public types for the Common Cart matching model in `model.js`. */

export class ScenarioError extends Error {
  name: "ScenarioError";
  constructor(message: string);
}

export interface Buyer {
  id: string;
  label: string;
  category: string;
  /** Whole units from 1 to 5,000. */
  quantity: number;
  /** Item-price ceiling from 0 to 1,000,000; does not include shipping. */
  maxUnitPrice: number;
  /** Optional ceiling for the complete order including shipping. */
  maxOrderTotal?: number;
  /** Inclusive latest delivery in whole days from 0 to 365. */
  latestDeliveryDays: number;
  /** 1 to 12 distinct variant names after trim. */
  allowedVariants: string[];
}

export interface PriceTier {
  /** Strictly greater than the previous band's minimum and at most offer capacity. */
  minimumUnits: number;
  /** Strictly less than the previous band's unit price. */
  unitPrice: number;
}

export interface Offer {
  id: string;
  merchant: string;
  category: string;
  variant: string;
  unitPrice: number;
  minimumUnits: number;
  deliveryDays: number;
  capacity: number;
  shippingPerBuyer: number;
  /** `shipping` or `pickup`. Omitted JSON defaults to shipping. Pickup charges 0 shipping. */
  fulfillment?: "shipping" | "pickup";
}

export interface Scenario {
  title: string;
  /** Three ASCII letters, stored uppercase. */
  currency: string;
  buyers: Buyer[];
  offers: Offer[];
}

export type IncompatibilityReason = "category" | "variant" | "price" | "delivery" | "budget";
export type BuyerOutcomeStatus = "included" | "minimum" | "capacity" | "incompatible";

export interface BuyerOutcome {
  buyerId: string;
  status: BuyerOutcomeStatus;
  reasons: Array<IncompatibilityReason | "capacity" | "minimum">;
}

export interface BuyerAllocation {
  buyerId: string;
  quantity: number;
  unitPrice: number;
  itemsCost: number;
  shippingCost: number;
  totalCost: number;
  landedUnitCost: number;
  ceilingTotal: number;
  /** Signed; negative means shipping pushed the landed total above the item ceiling. */
  headroom: number;
  exceedsCeilingAfterShipping: boolean;
}

export interface TierProgress {
  index: number;
  minimumUnits: number;
  maximumUnits: number;
  unitPrice: number;
  compatibleUnits: number;
  allocatedUnits: number;
  unitsShort: number;
  qualifies: boolean;
  selected: boolean;
}

export interface OfferEvaluation {
  offer: Offer;
  compatibleBuyerCount: number;
  compatibleUnits: number;
  selectedBuyerIds: string[];
  buyerOutcomes: BuyerOutcome[];
  allocations: BuyerAllocation[];
  /** `0` is the base price; `null` when the offer does not qualify. */
  activeTierIndex: number | null;
  effectiveUnitPrice: number | null;
  basePriceDiscount: number;
  tierProgress: TierProgress[];
  deliveredBuyers: number;
  fulfilledUnits: number;
  qualifies: boolean;
  unitsShort: number;
  totalCost: number;
  reservationValue: number;
  savings: number;
  averageLandedUnitCost: number | null;
  fulfillmentRate: number;
}

export interface MarketEvaluation {
  scenario: Scenario;
  results: OfferEvaluation[];
  ranked: OfferEvaluation[];
  winner: OfferEvaluation | null;
  totalRequestedUnits: number;
  buyerCount: number;
  /** Distinct buyer categories after the same normalization used for matching. */
  categoryCount: number;
}

export interface DemandGroup {
  category: string;
  buyerCount: number;
  units: number;
  priceFloor: number;
  priceCeiling: number;
  earliestDelivery: number;
  latestDelivery: number;
  variants: string[];
}

export const presets: Readonly<{
  neighbourhood: Scenario;
  studio: Scenario;
  tiers: Scenario;
  pantry: Scenario;
  officePantry: Scenario;
  hardware: Scenario;
}>;

export function clonePreset(name?: keyof typeof presets): Scenario;
export function validateScenario(candidate: unknown): Scenario;
export function evaluateOffer(rawScenario: unknown, rawOffer: string | Offer): OfferEvaluation;
export function evaluateMarket(rawScenario: unknown): MarketEvaluation;

export interface CoverageOfferSummary {
  offerId: string;
  merchant: string;
  category: string;
  variant: string;
  fulfilledUnits: number;
  deliveredBuyers: number;
  totalCost: number;
  selectedBuyerIds?: string[];
}

export interface ResidualCoverage {
  planningAid: true;
  note: string;
  primary: CoverageOfferSummary | null;
  secondary: CoverageOfferSummary | null;
  tertiary: CoverageOfferSummary | null;
  leftoverBuyerCount: number;
  leftoverUnits: number;
  leftoverBuyerIds: string[];
  unfilledBuyerCount: number;
  unfilledUnits: number;
}

export function computeResidualCoverage(rawScenario: unknown): ResidualCoverage;

export interface NextTierGap {
  offerId: string;
  merchant: string;
  currentUnits: number;
  currentTierIndex: number | null;
  nextMinimum: number | null;
  nextPrice: number | null;
  compatibleUnitsAtNext: number | null;
  allocatedUnitsAtNext: number | null;
  unitsNeeded: number | null;
  reachable: boolean;
  reason: string;
  supplierBuyerIds: string[];
  supplierBuyerCount: number;
  supplierUnits: number;
}

export function unitsToNextTier(rawScenario: unknown, offerId: string): NextTierGap;

export interface CapacityBar {
  offerId: string;
  merchant: string;
  filledUnits: number;
  capacity: number;
  minimumUnits: number;
  nextTierThreshold: number | null;
  leftoverUnits: number;
  qualifies: boolean;
}

export function capacityBar(rawScenario: unknown, offerId: string): CapacityBar;

export type ExclusionGroupCode = "price" | "delivery" | "variant" | "category" | "budget" | "capacity_leftover" | "quantity_vs_capacity" | "minimum";
export interface ExclusionGroup {
  code: ExclusionGroupCode;
  count: number;
  buyerIds: string[];
}
export function groupExclusionReasons(rawScenario: unknown, offerId: string): ExclusionGroup[];
export function aggregateDemand(rawScenario: unknown): DemandGroup[];

export interface DeliveryBucket {
  key: string;
  label: string;
  min: number;
  max: number;
  buyerCount: number;
  units: number;
}
export interface DeliveryHeatmap {
  buyerCount: number;
  units: number;
  buckets: DeliveryBucket[];
}
export function deliveryHeatmap(rawScenario: unknown): DeliveryHeatmap;

export interface VariantOverlapCount {
  variant: string;
  offerCount: number;
  buyerCount: number;
  units: number;
}
export interface VariantOverlapCell {
  rowVariant: string;
  columnVariant: string;
  buyerCount: number;
  units: number;
}
export interface VariantOverlapMatrix {
  variants: VariantOverlapCount[];
  cells: VariantOverlapCell[][];
}
export function variantOverlapMatrix(rawScenario: unknown): VariantOverlapMatrix;
export function encodeScenario(rawScenario: unknown): string;
export function decodeScenario(value: unknown): Scenario;

export interface ScenarioHistory {
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  record(value: unknown): void;
  current(): Scenario;
  undo(): Scenario;
  redo(): Scenario;
}
export interface ScenarioWorkspace { version: 1; rooms: Scenario[]; }
export interface ComparisonMetrics {
  requested: number;
  fulfilled: number;
  buyers: number;
  cost: number | null;
  winner: string;
  leftoverBuyers: number;
  leftoverUnits: number;
  unfilledBuyers: number;
  unfilledUnits: number;
}
export interface ScenarioComparison { baseline: ComparisonMetrics; current: ComparisonMetrics; sameCurrency: boolean; sameDemand: boolean; }
export interface MerchantReport {
  report: string; version: number; currency: string; limitations: string;
  requestedUnits: number; buyerCount: number;
  offers: Array<{ merchant: string; category: string; variant: string; fulfillment: "shipping" | "pickup"; status: string; fulfilledUnits: number; includedBuyerCount: number; itemPrice: number | null; landedTotal: number | null; deliveryDays: number }>;
}
export interface MerchantResidualReport {
  report: string; version: number; currency: string; limitations: string;
  primary: { merchant: string; category: string; variant: string; fulfilledUnits: number; deliveredBuyers: number; totalCost: number } | null;
  secondary: { merchant: string; category: string; variant: string; fulfilledUnits: number; deliveredBuyers: number; totalCost: number } | null;
  tertiary: { merchant: string; category: string; variant: string; fulfilledUnits: number; deliveredBuyers: number; totalCost: number } | null;
  leftoverBuyerCount: number; leftoverUnits: number; unfilledBuyerCount: number; unfilledUnits: number;
}
export function createScenarioHistory(initial: unknown): ScenarioHistory;
export function validateWorkspace(candidate: unknown): ScenarioWorkspace;
export function duplicateEntry(rawScenario: unknown, kind: "buyers" | "offers", id: string): Scenario;
export function copyOfferAsNewTierSet(rawScenario: unknown, offerId: string): Scenario;
export function compareScenarios(before: unknown, after: unknown): ScenarioComparison;
export interface ThreeRoomRow {
  title: string;
  currency: string;
  requested: number;
  fulfilled: number;
  buyers: number;
  cost: number | null;
  winner: string;
  leftoverBuyers: number;
  leftoverUnits: number;
  unfilledBuyers: number;
  unfilledUnits: number;
}
export interface ThreeRoomComparison { sameCurrency: boolean; rooms: ThreeRoomRow[]; }
export function compareThreeRooms(first: unknown, second: unknown, third: unknown): ThreeRoomComparison;
export function createMerchantReport(rawScenario: unknown): MerchantReport;
export function createMerchantResidualReport(rawScenario: unknown): MerchantResidualReport;
export function createBuyerCsv(rawScenario: unknown, offerId: string): string;
export function neutralizeSpreadsheetCell(value: unknown): unknown;
export function parseBuyerCsv(text: unknown): Buyer[];
export function importBuyersFromCsv(rawScenario: unknown, text: unknown): Scenario;
export function buyerCsvTemplate(): string;
export function redactBuyerLabels(rawScenario: unknown): Scenario;
export function createOrganizerBriefing(rawScenario: unknown): string;
