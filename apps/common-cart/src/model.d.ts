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
  garden: Scenario;
  schoolFete: Scenario;
  officeFruit: Scenario;
  libraryPaper: Scenario;
  sportsKit: Scenario;
  surfFirstAid: Scenario;
  theatreWardrobe: Scenario;
  choirFolders: Scenario;
  scoutCamp: Scenario;
  schoolExcursionLunch: Scenario;
  netballCanteen: Scenario;
  swimmingCarnivalLunch: Scenario;
  athleticsCarnivalLunch: Scenario;
  cricketCarnivalLunch: Scenario;
  tennisCarnivalLunch: Scenario;
  basketballCarnivalLunch: Scenario;
  volleyballCarnivalLunch: Scenario;
  soccerCarnivalLunch: Scenario;
  rugbyCarnivalLunch: Scenario;
  hockeyCarnivalLunch: Scenario;
  baseballCarnivalLunch: Scenario;
  softballCarnivalLunch: Scenario;
  waterPoloCarnivalLunch: Scenario;
  rowingCarnivalLunch: Scenario;
  sailingCarnivalLunch: Scenario;
  canoeingCarnivalLunch: Scenario;
  kayakingCarnivalLunch: Scenario;
  dragonBoatCarnivalLunch: Scenario;
  surfCarnivalLunch: Scenario;
  triathlonCarnivalLunch: Scenario;
  cyclingCarnivalLunch: Scenario;
  mountainBikeCarnivalLunch: Scenario;
  bmxCarnivalLunch: Scenario;
  cycloCrossCarnivalLunch: Scenario;
  trackCyclingCarnivalLunch: Scenario;
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
export function createExclusionCountsMarkdown(rawScenario: unknown, offerId: string): string;
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
export function createDeliveryHeatmapCsv(rawScenario: unknown): string;

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
export function createVariantOverlapCsv(rawScenario: unknown): string;
export function createVariantOverlapMarkdown(rawScenario: unknown): string;
export function encodeScenario(rawScenario: unknown): string;
export function encodeRedactedScenario(rawScenario: unknown): string;
export function decodeScenario(value: unknown): Scenario;

