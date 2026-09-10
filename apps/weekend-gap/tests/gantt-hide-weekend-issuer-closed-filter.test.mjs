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
  ganttHourIsWeekend,
  ganttHourIssuerClosed,
  ganttHourWeekendIssuerClosed,
  ganttHourWeekendIssuerOpen,
  runSimulation
} from "../src/model.js";

test("weekend-issuer-closed helper hides hours that are weekend and issuer-closed", () => {
  const schedule = buildGateSchedule(DEFAULT_SCENARIO);
  assert.equal(ganttHourWeekendIssuerClosed(schedule.hours[0]), false);
  assert.equal(ganttHourIssuerClosed(schedule.hours[0]), false);
  assert.equal(ganttHourIsWeekend(schedule.hours[0]), false);
  assert.equal(ganttHourWeekendIssuerClosed(schedule.hours[41]), true);
  assert.equal(ganttHourIsWeekend(schedule.hours[41]), true);
  assert.equal(ganttHourIssuerClosed(schedule.hours[41]), true);
  assert.equal(ganttHourWeekendIssuerOpen(schedule.hours[41]), false);
  assert.equal(ganttHourWeekendIssuerClosed(null), false);
  assert.equal(ganttHourWeekendIssuerClosed({}), false);
  const saturday = buildGateSchedule(PRESETS.saturdayEarlyIssuerOpen);
  assert.equal(ganttHourWeekendIssuerClosed(saturday.hours[16]), true);
  assert.equal(ganttHourWeekendIssuerClosed(saturday.hours[17]), false);
  assert.equal(ganttHourWeekendIssuerOpen(saturday.hours[17]), true);
  assert.equal(ganttHourWeekendIssuerClosed(saturday.hours[18]), false);
  assert.equal(ganttHourWeekendIssuerClosed(saturday.hours[19]), true);
  assert.equal(ganttHourWeekendIssuerClosed(saturday.hours[0]), false);
  const sunday = buildGateSchedule(PRESETS.sundayEarlyIssuerOpen);
  assert.equal(ganttHourWeekendIssuerClosed(sunday.hours[41]), false);
  assert.equal(ganttHourWeekendIssuerOpen(sunday.hours[41]), true);
  assert.equal(ganttHourWeekendIssuerClosed(sunday.hours[17]), true);
  const weekendIssuerClosed = saturday.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourWeekendIssuerClosed(point)).length;
  const issuerClosed = saturday.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourIssuerClosed(point)).length;
  const weekendIssuerOpen = saturday.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourWeekendIssuerOpen(point)).length;
  assert.ok(weekendIssuerClosed > 0);
  assert.ok(issuerClosed > weekendIssuerClosed);
  assert.ok(weekendIssuerOpen > 0);
  assert.notEqual(weekendIssuerClosed, weekendIssuerOpen);
});

test("hide-weekend-issuer-closed Gantt SVG is display-only and keeps the selected hour visible", () => {
  const saturday = PRESETS.saturdayEarlyIssuerOpen;
  const full = buildGateGanttSvg(saturday, 0);
  const hiddenWeekendIssuerClosed = buildGateGanttSvg(saturday, 0, { hideWeekendIssuerClosedHours: true });
  const hiddenWeekendIssuerOpen = buildGateGanttSvg(saturday, 0, { hideWeekendIssuerOpenHours: true });
  const hiddenIssuerClosed = buildGateGanttSvg(saturday, 0, { hideIssuerClosedHours: true });
  const hiddenWeekend = buildGateGanttSvg(saturday, 0, { hideWeekendHours: true });
  const hiddenOpen = buildGateGanttSvg(saturday, 0, { hideOpenHours: true });
  const selectedWeekendClosed = buildGateGanttSvg(saturday, 16, { hideWeekendIssuerClosedHours: true });
  const selectedWeekday = buildGateGanttSvg(saturday, 0, { hideWeekendIssuerClosedHours: true });
  const composedIssuer = buildGateGanttSvg(saturday, 0, { hideWeekendIssuerClosedHours: true, hideIssuerClosedHours: true });
  const composedWeekend = buildGateGanttSvg(saturday, 0, { hideWeekendIssuerClosedHours: true, hideWeekendHours: true });
  assert.notEqual(full, hiddenWeekendIssuerClosed);
  assert.notEqual(hiddenWeekendIssuerClosed, hiddenWeekendIssuerOpen);
  assert.notEqual(hiddenWeekendIssuerClosed, hiddenIssuerClosed);
  assert.notEqual(hiddenWeekendIssuerClosed, hiddenWeekend);
  assert.notEqual(hiddenWeekendIssuerClosed, hiddenOpen);
  assert.match(hiddenWeekendIssuerClosed, /viewBox="0 0 720/);
  const hiddenRects = (hiddenWeekendIssuerClosed.match(/<rect /g) || []).length;
  const fullRects = (full.match(/<rect /g) || []).length;
  const issuerRects = (hiddenIssuerClosed.match(/<rect /g) || []).length;
  const weekendRects = (hiddenWeekend.match(/<rect /g) || []).length;
  const openRects = (hiddenWeekendIssuerOpen.match(/<rect /g) || []).length;
  const selectedClosedRects = (selectedWeekendClosed.match(/<rect /g) || []).length;
  const selectedWeekdayRects = (selectedWeekday.match(/<rect /g) || []).length;
  const composedIssuerRects = (composedIssuer.match(/<rect /g) || []).length;
  const composedWeekendRects = (composedWeekend.match(/<rect /g) || []).length;
  assert.ok(hiddenRects < fullRects);
  assert.ok(issuerRects < hiddenRects);
  assert.ok(weekendRects < hiddenRects);
  assert.ok(openRects !== hiddenRects);
  assert.ok(selectedClosedRects > selectedWeekdayRects);
  assert.ok(composedIssuerRects <= issuerRects);
  assert.ok(composedWeekendRects <= weekendRects);
  const defaultHidden = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendIssuerClosedHours: true });
  const defaultWeekend = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendHours: true });
  const defaultIssuerClosed = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideIssuerClosedHours: true });
  assert.equal((defaultHidden.match(/<rect /g) || []).length, (defaultWeekend.match(/<rect /g) || []).length);
  assert.ok((defaultIssuerClosed.match(/<rect /g) || []).length < (defaultHidden.match(/<rect /g) || []).length);
  assert.equal(attributeBottlenecks(saturday).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(saturday).timeline.length, SIMULATION_HOURS + 1);
});

test("hide-weekend-issuer-closed Gantt filter is a display control that can restore all hours", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-weekend-issuer-closed"/);
  assert.match(html, /Hide weekend hours where the issuer gate is closed/);
  assert.match(html, /id="gantt-hide-weekend-issuer-open"/);
  assert.match(html, /id="gantt-hide-issuer-closed"/);
  assert.match(html, /id="gantt-hide-weekends"/);
  assert.match(html, /id="gantt-hide-open"/);
  assert.match(app, /ganttHourWeekendIssuerClosed/);
  assert.match(app, /hideWeekendIssuerClosedHours/);
  assert.match(app, /hideWeekendIssuerOpenHours/);
  assert.match(app, /hideIssuerClosedHours/);
  assert.match(app, /hideWeekendHours/);
  assert.match(app, /hour !== selectedHour/);
  assert.match(app, /Display only/);
  assert.match(app, /The model still contains/);
});
