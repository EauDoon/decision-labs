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
  ganttHourFxOpen,
  ganttHourIsWeekend,
  ganttHourWeekdayFxClosed,
  ganttHourWeekdayFxOpen,
  ganttHourWeekendFxOpen,
  runSimulation
} from "../src/model.js";

test("weekday-FX-open helper hides hours that are weekday and FX-open", () => {
  const schedule = buildGateSchedule(DEFAULT_SCENARIO);
  assert.equal(ganttHourWeekdayFxOpen(schedule.hours[0]), true);
  assert.equal(ganttHourFxOpen(schedule.hours[0]), true);
  assert.equal(ganttHourIsWeekend(schedule.hours[0]), false);
  assert.equal(ganttHourWeekendFxOpen(schedule.hours[0]), false);
  assert.equal(ganttHourWeekdayFxOpen(schedule.hours[9]), false);
  assert.equal(ganttHourIsWeekend(schedule.hours[9]), true);
  assert.equal(ganttHourFxOpen(schedule.hours[9]), false);
  assert.equal(ganttHourWeekdayFxOpen(null), false);
  assert.equal(ganttHourWeekdayFxOpen({}), false);
  const early = buildGateSchedule(PRESETS.sundayEarlyFxOpen);
  assert.equal(ganttHourWeekdayFxOpen(early.hours[41]), false);
  assert.equal(ganttHourWeekendFxOpen(early.hours[41]), true);
  assert.equal(ganttHourWeekdayFxOpen(early.hours[0]), true);
  const holiday = buildGateSchedule({ ...DEFAULT_SCENARIO, mondayHoliday: true });
  assert.equal(ganttHourWeekdayFxOpen(holiday.hours[65]), false);
  assert.equal(ganttHourWeekdayFxClosed(holiday.hours[65]), true);
  const weekdayFxOpen = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourWeekdayFxOpen(point)).length;
  const weekendFxOpen = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourWeekendFxOpen(point)).length;
  const fxOpen = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourFxOpen(point)).length;
  assert.ok(weekdayFxOpen > 0);
  assert.equal(weekendFxOpen, 0);
  assert.equal(fxOpen, weekdayFxOpen);
  const earlyWeekendOpen = early.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourWeekendFxOpen(point)).length;
  const earlyWeekdayOpen = early.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourWeekdayFxOpen(point)).length;
  assert.equal(earlyWeekendOpen, 2);
  assert.equal(earlyWeekdayOpen, weekdayFxOpen);
});

test("hide-weekday-FX-open Gantt SVG is display-only and keeps the selected hour visible", () => {
  const early = PRESETS.sundayEarlyFxOpen;
  const full = buildGateGanttSvg(early, 0);
  const hiddenWeekdayFxOpen = buildGateGanttSvg(early, 0, { hideWeekdayFxOpenHours: true });
  const hiddenWeekendFxOpen = buildGateGanttSvg(early, 0, { hideWeekendFxOpenHours: true });
  const hiddenFxOpen = buildGateGanttSvg(early, 0, { hideFxOpenHours: true });
  const hiddenWeekdayFxClosed = buildGateGanttSvg(early, 0, { hideWeekdayFxClosedHours: true });
  const selectedWeekdayOpen = buildGateGanttSvg(early, 0, { hideWeekdayFxOpenHours: true });
  const selectedWeekend = buildGateGanttSvg(early, 9, { hideWeekdayFxOpenHours: true });
  assert.notEqual(full, hiddenWeekdayFxOpen);
  assert.notEqual(hiddenWeekdayFxOpen, hiddenWeekendFxOpen);
  assert.notEqual(hiddenWeekdayFxOpen, hiddenFxOpen);
  assert.notEqual(hiddenWeekdayFxOpen, hiddenWeekdayFxClosed);
  assert.match(hiddenWeekdayFxOpen, /viewBox="0 0 720/);
  const hiddenRects = (hiddenWeekdayFxOpen.match(/<rect /g) || []).length;
  const fullRects = (full.match(/<rect /g) || []).length;
  const fxRects = (hiddenFxOpen.match(/<rect /g) || []).length;
  const weekendRects = (hiddenWeekendFxOpen.match(/<rect /g) || []).length;
  const selectedOpenRects = (selectedWeekdayOpen.match(/<rect /g) || []).length;
  const selectedWeekendRects = (selectedWeekend.match(/<rect /g) || []).length;
  assert.ok(hiddenRects < fullRects);
  assert.ok(fxRects < hiddenRects);
  assert.ok(weekendRects !== fullRects);
  assert.ok(selectedOpenRects > selectedWeekendRects);
  const defaultFull = buildGateGanttSvg(DEFAULT_SCENARIO, 0);
  const defaultHiddenWeekend = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendFxOpenHours: true });
  const defaultHiddenWeekday = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekdayFxOpenHours: true });
  const defaultHiddenFx = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideFxOpenHours: true });
  assert.equal(defaultHiddenWeekend, defaultFull);
  assert.notEqual(defaultHiddenWeekday, defaultFull);
  assert.equal(defaultHiddenWeekday, defaultHiddenFx);
  assert.equal(attributeBottlenecks(DEFAULT_SCENARIO).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
});

test("hide-weekday-FX-open Gantt filter is a display control that can restore all hours", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-weekday-fx-open"/);
  assert.match(html, /Hide weekday hours where the FX gate is open/);
  assert.match(html, /id="gantt-hide-weekend-fx-open"/);
  assert.match(html, /id="gantt-hide-fx-open"/);
  assert.match(html, /id="gantt-hide-weekday-fx-closed"/);
  assert.match(app, /ganttHourWeekdayFxOpen/);
  assert.match(app, /hideWeekdayFxOpenHours/);
  assert.match(app, /hideWeekendFxOpenHours/);
  assert.match(app, /hideFxOpenHours/);
  assert.match(app, /hour !== selectedHour/);
  assert.match(app, /Display only/);
  assert.match(app, /The model still contains/);
});
