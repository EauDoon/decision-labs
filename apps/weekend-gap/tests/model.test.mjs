import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SCENARIO,
  PRESETS,
  SIMULATION_HOURS,
  buildDemandSchedule,
  capacityForHour,
  createSnapshot,
  finiteNumber,
  getOperationalStatus,
  nextPayoutTime,
  runSimulation,
  sanitizeScenario,
  scenarioFromHash,
  scenarioFromJSON,
  scenarioToHash,
  scenarioToJSON
} from "../src/model.js";

test("demand schedule is deterministic and conserves the requested total", () => {
  const first = buildDemandSchedule(1234567.89);
  const second = buildDemandSchedule(1234567.89);
  assert.deepEqual(first, second);
  assert.equal(first.length, SIMULATION_HOURS);
  assert.ok(Math.abs(first.reduce((sum, value) => sum + value, 0) - 1234567.89) < 0.000001);
});

test("weekend closure leaves ledger demand queued while issuer, bank and payout gates close", () => {
  const result = runSimulation(PRESETS.weekendRush);
  const saturdayNoon = result.timeline[21]; // Fri 15:00 plus 21 hours.
  assert.equal(saturdayNoon.timeLabel, "Sat 12:00");
  assert.equal(saturdayNoon.issuerOpen, false);
  assert.equal(saturdayNoon.bankOpen, false);
  assert.equal(saturdayNoon.payoutOpen, false);
  assert.equal(saturdayNoon.immediateAud, 0);
  assert.ok(saturdayNoon.queuedAud > 0);
  assert.ok(saturdayNoon.discountBps > PRESETS.weekendRush.fxSpreadBps);
});

test("normal scenario permits settlement in the Friday overlap and on Monday", () => {
  const result = runSimulation(DEFAULT_SCENARIO);
  assert.ok(result.timeline[1].settledThisHour > 0);
  assert.equal(result.timeline[60].settledThisHour, 0); // Monday 03:00.
  assert.ok(result.timeline[66].settledThisHour > 0); // Monday 09:00.
  assert.ok(result.summary.totalSettledAud > 0);
  assert.ok(result.summary.totalSettledAud <= result.summary.totalDemandAud);
});

test("checkpoint bottlenecks match current capacity across operating transitions", () => {
  const result = runSimulation(DEFAULT_SCENARIO);
  const fridayClose = result.timeline[2];
  const mondayOpen = result.timeline[65];

  assert.equal(fridayClose.timeLabel, "Fri 17:00");
  assert.equal(fridayClose.immediateAud, 0);
  assert.equal(fridayClose.issuerOpen, false);
  assert.equal(fridayClose.limitingGate, "issuer");

  assert.equal(mondayOpen.timeLabel, "Mon 08:00");
  assert.ok(mondayOpen.immediateAud > 0);
  assert.equal(mondayOpen.issuerOpen, true);
  assert.equal(mondayOpen.limitingGate, "payout throughput");

  for (const point of result.timeline) {
    const capacity = capacityForHour(result.scenario, point.hour, point.reserveRemainingAud);
    assert.equal(point.immediateAud, capacity.capacityAud);
    assert.equal(point.limitingGate, capacity.limitingGate);
  }
});

test("direct snapshot callers can still supply a limiting-gate override", () => {
  const result = runSimulation(DEFAULT_SCENARIO);
  const snapshot = createSnapshot(
    result.scenario,
    0,
    result.timeline[0],
    0,
    0,
    "external override"
  );

  assert.equal(snapshot.limitingGate, "external override");
});

test("reserve exhaustion is explicit and never allows negative balances", () => {
  const result = runSimulation({ ...DEFAULT_SCENARIO, reserveCashAud: 10000, redemptionDemandAud: 3000000 });
  assert.equal(result.summary.finalReserveAud, 0);
  assert.ok(result.summary.finalQueuedAud > 0);
  assert.ok(result.timeline.every((point) => point.reserveRemainingAud >= 0 && point.queuedAud >= 0));
  assert.equal(result.timeline.at(-1).immediateAud, 0);
});

test("summary reports the overall settlement result and peak queue", () => {
  const result = runSimulation(PRESETS.weekendRush);
  const peakPoint = result.timeline.reduce(
    (peak, point) => point.queuedAud > peak.queuedAud ? point : peak,
    result.timeline[0],
  );
  assert.equal(result.summary.totalDemandAud, PRESETS.weekendRush.redemptionDemandAud);
  assert.equal(result.summary.totalSettledAud, result.timeline.at(-1).settledAud);
  assert.equal(result.summary.finalQueuedAud, result.timeline.at(-1).queuedAud);
  assert.equal(result.summary.peakQueuedAud, peakPoint.queuedAud);
  assert.equal(result.summary.peakQueueHour, peakPoint.hour);
  assert.equal(result.summary.hoursWithQueue, result.timeline.filter((point) => point.queuedAud > 0).length);
  assert.ok(result.summary.peakQueuedAud >= result.summary.finalQueuedAud);
});

