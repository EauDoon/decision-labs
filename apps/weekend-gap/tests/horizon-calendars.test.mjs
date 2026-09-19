import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SCENARIO,
  MIN_HORIZON_HOURS,
  MAX_HORIZON_HOURS,
  MAX_CALENDAR_OVERRIDES,
  SIMULATION_HOURS,
  scenarioHours,
  sanitizeScenario,
  sanitizeCalendarOverrides,
  overrideAtHour,
  throughputAtHour,
  runSimulation,
  buildGateSchedule,
  buildDemandSchedule,
  getOperationalStatus,
  dayAndHourAt,
  formatTime,
  svgTickHours,
  firstClosedGanttHour,
  workspaceToJSON,
  workspaceFromJSON,
  planReserve,
} from "../src/model.js";

const at = (overrides = {}) => ({ ...DEFAULT_SCENARIO, ...overrides });

test("horizon defaults to 72 and validates 24 through 336 whole hours", () => {
  assert.equal(scenarioHours(DEFAULT_SCENARIO), 72);
  assert.equal(sanitizeScenario({}).scenario.horizonHours, 72);
  assert.equal(sanitizeScenario({ horizonHours: 200 }).scenario.horizonHours, 200);
  assert.equal(sanitizeScenario({ horizonHours: 24 }).scenario.horizonHours, 24);
  assert.equal(sanitizeScenario({ horizonHours: 336 }).scenario.horizonHours, 336);
  assert.equal(sanitizeScenario({ horizonHours: 23 }).scenario.horizonHours, 24);
  assert.equal(sanitizeScenario({ horizonHours: 337 }).scenario.horizonHours, 336);
  assert.equal(sanitizeScenario({ horizonHours: 72.5 }).scenario.horizonHours, 73);
  const clamped = sanitizeScenario({ horizonHours: 10 });
  assert.ok(clamped.errors.some((error) => error.includes("horizonHours")));
});

test("longer horizons conserve demand and extend the timeline", () => {
  for (const hours of [24, 72, 144, 336]) {
    const result = runSimulation(at({ horizonHours: hours }));
    assert.equal(result.timeline.length, hours + 1);
    assert.ok(Math.abs(result.timeline[hours].demandArrivedAud - result.scenario.redemptionDemandAud) < 1e-6 * result.scenario.redemptionDemandAud + 1e-6);
    assert.equal(result.summary.totalDemandAud, result.scenario.redemptionDemandAud);
  }
});

test("midnight, weekend, and holiday transitions hold past 72 hours", () => {
  assert.deepEqual(dayAndHourAt(9), { dayIndex: 6, localHour: 0 });
  assert.deepEqual(dayAndHourAt(81), { dayIndex: 2, localHour: 0 });
  assert.equal(formatTime(72), "Mon 15:00");
  assert.equal(formatTime(144), "Thu 15:00");
  assert.equal(formatTime(336), "Fri 15:00");
  const holiday = at({ horizonHours: 336, mondayHoliday: true });
  const schedule = buildGateSchedule(holiday);
  assert.equal(schedule.hours.length, 337);
  // Every Monday in the 14-day window stays closed.
  for (const hour of [57, 81 + 24 * 6]) {
    assert.equal(schedule.hours[hour].issuerOpen, schedule.hours[57].issuerOpen);
  }
  assert.equal(getOperationalStatus(holiday, 60).issuerOpen, false);
  assert.equal(getOperationalStatus(at({ horizonHours: 336 }), 66).issuerOpen, true);
});

test("calendar overrides validate ranges, fields, and the horizon bound", () => {
  assert.deepEqual(sanitizeCalendarOverrides(undefined, 72), { overrides: undefined, errors: [] });
  assert.ok(sanitizeCalendarOverrides("nope", 72).errors.length > 0);
  assert.ok(sanitizeCalendarOverrides(new Array(MAX_CALENDAR_OVERRIDES + 1).fill({ startHour: 0, endHour: 1 }), 72).errors.length > 0);
  assert.ok(sanitizeCalendarOverrides([{ startHour: 0, endHour: 73 }], 72).errors.length > 0);
  assert.ok(sanitizeCalendarOverrides([{ startHour: 5, endHour: 5 }], 72).errors.length > 0);
  assert.ok(sanitizeCalendarOverrides([{ startHour: -1, endHour: 5 }], 72).errors.length > 0);
  assert.ok(sanitizeCalendarOverrides([{ startHour: 0, endHour: 1, bogus: 1 }], 72).errors.length > 0);
  assert.ok(sanitizeCalendarOverrides([{ startHour: 0, endHour: 1, gates: { issuer: "ajar" } }], 72).errors.length > 0);
  assert.ok(sanitizeCalendarOverrides([{ startHour: 0, endHour: 1, gates: { vault: "open" } }], 72).errors.length > 0);
  assert.ok(sanitizeCalendarOverrides([{ startHour: 0, endHour: 1, fx: "stormy" }], 72).errors.length > 0);
  assert.ok(sanitizeCalendarOverrides([{ startHour: 0, endHour: 1, throughput: { issuer: -1 } }], 72).errors.length > 0);
  assert.ok(sanitizeCalendarOverrides([{ startHour: 0, endHour: 1, throughput: { vault: 1 } }], 72).errors.length > 0);
  assert.ok(sanitizeCalendarOverrides([null], 72).errors.length > 0);
  const good = sanitizeCalendarOverrides([
    { startHour: 0, endHour: 72, gates: { payout: "closed" } },
    { startHour: 60, endHour: 68, gates: { payout: "open" }, throughput: { payout: 500000 } },
  ], 72);
  assert.deepEqual(good.errors, []);
  assert.equal(good.overrides.length, 2);
});

