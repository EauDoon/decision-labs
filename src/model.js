const MAX_BUYERS = 40;
const MAX_OFFERS = 40;
const MAX_UNITS = 5000;
const MAX_TIERS = 8;
const MAX_SHARE_LENGTH = 60_000;
const SCENARIO_FIELDS = ["title", "currency", "buyers", "offers"];
const BUYER_FIELDS = ["id", "label", "category", "quantity", "maxUnitPrice", "latestDeliveryDays", "allowedVariants"];
const OFFER_FIELDS = ["id", "merchant", "category", "variant", "unitPrice", "minimumUnits", "deliveryDays", "capacity", "shippingPerBuyer", "tiers"];
const TIER_FIELDS = ["minimumUnits", "unitPrice"];

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
  rejectUnknownFields(candidate, SCENARIO_FIELDS, "Scenario");
  const title = requiredText(own(candidate, "title"), "Room name", 80);
  const currency = requiredText(own(candidate, "currency"), "Currency", 3);
  if (!/^[A-Za-z]{3}$/.test(currency)) throw new ScenarioError("Currency must be a three-letter ASCII code, such as AUD.");
  const buyers = own(candidate, "buyers");
  const offers = own(candidate, "offers");
  if (!Array.isArray(buyers) || buyers.length < 1 || buyers.length > MAX_BUYERS) {
    throw new ScenarioError(`Buyers must contain 1 to ${MAX_BUYERS} entries.`);
  }
  if (!Array.isArray(offers) || offers.length < 1 || offers.length > MAX_OFFERS) {
    throw new ScenarioError(`Offers must contain 1 to ${MAX_OFFERS} entries.`);
  }
  const normalizedBuyers = buyers.map((entry, index) => validateBuyer(entry, index));
  const normalizedOffers = offers.map((entry, index) => validateOffer(entry, index));
  uniqueIds(normalizedBuyers, "buyer");
  uniqueIds(normalizedOffers, "offer");
  return { title, currency: currency.toUpperCase(), buyers: normalizedBuyers, offers: normalizedOffers };
}

function validateBuyer(entry, index) {
  const prefix = named("Buyer", index);
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new ScenarioError(`${prefix} must be an object.`);
  rejectUnknownFields(entry, BUYER_FIELDS, prefix);
  const allowedVariants = own(entry, "allowedVariants");
  if (!Array.isArray(allowedVariants) || allowedVariants.length < 1 || allowedVariants.length > 12) {
    throw new ScenarioError(`${prefix} accepted variants must contain 1 to 12 names.`);
  }
  return {
    id: requiredText(own(entry, "id"), `${prefix} id`, 24),
    label: requiredText(own(entry, "label"), `${prefix} private label`, 60),
    category: requiredText(own(entry, "category"), `${prefix} category`, 60),
    quantity: integer(own(entry, "quantity"), `${prefix} quantity`, 1, MAX_UNITS),
    maxUnitPrice: finite(own(entry, "maxUnitPrice"), `${prefix} max item price`, 0, 1_000_000),
    latestDeliveryDays: integer(own(entry, "latestDeliveryDays"), `${prefix} delivery limit`, 0, 365),
    allowedVariants: [...new Set(allowedVariants.map((value, variantIndex) => requiredText(value, `${prefix} variant ${variantIndex + 1}`, 60)))]
  };
}

