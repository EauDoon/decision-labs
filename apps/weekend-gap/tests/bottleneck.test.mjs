import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SCENARIO, SIMULATION_HOURS, attributeBottlenecks, runSimulation } from "../src/model.js";

/** Bank window sits after issuer and payout hours, so bank is the closed limiter whenever those two are open. */
export const BANK_LIMITER_FIXTURE = Object.freeze({
  ...DEFAULT_SCENARIO,
  name: "Bank limiter fixture",
  issuerOpenStartHour: 8,
  issuerOpenEndHour: 17,
  payoutOpenStartHour: 8,
  payoutOpenEndHour: 17,
  bankOpenStartHour: 18,
  bankOpenEndHour: 19
});

test("bottleneck attribution counts every hour and sums to 72", () => {
  const attribution = attributeBottlenecks(DEFAULT_SCENARIO);
  assert.equal(attribution.hours, SIMULATION_HOURS);
  assert.equal(attribution.rows.reduce((sum, row) => sum + row.hours, 0), SIMULATION_HOURS);
  const result = runSimulation(DEFAULT_SCENARIO);
  for (const row of attribution.rows) {
    const expected = result.timeline.slice(0, SIMULATION_HOURS).filter((point) => point.limitingGate === row.label).length;
    assert.equal(row.hours, expected);
  }
});

test("bank-closed overlap is attributed to the bank gate, not issuer or payout", () => {
  const result = runSimulation(BANK_LIMITER_FIXTURE);
  const attribution = attributeBottlenecks(BANK_LIMITER_FIXTURE);
  let bankHours = 0;
  for (let hour = 0; hour < SIMULATION_HOURS; hour += 1) {
    if (result.timeline[hour].limitingGate === "bank") {
      bankHours += 1;
      assert.equal(result.timeline[hour].issuerOpen, true);
      assert.equal(result.timeline[hour].payoutOpen, true);
      assert.equal(result.timeline[hour].bankOpen, false);
    }
  }
  assert.equal(attribution.counts.bank, bankHours);
  assert.ok(bankHours >= 9);
  assert.equal(result.timeline[0].timeLabel, "Fri 15:00");
  assert.equal(result.timeline[0].limitingGate, "bank");
  assert.equal(result.timeline[65].timeLabel, "Mon 08:00");
  assert.equal(result.timeline[65].limitingGate, "bank");
  assert.ok(attribution.counts.bank > attribution.counts.payout);
});
