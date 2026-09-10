import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  SIMULATION_HOURS,
  attributeBottlenecks,
  buildGateGanttSvg,
  buildGateSchedule,
  ganttHourBankClosed,
  ganttHourClosedOnEveryGate,
  ganttHourIssuerClosed,
  ganttHourOpenOnEveryGate,
  runSimulation
} from "../src/model.js";

test("issuer-closed helper hides hours whose issuer gate is closed", () => {
  const schedule = buildGateSchedule(DEFAULT_SCENARIO);
  assert.equal(ganttHourIssuerClosed(schedule.hours[0]), false);
  assert.equal(ganttHourIssuerClosed(schedule.hours[2]), true);
  assert.equal(ganttHourClosedOnEveryGate(schedule.hours[2]), false);
  assert.equal(ganttHourOpenOnEveryGate(schedule.hours[2]), false);
  assert.equal(ganttHourIssuerClosed(null), false);
  assert.equal(ganttHourIssuerClosed({}), false);
  const earlierIssuer = { ...DEFAULT_SCENARIO, issuerOpenEndHour: 16 };
  const earlierSchedule = buildGateSchedule(earlierIssuer);
  assert.equal(ganttHourIssuerClosed(earlierSchedule.hours[1]), true);
  assert.equal(ganttHourBankClosed(earlierSchedule.hours[1]), false);
  const issuerClosed = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourIssuerClosed(point)).length;
  const issuerOpen = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && !ganttHourIssuerClosed(point)).length;
  assert.ok(issuerClosed > 0);
  assert.ok(issuerOpen > 0);
  assert.equal(issuerClosed + issuerOpen, SIMULATION_HOURS);
});

test("hide-issuer-closed Gantt SVG is display-only and keeps the selected hour visible", () => {
  const earlierIssuer = { ...DEFAULT_SCENARIO, issuerOpenEndHour: 16 };
  const full = buildGateGanttSvg(DEFAULT_SCENARIO, 0);
  const hiddenIssuer = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideIssuerClosedHours: true });
  const hiddenBank = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideBankClosedHours: true });
  const splitIssuer = buildGateGanttSvg(earlierIssuer, 0, { hideIssuerClosedHours: true });
  const splitBank = buildGateGanttSvg(earlierIssuer, 0, { hideBankClosedHours: true });
  const hiddenOpen = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideOpenHours: true });
  const composedOpen = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideIssuerClosedHours: true, hideOpenHours: true });
  const hiddenClosed = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideClosedHours: true });
  const composedClosed = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideIssuerClosedHours: true, hideClosedHours: true });
  const weekdayOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekdayHours: true });
  const composedWeekday = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideIssuerClosedHours: true, hideWeekdayHours: true });
  const weekendOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendHours: true });
  const composedWeekend = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideIssuerClosedHours: true, hideWeekendHours: true });
  const hiddenZero = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideZeroQueueHours: true });
  const composedZero = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideIssuerClosedHours: true, hideZeroQueueHours: true });
  const composedBank = buildGateGanttSvg(earlierIssuer, 0, { hideIssuerClosedHours: true, hideBankClosedHours: true });
  const holiday = { ...DEFAULT_SCENARIO, mondayHoliday: true };
  const everyClosed = buildGateGanttSvg(holiday, 0, { everyClosedOnly: true });
  const composedEvery = buildGateGanttSvg(holiday, 0, { hideIssuerClosedHours: true, everyClosedOnly: true });
  const closedOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { closedOnly: true });
  const composedClosedOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideIssuerClosedHours: true, closedOnly: true });
  const fxOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideIssuerClosedHours: true, gateFilter: "fx" });
  const selectedClosed = buildGateGanttSvg(DEFAULT_SCENARIO, 2, { hideIssuerClosedHours: true });
  assert.notEqual(full, hiddenIssuer);
  assert.notEqual(splitIssuer, splitBank);
  assert.notEqual(hiddenIssuer, hiddenOpen);
  assert.notEqual(hiddenIssuer, hiddenClosed);
  assert.notEqual(hiddenIssuer, hiddenZero);
  assert.match(hiddenIssuer, /viewBox="0 0 720/);
  const hiddenRects = (hiddenIssuer.match(/<rect /g) || []).length;
  const fullRects = (full.match(/<rect /g) || []).length;
  const composedOpenRects = (composedOpen.match(/<rect /g) || []).length;
  const hiddenOpenRects = (hiddenOpen.match(/<rect /g) || []).length;
  const composedClosedRects = (composedClosed.match(/<rect /g) || []).length;
  const hiddenClosedRects = (hiddenClosed.match(/<rect /g) || []).length;
  const weekdayRects = (weekdayOnly.match(/<rect /g) || []).length;
  const composedWeekdayRects = (composedWeekday.match(/<rect /g) || []).length;
  const weekendRects = (weekendOnly.match(/<rect /g) || []).length;
  const composedWeekendRects = (composedWeekend.match(/<rect /g) || []).length;
  const composedZeroRects = (composedZero.match(/<rect /g) || []).length;
  const hiddenZeroRects = (hiddenZero.match(/<rect /g) || []).length;
  const splitIssuerRects = (splitIssuer.match(/<rect /g) || []).length;
  const composedBankRects = (composedBank.match(/<rect /g) || []).length;
  const everyRects = (everyClosed.match(/<rect /g) || []).length;
  const composedEveryRects = (composedEvery.match(/<rect /g) || []).length;
  const closedOnlyRects = (closedOnly.match(/<rect /g) || []).length;
  const composedClosedOnlyRects = (composedClosedOnly.match(/<rect /g) || []).length;
  const fxRects = (fxOnly.match(/<rect /g) || []).length;
  const selectedClosedRects = (selectedClosed.match(/<rect /g) || []).length;
  assert.ok(hiddenRects < fullRects);
  assert.ok(composedOpenRects < hiddenOpenRects);
  assert.ok(composedClosedRects < hiddenClosedRects);
  assert.ok(composedWeekdayRects <= weekdayRects);
  assert.ok(composedWeekendRects <= weekendRects);
  assert.ok(composedZeroRects < hiddenZeroRects);
  assert.ok(composedBankRects < splitIssuerRects);
  assert.ok(composedEveryRects <= everyRects);
  assert.ok(composedClosedOnlyRects < closedOnlyRects);
  assert.ok(fxRects < hiddenRects);
  assert.ok(selectedClosedRects > hiddenRects);
  assert.equal(hiddenIssuer, hiddenBank);
  assert.equal(attributeBottlenecks(DEFAULT_SCENARIO).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
});

test("hide-issuer-closed Gantt filter is a display control that can restore all hours", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-issuer-closed"/);
  assert.match(html, /Hide hours where the issuer gate is closed/);
  assert.match(html, /id="gantt-hide-bank-closed"/);
  assert.match(app, /ganttHourIssuerClosed/);
  assert.match(app, /hideIssuerClosedHours/);
  assert.match(app, /hideBankClosedHours/);
  assert.match(app, /hour !== selectedHour/);
  assert.match(app, /Display only/);
  assert.match(app, /The model still contains/);
});