export interface ScenarioHistory {
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  record(value: unknown): void;
  current(): Scenario;
  undo(): Scenario;
  redo(): Scenario;
}
export interface ScenarioWorkspace { version: 1; rooms: Scenario[]; fulfillmentFilter: "all" | "shipping" | "pickup"; hideExcludedBuyers: boolean; hideUnwinnableOffers: boolean; hideCoveredLeftoverRows: boolean; hideTertiaryLeftoverRow: boolean; hideLeftoverFillRow: boolean; hideZeroRemainingCapacityOffers: boolean; hideOffersWithRemainingCapacity: boolean; hideFullyFilledBuyers: boolean; hideBuyersWithLeftover: boolean; hideUnservedBuyers: boolean; hideLeftoverOnlyBuyers: boolean; hideWinnerAllocatedBuyers: boolean; hideBuyersFilledByLeftoverFill: boolean; hideLastBuyerFilledByLeftoverFill: boolean; hideFirstBuyerFilledByLeftoverFill: boolean; hideFirstBuyerFilledByTertiaryFill: boolean; hideLastBuyerFilledByTertiaryFill: boolean; hideLastUnservedBuyer: boolean; hideFirstUnservedBuyer: boolean; hideLastLeftoverOnlyBuyer: boolean; hideFirstLeftoverOnlyBuyer: boolean; hideLastWinnerAllocatedBuyer: boolean; hideFirstWinnerAllocatedBuyer: boolean; hideFirstUncoveredLeftoverBuyer: boolean; hideLastUncoveredLeftoverBuyer: boolean; }
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
export interface ScenarioComparison { baseline: ComparisonMetrics; current: ComparisonMetrics; sameCurrency: boolean; sameDemand: boolean; currencyWarning: string | null; }
export interface MerchantReport {
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
export function copyOfferAsPickup(rawScenario: unknown, offerId: string): Scenario;
export function filterOfferIdsByFulfillment(rawScenario: unknown, fulfillment: "all" | "shipping" | "pickup"): string[];
/** Display-only. Matching is unchanged. When hideUnwinnable is false, every offer id is returned. */
export function filterOfferIdsHidingUnwinnable(rawScenario: unknown, hideUnwinnable: boolean): string[];
/** Display-only. Matching is unchanged. When hideZeroRemaining is false, every offer id is returned. */
export function filterOfferIdsHidingZeroRemainingCapacity(rawScenario: unknown, hideZeroRemaining: boolean): string[];
/** Display-only. Matching is unchanged. Inverse of hide zero remaining capacity. When hideRemaining is false, every offer id is returned. */
export function filterOfferIdsHidingOffersWithRemainingCapacity(rawScenario: unknown, hideRemaining: boolean): string[];
export function acceptedVariantFilterOptions(rawScenario: unknown): string[];
export function filterBuyerIdsByAcceptedVariant(rawScenario: unknown, variant: string): string[];
export function filterBuyerIdsHidingExcluded(rawScenario: unknown, offerId: string, hideExcluded: boolean): string[];
/** Display-only. Matching is unchanged. When hideFullyFilled is false, every buyer id is returned. */
export function filterBuyerIdsHidingFullyFilled(rawScenario: unknown, hideFullyFilled: boolean): string[];
/** Display-only. Matching is unchanged. Inverse of hide fully filled. When hideBuyersWithLeftover is false, every buyer id is returned. */
export function filterBuyerIdsHidingBuyersWithLeftover(rawScenario: unknown, hideBuyersWithLeftover: boolean): string[];
/** Display-only. Matching is unchanged. Hides buyers with zero allocated units after the winner. When hideUnservedBuyers is false, every buyer id is returned. */
export function filterBuyerIdsHidingUnservedBuyers(rawScenario: unknown, hideUnservedBuyers: boolean): string[];
/** Display-only. Matching is unchanged. Hides leftover-only buyers (zero winner units, leftover fill and/or tertiary units greater than zero). Unserved buyers are not leftover-only. When hideLeftoverOnlyBuyers is false, every buyer id is returned. */
export function filterBuyerIdsHidingLeftoverOnlyBuyers(rawScenario: unknown, hideLeftoverOnlyBuyers: boolean): string[];
/** Display-only. Matching is unchanged. Hides organizer buyer rows that received winner units. Leftover-only and unserved buyers stay visible. When hideWinnerAllocatedBuyers is false, every buyer id is returned. */
export function filterBuyerIdsHidingWinnerAllocatedBuyers(rawScenario: unknown, hideWinnerAllocatedBuyers: boolean): string[];
/** Display-only. Matching is unchanged. Hides organizer buyer rows in leftover-fill selectedBuyerIds. Winner-allocated and unserved buyers stay visible. When hideBuyersFilledByLeftoverFill is false, every buyer id is returned. */
export function filterBuyerIdsHidingBuyersFilledByLeftoverFill(rawScenario: unknown, hideBuyersFilledByLeftoverFill: boolean): string[];
/** Display-only. Matching is unchanged. Hides only the last leftover-fill selectedBuyerIds entry. Winner-allocated, unserved, and other leftover-fill buyers stay visible. When hideLastBuyerFilledByLeftoverFill is false, every buyer id is returned. */
export function filterBuyerIdsHidingLastBuyerFilledByLeftoverFill(rawScenario: unknown, hideLastBuyerFilledByLeftoverFill: boolean): string[];
/** Display-only. Matching is unchanged. Hides only the first leftover-fill selectedBuyerIds entry. Winner-allocated, unserved, and other leftover-fill buyers stay visible. When hideFirstBuyerFilledByLeftoverFill is false, every buyer id is returned. */
export function filterBuyerIdsHidingFirstBuyerFilledByLeftoverFill(rawScenario: unknown, hideFirstBuyerFilledByLeftoverFill: boolean): string[];
/** Display-only. Matching is unchanged. Hides only the first tertiary-fill selectedBuyerIds entry. Winner-allocated, leftover-fill, unserved, and other tertiary-fill buyers stay visible. When hideFirstBuyerFilledByTertiaryFill is false, every buyer id is returned. */
export function filterBuyerIdsHidingFirstBuyerFilledByTertiaryFill(rawScenario: unknown, hideFirstBuyerFilledByTertiaryFill: boolean): string[];
/** Display-only. Matching is unchanged. Hides only the last tertiary-fill selectedBuyerIds entry. Winner-allocated, leftover-fill, unserved, and other tertiary-fill buyers stay visible. When hideLastBuyerFilledByTertiaryFill is false, every buyer id is returned. */
export function filterBuyerIdsHidingLastBuyerFilledByTertiaryFill(rawScenario: unknown, hideLastBuyerFilledByTertiaryFill: boolean): string[];
/** Display-only. Matching is unchanged. Hides only the last buyer with no winner, leftover-fill, or tertiary units. Winner-allocated, leftover-fill, tertiary-fill, and other unserved buyers stay visible. When hideLastUnservedBuyer is false, every buyer id is returned. */
export function filterBuyerIdsHidingLastUnservedBuyer(rawScenario: unknown, hideLastUnservedBuyer: boolean): string[];
/** Display-only. Matching is unchanged. Hides only the first buyer with no winner, leftover-fill, or tertiary units. Winner-allocated, leftover-fill, tertiary-fill, and other unserved buyers stay visible. When hideFirstUnservedBuyer is false, every buyer id is returned. */
export function filterBuyerIdsHidingFirstUnservedBuyer(rawScenario: unknown, hideFirstUnservedBuyer: boolean): string[];
/** Display-only. Matching is unchanged. Hides only the last leftover-only buyer (leftover-fill or tertiary, not winner, not unserved). Winner-allocated, unserved, and other leftover-only buyers stay visible. When hideLastLeftoverOnlyBuyer is false, every buyer id is returned. */
export function filterBuyerIdsHidingLastLeftoverOnlyBuyer(rawScenario: unknown, hideLastLeftoverOnlyBuyer: boolean): string[];
/** Display-only. Matching is unchanged. Hides only the first leftover-only buyer (leftover-fill or tertiary, not winner, not unserved). Winner-allocated, unserved, and other leftover-only buyers stay visible. When hideFirstLeftoverOnlyBuyer is false, every buyer id is returned. */
export function filterBuyerIdsHidingFirstLeftoverOnlyBuyer(rawScenario: unknown, hideFirstLeftoverOnlyBuyer: boolean): string[];
/** Display-only. Matching is unchanged. Hides only the last winner-allocated buyer. Leftover-only, unserved, leftover-fill, tertiary-fill, and other winner-allocated buyers stay visible. When hideLastWinnerAllocatedBuyer is false, every buyer id is returned. */
export function filterBuyerIdsHidingLastWinnerAllocatedBuyer(rawScenario: unknown, hideLastWinnerAllocatedBuyer: boolean): string[];
/** Display-only. Matching is unchanged. Hides only the first winner-allocated buyer. Leftover-only, unserved, leftover-fill, tertiary-fill, and other winner-allocated buyers stay visible. When hideFirstWinnerAllocatedBuyer is false, every buyer id is returned. */
export function filterBuyerIdsHidingFirstWinnerAllocatedBuyer(rawScenario: unknown, hideFirstWinnerAllocatedBuyer: boolean): string[];
/** Display-only. Matching is unchanged. Hides only the first uncovered leftover buyer (leftover-after-winner still unfilled after leftover fill and tertiary fill). Leftover-only, winner-allocated, leftover-fill, tertiary-fill, and other leftover buyers stay visible. When hideFirstUncoveredLeftoverBuyer is false, every buyer id is returned. */
export function filterBuyerIdsHidingFirstUncoveredLeftoverBuyer(rawScenario: unknown, hideFirstUncoveredLeftoverBuyer: boolean): string[];
/** Display-only. Matching is unchanged. Hides only the last uncovered leftover buyer (leftover-after-winner still unfilled after leftover fill and tertiary fill). Leftover-only, winner-allocated, leftover-fill, tertiary-fill, first uncovered leftover, and other leftover buyers stay visible. When hideLastUncoveredLeftoverBuyer is false, every buyer id is returned. */
export function filterBuyerIdsHidingLastUncoveredLeftoverBuyer(rawScenario: unknown, hideLastUncoveredLeftoverBuyer: boolean): string[];
export interface OrganizerBuyerVariantCount {
  variant: string;
  buyerCount: number;
  units: number;
}
export function organizerBuyerVariantCounts(rawScenario: unknown): OrganizerBuyerVariantCount[];
export function previewOfferSort(rawScenario: unknown, mode: "unitPrice" | "capacity"): Offer[];
export function applyOfferSort(rawScenario: unknown, mode: "unitPrice" | "capacity"): Scenario;
export function previewBuyerSort(rawScenario: unknown, mode: "label" | "quantity"): Buyer[];
export function applyBuyerSort(rawScenario: unknown, mode: "label" | "quantity"): Scenario;
export function restoreRemovedBuyer(rawScenario: unknown, rawBuyer: unknown): Scenario;
export function restoreExampleOffers(rawScenario: unknown, name?: keyof typeof presets): Scenario;
export function uniqueCopyTitle(title: unknown, existingTitles?: unknown): string;
export function duplicateRoom(rawScenario: unknown, existingTitles?: unknown): Scenario;
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
export interface ThreeRoomComparison { sameCurrency: boolean; currencyWarning: string | null; rooms: ThreeRoomRow[]; }
export function compareThreeRooms(first: unknown, second: unknown, third: unknown): ThreeRoomComparison;
export function landedTotalsComparison(leftCurrency: unknown, rightCurrency: unknown): { sameCurrency: boolean; comparable: boolean; warning: string | null };
export interface OfferIdentitySide {
  offerId: string;
  merchant: string;
  category: string;
  variant: string;
  fulfillment: "shipping" | "pickup";
  status: string;
  fulfilledUnits: number;
  includedBuyerCount: number;
  itemPrice: number | null;
  landedTotal: number | null;
}
export interface OfferIdentityComparison {
  leftCurrency: string;
  rightCurrency: string;
  leftBuyerCount: number;
  rightBuyerCount: number;
  leftRequestedUnits: number;
  rightRequestedUnits: number;
  leftOfferCount: number;
  rightOfferCount: number;
  sameCurrency: boolean;
  currencyWarning: string | null;
  shared: Array<{ offerId: string; left: OfferIdentitySide; right: OfferIdentitySide }>;
  missingFromRight: string[];
  missingFromLeft: string[];
}
export function compareRoomsByOfferIdentity(leftRaw: unknown, rightRaw: unknown): OfferIdentityComparison;
export function createOfferIdentityCompareMarkdown(leftRaw: unknown, rightRaw: unknown): string;
export function createMerchantReport(rawScenario: unknown): MerchantReport;
export function createMerchantResidualReport(rawScenario: unknown): MerchantResidualReport;
export interface WinnerBudgetLeftover {
  includedBuyerCount: number;
  unspentHeadroom: number;
  note: string;
}
export function winnerBudgetLeftover(rawScenario: unknown): WinnerBudgetLeftover;
/** Organizer-private one-line leftover unspent item headroom. Currency and counts only. Not a rebate. */
export function createLeftoverHeadroomMarkdown(rawScenario: unknown): string;
export function createBuyerCsv(rawScenario: unknown, offerId: string): string;
export function neutralizeSpreadsheetCell(value: unknown): unknown;
export function parseBuyerCsv(text: unknown): Buyer[];
export function parseBuyerTable(text: unknown): Buyer[];
export function importBuyersFromCsv(rawScenario: unknown, text: unknown): Scenario;
export function importBuyersFromTable(rawScenario: unknown, text: unknown): Scenario;
export function buyerCsvTemplate(): string;
/** Organizer-only. Same columns as import. Formula-safe. Includes private labels and optional budgets. */
export function createOrganizerBuyerCsv(rawScenario: unknown): string;
export function parseOfferCsv(text: unknown, defaults?: { category?: string; minimumUnits?: number; deliveryDays?: number }): Offer[];
export function importOffersFromCsv(rawScenario: unknown, text: unknown): Scenario;
export function offerCsvTemplate(): string;
export function createOfferCsv(rawScenario: unknown): string;
export function redactBuyerLabels(rawScenario: unknown): Scenario;
export function createOrganizerBriefing(rawScenario: unknown): string;
export function createWinnerAggregatesMarkdown(rawScenario: unknown): string;
export interface LeftoverCoverageRow {
  id: "leftover-after-winner" | "leftover-fill" | "tertiary-fill" | "uncovered-leftover";
  stage: string;
  /** Winner or leftover-fill merchant label only. Never a buyer label. */
  merchant: string;
  buyerCount: number;
  units: number;
  uncovered: boolean;
  /** True when this leftover-coverage row is fully covered leftover fill. Display filter only. */
  covered: boolean;
}
/** Organizer leftover table. Counts and merchant labels only. */
export function leftoverCoverageRows(rawScenario: unknown): LeftoverCoverageRow[];
/** Display-only leftover table filter. Matching is unchanged. */
export function filterLeftoverCoverageRowsHidingCovered(rawScenario: unknown, hideCovered: boolean): LeftoverCoverageRow[];
/** Display-only leftover table filter. Matching is unchanged. Hides the tertiary leftover-coverage row when present. */
export function filterLeftoverCoverageRowsHidingTertiary(rawScenario: unknown, hideTertiary: boolean): LeftoverCoverageRow[];
/** Display-only leftover table filter. Matching is unchanged. Hides the leftover-fill coverage row when present. */
export function filterLeftoverCoverageRowsHidingLeftoverFill(rawScenario: unknown, hideLeftoverFill: boolean): LeftoverCoverageRow[];
/** Organizer-private leftover Markdown. Buyer counts and units after the winner, including tertiary fill. */
export function createLeftoverCoverageMarkdown(rawScenario: unknown): string;
/** Merchant label only. Honest empty when none unlocked. No buyer data. */
export function createWinningMerchantLabelMarkdown(rawScenario: unknown): string;
/** Merchant-safe one-liner. Pickup or shipping, or None unlocked. No buyer data. */
export function createWinningFulfillmentMarkdown(rawScenario: unknown): string;
/** Organizer-private one-line leftover fill. Secondary leftover merchant and counts only. Not tertiary. */
export function createLeftoverFillMarkdown(rawScenario: unknown): string;
/** Organizer-private one-line leftover fill unit-count. Count only. Not a merchant export. */
export function createLeftoverFillUnitCountMarkdown(rawScenario: unknown): string;
/** Organizer-private one-line leftover fill merchant label. Merchant label only. Not a merchant export. */
export function createLeftoverFillMerchantLabelMarkdown(rawScenario: unknown): string;
/** Organizer-private one-line leftover fill remaining capacity. Count only. Not a merchant export. */
export function createLeftoverFillRemainingCapacityMarkdown(rawScenario: unknown): string;
/** Organizer-private one-line leftover fill fulfillment. Pickup or shipping. Not a merchant export. */
export function createLeftoverFillFulfillmentMarkdown(rawScenario: unknown): string;
/** Organizer-private one-line leftover fill delivery days. Count only. Not a merchant export. */
export function createLeftoverFillDeliveryMarkdown(rawScenario: unknown): string;
/** Organizer-private one-line leftover fill pickup days. Count only when leftover fill is pickup. Not a merchant export. */
export function createLeftoverFillPickupMarkdown(rawScenario: unknown): string;
/** Organizer-private one-line leftover fill offer label. Merchant and variant only. Not a merchant export. */
export function createLeftoverFillLabelMarkdown(rawScenario: unknown): string;
/** Organizer-private one-line leftover fill minimum units. Count only. Not a merchant export. */
export function createLeftoverFillMinimumMarkdown(rawScenario: unknown): string;
/** Organizer-private one-line leftover fill offer capacity. Count only. Not a merchant export. */
export function createLeftoverFillMaximumMarkdown(rawScenario: unknown): string;
/** Organizer-private one-line tertiary fill remaining capacity. Count only. Not a merchant export. */
export function createTertiaryFillRemainingCapacityMarkdown(rawScenario: unknown): string;
/** Organizer-private one-line tertiary fill offer capacity. Count only. Not a merchant export. */
export function createTertiaryFillMaximumMarkdown(rawScenario: unknown): string;
/** Merchant-safe remaining capacity on the unlocked winner. Honest empty when none unlocked. No buyer data. */
export function createWinningRemainingCapacityMarkdown(rawScenario: unknown): string;
/** Organizer-private one-line requested units. Count only. Not a merchant export. */
export function createRequestedUnitsMarkdown(rawScenario: unknown): string;
export interface OrganizerLeftoverRow {
  label: string;
  quantity: number;
  status: "Leftover fill" | "Tertiary fill" | "Uncovered leftover";
  uncovered: boolean;
}
/** Organizer leftover buyer rows after the winner. Private labels. Not a merchant export. */
export function organizerLeftoverRows(rawScenario: unknown): OrganizerLeftoverRow[];
/** Organizer-private winner inspector Markdown. Winning offer label, leftover counts, and residual coverage. */
export function createWinnerInspectorSummaryMarkdown(rawScenario: unknown): string;
/** Organizer-private uncovered leftover Markdown. Counts and units only. */
export function createUncoveredLeftoverCountsMarkdown(rawScenario: unknown): string;
/** Organizer-private one-line uncovered leftover unit-count. Count only. Not a merchant export. */
export function createUncoveredLeftoverUnitCountMarkdown(rawScenario: unknown): string;
/** Organizer-private one-line leftover uncovered remaining units. Count only. Honest empty none. Not a merchant export. Distinct from leftover-fill remaining and tertiary remaining. */
export function createLeftoverUncoveredRemainingMarkdown(rawScenario: unknown): string;
/** Organizer-private one-line leftover uncovered maximum. Leftover-fill offer capacity. Honest empty none. Not a merchant export. Distinct prefix from leftover-fill maximum, leftover uncovered remaining, leftover uncovered minimum, tertiary maximum, and uncovered leftover unit-count. */
export function createLeftoverUncoveredMaximumMarkdown(rawScenario: unknown): string;
/** Organizer-private one-line leftover uncovered minimum. Leftover-fill offer minimum units. Honest empty none. Not a merchant export. Distinct prefix from leftover-fill minimum, leftover uncovered remaining, leftover uncovered maximum, and uncovered leftover unit-count. */
export function createLeftoverUncoveredMinimumMarkdown(rawScenario: unknown): string;
/** Organizer-private one-line leftover uncovered count. Uncovered leftover buyer count. Honest empty none. Not a merchant export. Distinct prefix from leftover uncovered remaining, leftover uncovered maximum, leftover uncovered minimum, uncovered leftover unit-count, and uncovered leftover counts. */
export function createLeftoverUncoveredCountMarkdown(rawScenario: unknown): string;
/** Organizer-private one-line leftover uncovered leftover-only count. Leftover-only buyer count. Honest empty none. Not a merchant export. Distinct prefix from leftover uncovered count, leftover uncovered remaining, leftover uncovered maximum, leftover uncovered minimum, uncovered leftover unit-count, and uncovered leftover counts. */
export function createLeftoverUncoveredLeftoverOnlyCountMarkdown(rawScenario: unknown): string;
/** Organizer-private one-line leftover uncovered leftover-only remaining. Leftover-only buyer units after the winner. Honest empty none. Not a merchant export. Distinct prefix from leftover uncovered remaining and leftover uncovered leftover-only count. */
export function createLeftoverUncoveredLeftoverOnlyRemainingMarkdown(rawScenario: unknown): string;
/** Organizer-private one-line leftover uncovered leftover-only maximum. Largest leftover-only buyer quantity. Honest empty none. Not a merchant export. Distinct prefix from leftover uncovered leftover-only remaining, leftover uncovered leftover-only count, leftover uncovered remaining, leftover uncovered maximum, leftover uncovered minimum, leftover uncovered count, uncovered leftover unit-count, leftover-fill remaining, leftover-fill maximum, and tertiary remaining. */
export function createLeftoverUncoveredLeftoverOnlyMaximumMarkdown(rawScenario: unknown): string;
/** Organizer-private one-line leftover uncovered leftover-only minimum. Smallest leftover-only buyer quantity. Honest empty none. Not a merchant export. Distinct prefix from leftover uncovered leftover-only maximum, leftover uncovered leftover-only remaining, leftover uncovered leftover-only count, leftover uncovered remaining, leftover uncovered maximum, leftover uncovered minimum, leftover uncovered count, uncovered leftover unit-count, leftover-fill remaining, leftover-fill minimum, leftover-fill maximum, leftover uncovered leftover-only headroom, and tertiary remaining. */
export function createLeftoverUncoveredLeftoverOnlyMinimumMarkdown(rawScenario: unknown): string;
/** Organizer-private one-line leftover uncovered leftover-only headroom. Leftover-fill remaining capacity after leftover-only units. Honest empty none. Not a merchant export. Distinct prefix from leftover uncovered leftover-only minimum, leftover uncovered leftover-only maximum, leftover uncovered leftover-only remaining, leftover uncovered leftover-only count, leftover uncovered remaining, leftover uncovered maximum, leftover uncovered minimum, leftover uncovered count, uncovered leftover unit-count, leftover-fill remaining, leftover-fill minimum, leftover-fill maximum, leftover unspent item headroom, and tertiary remaining. */
export function createLeftoverUncoveredLeftoverOnlyHeadroomMarkdown(rawScenario: unknown): string;
export function createLeftoverUncoveredLeftoverOnlyAllocatedMarkdown(rawScenario: unknown): string;
/** Organizer-private one-line leftover uncovered leftover-only capacity. Leftover-fill offer capacity. Honest empty none. Not a merchant export. Distinct prefix from leftover uncovered leftover-only allocated, leftover uncovered leftover-only headroom, leftover uncovered leftover-only remaining, leftover uncovered leftover-only minimum, leftover uncovered leftover-only maximum, leftover uncovered leftover-only count, leftover uncovered remaining, leftover uncovered maximum, leftover uncovered minimum, leftover uncovered count, leftover-fill remaining, leftover-fill maximum, leftover unspent item headroom, leftover unit price, and leftover-only allocated units even when the number matches. */
export function createLeftoverUncoveredLeftoverOnlyCapacityMarkdown(rawScenario: unknown): string;
/** Organizer-private one-line leftover uncovered leftover-only unit price. Leftover-fill offer unit price. Honest empty none. Not a merchant export. Distinct prefix from leftover uncovered leftover-only capacity, leftover uncovered leftover-only allocated, leftover uncovered leftover-only headroom, leftover uncovered leftover-only remaining, leftover uncovered leftover-only minimum, leftover uncovered leftover-only maximum, leftover uncovered leftover-only count, leftover uncovered remaining, leftover uncovered maximum, leftover uncovered minimum, leftover uncovered count, leftover-fill remaining, leftover-fill maximum, leftover unspent item headroom, leftover unit price, and leftover-only allocated units even when the number matches. */
export function createLeftoverUncoveredLeftoverOnlyUnitPriceMarkdown(rawScenario: unknown): string;

export interface CartReview {
  tool: string; title: string; currency: string; columns: string[];
  rows: (string | number | null)[][]; note: string;
}
export const CART_REVIEW_TOOLS: readonly { id: string; title: string }[];
export function analyzeCartReview(rawScenario: unknown, tool: string): CartReview;

export interface CartReviewPacket { format: 'common-cart-review'; version: 1; tool: string; scenario: Scenario; inputJSON: string; review: CartReview; }
export function createCartReviewPacket(rawScenario: unknown, tool: string): CartReviewPacket;
export function replayCartReviewPacket(candidate: unknown): CartReviewPacket;
