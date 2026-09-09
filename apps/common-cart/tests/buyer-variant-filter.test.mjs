import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ScenarioError,
  acceptedVariantFilterOptions,
  clonePreset,
  filterBuyerIdsByAcceptedVariant,
  evaluateMarket
} from "../src/model.js";

test("buyer variant filter returns ids without changing saved buyer order", () => {
  const scenario = clonePreset("neighbourhood");
  const original = scenario.buyers.map((buyer) => buyer.id);
  const all = filterBuyerIdsByAcceptedVariant(scenario, "all");
  const medium = filterBuyerIdsByAcceptedVariant(scenario, "Medium roast");
  const dark = filterBuyerIdsByAcceptedVariant(scenario, "Dark roast");
  assert.deepEqual(all, original);
  assert.deepEqual(medium, ["B01", "B02", "B03", "B05"]);
  assert.deepEqual(dark, ["B01", "B03", "B04"]);
  assert.deepEqual(scenario.buyers.map((buyer) => buyer.id), original);
  assert.equal(evaluateMarket(scenario).winner?.offer.id, "O01");
});

test("buyer variant filter matches normalized spellings and lists distinct options", () => {
  const scenario = clonePreset("neighbourhood");
  assert.deepEqual(acceptedVariantFilterOptions(scenario), ["Dark roast", "Medium roast"]);
  assert.deepEqual(filterBuyerIdsByAcceptedVariant(scenario, "medium roast"), ["B01", "B02", "B03", "B05"]);
  const options = acceptedVariantFilterOptions(scenario);
  options[0] = "Mutated";
  assert.deepEqual(acceptedVariantFilterOptions(scenario), ["Dark roast", "Medium roast"]);
});

test("buyer variant filter rejects unknown modes and prototype-like values", () => {
  const scenario = clonePreset("studio");
  assert.throws(() => filterBuyerIdsByAcceptedVariant(scenario, ""), /all or an accepted variant name/);
  assert.throws(() => filterBuyerIdsByAcceptedVariant(scenario, { constructor: "Black" }), ScenarioError);
  assert.throws(() => filterBuyerIdsByAcceptedVariant(scenario, 12), /all or an accepted variant name/);
  assert.deepEqual(filterBuyerIdsByAcceptedVariant(scenario, "__proto__"), []);
  assert.deepEqual(filterBuyerIdsByAcceptedVariant(scenario, "constructor"), []);
});

test("the buyer room has an organizer-only accepted variant filter", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="buyer-variant-filter"/u);
  assert.match(buyerPanel, /<option value="all">All<\/option>/u);
  assert.match(buyerPanel, /Merchant views still show counts only/u);
  assert.equal(merchantPanel.includes("buyer-variant-filter"), false);
  assert.match(app, /function applyBuyerVariantFilter\(/u);
  assert.match(app, /row\.hidden/u);
});
