import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  SIMULATION_HOURS,
  closedGanttHoursToMarkdown,
  ganttHourClosedOnAnyGate,
  buildGateSchedule,
  runSimulation
} from "../src/model.js";

test("closed-hours Markdown lists hour labels and closed gates as a local drawing", () => {
  const text = closedGanttHoursToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, closedGanttHoursToMarkdown(DEFAULT_SCENARIO));
  assert.match(text, /Local drawing of modeled gate hours/);
  assert.match(text, /Not a bank feed/);
  assert.match(text, /\| Hour \| Closed gates \|/);
  assert.match(text, /Fri 17:00 \(hour 2\) \| Issuer, Bank, Payout \|/);
  assert.match(text, /Sat 12:00 \(hour 21\) \| Issuer, Bank, Payout, FX \|/);
  assert.doesNotMatch(text, /Fri 15:00 \(hour 0\)/);
  const schedule = buildGateSchedule(DEFAULT_SCENARIO);
  const closedCount = schedule.hours.filter((point) => point.hour < SIMULATION_HOURS && ganttHourClosedOnAnyGate(point)).length;
  const rows = text.split("\n").filter((line) => line.startsWith("| ") && line.includes("(hour "));
  assert.equal(rows.length, closedCount);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
});

test("copy closed hours uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-closed-hours"/);
  assert.match(html, /Copy closed hours/);
  assert.match(html, /id="closed-hours-copy-fallback"/);
  assert.match(app, /closedGanttHoursToMarkdown\(scenario\)/);
  assert.match(app, /closed-hours-copy-fallback/);
  assert.match(app, /local drawing, not a bank feed/);
});
