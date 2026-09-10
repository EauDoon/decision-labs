const MAX_BUYERS = 40;
const MAX_OFFERS = 40;
const MAX_UNITS = 5000;
const MAX_TIERS = 8;
const MAX_SHARE_LENGTH = 60_000;
const SCENARIO_FIELDS = ["title", "currency", "buyers", "offers"];
const BUYER_FIELDS = ["id", "label", "category", "quantity", "maxUnitPrice", "maxOrderTotal", "latestDeliveryDays", "allowedVariants"];
const OFFER_FIELDS = ["id", "merchant", "category", "variant", "unitPrice", "minimumUnits", "deliveryDays", "capacity", "shippingPerBuyer", "tiers", "fulfillment"];
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
  },
  officePantry: {
    title: "Office pantry bulk",
    currency: "AUD",
    buyers: [
      buyer("B01", "Floor three kitchen", "Office pantry crate", 6, 38, 5, ["Sweet snack", "Savoury snack"]),
      buyer("B02", "Design studio", "Office pantry crate", 8, 34, 4, ["Savoury snack"]),
      buyer("B03", "Support pod", "Office pantry crate", 5, 40, 6, ["Sweet snack"]),
      buyer("B04", "Night shift", "Office pantry crate", 7, 36, 5, ["Sweet snack", "Savoury snack"]),
      buyer("B05", "Front desk", "Office pantry crate", 4, 32, 3, ["Savoury snack"])
    ],
    offers: [
      offer("O01", "DeskBite Supply", "Office pantry crate", "Savoury snack", 28, 12, 4, 30, 2),
      offer("O02", "Sweet Locker", "Office pantry crate", "Sweet snack", 30, 8, 5, 24, 1.5),
      { ...offer("O03", "Campus Crate Co", "Office pantry crate", "Savoury snack", 32, 10, 6, 40, 0), fulfillment: "pickup" }
    ]
  },
  hardware: {
    title: "Hardware tools bulk",
    currency: "AUD",
    buyers: [
      buyer("B01", "Joinery bay", "Hand tool kit", 3, 190, 10, ["Metric", "Imperial"]),
      buyer("B02", "Site trailer", "Hand tool kit", 5, 175, 8, ["Metric"]),
      buyer("B03", "Repair bench", "Hand tool kit", 4, 210, 12, ["Imperial"]),
      buyer("B04", "Apprentice shop", "Hand tool kit", 6, 180, 9, ["Metric", "Imperial"]),
      buyer("B05", "Mobile crew", "Hand tool kit", 2, 165, 7, ["Metric"])
    ],
    offers: [
      offer("O01", "Forge & Co", "Hand tool kit", "Metric", 148, 10, 8, 20, 12),
      offer("O02", "Inch Works", "Hand tool kit", "Imperial", 156, 6, 10, 12, 10),
      { ...offer("O03", "Yard Pickup Tools", "Hand tool kit", "Metric", 142, 12, 6, 24, 18), fulfillment: "pickup", tiers: [{ minimumUnits: 16, unitPrice: 130 }] }
    ]
  },
  garden: {
    title: "Community garden bulk seed",
    currency: "AUD",
    buyers: [
      buyer("B01", "Plot twelve", "Garden seed pack", 4, 22, 10, ["Heirloom tomato", "Cover crop"]),
      buyer("B02", "Allotment row", "Garden seed pack", 8, 18, 8, ["Cover crop"]),
      buyer("B03", "School beds", "Garden seed pack", 6, 24, 12, ["Heirloom tomato", "Potting soil"]),
      buyer("B04", "Commons plot", "Garden seed pack", 10, 20, 9, ["Cover crop", "Potting soil"]),
      buyer("B05", "Raised beds", "Garden seed pack", 3, 16, 6, ["Potting soil"]),
      buyer("B06", "Volunteer crew", "Garden seed pack", 5, 21, 11, ["Heirloom tomato", "Cover crop", "Potting soil"])
    ],
    offers: [
      offer("O01", "Seed Share Co", "Garden seed pack", "Cover crop", 14, 12, 7, 30, 2),
      offer("O02", "Heirloom Packet", "Garden seed pack", "Heirloom tomato", 16, 8, 9, 20, 1.5),
      { ...offer("O03", "Soil Yard Pickup", "Garden seed pack", "Potting soil", 12, 10, 5, 24, 8), fulfillment: "pickup" }
    ]
  },
  schoolFete: {
    title: "School fete catering",
    currency: "AUD",
    buyers: [
      buyer("B01", "Year three stall", "Fete catering pack", 12, 18, 6, ["Sausage sizzle", "Cake stall"]),
      buyer("B02", "Cake stall crew", "Fete catering pack", 8, 16, 5, ["Cake stall"]),
      buyer("B03", "Drinks tent", "Fete catering pack", 10, 20, 7, ["Drinks cooler"]),
      buyer("B04", "P and C kitchen", "Fete catering pack", 16, 17, 6, ["Sausage sizzle", "Drinks cooler"]),
      buyer("B05", "Second-hand stall", "Fete catering pack", 6, 15, 4, ["Cake stall", "Drinks cooler"]),
      buyer("B06", "Sports tent", "Fete catering pack", 9, 19, 8, ["Sausage sizzle"])
    ],
    offers: [
      offer("O01", "Sizzle Supply Co", "Fete catering pack", "Sausage sizzle", 12, 18, 4, 40, 2),
      offer("O02", "Bake Share", "Fete catering pack", "Cake stall", 14, 10, 5, 24, 1.5),
      { ...offer("O03", "Hall Pickup Drinks", "Fete catering pack", "Drinks cooler", 11, 12, 3, 30, 6), fulfillment: "pickup" }
    ]
  },
  officeFruit: {
    title: "Office fruit box",
    currency: "AUD",
    buyers: [
      buyer("B01", "Floor kitchen", "Office fruit crate", 6, 22, 5, ["Citrus mix", "Mixed seasonal"]),
      buyer("B02", "Design studio", "Office fruit crate", 8, 18, 4, ["Apple crate"]),
      buyer("B03", "Support pod", "Office fruit crate", 5, 24, 6, ["Citrus mix"]),
      buyer("B04", "Night shift", "Office fruit crate", 7, 20, 5, ["Citrus mix", "Apple crate"]),
      buyer("B05", "Front desk", "Office fruit crate", 4, 16, 3, ["Mixed seasonal"]),
      buyer("B06", "Boardroom", "Office fruit crate", 9, 21, 7, ["Apple crate", "Mixed seasonal"])
    ],
    offers: [
      offer("O01", "Citrus Cart Co", "Office fruit crate", "Citrus mix", 14, 10, 4, 30, 2),
      offer("O02", "Apple Share", "Office fruit crate", "Apple crate", 15, 8, 5, 24, 1.5),
      { ...offer("O03", "Lobby Fruit Pickup", "Office fruit crate", "Mixed seasonal", 13, 12, 3, 28, 6), fulfillment: "pickup" }
    ]
  },
  libraryPaper: {
    title: "Library photocopy paper",
    currency: "AUD",
    buyers: [
      buyer("B01", "Main desk", "Photocopy paper ream", 10, 8, 7, ["A4 80gsm", "Recycled A4"]),
      buyer("B02", "Study carrels", "Photocopy paper ream", 16, 7, 5, ["A4 80gsm"]),
      buyer("B03", "Periodicals", "Photocopy paper ream", 6, 12, 10, ["A3 80gsm"]),
      buyer("B04", "Children wing", "Photocopy paper ream", 12, 9, 8, ["A4 80gsm", "A3 80gsm"]),
      buyer("B05", "Local history", "Photocopy paper ream", 8, 6, 4, ["Recycled A4"]),
      buyer("B06", "Branch annex", "Photocopy paper ream", 14, 8, 9, ["A4 80gsm", "Recycled A4"])
    ],
    offers: [
      offer("O01", "Desk Delivery Paper", "Photocopy paper ream", "A4 80gsm", 5.5, 20, 4, 50, 2),
      offer("O02", "Wide Format Supply", "Photocopy paper ream", "A3 80gsm", 9, 8, 6, 24, 3),
      { ...offer("O03", "Lobby Paper Pickup", "Photocopy paper ream", "Recycled A4", 5, 12, 2, 40, 4), fulfillment: "pickup" }
    ]
  },
  sportsKit: {
    title: "Sports club match-day kit",
    currency: "AUD",
    buyers: [
      buyer("B01", "Firsts squad", "Match-day kit pack", 8, 42, 6, ["Club jersey", "Training shorts"]),
      buyer("B02", "Reserves bench", "Match-day kit pack", 6, 36, 5, ["Club jersey"]),
      buyer("B03", "Juniors pack", "Match-day kit pack", 10, 28, 7, ["Training shorts"]),
      buyer("B04", "Touchline crew", "Match-day kit pack", 5, 24, 4, ["Water crate"]),
      buyer("B05", "Away strip", "Match-day kit pack", 7, 40, 8, ["Club jersey", "Water crate"]),
      buyer("B06", "Training group", "Match-day kit pack", 4, 22, 3, ["Training shorts", "Water crate"])
    ],
    offers: [
      offer("O01", "Field Kit Delivery", "Match-day kit pack", "Club jersey", 28, 12, 5, 40, 4),
      offer("O02", "Pitch Shorts Co", "Match-day kit pack", "Training shorts", 18, 10, 6, 24, 2),
      { ...offer("O03", "Clubhouse Kit Pickup", "Match-day kit pack", "Water crate", 14, 6, 2, 20, 8), fulfillment: "pickup" }
    ]
  },
  surfFirstAid: {
    title: "Surf club first-aid kit",
    currency: "AUD",
    buyers: [
      buyer("B01", "Patrol shed", "Surf first-aid kit", 6, 18, 7, ["Crepe bandage", "Ice pack"]),
      buyer("B02", "Nippers tent", "Surf first-aid kit", 10, 14, 5, ["Crepe bandage"]),
      buyer("B03", "First-aid room", "Surf first-aid kit", 8, 20, 8, ["Saline rinse"]),
      buyer("B04", "Beach tower", "Surf first-aid kit", 4, 12, 4, ["Ice pack"]),
      buyer("B05", "IRB crew", "Surf first-aid kit", 7, 16, 6, ["Crepe bandage", "Saline rinse"]),
      buyer("B06", "Clubhouse desk", "Surf first-aid kit", 5, 15, 3, ["Ice pack", "Saline rinse"])
    ],
    offers: [
      offer("O01", "Beach Kit Delivery", "Surf first-aid kit", "Crepe bandage", 11, 12, 4, 40, 3),
      offer("O02", "Ice Pack Run", "Surf first-aid kit", "Ice pack", 9, 8, 5, 24, 2),
      { ...offer("O03", "Clubhouse First-Aid Pickup", "Surf first-aid kit", "Saline rinse", 8, 6, 2, 20, 6), fulfillment: "pickup" }
    ]
  },
  theatreWardrobe: {
    title: "Theatre wardrobe kit",
    currency: "AUD",
    buyers: [
      buyer("B01", "Wardrobe truck", "Costume wardrobe pack", 8, 48, 8, ["Period costume", "Rehearsal blacks"]),
      buyer("B02", "Chorus dressing", "Costume wardrobe pack", 12, 36, 6, ["Rehearsal blacks"]),
      buyer("B03", "Principal cast", "Costume wardrobe pack", 5, 55, 10, ["Period costume", "Quick-change cloak"]),
      buyer("B04", "Green room rail", "Costume wardrobe pack", 4, 28, 4, ["Quick-change cloak"]),
      buyer("B05", "Understudy rail", "Costume wardrobe pack", 7, 44, 7, ["Period costume", "Rehearsal blacks"]),
      buyer("B06", "Tour crate", "Costume wardrobe pack", 6, 38, 5, ["Rehearsal blacks", "Quick-change cloak"])
    ],
    offers: [
      offer("O01", "Stage-door Costume Delivery", "Costume wardrobe pack", "Period costume", 32, 10, 5, 40, 5),
      offer("O02", "Blacks Run Co", "Costume wardrobe pack", "Rehearsal blacks", 22, 8, 6, 30, 3),
      { ...offer("O03", "Green-room Wardrobe Pickup", "Costume wardrobe pack", "Quick-change cloak", 18, 6, 2, 20, 8), fulfillment: "pickup" }
    ]
  },
  choirFolders: {
    title: "Community choir folders",
    currency: "AUD",
    buyers: [
      buyer("B01", "Soprano row", "Choir folder pack", 8, 28, 8, ["Soprano folder", "Alto folder"]),
      buyer("B02", "Alto desks", "Choir folder pack", 12, 22, 6, ["Alto folder"]),
      buyer("B03", "Tenor stand", "Choir folder pack", 6, 32, 10, ["Tenor folder", "Soprano folder"]),
      buyer("B04", "Bass crates", "Choir folder pack", 5, 20, 4, ["Bass folder"]),
      buyer("B05", "Library rail", "Choir folder pack", 9, 26, 7, ["Tenor folder", "Bass folder"]),
      buyer("B06", "Tour stack", "Choir folder pack", 7, 24, 5, ["Alto folder", "Bass folder"])
    ],
    offers: [
      offer("O01", "Rehearsal-room Folder Delivery", "Choir folder pack", "Soprano folder", 18, 10, 5, 40, 4),
      offer("O02", "Tenor Folder Cart", "Choir folder pack", "Tenor folder", 16, 8, 6, 24, 3),
      { ...offer("O03", "Hall Folder Pickup", "Choir folder pack", "Alto folder", 14, 8, 2, 30, 6), fulfillment: "pickup" }
    ]
  },
  scoutCamp: {
    title: "Scout camp kit",
    currency: "AUD",
    buyers: [
      buyer("B01", "Patrol crate", "Scout camp pack", 8, 28, 8, ["Synthetic compass", "Mess-tin"]),
      buyer("B02", "Troop store", "Scout camp pack", 12, 22, 6, ["Mess-tin"]),
      buyer("B03", "Camp kitchen", "Scout camp pack", 6, 32, 10, ["Mess-tin", "Groundsheet"]),
      buyer("B04", "Hike pack", "Scout camp pack", 5, 20, 4, ["Synthetic compass"]),
      buyer("B05", "Overnight rail", "Scout camp pack", 9, 26, 7, ["Groundsheet", "Synthetic compass"]),
      buyer("B06", "Hall cupboard", "Scout camp pack", 7, 24, 5, ["Mess-tin", "Groundsheet"])
    ],
    offers: [
      offer("O01", "Campsite Kit Delivery", "Scout camp pack", "Synthetic compass", 18, 10, 5, 40, 4),
      offer("O02", "Groundsheet Run", "Scout camp pack", "Groundsheet", 16, 8, 6, 24, 3),
      { ...offer("O03", "Scout-hall Kit Pickup", "Scout camp pack", "Mess-tin", 14, 8, 2, 30, 6), fulfillment: "pickup" }
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
  rejectUnknownFields(candidate, ["version", "rooms", "fulfillmentFilter", "hideExcludedBuyers", "hideUnwinnableOffers", "hideCoveredLeftoverRows", "hideTertiaryLeftoverRow", "hideLeftoverFillRow", "hideZeroRemainingCapacityOffers", "hideFullyFilledBuyers", "hideBuyersWithLeftover"], "Workspace");
  const fulfillmentFilter = own(candidate, "fulfillmentFilter");
  let filter = "all";
  if (fulfillmentFilter !== undefined) {
    if (fulfillmentFilter !== "all" && fulfillmentFilter !== "shipping" && fulfillmentFilter !== "pickup") {
      throw new ScenarioError("Fulfillment filter must be all, shipping, or pickup.");
    }
    filter = fulfillmentFilter;
  }
  const hideExcludedBuyers = own(candidate, "hideExcludedBuyers");
  let hideExcluded = false;
  if (hideExcludedBuyers !== undefined) {
    if (hideExcludedBuyers !== true && hideExcludedBuyers !== false) {
      throw new ScenarioError("Hide excluded buyers must be true or false.");
    }
    hideExcluded = hideExcludedBuyers;
  }
  const hideUnwinnableOffers = own(candidate, "hideUnwinnableOffers");
  let hideUnwinnable = false;
  if (hideUnwinnableOffers !== undefined) {
    if (hideUnwinnableOffers !== true && hideUnwinnableOffers !== false) {
      throw new ScenarioError("Hide unwinnable offers must be true or false.");
    }
    hideUnwinnable = hideUnwinnableOffers;
  }
  const hideCoveredLeftoverRows = own(candidate, "hideCoveredLeftoverRows");
  let hideCoveredLeftover = false;
  if (hideCoveredLeftoverRows !== undefined) {
    if (hideCoveredLeftoverRows !== true && hideCoveredLeftoverRows !== false) {
      throw new ScenarioError("Hide covered leftover rows must be true or false.");
    }
    hideCoveredLeftover = hideCoveredLeftoverRows;
  }
  const hideTertiaryLeftoverRow = own(candidate, "hideTertiaryLeftoverRow");
  let hideTertiaryLeftover = false;
  if (hideTertiaryLeftoverRow !== undefined) {
    if (hideTertiaryLeftoverRow !== true && hideTertiaryLeftoverRow !== false) {
      throw new ScenarioError("Hide tertiary leftover row must be true or false.");
    }
    hideTertiaryLeftover = hideTertiaryLeftoverRow;
  }
  const hideLeftoverFillRow = own(candidate, "hideLeftoverFillRow");
  let hideLeftoverFill = false;
  if (hideLeftoverFillRow !== undefined) {
    if (hideLeftoverFillRow !== true && hideLeftoverFillRow !== false) {
      throw new ScenarioError("Hide leftover fill row must be true or false.");
    }
    hideLeftoverFill = hideLeftoverFillRow;
  }
  const hideZeroRemainingCapacityOffers = own(candidate, "hideZeroRemainingCapacityOffers");
  let hideZeroRemaining = false;
  if (hideZeroRemainingCapacityOffers !== undefined) {
    if (hideZeroRemainingCapacityOffers !== true && hideZeroRemainingCapacityOffers !== false) {
      throw new ScenarioError("Hide zero remaining capacity offers must be true or false.");
    }
    hideZeroRemaining = hideZeroRemainingCapacityOffers;
  }
  const hideFullyFilledBuyers = own(candidate, "hideFullyFilledBuyers");
  let hideFullyFilled = false;
  if (hideFullyFilledBuyers !== undefined) {
    if (hideFullyFilledBuyers !== true && hideFullyFilledBuyers !== false) {
      throw new ScenarioError("Hide fully filled buyers must be true or false.");
    }
    hideFullyFilled = hideFullyFilledBuyers;
  }
  const hideBuyersWithLeftover = own(candidate, "hideBuyersWithLeftover");
  let hideLeftoverBuyers = false;
  if (hideBuyersWithLeftover !== undefined) {
    if (hideBuyersWithLeftover !== true && hideBuyersWithLeftover !== false) {
      throw new ScenarioError("Hide buyers with leftover must be true or false.");
    }
    hideLeftoverBuyers = hideBuyersWithLeftover;
  }
  return { version: 1, rooms: candidate.rooms.map(validateScenario), fulfillmentFilter: filter, hideExcludedBuyers: hideExcluded, hideUnwinnableOffers: hideUnwinnable, hideCoveredLeftoverRows: hideCoveredLeftover, hideTertiaryLeftoverRow: hideTertiaryLeftover, hideLeftoverFillRow: hideLeftoverFill, hideZeroRemainingCapacityOffers: hideZeroRemaining, hideFullyFilledBuyers: hideFullyFilled, hideBuyersWithLeftover: hideLeftoverBuyers };
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

export function copyOfferAsNewTierSet(rawScenario, offerId) {
  const clean = duplicateEntry(rawScenario, "offers", offerId);
  const source = clean.offers.find((offer) => offer.id === offerId);
  const copy = clean.offers.at(-1);
  copy.merchant = `${source.merchant.slice(0, 48)} (tier set)`;
  const previous = source.tiers?.at(-1) ?? source;
  const nextMinimum = Math.min(source.capacity, previous.minimumUnits + Math.max(1, Math.ceil((source.capacity - previous.minimumUnits) / 2)));
  const nextPrice = Math.floor(previous.unitPrice * 80) / 100;
  if (
    nextMinimum > previous.minimumUnits
    && nextPrice < previous.unitPrice
    && nextPrice >= 0
    && nextMinimum <= source.capacity
    && (source.tiers?.length ?? 0) < 8
  ) {
    copy.tiers = [...(source.tiers ?? []).map((tier) => ({ ...tier })), { minimumUnits: nextMinimum, unitPrice: nextPrice }];
  }
  return validateScenario(clean);
}

export function copyOfferAsPickup(rawScenario, offerId) {
  const clean = duplicateEntry(rawScenario, "offers", offerId);
  const source = clean.offers.find((offer) => offer.id === offerId);
  const copy = clean.offers.at(-1);
  copy.merchant = `${source.merchant.slice(0, 51)} (pickup)`;
  copy.fulfillment = "pickup";
  copy.shippingPerBuyer = 0;
  return validateScenario(clean);
}

export function filterOfferIdsByFulfillment(rawScenario, fulfillment) {
  if (fulfillment !== "all" && fulfillment !== "shipping" && fulfillment !== "pickup") {
    throw new ScenarioError("Fulfillment filter must be all, shipping, or pickup.");
  }
  const scenario = validateScenario(rawScenario);
  if (fulfillment === "all") return scenario.offers.map((offer) => offer.id);
  return scenario.offers.filter((offer) => offer.fulfillment === fulfillment).map((offer) => offer.id);
}

/** Display-only. Matching is unchanged. When hideUnwinnable is false, every offer id is returned. Locked and zero-unlock offers are omitted when true. */
export function filterOfferIdsHidingUnwinnable(rawScenario, hideUnwinnable) {
  if (hideUnwinnable !== true && hideUnwinnable !== false) {
    throw new ScenarioError("Hide unwinnable offers must be true or false.");
  }
  const scenario = validateScenario(rawScenario);
  if (!hideUnwinnable) return scenario.offers.map((offer) => offer.id);
  const market = evaluateMarket(scenario);
  const unlocked = new Set(market.results.filter((result) => result.qualifies).map((result) => result.offer.id));
  return scenario.offers.filter((offer) => unlocked.has(offer.id)).map((offer) => offer.id);
}

/** Display-only. Matching is unchanged. Hides offers whose remaining capacity after the winner is zero, or unwinnable offers once a winner has allocated buyers. */
export function filterOfferIdsHidingZeroRemainingCapacity(rawScenario, hideZeroRemaining) {
  if (hideZeroRemaining !== true && hideZeroRemaining !== false) {
    throw new ScenarioError("Hide zero remaining capacity offers must be true or false.");
  }
  const scenario = validateScenario(rawScenario);
  if (!hideZeroRemaining) return scenario.offers.map((offer) => offer.id);
  const market = evaluateMarket(scenario);
  const remainingIds = new Set(
    market.results
      .filter((result) => {
        const remaining = Math.max(0, result.offer.capacity - result.fulfilledUnits);
        if (remaining === 0) return false;
        if (!result.qualifies && market.winner) return false;
        return true;
      })
      .map((result) => result.offer.id)
  );
  return scenario.offers.filter((offer) => remainingIds.has(offer.id)).map((offer) => offer.id);
}

/** Display-only. Matching is unchanged. Inverse of hide zero remaining capacity: hides offers whose remaining capacity after the winner is greater than zero. */
export function filterOfferIdsHidingOffersWithRemainingCapacity(rawScenario, hideRemaining) {
  if (hideRemaining !== true && hideRemaining !== false) {
    throw new ScenarioError("Hide offers with remaining capacity must be true or false.");
  }
  const scenario = validateScenario(rawScenario);
  if (!hideRemaining) return scenario.offers.map((offer) => offer.id);
  const market = evaluateMarket(scenario);
  const remainingIds = new Set(
    market.results
      .filter((result) => {
        const remaining = Math.max(0, result.offer.capacity - result.fulfilledUnits);
        return remaining === 0;
      })
      .map((result) => result.offer.id)
  );
  return scenario.offers.filter((offer) => remainingIds.has(offer.id)).map((offer) => offer.id);
}

export function acceptedVariantFilterOptions(rawScenario) {
  const scenario = validateScenario(rawScenario);
  const seen = new Map();
  for (const buyer of scenario.buyers) {
    for (const variant of buyer.allowedVariants) {
      const key = normalizeText(variant);
      if (!seen.has(key)) seen.set(key, variant);
    }
  }
  return [...seen.values()].sort((left, right) => compareText(normalizeText(left), normalizeText(right)) || compareText(left, right));
}

export function filterBuyerIdsByAcceptedVariant(rawScenario, variant) {
  if (typeof variant !== "string") {
    throw new ScenarioError("Buyer variant filter must be all or an accepted variant name.");
  }
  if (variant !== "all" && variant.trim() === "") {
    throw new ScenarioError("Buyer variant filter must be all or an accepted variant name.");
  }
  const scenario = validateScenario(rawScenario);
  if (variant === "all") return scenario.buyers.map((buyer) => buyer.id);
  const key = normalizeText(variant);
  return scenario.buyers
    .filter((buyer) => buyer.allowedVariants.some((entry) => normalizeText(entry) === key))
    .map((buyer) => buyer.id);
}

/** Display-only. Matching is unchanged. When hideExcluded is false, every buyer id is returned. */
export function filterBuyerIdsHidingExcluded(rawScenario, offerId, hideExcluded) {
  if (hideExcluded !== true && hideExcluded !== false) {
    throw new ScenarioError("Hide excluded buyers must be true or false.");
  }
  const scenario = validateScenario(rawScenario);
  if (!hideExcluded) return scenario.buyers.map((buyer) => buyer.id);
  if (typeof offerId !== "string" || offerId.trim() === "") {
    throw new ScenarioError("Select an existing offer to hide excluded buyers.");
  }
  const result = evaluateOffer(scenario, offerId);
  const included = new Set(
    result.buyerOutcomes.filter((outcome) => outcome.status === "included").map((outcome) => outcome.buyerId)
  );
  return scenario.buyers.filter((buyer) => included.has(buyer.id)).map((buyer) => buyer.id);
}

/** Display-only. Matching is unchanged. Hides organizer buyer rows whose leftover or unfilled demand after the winner is zero. */
export function filterBuyerIdsHidingFullyFilled(rawScenario, hideFullyFilled) {
  if (hideFullyFilled !== true && hideFullyFilled !== false) {
    throw new ScenarioError("Hide fully filled buyers must be true or false.");
  }
  const scenario = validateScenario(rawScenario);
  if (!hideFullyFilled) return scenario.buyers.map((buyer) => buyer.id);
  const leftover = new Set(computeResidualCoverage(scenario).leftoverBuyerIds);
  return scenario.buyers.filter((buyer) => leftover.has(buyer.id)).map((buyer) => buyer.id);
}

/** Display-only. Matching is unchanged. Inverse of hide fully filled: hides organizer buyer rows that still have leftover after the winner. */
export function filterBuyerIdsHidingBuyersWithLeftover(rawScenario, hideBuyersWithLeftover) {
  if (hideBuyersWithLeftover !== true && hideBuyersWithLeftover !== false) {
    throw new ScenarioError("Hide buyers with leftover must be true or false.");
  }
  const scenario = validateScenario(rawScenario);
  if (!hideBuyersWithLeftover) return scenario.buyers.map((buyer) => buyer.id);
  const leftover = new Set(computeResidualCoverage(scenario).leftoverBuyerIds);
  return scenario.buyers.filter((buyer) => !leftover.has(buyer.id)).map((buyer) => buyer.id);
}

/** Organizer counts of buyers who accept each variant. Labels, IDs, budgets, and allocations are omitted. */
export function organizerBuyerVariantCounts(rawScenario) {
  const scenario = validateScenario(rawScenario);
  const groups = new Map();
  for (const buyer of scenario.buyers) {
    for (const variant of buyer.allowedVariants) {
      const key = normalizeText(variant);
      const current = groups.get(key) ?? { variant, buyerCount: 0, units: 0 };
      current.buyerCount += 1;
      current.units += buyer.quantity;
      groups.set(key, current);
    }
  }
  return [...groups.values()].sort((left, right) => compareText(normalizeText(left.variant), normalizeText(right.variant)) || compareText(left.variant, right.variant));
}

function sortedOffers(offers, mode) {
  if (mode !== "unitPrice" && mode !== "capacity") {
    throw new ScenarioError("Offer sort must be unit price or capacity.");
  }
  return [...offers].sort((left, right) => {
    if (mode === "unitPrice") {
      return left.unitPrice - right.unitPrice || compareText(left.id, right.id);
    }
    return right.capacity - left.capacity || compareText(left.id, right.id);
  });
}

export function previewOfferSort(rawScenario, mode) {
  const scenario = validateScenario(rawScenario);
  return sortedOffers(scenario.offers, mode).map((offer) => ({
    ...offer,
    tiers: offer.tiers ? offer.tiers.map((tier) => ({ ...tier })) : offer.tiers
  }));
}

export function applyOfferSort(rawScenario, mode) {
  const scenario = validateScenario(rawScenario);
  return validateScenario({ ...scenario, offers: sortedOffers(scenario.offers, mode) });
}

function sortedBuyers(buyers, mode) {
  if (mode !== "label" && mode !== "quantity") {
    throw new ScenarioError("Buyer sort must be label or quantity.");
  }
  return [...buyers].sort((left, right) => {
    if (mode === "label") {
      return compareText(normalizeText(left.label), normalizeText(right.label)) || compareText(left.id, right.id);
    }
    return right.quantity - left.quantity || compareText(left.id, right.id);
  });
}

export function previewBuyerSort(rawScenario, mode) {
  const scenario = validateScenario(rawScenario);
  return sortedBuyers(scenario.buyers, mode).map((buyer) => ({
    ...buyer,
    allowedVariants: [...buyer.allowedVariants]
  }));
}

export function applyBuyerSort(rawScenario, mode) {
  const scenario = validateScenario(rawScenario);
  return validateScenario({ ...scenario, buyers: sortedBuyers(scenario.buyers, mode) });
}

export function restoreRemovedBuyer(rawScenario, rawBuyer) {
  if (rawBuyer == null || typeof rawBuyer !== "object" || Array.isArray(rawBuyer)) {
    throw new ScenarioError("A removed buyer is required to restore.");
  }
  const scenario = validateScenario(rawScenario);
  if (scenario.buyers.length >= MAX_BUYERS) {
    throw new ScenarioError(`Buyers must contain at most ${MAX_BUYERS} entries.`);
  }
  const buyer = validateBuyer(rawBuyer, scenario.buyers.length);
  if (scenario.buyers.some((entry) => entry.id === buyer.id)) {
    throw new ScenarioError(`Buyer ${buyer.id} is already in the room.`);
  }
  return validateScenario({ ...scenario, buyers: [...scenario.buyers, buyer] });
}

export function restoreExampleOffers(rawScenario, name = "neighbourhood") {
  const scenario = validateScenario(rawScenario);
  const example = clonePreset(name);
  return validateScenario({
    title: scenario.title,
    currency: scenario.currency,
    buyers: scenario.buyers,
    offers: example.offers
  });
}

export function uniqueCopyTitle(title, existingTitles = []) {
  if (typeof title !== "string") throw new ScenarioError("Room name must be 1 to 80 characters.");
  if (!Array.isArray(existingTitles)) throw new ScenarioError("Existing titles must be an array.");
  for (const entry of existingTitles) {
    if (typeof entry !== "string") throw new ScenarioError("Existing titles must be strings.");
  }
  const taken = new Set(existingTitles);
  for (let number = 1; number <= 99; number += 1) {
    const suffix = number === 1 ? " (copy)" : ` (copy ${number})`;
    const maxBase = 80 - suffix.length;
    const trimmed = title.trim();
    const base = trimmed.length <= maxBase ? trimmed : trimmed.slice(0, maxBase).trim();
    const candidate = `${base}${suffix}`;
    if (candidate.length > 80) continue;
    if (!taken.has(candidate)) return candidate;
  }
  throw new ScenarioError("Could not assign a unique copy title.");
}

export function duplicateRoom(rawScenario, existingTitles = []) {
  if (!Array.isArray(existingTitles)) throw new ScenarioError("Existing titles must be an array.");
  const scenario = validateScenario(rawScenario);
  const copy = JSON.parse(JSON.stringify(scenario));
  copy.title = uniqueCopyTitle(scenario.title, [...existingTitles, scenario.title]);
  return validateScenario(copy);
}

function residualCoverageCounts(rawScenario) {
  const coverage = computeResidualCoverage(rawScenario);
  return {
    leftoverBuyers: coverage.leftoverBuyerCount,
    leftoverUnits: coverage.leftoverUnits,
    unfilledBuyers: coverage.unfilledBuyerCount,
    unfilledUnits: coverage.unfilledUnits
  };
}

function marketComparisonMetrics(market) {
  return {
    requested: market.totalRequestedUnits,
    fulfilled: market.winner?.fulfilledUnits ?? 0,
    buyers: market.winner?.deliveredBuyers ?? 0,
    cost: market.winner?.totalCost ?? null,
    winner: market.winner?.offer.merchant ?? "No qualifying offer",
    ...residualCoverageCounts(market.scenario)
  };
}

export function compareScenarios(before, after) {
  const baseline = evaluateMarket(before);
  const current = evaluateMarket(after);
  const currency = landedTotalsComparison(baseline.scenario.currency, current.scenario.currency);
  return {
    baseline: withComparableCost(marketComparisonMetrics(baseline), currency.comparable),
    current: withComparableCost(marketComparisonMetrics(current), currency.comparable),
    sameCurrency: currency.sameCurrency,
    sameDemand: JSON.stringify(baseline.scenario.buyers) === JSON.stringify(current.scenario.buyers),
    currencyWarning: currency.warning
  };
}

export function compareThreeRooms(first, second, third) {
  const rooms = [first, second, third].map((entry, index) => {
    try {
      return validateScenario(entry);
    } catch (error) {
      throw new ScenarioError(`Room ${index + 1} is invalid: ${error.message}`);
    }
  });
  const markets = rooms.map((room) => evaluateMarket(room));
  const currency = landedTotalsComparison(rooms[0].currency, rooms[1].currency);
  const thirdCurrency = landedTotalsComparison(rooms[0].currency, rooms[2].currency);
  const comparable = currency.comparable && thirdCurrency.comparable;
  const warning = comparable ? null : "These rooms use different currencies. Landed totals are not compared.";
  return {
    sameCurrency: comparable,
    currencyWarning: warning,
    rooms: rooms.map((room, index) => ({
      title: room.title,
      currency: room.currency,
      requested: markets[index].totalRequestedUnits,
      fulfilled: markets[index].winner?.fulfilledUnits ?? 0,
      buyers: markets[index].winner?.deliveredBuyers ?? 0,
      cost: comparable ? (markets[index].winner?.totalCost ?? null) : null,
      winner: markets[index].winner?.offer.merchant ?? "No qualifying offer",
      ...residualCoverageCounts(room)
    }))
  };
}

export function landedTotalsComparison(leftCurrency, rightCurrency) {
  if (typeof leftCurrency !== "string" || typeof rightCurrency !== "string") {
    throw new ScenarioError("Currency codes must be strings.");
  }
  const left = leftCurrency.trim().toUpperCase();
  const right = rightCurrency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(left) || !/^[A-Z]{3}$/.test(right)) {
    throw new ScenarioError("Currency must be a three-letter ASCII code, such as AUD.");
  }
  const sameCurrency = left === right;
  return {
    sameCurrency,
    comparable: sameCurrency,
    warning: sameCurrency ? null : "These rooms use different currencies. Landed totals are not compared."
  };
}

function withComparableCost(metrics, comparable) {
  return { ...metrics, cost: comparable ? metrics.cost : null };
}

function publicOfferIdentitySide(result, includeLanded) {
  return {
    offerId: result.offer.id,
    merchant: result.offer.merchant,
    category: result.offer.category,
    variant: result.offer.variant,
    fulfillment: result.offer.fulfillment,
    status: result.qualifies ? "Unlocked" : "Locked",
    fulfilledUnits: result.fulfilledUnits,
    includedBuyerCount: result.deliveredBuyers,
    itemPrice: result.effectiveUnitPrice,
    landedTotal: includeLanded && result.qualifies ? result.totalCost : null
  };
}

/**
 * Merchant-facing compare of two rooms by offer id. Shared ids report
 * aggregates only. Missing ids are listed and are not filled with zeros.
 */
export function compareRoomsByOfferIdentity(leftRaw, rightRaw) {
  const left = validateScenario(leftRaw);
  const right = validateScenario(rightRaw);
  const leftMarket = evaluateMarket(left);
  const rightMarket = evaluateMarket(right);
  const currency = landedTotalsComparison(left.currency, right.currency);
  const leftIds = left.offers.map((offer) => offer.id);
  const rightIds = right.offers.map((offer) => offer.id);
  const rightSet = new Set(rightIds);
  const leftSet = new Set(leftIds);
  const leftById = new Map(leftMarket.results.map((result) => [result.offer.id, result]));
  const rightById = new Map(rightMarket.results.map((result) => [result.offer.id, result]));
  return {
    leftCurrency: left.currency,
    rightCurrency: right.currency,
    leftBuyerCount: leftMarket.buyerCount,
    rightBuyerCount: rightMarket.buyerCount,
    leftRequestedUnits: leftMarket.totalRequestedUnits,
    rightRequestedUnits: rightMarket.totalRequestedUnits,
    leftOfferCount: left.offers.length,
    rightOfferCount: right.offers.length,
    sameCurrency: currency.sameCurrency,
    currencyWarning: currency.warning,
    shared: leftIds.filter((id) => rightSet.has(id)).map((id) => ({
      offerId: id,
      left: publicOfferIdentitySide(leftById.get(id), currency.comparable),
      right: publicOfferIdentitySide(rightById.get(id), currency.comparable)
    })),
    missingFromRight: leftIds.filter((id) => !rightSet.has(id)),
    missingFromLeft: rightIds.filter((id) => !leftSet.has(id))
  };
}

export function createOfferIdentityCompareMarkdown(leftRaw, rightRaw) {
  const comparison = compareRoomsByOfferIdentity(leftRaw, rightRaw);
  const formatSide = (side) => {
    const landed = side.landedTotal === null ? "landed total omitted" : `landed ${side.landedTotal}`;
    return `${side.fulfilledUnits} units, ${side.includedBuyerCount} buyers, ${side.status}, ${landed}`;
  };
  const sharedLines = comparison.shared.length === 0
    ? ["- None."]
    : comparison.shared.map((entry) => `- ${entry.offerId} (${entry.left.merchant} / ${entry.left.variant}): left ${formatSide(entry.left)}; right ${entry.right.merchant} / ${entry.right.variant}, ${formatSide(entry.right)}.`);
  const missingRight = comparison.missingFromRight.length === 0
    ? ["- None."]
    : comparison.missingFromRight.map((id) => `- ${id}`);
  const missingLeft = comparison.missingFromLeft.length === 0
    ? ["- None."]
    : comparison.missingFromLeft.map((id) => `- ${id}`);
  const lines = [
    `# Common Cart offer identity compare`,
    ``,
    `- Left: ${comparison.leftOfferCount} offers, ${comparison.leftBuyerCount} buyers, ${comparison.leftRequestedUnits} requested units, ${comparison.leftCurrency}.`,
    `- Right: ${comparison.rightOfferCount} offers, ${comparison.rightBuyerCount} buyers, ${comparison.rightRequestedUnits} requested units, ${comparison.rightCurrency}.`,
    `- Shared offer ids: ${comparison.shared.length}.`,
    comparison.currencyWarning ? `- ${comparison.currencyWarning}` : `- Currencies match. Landed totals are shown when an offer unlocks.`,
    ``,
    `## Shared offers`,
    ...sharedLines,
    ``,
    `## Missing from right`,
    ...missingRight,
    ``,
    `## Missing from left`,
    ...missingLeft,
    ``,
    `Missing offer ids are listed and are not filled with zeros. These aggregates omit private buyer labels, IDs, budgets, and allocations.`
  ];
  return `${lines.join("\n")}\n`;
}

/** Organizer-only sum of unused item-ceiling headroom for buyers included in the winner. */
export function winnerBudgetLeftover(rawScenario) {
  const market = evaluateMarket(rawScenario);
  if (!market.winner) {
    return {
      includedBuyerCount: 0,
      unspentHeadroom: 0,
      note: "No winning offer, so there is no leftover headroom after a winner."
    };
  }
  const unspentHeadroom = market.winner.allocations.reduce((sum, allocation) => sum + Math.max(0, allocation.headroom), 0);
  return {
    includedBuyerCount: market.winner.deliveredBuyers,
    unspentHeadroom,
    note: "Organizer-only sum of included buyers' unused item-ceiling headroom after the winning allocation. Not a rebate or merchant payout."
  };
}

/** Organizer-private one-line leftover unspent item headroom. Currency and counts only. Not a rebate. */
export function createLeftoverHeadroomMarkdown(rawScenario) {
  const scenario = validateScenario(rawScenario);
  const leftover = winnerBudgetLeftover(rawScenario);
  const amount = leftover.note.startsWith("No winning offer")
    ? "none"
    : `${scenario.currency} ${leftover.unspentHeadroom} across ${leftover.includedBuyerCount} included buyers`;
  return `Common Cart leftover unspent item headroom (organizer private): ${amount}. Not a rebate.\n`;
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
      fulfillment: result.offer.fulfillment,
      status: result.qualifies ? "Unlocked" : "Locked", fulfilledUnits: result.fulfilledUnits,
      includedBuyerCount: result.deliveredBuyers, itemPrice: result.effectiveUnitPrice,
      landedTotal: result.qualifies ? result.totalCost : null, deliveryDays: result.offer.deliveryDays
    }))
  };
}

