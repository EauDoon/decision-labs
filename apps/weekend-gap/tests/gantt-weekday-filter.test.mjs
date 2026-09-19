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

test("weekend-hour helper is Saturday and Sunday only", () => {
  const schedule = buildGateSchedule(DEFAULT_SCENARIO);
  assert.equal(ganttHourIsWeekend(schedule.hours[0]), false);
  assert.equal(ganttHourIsWeekend(schedule.hours[8]), false);
  assert.equal(ganttHourIsWeekend(schedule.hours[9]), true);
  assert.equal(ganttHourIsWeekend(schedule.hours[21]), true);
  assert.equal(ganttHourIsWeekend(schedule.hours[56]), true);
  assert.equal(ganttHourIsWeekend(schedule.hours[57]), false);
  assert.equal(ganttHourIsWeekend(schedule.hours[72]), false);
  const weekendHours = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourIsWeekend(point)).length;
  assert.equal(weekendHours, 48);
});

test("weekday-hidden Gantt SVG is display-only and leaves the 72-hour model unchanged", () => {
  const full = buildGateGanttSvg(DEFAULT_SCENARIO, 0);
  const weekendOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hourFilter: "weekend" });
  const weekdayOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hourFilter: "weekday" });
  const fxOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hourFilter: "weekend", gateFilter: "fx" });
  const composed = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hourFilter: "weekend", gateFilter: "fx" });
  assert.notEqual(full, weekendOnly);
  assert.notEqual(weekendOnly, weekdayOnly);
  assert.match(weekendOnly, /viewBox="0 0 720/);
  const weekendRects = (weekendOnly.match(/<rect /g) || []).length;
  const fullRects = (full.match(/<rect /g) || []).length;
  const fxRects = (fxOnly.match(/<rect /g) || []).length;
  assert.ok(weekendRects < fullRects);
  assert.ok(fxRects < weekendRects);
  assert.equal(attributeBottlenecks(DEFAULT_SCENARIO).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
});

test("weekday-hour Gantt filter is a display control that can restore all hours", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hour-filter"/);
  assert.match(html, /Saturday and Sunday hours/);
  assert.match(app, /hourFilter/);
  assert.match(app, /hourFilter/);
  assert.match(app, /currentGanttHourFilter/);
  assert.match(app, /Display only/);
  assert.match(app, /The model still contains/);
});
