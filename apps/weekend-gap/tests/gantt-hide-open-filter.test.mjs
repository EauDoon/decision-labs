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

test("open-on-every-gate helper requires issuer, bank, payout and weekday FX", () => {
  const schedule = buildGateSchedule(DEFAULT_SCENARIO);
  assert.equal(ganttHourOpenOnEveryGate(schedule.hours[0]), true);
  assert.equal(ganttHourOpenOnEveryGate(schedule.hours[2]), false);
  assert.equal(ganttHourOpenOnEveryGate(schedule.hours[21]), false);
  const openEvery = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourOpenOnEveryGate(point)).length;
  const everyClosed = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourClosedOnEveryGate(point)).length;
  assert.equal(openEvery, 9);
  assert.ok(openEvery + everyClosed < SIMULATION_HOURS);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
});

test("hide-open Gantt SVG is display-only and leaves the 72-hour model unchanged", () => {
  const full = buildGateGanttSvg(DEFAULT_SCENARIO, 0);
  const hiddenOpen = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideOpenHours: true });
  const holiday = { ...DEFAULT_SCENARIO, mondayHoliday: true };
  const weekdayOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekdayHours: true });
  const composedWeekday = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideOpenHours: true, hideWeekdayHours: true });
  const everyClosed = buildGateGanttSvg(holiday, 0, { everyClosedOnly: true });
  const composedClosed = buildGateGanttSvg(holiday, 0, { hideOpenHours: true, everyClosedOnly: true });
  assert.notEqual(full, hiddenOpen);
  assert.match(hiddenOpen, /viewBox="0 0 720/);
  const hiddenRects = (hiddenOpen.match(/<rect /g) || []).length;
  const fullRects = (full.match(/<rect /g) || []).length;
  const weekdayRects = (weekdayOnly.match(/<rect /g) || []).length;
  const composedWeekdayRects = (composedWeekday.match(/<rect /g) || []).length;
  const everyRects = (everyClosed.match(/<rect /g) || []).length;
  const composedClosedRects = (composedClosed.match(/<rect /g) || []).length;
  assert.ok(hiddenRects < fullRects);
  assert.ok(composedWeekdayRects <= weekdayRects);
  assert.equal(composedClosedRects, everyRects);
  assert.equal(attributeBottlenecks(DEFAULT_SCENARIO).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
});

test("hide-open Gantt filter is a display control that can restore all hours", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-open"/);
  assert.match(html, /Hide hours that are open on every gate/);
  assert.match(app, /ganttHourOpenOnEveryGate/);
  assert.match(app, /hideOpenHours/);
  assert.match(app, /Display only/);
  assert.match(app, /The model still contains/);
});
