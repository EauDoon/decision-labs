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
  ganttHourClosedOnAnyGate,
  runSimulation
} from "../src/model.js";

test("every-gate-closed helper requires issuer, bank, payout and weekend FX", () => {
  const schedule = buildGateSchedule(DEFAULT_SCENARIO);
  assert.equal(ganttHourClosedOnEveryGate(schedule.hours[0]), false);
  assert.equal(ganttHourClosedOnEveryGate(schedule.hours[2]), false);
  assert.equal(ganttHourClosedOnAnyGate(schedule.hours[2]), true);
  assert.equal(ganttHourClosedOnEveryGate(schedule.hours[21]), true);
  const everyClosed = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourClosedOnEveryGate(point)).length;
  assert.equal(everyClosed, 48);
  assert.ok(everyClosed < schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourClosedOnAnyGate(point)).length);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
});

test("every-gate-closed Gantt SVG is display-only and leaves the 72-hour model unchanged", () => {
  const full = buildGateGanttSvg(DEFAULT_SCENARIO, 0);
  const filtered = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { everyClosedOnly: true });
  assert.notEqual(full, filtered);
  assert.match(filtered, /viewBox="0 0 720/);
  const closedRects = (filtered.match(/<rect /g) || []).length;
  const fullRects = (full.match(/<rect /g) || []).length;
  assert.ok(closedRects < fullRects);
  assert.equal(attributeBottlenecks(DEFAULT_SCENARIO).hours, SIMULATION_HOURS);
});

test("every-gate-closed Gantt filter is a display control that can restore all hours", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-every-closed"/);
  assert.match(html, /Show only hours where every gate is closed/);
  assert.match(app, /ganttHourClosedOnEveryGate/);
  assert.match(app, /everyClosedOnly/);
  assert.match(app, /Uncheck to restore all hours/);
  assert.match(app, /Display only/);
});
