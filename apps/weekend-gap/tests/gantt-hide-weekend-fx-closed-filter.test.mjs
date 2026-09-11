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
  ganttHourFxClosed,
  ganttHourIsWeekend,
  ganttHourWeekendFxClosed,
  ganttHourWeekendFxOpen,
  ganttHourWeekendPayoutClosed,
  runSimulation
} from "../src/model.js";

test("weekend-FX-closed helper hides hours that are weekend and FX-closed", () => {
  const schedule = buildGateSchedule(DEFAULT_SCENARIO);
  assert.equal(ganttHourWeekendFxClosed(schedule.hours[0]), false);
  assert.equal(ganttHourFxClosed(schedule.hours[0]), false);
  assert.equal(ganttHourIsWeekend(schedule.hours[0]), false);
  assert.equal(ganttHourWeekendFxClosed(schedule.hours[9]), true);
  assert.equal(ganttHourIsWeekend(schedule.hours[9]), true);
  assert.equal(ganttHourFxClosed(schedule.hours[9]), true);
  assert.equal(ganttHourWeekendFxClosed(null), false);
  assert.equal(ganttHourWeekendFxClosed({}), false);
  const early = buildGateSchedule(PRESETS.saturdayEarlyFxOpen);
  assert.equal(ganttHourWeekendFxClosed(early.hours[14]), true);
  assert.equal(ganttHourWeekendFxClosed(early.hours[15]), false);
  assert.equal(ganttHourWeekendFxClosed(early.hours[20]), false);
  assert.equal(ganttHourWeekendFxClosed(early.hours[21]), true);
  assert.equal(ganttHourWeekendFxClosed(early.hours[0]), false);
  const payout = buildGateSchedule(PRESETS.saturdayEarlyPayoutOpen);
  assert.equal(ganttHourWeekendFxClosed(early.hours[15]), false);
  assert.equal(ganttHourWeekendFxOpen(early.hours[15]), true);
  assert.equal(ganttHourWeekendPayoutClosed(payout.hours[16]), false);
  const mondayHoliday = buildGateSchedule({ ...DEFAULT_SCENARIO, mondayHoliday: true });
  assert.equal(ganttHourWeekendFxClosed(mondayHoliday.hours[65]), false);
  assert.equal(ganttHourFxClosed(mondayHoliday.hours[65]), true);
  const weekendFxClosed = early.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourWeekendFxClosed(point)).length;
  const fxClosed = early.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourFxClosed(point)).length;
  const weekendFxOpen = early.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourWeekendFxOpen(point)).length;
  assert.ok(weekendFxClosed > 0);
  assert.ok(fxClosed === weekendFxClosed);
  assert.equal(weekendFxOpen, 6);
  assert.ok(weekendFxClosed !== weekendFxOpen);
  const holidayFxClosed = mondayHoliday.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourFxClosed(point)).length;
  const holidayWeekendFxClosed = mondayHoliday.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourWeekendFxClosed(point)).length;
  assert.ok(holidayFxClosed > holidayWeekendFxClosed);
});

test("hide-weekend-FX-closed Gantt SVG is display-only and keeps the selected hour visible", () => {
  const early = PRESETS.saturdayEarlyFxOpen;
  const payout = PRESETS.saturdayEarlyPayoutOpen;
  const holiday = { ...DEFAULT_SCENARIO, mondayHoliday: true };
  const full = buildGateGanttSvg(early, 0);
  const hiddenWeekendFxClosed = buildGateGanttSvg(early, 0, { hideWeekendFxClosedHours: true });
  const hiddenFxClosed = buildGateGanttSvg(early, 0, { hideFxClosedHours: true });
  const hiddenWeekend = buildGateGanttSvg(early, 0, { hideWeekendHours: true });
  const hiddenWeekendFxOpen = buildGateGanttSvg(early, 0, { hideWeekendFxOpenHours: true });
  const hiddenWeekendPayoutClosed = buildGateGanttSvg(payout, 0, { hideWeekendPayoutClosedHours: true });
  const hiddenWeekendFxClosedOnPayout = buildGateGanttSvg(payout, 0, { hideWeekendFxClosedHours: true });
  const selectedWeekendClosed = buildGateGanttSvg(early, 41, { hideWeekendFxClosedHours: true });
  const selectedWeekday = buildGateGanttSvg(early, 0, { hideWeekendFxClosedHours: true });
  assert.notEqual(full, hiddenWeekendFxClosed);
  assert.notEqual(hiddenWeekendFxClosed, hiddenWeekend);
  assert.notEqual(hiddenWeekendFxClosed, hiddenWeekendFxOpen);
  assert.notEqual(hiddenWeekendFxClosedOnPayout, hiddenWeekendPayoutClosed);
  assert.match(hiddenWeekendFxClosed, /viewBox="0 0 720/);
  const hiddenRects = (hiddenWeekendFxClosed.match(/<rect /g) || []).length;
  const fullRects = (full.match(/<rect /g) || []).length;
  const fxRects = (hiddenFxClosed.match(/<rect /g) || []).length;
  const weekendRects = (hiddenWeekend.match(/<rect /g) || []).length;
  const openRects = (hiddenWeekendFxOpen.match(/<rect /g) || []).length;
  const selectedClosedRects = (selectedWeekendClosed.match(/<rect /g) || []).length;
  const selectedWeekdayRects = (selectedWeekday.match(/<rect /g) || []).length;
  assert.ok(hiddenRects < fullRects);
  assert.ok(weekendRects < hiddenRects);
  assert.ok(openRects !== hiddenRects);
  assert.ok(selectedClosedRects > selectedWeekdayRects);
  const defaultHidden = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendFxClosedHours: true });
  const defaultWeekend = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendHours: true });
  assert.equal((defaultHidden.match(/<rect /g) || []).length, (defaultWeekend.match(/<rect /g) || []).length);
  const holidayHiddenWeekendFxClosed = buildGateGanttSvg(holiday, 0, { hideWeekendFxClosedHours: true });
  const holidayHiddenFxClosed = buildGateGanttSvg(holiday, 0, { hideFxClosedHours: true });
  assert.notEqual(holidayHiddenWeekendFxClosed, holidayHiddenFxClosed);
  assert.ok((holidayHiddenFxClosed.match(/<rect /g) || []).length < (holidayHiddenWeekendFxClosed.match(/<rect /g) || []).length);
  assert.equal((hiddenWeekendFxClosed.match(/<rect /g) || []).length, (hiddenFxClosed.match(/<rect /g) || []).length);
  assert.equal(attributeBottlenecks(early).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(early).timeline.length, SIMULATION_HOURS + 1);
});

test("hide-weekend-FX-closed Gantt filter is a display control that can restore all hours", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-weekend-fx-closed"/);
  assert.match(html, /Hide weekend hours where the FX gate is closed/);
  assert.match(html, /id="gantt-hide-fx-closed"/);
  assert.match(html, /id="gantt-hide-weekend-fx-open"/);
  assert.match(html, /id="gantt-hide-weekend-payout-closed"/);
  assert.match(app, /ganttHourWeekendFxClosed/);
  assert.match(app, /hideWeekendFxClosedHours/);
  assert.match(app, /hideFxClosedHours/);
  assert.match(app, /hideWeekendFxOpenHours/);
  assert.match(app, /hideWeekendPayoutClosedHours/);
  assert.match(app, /hour !== selectedHour/);
  assert.match(app, /Display only/);
  assert.match(app, /The model still contains/);
});
