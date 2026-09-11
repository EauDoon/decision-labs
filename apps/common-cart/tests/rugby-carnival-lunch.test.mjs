import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { clonePreset, computeResidualCoverage, evaluateMarket, validateScenario } from "../src/model.js";

test("rugby carnival lunch leftover fill is hall pickup and stays distinct from soccer carnival lunch", () => {
  const rugby = evaluateMarket(clonePreset("rugbyCarnivalLunch"));
  const soccer = evaluateMarket(clonePreset("soccerCarnivalLunch"));
  assert.ok(rugby.winner);
  assert.equal(rugby.winner.offer.merchant, "Court-side Rugby Delivery");
  assert.equal(rugby.winner.offer.fulfillment, "shipping");
  assert.equal(rugby.scenario.title, "Rugby carnival lunch");
  assert.notEqual(rugby.scenario.title, soccer.scenario.title);
  assert.notDeepEqual(clonePreset("rugbyCarnivalLunch"), clonePreset("soccerCarnivalLunch"));
  const leftoverFill = computeResidualCoverage(rugby.scenario).secondary;
  assert.ok(leftoverFill);
  assert.equal(leftoverFill.merchant, "Hall Rugby Pickup");
  const leftoverOffer = rugby.scenario.offers.find((offer) => offer.id === leftoverFill.offerId);
  assert.equal(leftoverOffer.fulfillment, "pickup");
  assert.equal(leftoverOffer.minimumUnits, 12);
  assert.notEqual(leftoverOffer.minimumUnits, soccer.scenario.offers.find((offer) => offer.merchant === "Hall Soccer Pickup").minimumUnits);
  assert.equal(soccer.winner.offer.merchant, "Court-side Soccer Delivery");
  assert.equal(soccer.scenario.offers.find((offer) => offer.merchant === "Hall Soccer Pickup").minimumUnits, 11);
  assert.equal(leftoverOffer.capacity, 42);
  assert.equal(leftoverFill.fulfilledUnits, 21);
  assert.equal(leftoverOffer.capacity - leftoverFill.fulfilledUnits, 21);
  assert.deepEqual(leftoverFill.selectedBuyerIds, ["B03", "B04"]);
  assert.equal(computeResidualCoverage(rugby.scenario).tertiary, null);
  assert.deepEqual(computeResidualCoverage(rugby.scenario).leftoverBuyerIds.filter((id) => !(leftoverFill.selectedBuyerIds ?? []).includes(id)), ["B06"]);
  assert.ok(rugby.results.some((result) => result.offer.merchant === "Court-side Rugby Delivery" && result.offer.fulfillment === "shipping"));
  assert.ok(rugby.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Rugby pie")));
  assert.ok(rugby.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Tryline salad")));
  assert.ok(rugby.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Tryline water")));
  const first = evaluateMarket(clonePreset("rugbyCarnivalLunch"));
  const second = evaluateMarket(validateScenario(clonePreset("rugbyCarnivalLunch")));
  assert.equal(first.winner.offer.id, second.winner.offer.id);
  assert.equal(first.winner.fulfilledUnits, second.winner.fulfilledUnits);
});

test("the example bar includes rugby carnival lunch next to soccer carnival lunch", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="rugbyCarnivalLunch"/u);
  assert.match(html, /Rugby carnival/u);
  assert.match(html, /data-preset="soccerCarnivalLunch"/u);
});
