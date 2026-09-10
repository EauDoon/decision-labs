import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  SIMULATION_HOURS,
  buildComparisonGanttSvg,
  buildGateGanttSvg,
  ganttToCSV,
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
    assert.equal(point.fxWeekday, status.fxWeekday);
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

test("Gantt SVG uses hatch patterns so open and closed are not color-only", () => {
  const svg = buildGateGanttSvg(DEFAULT_SCENARIO, 21);
  assert.match(svg, /<pattern id="wg-gantt-closed"/);
  assert.match(svg, /<pattern id="wg-gantt-fx-closed"/);
  assert.match(svg, /url\(#wg-gantt-closed\)/);
  assert.match(svg, /url\(#wg-gantt-fx-closed\)/);
  assert.match(svg, /Hatched fill is closed/);
  assert.match(svg, /Solid open or weekday/);
  const compared = buildComparisonGanttSvg(DEFAULT_SCENARIO, { ...DEFAULT_SCENARIO, mondayHoliday: true }, 65);
  assert.match(compared, /<pattern id="wg-compare-closed"/);
  assert.match(compared, /url\(#wg-compare-closed\)/);
  assert.match(compared, /Solid open, hatched closed/);
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
  assert.match(html, /hatched/);
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

test("Gantt CSV lists open and closed state for the same 72 chart hours", () => {
  const schedule = buildGateSchedule(DEFAULT_SCENARIO);
  const rows = ganttToCSV(DEFAULT_SCENARIO).trimEnd().split("\r\n").map((row) => {
    const cells = [];
    let current = "";
    let inQuotes = false;
    for (let index = 0; index < row.length; index += 1) {
      const char = row[index];
      if (inQuotes) {
        if (char === '"' && row[index + 1] === '"') {
          current += '"';
          index += 1;
        } else if (char === '"') inQuotes = false;
        else current += char;
      } else if (char === '"') inQuotes = true;
      else if (char === ",") {
        cells.push(current);
        current = "";
      } else current += char;
    }
    cells.push(current);
    return cells;
  });
  assert.deepEqual(rows[0], ["hour", "time_label", "issuer", "bank", "payout", "fx"]);
  assert.equal(rows.length, SIMULATION_HOURS + 1);
  assert.equal(rows[1][0], "0");
  assert.equal(rows[1][1], "Fri 15:00");
  assert.equal(rows[SIMULATION_HOURS][0], "71");
  for (let hour = 0; hour < SIMULATION_HOURS; hour += 1) {
    const point = schedule.hours[hour];
    assert.equal(rows[hour + 1][1], point.timeLabel);
    assert.equal(rows[hour + 1][2], point.issuerOpen ? "open" : "closed");
    assert.equal(rows[hour + 1][3], point.bankOpen ? "open" : "closed");
    assert.equal(rows[hour + 1][4], point.payoutOpen ? "open" : "closed");
    assert.equal(rows[hour + 1][5], point.fxWeekday ? "weekday" : "weekend");
  }
  assert.match(ganttToCSV(DEFAULT_SCENARIO), /^"hour","time_label","issuer","bank","payout","fx"\r\n/);
});

test("Gantt CSV download is wired beside the Gantt SVG download", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="export-gantt-csv"/);
  assert.match(html, /Export Gantt CSV/);
  assert.match(app, /ganttToCSV\(scenario\)/);
  assert.match(app, /weekend-gap-gantt\.csv/);
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
