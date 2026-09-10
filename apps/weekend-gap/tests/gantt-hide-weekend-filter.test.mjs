import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  SIMULATION_HOURS,
  attributeBottlenecks,
  buildGateGanttSvg,
  buildGateSchedule,
  ganttHourIsWeekend,
  runSimulation
} from "../src/model.js";

test("weekend-hidden Gantt SVG is display-only and leaves the 72-hour model unchanged", () => {
  const full = buildGateGanttSvg(DEFAULT_SCENARIO, 0);
  const weekdayOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendHours: true });
  const weekendOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekdayHours: true });
  const both = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendHours: true, hideWeekdayHours: true });
  const holiday = { ...DEFAULT_SCENARIO, mondayHoliday: true };
  const everyClosed = buildGateGanttSvg(holiday, 0, { everyClosedOnly: true });
  const composedClosed = buildGateGanttSvg(holiday, 0, { hideWeekendHours: true, everyClosedOnly: true });
  const hiddenOpen = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideOpenHours: true });
  const composedOpen = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendHours: true, hideOpenHours: true });
  const fxOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendHours: true, gateFilter: "fx" });
  assert.notEqual(full, weekdayOnly);
  assert.notEqual(weekdayOnly, weekendOnly);
  assert.match(weekdayOnly, /viewBox="0 0 720/);
  const weekdayRects = (weekdayOnly.match(/<rect /g) || []).length;
  const weekendRects = (weekendOnly.match(/<rect /g) || []).length;
  const fullRects = (full.match(/<rect /g) || []).length;
  const bothRects = (both.match(/<rect /g) || []).length;
  const everyRects = (everyClosed.match(/<rect /g) || []).length;
  const composedClosedRects = (composedClosed.match(/<rect /g) || []).length;
  const hiddenOpenRects = (hiddenOpen.match(/<rect /g) || []).length;
  const composedOpenRects = (composedOpen.match(/<rect /g) || []).length;
  const fxRects = (fxOnly.match(/<rect /g) || []).length;
  assert.ok(weekdayRects < fullRects);
  assert.ok(weekendRects < fullRects);
  assert.ok(bothRects < weekdayRects);
  assert.ok(composedClosedRects < everyRects);
  assert.ok(composedOpenRects < hiddenOpenRects);
  assert.ok(fxRects < weekdayRects);
  assert.equal(attributeBottlenecks(DEFAULT_SCENARIO).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
  const schedule = buildGateSchedule(DEFAULT_SCENARIO);
  const weekendHours = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourIsWeekend(point)).length;
  const weekdayHours = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && !ganttHourIsWeekend(point)).length;
  assert.equal(weekendHours, 48);
  assert.equal(weekdayHours, 24);
});

test("hide-weekend Gantt filter is a display control that can restore all hours", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-weekends"/);
  assert.match(html, /Hide Saturday and Sunday hours/);
  assert.match(app, /ganttHourIsWeekend/);
  assert.match(app, /hideWeekendHours/);
  assert.match(app, /Display only/);
  assert.match(app, /The model still contains/);
});
