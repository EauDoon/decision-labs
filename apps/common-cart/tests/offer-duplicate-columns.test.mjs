import test from "node:test";
import assert from "node:assert/strict";
import { parseOfferCsv } from "../src/model.js";

const HEADER = "name,capacity,unit price,shipping,fulfillment,variants";

test("offer CSV rejects a repeated column instead of keeping the later value", () => {
  // A second capacity column used to overwrite the first. The offer then had
  // capacity 99 with no error. Aliases such as price and unit price name the
  // same field and are the same repeat.
  const repeated = `${HEADER},capacity\nHarbour,20,26,2,shipping,Roast,99\n`;
  assert.throws(() => parseOfferCsv(repeated), /Offer CSV column capacity repeats capacity/);

  const alias = "name,capacity,price,shipping,fulfillment,variants,unit price\nHarbour,20,26,2,shipping,Roast,99\n";
  assert.throws(() => parseOfferCsv(alias), /Offer CSV column unit price repeats price/);
});

test("offer CSV still imports one column per field", () => {
  const offers = parseOfferCsv(`${HEADER}\nHarbour,20,26,2,shipping,Roast\n`);
  assert.equal(offers[0].capacity, 20);
  assert.equal(offers[0].unitPrice, 26);
});
