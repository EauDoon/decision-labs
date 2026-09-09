const MAX_BUYERS = 40;
const MAX_OFFERS = 40;
const MAX_UNITS = 5000;
const MAX_TIERS = 8;
const MAX_SHARE_LENGTH = 60_000;
const SCENARIO_FIELDS = ["title", "currency", "buyers", "offers"];
const BUYER_FIELDS = ["id", "label", "category", "quantity", "maxUnitPrice", "maxOrderTotal", "latestDeliveryDays", "allowedVariants"];
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

/** Bounded, detached valid states. A new edit after undo clears the redo branch. */
export function createScenarioHistory(initial) {
  const entries = [JSON.stringify(validateScenario(initial))];
  let cursor = 0;
  return {
    record(value) {
      const next = JSON.stringify(validateScenario(value));
      if (entries[cursor] === next) return;
      entries.splice(cursor + 1);
      entries.push(next);
      if (entries.length > 50) entries.shift();
      cursor = entries.length - 1;
    },
    get canUndo() { return cursor > 0; },
    get canRedo() { return cursor < entries.length - 1; },
    current() { return JSON.parse(entries[cursor]); },
    undo() { if (cursor > 0) cursor--; return this.current(); },
    redo() { if (cursor < entries.length - 1) cursor++; return this.current(); }
  };
}

export function validateWorkspace(candidate) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate) || own(candidate, "version") !== 1 || !Array.isArray(own(candidate, "rooms")) || candidate.rooms.length > 12) {
    throw new ScenarioError("Workspace must contain version 1 and at most 12 saved rooms.");
  }
  rejectUnknownFields(candidate, ["version", "rooms"], "Workspace");
  return { version: 1, rooms: candidate.rooms.map(validateScenario) };
}

export function duplicateEntry(rawScenario, kind, id) {
  const clean = validateScenario(rawScenario);
  if (!["buyers", "offers"].includes(kind)) throw new ScenarioError("Choose buyers or offers to duplicate.");
  const entries = clean[kind];
  if (entries.length >= 40) throw new ScenarioError("A room can have at most 40 entries of each kind.");
  const original = entries.find((entry) => entry.id === id);
  if (!original) throw new ScenarioError("The entry to duplicate was not found.");
  let number = 1;
  const prefix = kind === "buyers" ? "B" : "O";
  while (entries.some((entry) => entry.id === `${prefix}${String(number).padStart(2, "0")}`)) number++;
  const copy = JSON.parse(JSON.stringify(original));
  copy.id = `${prefix}${String(number).padStart(2, "0")}`;
  const label = kind === "buyers" ? "label" : "merchant";
  copy[label] = `${copy[label].slice(0, 53)} (copy)`;
  entries.push(copy);
  return clean;
}

export function compareScenarios(before, after) {
  const baseline = evaluateMarket(before);
  const current = evaluateMarket(after);
  const sameCurrency = baseline.scenario.currency === current.scenario.currency;
  const metrics = (market) => ({
    requested: market.totalRequestedUnits,
    fulfilled: market.winner?.fulfilledUnits ?? 0,
    buyers: market.winner?.deliveredBuyers ?? 0,
    cost: market.winner?.totalCost ?? null,
    winner: market.winner?.offer.merchant ?? "No qualifying offer"
  });
  return { baseline: metrics(baseline), current: metrics(current), sameCurrency,
    sameDemand: JSON.stringify(baseline.scenario.buyers) === JSON.stringify(current.scenario.buyers) };
}

/** Explicit public projection: never serialize a Scenario or evaluation wholesale. */
export function createMerchantReport(rawScenario) {
  const market = evaluateMarket(rawScenario);
  return {
    report: "Common Cart aggregate merchant report", version: 1, currency: market.scenario.currency,
    limitations: "Synthetic simulation, not a quote or purchase. Aggregate counts can disclose information about small groups. Buyer identities, budgets and allocations are omitted.",
    requestedUnits: market.totalRequestedUnits, buyerCount: market.buyerCount,
    offers: market.ranked.map(result => ({
      merchant: result.offer.merchant, category: result.offer.category, variant: result.offer.variant,
      status: result.qualifies ? "Unlocked" : "Locked", fulfilledUnits: result.fulfilledUnits,
      includedBuyerCount: result.deliveredBuyers, itemPrice: result.effectiveUnitPrice,
      landedTotal: result.qualifies ? result.totalCost : null, deliveryDays: result.offer.deliveryDays
    }))
  };
}

