import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { clonePreset, computeResidualCoverage, evaluateMarket, validateScenario } from "../src/model.js";

test("hockey carnival lunch leftover fill is hall pickup and stays distinct from rugby carnival lunch", () => {
  const hockey = evaluateMarket(clonePreset("hockeyCarnivalLunch"));
  const rugby = evaluateMarket(clonePreset("rugbyCarnivalLunch"));
  const soccer = evaluateMarket(clonePreset("soccerCarnivalLunch"));
  assert.ok(hockey.winner);
  assert.equal(hockey.winner.offer.merchant, "Court-side Hockey Delivery");
  assert.equal(hockey.winner.offer.fulfillment, "shipping");
  assert.equal(hockey.scenario.title, "Hockey carnival lunch");
  assert.notEqual(hockey.scenario.title, rugby.scenario.title);
  assert.notDeepEqual(clonePreset("hockeyCarnivalLunch"), clonePreset("rugbyCarnivalLunch"));
  assert.notDeepEqual(clonePreset("hockeyCarnivalLunch"), clonePreset("soccerCarnivalLunch"));
  const leftoverFill = computeResidualCoverage(hockey.scenario).secondary;
  assert.ok(leftoverFill);
  assert.equal(leftoverFill.merchant, "Hall Hockey Pickup");
  const leftoverOffer = hockey.scenario.offers.find((offer) => offer.id === leftoverFill.offerId);
  assert.equal(leftoverOffer.fulfillment, "pickup");
  assert.equal(leftoverOffer.minimumUnits, 13);
  assert.equal(soccer.scenario.offers.find((offer) => offer.merchant === "Hall Soccer Pickup").minimumUnits, 11);
  assert.equal(rugby.scenario.offers.find((offer) => offer.merchant === "Hall Rugby Pickup").minimumUnits, 12);
  assert.equal(soccer.winner.offer.merchant, "Court-side Soccer Delivery");
  assert.equal(rugby.winner.offer.merchant, "Court-side Rugby Delivery");
  assert.equal(leftoverOffer.capacity, 44);
  assert.equal(leftoverFill.fulfilledUnits, 23);
  assert.equal(leftoverOffer.capacity - leftoverFill.fulfilledUnits, 21);
  assert.deepEqual(leftoverFill.selectedBuyerIds, ["B03", "B04"]);
  assert.equal(computeResidualCoverage(hockey.scenario).tertiary, null);
  assert.deepEqual(computeResidualCoverage(hockey.scenario).leftoverBuyerIds.filter((id) => !(leftoverFill.selectedBuyerIds ?? []).includes(id)), ["B06"]);
  assert.ok(hockey.results.some((result) => result.offer.merchant === "Court-side Hockey Delivery" && result.offer.fulfillment === "shipping"));
  assert.ok(hockey.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Hockey pie")));
  assert.ok(hockey.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Boards salad")));
  assert.ok(hockey.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Boards water")));
  const first = evaluateMarket(clonePreset("hockeyCarnivalLunch"));
  const second = evaluateMarket(validateScenario(clonePreset("hockeyCarnivalLunch")));
  assert.equal(first.winner.offer.id, second.winner.offer.id);
  assert.equal(first.winner.fulfilledUnits, second.winner.fulfilledUnits);
});

test("the example bar includes hockey carnival lunch next to rugby carnival lunch", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="hockeyCarnivalLunch"/u);
  assert.match(html, /Hockey carnival/u);
  assert.match(html, /data-preset="rugbyCarnivalLunch"/u);
});
