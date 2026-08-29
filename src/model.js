const MAX_BUYERS = 40;
const MAX_OFFERS = 40;
const MAX_UNITS = 5000;
const MAX_TIERS = 8;
const MAX_SHARE_LENGTH = 60_000;

export class ScenarioError extends Error {
  constructor(message) {
    super(message);
    this.name = "ScenarioError";
  }
}

export const presets = Object.freeze({
  neighbourhood: {
    title: "Neighbourhood coffee run",
    currency: "AUD",
    buyers: [
      buyer("B01", "North block", "Coffee beans", 2, 33, 7, ["Medium roast", "Dark roast"]),
      buyer("B02", "Garden row", "Coffee beans", 3, 31, 5, ["Medium roast"]),
      buyer("B03", "Library crew", "Coffee beans", 4, 35, 8, ["Medium roast", "Dark roast"]),
      buyer("B04", "Station flats", "Coffee beans", 2, 29, 4, ["Dark roast"]),
      buyer("B05", "West court", "Coffee beans", 3, 34, 6, ["Medium roast"])
    ],
    offers: [
      offer("O01", "Harbour Roasters", "Coffee beans", "Medium roast", 26, 8, 5, 20, 2),
      offer("O02", "Southbank Coffee", "Coffee beans", "Dark roast", 24, 6, 7, 16, 1.5),
      offer("O03", "Coastline Supply", "Coffee beans", "Medium roast", 23, 14, 8, 30, 3)
    ]
  },
  studio: {
    title: "Shared studio chairs",
    currency: "AUD",
    buyers: [
      buyer("B01", "Studio A", "Desk chair", 4, 280, 14, ["Black", "Grey"]),
      buyer("B02", "Studio B", "Desk chair", 6, 250, 12, ["Black"]),
      buyer("B03", "Workshop", "Desk chair", 3, 310, 20, ["Grey"]),
      buyer("B04", "Print room", "Desk chair", 5, 270, 16, ["Black", "Grey"])
    ],
    offers: [
      offer("O01", "Form Office", "Desk chair", "Black", 218, 10, 12, 20, 18),
      offer("O02", "Seat Works", "Desk chair", "Grey", 236, 7, 15, 14, 12),
      offer("O03", "Warehouse North", "Desk chair", "Black", 199, 20, 18, 30, 15)
    ]
  },
  tiers: {
    title: "Coffee price ladder",
    currency: "AUD",
    buyers: [
      buyer("B01", "Early group", "Coffee beans", 6, 30, 7, ["Medium roast"]),
      buyer("B02", "Price-sensitive group", "Coffee beans", 5, 24, 7, ["Medium roast"]),
      buyer("B03", "Small group", "Coffee beans", 4, 24, 7, ["Medium roast"]),
      buyer("B04", "Large group", "Coffee beans", 10, 20, 7, ["Medium roast"])
    ],
    offers: [
      { ...offer("O01", "Common Roast", "Coffee beans", "Medium roast", 28, 4, 5, 20, 3),
        tiers: [{ minimumUnits: 10, unitPrice: 24 }, { minimumUnits: 18, unitPrice: 20 }] },
      offer("O02", "Single Price Supply", "Coffee beans", "Medium roast", 25, 4, 5, 20, 0)
    ]
  },
  pantry: {
    title: "Community pantry staples",
    currency: "AUD",
    buyers: [
      buyer("B01", "Kitchen one", "Pantry box", 8, 52, 5, ["Standard", "Gluten free"]),
      buyer("B02", "Kitchen two", "Pantry box", 12, 48, 4, ["Standard"]),
      buyer("B03", "Care group", "Pantry box", 10, 55, 6, ["Gluten free"]),
      buyer("B04", "Community hall", "Pantry box", 14, 50, 5, ["Standard"])
    ],
    offers: [
      offer("O01", "Shared Shelf", "Pantry box", "Standard", 42, 25, 4, 50, 1),
      offer("O02", "Good Basket", "Pantry box", "Gluten free", 47, 15, 5, 30, 1),
      offer("O03", "Bulk Commons", "Pantry box", "Standard", 39, 50, 6, 80, 0)
    ]
  }
});

