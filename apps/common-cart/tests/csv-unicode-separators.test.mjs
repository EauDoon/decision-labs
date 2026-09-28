import test from "node:test";
import assert from "node:assert/strict";
import { parseBuyerCsv, parseBuyerTable, parseOfferCsv } from "../src/model.js";

const BUYER_HEADER = "label,category,quantity,max unit price,latest delivery days,variants";
const BUYER_ONE = "Kitchen one,Pantry box,8,52,5,Standard";
const BUYER_TWO = "Kitchen two,Pantry box,2,40,3,Standard";
const OFFER_HEADER = "name,capacity,unit price,shipping,fulfillment,variants";

test("unicode line and paragraph separators end buyer and offer records", () => {
  // U+2028 and U+2029 are line breaks in JavaScript source and in some
  // spreadsheet pastes. Treating them as ordinary characters joined the header
  // to the first buyer, so the import said the file had no data rows.
  for (const separator of ["\u2028", "\u2029"]) {
    const buyers = parseBuyerCsv(`${BUYER_HEADER}${separator}${BUYER_ONE}${separator}${BUYER_TWO}`);
    assert.deepEqual(buyers.map((buyer) => buyer.label), ["Kitchen one", "Kitchen two"]);
    assert.equal(buyers[0].quantity, 8);
    assert.equal(buyers[1].quantity, 2);

    const offers = parseOfferCsv(`${OFFER_HEADER}${separator}Harbour,20,26,2,shipping,Roast${separator}Yard,10,12,1,pickup,Bean`);
    assert.deepEqual(offers.map((offer) => offer.merchant), ["Harbour", "Yard"]);
    assert.equal(offers[0].capacity, 20);
    assert.equal(offers[1].fulfillment, "pickup");
  }
});

test("a quoted unicode line separator stays inside the buyer label", () => {
  const buyers = parseBuyerCsv(`${BUYER_HEADER}\n"Kitchen\u2028one",Pantry box,8,52,5,Standard\n`);
  assert.equal(buyers.length, 1);
  assert.equal(buyers[0].label, "Kitchen\u2028one");
  assert.equal(buyers[0].quantity, 8);
});

test("a buyer TSV separated only by a unicode line separator still imports", () => {
  const tsv = `label\tcategory\tquantity\tmax unit price\tlatest delivery days\tvariants\u2028Kitchen one\tPantry box\t8\t52\t5\tStandard`;
  const buyers = parseBuyerTable(tsv);
  assert.equal(buyers.length, 1);
  assert.equal(buyers[0].label, "Kitchen one");
  assert.equal(buyers[0].quantity, 8);
});
