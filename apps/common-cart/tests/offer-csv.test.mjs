import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ScenarioError,
  clonePreset,
  createOfferCsv,
  importOffersFromCsv,
  neutralizeSpreadsheetCell,
  offerCsvTemplate,
  parseOfferCsv,
  validateScenario
} from "../src/model.js";

const HEADER = "name,capacity,unit price,shipping,fulfillment,variants";

test("offer CSV import replaces offers and keeps existing buyers", () => {
  const csv = `${HEADER}\r\nHarbour Roasters,20,26,2,shipping,Medium roast\r\nYard Pickup,24,142,18,pickup,Metric\r\n`;
  const imported = importOffersFromCsv(clonePreset("neighbourhood"), csv);
  assert.equal(imported.offers.length, 2);
  assert.equal(imported.offers[0].merchant, "Harbour Roasters");
  assert.equal(imported.offers[0].capacity, 20);
  assert.equal(imported.offers[0].unitPrice, 26);
  assert.equal(imported.offers[0].shippingPerBuyer, 2);
  assert.equal(imported.offers[0].fulfillment, "shipping");
  assert.equal(imported.offers[0].variant, "Medium roast");
  assert.equal(imported.offers[1].fulfillment, "pickup");
  assert.equal(imported.offers[1].variant, "Metric");
  assert.equal(imported.buyers[0].id, clonePreset("neighbourhood").buyers[0].id);
  assert.equal(imported.offers[0].id, "O01");
  assert.equal(imported.offers[1].id, "O02");
  assert.equal(imported.offers[0].category, "Coffee beans");
  assert.equal(imported.offers[0].minimumUnits, 1);
  assert.equal(imported.offers[0].deliveryDays, 7);
});

test("offer CSV import strips spreadsheet formula prefixes like export", () => {
  const csv = `${HEADER}\n"'=HYPERLINK(""x"")",20,26,2,shipping,Medium roast\n`;
  const offers = parseOfferCsv(csv);
  assert.equal(offers[0].merchant, '=HYPERLINK("x")');
  assert.equal(neutralizeSpreadsheetCell("'+cmd"), "+cmd");
});

test("offer CSV import names missing columns and invalid values", () => {
  assert.throws(() => parseOfferCsv(""), /empty/);
  assert.throws(() => parseOfferCsv("name,capacity\nA,1\n"), /must include name, capacity, unit price/);
  assert.throws(() => parseOfferCsv(`${HEADER}\nOnly hall,not-a-number,26,2,shipping,Medium roast\n`), /CSV offer 1/);
  assert.throws(() => parseOfferCsv(`${HEADER}\nOnly hall,20,26,2,drone,Medium roast\n`), /CSV offer 1: fulfillment must be shipping or pickup/);
  assert.throws(() => parseOfferCsv(`${HEADER}\n`), /header row and at least one offer/);
  assert.throws(() => parseOfferCsv("note,capacity,unit price,shipping,fulfillment,variants\nA,1,2,3,shipping,C\n"), /unknown column: note/);
});

test("offer CSV import accepts quoted commas and rejects an unclosed quote", () => {
  const csv = `${HEADER}\n"Hall, north",20,26,2,shipping,"Medium roast"\n`;
  const offers = parseOfferCsv(csv);
  assert.equal(offers[0].merchant, "Hall, north");
  assert.throws(() => parseOfferCsv(`${HEADER}\n"open,20,26,2,shipping,Medium roast\n`), /unclosed quote/);
});

test("offer CSV import does not mutate the source scenario until validation succeeds", () => {
  const original = clonePreset("studio");
  const before = JSON.stringify(original);
  assert.throws(() => importOffersFromCsv(original, `${HEADER}\nBad,5001,10,1,shipping,Black\n`), ScenarioError);
  assert.equal(JSON.stringify(original), before);
  const ok = importOffersFromCsv(original, `${HEADER}\nForm Office,20,218,18,shipping,Black\n`);
  assert.equal(ok.offers.length, 1);
  assert.equal(original.offers.length, 3);
  validateScenario(ok);
});

test("offer CSV template is a valid header for a later import", () => {
  const template = offerCsvTemplate();
  assert.match(template, /^name,capacity,unit price,shipping,fulfillment,variants\r\n$/);
  const row = `${template}Harbour Roasters,20,26,2,shipping,Medium roast\r\n`;
  const offers = parseOfferCsv(row);
  assert.equal(offers.length, 1);
  assert.equal(offers[0].merchant, "Harbour Roasters");
});

test("offer CSV rejects prototype defaults and unknown default keys", () => {
  assert.throws(() => parseOfferCsv(`${HEADER}\nA,20,26,2,shipping,Medium roast\n`, { extra: "nope" }), /unexpected field: extra/);
  assert.throws(() => parseOfferCsv(`${HEADER}\nA,20,26,2,shipping,Medium roast\n`, { constructor: "Product" }), /unexpected field: constructor/);
});

test("offer CSV export is formula-safe and omits buyer private fields", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.buyers[0].label = "SECRET_LABEL";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  scenario.offers[0].merchant = "=HYPERLINK(\"x\")";
  const csv = createOfferCsv(scenario);
  assert.match(csv, /^"name","capacity","unit price","shipping","fulfillment","variants"\r\n/u);
  assert.match(csv, /"'=HYPERLINK\(""x""\)"/);
  assert.equal(csv.includes("SECRET_LABEL"), false);
  assert.equal(csv.includes("SECRET_ID"), false);
  assert.equal(csv.includes("987654.32"), false);
  assert.equal(csv.includes("maxUnitPrice"), false);
  assert.equal(csv.includes("selectedBuyerIds"), false);
  assert.equal(csv.includes("allocations"), false);
  assert.equal(csv.includes("leftoverBuyerIds"), false);
  assert.equal(csv.endsWith("\r\n"), true);
});

test("exported offer CSV round-trips through import without changing buyers", () => {
  const original = clonePreset("hardware");
  const csv = createOfferCsv(original);
  const imported = importOffersFromCsv(original, csv);
  assert.equal(imported.offers.length, original.offers.length);
  assert.deepEqual(imported.offers.map((offer) => offer.merchant), original.offers.map((offer) => offer.merchant));
  assert.deepEqual(imported.offers.map((offer) => offer.capacity), original.offers.map((offer) => offer.capacity));
  assert.deepEqual(imported.offers.map((offer) => offer.unitPrice), original.offers.map((offer) => offer.unitPrice));
  assert.deepEqual(imported.offers.map((offer) => offer.fulfillment), ["shipping", "shipping", "pickup"]);
  assert.deepEqual(imported.buyers.map((buyer) => buyer.id), original.buyers.map((buyer) => buyer.id));
  assert.equal(original.offers[0].merchant, "Forge & Co");
});

test("the merchant table can export offer CSV", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="export-offers-csv"/u);
  assert.match(html, /Export offer CSV/u);
  assert.match(app, /createOfferCsv\(/u);
  assert.match(app, /Buyer labels, IDs, budgets, and allocations are omitted/u);
});
