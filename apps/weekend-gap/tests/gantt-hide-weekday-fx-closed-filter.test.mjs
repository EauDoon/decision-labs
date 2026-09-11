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
  ganttHourWeekdayFxClosed,
  ganttHourWeekendFxOpen,
  runSimulation
} from "../src/model.js";

test("weekday-FX-closed helper hides hours that are weekday and FX-closed", () => {
  const schedule = buildGateSchedule(DEFAULT_SCENARIO);
  assert.equal(ganttHourWeekdayFxClosed(schedule.hours[0]), false);
  assert.equal(ganttHourFxClosed(schedule.hours[0]), false);
  assert.equal(ganttHourIsWeekend(schedule.hours[0]), false);
  assert.equal(ganttHourWeekendFxClosed(schedule.hours[9]), true);
  assert.equal(ganttHourWeekdayFxClosed(schedule.hours[9]), false);
  assert.equal(ganttHourWeekdayFxClosed(null), false);
  assert.equal(ganttHourWeekdayFxClosed({}), false);
  const holiday = buildGateSchedule({ ...DEFAULT_SCENARIO, mondayHoliday: true });
  assert.equal(ganttHourWeekdayFxClosed(holiday.hours[65]), true);
  assert.equal(ganttHourIsWeekend(holiday.hours[65]), false);
  assert.equal(ganttHourFxClosed(holiday.hours[65]), true);
  assert.equal(ganttHourWeekendFxClosed(holiday.hours[65]), false);
  assert.equal(ganttHourWeekdayFxClosed(holiday.hours[9]), false);
  assert.equal(ganttHourWeekendFxClosed(holiday.hours[9]), true);
  const early = buildGateSchedule(PRESETS.saturdayEarlyFxOpen);
  assert.equal(ganttHourWeekdayFxClosed(early.hours[15]), false);
  assert.equal(ganttHourWeekendFxOpen(early.hours[15]), true);
  const weekdayFxClosed = holiday.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourWeekdayFxClosed(point)).length;
  const weekendFxClosed = holiday.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourWeekendFxClosed(point)).length;
  const fxClosed = holiday.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourFxClosed(point)).length;
  assert.ok(weekdayFxClosed > 0);
  assert.ok(weekendFxClosed > 0);
  assert.ok(fxClosed === weekdayFxClosed + weekendFxClosed);
  const defaultWeekdayClosed = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourWeekdayFxClosed(point)).length;
  assert.equal(defaultWeekdayClosed, 0);
});

test("hide-weekday-FX-closed Gantt SVG is display-only and keeps the selected hour visible", () => {
  const holiday = { ...DEFAULT_SCENARIO, mondayHoliday: true };
  const early = PRESETS.saturdayEarlyFxOpen;
  const full = buildGateGanttSvg(holiday, 0);
  const hiddenWeekdayFxClosed = buildGateGanttSvg(holiday, 0, { hideWeekdayFxClosedHours: true });
  const hiddenFxClosed = buildGateGanttSvg(holiday, 0, { hideFxClosedHours: true });
  const hiddenWeekendFxClosed = buildGateGanttSvg(holiday, 0, { hideWeekendFxClosedHours: true });
  const hiddenWeekend = buildGateGanttSvg(holiday, 0, { hideWeekendHours: true });
  const selectedWeekdayClosed = buildGateGanttSvg(holiday, 65, { hideWeekdayFxClosedHours: true });
  const selectedWeekend = buildGateGanttSvg(holiday, 0, { hideWeekdayFxClosedHours: true });
  assert.notEqual(full, hiddenWeekdayFxClosed);
  assert.notEqual(hiddenWeekdayFxClosed, hiddenFxClosed);
  assert.notEqual(hiddenWeekdayFxClosed, hiddenWeekendFxClosed);
  assert.notEqual(hiddenWeekdayFxClosed, hiddenWeekend);
  assert.match(hiddenWeekdayFxClosed, /viewBox="0 0 720/);
  const hiddenRects = (hiddenWeekdayFxClosed.match(/<rect /g) || []).length;
  const fullRects = (full.match(/<rect /g) || []).length;
  const fxRects = (hiddenFxClosed.match(/<rect /g) || []).length;
  const weekendFxClosedRects = (hiddenWeekendFxClosed.match(/<rect /g) || []).length;
  const selectedClosedRects = (selectedWeekdayClosed.match(/<rect /g) || []).length;
  const selectedWeekendRects = (selectedWeekend.match(/<rect /g) || []).length;
  assert.ok(hiddenRects < fullRects);
  assert.ok(fxRects < hiddenRects);
  assert.ok(hiddenRects !== weekendFxClosedRects);
  assert.ok(selectedClosedRects > selectedWeekendRects);
  const defaultHidden = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekdayFxClosedHours: true });
  const defaultFull = buildGateGanttSvg(DEFAULT_SCENARIO, 0);
  assert.equal((defaultHidden.match(/<rect /g) || []).length, (defaultFull.match(/<rect /g) || []).length);
  const earlyHiddenWeekday = buildGateGanttSvg(early, 0, { hideWeekdayFxClosedHours: true });
  const earlyHiddenWeekendFxClosed = buildGateGanttSvg(early, 0, { hideWeekendFxClosedHours: true });
  assert.notEqual(earlyHiddenWeekday, earlyHiddenWeekendFxClosed);
  assert.equal(attributeBottlenecks(holiday).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(holiday).timeline.length, SIMULATION_HOURS + 1);
});

test("hide-weekday-FX-closed Gantt filter is a display control that can restore all hours", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-weekday-fx-closed"/);
  assert.match(html, /Hide weekday hours where the FX gate is closed/);
  assert.match(html, /id="gantt-hide-fx-closed"/);
  assert.match(html, /id="gantt-hide-weekend-fx-closed"/);
  assert.match(html, /id="gantt-hide-weekend-fx-open"/);
  assert.match(app, /ganttHourWeekdayFxClosed/);
  assert.match(app, /hideWeekdayFxClosedHours/);
  assert.match(app, /hideWeekendFxClosedHours/);
  assert.match(app, /hideFxClosedHours/);
  assert.match(app, /hour !== selectedHour/);
  assert.match(app, /Display only/);
  assert.match(app, /The model still contains/);
});
