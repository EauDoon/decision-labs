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
  ganttHourBankOpen,
  ganttHourIsWeekend,
  ganttHourWeekendBankClosed,
  ganttHourWeekendBankOpen,
  ganttHourWeekendIssuerOpen,
  runSimulation
} from "../src/model.js";

test("weekend-bank-open helper hides hours that are weekend and bank-open", () => {
  const schedule = buildGateSchedule(DEFAULT_SCENARIO);
  assert.equal(ganttHourWeekendBankOpen(schedule.hours[0]), false);
  assert.equal(ganttHourBankOpen(schedule.hours[0]), true);
  assert.equal(ganttHourIsWeekend(schedule.hours[0]), false);
  assert.equal(ganttHourWeekendBankOpen(schedule.hours[41]), false);
  assert.equal(ganttHourIsWeekend(schedule.hours[41]), true);
  assert.equal(ganttHourBankOpen(schedule.hours[41]), false);
  assert.equal(ganttHourWeekendBankOpen(null), false);
  assert.equal(ganttHourWeekendBankOpen({}), false);
  const early = buildGateSchedule(PRESETS.saturdayEarlyBankOpen);
  assert.equal(ganttHourWeekendBankOpen(early.hours[16]), false);
  assert.equal(ganttHourWeekendBankOpen(early.hours[17]), true);
  assert.equal(ganttHourWeekendBankOpen(early.hours[18]), true);
  assert.equal(ganttHourWeekendBankOpen(early.hours[19]), false);
  assert.equal(ganttHourWeekendBankOpen(early.hours[0]), false);
  const issuer = buildGateSchedule(PRESETS.saturdayEarlyIssuerOpen);
  assert.equal(ganttHourWeekendBankOpen(issuer.hours[17]), false);
  assert.equal(ganttHourWeekendIssuerOpen(issuer.hours[17]), true);
  assert.equal(ganttHourWeekendBankClosed(issuer.hours[17]), true);
  const weekendBankOpen = early.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourWeekendBankOpen(point)).length;
  const bankOpen = early.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourBankOpen(point)).length;
  const weekendIssuerOpen = issuer.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourWeekendIssuerOpen(point)).length;
  assert.ok(weekendBankOpen > 0);
  assert.ok(bankOpen > weekendBankOpen);
  assert.equal(weekendBankOpen, 2);
  assert.equal(weekendIssuerOpen, 2);
});

test("hide-weekend-bank-open Gantt SVG is display-only and keeps the selected hour visible", () => {
  const early = PRESETS.saturdayEarlyBankOpen;
  const issuer = PRESETS.saturdayEarlyIssuerOpen;
  const full = buildGateGanttSvg(early, 0);
  const hiddenWeekendBankOpen = buildGateGanttSvg(early, 0, { hideWeekendBankOpenHours: true });
  const hiddenBankOpen = buildGateGanttSvg(early, 0, { hideBankOpenHours: true });
  const hiddenWeekend = buildGateGanttSvg(early, 0, { hideWeekendHours: true });
  const hiddenWeekendBankClosed = buildGateGanttSvg(early, 0, { hideWeekendBankClosedHours: true });
  const hiddenWeekendIssuerOpen = buildGateGanttSvg(issuer, 0, { hideWeekendIssuerOpenHours: true });
  const hiddenWeekendBankOpenOnIssuer = buildGateGanttSvg(issuer, 0, { hideWeekendBankOpenHours: true });
  const selectedWeekendOpen = buildGateGanttSvg(early, 17, { hideWeekendBankOpenHours: true });
  const selectedWeekday = buildGateGanttSvg(early, 0, { hideWeekendBankOpenHours: true });
  assert.notEqual(full, hiddenWeekendBankOpen);
  assert.notEqual(hiddenWeekendBankOpen, hiddenBankOpen);
  assert.notEqual(hiddenWeekendBankOpen, hiddenWeekend);
  assert.notEqual(hiddenWeekendBankOpen, hiddenWeekendBankClosed);
  assert.notEqual(hiddenWeekendBankOpenOnIssuer, hiddenWeekendIssuerOpen);
  assert.match(hiddenWeekendBankOpen, /viewBox="0 0 720/);
  const hiddenRects = (hiddenWeekendBankOpen.match(/<rect /g) || []).length;
  const fullRects = (full.match(/<rect /g) || []).length;
  const bankRects = (hiddenBankOpen.match(/<rect /g) || []).length;
  const weekendRects = (hiddenWeekend.match(/<rect /g) || []).length;
  const closedRects = (hiddenWeekendBankClosed.match(/<rect /g) || []).length;
  const issuerOpenRects = (hiddenWeekendIssuerOpen.match(/<rect /g) || []).length;
  const issuerBankOpenRects = (hiddenWeekendBankOpenOnIssuer.match(/<rect /g) || []).length;
  const selectedOpenRects = (selectedWeekendOpen.match(/<rect /g) || []).length;
  const selectedWeekdayRects = (selectedWeekday.match(/<rect /g) || []).length;
  assert.ok(hiddenRects < fullRects);
  assert.ok(bankRects < hiddenRects);
  assert.ok(weekendRects < hiddenRects);
  assert.ok(closedRects !== hiddenRects);
  assert.ok(issuerOpenRects !== issuerBankOpenRects);
  assert.ok(selectedOpenRects > selectedWeekdayRects);
  const defaultHidden = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendBankOpenHours: true });
  const defaultFull = buildGateGanttSvg(DEFAULT_SCENARIO, 0);
  const defaultWeekend = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { hideWeekendHours: true });
  assert.equal((defaultHidden.match(/<rect /g) || []).length, (defaultFull.match(/<rect /g) || []).length);
  assert.notEqual((defaultHidden.match(/<rect /g) || []).length, (defaultWeekend.match(/<rect /g) || []).length);
  const issuerFull = buildGateGanttSvg(issuer, 0);
  assert.equal((hiddenWeekendBankOpenOnIssuer.match(/<rect /g) || []).length, (issuerFull.match(/<rect /g) || []).length);
  assert.equal(attributeBottlenecks(early).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(early).timeline.length, SIMULATION_HOURS + 1);
});

test("hide-weekend-bank-open Gantt filter is a display control that can restore all hours", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-hide-weekend-bank-open"/);
  assert.match(html, /Hide weekend hours where the bank gate is open/);
  assert.match(html, /id="gantt-hide-weekend-bank-closed"/);
  assert.match(html, /id="gantt-hide-weekend-issuer-open"/);
  assert.match(html, /id="gantt-hide-weekends"/);
  assert.match(app, /ganttHourWeekendBankOpen/);
  assert.match(app, /hideWeekendBankOpenHours/);
  assert.match(app, /hideWeekendBankClosedHours/);
  assert.match(app, /hideWeekendHours/);
  assert.match(app, /hour !== selectedHour/);
  assert.match(app, /Display only/);
  assert.match(app, /The model still contains/);
});
