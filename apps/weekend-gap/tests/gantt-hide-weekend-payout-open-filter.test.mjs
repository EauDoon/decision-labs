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
  ganttHourPayoutOpen,
  ganttHourWeekendBankOpen,
  ganttHourWeekendIssuerOpen,
  ganttHourWeekendPayoutOpen,
  runSimulation
} from "../src/model.js";

test("weekend-payout-open helper hides hours that are weekend and payout-open", () => {
  const schedule = buildGateSchedule(DEFAULT_SCENARIO);
  assert.equal(ganttHourWeekendPayoutOpen(schedule.hours[0]), false);
  assert.equal(ganttHourPayoutOpen(schedule.hours[0]), true);
  assert.equal(ganttHourIsWeekend(schedule.hours[0]), false);
  assert.equal(ganttHourWeekendPayoutOpen(schedule.hours[41]), false);
  assert.equal(ganttHourIsWeekend(schedule.hours[41]), true);
  assert.equal(ganttHourPayoutOpen(schedule.hours[41]), false);
  assert.equal(ganttHourWeekendPayoutOpen(null), false);
  assert.equal(ganttHourWeekendPayoutOpen({}), false);
  const early = buildGateSchedule(PRESETS.saturdayEarlyPayoutOpen);
  assert.equal(ganttHourWeekendPayoutOpen(early.hours[15]), false);
  assert.equal(ganttHourWeekendPayoutOpen(early.hours[16]), true);
  assert.equal(ganttHourWeekendPayoutOpen(early.hours[17]), true);
  assert.equal(ganttHourWeekendPayoutOpen(early.hours[18]), false);
  assert.equal(ganttHourWeekendPayoutOpen(early.hours[0]), false);
  const bank = buildGateSchedule(PRESETS.saturdayEarlyBankOpen);
  assert.equal(ganttHourWeekendPayoutOpen(bank.hours[17]), false);
  assert.equal(ganttHourWeekendBankOpen(bank.hours[17]), true);
  const issuer = buildGateSchedule(PRESETS.saturdayEarlyIssuerOpen);
  assert.equal(ganttHourWeekendPayoutOpen(issuer.hours[17]), false);
  assert.equal(ganttHourWeekendIssuerOpen(issuer.hours[17]), true);
  const weekendPayoutOpen = early.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourWeekendPayoutOpen(point)).length;
  const payoutOpen = early.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourPayoutOpen(point)).length;
  const weekendBankOpen = bank.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourWeekendBankOpen(point)).length;
  assert.ok(weekendPayoutOpen > 0);
  assert.ok(payoutOpen > weekendPayoutOpen);
  assert.equal(weekendPayoutOpen, 2);
  assert.equal(weekendBankOpen, 2);
});

test("hide-weekend-payout-open Gantt SVG is display-only and keeps the selected hour visible", () => {
  const early = PRESETS.saturdayEarlyPayoutOpen;
  const bank = PRESETS.saturdayEarlyBankOpen;
  const issuer = PRESETS.saturdayEarlyIssuerOpen;
  const full = buildGateGanttSvg(early, 0);
  const hiddenWeekendPayoutOpen = buildGateGanttSvg(early, 0, { hideWeekendPayoutOpenHours: true });
  const hiddenPayoutOpen = buildGateGanttSvg(early, 0, { hidePayoutOpenHours: true });
  const hiddenWeekend = buildGateGanttSvg(early, 0, { hideWeekendHours: true });
  const hiddenPayoutClosed = buildGateGanttSvg(early, 0, { hidePayoutClosedHours: true });
  const hiddenWeekendBankOpen = buildGateGanttSvg(bank, 0, { hideWeekendBankOpenHours: true });
  const hiddenWeekendIssuerOpen = buildGateGanttSvg(issuer, 0, { hideWeekendIssuerOpenHours: true });
  const hiddenWeekendPayoutOpenOnBank = buildGateGanttSvg(bank, 0, { hideWeekendPayoutOpenHours: true });
  const selectedWeekendOpen = buildGateGanttSvg(early, 16, { hideWeekendPayoutOpenHours: true });
  const selectedWeekday = buildGateGanttSvg(early, 0, { hideWeekendPayoutOpenHours: true });
  assert.notEqual(full, hiddenWeekendPayoutOpen);
  assert.notEqual(hiddenWeekendPayoutOpen, hiddenPayoutOpen);
  assert.notEqual(hiddenWeekendPayoutOpen, hiddenWeekend);
  assert.notEqual(hiddenWeekendPayoutOpen, hiddenPayoutClosed);
  assert.notEqual(hiddenWeekendPayoutOpenOnBank, hiddenWeekendBankOpen);
  assert.notEqual(hiddenWeekendIssuerOpen, hiddenWeekendPayoutOpen);
  assert.match(hiddenWeekendPayoutOpen, /viewBox="0 0 720/);
  const hiddenRects = (hiddenWeekendPayoutOpen.match(/<rect /g) || []).length;
  const fullRects = (full.match(/<rect /g) || []).length;
  const payoutRects = (hiddenPayoutOpen.match(/<rect /g) || []).length;
  const weekendRects = (hiddenWeekend.match(/<rect /g) || []).length;
  const closedRects = (hiddenPayoutClosed.match(/<rect /g) || []).length;
  const selectedOpenRects = (selectedWeekendOpen.match(/<rect /g) || []).length;
  const selectedWeekdayRects = (selectedWeekday.match(/<rect /g) || []).length;
  assert.ok(hiddenRects < fullRects);
  assert.ok(payoutRects < hiddenRects);
  assert.ok(weekendRects < hiddenRects);
  assert.ok(closedRects !== hiddenRects);
  assert.ok(selectedOpenRects > selectedWeekdayRects);
  const defaultHidden = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendPayoutOpenHours: true });
  const defaultFull = buildGateGanttSvg(DEFAULT_SCENARIO, 0);
  const defaultWeekend = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendHours: true });
  assert.equal((defaultHidden.match(/<rect /g) || []).length, (defaultFull.match(/<rect /g) || []).length);
  assert.notEqual((defaultHidden.match(/<rect /g) || []).length, (defaultWeekend.match(/<rect /g) || []).length);
  const bankFull = buildGateGanttSvg(bank, 0);
  assert.equal((hiddenWeekendPayoutOpenOnBank.match(/<rect /g) || []).length, (bankFull.match(/<rect /g) || []).length);
  assert.equal(attributeBottlenecks(early).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(early).timeline.length, SIMULATION_HOURS + 1);
});

test("hide-weekend-payout-open Gantt filter is a display control that can restore all hours", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-weekend-payout-open"/);
  assert.match(html, /Hide weekend hours where the payout gate is open/);
  assert.match(html, /id="gantt-hide-weekend-bank-open"/);
  assert.match(html, /id="gantt-hide-payout-open"/);
  assert.match(html, /id="gantt-hide-weekends"/);
  assert.match(app, /ganttHourWeekendPayoutOpen/);
  assert.match(app, /hideWeekendPayoutOpenHours/);
  assert.match(app, /hideWeekendBankOpenHours/);
  assert.match(app, /hidePayoutOpenHours/);
  assert.match(app, /hideWeekendHours/);
  assert.match(app, /hour !== selectedHour/);
  assert.match(app, /Display only/);
  assert.match(app, /The model still contains/);
});
