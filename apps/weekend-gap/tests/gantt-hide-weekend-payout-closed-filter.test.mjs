import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  PRESETS,
  SIMULATION_HOURS,
  attributeBottlenecks,
  buildGateGanttSvg,
  buildGateSchedule,
  ganttHourIsWeekend,
  ganttHourPayoutClosed,
  ganttHourWeekendFxOpen,
  ganttHourWeekendPayoutClosed,
  ganttHourWeekendPayoutOpen,
  runSimulation
} from "../src/model.js";

test("weekend-payout-closed helper hides hours that are weekend and payout-closed", () => {
  const schedule = buildGateSchedule(DEFAULT_SCENARIO);
  assert.equal(ganttHourWeekendPayoutClosed(schedule.hours[0]), false);
  assert.equal(ganttHourPayoutClosed(schedule.hours[0]), false);
  assert.equal(ganttHourIsWeekend(schedule.hours[0]), false);
  assert.equal(ganttHourWeekendPayoutClosed(schedule.hours[41]), true);
  assert.equal(ganttHourIsWeekend(schedule.hours[41]), true);
  assert.equal(ganttHourPayoutClosed(schedule.hours[41]), true);
  assert.equal(ganttHourWeekendPayoutClosed(null), false);
  assert.equal(ganttHourWeekendPayoutClosed({}), false);
  const early = buildGateSchedule(PRESETS.saturdayEarlyPayoutOpen);
  assert.equal(ganttHourWeekendPayoutClosed(early.hours[15]), true);
  assert.equal(ganttHourWeekendPayoutClosed(early.hours[16]), false);
  assert.equal(ganttHourWeekendPayoutClosed(early.hours[17]), false);
  assert.equal(ganttHourWeekendPayoutClosed(early.hours[18]), true);
  assert.equal(ganttHourWeekendPayoutClosed(early.hours[0]), false);
  const fx = buildGateSchedule(PRESETS.saturdayEarlyFxOpen);
  assert.equal(ganttHourWeekendPayoutClosed(early.hours[16]), false);
  assert.equal(ganttHourWeekendPayoutOpen(early.hours[16]), true);
  assert.equal(ganttHourWeekendFxOpen(fx.hours[15]), true);
  const weekendPayoutClosed = early.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourWeekendPayoutClosed(point)).length;
  const payoutClosed = early.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourPayoutClosed(point)).length;
  const weekendPayoutOpen = early.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourWeekendPayoutOpen(point)).length;
  assert.ok(weekendPayoutClosed > 0);
  assert.ok(payoutClosed > weekendPayoutClosed);
  assert.equal(weekendPayoutOpen, 2);
  assert.ok(weekendPayoutClosed !== weekendPayoutOpen);
});

test("hide-weekend-payout-closed Gantt SVG is display-only and keeps the selected hour visible", () => {
  const early = PRESETS.saturdayEarlyPayoutOpen;
  const fx = PRESETS.saturdayEarlyFxOpen;
  const full = buildGateGanttSvg(early, 0);
  const hiddenWeekendPayoutClosed = buildGateGanttSvg(early, 0, { hideWeekendPayoutClosedHours: true });
  const hiddenPayoutClosed = buildGateGanttSvg(early, 0, { hidePayoutClosedHours: true });
  const hiddenWeekend = buildGateGanttSvg(early, 0, { hideWeekendHours: true });
  const hiddenWeekendPayoutOpen = buildGateGanttSvg(early, 0, { hideWeekendPayoutOpenHours: true });
  const hiddenWeekendFxOpen = buildGateGanttSvg(fx, 0, { hideWeekendFxOpenHours: true });
  const hiddenWeekendPayoutClosedOnFx = buildGateGanttSvg(fx, 0, { hideWeekendPayoutClosedHours: true });
  const selectedWeekendClosed = buildGateGanttSvg(early, 41, { hideWeekendPayoutClosedHours: true });
  const selectedWeekday = buildGateGanttSvg(early, 0, { hideWeekendPayoutClosedHours: true });
  assert.notEqual(full, hiddenWeekendPayoutClosed);
  assert.notEqual(hiddenWeekendPayoutClosed, hiddenPayoutClosed);
  assert.notEqual(hiddenWeekendPayoutClosed, hiddenWeekend);
  assert.notEqual(hiddenWeekendPayoutClosed, hiddenWeekendPayoutOpen);
  assert.notEqual(hiddenWeekendPayoutClosedOnFx, hiddenWeekendFxOpen);
  assert.match(hiddenWeekendPayoutClosed, /viewBox="0 0 720/);
  const hiddenRects = (hiddenWeekendPayoutClosed.match(/<rect /g) || []).length;
  const fullRects = (full.match(/<rect /g) || []).length;
  const payoutRects = (hiddenPayoutClosed.match(/<rect /g) || []).length;
  const weekendRects = (hiddenWeekend.match(/<rect /g) || []).length;
  const openRects = (hiddenWeekendPayoutOpen.match(/<rect /g) || []).length;
  const selectedClosedRects = (selectedWeekendClosed.match(/<rect /g) || []).length;
  const selectedWeekdayRects = (selectedWeekday.match(/<rect /g) || []).length;
  assert.ok(hiddenRects < fullRects);
  assert.ok(payoutRects < hiddenRects);
  assert.ok(weekendRects < hiddenRects);
  assert.ok(openRects !== hiddenRects);
  assert.ok(selectedClosedRects > selectedWeekdayRects);
  const defaultHidden = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendPayoutClosedHours: true });
  const defaultWeekend = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendHours: true });
  assert.equal((defaultHidden.match(/<rect /g) || []).length, (defaultWeekend.match(/<rect /g) || []).length);
  assert.equal(attributeBottlenecks(early).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(early).timeline.length, SIMULATION_HOURS + 1);
});

test("hide-weekend-payout-closed Gantt filter is a display control that can restore all hours", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-weekend-payout-closed"/);
  assert.match(html, /Hide weekend hours where the payout gate is closed/);
  assert.match(html, /id="gantt-hide-weekend-fx-open"/);
  assert.match(html, /id="gantt-hide-weekend-payout-open"/);
  assert.match(html, /id="gantt-hide-payout-closed"/);
  assert.match(html, /id="gantt-hide-weekends"/);
  assert.match(app, /ganttHourWeekendPayoutClosed/);
  assert.match(app, /hideWeekendPayoutClosedHours/);
  assert.match(app, /hideWeekendFxOpenHours/);
  assert.match(app, /hideWeekendPayoutOpenHours/);
  assert.match(app, /hidePayoutClosedHours/);
  assert.match(app, /hour !== selectedHour/);
  assert.match(app, /Display only/);
  assert.match(app, /The model still contains/);
});