export function createMerchantResidualReport(rawScenario) {
  const coverage = computeResidualCoverage(rawScenario);
  const publicOffer = (entry) => entry && ({
    merchant: entry.merchant,
    category: entry.category,
    variant: entry.variant,
    fulfilledUnits: entry.fulfilledUnits,
    deliveredBuyers: entry.deliveredBuyers,
    totalCost: entry.totalCost
  });
  return {
    report: "Common Cart residual coverage (merchant aggregate)",
    version: 1,
    currency: evaluateMarket(rawScenario).scenario.currency,
    limitations: coverage.note,
    primary: publicOffer(coverage.primary),
    secondary: publicOffer(coverage.secondary),
    tertiary: publicOffer(coverage.tertiary),
    leftoverBuyerCount: coverage.leftoverBuyerCount,
    leftoverUnits: coverage.leftoverUnits,
    unfilledBuyerCount: coverage.unfilledBuyerCount,
    unfilledUnits: coverage.unfilledUnits
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

function parseDelimitedRows(text, delimiter) {
  if (typeof delimiter !== "string" || delimiter.length !== 1) {
    throw new ScenarioError("Table delimiter must be a single character.");
  }
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
    } else if (character === delimiter) {
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
  if (quoted) throw new ScenarioError("CSV has an unclosed quote.");
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((entry) => entry.some((value) => value.trim() !== ""));
}

function parseCsvRows(text) {
  return parseDelimitedRows(text, ",");
}

function buyerTableDelimiter(text) {
  const source = text.replace(/^\uFEFF/u, "");
  const end = source.search(/[\r\n]/u);
  const firstLine = end === -1 ? source : source.slice(0, end);
  return firstLine.includes("\t") ? "\t" : ",";
}

function buyersFromCsvRows(rows) {
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

export function parseBuyerCsv(text) {
  if (typeof text !== "string") throw new ScenarioError("Buyer CSV must be text.");
  if (text.trim() === "") throw new ScenarioError("Buyer CSV is empty.");
  return buyersFromCsvRows(parseCsvRows(text));
}

export function parseBuyerTable(text) {
  if (typeof text !== "string") throw new ScenarioError("Buyer CSV must be text.");
  if (text.trim() === "") throw new ScenarioError("Buyer CSV is empty.");
  const delimiter = buyerTableDelimiter(text);
  return buyersFromCsvRows(parseDelimitedRows(text, delimiter));
}

export function importBuyersFromCsv(rawScenario, text) {
  const scenario = validateScenario(rawScenario);
  const buyers = parseBuyerCsv(text);
  if (buyers.length < 1) throw new ScenarioError("Buyer CSV needs a header row and at least one buyer.");
  return validateScenario({ ...scenario, buyers });
}

export function importBuyersFromTable(rawScenario, text) {
  const scenario = validateScenario(rawScenario);
  const buyers = parseBuyerTable(text);
  if (buyers.length < 1) throw new ScenarioError("Buyer CSV needs a header row and at least one buyer.");
  return validateScenario({ ...scenario, buyers });
}

export function buyerCsvTemplate() {
  return "label,category,quantity,max unit price,latest delivery days,variants,max order total\r\n";
}

/** Organizer-only buyer rows using the same columns as import. Formula-safe. Private labels and budgets included. */
export function createOrganizerBuyerCsv(rawScenario) {
  const scenario = validateScenario(rawScenario);
  const rows = [["label", "category", "quantity", "max unit price", "latest delivery days", "variants", "max order total"]];
  for (const buyer of scenario.buyers) {
    rows.push([
      buyer.label,
      buyer.category,
      buyer.quantity,
      buyer.maxUnitPrice,
      buyer.latestDeliveryDays,
      buyer.allowedVariants.join(", "),
      Object.hasOwn(buyer, "maxOrderTotal") ? buyer.maxOrderTotal : ""
    ]);
  }
  return `${rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n")}\r\n`;
}

const OFFER_CSV_HEADERS = {
  name: "merchant",
  merchant: "merchant",
  capacity: "capacity",
  "unit price": "unitPrice",
  price: "unitPrice",
  shipping: "shippingPerBuyer",
  "shipping per buyer": "shippingPerBuyer",
  fulfillment: "fulfillment",
  variants: "variant",
  variant: "variant",
  category: "category",
  minimum: "minimumUnits",
  "minimum units": "minimumUnits",
  delivery: "deliveryDays",
  "delivery days": "deliveryDays"
};

const REQUIRED_OFFER_CSV_FIELDS = ["merchant", "capacity", "unitPrice", "shippingPerBuyer", "fulfillment", "variant"];

export function parseOfferCsv(text, defaults = {}) {
  if (defaults && (typeof defaults !== "object" || Array.isArray(defaults))) {
    throw new ScenarioError("Offer CSV defaults must be an object.");
  }
  rejectUnknownFields(defaults ?? {}, ["category", "minimumUnits", "deliveryDays"], "Offer CSV defaults");
  if (typeof text !== "string") throw new ScenarioError("Offer CSV must be text.");
  if (text.trim() === "") throw new ScenarioError("Offer CSV is empty.");
  const rows = parseCsvRows(text);
  if (rows.length < 2) throw new ScenarioError("Offer CSV needs a header row and at least one offer.");
  const header = rows[0].map((value) => neutralizeSpreadsheetCell(value).trim().toLowerCase().replaceAll("_", " "));
  const columns = header.map((name) => OFFER_CSV_HEADERS[name] ?? null);
  if (columns.some((field) => field === null)) {
    const unknown = rows[0].filter((_, index) => columns[index] === null).map((value) => value.trim() || "(empty)");
    throw new ScenarioError(`Offer CSV has unknown column: ${unknown[0]}.`);
  }
  for (const required of REQUIRED_OFFER_CSV_FIELDS) {
    if (!columns.includes(required)) {
      throw new ScenarioError("Offer CSV must include name, capacity, unit price, shipping, fulfillment, and variants.");
    }
  }
  const dataRows = rows.slice(1);
  if (dataRows.length < 1 || dataRows.length > MAX_OFFERS) {
    throw new ScenarioError(`Offers must contain 1 to ${MAX_OFFERS} entries.`);
  }
  const categoryDefault = defaults?.category ?? "Product";
  const minimumDefault = defaults?.minimumUnits ?? 1;
  const deliveryDefault = defaults?.deliveryDays ?? 7;
  return dataRows.map((row, index) => {
    const prefix = `CSV offer ${index + 1}`;
    const record = {};
    for (const [columnIndex, field] of columns.entries()) {
      if (!field) continue;
      record[field] = neutralizeSpreadsheetCell(row[columnIndex] ?? "");
    }
    const fulfillmentText = String(record.fulfillment ?? "").trim().toLowerCase();
    const offer = {
      id: `O${String(index + 1).padStart(2, "0")}`,
      merchant: record.merchant,
      category: String(record.category ?? "").trim() === "" ? categoryDefault : record.category,
      variant: record.variant,
      unitPrice: record.unitPrice,
      minimumUnits: String(record.minimumUnits ?? "").trim() === "" ? minimumDefault : record.minimumUnits,
      deliveryDays: String(record.deliveryDays ?? "").trim() === "" ? deliveryDefault : record.deliveryDays,
      capacity: record.capacity,
      shippingPerBuyer: record.shippingPerBuyer,
      fulfillment: fulfillmentText
    };
    try {
      return validateOffer(offer, index);
    } catch (error) {
      throw new ScenarioError(`${prefix}: ${error.message.replace(/^Offer \d+\s/u, "")}`);
    }
  });
}

export function importOffersFromCsv(rawScenario, text) {
  const scenario = validateScenario(rawScenario);
  const offers = parseOfferCsv(text, {
    category: scenario.buyers[0]?.category ?? scenario.offers[0]?.category ?? "Product"
  });
  return validateScenario({ ...scenario, offers });
}

export function offerCsvTemplate() {
  return "name,capacity,unit price,shipping,fulfillment,variants\r\n";
}

/** Merchant-facing offer rows. Formula-safe. Omits buyer IDs, labels, budgets, and allocations. */
export function createOfferCsv(rawScenario) {
  const scenario = validateScenario(rawScenario);
  const rows = [["name", "capacity", "unit price", "shipping", "fulfillment", "variants"]];
  for (const offer of scenario.offers) {
    rows.push([
      offer.merchant,
      offer.capacity,
      offer.unitPrice,
      offer.shippingPerBuyer,
      offer.fulfillment,
      offer.variant
    ]);
  }
  return `${rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n")}\r\n`;
}

export function createOrganizerBriefing(rawScenario) {
  const market = evaluateMarket(rawScenario);
  const residual = computeResidualCoverage(rawScenario);
  const leftover = winnerBudgetLeftover(rawScenario);
  const winner = market.winner;
  const gap = winner ? unitsToNextTier(rawScenario, winner.offer.id) : null;
  const excludedCount = winner
    ? winner.buyerOutcomes.filter((outcome) => outcome.status !== "included").length
    : market.buyerCount;
  const lines = [
    `# Common Cart organizer briefing`,
    ``,
    `- Room: ${market.scenario.title}`,
    `- Currency: ${market.scenario.currency}`,
    `- Requested units: ${market.totalRequestedUnits}`,
    `- Buyers in the room: ${market.buyerCount}`,
    `- Categories: ${market.categoryCount}`,
    ``,
    `## Winning offer`,
    winner
      ? [
        `- Merchant: ${winner.offer.merchant}`,
        `- Category: ${winner.offer.category}`,
        `- Variant: ${winner.offer.variant}`,
        `- Fulfillment: ${winner.offer.fulfillment}`,
        `- Fulfilled units: ${winner.fulfilledUnits}`,
        `- Included buyers: ${winner.deliveredBuyers}`,
        `- Item price: ${winner.effectiveUnitPrice}`,
        `- Landed total: ${winner.totalCost}`,
        `- Group headroom: ${winner.savings}`,
        `- Excluded buyers: ${excludedCount}`
      ].join("\n")
      : `- No qualifying offer. ${excludedCount} buyers remain unfilled.`,
    ``,
    `## Next cheaper tier`,
    gap
      ? [
        `- Reachable with current buyers: ${gap.reachable ? "yes" : "no"}`,
        `- Units still needed: ${gap.unitsNeeded === null ? "none" : gap.unitsNeeded}`,
        `- Next minimum: ${gap.nextMinimum === null ? "none" : gap.nextMinimum}`,
        `- Excluded buyers who could add units: ${gap.supplierBuyerCount} (${gap.supplierUnits} units)`,
        `- Note: ${gap.reason}`
      ].join("\n")
      : `- No winning offer to inspect.`,
    ``,
    `## Residual coverage`,
    `- ${residual.note}`,
    residual.secondary
      ? `- Leftover fill: ${residual.secondary.merchant} / ${residual.secondary.variant}, ${residual.secondary.fulfilledUnits} units, ${residual.secondary.deliveredBuyers} buyers.`
      : `- Leftover fill: none.`,
    residual.tertiary
      ? `- Tertiary fill: ${residual.tertiary.merchant} / ${residual.tertiary.variant}, ${residual.tertiary.fulfilledUnits} units, ${residual.tertiary.deliveredBuyers} buyers.`
      : `- Tertiary fill: none.`,
    `- Leftover after winner: ${residual.leftoverBuyerCount} buyers, ${residual.leftoverUnits} units.`,
    `- Still unfilled: ${residual.unfilledBuyerCount} buyers, ${residual.unfilledUnits} units.`,
    `- Unspent item headroom after winner: ${leftover.unspentHeadroom}`,
    `- ${leftover.note}`,
    ``,
    `This briefing is a planning aid. It omits private buyer labels, IDs, budgets, and allocations.`
  ];
  return `${lines.join("\n")}\n`;
}

/** Merchant-safe winner totals. Aggregates only. Omits buyer IDs, labels, budgets, and allocations. */
export function createWinnerAggregatesMarkdown(rawScenario) {
  const market = evaluateMarket(rawScenario);
  const residual = computeResidualCoverage(rawScenario);
  const winner = market.winner;
  const lines = [
    `# Common Cart winner aggregates`,
    ``,
    `- Currency: ${market.scenario.currency}`,
    `- Requested units: ${market.totalRequestedUnits}`,
    `- Buyers in the room: ${market.buyerCount}`,
    `- Categories: ${market.categoryCount}`,
    ``,
    `## Winning offer`,
    winner
      ? [
        `- Merchant: ${winner.offer.merchant}`,
        `- Category: ${winner.offer.category}`,
        `- Variant: ${winner.offer.variant}`,
        `- Fulfillment: ${winner.offer.fulfillment}`,
        `- Fulfilled units: ${winner.fulfilledUnits}`,
        `- Included buyers: ${winner.deliveredBuyers}`,
        `- Item price: ${winner.effectiveUnitPrice}`,
        `- Landed total: ${winner.totalCost}`,
        `- Group headroom: ${winner.savings}`,
        `- Fulfillment rate: ${winner.fulfillmentRate}`
      ].join("\n")
      : `- No qualifying offer.`,
    ``,
    `## Residual coverage`,
    `- Leftover after winner: ${residual.leftoverBuyerCount} buyers, ${residual.leftoverUnits} units.`,
    `- Still unfilled: ${residual.unfilledBuyerCount} buyers, ${residual.unfilledUnits} units.`,
    residual.secondary
      ? `- Leftover fill: ${residual.secondary.merchant} / ${residual.secondary.variant}, ${residual.secondary.fulfilledUnits} units, ${residual.secondary.deliveredBuyers} buyers.`
      : `- Leftover fill: none.`,
    residual.tertiary
      ? `- Tertiary fill: ${residual.tertiary.merchant} / ${residual.tertiary.variant}, ${residual.tertiary.fulfilledUnits} units, ${residual.tertiary.deliveredBuyers} buyers.`
      : `- Tertiary fill: none.`,
    ``,
    `These aggregates omit private buyer labels, IDs, budgets, and allocations.`
  ];
  return `${lines.join("\n")}\n`;
}

/** Organizer leftover table. Counts and merchant labels only. No buyer IDs, labels, budgets, or allocations. */
export function leftoverCoverageRows(rawScenario) {
  const coverage = computeResidualCoverage(rawScenario);
  return [
    {
      id: "leftover-after-winner",
      stage: "Leftover after winner",
      merchant: coverage.primary?.merchant ?? "None",
      buyerCount: coverage.leftoverBuyerCount,
      units: coverage.leftoverUnits,
      uncovered: false,
      covered: coverage.leftoverBuyerCount === 0
    },
    {
      id: "leftover-fill",
      stage: "Leftover fill",
      merchant: coverage.secondary?.merchant ?? "None",
      buyerCount: coverage.secondary ? coverage.secondary.deliveredBuyers : 0,
      units: coverage.secondary ? coverage.secondary.fulfilledUnits : 0,
      uncovered: false,
      covered: Boolean(coverage.secondary)
    },
    {
      id: "tertiary-fill",
      stage: "Tertiary fill",
      merchant: coverage.tertiary?.merchant ?? "None",
      buyerCount: coverage.tertiary ? coverage.tertiary.deliveredBuyers : 0,
      units: coverage.tertiary ? coverage.tertiary.fulfilledUnits : 0,
      uncovered: false,
      covered: Boolean(coverage.tertiary)
    },
    {
      id: "uncovered-leftover",
      stage: "Uncovered leftover",
      merchant: "None",
      buyerCount: coverage.unfilledBuyerCount,
      units: coverage.unfilledUnits,
      uncovered: coverage.leftoverBuyerCount > 0,
      covered: coverage.unfilledBuyerCount === 0
    }
  ];
}

/** Display-only leftover table filter. Matching is unchanged. */
export function filterLeftoverCoverageRowsHidingCovered(rawScenario, hideCovered) {
  if (hideCovered !== true && hideCovered !== false) {
    throw new ScenarioError("Hide covered leftover rows must be true or false.");
  }
  const rows = leftoverCoverageRows(rawScenario);
  if (!hideCovered) return rows;
  return rows.filter((row) => !row.covered);
}

/** Display-only leftover table filter. Matching is unchanged. */
export function filterLeftoverCoverageRowsHidingTertiary(rawScenario, hideTertiary) {
  if (hideTertiary !== true && hideTertiary !== false) {
    throw new ScenarioError("Hide tertiary leftover row must be true or false.");
  }
  const rows = leftoverCoverageRows(rawScenario);
  if (!hideTertiary) return rows;
  return rows.filter((row) => row.id !== "tertiary-fill");
}

/** Display-only leftover table filter. Matching is unchanged. Hides the leftover-fill coverage row when present. */
export function filterLeftoverCoverageRowsHidingLeftoverFill(rawScenario, hideLeftoverFill) {
  if (hideLeftoverFill !== true && hideLeftoverFill !== false) {
    throw new ScenarioError("Hide leftover fill row must be true or false.");
  }
  const rows = leftoverCoverageRows(rawScenario);
  if (!hideLeftoverFill) return rows;
  return rows.filter((row) => row.id !== "leftover-fill");
}

/** Organizer-private leftover Markdown. Buyer counts and units after the winner, including tertiary fill. */
export function createLeftoverCoverageMarkdown(rawScenario) {
  const coverage = computeResidualCoverage(rawScenario);
  const rows = leftoverCoverageRows(rawScenario);
  const lines = [
    `# Common Cart leftover residual coverage (organizer private)`,
    ``,
    `This Markdown is organizer-private. It is not a merchant export.`,
    ``,
    `- Winning merchant: ${coverage.primary?.merchant ?? "None unlocked"}`,
    `- Leftover after winner: ${coverage.leftoverBuyerCount} buyers, ${coverage.leftoverUnits} units.`,
    coverage.secondary
      ? `- Leftover fill: ${coverage.secondary.merchant} / ${coverage.secondary.variant}, ${coverage.secondary.fulfilledUnits} units, ${coverage.secondary.deliveredBuyers} buyers.`
      : `- Leftover fill: none.`,
    coverage.tertiary
      ? `- Tertiary fill: ${coverage.tertiary.merchant} / ${coverage.tertiary.variant}, ${coverage.tertiary.fulfilledUnits} units, ${coverage.tertiary.deliveredBuyers} buyers.`
      : `- Tertiary fill: none.`,
    `- Still unfilled: ${coverage.unfilledBuyerCount} buyers, ${coverage.unfilledUnits} units.`,
    `- ${coverage.note}`,
    ``,
    `| Stage | Merchant | Buyers | Units |`,
    `| --- | --- | --- | --- |`,
    ...rows.map((row) => `| ${markdownTableCell(row.stage)} | ${markdownTableCell(row.merchant)} | ${row.buyerCount} | ${row.units} |`),
    ``,
    `Buyer counts and units only. Labels, IDs, budgets, and allocations are omitted.`
  ];
  return `${lines.join("\n")}\n`;
}

/** Merchant label only. Honest empty when none unlocked. No buyer data. */
export function createWinningMerchantLabelMarkdown(rawScenario) {
  const coverage = computeResidualCoverage(rawScenario);
  const merchant = coverage.primary?.merchant ?? "None unlocked";
  const lines = [
    `# Common Cart winning merchant`,
    ``,
    merchant,
    ``,
    `Merchant label only. Buyer identities, IDs, budgets, and allocations are omitted.`
  ];
  return `${lines.join("\n")}\n`;
}

/** Merchant-safe winning fulfillment mode. Honest empty when none unlocked. No buyer data. */
export function createWinningFulfillmentMarkdown(rawScenario) {
  const market = evaluateMarket(rawScenario);
  const mode = market.winner ? market.winner.offer.fulfillment : "None unlocked";
  return `Winning fulfillment: ${mode}\n`;
}

/** Organizer-private one-line leftover fill. Secondary leftover merchant and counts only. Not tertiary. */
export function createLeftoverFillMarkdown(rawScenario) {
  const coverage = computeResidualCoverage(rawScenario);
  const amount = coverage.secondary
    ? `${coverage.secondary.merchant}, ${coverage.secondary.deliveredBuyers} buyers, ${coverage.secondary.fulfilledUnits} units`
    : "none";
  return `Common Cart leftover fill (organizer private): ${amount}. Not a merchant export.\n`;
}

/** Organizer-private one-line leftover fill unit-count. Count only. Not a merchant export. */
export function createLeftoverFillUnitCountMarkdown(rawScenario) {
  const coverage = computeResidualCoverage(rawScenario);
  const amount = coverage.secondary ? String(coverage.secondary.fulfilledUnits) : "none";
  return `Common Cart leftover fill units (organizer private): ${amount}. Not a merchant export.\n`;
}

/** Merchant-safe remaining capacity on the unlocked winner. Honest empty when none unlocked. No buyer data. */
export function createWinningRemainingCapacityMarkdown(rawScenario) {
  const market = evaluateMarket(rawScenario);
  if (!market.winner) return "Winning remaining capacity: None unlocked\n";
  const remaining = capacityBar(rawScenario, market.winner.offer.id).leftoverUnits;
  return `Winning remaining capacity: ${remaining} units\n`;
}

/** Organizer-private one-line requested units. Count only. Not a merchant export. */
export function createRequestedUnitsMarkdown(rawScenario) {
  const market = evaluateMarket(rawScenario);
  return `Common Cart requested units (organizer private): ${market.totalRequestedUnits}. Not a merchant export.\n`;
}

/** Organizer leftover buyer rows after the winner. Private labels. Not a merchant export. */
export function organizerLeftoverRows(rawScenario) {
  const scenario = validateScenario(rawScenario);
  const coverage = computeResidualCoverage(rawScenario);
  const buyers = new Map(scenario.buyers.map((buyer) => [buyer.id, buyer]));
  const secondary = new Set(coverage.secondary?.selectedBuyerIds ?? []);
  const tertiary = new Set(coverage.tertiary?.selectedBuyerIds ?? []);
  return coverage.leftoverBuyerIds.map((id) => {
    const buyer = buyers.get(id);
    if (secondary.has(id)) {
      return { label: buyer.label, quantity: buyer.quantity, status: "Leftover fill", uncovered: false };
    }
    if (tertiary.has(id)) {
      return { label: buyer.label, quantity: buyer.quantity, status: "Tertiary fill", uncovered: false };
    }
    return { label: buyer.label, quantity: buyer.quantity, status: "Uncovered leftover", uncovered: true };
  });
}

/** Organizer-private winner inspector Markdown. Winning offer label, leftover counts, and residual coverage. */
export function createWinnerInspectorSummaryMarkdown(rawScenario) {
  const market = evaluateMarket(rawScenario);
  const coverage = computeResidualCoverage(rawScenario);
  const winner = market.winner;
  const lines = [
    `# Common Cart winner inspector summary (organizer private)`,
    ``,
    `This Markdown is organizer-private. It is not a merchant export.`,
    ``,
    `## Winning offer`,
    winner
      ? [
        `- Offer: ${winner.offer.merchant} / ${winner.offer.variant}`,
        `- Fulfilled units: ${winner.fulfilledUnits}`,
        `- Included buyers: ${winner.deliveredBuyers}`,
        `- Fulfillment: ${winner.offer.fulfillment}`
      ].join("\n")
      : `- No qualifying offer.`,
    ``,
    `## Leftover after winner`,
    `- Leftover buyers: ${coverage.leftoverBuyerCount}`,
    `- Leftover units: ${coverage.leftoverUnits}`,
    `- Still unfilled buyers: ${coverage.unfilledBuyerCount}`,
    `- Still unfilled units: ${coverage.unfilledUnits}`,
    ``,
    `## Residual coverage`,
    `- ${coverage.note}`,
    coverage.secondary
      ? `- Leftover fill: ${coverage.secondary.merchant} / ${coverage.secondary.variant}, ${coverage.secondary.fulfilledUnits} units, ${coverage.secondary.deliveredBuyers} buyers.`
      : `- Leftover fill: none.`,
    coverage.tertiary
      ? `- Tertiary fill: ${coverage.tertiary.merchant} / ${coverage.tertiary.variant}, ${coverage.tertiary.fulfilledUnits} units, ${coverage.tertiary.deliveredBuyers} buyers.`
      : `- Tertiary fill: none.`,
    ``,
    `Buyer identities, IDs, budgets, and allocations are omitted.`
  ];
  return `${lines.join("\n")}\n`;
}

/** Organizer-private uncovered leftover Markdown. Counts and units only. */
export function createUncoveredLeftoverCountsMarkdown(rawScenario) {
  const coverage = computeResidualCoverage(rawScenario);
  const lines = [
    `# Common Cart uncovered leftover (organizer private)`,
    ``,
    `This Markdown is organizer-private. It is not a merchant export.`,
    ``,
    `- Uncovered leftover buyers: ${coverage.unfilledBuyerCount}`,
    `- Uncovered leftover units: ${coverage.unfilledUnits}`,
    ``,
    `Counts and units only. Labels, IDs, budgets, and allocations are omitted.`
  ];
  return `${lines.join("\n")}\n`;
}

/** Organizer-private one-line uncovered leftover unit-count. Count only. Not a merchant export. */
export function createUncoveredLeftoverUnitCountMarkdown(rawScenario) {
  const coverage = computeResidualCoverage(rawScenario);
  const amount = coverage.leftoverBuyerCount > 0 ? String(coverage.unfilledUnits) : "none";
  return `Common Cart uncovered leftover units (organizer private): ${amount}. Not a merchant export.\n`;
}

export function redactBuyerLabels(rawScenario) {
  const scenario = validateScenario(rawScenario);
  return {
    title: scenario.title,
    currency: scenario.currency,
    buyers: scenario.buyers.map((buyer, index) => ({ ...buyer, label: `Buyer ${index + 1}` })),
    offers: scenario.offers.map((offer) => ({ ...offer, tiers: offer.tiers ? offer.tiers.map((tier) => ({ ...tier })) : offer.tiers }))
  };
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
  if (!Array.isArray(buyers) || buyers.length > MAX_BUYERS) {
    throw new ScenarioError(`Buyers must contain at most ${MAX_BUYERS} entries.`);
  }
  if (!Array.isArray(offers) || offers.length > MAX_OFFERS) {
    throw new ScenarioError(`Offers must contain at most ${MAX_OFFERS} entries.`);
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
  const fulfillmentValue = own(entry, "fulfillment");
  if (fulfillmentValue === undefined) {
    normalized.fulfillment = "shipping";
  } else {
    const fulfillment = requiredText(fulfillmentValue, `${prefix} fulfillment`, 16);
    if (fulfillment !== "shipping" && fulfillment !== "pickup") {
      throw new ScenarioError(`${prefix} fulfillment must be shipping or pickup.`);
    }
    normalized.fulfillment = fulfillment;
  }
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
  const chargedShippingCost = chargedShipping(offerEntry);

  const bands = [{ minimumUnits: offerEntry.minimumUnits, unitPrice: offerEntry.unitPrice }, ...(offerEntry.tiers ?? [])];
  const candidates = bands.map((band, index) => {
    const maximumUnits = Math.min(offerEntry.capacity, (bands[index + 1]?.minimumUnits ?? offerEntry.capacity + 1) - 1);
    const compatibility = scenario.buyers.map((entry) => ({
      buyer: entry,
      reasons: incompatibilityReasons(entry, { ...offerEntry, unitPrice: band.unitPrice, shippingPerBuyer: chargedShippingCost })
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
  const totalCost = qualifies ? (units * evaluatedUnitPrice) + (deliveredBuyers * chargedShippingCost) : 0;
  const reservationValue = qualifies
    ? selected.reduce((sum, entry) => sum + (entry.maxUnitPrice * entry.quantity), 0)
    : 0;
  const savings = Math.max(0, reservationValue - totalCost);
  const totalRequestedUnits = scenario.buyers.reduce((sum, entry) => sum + entry.quantity, 0);
  const selectedIds = new Set(selected.map(({ id }) => id));
  const allocations = qualifies ? selected.map((entry) => {
    const itemsCost = entry.quantity * evaluatedUnitPrice;
    const totalCost = itemsCost + chargedShippingCost;
    const ceilingTotal = entry.quantity * entry.maxUnitPrice;
    return {
      buyerId: entry.id, quantity: entry.quantity, unitPrice: evaluatedUnitPrice,
      itemsCost, shippingCost: chargedShippingCost, totalCost,
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

function chargedShipping(offer) {
  return offer.fulfillment === "pickup" ? 0 : offer.shippingPerBuyer;
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

function residualMatch(title, currency, leftoverBuyers, leftoverOffers) {
  if (leftoverBuyers.length === 0 || leftoverOffers.length === 0) {
    return { summary: null, remaining: leftoverBuyers };
  }
  const residual = evaluateMarket({ title, currency, buyers: leftoverBuyers, offers: leftoverOffers });
  if (!residual.winner) return { summary: null, remaining: leftoverBuyers };
  const summary = coverageOfferSummary(residual.winner);
  summary.selectedBuyerIds = residual.winner.selectedBuyerIds;
  const taken = new Set(residual.winner.selectedBuyerIds);
  return {
    summary,
    remaining: leftoverBuyers.filter((buyer) => !taken.has(buyer.id))
  };
}

/**
 * After the winning offer is chosen, leftover whole-buyer demand may be filled
 * by the next-best other offer, then a third distinct offer, using the same exact
 * allocator. A buyer's quantity is never split across offers.
 */
export function computeResidualCoverage(rawScenario) {
  const market = evaluateMarket(rawScenario);
  const base = { planningAid: true, note: RESIDUAL_PLANNING_NOTE };
  if (!market.winner) {
    return {
      ...base,
      primary: null,
      secondary: null,
      tertiary: null,
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
  const leftoverOffers = market.scenario.offers.filter((offer) => offer.id !== market.winner.offer.id);
  const primary = coverageOfferSummary(market.winner);
  const secondaryMatch = residualMatch(market.scenario.title, market.scenario.currency, leftoverBuyers, leftoverOffers);
  const usedOfferIds = new Set([market.winner.offer.id]);
  if (secondaryMatch.summary) usedOfferIds.add(secondaryMatch.summary.offerId);
  const tertiaryOffers = market.scenario.offers.filter((offer) => !usedOfferIds.has(offer.id));
  const tertiaryMatch = secondaryMatch.summary
    ? residualMatch(market.scenario.title, market.scenario.currency, secondaryMatch.remaining, tertiaryOffers)
    : { summary: null, remaining: leftoverBuyers };
  const unfilledBuyers = tertiaryMatch.remaining;
  return {
    ...base,
    primary,
    secondary: secondaryMatch.summary,
    tertiary: tertiaryMatch.summary,
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
    return incompatibilityReasons(buyer, {
      ...result.offer,
      unitPrice: next.unitPrice,
      shippingPerBuyer: chargedShipping(result.offer)
    }).length === 0;
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

export function capacityBar(rawScenario, offerId) {
  const scenario = validateScenario(rawScenario);
  const result = evaluateOffer(scenario, offerId);
  const gap = unitsToNextTier(scenario, offerId);
  return {
    offerId: result.offer.id,
    merchant: result.offer.merchant,
    filledUnits: result.fulfilledUnits,
    capacity: result.offer.capacity,
    minimumUnits: result.offer.minimumUnits,
    nextTierThreshold: gap.nextMinimum,
    leftoverUnits: Math.max(0, result.offer.capacity - result.fulfilledUnits),
    qualifies: result.qualifies
  };
}

const EXCLUSION_CODES = ["price", "delivery", "variant", "category", "budget", "capacity_leftover", "quantity_vs_capacity", "minimum"];

export function groupExclusionReasons(rawScenario, offerId) {
  const scenario = validateScenario(rawScenario);
  const result = evaluateOffer(scenario, offerId);
  const buyers = new Map(scenario.buyers.map((buyer) => [buyer.id, buyer]));
  const groups = new Map();
  const add = (code, buyerId) => {
    const current = groups.get(code) ?? { code, count: 0, buyerIds: [] };
    current.count += 1;
    current.buyerIds.push(buyerId);
    groups.set(code, current);
  };
  for (const outcome of result.buyerOutcomes) {
    if (outcome.status === "included") continue;
    if (outcome.status === "capacity") {
      const buyer = buyers.get(outcome.buyerId);
      add(buyer && buyer.quantity > result.offer.capacity ? "quantity_vs_capacity" : "capacity_leftover", outcome.buyerId);
      continue;
    }
    if (outcome.status === "minimum") {
      add("minimum", outcome.buyerId);
      continue;
    }
    for (const reason of outcome.reasons) add(reason, outcome.buyerId);
  }
  return EXCLUSION_CODES.filter((code) => groups.has(code)).map((code) => groups.get(code));
}

const EXCLUSION_COUNT_TITLES = {
  price: "Price",
  delivery: "Delivery",
  variant: "Variant",
  category: "Category",
  budget: "Budget",
  capacity_leftover: "Capacity leftover",
  quantity_vs_capacity: "Quantity vs remaining capacity",
  minimum: "Below minimum"
};

/** Merchant-safe exclusion reason counts. Counts only. Omits labels, IDs, budgets, and allocations. */
export function createExclusionCountsMarkdown(rawScenario, offerId) {
  const result = evaluateOffer(rawScenario, offerId);
  const groups = groupExclusionReasons(rawScenario, offerId).map((group) => ({
    code: group.code,
    count: group.count
  }));
  const excludedCount = result.buyerOutcomes.filter((outcome) => outcome.status !== "included").length;
  const lines = [
    `# Common Cart exclusion counts`,
    ``,
    `- Merchant: ${result.offer.merchant}`,
    `- Category: ${result.offer.category}`,
    `- Variant: ${result.offer.variant}`,
    `- Fulfillment: ${result.offer.fulfillment}`,
    `- Included buyers: ${result.deliveredBuyers}`,
    `- Excluded buyers: ${excludedCount}`,
    ``,
    `## Reason counts`,
    ...(groups.length === 0
      ? ["- No buyers are excluded from this offer."]
      : groups.map((group) => `- ${EXCLUSION_COUNT_TITLES[group.code] ?? group.code}: ${group.count}`)),
    ``,
    `These counts omit private buyer labels, IDs, budgets, and allocations.`
  ];
  return `${lines.join("\n")}\n`;
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

export function deliveryHeatmap(rawScenario) {
  const scenario = validateScenario(rawScenario);
  const buckets = [
    { key: "0-3", label: "0 to 3 days", min: 0, max: 3, buyerCount: 0, units: 0 },
    { key: "4-7", label: "4 to 7 days", min: 4, max: 7, buyerCount: 0, units: 0 },
    { key: "8-14", label: "8 to 14 days", min: 8, max: 14, buyerCount: 0, units: 0 },
    { key: "15-30", label: "15 to 30 days", min: 15, max: 30, buyerCount: 0, units: 0 },
    { key: "31-365", label: "31 to 365 days", min: 31, max: 365, buyerCount: 0, units: 0 }
  ];
  for (const buyer of scenario.buyers) {
    const bucket = buckets.find((entry) => buyer.latestDeliveryDays >= entry.min && buyer.latestDeliveryDays <= entry.max);
    bucket.buyerCount += 1;
    bucket.units += buyer.quantity;
  }
  return {
    buyerCount: scenario.buyers.length,
    units: scenario.buyers.reduce((sum, buyer) => sum + buyer.quantity, 0),
    buckets
  };
}

export function createDeliveryHeatmapCsv(rawScenario) {
  const map = deliveryHeatmap(rawScenario);
  const rows = [["Bucket", "Earliest day", "Latest day", "Buyers", "Units"]];
  for (const bucket of map.buckets) {
    rows.push([bucket.label, bucket.min, bucket.max, bucket.buyerCount, bucket.units]);
  }
  rows.push(["All buckets", "", "", map.buyerCount, map.units]);
  return `${rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n")}\r\n`;
}

function buyerAcceptsVariant(buyer, variantKey) {
  return buyer.allowedVariants.some((variant) => normalizeText(variant) === variantKey);
}

/**
 * Merchant-facing counts of buyers whose accepted variants include each
 * offered variant. Pairwise cells count buyers who accept both variants.
 * Buyer labels, IDs, budgets, and allocations are omitted.
 */
export function variantOverlapMatrix(rawScenario) {
  const scenario = validateScenario(rawScenario);
  const offered = [];
  const indexByKey = new Map();
  for (const offer of scenario.offers) {
    const key = normalizeText(offer.variant);
    if (!indexByKey.has(key)) {
      indexByKey.set(key, offered.length);
      offered.push({ key, variant: offer.variant, offerCount: 0 });
    }
    offered[indexByKey.get(key)].offerCount += 1;
  }
  const variants = offered.map((entry) => {
    const matching = scenario.buyers.filter((buyer) => buyerAcceptsVariant(buyer, entry.key));
    return {
      variant: entry.variant,
      offerCount: entry.offerCount,
      buyerCount: matching.length,
      units: matching.reduce((sum, buyer) => sum + buyer.quantity, 0)
    };
  });
  const cells = offered.map((row) => offered.map((column) => {
    const matching = scenario.buyers.filter((buyer) => buyerAcceptsVariant(buyer, row.key) && buyerAcceptsVariant(buyer, column.key));
    return {
      rowVariant: row.variant,
      columnVariant: column.variant,
      buyerCount: matching.length,
      units: matching.reduce((sum, buyer) => sum + buyer.quantity, 0)
    };
  }));
  return { variants, cells };
}

export function createVariantOverlapCsv(rawScenario) {
  const matrix = variantOverlapMatrix(rawScenario);
  const rows = [["Accepted variant", ...matrix.variants.map((entry) => entry.variant)]];
  for (const [index, row] of matrix.cells.entries()) {
    rows.push([matrix.variants[index].variant, ...row.map((cell) => cell.buyerCount)]);
  }
  rows.push([]);
  rows.push(["Variant", "Offers", "Buyers", "Units"]);
  for (const entry of matrix.variants) {
    rows.push([entry.variant, entry.offerCount, entry.buyerCount, entry.units]);
  }
  return `${rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n")}\r\n`;
}

function markdownTableCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

/** Merchant-facing overlap counts as Markdown. Labels, IDs, budgets, and allocations are omitted. */
export function createVariantOverlapMarkdown(rawScenario) {
  const matrix = variantOverlapMatrix(rawScenario);
  const header = ["Accepted variant", ...matrix.variants.map((entry) => entry.variant)].map(markdownTableCell);
  const divider = header.map(() => "---");
  const body = matrix.cells.map((row, index) => [
    markdownTableCell(matrix.variants[index].variant),
    ...row.map((cell) => String(cell.buyerCount))
  ]);
  const totalsHeader = ["Variant", "Offers", "Buyers", "Units"];
  const totals = matrix.variants.map((entry) => [
    markdownTableCell(entry.variant),
    String(entry.offerCount),
    String(entry.buyerCount),
    String(entry.units)
  ]);
  const lines = [
    `# Common Cart variant overlap`,
    ``,
    `Buyer counts whose accepted variants include each offered variant. Pairwise cells are overlaps. Labels, IDs, budgets, and allocations are omitted.`,
    ``,
    `| ${header.join(" | ")} |`,
    `| ${divider.join(" | ")} |`,
    ...body.map((row) => `| ${row.join(" | ")} |`),
    ``,
    `| ${totalsHeader.join(" | ")} |`,
    `| ${totalsHeader.map(() => "---").join(" | ")} |`,
    ...totals.map((row) => `| ${row.join(" | ")} |`),
    ``
  ];
  return `${lines.join("\n")}\n`;
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

export function encodeRedactedScenario(rawScenario) {
  return encodeScenario(redactBuyerLabels(rawScenario));
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


export const CART_REVIEW_TOOLS = Object.freeze([
  { id: "minimum", title: "Minimum-order relaxation preview" },
  { id: "capacity", title: "Capacity increase previews" },
  { id: "delivery", title: "Delivery slack by included order" },
  { id: "shipping", title: "Shipping exposure and headroom" },
  { id: "withdrawal", title: "Winner withdrawal stress" },
  { id: "frontier", title: "Same-cohort offer alternatives" },
  { id: "stranded", title: "Unserved buyer reasons" },
  { id: "dependency", title: "Sole-offer dependency" },
  { id: 'coverage', title: 'Buyer option coverage' },
]);

/** On-demand organizer analysis. Never changes matching inputs or places orders. */
export function analyzeCartReview(rawScenario, tool) {
  const scenario = validateScenario(rawScenario);
  const selected = CART_REVIEW_TOOLS.find((entry) => entry.id === tool);
  if (!selected) throw new ScenarioError('Choose a supported organizer review.');
  const market = evaluateMarket(scenario);
  const qualified = market.results.filter((result) => result.qualifies);
  const report = (columns, rows, note) => ({ tool, title: selected.title, currency: scenario.currency, columns, rows, note });
  switch (tool) {
    case 'coverage':
      return report(['Private buyer', 'Requested units', 'Offers including this buyer', 'Merchant options'], scenario.buyers.map((buyer) => {
        const options = qualified.filter((result) => result.selectedBuyerIds.includes(buyer.id));
        return [buyer.label, buyer.quantity, options.length, options.map((result) => result.offer.merchant).join(', ') || 'None'];
      }), 'Counts use the actual whole-order allocation of each offer in this room. Offers are alternatives, not simultaneous purchases; no inventory is reserved.');
    case "dependency": {
      return report(['Merchant', 'Buyers with no other allocated option', 'Dependent units'], qualified.map((result) => {
        const dependent = scenario.buyers.filter((buyer) => result.selectedBuyerIds.includes(buyer.id) && !qualified.some((other) => other.offer.id !== result.offer.id && other.selectedBuyerIds.includes(buyer.id)));
        return [result.offer.merchant, dependent.length, dependent.reduce((sum, buyer) => sum + buyer.quantity, 0)];
      }), 'Dependency is measured against current allocated cohorts. Removing an offer may change other allocations; this is an exposure count, not a forecast.');
    }
    case "stranded": {
      return report(['Private buyer', 'Requested units', 'Current reasons across offers'], scenario.buyers.filter((buyer) => !qualified.some((result) => result.selectedBuyerIds.includes(buyer.id))).map((buyer) => {
        const counts = new Map();
        for (const result of market.results) for (const reason of result.buyerOutcomes.find((outcome) => outcome.buyerId === buyer.id).reasons) counts.set(reason, (counts.get(reason) ?? 0) + 1);
        return [buyer.label, buyer.quantity, [...counts].sort(([a], [b]) => compareText(a, b)).map(([reason, count]) => reason + ': ' + count).join('; ') || 'No offers'];
      }), 'Shows buyers included by no current qualified offer. Reasons describe the evaluated price band of each offer; relaxing a reason does not guarantee qualification.');
    }
    case "frontier": {
      const cohort = (result) => JSON.stringify([...result.selectedBuyerIds].sort());
      return report(['Merchant', 'Units', 'Landed total', 'Delivery days', 'Strictly better same-cohort alternatives'], qualified.map((result) => {
        const better = qualified.filter((other) => other.offer.id !== result.offer.id && cohort(other) === cohort(result) && other.totalCost <= result.totalCost && other.offer.deliveryDays <= result.offer.deliveryDays && (other.totalCost < result.totalCost || other.offer.deliveryDays < result.offer.deliveryDays));
        return [result.offer.merchant, result.fulfilledUnits, result.totalCost, result.offer.deliveryDays, better.map((other) => other.offer.merchant).join(', ') || 'None on these measures'];
      }), 'Compares landed cost and delivery only for exactly the same allocated buyer IDs. Different cohorts, merchant quality, and unmodeled terms are not ranked as equivalent.');
    }
    case "withdrawal": {
      if (!market.winner) return report(['Withdrawn buyer', 'Withdrawn units', 'Other originally served units', 'Other original units still served', 'Other original units lost'], [], 'No qualified winner exists to stress.');
      const winning = market.winner;
      return report(['Withdrawn buyer', 'Withdrawn units', 'Other originally served units', 'Other original units still served', 'Other original units lost'], scenario.buyers.filter((buyer) => winning.selectedBuyerIds.includes(buyer.id)).map((buyer) => {
        const remaining = { ...scenario, buyers: scenario.buyers.filter((entry) => entry.id !== buyer.id) };
        const result = evaluateOffer(remaining, winning.offer.id);
        const originalOther = scenario.buyers.filter((entry) => entry.id !== buyer.id && winning.selectedBuyerIds.includes(entry.id));
        const originalUnits = originalOther.reduce((sum, entry) => sum + entry.quantity, 0);
        const retained = originalOther.filter((entry) => result.selectedBuyerIds.includes(entry.id)).reduce((sum, entry) => sum + entry.quantity, 0);
        return [buyer.label, buyer.quantity, originalUnits, retained, originalUnits - retained];
      }), 'Rematches only the current winning offer after one included buyer withdraws. Other buyers can fill freed capacity. Lost units exclude the withdrawn order; this is not a withdrawal probability.');
    }
    case "shipping": {
      return report(['Merchant', 'Included buyers', 'Shipping total', 'Landed total', 'Shipping share (%)', 'Item ceilings exceeded after shipping', 'Least remaining ceiling'], qualified.map((result) => {
        const shipping = result.allocations.reduce((sum, allocation) => sum + allocation.shippingCost, 0);
        const headrooms = result.allocations.map((allocation) => {
          const buyer = scenario.buyers.find((entry) => entry.id === allocation.buyerId);
          return Math.min(buyer.quantity * buyer.maxUnitPrice, buyer.maxOrderTotal ?? Infinity) - allocation.totalCost;
        });
        return [result.offer.merchant, result.deliveredBuyers, shipping, result.totalCost, result.totalCost > 0 ? shipping / result.totalCost * 100 : null, result.allocations.filter((allocation) => allocation.exceedsCeilingAfterShipping).length, Math.min(...headrooms)];
      }), 'Pickup shipping is zero. Item-price ceilings and optional landed-order budgets remain different constraints; negative item-ceiling headroom is shown honestly. A zero landed total has no shipping percentage.');
    }
    case "delivery": {
      return report(['Merchant', 'Private buyer', 'Units', 'Delivery days', 'Buyer deadline days', 'Remaining days'], qualified.flatMap((result) => result.allocations.map((allocation) => {
        const buyer = scenario.buyers.find((entry) => entry.id === allocation.buyerId);
        return [result.offer.merchant, buyer.label, buyer.quantity, result.offer.deliveryDays, buyer.latestDeliveryDays, buyer.latestDeliveryDays - result.offer.deliveryDays];
      })), 'Slack is the declared buyer deadline minus promised delivery for included orders. Zero slack means no modeled delay tolerance; this is not a delivery reliability estimate.');
    }
    case "capacity": {
      return report(['Merchant', 'Current capacity', 'Preview capacity', 'Current fulfilled units', 'Preview fulfilled units', 'Unit difference'], market.ranked.slice(0, 5).flatMap((original) => {
        const capacities = [...new Set([0.1, 0.25, 0.5].map((factor) => Math.min(MAX_UNITS, original.offer.capacity + Math.max(1, Math.ceil(original.offer.capacity * factor)))))] .filter((capacity) => capacity > original.offer.capacity);
        return capacities.map((capacity) => {
          const result = evaluateOffer(scenario, { ...original.offer, capacity });
          return [original.offer.merchant, original.offer.capacity, capacity, original.fulfilledUnits, result.fulfilledUnits, result.fulfilledUnits - original.fulfilledUnits];
        });
      }), 'Preview the first five currently ranked offers at capacity increases of 10%, 25%, and 50%, rounded up and capped at 5,000. Duplicate capacities are omitted. Prices, tiers, demand, and all other terms stay fixed; no merchant capacity is verified.');
    }
    case "minimum": {
      return report(['Merchant', 'Current base minimum', 'Preview base minimum', 'Current fulfilled units', 'Preview fulfilled units', 'Preview included buyers'], market.results.map((original) => {
        const result = evaluateOffer(scenario, { ...original.offer, minimumUnits: 1 });
        return [original.offer.merchant, original.offer.minimumUnits, 1, original.fulfilledUnits, result.fulfilledUnits, result.deliveredBuyers];
      }), 'Counterfactual only: set the base minimum to one unit while preserving capacity, prices, tier thresholds, shipping, and buyer constraints. This does not imply that a merchant will agree.');
    }
    default: throw new ScenarioError('Review is unavailable.');
  }
}


export function createCartReviewPacket(rawScenario, tool) {
  const scenario = validateScenario(rawScenario);
  const packet = { format: 'common-cart-review', version: 1, tool, scenario, inputJSON: JSON.stringify(scenario), review: analyzeCartReview(scenario, tool) };
  if (new TextEncoder().encode(JSON.stringify(packet)).length > 1048576) throw new ScenarioError('Review packet exceeds 1 MiB. Choose a narrower review.');
  return packet;
}

export function replayCartReviewPacket(candidate) {
  const fields = ['format', 'version', 'tool', 'scenario', 'inputJSON', 'review'];
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate) || Object.keys(candidate).length !== fields.length || !fields.every((field) => Object.hasOwn(candidate, field)) || candidate.format !== 'common-cart-review' || candidate.version !== 1) throw new ScenarioError('Unsupported review packet.');
  const current = createCartReviewPacket(candidate.scenario, candidate.tool);
  if (candidate.inputJSON !== current.inputJSON) throw new ScenarioError('Review input snapshot changed. Run a new review.');
  const supplied = candidate.review, expected = current.review;
  if (!supplied || typeof supplied !== 'object' || Array.isArray(supplied) || Object.keys(supplied).length !== Object.keys(expected).length || !Object.keys(expected).every((field) => Object.hasOwn(supplied, field))) throw new ScenarioError('Review result fields changed.');
  for (const field of ['tool', 'title', 'currency', 'note']) if (supplied[field] !== expected[field]) throw new ScenarioError('Review result does not match the input snapshot.');
  if (!Array.isArray(supplied.columns) || supplied.columns.length !== expected.columns.length || expected.columns.some((value, index) => !Object.hasOwn(supplied.columns, index) || supplied.columns[index] !== value) || !Array.isArray(supplied.rows) || supplied.rows.length !== expected.rows.length || expected.rows.some((row, index) => !Object.hasOwn(supplied.rows, index) || !Array.isArray(supplied.rows[index]) || supplied.rows[index].length !== row.length || row.some((value, column) => !Object.hasOwn(supplied.rows[index], column) || supplied.rows[index][column] !== value))) throw new ScenarioError('Review result does not match the input snapshot.');
  return current;
}
