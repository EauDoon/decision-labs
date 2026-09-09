import test from "node:test";
import assert from "node:assert/strict";
import { clonePreset, groupExclusionReasons, evaluateOffer, createExclusionCountsMarkdown } from "../src/model.js";

test("exclusion grouping counts reason codes and keeps per-buyer outcomes", () => {
  const scenario = clonePreset("neighbourhood");
  const groups = groupExclusionReasons(scenario, "O02");
  const codes = groups.map((group) => group.code);
  assert.ok(codes.includes("variant") || codes.includes("price") || codes.includes("delivery"));
  assert.equal(groups.every((group) => group.count === group.buyerIds.length), true);
  const result = evaluateOffer(scenario, "O02");
  assert.ok(result.buyerOutcomes.length === scenario.buyers.length);
  assert.ok(result.buyerOutcomes.some((outcome) => outcome.status === "included"));
  assert.ok(result.buyerOutcomes.some((outcome) => outcome.status !== "included"));
});

test("capacity leftover and quantity vs remaining capacity are distinct groups", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.buyers = [
    { ...scenario.buyers[0], id: "B01", quantity: 8, allowedVariants: ["Medium roast"], maxUnitPrice: 40, latestDeliveryDays: 10 },
    { ...scenario.buyers[0], id: "B02", quantity: 3, allowedVariants: ["Medium roast"], maxUnitPrice: 40, latestDeliveryDays: 10 },
    { ...scenario.buyers[0], id: "B03", quantity: 12, allowedVariants: ["Medium roast"], maxUnitPrice: 40, latestDeliveryDays: 10 }
  ];
  scenario.offers = [{ ...scenario.offers[0], id: "O01", variant: "Medium roast", minimumUnits: 8, capacity: 10, unitPrice: 20, deliveryDays: 5 }];
  const result = evaluateOffer(scenario, "O01");
  assert.equal(result.qualifies, true);
  assert.deepEqual(result.selectedBuyerIds, ["B01"]);
  const groups = Object.fromEntries(groupExclusionReasons(scenario, "O01").map((group) => [group.code, group]));
  assert.equal(groups.quantity_vs_capacity.count, 1);
  assert.deepEqual(groups.quantity_vs_capacity.buyerIds, ["B03"]);
  assert.equal(groups.capacity_leftover.count, 1);
  assert.deepEqual(groups.capacity_leftover.buyerIds, ["B02"]);
});

test("exclusion counts markdown uses counts only and omits private buyer rows", async () => {
  const { readFile } = await import("node:fs/promises");
  const scenario = clonePreset("neighbourhood");
  scenario.buyers[0].label = "SECRET_LABEL";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createExclusionCountsMarkdown(scenario, "O02");
  const groups = groupExclusionReasons(scenario, "O02");
  assert.match(markdown, /# Common Cart exclusion counts/);
  assert.match(markdown, /Southbank Coffee/);
  assert.match(markdown, /Included buyers:/);
  assert.match(markdown, /Excluded buyers:/);
  for (const group of groups) {
    assert.match(markdown, new RegExp(`: ${group.count}`));
    for (const id of group.buyerIds) assert.equal(markdown.includes(id), false);
  }
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes('"selectedBuyerIds":'), false);
  assert.equal(markdown.includes('"allocations":'), false);
  assert.match(markdown, /omit private buyer labels, IDs, budgets, and allocations/);
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-exclusion-counts"/u);
  assert.match(html, /Copy exclusion counts/u);
  assert.match(app, /createExclusionCountsMarkdown\(/u);
});