test("invalid input is clamped to safe operational values", () => {
  const { scenario, errors } = sanitizeScenario({
    nominalLiquidityAud: -1,
    reserveCashAud: Number.POSITIVE_INFINITY,
    issuerOpenStartHour: 23,
    issuerOpenEndHour: 2,
    weekendFxMultiplier: 0,
    name: "  "
  });
  assert.equal(scenario.nominalLiquidityAud, 10000);
  assert.equal(scenario.reserveCashAud, 10000);
  assert.equal(scenario.issuerOpenStartHour, 23);
  assert.equal(scenario.issuerOpenEndHour, 24);
  assert.equal(scenario.weekendFxMultiplier, 1);
  assert.equal(scenario.name, DEFAULT_SCENARIO.name);
  assert.ok(errors.length > 0);
  for (const value of [null, false, [], {}, "", " "]) assert.equal(finiteNumber(value, 42), 42);
  assert.equal(finiteNumber("12.5", 42), 12.5);
});

test("current payout capacity is bounded by every operational bottleneck", () => {
  const input = {
    ...DEFAULT_SCENARIO,
    issuerThroughputAudPerHour: 300,
    fxDepthAudPerHour: 200,
    payoutThroughputAudPerHour: 100,
    reserveCashAud: 50
  };
  const available = capacityForHour(input, 0, 50);
  assert.equal(available.capacityAud, 50);
  assert.equal(available.limitingGate, "AUD reserve");
  assert.equal(capacityForHour(input, 21, 50).capacityAud, 0);
});

test("next payout searches through the weekend to Monday business hours", () => {
  assert.equal(nextPayoutTime(DEFAULT_SCENARIO, 2), 65);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 65).payoutOpen, true);
  assert.equal(nextPayoutTime(DEFAULT_SCENARIO, 0, 0), null);
  assert.equal(nextPayoutTime({ ...DEFAULT_SCENARIO, issuerThroughputAudPerHour: 0 }, 0), null);
  assert.equal(nextPayoutTime({ ...DEFAULT_SCENARIO, fxDepthAudPerHour: 0 }, 0), null);
  assert.equal(nextPayoutTime({ ...DEFAULT_SCENARIO, payoutThroughputAudPerHour: 0 }, 0), null);
});

test("scenario JSON and hash round trips preserve valid editable assumptions", () => {
  const source = { ...DEFAULT_SCENARIO, name: "Shared stress check", redemptionDemandAud: 987654 };
  const imported = scenarioFromJSON(scenarioToJSON(source));
  assert.deepEqual(imported.scenario, sanitizeScenario(source).scenario);
  const restored = scenarioFromHash(scenarioToHash(source));
  assert.deepEqual(restored.scenario, sanitizeScenario(source).scenario);
  assert.equal(scenarioFromJSON("not json").scenario, null);
  assert.equal(scenarioFromHash("#scenario=%7Bbad").scenario, null);
  assert.equal(scenarioFromJSON("x".repeat(250001)).scenario, null);
  assert.equal(scenarioFromHash(`#scenario=${"x".repeat(60000)}`).scenario, null);
});

test("scenario import validates claimed envelopes without breaking raw scenario objects", () => {
  const rawScenario = { ...DEFAULT_SCENARIO, name: "Raw scenario" };
  assert.deepEqual(
    scenarioFromJSON(JSON.stringify(rawScenario)).scenario,
    sanitizeScenario(rawScenario).scenario
  );

  const malformedEnvelopes = [
    { format: "weekend-gap-scenario", version: 2, scenario: rawScenario },
    { format: "another-format", version: 1, scenario: rawScenario },
    { format: "weekend-gap-scenario", version: 1 },
    { format: "weekend-gap-scenario", version: 1, scenario: null },
    { version: 1, scenario: rawScenario },
    { scenario: rawScenario }
  ];
  for (const envelope of malformedEnvelopes) {
    const imported = scenarioFromJSON(JSON.stringify(envelope));
    assert.equal(imported.scenario, null);
    assert.ok(imported.errors.length > 0);
  }

  const analysis = scenarioFromJSON(JSON.stringify({ format: "weekend-gap-analysis", version: 1 }));
  assert.equal(analysis.scenario, null);
  assert.match(analysis.errors[0], /Analysis reports are not scenario files/);
});

test("scenario import does not require the newer Object.hasOwn API", () => {
  const exported = scenarioToJSON({ ...DEFAULT_SCENARIO, name: "Compatible import" });
  const originalHasOwn = Object.hasOwn;
  try {
    Object.hasOwn = undefined;
    assert.equal(scenarioFromJSON(exported).scenario.name, "Compatible import");
  } finally {
    Object.hasOwn = originalHasOwn;
  }
});