function buyer(id, label, category, quantity, maxUnitPrice, latestDeliveryDays, allowedVariants) {
  return { id, label, category, quantity, maxUnitPrice, latestDeliveryDays, allowedVariants };
}

function offer(id, merchant, category, variant, unitPrice, minimumUnits, deliveryDays, capacity, shippingPerBuyer) {
  return { id, merchant, category, variant, unitPrice, minimumUnits, deliveryDays, capacity, shippingPerBuyer };
}

export function clonePreset(name = "neighbourhood") {
  if (!Object.hasOwn(presets, name)) throw new ScenarioError(`Unknown preset: ${name}`);
  return structuredClone(presets[name]);
}

export function validateScenario(candidate) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    throw new ScenarioError("Scenario must be an object.");
  }
  const title = requiredText(candidate.title, "title", 80);
  const currency = requiredText(candidate.currency, "currency", 3).toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new ScenarioError("Currency must be a three-letter code.");
  if (!Array.isArray(candidate.buyers) || candidate.buyers.length < 1 || candidate.buyers.length > MAX_BUYERS) {
    throw new ScenarioError(`Buyers must contain 1 to ${MAX_BUYERS} entries.`);
  }
  if (!Array.isArray(candidate.offers) || candidate.offers.length < 1 || candidate.offers.length > MAX_OFFERS) {
    throw new ScenarioError(`Offers must contain 1 to ${MAX_OFFERS} entries.`);
  }
  const buyers = candidate.buyers.map((entry, index) => validateBuyer(entry, index));
  const offers = candidate.offers.map((entry, index) => validateOffer(entry, index));
  uniqueIds(buyers, "buyer");
  uniqueIds(offers, "offer");
  return { title, currency, buyers, offers };
}

function validateBuyer(entry, index) {
  const prefix = `buyers[${index}]`;
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new ScenarioError(`${prefix} must be an object.`);
  if (!Array.isArray(entry.allowedVariants) || entry.allowedVariants.length < 1 || entry.allowedVariants.length > 12) {
    throw new ScenarioError(`${prefix}.allowedVariants must contain 1 to 12 values.`);
  }
  return {
    id: requiredText(entry.id, `${prefix}.id`, 24),
    label: requiredText(entry.label, `${prefix}.label`, 60),
    category: requiredText(entry.category, `${prefix}.category`, 60),
    quantity: integer(entry.quantity, `${prefix}.quantity`, 1, MAX_UNITS),
    maxUnitPrice: finite(entry.maxUnitPrice, `${prefix}.maxUnitPrice`, 0, 1_000_000),
    latestDeliveryDays: integer(entry.latestDeliveryDays, `${prefix}.latestDeliveryDays`, 0, 365),
    allowedVariants: [...new Set(entry.allowedVariants.map((value, variantIndex) => requiredText(value, `${prefix}.allowedVariants[${variantIndex}]`, 60)))]
  };
}