export function createBuyerCsv(rawScenario, offerId) {
  const market = evaluateMarket(rawScenario);
  const result = market.results.find(entry => entry.offer.id === offerId);
  if (!result) throw new ScenarioError("Select an existing offer for the buyer report.");
  const allocations = new Map(result.allocations.map(entry => [entry.buyerId, entry]));
  const rows = [["Private buyer label", "Offer", "Currency", "Requested quantity", "Outcome", "Reasons", "Allocated quantity", "Items cost", "Shipping", "Order total", "Delivery days"]];
  for (const outcome of result.buyerOutcomes) {
    const buyer = market.scenario.buyers.find(entry => entry.id === outcome.buyerId);
    const allocation = allocations.get(outcome.buyerId);
    rows.push([buyer.label, result.offer.merchant, market.scenario.currency, buyer.quantity, outcome.status, outcome.reasons.join("; "), allocation?.quantity ?? 0, allocation?.itemsCost ?? "", allocation?.shippingCost ?? "", allocation?.totalCost ?? "", result.offer.deliveryDays]);
  }
  return rows.map(row => row.map(escapeCsvCell).join(",")).join("\r\n") + "\r\n";
}

const BUYER_CSV_HEADERS = {
  label: "label",
  "private label": "label",
  "private buyer label": "label",
  buyer: "label",
  category: "category",
  quantity: "quantity",
  qty: "quantity",
  "max unit price": "maxUnitPrice",
  "max item price": "maxUnitPrice",
  "latest delivery days": "latestDeliveryDays",
  "delivery by": "latestDeliveryDays",
  variants: "allowedVariants",
  "max order total": "maxOrderTotal"
};

const REQUIRED_BUYER_CSV_FIELDS = ["label", "category", "quantity", "maxUnitPrice", "latestDeliveryDays", "allowedVariants"];

function spreadsheetUnsafe(text) {
  return /^[\s\u0000-\u001f]*[=+@-]/u.test(text) || /^[\t\r\n]/u.test(text);
}

