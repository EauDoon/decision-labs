import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("horizon input and calendar override editor exist with bounded controls", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="horizonHours"/);
  assert.match(html, /data-field="horizonHours"/);
  assert.match(html, /id="calendar-overrides"/);
  assert.match(html, /id="add-calendar-override"/);
  assert.match(html, /id="calendar-override-status"/);
  assert.match(html, /later entries win per field/);
  assert.match(app, /function renderCalendarOverrides\(/);
  assert.match(app, /function applyOverrideEdit\(/);
  assert.match(app, /sanitizeCalendarOverrides\(parsed, simHours\(\)\)/);
  assert.match(app, /data-remove-override/);
  assert.match(app, /timelineRange\.max = String\(simHours\(\)\)/);
});

test("slider, jump, and workspace restore respect the horizon", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /selectedHour=Math\.min\(65,simHours\(\)\)/);
  assert.match(app, /selectedHour=Math\.min\(saved\.ganttHourIndex \?\? saved\.selectedHour \?\? 0, scenarioHours\(saved\.current\)\)/);
  assert.match(app, /selectedHour = Math\.min\(selectedHour, simHours\(\)\)/);
});

test("demand timing label no longer pins 72 hours", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /Even across the horizon/);
  assert.doesNotMatch(html, /Even across 72 hours/);
});