function validateOffer(entry, index) {
  const prefix = `offers[${index}]`;
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new ScenarioError(`${prefix} must be an object.`);
  const normalized = {
    id: requiredText(entry.id, `${prefix}.id`, 24),
    merchant: requiredText(entry.merchant, `${prefix}.merchant`, 60),
    category: requiredText(entry.category, `${prefix}.category`, 60),
    variant: requiredText(entry.variant, `${prefix}.variant`, 60),
    unitPrice: finite(entry.unitPrice, `${prefix}.unitPrice`, 0, 1_000_000),
    minimumUnits: integer(entry.minimumUnits, `${prefix}.minimumUnits`, 1, MAX_UNITS),
    deliveryDays: integer(entry.deliveryDays, `${prefix}.deliveryDays`, 0, 365),
    capacity: integer(entry.capacity, `${prefix}.capacity`, 1, MAX_UNITS),
    shippingPerBuyer: finite(entry.shippingPerBuyer, `${prefix}.shippingPerBuyer`, 0, 1_000_000)
  };
  if (entry.tiers !== undefined) {
    if (!Array.isArray(entry.tiers) || entry.tiers.length > MAX_TIERS) {
      throw new ScenarioError(`${prefix}.tiers must contain at most ${MAX_TIERS} entries.`);
    }
    let previousMinimum = normalized.minimumUnits;
    let previousPrice = normalized.unitPrice;
    normalized.tiers = entry.tiers.map((tier, tierIndex) => {
      const path = `${prefix}.tiers[${tierIndex}]`;
      if (!tier || typeof tier !== "object" || Array.isArray(tier)) throw new ScenarioError(`${path} must be an object.`);
      const minimumUnits = integer(tier.minimumUnits, `${path}.minimumUnits`, 1, normalized.capacity);
      const unitPrice = finite(tier.unitPrice, `${path}.unitPrice`, 0, 1_000_000);
      if (minimumUnits <= previousMinimum) throw new ScenarioError(`${path}.minimumUnits must increase above the previous minimum.`);
      if (unitPrice >= previousPrice) throw new ScenarioError(`${path}.unitPrice must decrease below the previous price.`);
      previousMinimum = minimumUnits;
      previousPrice = unitPrice;
      return { minimumUnits, unitPrice };
    });
  }
  return normalized;
}

function requiredText(value, path, maxLength) {
  if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > maxLength) {
    throw new ScenarioError(`${path} must be 1 to ${maxLength} characters.`);
  }
  return value.trim();
}

function finite(value, path, minimum, maximum) {
  if (typeof value !== "number" && (typeof value !== "string" || value.trim() === "" || /^0[box]/i.test(value.trim()))) {
    throw new ScenarioError(`${path} must be a number.`);
  }
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum) {
    throw new ScenarioError(`${path} must be between ${minimum} and ${maximum}.`);
  }
  return number;
}

function integer(value, path, minimum, maximum) {
  const number = finite(value, path, minimum, maximum);
  if (!Number.isInteger(number)) throw new ScenarioError(`${path} must be an integer.`);
  return number;
}

function uniqueIds(entries, label) {
  const ids = new Set();
  for (const entry of entries) {
    if (ids.has(entry.id)) throw new ScenarioError(`Duplicate ${label} id: ${entry.id}`);
    ids.add(entry.id);
  }
}

