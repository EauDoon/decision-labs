import test from "node:test";
import assert from "node:assert/strict";
import { importBuyersFromTable, parseBuyerCsv, parseOfferCsv } from "../src/model.js";
import { clonePreset } from "../src/model.js";

const BUYER_HEADER = "label,category,quantity,max unit price,latest delivery days,variants,max order total";
const OFFER_HEADER = "name,capacity,unit price,shipping,fulfillment,variants";

test("buyer and offer CSV with CR-only line endings keep one row per record", () => {
  // Classic Mac and some spreadsheet exports separate records with CR and no LF.
  // The parser used to discard those CRs, so the header and every buyer landed
  // in one row and the import reported that the file had no buyers.
  const buyers = parseBuyerCsv(
    `${BUYER_HEADER}\rKitchen one,Pantry box,8,52,5,Standard,\rKitchen two,Pantry box,3,40,6,Standard,\r`
  );
  assert.equal(buyers.length, 2);
  assert.equal(buyers[0].label, "Kitchen one");
  assert.equal(buyers[0].quantity, 8);
  assert.equal(buyers[1].label, "Kitchen two");
  assert.equal(buyers[1].quantity, 3);

  const offers = parseOfferCsv(
    `${OFFER_HEADER}\rHarbour Roasters,20,26,2,shipping,Medium roast\rYard Pickup,24,142,18,pickup,Metric\r`
  );
  assert.equal(offers.length, 2);
  assert.equal(offers[0].merchant, "Harbour Roasters");
  assert.equal(offers[1].fulfillment, "pickup");

  const pasted = importBuyersFromTable(
    clonePreset("neighbourhood"),
    "label\tcategory\tquantity\tmax unit price\tlatest delivery days\tvariants\tmax order total\rKitchen one\tPantry box\t8\t52\t5\tStandard\t\r"
  );
  assert.equal(pasted.buyers.length, 1);
  assert.equal(pasted.buyers[0].label, "Kitchen one");
  assert.equal(pasted.offers.length, clonePreset("neighbourhood").offers.length);
});
