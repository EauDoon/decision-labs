import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { clonePreset, computeResidualCoverage, evaluateMarket, validateScenario } from "../src/model.js";

test("soccer carnival lunch leftover fill is hall pickup and stays distinct from volleyball carnival lunch", () => {
  const soccer = evaluateMarket(clonePreset("soccerCarnivalLunch"));
  const volleyball = evaluateMarket(clonePreset("volleyballCarnivalLunch"));
  assert.ok(soccer.winner);
  assert.equal(soccer.winner.offer.merchant, "Court-side Soccer Delivery");
  assert.equal(soccer.winner.offer.fulfillment, "shipping");
  assert.equal(soccer.scenario.title, "Soccer carnival lunch");
  assert.notEqual(soccer.scenario.title, volleyball.scenario.title);
  assert.notDeepEqual(clonePreset("soccerCarnivalLunch"), clonePreset("volleyballCarnivalLunch"));
  assert.notDeepEqual(clonePreset("soccerCarnivalLunch"), clonePreset("rugbyCarnivalLunch"));
  const leftoverFill = computeResidualCoverage(soccer.scenario).secondary;
  assert.ok(leftoverFill);
  assert.equal(leftoverFill.merchant, "Hall Soccer Pickup");
  const leftoverOffer = soccer.scenario.offers.find((offer) => offer.id === leftoverFill.offerId);
  assert.equal(leftoverOffer.fulfillment, "pickup");
  assert.equal(leftoverOffer.minimumUnits, 11);
  assert.equal(leftoverOffer.capacity, 40);
  assert.equal(leftoverFill.fulfilledUnits, 19);
  assert.equal(leftoverOffer.capacity - leftoverFill.fulfilledUnits, 21);
  assert.deepEqual(leftoverFill.selectedBuyerIds, ["B03", "B04"]);
  assert.equal(computeResidualCoverage(soccer.scenario).tertiary, null);
  assert.deepEqual(computeResidualCoverage(soccer.scenario).leftoverBuyerIds.filter((id) => !(leftoverFill.selectedBuyerIds ?? []).includes(id)), ["B06"]);
  assert.notEqual(leftoverOffer.minimumUnits, volleyball.scenario.offers.find((offer) => offer.merchant === "Hall Volleyball Pickup").minimumUnits);
  assert.ok(soccer.results.some((result) => result.offer.merchant === "Court-side Soccer Delivery" && result.offer.fulfillment === "shipping"));
  assert.ok(soccer.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Soccer pie")));
  assert.ok(soccer.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Pitch salad")));
  assert.ok(soccer.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Pitch water")));
  const first = evaluateMarket(clonePreset("soccerCarnivalLunch"));
  const second = evaluateMarket(validateScenario(clonePreset("soccerCarnivalLunch")));
  assert.equal(first.winner.offer.id, second.winner.offer.id);
  assert.equal(first.winner.fulfilledUnits, second.winner.fulfilledUnits);
});

test("the example bar includes soccer carnival lunch next to volleyball carnival lunch", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="soccerCarnivalLunch"/u);
  assert.match(html, /Soccer carnival/u);
  assert.match(html, /data-preset="volleyballCarnivalLunch"/u);
});