export function evaluateOffer(rawScenario, rawOffer) {
  const scenario = validateScenario(rawScenario);
  const offerEntry = typeof rawOffer === "string"
    ? scenario.offers.find(({ id }) => id === rawOffer)
    : validateOffer(rawOffer, 0);
  if (!offerEntry) throw new ScenarioError("Offer was not found.");

  const bands = [{ minimumUnits: offerEntry.minimumUnits, unitPrice: offerEntry.unitPrice }, ...(offerEntry.tiers ?? [])];
  const candidates = bands.map((band, index) => {
    const maximumUnits = Math.min(offerEntry.capacity, (bands[index + 1]?.minimumUnits ?? offerEntry.capacity + 1) - 1);
    const compatibility = scenario.buyers.map((entry) => ({
      buyer: entry,
      reasons: incompatibilityReasons(entry, { ...offerEntry, unitPrice: band.unitPrice })
    }));
    const compatible = compatibility.filter(({ reasons }) => reasons.length === 0).map(({ buyer }) => buyer);
    const selected = selectWholeBuyers(compatible, maximumUnits);
    const allocatedUnits = selected.reduce((sum, entry) => sum + entry.quantity, 0);
    return { ...band, index, maximumUnits, compatibility, compatible, selected, allocatedUnits, qualifies: allocatedUnits >= band.minimumUnits };
  });
  const feasible = candidates.filter(({ qualifies }) => qualifies);
  const active = feasible.sort((left, right) => right.allocatedUnits - left.allocatedUnits)[0] ?? candidates[0];
  const { compatibility, compatible, selected, unitPrice: evaluatedUnitPrice } = active;
  const compatibleUnits = compatible.reduce((sum, entry) => sum + entry.quantity, 0);
  const fulfilledUnits = selected.reduce((sum, entry) => sum + entry.quantity, 0);
  const qualifies = active.qualifies;
  const deliveredBuyers = qualifies ? selected.length : 0;
  const units = qualifies ? fulfilledUnits : 0;
  const totalCost = qualifies ? (units * evaluatedUnitPrice) + (deliveredBuyers * offerEntry.shippingPerBuyer) : 0;
  const reservationValue = qualifies
    ? selected.reduce((sum, entry) => sum + (entry.maxUnitPrice * entry.quantity), 0)
    : 0;
  const savings = Math.max(0, reservationValue - totalCost);
  const totalRequestedUnits = scenario.buyers.reduce((sum, entry) => sum + entry.quantity, 0);
  const selectedIds = new Set(selected.map(({ id }) => id));
  const allocations = qualifies ? selected.map((entry) => {
    const itemsCost = entry.quantity * evaluatedUnitPrice;
    const totalCost = itemsCost + offerEntry.shippingPerBuyer;
    const ceilingTotal = entry.quantity * entry.maxUnitPrice;
    return {
      buyerId: entry.id, quantity: entry.quantity, unitPrice: evaluatedUnitPrice,
      itemsCost, shippingCost: offerEntry.shippingPerBuyer, totalCost,
      landedUnitCost: totalCost / entry.quantity,
      ceilingTotal, headroom: ceilingTotal - totalCost,
      exceedsCeilingAfterShipping: totalCost > ceilingTotal
    };
  }) : [];
  const buyerOutcomes = compatibility.map(({ buyer, reasons }) => {
    if (reasons.length > 0) return { buyerId: buyer.id, status: "incompatible", reasons };
    if (!selectedIds.has(buyer.id)) return { buyerId: buyer.id, status: "capacity", reasons: ["capacity"] };
    return qualifies
      ? { buyerId: buyer.id, status: "included", reasons: [] }
      : { buyerId: buyer.id, status: "minimum", reasons: ["minimum"] };
  });

  return {
    offer: offerEntry,
    compatibleBuyerCount: compatible.length,
    compatibleUnits,
    selectedBuyerIds: qualifies ? selected.map(({ id }) => id) : [],
    buyerOutcomes,
    allocations,
    activeTierIndex: qualifies ? active.index : null,
    effectiveUnitPrice: qualifies ? evaluatedUnitPrice : null,
    basePriceDiscount: qualifies ? units * (offerEntry.unitPrice - evaluatedUnitPrice) : 0,
    tierProgress: candidates.map((candidate) => ({
      index: candidate.index,
      minimumUnits: candidate.minimumUnits,
      maximumUnits: candidate.maximumUnits,
      unitPrice: candidate.unitPrice,
      compatibleUnits: candidate.compatible.reduce((sum, entry) => sum + entry.quantity, 0),
      allocatedUnits: candidate.allocatedUnits,
      unitsShort: Math.max(0, candidate.minimumUnits - candidate.allocatedUnits),
      qualifies: candidate.qualifies,
      selected: qualifies && candidate.index === active.index
    })),
    deliveredBuyers,
    fulfilledUnits: units,
    qualifies,
    unitsShort: Math.max(0, offerEntry.minimumUnits - fulfilledUnits),
    totalCost,
    reservationValue,
    savings,
    averageLandedUnitCost: units > 0 ? totalCost / units : null,
    fulfillmentRate: totalRequestedUnits > 0 ? units / totalRequestedUnits : 0
  };
}

