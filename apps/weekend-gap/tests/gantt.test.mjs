import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  SIMULATION_HOURS,
  buildGateGanttSvg,
  buildGateSchedule,
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
  assert.match(html, /id="gate-gantt"/);
  assert.match(html, /id="gantt-table"/);
  assert.match(html, /Text equivalent of the Gantt/);
  assert.match(css, /@media print/);
  assert.match(css, /\.gantt-svg/);
});