test("overrides outside the horizon are rejected, not clamped", () => {
  const result = sanitizeScenario(at({ horizonHours: 72, calendarOverrides: [{ startHour: 70, endHour: 80 }] }));
  assert.ok(result.errors.some((error) => error.includes("Calendar override 1")));
  assert.equal(result.scenario.calendarOverrides, undefined);
});

test("gate overrides close and reopen windows inside the modeled period", () => {
  const closed = at({ calendarOverrides: [{ startHour: 0, endHour: 72, gates: { issuer: "closed", bank: "closed", payout: "closed" } }] });
  assert.equal(getOperationalStatus(closed, 10).issuerOpen, false);
  assert.equal(getOperationalStatus(closed, 10).bankOpen, false);
  assert.equal(getOperationalStatus(closed, 10).payoutOpen, false);
  assert.equal(getOperationalStatus(closed, 72).issuerOpen, getOperationalStatus(DEFAULT_SCENARIO, 72).issuerOpen);
  const reopened = at({ calendarOverrides: [
    { startHour: 0, endHour: 72, gates: { payout: "closed" } },
    { startHour: 60, endHour: 68, gates: { payout: "open" } },
  ] });
  assert.equal(getOperationalStatus(reopened, 59).payoutOpen, getOperationalStatus(DEFAULT_SCENARIO, 59).payoutOpen);
  assert.equal(getOperationalStatus(reopened, 62).payoutOpen, true);
  assert.equal(getOperationalStatus(reopened, 68).payoutOpen, false);
  assert.equal(getOperationalStatus(reopened, 72).payoutOpen, getOperationalStatus(DEFAULT_SCENARIO, 72).payoutOpen);
});

test("throughput overrides rescale hourly capacity without touching gates", () => {
  const boosted = at({ calendarOverrides: [{ startHour: 0, endHour: 72, throughput: { issuer: 9000000, payout: 9000000, fx: 9000000 } }] });
  assert.equal(throughputAtHour(boosted, 10).issuer, 9000000);
  assert.equal(getOperationalStatus(boosted, 10).issuerOpen, getOperationalStatus(DEFAULT_SCENARIO, 10).issuerOpen);
  const base = runSimulation(DEFAULT_SCENARIO);
  const faster = runSimulation(boosted);
  assert.ok(faster.summary.totalSettledAud >= base.summary.totalSettledAud);
  const throttled = at({ calendarOverrides: [{ startHour: 0, endHour: 72, throughput: { payout: 1 } }] });
  assert.equal(runSimulation(throttled).summary.totalSettledAud <= base.summary.totalSettledAud, true);
});

test("weekend FX override changes depth treatment on weekend hours", () => {
  const open = at({ calendarOverrides: [{ startHour: 9, endHour: 33, fx: "weekday" }] });
  assert.equal(getOperationalStatus(open, 12).fxWeekday, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 12).fxWeekday, false);
});

test("override merging is per field with later entries winning", () => {
  const scenario = at({ calendarOverrides: [
    { startHour: 0, endHour: 72, gates: { issuer: "closed", bank: "closed" } },
    { startHour: 10, endHour: 20, gates: { bank: "open" } },
  ] });
  const merged = overrideAtHour(scenario, 15);
  assert.equal(merged.gates.issuer, "closed");
  assert.equal(merged.gates.bank, "open");
  assert.equal(overrideAtHour(scenario, 5).gates.bank, "closed");
  assert.equal(overrideAtHour(scenario, 72), null);
});

test("svg ticks mark hour zero, local midnights, and the final hour", () => {
  assert.deepEqual(svgTickHours(72), [0, 9, 33, 57, 72]);
  assert.deepEqual(svgTickHours(24), [0, 9, 24]);
  const ticks = svgTickHours(336);
  assert.equal(ticks[0], 0);
  assert.equal(ticks[ticks.length - 1], 336);
  assert.ok(ticks.every((hour, index) => index === 0 || hour > ticks[index - 1]));
});

test("first and last hour finders respect the horizon", () => {
  const long = at({ horizonHours: 200 });
  assert.equal(firstClosedGanttHour(long), firstClosedGanttHour(DEFAULT_SCENARIO));
  const schedule = buildGateSchedule(long);
  assert.equal(schedule.hours.length, 201);
});

test("workspace bounds follow the scenario horizon", () => {
  const base = JSON.parse(workspaceToJSON(DEFAULT_SCENARIO, DEFAULT_SCENARIO, {}));
  assert.throws(() => workspaceToJSON(DEFAULT_SCENARIO, DEFAULT_SCENARIO, { selectedHour: 73 }), RangeError);
  const long = { ...DEFAULT_SCENARIO, horizonHours: 200 };
  const saved = JSON.parse(workspaceToJSON(long, long, { selectedHour: 150, deadlineHour: 200 }));
  assert.equal(saved.selectedHour, 150);
  assert.equal(workspaceFromJSON(JSON.stringify(saved)).workspace.selectedHour, 150);
  assert.throws(() => workspaceToJSON(long, long, { selectedHour: 201 }), RangeError);
  const legacy = JSON.parse(workspaceToJSON(DEFAULT_SCENARIO, DEFAULT_SCENARIO, {}));
  delete legacy.horizonHours;
  assert.equal(workspaceFromJSON(JSON.stringify(legacy)).workspace.selectedHour, 0);
});

test("reserve planner defaults and bounds follow the horizon", () => {
  const long = at({ horizonHours: 200 });
  const planned = planReserve(long, 100);
  assert.equal(planned.deadlineHour, 200);
  assert.equal(planReserve(long, 100, null).deadlineHour, 200);
  assert.throws(() => planReserve(long, 100, 201), RangeError);
  assert.throws(() => planReserve(DEFAULT_SCENARIO, 100, 73), RangeError);
});
