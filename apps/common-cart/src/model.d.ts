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
  /** Optional quantity discounts; omitted or empty keeps the base price only. */
  tiers?: PriceTier[];
}

export interface Scenario {
  title: string;
  /** Three ASCII letters, stored uppercase. */
  currency: string;
  buyers: Buyer[];
  offers: Offer[];
}

export type IncompatibilityReason = "category" | "variant" | "price" | "delivery";
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
}>;

export function clonePreset(name?: keyof typeof presets): Scenario;
export function validateScenario(candidate: unknown): Scenario;
export function evaluateOffer(rawScenario: unknown, rawOffer: string | Offer): OfferEvaluation;
export function evaluateMarket(rawScenario: unknown): MarketEvaluation;
export function aggregateDemand(rawScenario: unknown): DemandGroup[];
export function encodeScenario(rawScenario: unknown): string;
export function decodeScenario(value: unknown): Scenario;
