import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SCENARIO,
  MAX_FUNDING_TRANCHES,
  analyzeWeekendReview,
  compareScenarios,
  createWeekendReviewPacket,
  dashboardToMarkdown,
  fundingAtHour,
  fundingToMarkdown,
  hoursToClearLabel,
  hoursToFirstSettlementLabel,
  planReserve,
  runSimulation,
  sanitizeFundingTranches,
  sanitizeScenario,
} from "../src/model.js";

const tranche = (hour, amountAud, costAud = 0) => ({ hour, amountAud, costAud });

test("funding schedules validate hours, amounts, costs, and the entry cap", () => {
  assert.deepEqual(sanitizeFundingTranches(undefined, 72), { tranches: undefined, errors: [] });
  assert.deepEqual(sanitizeFundingTranches([], 72).tranches, []);
  assert.match(sanitizeFundingTranches({}, 72).errors.join(" "), /must be an array/);
  assert.match(sanitizeFundingTranches(new Array(MAX_FUNDING_TRANCHES + 1).fill(tranche(0, 1)), 72).errors.join(" "), /at most 16/);
  assert.match(sanitizeFundingTranches([tranche(72, 100)], 72).errors.join(" "), /from 0 through 71/);
  assert.match(sanitizeFundingTranches([tranche(-1, 100)], 72).errors.join(" "), /from 0 through 71/);
  assert.match(sanitizeFundingTranches([tranche(1.5, 100)], 72).errors.join(" "), /whole hour/);
  for (const amountAud of [0, -1, NaN, Infinity, 1000000001]) {
    assert.match(sanitizeFundingTranches([tranche(0, amountAud)], 72).errors.join(" "), /amount/, `amount ${String(amountAud)}`);
  }
  assert.match(sanitizeFundingTranches([tranche(0, 100, -1)], 72).errors.join(" "), /cost/);
  assert.match(sanitizeFundingTranches([{ hour: 0, amountAud: 100, extra: 1 }], 72).errors.join(" "), /unexpected field/);
  assert.match(sanitizeFundingTranches(["nope"], 72).errors.join(" "), /must be an object/);
  const rounded = sanitizeFundingTranches([tranche(0, 10.005, 0.005)], 72);
  assert.deepEqual(rounded.errors, []);
  assert.deepEqual(rounded.tranches, [tranche(0, 10.01, 0.01)]);
  const defaulted = sanitizeFundingTranches([{ hour: 3, amountAud: 50 }], 72);
  assert.deepEqual(defaulted.tranches, [tranche(3, 50, 0)]);
});

test("one invalid tranche rejects the whole schedule without partial funding", () => {
  const checked = sanitizeFundingTranches([tranche(0, 100), tranche(99, 100)], 72);
  assert.equal(checked.tranches, undefined);
  assert.ok(checked.errors.length > 0);
  const result = runSimulation({ ...DEFAULT_SCENARIO, reserveCashAud: 0, fundingTranches: [tranche(0, 100), tranche(99, 100)] });
  assert.equal(result.summary.totalFundedAud, 0);
  assert.equal(result.scenario.fundingTranches, undefined);
});

test("tranches add reserve before their hour settles and track cost as an expense", () => {
  const Starved = { ...DEFAULT_SCENARIO, reserveCashAud: 0 };
  const starved = runSimulation(Starved);
  assert.equal(starved.summary.totalSettledAud, 0);
  const funded = runSimulation({ ...Starved, fundingTranches: [tranche(0, 500000, 1000), tranche(10, 250000)] });
  assert.equal(funded.summary.totalFundedAud, 750000);
  assert.equal(funded.summary.totalFundingCostAud, 1000);
  assert.ok(funded.summary.totalSettledAud > 0);
  assert.equal(funded.timeline[1].fundedThisHour, 500000);
  assert.equal(funded.timeline[1].fundedTotalAud, 500000);
  assert.equal(funded.timeline[2].fundedThisHour, 0);
  assert.equal(funded.timeline[11].fundedThisHour, 250000);
  assert.equal(funded.timeline[11].fundedTotalAud, 750000);
  assert.equal(funded.timeline[0].fundedThisHour, 0);
  const merged = fundingAtHour({ ...Starved, fundingTranches: [tranche(5, 100, 7), tranche(5, 200, 8)] }, 5);
  assert.deepEqual(merged, { amountAud: 300, costAud: 15 });
  assert.deepEqual(fundingAtHour(Starved, 5), { amountAud: 0, costAud: 0 });
});

test("funding costs never reduce the reserve they accompany", () => {
  const a = runSimulation({ ...DEFAULT_SCENARIO, reserveCashAud: 0, fundingTranches: [tranche(0, 100000, 0)] });
  const b = runSimulation({ ...DEFAULT_SCENARIO, reserveCashAud: 0, fundingTranches: [tranche(0, 100000, 99999)] });
  assert.equal(a.summary.totalSettledAud, b.summary.totalSettledAud);
  assert.equal(b.summary.totalFundingCostAud, 99999);
});

test("scenarios without tranches keep zero funding totals and identical queues", () => {
  const plain = runSimulation(DEFAULT_SCENARIO);
  assert.equal(plain.summary.totalFundedAud, 0);
  assert.equal(plain.summary.totalFundingCostAud, 0);
  const explicit = runSimulation({ ...DEFAULT_SCENARIO, fundingTranches: [] });
  assert.equal(explicit.summary.totalSettledAud, plain.summary.totalSettledAud);
  assert.equal(explicit.summary.peakQueuedAud, plain.summary.peakQueuedAud);
});

