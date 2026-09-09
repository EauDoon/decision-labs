import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { clonePreset, organizerBuyerVariantCounts } from "../src/model.js";

test("organizer buyer variant counts group accepted variants without private fields", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.buyers[0].label = "SECRET_LABEL";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const groups = organizerBuyerVariantCounts(scenario);
  assert.deepEqual(groups.map((group) => group.variant), ["Dark roast", "Medium roast"]);
  const medium = groups.find((group) => group.variant === "Medium roast");
  const dark = groups.find((group) => group.variant === "Dark roast");
  assert.equal(medium.buyerCount, 4);
  assert.equal(medium.units, 12);
  assert.equal(dark.buyerCount, 3);
  assert.equal(dark.units, 8);
  assert.deepEqual(Object.keys(medium), ["variant", "buyerCount", "units"]);
  const json = JSON.stringify(groups);
  assert.equal(json.includes("SECRET_LABEL"), false);
  assert.equal(json.includes("SECRET_ID"), false);
  assert.equal(json.includes("987654.32"), false);
  assert.equal(json.includes("maxUnitPrice"), false);
  assert.equal(json.includes("selectedBuyerIds"), false);
  assert.equal(json.includes("allocations"), false);
});

test("organizer buyer variant counts treat canonically equivalent names as one group", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.buyers[1].allowedVariants = ["medium roast"];
  const groups = organizerBuyerVariantCounts(scenario);
  assert.equal(groups.filter((group) => group.variant.toLowerCase() === "medium roast").length, 1);
});

test("the buyer room shows organizer variant counts and the merchant table does not", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="buyer-variant-counts"/u);
  assert.match(buyerPanel, /Merchant views still show counts only/u);
  assert.equal(merchantPanel.includes("buyer-variant-counts"), false);
  assert.match(app, /function renderOrganizerBuyerVariantCounts\(/u);
  assert.match(app, /organizerBuyerVariantCounts\(/u);
});
