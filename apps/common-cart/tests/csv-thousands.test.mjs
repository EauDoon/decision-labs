import test from "node:test";
import assert from "node:assert/strict";
import { parseBuyerCsv, parseOfferCsv } from "../src/model.js";

const BUYER_HEADER = "label,category,quantity,max unit price,latest delivery days,variants,max order total";
const OFFER_HEADER = "name,capacity,unit price,shipping,fulfillment,variants";

test("quoted thousands separators are numbers in buyer and offer CSV", () => {
  // A spreadsheet cell of 1,000 is quoted so the comma is not a column break.
  // Number("1,000") is NaN, so the import rejected a real quantity and price.
  const buyers = parseBuyerCsv(`${BUYER_HEADER}\nKitchen one,Pantry box,"1,000","1,000.50",5,Standard,"2,500"\n`);
  assert.equal(buyers[0].quantity, 1000);
  assert.equal(buyers[0].maxUnitPrice, 1000.5);
  assert.equal(buyers[0].maxOrderTotal, 2500);

  const spaced = parseBuyerCsv(`${BUYER_HEADER}\nKitchen one,Pantry box,"1\u00A0000",52,5,Standard,\n`);
  assert.equal(spaced[0].quantity, 1000);

  const offers = parseOfferCsv(`${OFFER_HEADER}\nHarbour,"1,000","1,250.75",2,shipping,Roast\n`);
  assert.equal(offers[0].capacity, 1000);
  assert.equal(offers[0].unitPrice, 1250.75);
});

test("a malformed group and a plain integer stay on their existing paths", () => {
  assert.throws(
    () => parseBuyerCsv(`${BUYER_HEADER}\nKitchen one,Pantry box,"1,00",52,5,Standard,\n`),
    /quantity must be a number/
  );
  const buyers = parseBuyerCsv(`${BUYER_HEADER}\nKitchen one,Pantry box,8,52,5,Standard,\n`);
  assert.equal(buyers[0].quantity, 8);
  assert.equal(buyers[0].maxUnitPrice, 52);
});
