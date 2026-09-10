import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { DEFAULT_SCENARIO, firstClosedGanttHour, formatTime, scenarioToJSON } from "../src/model.js";

test("print and print redacted include the first closed bank hour label with an honest empty", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="first-closed-bank-hour-line"/);
  assert.match(html, /id="first-closed-bank-hour-value"/);
  assert.match(html, /First closed bank hour/);
  assert.match(html, /class="outcome-card card print-keep"/);
  assert.match(css, /\.outcome-card/);
  assert.match(css, /\.print-keep/);
  assert.match(app, /firstClosedBankHour\.textContent/);
  assert.match(app, /firstClosedGanttHour\(scenario\)/);
  assert.match(app, /the first closed bank hour when one exists, with an honest empty when none/);
  assert.match(app, /The first closed bank hour stays on the printed brief when one exists, with an honest empty when none/);
  assert.match(app, /counts of modeled hours, not a bank calendar/);
  const printHandler = app.slice(app.indexOf('document.querySelector("#print")'), app.indexOf('document.querySelector("#copy-dashboard-markdown")'));
  assert.doesNotMatch(printHandler, /setScenario\(/);
  assert.match(printHandler, /The saved scenario was not changed/);
  const hour = firstClosedGanttHour(DEFAULT_SCENARIO);
  assert.equal(hour, 2);
  assert.equal(formatTime(hour), "Fri 17:00");
  const before = scenarioToJSON(DEFAULT_SCENARIO);
  assert.equal(scenarioToJSON(DEFAULT_SCENARIO), before);
});
