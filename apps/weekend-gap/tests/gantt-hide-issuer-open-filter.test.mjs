import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  SIMULATION_HOURS,
  attributeBottlenecks,
  buildGateGanttSvg,
  buildGateSchedule,
  ganttHourBankOpen,
  ganttHourClosedOnEveryGate,
  ganttHourFxOpen,
  ganttHourIssuerClosed,
  ganttHourIssuerOpen,
  ganttHourOpenOnEveryGate,
  ganttHourPayoutClosed,
  runSimulation
} from "../src/model.js";

test("issuer-open helper hides hours whose issuer gate is open", () => {
  const schedule = buildGateSchedule(DEFAULT_SCENARIO);
  assert.equal(ganttHourIssuerOpen(schedule.hours[0]), true);
  assert.equal(ganttHourIssuerClosed(schedule.hours[0]), false);
  assert.equal(ganttHourIssuerOpen(schedule.hours[2]), false);
  assert.equal(ganttHourIssuerClosed(schedule.hours[2]), true);
  assert.equal(ganttHourFxOpen(schedule.hours[0]), true);
  assert.equal(ganttHourBankOpen(schedule.hours[0]), true);
  assert.equal(ganttHourOpenOnEveryGate(schedule.hours[0]), true);
  assert.equal(ganttHourOpenOnEveryGate(schedule.hours[2]), false);
  assert.equal(ganttHourClosedOnEveryGate(schedule.hours[2]), false);
  assert.equal(ganttHourIssuerOpen(null), false);
  assert.equal(ganttHourIssuerOpen({}), false);
  const lateIssuer = { ...DEFAULT_SCENARIO, sundayLateIssuerClose: true };
  const lateSchedule = buildGateSchedule(lateIssuer);
  assert.equal(ganttHourIssuerOpen(lateSchedule.hours[49]), true);
  assert.equal(ganttHourIssuerClosed(lateSchedule.hours[49]), false);
  assert.equal(ganttHourOpenOnEveryGate(lateSchedule.hours[49]), false);
  assert.equal(ganttHourBankOpen(lateSchedule.hours[49]), false);
  assert.equal(ganttHourPayoutClosed(lateSchedule.hours[49]), true);
  assert.equal(ganttHourFxOpen(lateSchedule.hours[49]), false);
  const lateBank = { ...DEFAULT_SCENARIO, sundayLateBankClose: true };
  const bankSchedule = buildGateSchedule(lateBank);
  assert.equal(ganttHourIssuerOpen(lateSchedule.hours[49]), true);
  assert.equal(ganttHourIssuerOpen(bankSchedule.hours[49]), false);
  assert.equal(ganttHourBankOpen(bankSchedule.hours[49]), true);
  const issuerOpen = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourIssuerOpen(point)).length;
  const issuerClosed = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourIssuerClosed(point)).length;
  assert.ok(issuerOpen > 0);
  assert.ok(issuerClosed > 0);
  assert.equal(issuerOpen + issuerClosed, SIMULATION_HOURS);
});

