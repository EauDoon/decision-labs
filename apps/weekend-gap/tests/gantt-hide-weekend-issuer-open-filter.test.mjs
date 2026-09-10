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
  ganttHourIssuerOpen,
  ganttHourWeekendIssuerOpen,
  runSimulation
} from "../src/model.js";

test("weekend-issuer-open helper hides hours that are weekend and issuer-open", () => {
  const schedule = buildGateSchedule(DEFAULT_SCENARIO);
  assert.equal(ganttHourWeekendIssuerOpen(schedule.hours[0]), false);
  assert.equal(ganttHourIssuerOpen(schedule.hours[0]), true);
  assert.equal(ganttHourIsWeekend(schedule.hours[0]), false);
  assert.equal(ganttHourWeekendIssuerOpen(schedule.hours[41]), false);
  assert.equal(ganttHourIsWeekend(schedule.hours[41]), true);
  assert.equal(ganttHourIssuerOpen(schedule.hours[41]), false);
  assert.equal(ganttHourWeekendIssuerOpen(null), false);
  assert.equal(ganttHourWeekendIssuerOpen({}), false);
  const early = buildGateSchedule(PRESETS.sundayEarlyIssuerOpen);
  assert.equal(ganttHourWeekendIssuerOpen(early.hours[41]), true);
  assert.equal(ganttHourWeekendIssuerOpen(early.hours[42]), true);
  assert.equal(ganttHourWeekendIssuerOpen(early.hours[43]), false);
  assert.equal(ganttHourWeekendIssuerOpen(early.hours[0]), false);
  const late = buildGateSchedule(PRESETS.sundayLateIssuerClose);
  assert.equal(ganttHourWeekendIssuerOpen(late.hours[49]), true);
  assert.equal(ganttHourWeekendIssuerOpen(early.hours[49]), false);
  const weekendIssuerOpen = early.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourWeekendIssuerOpen(point)).length;
  const issuerOpen = early.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourIssuerOpen(point)).length;
  assert.ok(weekendIssuerOpen > 0);
  assert.ok(issuerOpen > weekendIssuerOpen);
});

test("hide-weekend-issuer-open Gantt SVG is display-only and keeps the selected hour visible", () => {
  const early = PRESETS.sundayEarlyIssuerOpen;
  const full = buildGateGanttSvg(early, 0);
  const hiddenWeekendIssuer = buildGateGanttSvg(early, 0, { hideWeekendIssuerOpenHours: true });
  const hiddenIssuerOpen = buildGateGanttSvg(early, 0, { hideIssuerOpenHours: true });
  const hiddenWeekend = buildGateGanttSvg(early, 0, { hideWeekendHours: true });
  const hiddenBankOpen = buildGateGanttSvg(early, 0, { hideBankOpenHours: true });
  const selectedWeekendOpen = buildGateGanttSvg(early, 41, { hideWeekendIssuerOpenHours: true });
  const selectedWeekday = buildGateGanttSvg(early, 0, { hideWeekendIssuerOpenHours: true });
  const composedIssuer = buildGateGanttSvg(early, 0, { hideWeekendIssuerOpenHours: true, hideIssuerOpenHours: true });
  const composedWeekend = buildGateGanttSvg(early, 0, { hideWeekendIssuerOpenHours: true, hideWeekendHours: true });
  assert.notEqual(full, hiddenWeekendIssuer);
  assert.notEqual(hiddenWeekendIssuer, hiddenIssuerOpen);
  assert.notEqual(hiddenWeekendIssuer, hiddenWeekend);
  assert.notEqual(hiddenWeekendIssuer, hiddenBankOpen);
  assert.match(hiddenWeekendIssuer, /viewBox="0 0 720/);
  const hiddenRects = (hiddenWeekendIssuer.match(/<rect /g) || []).length;
  const fullRects = (full.match(/<rect /g) || []).length;
  const issuerRects = (hiddenIssuerOpen.match(/<rect /g) || []).length;
  const weekendRects = (hiddenWeekend.match(/<rect /g) || []).length;
  const selectedOpenRects = (selectedWeekendOpen.match(/<rect /g) || []).length;
  const selectedWeekdayRects = (selectedWeekday.match(/<rect /g) || []).length;
  const composedIssuerRects = (composedIssuer.match(/<rect /g) || []).length;
  const composedWeekendRects = (composedWeekend.match(/<rect /g) || []).length;
  assert.ok(hiddenRects < fullRects);
  assert.ok(issuerRects < hiddenRects);
  assert.ok(weekendRects < hiddenRects);
  assert.ok(selectedOpenRects > selectedWeekdayRects);
  assert.ok(composedIssuerRects <= issuerRects);
  assert.ok(composedWeekendRects <= weekendRects);
  const defaultHidden = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendIssuerOpenHours: true });
  const defaultFull = buildGateGanttSvg(DEFAULT_SCENARIO, 0);
  assert.equal((defaultHidden.match(/<rect /g) || []).length, (defaultFull.match(/<rect /g) || []).length);
  assert.equal(attributeBottlenecks(early).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(early).timeline.length, SIMULATION_HOURS + 1);
});

test("hide-weekend-issuer-open Gantt filter is a display control that can restore all hours", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-weekend-issuer-open"/);
  assert.match(html, /Hide weekend hours where the issuer gate is open/);
  assert.match(html, /id="gantt-hide-issuer-open"/);
  assert.match(html, /id="gantt-hide-weekends"/);
  assert.match(app, /ganttHourWeekendIssuerOpen/);
  assert.match(app, /hideWeekendIssuerOpenHours/);
  assert.match(app, /hideIssuerOpenHours/);
  assert.match(app, /hideWeekendHours/);
  assert.match(app, /hour !== selectedHour/);
  assert.match(app, /Display only/);
  assert.match(app, /The model still contains/);
});
