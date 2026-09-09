import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { clonePreset, createScenarioHistory, evaluateMarket, computeResidualCoverage, deliveryHeatmap, variantOverlapMatrix, validateScenario } from "../src/model.js";

test("an empty buyer room is valid and has no demand to match", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.buyers = [];
  const clean = validateScenario(scenario);
  assert.equal(clean.buyers.length, 0);
  const market = evaluateMarket(clean);
  assert.equal(market.buyerCount, 0);
  assert.equal(market.totalRequestedUnits, 0);
  assert.equal(market.winner, null);
  assert.equal(market.ranked.every((result) => result.qualifies === false), true);
  const coverage = computeResidualCoverage(clean);
  assert.equal(coverage.primary, null);
  assert.equal(coverage.unfilledBuyerCount, 0);
  const map = deliveryHeatmap(clean);
  assert.equal(map.buyerCount, 0);
  assert.equal(map.buckets.every((bucket) => bucket.buyerCount === 0 && bucket.units === 0), true);
  const overlap = variantOverlapMatrix(clean);
  assert.equal(overlap.variants.every((entry) => entry.buyerCount === 0), true);
});

test("restoring the neighbourhood example after an empty room is undoable", () => {
  const empty = clonePreset("neighbourhood");
  empty.buyers = [];
  const history = createScenarioHistory(empty);
  assert.equal(history.current().buyers.length, 0);
  history.record(clonePreset("neighbourhood"));
  assert.equal(history.current().buyers.length, 5);
  assert.equal(history.current().title, "Neighbourhood coffee run");
  assert.equal(history.undo().buyers.length, 0);
  assert.equal(history.redo().buyers.length, 5);
});

test("the buyer room has an honest empty recovery that can restore the neighbourhood example", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="empty-buyer-recovery"/u);
  assert.match(html, /Restore neighbourhood example/u);
  assert.match(html, /This room has no buyers/u);
  assert.match(app, /#restore-neighbourhood/u);
  assert.match(app, /Neighbourhood example restored\. Undo returns to the empty buyer room/u);
  assert.doesNotMatch(app, /A room needs at least one buyer/u);
});