test("reserve planner counts tranches before the deadline and ignores later ones", () => {
  const starved = { ...DEFAULT_SCENARIO, reserveCashAud: 0 };
  const early = planReserve({ ...starved, fundingTranches: [tranche(0, 100000)] }, 1, 1);
  assert.equal(early.status, "reachable");
  assert.equal(early.minimumReserveAud, 0);
  assert.ok(early.achievedSettledAud >= early.targetAud);
  const late = planReserve({ ...starved, fundingTranches: [tranche(1, 100000)] }, 1, 1);
  assert.equal(late.status, "reachable");
  assert.ok(late.minimumReserveAud > 0);
  assert.equal(late.minimumReserveAud, planReserve(starved, 1, 1).minimumReserveAud);
  const full = planReserve({ ...starved, fundingTranches: [tranche(0, 100000), tranche(71, 100000)] }, 50, 72);
  assert.equal(full.status, "reachable");
  assert.equal(full.achievedSettledAud >= full.targetAud, true);
});

test("comparisons list schedule changes and sign funding deltas", () => {
  const bare = { ...DEFAULT_SCENARIO, reserveCashAud: 0 };
  const funded = { ...bare, fundingTranches: [tranche(0, 500000, 1000)] };
  const comparison = compareScenarios(bare, funded);
  assert.deepEqual(comparison.changes, [{ field: "fundingTranches", baseline: [], candidate: [tranche(0, 500000, 1000)] }]);
  assert.equal(comparison.deltas.totalFundedAud, 500000);
  assert.equal(comparison.deltas.totalFundingCostAud, 1000);
  assert.ok(comparison.deltas.totalSettledAud > 0);
  const closed = { ...bare, calendarOverrides: [{ startHour: 0, endHour: 2, gates: { payout: "closed" } }] };
  const overrideChanges = compareScenarios(bare, closed).changes;
  assert.equal(overrideChanges.length, 1);
  assert.equal(overrideChanges[0].field, "calendarOverrides");
  assert.deepEqual(compareScenarios(bare, { ...bare }).changes, []);
});

test("funding Markdown reports the schedule, totals, and the empty case", () => {
  const text = fundingToMarkdown({ ...DEFAULT_SCENARIO, fundingTranches: [tranche(5, 2000, 50)] });
  assert.match(text, /\| Fri 20:00 \(hour 5\) \| 2000 \| 50 \|/);
  assert.match(text, /Total funded A\$2000 at a funding cost of A\$50/);
  assert.match(text, /not a funding recommendation/);
  assert.match(fundingToMarkdown(DEFAULT_SCENARIO), /No scheduled funding tranches/);
});

test("dashboard Markdown names funding only when tranches exist", () => {
  assert.doesNotMatch(dashboardToMarkdown(DEFAULT_SCENARIO), /Scheduled funding/);
  const text = dashboardToMarkdown({ ...DEFAULT_SCENARIO, fundingTranches: [tranche(0, 3000, 40), tranche(1, 2000)] });
  assert.match(text, /Scheduled funding: A\$5000 across 2 tranches \(funding cost A\$40\)/);
  const single = dashboardToMarkdown({ ...DEFAULT_SCENARIO, fundingTranches: [tranche(0, 3000)] });
  assert.match(single, /across 1 tranche \(funding cost A\$0\)/);
});

test("reviews run at short horizons and accept dated schedules", () => {
  const short = { ...DEFAULT_SCENARIO, horizonHours: 48 };
  const reserve = createWeekendReviewPacket(short, "reserve");
  assert.equal(reserve.review.rows.length, 4);
  assert.match(reserve.review.note, /at hour 48/);
  const deadlines = analyzeWeekendReview(short, "deadlines");
  assert.deepEqual(deadlines.rows.map((row) => row[0]), [12, 24, 36, 48]);
  const closures = analyzeWeekendReview(short, "closures");
  assert.match(closures.note, /48-hour horizon/);
  const tiny = analyzeWeekendReview({ ...DEFAULT_SCENARIO, horizonHours: 30 }, "deadlines");
  assert.deepEqual(tiny.rows.map((row) => row[0]), [12, 24, 30]);
  const withSchedules = createWeekendReviewPacket({
    ...DEFAULT_SCENARIO,
    calendarOverrides: [{ startHour: 0, endHour: 2, gates: { payout: "closed" } }],
    fundingTranches: [tranche(0, 1000)],
  }, "days");
  assert.equal(withSchedules.review.rows.length, 4);
  assert.throws(() => analyzeWeekendReview({ ...DEFAULT_SCENARIO, calendarOverrides: "nope" }, "days"), TypeError);
});

test("empty-state labels honor the horizon instead of pinning 72 hours", () => {
  assert.equal(hoursToClearLabel(null, 0, 48), "No queue in 48h");
  assert.equal(hoursToFirstSettlementLabel(null, 48), "No settlement in 48h");
  assert.equal(hoursToClearLabel(null, 0), "No queue in 72h");
  assert.equal(hoursToFirstSettlementLabel(null), "No settlement in 72h");
});

test("sanitize keeps funding out unless a valid schedule is supplied", () => {
  assert.equal(sanitizeScenario(DEFAULT_SCENARIO).scenario.fundingTranches, undefined);
  assert.equal(sanitizeScenario({ ...DEFAULT_SCENARIO, fundingTranches: "nope" }).scenario.fundingTranches, undefined);
  assert.ok(sanitizeScenario({ ...DEFAULT_SCENARIO, fundingTranches: "nope" }).errors.join(" ").includes("Funding tranches"));
});
