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
  ganttHourFxOpen,
  ganttHourIsWeekend,
  ganttHourWeekendBankOpen,
  ganttHourWeekendFxOpen,
  ganttHourWeekendPayoutOpen,
  runSimulation
} from "../src/model.js";

test("weekend-FX-open helper hides hours that are weekend and FX-open", () => {
  const schedule = buildGateSchedule(DEFAULT_SCENARIO);
  assert.equal(ganttHourWeekendFxOpen(schedule.hours[0]), false);
  assert.equal(ganttHourFxOpen(schedule.hours[0]), true);
  assert.equal(ganttHourIsWeekend(schedule.hours[0]), false);
  assert.equal(ganttHourWeekendFxOpen(schedule.hours[9]), false);
  assert.equal(ganttHourIsWeekend(schedule.hours[9]), true);
  assert.equal(ganttHourFxOpen(schedule.hours[9]), false);
  assert.equal(ganttHourWeekendFxOpen(null), false);
  assert.equal(ganttHourWeekendFxOpen({}), false);
  const early = buildGateSchedule(PRESETS.saturdayEarlyFxOpen);
  assert.equal(ganttHourWeekendFxOpen(early.hours[14]), false);
  assert.equal(ganttHourWeekendFxOpen(early.hours[15]), true);
  assert.equal(ganttHourWeekendFxOpen(early.hours[20]), true);
  assert.equal(ganttHourWeekendFxOpen(early.hours[21]), false);
  assert.equal(ganttHourWeekendFxOpen(early.hours[0]), false);
  const bank = buildGateSchedule(PRESETS.saturdayEarlyBankOpen);
  assert.equal(ganttHourWeekendFxOpen(bank.hours[17]), false);
  assert.equal(ganttHourWeekendBankOpen(bank.hours[17]), true);
  const payout = buildGateSchedule(PRESETS.saturdayEarlyPayoutOpen);
  assert.equal(ganttHourWeekendFxOpen(payout.hours[16]), false);
  assert.equal(ganttHourWeekendPayoutOpen(payout.hours[16]), true);
  const lateFx = buildGateSchedule(PRESETS.fridayLateFxClose);
  assert.equal(ganttHourWeekendFxOpen(lateFx.hours[9]), true);
  assert.equal(ganttHourWeekendFxOpen(schedule.hours[9]), false);
  const weekendFxOpen = early.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourWeekendFxOpen(point)).length;
  const fxOpen = early.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourFxOpen(point)).length;
  const weekendBankOpen = bank.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourWeekendBankOpen(point)).length;
  assert.ok(weekendFxOpen > 0);
  assert.ok(fxOpen > weekendFxOpen);
  assert.equal(weekendFxOpen, 6);
  assert.equal(weekendBankOpen, 2);
});

test("hide-weekend-FX-open Gantt SVG is display-only and keeps the selected hour visible", () => {
  const early = PRESETS.saturdayEarlyFxOpen;
  const bank = PRESETS.saturdayEarlyBankOpen;
  const payout = PRESETS.saturdayEarlyPayoutOpen;
  const full = buildGateGanttSvg(early, 0);
  const hiddenWeekendFxOpen = buildGateGanttSvg(early, 0, { hideWeekendFxOpenHours: true });
  const hiddenFxOpen = buildGateGanttSvg(early, 0, { hideFxOpenHours: true });
  const hiddenWeekend = buildGateGanttSvg(early, 0, { hideWeekendHours: true });
  const hiddenFxClosed = buildGateGanttSvg(early, 0, { hideFxClosedHours: true });
  const hiddenWeekendBankOpen = buildGateGanttSvg(bank, 0, { hideWeekendBankOpenHours: true });
  const hiddenWeekendPayoutOpen = buildGateGanttSvg(payout, 0, { hideWeekendPayoutOpenHours: true });
  const hiddenWeekendFxOpenOnBank = buildGateGanttSvg(bank, 0, { hideWeekendFxOpenHours: true });
  const selectedWeekendOpen = buildGateGanttSvg(early, 15, { hideWeekendFxOpenHours: true });
  const selectedWeekday = buildGateGanttSvg(early, 0, { hideWeekendFxOpenHours: true });
  assert.notEqual(full, hiddenWeekendFxOpen);
  assert.notEqual(hiddenWeekendFxOpen, hiddenFxOpen);
  assert.notEqual(hiddenWeekendFxOpen, hiddenWeekend);
  assert.notEqual(hiddenWeekendFxOpen, hiddenFxClosed);
  assert.notEqual(hiddenWeekendFxOpenOnBank, hiddenWeekendBankOpen);
  assert.notEqual(hiddenWeekendPayoutOpen, hiddenWeekendFxOpen);
  assert.match(hiddenWeekendFxOpen, /viewBox="0 0 720/);
  const hiddenRects = (hiddenWeekendFxOpen.match(/<rect /g) || []).length;
  const fullRects = (full.match(/<rect /g) || []).length;
  const fxRects = (hiddenFxOpen.match(/<rect /g) || []).length;
  const weekendRects = (hiddenWeekend.match(/<rect /g) || []).length;
  const closedRects = (hiddenFxClosed.match(/<rect /g) || []).length;
  const selectedOpenRects = (selectedWeekendOpen.match(/<rect /g) || []).length;
  const selectedWeekdayRects = (selectedWeekday.match(/<rect /g) || []).length;
  assert.ok(hiddenRects < fullRects);
  assert.ok(fxRects < hiddenRects);
  assert.ok(weekendRects < hiddenRects);
  assert.ok(closedRects !== hiddenRects);
  assert.ok(selectedOpenRects > selectedWeekdayRects);
  const defaultHidden = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendFxOpenHours: true });
  const defaultFull = buildGateGanttSvg(DEFAULT_SCENARIO, 0);
  const defaultWeekend = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendHours: true });
  assert.equal((defaultHidden.match(/<rect /g) || []).length, (defaultFull.match(/<rect /g) || []).length);
  assert.notEqual((defaultHidden.match(/<rect /g) || []).length, (defaultWeekend.match(/<rect /g) || []).length);
  const bankFull = buildGateGanttSvg(bank, 0);
  assert.equal((hiddenWeekendFxOpenOnBank.match(/<rect /g) || []).length, (bankFull.match(/<rect /g) || []).length);
  assert.equal(attributeBottlenecks(early).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(early).timeline.length, SIMULATION_HOURS + 1);
});

test("hide-weekend-FX-open Gantt filter is a display control that can restore all hours", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-weekend-fx-open"/);
  assert.match(html, /Hide weekend hours where the FX gate is open/);
  assert.match(html, /id="gantt-hide-weekend-payout-open"/);
  assert.match(html, /id="gantt-hide-fx-open"/);
  assert.match(html, /id="gantt-hide-weekends"/);
  assert.match(app, /ganttHourWeekendFxOpen/);
  assert.match(app, /hideWeekendFxOpenHours/);
  assert.match(app, /hideWeekendPayoutOpenHours/);
  assert.match(app, /hideFxOpenHours/);
  assert.match(app, /hideWeekendHours/);
  assert.match(app, /hour !== selectedHour/);
  assert.match(app, /Display only/);
  assert.match(app, /The model still contains/);
});
