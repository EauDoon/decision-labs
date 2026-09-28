import test from "node:test";
import assert from "node:assert/strict";
import { parseBuyerCsv, parseOfferCsv } from "../src/model.js";

const BUYER_HEADER = "label,category,quantity,max unit price,latest delivery days,variants";
const OFFER_HEADER = "name,capacity,unit price,shipping,fulfillment,variants";

test("an interior quotation mark stays in an unquoted buyer label and offer name", () => {
  // A quote in the middle of a cell used to start quote mode and then get
  // discarded, so Cafe "North" imported as Cafe North.
  const buyers = parseBuyerCsv(`${BUYER_HEADER}\nCafe "North",Pantry box,8,52,5,Standard\n`);
  assert.equal(buyers[0].label, 'Cafe "North"');
  assert.equal(buyers[0].quantity, 8);

  const offers = parseOfferCsv(`${OFFER_HEADER}\nCafe "North",20,26,2,shipping,Roast\n`);
  assert.equal(offers[0].merchant, 'Cafe "North"');
  assert.equal(offers[0].capacity, 20);
});

test("a field that starts with a quote still unquotes and keeps an escaped quote", () => {
  const buyers = parseBuyerCsv(`${BUYER_HEADER}\n"Cafe ""North""",Pantry box,8,52,5,Standard\n`);
  assert.equal(buyers[0].label, 'Cafe "North"');

  const offers = parseOfferCsv(`${OFFER_HEADER}\n"Hall, north",20,26,2,shipping,"Medium roast"\n`);
  assert.equal(offers[0].merchant, "Hall, north");
  assert.equal(offers[0].variant, "Medium roast");
});
