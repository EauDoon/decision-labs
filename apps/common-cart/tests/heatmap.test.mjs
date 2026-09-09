import test from "node:test";
import assert from "node:assert/strict";
import { clonePreset, deliveryHeatmap, createDeliveryHeatmapCsv } from "../src/model.js";

test("delivery heatmap buckets units without buyer identities", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.buyers[0].label = "SECRET_LABEL";
  scenario.buyers[0].id = "SECRET_ID";
  const map = deliveryHeatmap(scenario);
  assert.equal(map.buyerCount, scenario.buyers.length);
  assert.equal(map.units, scenario.buyers.reduce((sum, buyer) => sum + buyer.quantity, 0));
  assert.equal(map.buckets.reduce((sum, bucket) => sum + bucket.buyerCount, 0), scenario.buyers.length);
  assert.equal(JSON.stringify(map).includes("SECRET_LABEL"), false);
  assert.equal(JSON.stringify(map).includes("SECRET_ID"), false);
  assert.equal(JSON.stringify(map).includes("maxUnitPrice"), false);
});

test("delivery heatmap places every buyer in one deadline bucket", () => {
  const scenario = clonePreset("hardware");
  scenario.buyers[0].latestDeliveryDays = 2;
  scenario.buyers[1].latestDeliveryDays = 7;
  scenario.buyers[2].latestDeliveryDays = 14;
  scenario.buyers[3].latestDeliveryDays = 30;
  scenario.buyers[4].latestDeliveryDays = 90;
  const map = deliveryHeatmap(scenario);
  assert.deepEqual(map.buckets.map((bucket) => bucket.buyerCount), [1, 1, 1, 1, 1]);
});

test("delivery heatmap CSV exports aggregate buckets and is formula-safe", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.buyers[0].label = "SECRET_LABEL";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 424242;
  const csv = createDeliveryHeatmapCsv(scenario);
  const map = deliveryHeatmap(scenario);
  assert.equal(csv.includes("SECRET_LABEL"), false);
  assert.equal(csv.includes("SECRET_ID"), false);
  assert.equal(csv.includes("424242"), false);
  assert.equal(csv.includes("maxUnitPrice"), false);
  assert.match(csv, /^"Bucket","Earliest day","Latest day","Buyers","Units"\r\n/u);
  for (const bucket of map.buckets) {
    assert.match(csv, new RegExp(`"${bucket.label}","${bucket.min}","${bucket.max}","${bucket.buyerCount}","${bucket.units}"`));
  }
  assert.match(csv, new RegExp(`"All buckets","","","${map.buyerCount}","${map.units}"`));
  assert.equal(csv.endsWith("\r\n"), true);
});

test("delivery heatmap CSV escapes formula-like bucket text", () => {
  const scenario = clonePreset("neighbourhood");
  const csv = createDeliveryHeatmapCsv(scenario);
  assert.equal(csv.includes('"\'='), false);
  assert.match(csv, /"0 to 3 days"/);
});
