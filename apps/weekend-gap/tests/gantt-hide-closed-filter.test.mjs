import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  SIMULATION_HOURS,
  attributeBottlenecks,
  buildGateGanttSvg,
  buildGateSchedule,
  ganttHourClosedOnEveryGate,
  ganttHourOpenOnEveryGate,
  runSimulation
} from "../src/model.js";

test("closed-on-every-gate helper is the inverse of open-on-every-gate", () => {
  const schedule = buildGateSchedule(DEFAULT_SCENARIO);
  const closedEvery = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourClosedOnEveryGate(point)).length;
  const openEvery = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourOpenOnEveryGate(point)).length;
  assert.equal(ganttHourClosedOnEveryGate(schedule.hours[0]), false);
  assert.equal(ganttHourOpenOnEveryGate(schedule.hours[0]), true);
  assert.equal(ganttHourClosedOnEveryGate(schedule.hours[21]), true);
  assert.equal(ganttHourOpenOnEveryGate(schedule.hours[21]), false);
  assert.equal(closedEvery, 48);
  assert.equal(openEvery, 9);
  assert.ok(closedEvery + openEvery < SIMULATION_HOURS);
});

test("hide-closed Gantt SVG is display-only and leaves the 72-hour model unchanged", () => {
  const full = buildGateGanttSvg(DEFAULT_SCENARIO, 0);
  const hiddenClosed = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideClosedHours: true });
  const holiday = { ...DEFAULT_SCENARIO, mondayHoliday: true };
  const weekdayOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekdayHours: true });
  const composedWeekday = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideClosedHours: true, hideWeekdayHours: true });
  const weekendOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendHours: true });
  const composedWeekend = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideClosedHours: true, hideWeekendHours: true });
  const everyClosed = buildGateGanttSvg(holiday, 0, { everyClosedOnly: true });
  const composedEvery = buildGateGanttSvg(holiday, 0, { hideClosedHours: true, everyClosedOnly: true });
  const fxOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideClosedHours: true, gateFilter: "fx" });
  const hiddenOpen = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideOpenHours: true });
  const composedOpenClosed = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideOpenHours: true, hideClosedHours: true });
  assert.notEqual(full, hiddenClosed);
  assert.notEqual(hiddenClosed, hiddenOpen);
  assert.match(hiddenClosed, /viewBox="0 0 720/);
  const hiddenRects = (hiddenClosed.match(/<rect /g) || []).length;
  const fullRects = (full.match(/<rect /g) || []).length;
  const weekdayRects = (weekdayOnly.match(/<rect /g) || []).length;
  const composedWeekdayRects = (composedWeekday.match(/<rect /g) || []).length;
  const weekendRects = (weekendOnly.match(/<rect /g) || []).length;
  const composedWeekendRects = (composedWeekend.match(/<rect /g) || []).length;
  const everyRects = (everyClosed.match(/<rect /g) || []).length;
  const composedEveryRects = (composedEvery.match(/<rect /g) || []).length;
  const fxRects = (fxOnly.match(/<rect /g) || []).length;
  const composedOpenClosedRects = (composedOpenClosed.match(/<rect /g) || []).length;
  const hiddenOpenRects = (hiddenOpen.match(/<rect /g) || []).length;
  assert.ok(hiddenRects < fullRects);
  assert.ok(composedWeekdayRects < weekdayRects);
  assert.ok(composedWeekendRects <= weekendRects);
  assert.ok(composedEveryRects < everyRects);
  assert.ok(fxRects < hiddenRects);
  assert.ok(composedOpenClosedRects < hiddenOpenRects);
  assert.ok(composedOpenClosedRects < hiddenRects);
  assert.equal(attributeBottlenecks(DEFAULT_SCENARIO).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
});

test("hide-closed Gantt filter is a display control that can restore all hours", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-closed"/);
  assert.match(html, /Hide hours that are closed on every gate/);
  assert.match(app, /ganttHourClosedOnEveryGate/);
  assert.match(app, /hideClosedHours/);
  assert.match(app, /Display only/);
  assert.match(app, /The model still contains/);
});
