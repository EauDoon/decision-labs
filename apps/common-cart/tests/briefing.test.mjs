import test from "node:test";
import assert from "node:assert/strict";
import { clonePreset, computeResidualCoverage, createOrganizerBriefing, evaluateMarket } from "../src/model.js";

test("organizer briefing includes aggregates and omits private buyer rows", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.buyers[0].label = "SECRET_LABEL";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.title = "Briefing room";
  const briefing = createOrganizerBriefing(scenario);
  const market = evaluateMarket(scenario);
  const residual = computeResidualCoverage(scenario);
  assert.match(briefing, /Briefing room/);
  assert.match(briefing, /AUD/);
  assert.match(briefing, new RegExp(`Fulfilled units: ${market.winner.fulfilledUnits}`));
  assert.match(briefing, new RegExp(`Excluded buyers: ${market.winner.buyerOutcomes.filter((outcome) => outcome.status !== "included").length}`));
  assert.match(briefing, /Residual coverage/);
  assert.match(briefing, /planning aid/i);
  assert.equal(briefing.includes("SECRET_LABEL"), false);
  assert.equal(briefing.includes("SECRET_ID"), false);
  assert.equal(briefing.includes("maxUnitPrice"), false);
  assert.equal(briefing.includes("leftoverBuyerIds"), false);
  if (residual.secondary) {
    assert.match(briefing, new RegExp(residual.secondary.merchant));
  }
});

test("organizer briefing stays aggregate when leftover buyers exist", () => {
  const scenario = clonePreset("neighbourhood");
  const labels = scenario.buyers.map((buyer) => buyer.label);
  const briefing = createOrganizerBriefing(scenario);
  for (const label of labels) assert.equal(briefing.includes(label), false);
  assert.match(briefing, /Leftover after winner:/);
  assert.match(briefing, /Still unfilled:/);
});