test("hide-issuer-open Gantt SVG is display-only and keeps the selected hour visible", () => {
  const lateIssuer = { ...DEFAULT_SCENARIO, sundayLateIssuerClose: true };
  const full = buildGateGanttSvg(DEFAULT_SCENARIO, 0);
  const hiddenOpenIssuer = buildGateGanttSvg(lateIssuer, 0, { hideIssuerOpenHours: true });
  const hiddenBankOpen = buildGateGanttSvg(lateIssuer, 0, { hideBankOpenHours: true });
  const hiddenIssuerClosed = buildGateGanttSvg(lateIssuer, 0, { hideIssuerClosedHours: true });
  const hiddenFxOpen = buildGateGanttSvg(lateIssuer, 0, { hideFxOpenHours: true });
  const splitOpen = buildGateGanttSvg(lateIssuer, 0, { hideIssuerOpenHours: true });
  const splitClosed = buildGateGanttSvg(lateIssuer, 0, { hideIssuerClosedHours: true });
  const hiddenOpen = buildGateGanttSvg(lateIssuer, 0, { hideOpenHours: true });
  const composedOpen = buildGateGanttSvg(lateIssuer, 0, { hideIssuerOpenHours: true, hideOpenHours: true });
  const hiddenClosed = buildGateGanttSvg(lateIssuer, 0, { hideClosedHours: true });
  const composedClosed = buildGateGanttSvg(lateIssuer, 0, { hideIssuerOpenHours: true, hideClosedHours: true });
  const weekdayOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekdayHours: true });
  const composedWeekday = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideIssuerOpenHours: true, hideWeekdayHours: true });
  const weekendOnly = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendHours: true });
  const composedWeekend = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideIssuerOpenHours: true, hideWeekendHours: true });
  const hiddenZero = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideZeroQueueHours: true });
  const composedZero = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideIssuerOpenHours: true, hideZeroQueueHours: true });
  const composedIssuerClosed = buildGateGanttSvg(lateIssuer, 0, { hideIssuerOpenHours: true, hideIssuerClosedHours: true });
  const holiday = { ...DEFAULT_SCENARIO, mondayHoliday: true };
  const everyClosed = buildGateGanttSvg(holiday, 0, { everyClosedOnly: true });
  const composedEvery = buildGateGanttSvg(holiday, 0, { hideIssuerOpenHours: true, everyClosedOnly: true });
  const closedOnly = buildGateGanttSvg(lateIssuer, 0, { closedOnly: true });
  const composedClosedOnly = buildGateGanttSvg(lateIssuer, 0, { hideIssuerOpenHours: true, closedOnly: true });
  const payoutOnly = buildGateGanttSvg(lateIssuer, 0, { hideIssuerOpenHours: true, gateFilter: "payout" });
  const selectedOpen = buildGateGanttSvg(lateIssuer, 0, { hideIssuerOpenHours: true });
  const selectedClosed = buildGateGanttSvg(lateIssuer, 2, { hideIssuerOpenHours: true });
  assert.notEqual(full, hiddenOpenIssuer);
  assert.notEqual(hiddenOpenIssuer, hiddenIssuerClosed);
  assert.notEqual(splitOpen, splitClosed);
  assert.notEqual(splitOpen, hiddenOpen);
  assert.notEqual(hiddenOpenIssuer, hiddenFxOpen);
  assert.notEqual(hiddenOpenIssuer, hiddenBankOpen);
  assert.notEqual(hiddenOpenIssuer, hiddenZero);
  assert.match(hiddenOpenIssuer, /viewBox="0 0 720/);
  const hiddenRects = (hiddenOpenIssuer.match(/<rect /g) || []).length;
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
  const splitOpenRects = (splitOpen.match(/<rect /g) || []).length;
  const splitClosedRects = (splitClosed.match(/<rect /g) || []).length;
  const composedIssuerClosedRects = (composedIssuerClosed.match(/<rect /g) || []).length;
  const splitBank = buildGateGanttSvg(lateIssuer, 0, { hideBankOpenHours: true });
  const splitBankRects = (splitBank.match(/<rect /g) || []).length;
  const everyRects = (everyClosed.match(/<rect /g) || []).length;
  const composedEveryRects = (composedEvery.match(/<rect /g) || []).length;
  const closedOnlyRects = (closedOnly.match(/<rect /g) || []).length;
  const composedClosedOnlyRects = (composedClosedOnly.match(/<rect /g) || []).length;
  const payoutRects = (payoutOnly.match(/<rect /g) || []).length;
  const selectedOpenRects = (selectedOpen.match(/<rect /g) || []).length;
  const selectedClosedRects = (selectedClosed.match(/<rect /g) || []).length;
  const hiddenIssuerClosedRects = (hiddenIssuerClosed.match(/<rect /g) || []).length;
  const hiddenBankOpenRects = (hiddenBankOpen.match(/<rect /g) || []).length;
  assert.ok(hiddenRects < fullRects);
  assert.ok(composedOpenRects < hiddenOpenRects);
  assert.ok(composedClosedRects < hiddenClosedRects);
  assert.ok(composedWeekdayRects <= weekdayRects);
  assert.ok(composedWeekendRects <= weekendRects);
  assert.ok(composedZeroRects < hiddenZeroRects);
  assert.ok(composedIssuerClosedRects < splitOpenRects);
  assert.ok(composedIssuerClosedRects <= splitClosedRects);
  assert.ok(splitOpenRects !== splitBankRects);
  assert.ok(composedEveryRects <= everyRects);
  assert.ok(composedClosedOnlyRects < closedOnlyRects);
  assert.ok(payoutRects < hiddenRects);
  assert.ok(selectedOpenRects > selectedClosedRects);
  assert.ok(hiddenRects !== hiddenIssuerClosedRects);
  assert.ok(hiddenRects !== hiddenBankOpenRects);
  assert.ok(splitOpenRects !== splitClosedRects);
  assert.equal(attributeBottlenecks(DEFAULT_SCENARIO).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
});

test("hide-issuer-open Gantt filter is a display control that can restore all hours", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-issuer-open"/);
  assert.match(html, /Hide hours where the issuer gate is open/);
  assert.match(html, /id="gantt-hide-issuer-closed"/);
  assert.match(html, /id="gantt-hide-bank-open"/);
  assert.match(app, /ganttHourIssuerOpen/);
  assert.match(app, /hideIssuerOpenHours/);
  assert.match(app, /hideIssuerClosedHours/);
  assert.match(app, /hideBankOpenHours/);
  assert.match(app, /hour !== selectedHour/);
  assert.match(app, /Display only/);
  assert.match(app, /The model still contains/);
});
