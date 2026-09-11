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
  ganttHourBankClosed,
  ganttHourIsWeekend,
  ganttHourWeekendBankClosed,
  ganttHourWeekendIssuerClosed,
  runSimulation
} from "../src/model.js";

test("weekend-bank-closed helper hides hours that are weekend and bank-closed", () => {
  const schedule = buildGateSchedule(DEFAULT_SCENARIO);
  assert.equal(ganttHourWeekendBankClosed(schedule.hours[0]), false);
  assert.equal(ganttHourBankClosed(schedule.hours[0]), false);
  assert.equal(ganttHourIsWeekend(schedule.hours[0]), false);
  assert.equal(ganttHourWeekendBankClosed(schedule.hours[41]), true);
  assert.equal(ganttHourIsWeekend(schedule.hours[41]), true);
  assert.equal(ganttHourBankClosed(schedule.hours[41]), true);
  assert.equal(ganttHourWeekendBankClosed(null), false);
  assert.equal(ganttHourWeekendBankClosed({}), false);
  const saturday = buildGateSchedule(PRESETS.saturdayEarlyIssuerOpen);
  assert.equal(ganttHourWeekendBankClosed(saturday.hours[16]), true);
  assert.equal(ganttHourWeekendIssuerClosed(saturday.hours[16]), true);
  assert.equal(ganttHourWeekendBankClosed(saturday.hours[17]), true);
  assert.equal(ganttHourWeekendIssuerClosed(saturday.hours[17]), false);
  assert.equal(ganttHourWeekendBankClosed(saturday.hours[0]), false);
  const sundayBank = buildGateSchedule(PRESETS.sundayLateBankClose);
  assert.equal(ganttHourWeekendBankClosed(sundayBank.hours[49]), false);
  assert.equal(ganttHourWeekendIssuerClosed(sundayBank.hours[49]), true);
  const weekendBankClosed = saturday.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourWeekendBankClosed(point)).length;
  const bankClosed = saturday.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourBankClosed(point)).length;
  const weekendIssuerClosed = saturday.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourWeekendIssuerClosed(point)).length;
  assert.ok(weekendBankClosed > 0);
  assert.ok(bankClosed > weekendBankClosed);
  assert.ok(weekendBankClosed !== weekendIssuerClosed);
});

test("hide-weekend-bank-closed Gantt SVG is display-only and keeps the selected hour visible", () => {
  const saturday = PRESETS.saturdayEarlyIssuerOpen;
  const sundayBank = PRESETS.sundayLateBankClose;
  const full = buildGateGanttSvg(saturday, 0);
  const hiddenWeekendBankClosed = buildGateGanttSvg(saturday, 0, { hideWeekendBankClosedHours: true });
  const hiddenWeekendIssuerClosed = buildGateGanttSvg(saturday, 0, { hideWeekendIssuerClosedHours: true });
  const hiddenBankClosed = buildGateGanttSvg(saturday, 0, { hideBankClosedHours: true });
  const hiddenWeekend = buildGateGanttSvg(sundayBank, 0, { hideWeekendHours: true });
  const hiddenWeekendBankOnSunday = buildGateGanttSvg(sundayBank, 0, { hideWeekendBankClosedHours: true });
  const selectedWeekendClosed = buildGateGanttSvg(saturday, 16, { hideWeekendBankClosedHours: true });
  const selectedWeekday = buildGateGanttSvg(saturday, 0, { hideWeekendBankClosedHours: true });
  assert.notEqual(full, hiddenWeekendBankClosed);
  assert.notEqual(hiddenWeekendBankClosed, hiddenWeekendIssuerClosed);
  assert.notEqual(hiddenWeekendBankClosed, hiddenBankClosed);
  assert.notEqual(hiddenWeekendBankOnSunday, hiddenWeekend);
  assert.match(hiddenWeekendBankClosed, /viewBox="0 0 720/);
  const hiddenRects = (hiddenWeekendBankClosed.match(/<rect /g) || []).length;
  const fullRects = (full.match(/<rect /g) || []).length;
  const issuerRects = (hiddenWeekendIssuerClosed.match(/<rect /g) || []).length;
  const bankRects = (hiddenBankClosed.match(/<rect /g) || []).length;
  const weekendRects = (hiddenWeekend.match(/<rect /g) || []).length;
  const sundayBankRects = (hiddenWeekendBankOnSunday.match(/<rect /g) || []).length;
  const selectedClosedRects = (selectedWeekendClosed.match(/<rect /g) || []).length;
  const selectedWeekdayRects = (selectedWeekday.match(/<rect /g) || []).length;
  assert.ok(hiddenRects < fullRects);
  assert.ok(bankRects < hiddenRects);
  assert.ok(sundayBankRects > weekendRects);
  assert.ok(issuerRects !== hiddenRects);
  assert.ok(selectedClosedRects > selectedWeekdayRects);
  const defaultHidden = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendBankClosedHours: true });
  const defaultWeekend = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendHours: true });
  assert.equal((defaultHidden.match(/<rect /g) || []).length, (defaultWeekend.match(/<rect /g) || []).length);
  assert.equal(attributeBottlenecks(saturday).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(saturday).timeline.length, SIMULATION_HOURS + 1);
});

test("hide-weekend-bank-closed Gantt filter is a display control that can restore all hours", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-weekend-bank-closed"/);
  assert.match(html, /Hide weekend hours where the bank gate is closed/);
  assert.match(html, /id="gantt-hide-weekend-issuer-closed"/);
  assert.match(html, /id="gantt-hide-bank-closed"/);
  assert.match(html, /id="gantt-hide-weekends"/);
  assert.match(app, /ganttHourWeekendBankClosed/);
  assert.match(app, /hideWeekendBankClosedHours/);
  assert.match(app, /hideWeekendIssuerClosedHours/);
  assert.match(app, /hideBankClosedHours/);
  assert.match(app, /hour !== selectedHour/);
  assert.match(app, /Display only/);
  assert.match(app, /The model still contains/);
});