function incompatibilityReasons(buyer, offer) {
  const reasons = [];
  if (normalizeText(buyer.category) !== normalizeText(offer.category)) reasons.push("category");
  if (!buyer.allowedVariants.some((variant) => normalizeText(variant) === normalizeText(offer.variant))) reasons.push("variant");
  if (offer.unitPrice > buyer.maxUnitPrice) reasons.push("price");
  if (offer.deliveryDays > buyer.latestDeliveryDays) reasons.push("delivery");
  return reasons;
}

function selectWholeBuyers(compatible, capacity) {
  const ordered = [...compatible].sort((left, right) => compareText(left.id, right.id));
  const states = new Map([[0, null]]);
  for (const entry of ordered) {
    const previousStates = [...states.entries()];
    for (const [units, parent] of previousStates) {
      const nextUnits = units + entry.quantity;
      if (nextUnits <= capacity && !states.has(nextUnits)) {
        states.set(nextUnits, { parent, entry });
      }
    }
  }
  const bestUnits = Math.max(...states.keys());
  const selected = [];
  let node = states.get(bestUnits);
  while (node) {
    selected.push(node.entry);
    node = node.parent;
  }
  return selected.reverse();
}

function normalizeText(value) {
  return value.trim().toLowerCase();
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function evaluateMarket(rawScenario) {
  const scenario = validateScenario(rawScenario);
  const results = scenario.offers.map((entry) => evaluateOffer(scenario, entry));
  const ranked = [...results].sort(compareResults);
  const winner = ranked.find(({ qualifies }) => qualifies) ?? null;
  const totalRequestedUnits = scenario.buyers.reduce((sum, entry) => sum + entry.quantity, 0);
  return {
    scenario,
    results,
    ranked,
    winner,
    totalRequestedUnits,
    buyerCount: scenario.buyers.length,
    categoryCount: new Set(scenario.buyers.map(({ category }) => normalizeText(category))).size
  };
}

function compareResults(left, right) {
  if (left.qualifies !== right.qualifies) return left.qualifies ? -1 : 1;
  return right.fulfilledUnits - left.fulfilledUnits
    || right.savings - left.savings
    || right.deliveredBuyers - left.deliveredBuyers
    || left.totalCost - right.totalCost
    || compareText(left.offer.id, right.offer.id);
}

export function aggregateDemand(rawScenario) {
  const scenario = validateScenario(rawScenario);
  const groups = new Map();
  for (const entry of scenario.buyers) {
    const key = normalizeText(entry.category);
    const current = groups.get(key) ?? {
      category: entry.category,
      buyerCount: 0,
      units: 0,
      priceFloor: Infinity,
      priceCeiling: -Infinity,
      earliestDelivery: Infinity,
      latestDelivery: -Infinity,
      variants: new Map()
    };
    current.buyerCount += 1;
    current.units += entry.quantity;
    current.priceFloor = Math.min(current.priceFloor, entry.maxUnitPrice);
    current.priceCeiling = Math.max(current.priceCeiling, entry.maxUnitPrice);
    current.earliestDelivery = Math.min(current.earliestDelivery, entry.latestDeliveryDays);
    current.latestDelivery = Math.max(current.latestDelivery, entry.latestDeliveryDays);
    entry.allowedVariants.forEach((variant) => {
      const key = normalizeText(variant);
      if (!current.variants.has(key)) current.variants.set(key, variant);
    });
    groups.set(key, current);
  }
  return [...groups.values()].map((group) => ({ ...group, variants: [...group.variants.values()].sort() }));
}

export function encodeScenario(rawScenario) {
  const scenario = validateScenario(rawScenario);
  const bytes = new TextEncoder().encode(JSON.stringify(scenario));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const encoded = btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  if (encoded.length > MAX_SHARE_LENGTH) throw new ScenarioError("This scenario is too large for a share link. Export JSON instead.");
  return encoded;
}

export function decodeScenario(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_SHARE_LENGTH) throw new ScenarioError("Shared scenario is empty or too large.");
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  try {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return validateScenario(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
  } catch (error) {
    if (error instanceof ScenarioError) throw error;
    throw new ScenarioError("Shared scenario could not be decoded.");
  }
}