function escapeCsvCell(value) {
  let text = typeof value === "number" ? String(Math.round(value * 1e8) / 1e8) : String(value);
  if (typeof value === "string" && spreadsheetUnsafe(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function neutralizeSpreadsheetCell(value) {
  if (typeof value !== "string") return value;
  if (value.startsWith("'") && spreadsheetUnsafe(value.slice(1))) return value.slice(1);
  return value;
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/u, "");
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (character !== "\r") {
      cell += character;
    }
  }
  if (quoted) throw new ScenarioError("Buyer CSV has an unclosed quote.");
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((entry) => entry.some((value) => value.trim() !== ""));
}

export function parseBuyerCsv(text) {
  if (typeof text !== "string") throw new ScenarioError("Buyer CSV must be text.");
  if (text.trim() === "") throw new ScenarioError("Buyer CSV is empty.");
  const rows = parseCsvRows(text);
  if (rows.length < 2) throw new ScenarioError("Buyer CSV needs a header row and at least one buyer.");
  const header = rows[0].map((value) => neutralizeSpreadsheetCell(value).trim().toLowerCase().replaceAll("_", " "));
  const columns = header.map((name) => BUYER_CSV_HEADERS[name] ?? null);
  if (columns.some((field) => field === null)) {
    const unknown = rows[0].filter((_, index) => columns[index] === null).map((value) => value.trim() || "(empty)");
    throw new ScenarioError(`Buyer CSV has unknown column: ${unknown[0]}.`);
  }
  for (const required of REQUIRED_BUYER_CSV_FIELDS) {
    if (!columns.includes(required)) {
      throw new ScenarioError("Buyer CSV must include label, category, quantity, max unit price, latest delivery days, and variants.");
    }
  }
  const dataRows = rows.slice(1);
  if (dataRows.length > MAX_BUYERS) throw new ScenarioError(`Buyers must contain 1 to ${MAX_BUYERS} entries.`);
  return dataRows.map((row, index) => {
    const prefix = `CSV buyer ${index + 1}`;
    const record = {};
    for (const [columnIndex, field] of columns.entries()) {
      if (!field) continue;
      record[field] = neutralizeSpreadsheetCell(row[columnIndex] ?? "");
    }
    const variants = String(record.allowedVariants ?? "").split(",").map((value) => value.trim()).filter(Boolean);
    const buyer = {
      id: `B${String(index + 1).padStart(2, "0")}`,
      label: record.label,
      category: record.category,
      quantity: record.quantity,
      maxUnitPrice: record.maxUnitPrice,
      latestDeliveryDays: record.latestDeliveryDays,
      allowedVariants: variants
    };
    const total = String(record.maxOrderTotal ?? "").trim();
    if (total !== "") buyer.maxOrderTotal = record.maxOrderTotal;
    try {
      return validateBuyer(buyer, index);
    } catch (error) {
      throw new ScenarioError(`${prefix}: ${error.message.replace(/^Buyer \d+\s/u, "")}`);
    }
  });
}

export function importBuyersFromCsv(rawScenario, text) {
  const scenario = validateScenario(rawScenario);
  const buyers = parseBuyerCsv(text);
  if (buyers.length < 1) throw new ScenarioError("Buyer CSV needs a header row and at least one buyer.");
  return validateScenario({ ...scenario, buyers });
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
    ...(own(entry, "maxOrderTotal") === undefined ? {} : { maxOrderTotal: finite(own(entry, "maxOrderTotal"), `${prefix} maximum order total`, 0, 5_001_000_000) }),
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
  if (buyer.maxOrderTotal !== undefined && (offer.unitPrice * buyer.quantity + offer.shippingPerBuyer - buyer.maxOrderTotal) > Number.EPSILON * Math.max(1, offer.unitPrice * buyer.quantity + offer.shippingPerBuyer, buyer.maxOrderTotal) * 4) reasons.push("budget");
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

const RESIDUAL_PLANNING_NOTE = "Planning aid only. Residual fill is not a dual checkout, split invoice, or second purchase. Each offer is still a separate whole-order match on leftover buyers.";

function coverageOfferSummary(result) {
  return {
    offerId: result.offer.id,
    merchant: result.offer.merchant,
    category: result.offer.category,
    variant: result.offer.variant,
    fulfilledUnits: result.fulfilledUnits,
    deliveredBuyers: result.deliveredBuyers,
    totalCost: result.totalCost
  };
}

/**
 * After the winning offer is chosen, leftover whole-buyer demand may be filled
 * by the next-best other offer using the same exact allocator. A buyer's quantity
 * is never split across offers.
 */
export function computeResidualCoverage(rawScenario) {
  const market = evaluateMarket(rawScenario);
  if (!market.winner) {
    return {
      planningAid: true,
      note: RESIDUAL_PLANNING_NOTE,
      primary: null,
      secondary: null,
      leftoverBuyerCount: market.buyerCount,
      leftoverUnits: market.totalRequestedUnits,
      leftoverBuyerIds: market.scenario.buyers.map(({ id }) => id),
      unfilledBuyerCount: market.buyerCount,
      unfilledUnits: market.totalRequestedUnits
    };
  }
  const taken = new Set(market.winner.selectedBuyerIds);
  const leftoverBuyers = market.scenario.buyers.filter((buyer) => !taken.has(buyer.id));
  const leftoverUnits = leftoverBuyers.reduce((sum, buyer) => sum + buyer.quantity, 0);
  const leftoverBuyerIds = leftoverBuyers.map(({ id }) => id);
  const otherOffers = market.scenario.offers.filter((offer) => offer.id !== market.winner.offer.id);
  const primary = coverageOfferSummary(market.winner);
  if (leftoverBuyers.length === 0 || otherOffers.length === 0) {
    return {
      planningAid: true,
      note: RESIDUAL_PLANNING_NOTE,
      primary,
      secondary: null,
      leftoverBuyerCount: leftoverBuyers.length,
      leftoverUnits,
      leftoverBuyerIds,
      unfilledBuyerCount: leftoverBuyers.length,
      unfilledUnits: leftoverUnits
    };
  }
  const residual = evaluateMarket({
    title: market.scenario.title,
    currency: market.scenario.currency,
    buyers: leftoverBuyers,
    offers: otherOffers
  });
  const secondary = residual.winner ? coverageOfferSummary(residual.winner) : null;
  if (secondary) {
    secondary.selectedBuyerIds = residual.winner.selectedBuyerIds;
  }
  const secondaryTaken = new Set(residual.winner?.selectedBuyerIds ?? []);
  const unfilledBuyers = leftoverBuyers.filter((buyer) => !secondaryTaken.has(buyer.id));
  return {
    planningAid: true,
    note: RESIDUAL_PLANNING_NOTE,
    primary,
    secondary,
    leftoverBuyerCount: leftoverBuyers.length,
    leftoverUnits,
    leftoverBuyerIds,
    unfilledBuyerCount: unfilledBuyers.length,
    unfilledUnits: unfilledBuyers.reduce((sum, buyer) => sum + buyer.quantity, 0)
  };
}

/**
 * Additional whole units needed to unlock the next cheaper quantity band
 * for one offer, or an explicit reason the band is unreachable.
 */
export function unitsToNextTier(rawScenario, offerId) {
  const scenario = validateScenario(rawScenario);
  const result = evaluateOffer(scenario, offerId);
  const selectedIndex = result.activeTierIndex ?? 0;
  const next = result.tierProgress.find((tier) => tier.index === selectedIndex + 1);
  const emptySuppliers = { supplierBuyerIds: [], supplierBuyerCount: 0, supplierUnits: 0 };
  const base = {
    offerId: result.offer.id,
    merchant: result.offer.merchant,
    currentUnits: result.fulfilledUnits,
    currentTierIndex: result.activeTierIndex,
    nextMinimum: next?.minimumUnits ?? null,
    nextPrice: next?.unitPrice ?? null,
    compatibleUnitsAtNext: next?.compatibleUnits ?? null,
    allocatedUnitsAtNext: next?.allocatedUnits ?? null,
    unitsNeeded: null,
    reachable: false,
    reason: "",
    ...emptySuppliers
  };
  if (!next) {
    return {
      ...base,
      reason: result.tierProgress.length <= 1
        ? "No cheaper quantity tier is declared."
        : "No cheaper quantity tier remains after the selected band."
    };
  }
  if (next.minimumUnits > result.offer.capacity) {
    return { ...base, reason: "The next cheaper tier's minimum exceeds this offer's capacity." };
  }
  const currentIds = new Set(result.selectedBuyerIds);
  const suppliers = scenario.buyers.filter((buyer) => {
    if (currentIds.has(buyer.id)) return false;
    return incompatibilityReasons(buyer, { ...result.offer, unitPrice: next.unitPrice }).length === 0;
  });
  const supplierUnits = suppliers.reduce((sum, buyer) => sum + buyer.quantity, 0);
  const supplierFields = {
    supplierBuyerIds: suppliers.map((buyer) => buyer.id),
    supplierBuyerCount: suppliers.length,
    supplierUnits
  };
  const unitsNeeded = next.unitsShort;
  if (next.qualifies) {
    return {
      ...base,
      ...supplierFields,
      unitsNeeded: 0,
      reachable: true,
      reason: "The cheaper band already fits a whole-order cohort. The allocator kept the larger current cohort."
    };
  }
  const packingBlocked = next.compatibleUnits >= next.minimumUnits && next.allocatedUnits < next.minimumUnits;
  return {
    ...base,
    ...supplierFields,
    unitsNeeded,
    reachable: false,
    reason: packingBlocked
      ? "Compatible demand exists, but whole orders cannot pack into the next cheaper band inside capacity."
      : "Compatible whole-order demand cannot reach the next cheaper tier."
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
