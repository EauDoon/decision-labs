import test from "node:test";
import assert from "node:assert/strict";
import {
  ScenarioError,
  clonePreset,
  importBuyersFromCsv,
  importBuyersFromTable,
  importOffersFromCsv,
  parseBuyerCsv,
  parseOfferCsv
} from "../src/model.js";

const BUYER_HEADER = "label,category,quantity,max unit price,latest delivery days,variants";
const OFFER_HEADER = "name,capacity,unit price,shipping,fulfillment,variants";

test("surplus CSV and TSV cells cannot silently replace a room with shifted or truncated data", () => {
  const scenario = clonePreset("neighbourhood");
  const before = structuredClone(scenario);
  // The unquoted thousands separator previously changed price 2000 to 2,
  // delivery 7 to 0, and the accepted variant to "7" without an error.
  const buyerCsv = `${BUYER_HEADER}\nKitchen,Coffee beans,1,2,000,7,Medium roast\n`;
  for (const [importer, text] of [
    [importBuyersFromCsv, buyerCsv],
    [importBuyersFromTable, buyerCsv],
    [importBuyersFromTable, `${BUYER_HEADER.replaceAll(",", "\t")}\nKitchen\tCoffee beans\t1\t2000\t7\tMedium roast\tExtra\n`],
    [importOffersFromCsv, `${OFFER_HEADER}\nHarbour,20,26,2,shipping,Medium roast,Extra\n`]
  ]) {
    assert.throws(() => importer(scenario, text), {
      name: "ScenarioError",
      message: /row 2 has 7 columns.*header has 6/i
    });
    assert.deepEqual(scenario, before);
  }
});

test("quoted delimiters and omitted optional trailing cells retain their meaning", () => {
  const [buyer] = parseBuyerCsv(`${BUYER_HEADER},max order total\n"Kitchen, north",Coffee beans,1,"2,000",7,"Medium roast, Dark roast"\n`);
  assert.equal(buyer.label, "Kitchen, north");
  assert.equal(buyer.maxUnitPrice, 2000);
  assert.deepEqual(buyer.allowedVariants, ["Medium roast", "Dark roast"]);
  assert.equal(Object.hasOwn(buyer, "maxOrderTotal"), false);
  const [offer] = parseOfferCsv(`${OFFER_HEADER},minimum,delivery\n"Harbour, north",20,26,2,shipping,"Medium, roast"\n`);
  assert.equal(offer.merchant, "Harbour, north");
  assert.equal(offer.variant, "Medium, roast");
  assert.equal(offer.minimumUnits, 1);
  assert.equal(offer.deliveryDays, 7);
  assert.throws(() => parseBuyerCsv(`${BUYER_HEADER}\nKitchen,Coffee beans,1,2000,7\n`), ScenarioError);
});
