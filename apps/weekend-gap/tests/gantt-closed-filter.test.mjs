import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  SIMULATION_HOURS,
  attributeBottlenecks,
  buildGateGanttSvg,
  buildGateSchedule,
  ganttHourClosedOnAnyGate,
  runSimulation
} from "../src/model.js";

test("closed-on-any-gate helper matches issuer, bank, payout or weekend FX", () => {
  const schedule = buildGateSchedule(DEFAULT_SCENARIO);
  assert.equal(ganttHourClosedOnAnyGate(schedule.hours[0]), false);
  assert.equal(ganttHourClosedOnAnyGate(schedule.hours[2]), true);
  assert.equal(ganttHourClosedOnAnyGate(schedule.hours[21]), true);
  assert.equal(schedule.hours.length, SIMULATION_HOURS + 1);
  const closedChartHours = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourClosedOnAnyGate(point)).length;
  assert.equal(closedChartHours, 63);
  assert.equal(attributeBottlenecks(DEFAULT_SCENARIO).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
});

test("closed-only Gantt SVG is a local drawing and leaves the 72-hour model unchanged", () => {
  const full = buildGateGanttSvg(DEFAULT_SCENARIO, 0);
  const filtered = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hourFilter: "any-closed" });
  assert.notEqual(full, filtered);
  assert.match(filtered, /viewBox="0 0 720/);
  const closedRects = (filtered.match(/<rect /g) || []).length;
  const fullRects = (full.match(/<rect /g) || []).length;
  assert.ok(closedRects < fullRects);
  assert.equal(attributeBottlenecks(DEFAULT_SCENARIO).rows.reduce((sum, row) => sum + row.hours, 0), SIMULATION_HOURS);
});

test("closed-hours Gantt filter is a display control next to density", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hour-filter"/);
  assert.match(html, /Hours closed on at least one gate/);
  assert.match(html, /id="gantt-filter-note"/);
  assert.match(app, /ganttHourMatchesFilter/);
  assert.match(app, /currentGanttHourFilter/);
  assert.match(app, /The model still contains/);
});
