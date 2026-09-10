import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { DEFAULT_SCENARIO, scenarioToJSON } from "../src/model.js";

test("print and print redacted include the hours-to-clear line without changing the saved scenario", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="hours-to-clear-line"/);
  assert.match(html, /id="queue-clear-value"/);
  assert.match(html, /Hours to clear queue/);
  assert.match(html, /class="outcome-card card print-keep"/);
  assert.match(css, /\.outcome-card/);
  assert.match(css, /\.print-keep/);
  assert.match(app, /queueClear\.textContent/);
  assert.match(app, /Hours to clear the queue stay on the printed brief/);
  const printHandler = app.slice(app.indexOf('document.querySelector("#print-redacted")'), app.indexOf('document.querySelector("#copy-dashboard-markdown")'));
  assert.doesNotMatch(printHandler, /setScenario\(/);
  assert.match(printHandler, /The saved scenario was not changed/);
  const before = scenarioToJSON(DEFAULT_SCENARIO);
  assert.equal(scenarioToJSON(DEFAULT_SCENARIO), before);
});
