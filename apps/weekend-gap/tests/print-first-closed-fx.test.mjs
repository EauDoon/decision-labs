import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { DEFAULT_SCENARIO, firstClosedFxGanttHour, formatTime, scenarioToJSON } from "../src/model.js";

test("print and print redacted include the first closed FX hour label without changing the saved scenario", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="first-closed-fx-hour-line"/);
  assert.match(html, /id="first-closed-fx-hour-value"/);
  assert.match(html, /First closed FX hour/);
  assert.match(html, /class="outcome-card card print-keep"/);
  assert.match(css, /\.outcome-card/);
  assert.match(css, /\.print-keep/);
  assert.match(app, /firstClosedFxHour\.textContent/);
  assert.match(app, /firstClosedFxGanttHour\(scenario\)/);
  assert.match(app, /The first closed FX hour label stays on the printed brief/);
  assert.match(app, /counts of modeled hours, not a bank calendar/);
  const printHandler = app.slice(app.indexOf('document.querySelector("#print-redacted")'), app.indexOf('document.querySelector("#copy-dashboard-markdown")'));
  assert.doesNotMatch(printHandler, /setScenario\(/);
  assert.match(printHandler, /The saved scenario was not changed/);
  const hour = firstClosedFxGanttHour(DEFAULT_SCENARIO);
  assert.equal(hour, 9);
  assert.equal(formatTime(hour), "Sat 00:00");
  const before = scenarioToJSON(DEFAULT_SCENARIO);
  assert.equal(scenarioToJSON(DEFAULT_SCENARIO), before);
});
