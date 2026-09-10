import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  SIMULATION_HOURS,
  fxGanttHoursToMarkdown,
  buildGateSchedule,
  runSimulation
} from "../src/model.js";

test("FX hours Markdown lists weekday and weekend FX as a local drawing", () => {
  const text = fxGanttHoursToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, fxGanttHoursToMarkdown(DEFAULT_SCENARIO));
  assert.match(text, /Local drawing of modeled FX hours/);
  assert.match(text, /Not a bank feed/);
  assert.match(text, /\| Hour \| FX \|/);
  assert.match(text, /Fri 15:00 \(hour 0\) \| Weekday depth \|/);
  assert.match(text, /Sat 12:00 \(hour 21\) \| Weekend thinned \|/);
  assert.match(text, /Mon 08:00 \(hour 65\) \| Weekday depth \|/);
  const schedule = buildGateSchedule(DEFAULT_SCENARIO);
  const rows = text.split("\n").filter((line) => line.startsWith("| ") && line.includes("(hour "));
  assert.equal(rows.length, SIMULATION_HOURS);
  assert.equal(schedule.hours[0].fxWeekday, true);
  assert.equal(schedule.hours[21].fxWeekday, false);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
});

test("copy FX hours uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-fx-hours"/);
  assert.match(html, /Copy FX hours/);
  assert.match(html, /id="fx-hours-copy-fallback"/);
  assert.match(app, /fxGanttHoursToMarkdown\(scenario\)/);
  assert.match(app, /fx-hours-copy-fallback/);
  assert.match(app, /local drawing, not a bank feed/);
});
