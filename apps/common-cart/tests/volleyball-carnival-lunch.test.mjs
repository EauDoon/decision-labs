import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { clonePreset, computeResidualCoverage, evaluateMarket, validateScenario } from "../src/model.js";

test("volleyball carnival lunch leftover fill is hall pickup and stays distinct from basketball carnival lunch", () => {
  const volleyball = evaluateMarket(clonePreset("volleyballCarnivalLunch"));
  const basketball = evaluateMarket(clonePreset("basketballCarnivalLunch"));
  assert.ok(volleyball.winner);
  assert.equal(volleyball.winner.offer.merchant, "Court-side Volleyball Delivery");
  assert.equal(volleyball.winner.offer.fulfillment, "shipping");
  assert.equal(volleyball.scenario.title, "Volleyball carnival lunch");
  assert.notEqual(volleyball.scenario.title, basketball.scenario.title);
  assert.notDeepEqual(clonePreset("volleyballCarnivalLunch"), clonePreset("basketballCarnivalLunch"));
  const leftoverFill = computeResidualCoverage(volleyball.scenario).secondary;
  assert.ok(leftoverFill);
  assert.equal(leftoverFill.merchant, "Hall Volleyball Pickup");
  const leftoverOffer = volleyball.scenario.offers.find((offer) => offer.id === leftoverFill.offerId);
  assert.equal(leftoverOffer.fulfillment, "pickup");
  assert.equal(leftoverOffer.minimumUnits, 10);
  assert.equal(leftoverOffer.capacity, 38);
  assert.notEqual(leftoverOffer.minimumUnits, basketball.scenario.offers.find((offer) => offer.merchant === "Hall Basketball Pickup").minimumUnits);
  assert.ok(volleyball.results.some((result) => result.offer.merchant === "Court-side Volleyball Delivery" && result.offer.fulfillment === "shipping"));
  assert.ok(volleyball.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Volleyball pie")));
  assert.ok(volleyball.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Sideline salad")));
  assert.ok(volleyball.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Sideline water")));
  const first = evaluateMarket(clonePreset("volleyballCarnivalLunch"));
  const second = evaluateMarket(validateScenario(clonePreset("volleyballCarnivalLunch")));
  assert.equal(first.winner.offer.id, second.winner.offer.id);
  assert.equal(first.winner.fulfilledUnits, second.winner.fulfilledUnits);
});

test("the example bar includes volleyball carnival lunch next to basketball carnival lunch", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="volleyballCarnivalLunch"/u);
  assert.match(html, /Volleyball carnival/u);
  assert.match(html, /data-preset="basketballCarnivalLunch"/u);
});
