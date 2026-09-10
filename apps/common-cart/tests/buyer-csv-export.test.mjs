import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  clonePreset,
  createOrganizerBuyerCsv,
  importBuyersFromCsv,
  neutralizeSpreadsheetCell,
  validateScenario
} from "../src/model.js";

test("organizer buyer CSV uses import columns and round-trips through import", () => {
  const original = clonePreset("neighbourhood");
  original.buyers[0].maxOrderTotal = 400;
  original.buyers[1].label = "Hall, north";
  const csv = createOrganizerBuyerCsv(original);
  assert.match(csv, /^"label","category","quantity","max unit price","latest delivery days","variants","max order total"\r\n/u);
  assert.match(csv, /"North block"/);
  assert.match(csv, /"Hall, north"/);
  assert.match(csv, /"400"/);
  assert.equal(csv.endsWith("\r\n"), true);
  const imported = importBuyersFromCsv(original, csv);
  assert.equal(imported.buyers.length, original.buyers.length);
  assert.deepEqual(imported.buyers.map((buyer) => buyer.label), ["North block", "Hall, north", "Library crew", "Station flats", "West court"]);
  assert.deepEqual(imported.buyers.map((buyer) => buyer.category), original.buyers.map((buyer) => buyer.category));
  assert.deepEqual(imported.buyers.map((buyer) => buyer.quantity), original.buyers.map((buyer) => buyer.quantity));
  assert.deepEqual(imported.buyers.map((buyer) => buyer.maxUnitPrice), original.buyers.map((buyer) => buyer.maxUnitPrice));
  assert.deepEqual(imported.buyers.map((buyer) => buyer.latestDeliveryDays), original.buyers.map((buyer) => buyer.latestDeliveryDays));
  assert.deepEqual(imported.buyers.map((buyer) => buyer.allowedVariants), original.buyers.map((buyer) => buyer.allowedVariants));
  assert.equal(imported.buyers[0].maxOrderTotal, 400);
  assert.equal(Object.hasOwn(imported.buyers[1], "maxOrderTotal"), false);
  assert.deepEqual(imported.offers.map((offer) => offer.id), original.offers.map((offer) => offer.id));
  assert.equal(original.buyers[0].label, "North block");
  validateScenario(imported);
});

test("organizer buyer CSV is formula-safe and keeps private organizer rows", () => {
  const scenario = clonePreset("studio");
  scenario.buyers[0].label = '=HYPERLINK("x")';
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const csv = createOrganizerBuyerCsv(scenario);
  assert.match(csv, /"'=HYPERLINK\(""x""\)"/);
  assert.equal(neutralizeSpreadsheetCell("'=HYPERLINK(\"x\")"), '=HYPERLINK("x")');
  assert.match(csv, /"987654.32"/);
  assert.doesNotMatch(csv, /^"id"/u);
});

test("organizer buyer CSV export is labeled private in the buyer room", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="export-buyers-csv"/u);
  assert.match(buyerPanel, /Export organizer buyer CSV/u);
  assert.equal(merchantPanel.includes("export-buyers-csv"), false);
  assert.match(app, /createOrganizerBuyerCsv\(/u);
  assert.match(app, /This is not a merchant export/u);
});
