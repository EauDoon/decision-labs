import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  SIMULATION_HOURS,
  attributeBottlenecks,
  buildGateGanttSvg,
  ganttHourHasZeroQueue,
  buildGateGanttSvg,
} from "../src/model.js";

test("zero-queue helper hides hours whose synthetic queue is zero", () => {
  const result = runSimulation(DEFAULT_SCENARIO);
  assert.equal(ganttHourHasZeroQueue(result.timeline[0]), true);
  const firstQueued = result.timeline.find((point) => point.queuedAud > 0);
  assert.ok(firstQueued);
  assert.equal(ganttHourHasZeroQueue(firstQueued), false);
  assert.equal(ganttHourHasZeroQueue({ queuedAud: 0 }), true);
  assert.equal(ganttHourHasZeroQueue({ queuedAud: 1 }), false);
  assert.equal(ganttHourHasZeroQueue(null), false);
  const zeroHours = result.timeline.filter((point) => point.hour < SIMULATION_HOURS && ganttHourHasZeroQueue(point)).length;
  const queuedHours = result.timeline.filter((point) => point.hour < SIMULATION_HOURS && !ganttHourHasZeroQueue(point)).length;
  assert.ok(zeroHours > 0);
  assert.ok(queuedHours > 0);
  assert.equal(zeroHours + queuedHours, SIMULATION_HOURS);
});

test("hide-zero-queue Gantt SVG is display-only and leaves the 72-hour model unchanged", () => {
  const full = buildGateGanttSvg(DEFAULT_SCENARIO, 0);
  const hiddenZero = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideZeroQueueHours: true });
  const hiddenOpen = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideOpenHours: true });
  const composedOpen = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideZeroQueueHours: true, hideOpenHours: true });
  const hiddenClosed = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideClosedHours: true });
  const composedClosed = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideZeroQueueHours: true, hideClosedHours: true });
  const weekdayOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekdayHours: true });
  const composedWeekday = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideZeroQueueHours: true, hideWeekdayHours: true });
  const weekendOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendHours: true });
  const composedWeekend = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideZeroQueueHours: true, hideWeekendHours: true });
  const holiday = { ...DEFAULT_SCENARIO, mondayHoliday: true };
  const everyClosed = buildGateGanttSvg(holiday, 0, { everyClosedOnly: true });
  const composedEvery = buildGateGanttSvg(holiday, 0, { hideZeroQueueHours: true, everyClosedOnly: true });
  const fxOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideZeroQueueHours: true, gateFilter: "fx" });
  assert.notEqual(full, hiddenZero);
  assert.notEqual(hiddenZero, hiddenOpen);
  assert.notEqual(hiddenZero, hiddenClosed);
  assert.match(hiddenZero, /viewBox="0 0 720/);
  const hiddenRects = (hiddenZero.match(/<rect /g) || []).length;
  const fullRects = (full.match(/<rect /g) || []).length;
  const composedOpenRects = (composedOpen.match(/<rect /g) || []).length;
  const hiddenOpenRects = (hiddenOpen.match(/<rect /g) || []).length;
  const composedClosedRects = (composedClosed.match(/<rect /g) || []).length;
  const hiddenClosedRects = (hiddenClosed.match(/<rect /g) || []).length;
  const weekdayRects = (weekdayOnly.match(/<rect /g) || []).length;
  const composedWeekdayRects = (composedWeekday.match(/<rect /g) || []).length;
  const weekendRects = (weekendOnly.match(/<rect /g) || []).length;
  const composedWeekendRects = (composedWeekend.match(/<rect /g) || []).length;
  const everyRects = (everyClosed.match(/<rect /g) || []).length;
  const composedEveryRects = (composedEvery.match(/<rect /g) || []).length;
  const fxRects = (fxOnly.match(/<rect /g) || []).length;
  assert.ok(hiddenRects < fullRects);
  assert.ok(composedOpenRects < hiddenOpenRects);
  assert.ok(composedClosedRects < hiddenClosedRects);
  assert.ok(composedWeekdayRects <= weekdayRects);
  assert.ok(composedWeekendRects <= weekendRects);
  assert.ok(composedEveryRects <= everyRects);
  assert.ok(fxRects < hiddenRects);
  assert.equal(attributeBottlenecks(DEFAULT_SCENARIO).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
});

test("hide-zero-queue Gantt filter is a display control that can restore all hours", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-zero-queue"/);
  assert.match(html, /Hide hours whose synthetic queue is zero/);
  assert.match(app, /ganttHourHasZeroQueue/);
  assert.match(app, /hideZeroQueueHours/);
  assert.match(app, /Display only/);
  assert.match(app, /The model still contains/);
});