function validateOffer(entry, index) {
  const prefix = named("Offer", index);
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new ScenarioError(`${prefix} must be an object.`);
  rejectUnknownFields(entry, OFFER_FIELDS, prefix);
  const normalized = {
    id: requiredText(own(entry, "id"), `${prefix} id`, 24),
    merchant: requiredText(own(entry, "merchant"), `${prefix} merchant`, 60),
    category: requiredText(own(entry, "category"), `${prefix} category`, 60),
    variant: requiredText(own(entry, "variant"), `${prefix} variant`, 60),
    unitPrice: finite(own(entry, "unitPrice"), `${prefix} unit price`, 0, 1_000_000),
    minimumUnits: integer(own(entry, "minimumUnits"), `${prefix} minimum`, 1, MAX_UNITS),
    deliveryDays: integer(own(entry, "deliveryDays"), `${prefix} delivery`, 0, 365),
    capacity: integer(own(entry, "capacity"), `${prefix} capacity`, 1, MAX_UNITS),
    shippingPerBuyer: finite(own(entry, "shippingPerBuyer"), `${prefix} shipping`, 0, 1_000_000)
  };
  const tiers = own(entry, "tiers");
  if (tiers !== undefined) {
    if (!Array.isArray(tiers) || tiers.length > MAX_TIERS) {
      throw new ScenarioError(`${prefix} price tiers must contain at most ${MAX_TIERS} entries.`);
    }
    let previousMinimum = normalized.minimumUnits;
    let previousPrice = normalized.unitPrice;
    normalized.tiers = tiers.map((tier, tierIndex) => {
      const path = `${prefix} tier ${tierIndex + 1}`;
      if (!tier || typeof tier !== "object" || Array.isArray(tier)) throw new ScenarioError(`${path} must be an object.`);
      rejectUnknownFields(tier, TIER_FIELDS, path);
      const minimumUnits = integer(own(tier, "minimumUnits"), `${path} minimum units`, 1, normalized.capacity);
      const unitPrice = finite(own(tier, "unitPrice"), `${path} unit price`, 0, 1_000_000);
      if (minimumUnits <= previousMinimum) throw new ScenarioError(`${path} minimum units must increase above the previous minimum.`);
      if (unitPrice >= previousPrice) throw new ScenarioError(`${path} unit price must decrease below the previous price.`);
      previousMinimum = minimumUnits;
      previousPrice = unitPrice;
      return { minimumUnits, unitPrice };
    });
  }
  return normalized;
}

function named(kind, index) {
  return `${kind} ${index + 1}`;
}

function own(entry, key) {
  return Object.hasOwn(entry, key) ? entry[key] : undefined;
}

function rejectUnknownFields(entry, allowed, path) {
  const allowedFields = new Set(allowed);
  for (const key of Object.keys(entry)) {
    if (!allowedFields.has(key)) {
      throw new ScenarioError(`${path} has unexpected field: ${key}.`);
    }
  }
}

function requiredText(value, path, maxLength) {
  if (typeof value !== "string") {
    throw new ScenarioError(`${path} must be 1 to ${maxLength} characters.`);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) throw new ScenarioError(`${path} cannot be empty.`);
  if (trimmed.length > maxLength) throw new ScenarioError(`${path} must be 1 to ${maxLength} characters.`);
  return trimmed;
}

function finite(value, path, minimum, maximum) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") throw new ScenarioError(`${path} cannot be empty.`);
    if (/^0[box]/i.test(trimmed) || /[eE+]/.test(trimmed)) {
      throw new ScenarioError(`${path} must be a number.`);
    }
    value = Number(trimmed);
  } else if (typeof value !== "number") {
    throw new ScenarioError(`${path} must be a number.`);
  }
  if (!Number.isFinite(value)) throw new ScenarioError(`${path} must be a number.`);
  if (value < minimum || value > maximum) {
    throw new ScenarioError(`${path} must be between ${minimum} and ${maximum}.`);
  }
  return value;
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
  return value.trim().toLowerCase().normalize("NFC");
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
  if (typeof value !== "string") throw new ScenarioError("Shared scenario must be a string.");
  if (value.length === 0 || value.length > MAX_SHARE_LENGTH) throw new ScenarioError("Shared scenario is empty or too large.");
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  let binary;
  try {
    binary = atob(padded);
  } catch {
    throw new ScenarioError("Shared scenario is not valid base64.");
  }
  let text;
  try {
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ScenarioError("Shared scenario is not valid UTF-8.");
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new ScenarioError(`Shared scenario is not valid JSON${jsonSyntaxHint(error)}.`);
  }
  return validateScenario(parsed);
}

function jsonSyntaxHint(error) {
  const message = String(error?.message ?? "").replace(/\s+/g, " ").trim();
  if (!message) return "";
  const lineColumn = message.match(/line (\d+)(?: column (\d+))?/i);
  if (lineColumn?.[2]) return ` (line ${lineColumn[1]}, column ${lineColumn[2]})`;
  if (lineColumn) return ` (line ${lineColumn[1]})`;
  const position = message.match(/position (\d+)/i);
  if (position) return ` (at position ${position[1]})`;
  return ` (${message})`;
}
