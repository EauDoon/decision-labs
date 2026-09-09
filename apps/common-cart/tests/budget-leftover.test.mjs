import test from "node:test";
import assert from "node:assert/strict";
import {
  clonePreset,
  createMerchantReport,
  createMerchantResidualReport,
  createOrganizerBriefing,
  evaluateMarket,
  winnerBudgetLeftover
} from "../src/model.js";

test("winner budget leftover sums unused item headroom for included buyers", () => {
  const scenario = clonePreset("neighbourhood");
  const leftover = winnerBudgetLeftover(scenario);
  const market = evaluateMarket(scenario);
  const expected = market.winner.allocations.reduce((sum, allocation) => sum + Math.max(0, allocation.headroom), 0);
  assert.equal(leftover.includedBuyerCount, market.winner.deliveredBuyers);
  assert.equal(leftover.unspentHeadroom, expected);
  assert.ok(leftover.unspentHeadroom > 0);
  assert.match(leftover.note, /Organizer-only/);
  assert.equal(Object.hasOwn(leftover, "selectedBuyerIds"), false);
  assert.equal(JSON.stringify(leftover).includes(scenario.buyers[0].label), false);
  assert.equal(JSON.stringify(leftover).includes(scenario.buyers[0].id), false);
});

test("winner budget leftover is zero when no offer qualifies", () => {
  const scenario = clonePreset("studio");
  scenario.offers.forEach((offer) => { offer.minimumUnits = 5000; });
  const leftover = winnerBudgetLeftover(scenario);
  assert.equal(leftover.includedBuyerCount, 0);
  assert.equal(leftover.unspentHeadroom, 0);
  assert.match(leftover.note, /No winning offer/);
});

test("merchant JSON stays aggregates and omits leftover headroom", () => {
  const scenario = clonePreset("hardware");
  scenario.buyers[0].label = "SECRET_LABEL";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 424242;
  const leftover = winnerBudgetLeftover(scenario);
  const merchant = JSON.stringify(createMerchantReport(scenario));
  const residual = JSON.stringify(createMerchantResidualReport(scenario));
  for (const json of [merchant, residual]) {
    assert.equal(json.includes("SECRET_LABEL"), false);
    assert.equal(json.includes("SECRET_ID"), false);
    assert.equal(json.includes("424242"), false);
    assert.equal(json.includes("unspentHeadroom"), false);
    assert.equal(json.includes("maxUnitPrice"), false);
    assert.equal(json.includes("selectedBuyerIds"), false);
  }
  const briefing = createOrganizerBriefing(scenario);
  assert.match(briefing, new RegExp(`Unspent item headroom after winner: ${leftover.unspentHeadroom}`));
  assert.equal(briefing.includes("SECRET_LABEL"), false);
  assert.equal(briefing.includes("SECRET_ID"), false);
});
