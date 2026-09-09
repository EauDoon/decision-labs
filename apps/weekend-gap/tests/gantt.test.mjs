import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  SIMULATION_HOURS,
  buildComparisonGanttSvg,
  buildGateGanttSvg,
  buildGateSchedule,
  compareGateSchedules,
  formatTime,
  getOperationalStatus
} from "../src/model.js";

test("gate schedule covers 73 checkpoints and matches operational status", () => {
  const schedule = buildGateSchedule(DEFAULT_SCENARIO);
  assert.equal(schedule.hours.length, SIMULATION_HOURS + 1);
  assert.equal(schedule.hours[0].timeLabel, "Fri 15:00");
  assert.equal(schedule.hours[0].issuerOpen, true);
  assert.equal(schedule.hours[21].timeLabel, "Sat 12:00");
  assert.equal(schedule.hours[21].issuerOpen, false);
  assert.equal(schedule.hours[21].fxWeekday, false);
  for (const point of schedule.hours) {
    const status = getOperationalStatus(DEFAULT_SCENARIO, point.hour);
    assert.equal(point.issuerOpen, status.issuerOpen);
    assert.equal(point.bankOpen, status.bankOpen);
    assert.equal(point.payoutOpen, status.payoutOpen);
    assert.equal(point.fxWeekday, !status.weekend);
  }
});

test("Gantt SVG is deterministic, light-background, and marks the selected hour", () => {
  const svg = buildGateGanttSvg(DEFAULT_SCENARIO, 21);
  assert.equal(svg, buildGateGanttSvg(DEFAULT_SCENARIO, 21));
  assert.match(svg, /^<svg /);
  assert.match(svg, /fill="#f7fafb"/);
  assert.match(svg, /Issuer/);
  assert.match(svg, /Bank/);
  assert.match(svg, /Payout/);
  assert.match(svg, /FX/);
  assert.match(svg, new RegExp(formatTime(21).replace(":", "\\:")));
  assert.doesNotMatch(svg, /<\/script/i);
  const moved = buildGateGanttSvg(DEFAULT_SCENARIO, 65);
  assert.notEqual(svg, moved);
  assert.match(svg, />First payout /);
  const closed = buildGateGanttSvg({ ...DEFAULT_SCENARIO, payoutThroughputAudPerHour: 0 }, 0);
  assert.doesNotMatch(closed, />First payout /);
});

test("Gantt markup includes a table fallback and print styles", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gate-gantt"/);
  assert.match(html, /id="gantt-table"/);
  assert.match(html, /Text equivalent of the Gantt/);
  assert.match(html, /id="gantt-density"/);
  assert.match(html, /id="export-gantt"/);
  assert.match(css, /@media print/);
  assert.match(css, /\.gantt-svg/);
  assert.match(app, /weekend-gap-gantt\.svg/);
  assert.match(app, /gantt-density/);
});

test("identical scenarios have no gate-calendar differences", () => {
  const same = compareGateSchedules(DEFAULT_SCENARIO, DEFAULT_SCENARIO);
  assert.equal(same.hours.length, SIMULATION_HOURS + 1);
  assert.equal(same.differingHours, 0);
  assert.equal(same.hours[21].differs, false);
});

test("holiday Monday changes Monday gate hours against a weekday baseline", () => {
  const compared = compareGateSchedules(DEFAULT_SCENARIO, { ...DEFAULT_SCENARIO, mondayHoliday: true });
  assert.ok(compared.differingHours > 0);
  assert.equal(compared.hours[0].differs, false);
  assert.equal(compared.hours[21].differs, false);
  assert.equal(compared.hours[65].timeLabel, "Mon 08:00");
  assert.equal(compared.hours[65].differs, true);
  assert.equal(compared.hours[65].current.issuerOpen, false);
  assert.equal(compared.hours[65].baseline.issuerOpen, true);
  assert.equal(compared.hours[65].current.fxWeekday, false);
  assert.equal(compared.hours[65].baseline.fxWeekday, true);
});

test("comparison Gantt SVG is deterministic and uses paired current and baseline rows", () => {
  const svg = buildComparisonGanttSvg(DEFAULT_SCENARIO, { ...DEFAULT_SCENARIO, mondayHoliday: true }, 65);
  assert.equal(svg, buildComparisonGanttSvg(DEFAULT_SCENARIO, { ...DEFAULT_SCENARIO, mondayHoliday: true }, 65));
  assert.match(svg, /^<svg /);
  assert.match(svg, /fill="#f7fafb"/);
  assert.match(svg, /Issuer current/);
  assert.match(svg, /Issuer baseline/);
  assert.match(svg, /Bank current/);
  assert.match(svg, /Payout baseline/);
  assert.match(svg, /FX current/);
  assert.match(svg, /paired rows/);
  assert.doesNotMatch(svg, /<\/script/i);
  assert.notEqual(svg, buildComparisonGanttSvg(DEFAULT_SCENARIO, DEFAULT_SCENARIO, 0));
});

test("comparison Gantt markup includes a table fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="compare-gantt"/);
  assert.match(html, /id="compare-gantt-table"/);
  assert.match(html, /id="compare-gantt-status"/);
  assert.match(html, /Text equivalent of the paired-row Gantt/);
  assert.match(app, /buildComparisonGanttSvg/);
  assert.match(app, /compareGateSchedules/);
  assert.match(app, /Current and baseline gate hours match/);
});
