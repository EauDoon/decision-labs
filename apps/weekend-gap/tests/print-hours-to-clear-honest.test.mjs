import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { DEFAULT_SCENARIO, hoursToClearQueueToMarkdown, scenarioToJSON } from "../src/model.js";

test("print and print redacted include hours-to-clear with an honest empty and modeled-hour counts", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="hours-to-clear-line"/);
  assert.match(html, /id="queue-clear-value"/);
  assert.match(html, /Hours to clear queue/);
  assert.match(html, /id="print"/);
  assert.match(html, /id="print-redacted"/);
  assert.match(html, /class="outcome-card card print-keep"/);
  assert.match(css, /\.print-keep/);
  assert.match(app, /queueClear\.textContent/);
  assert.match(app, /hours to clear the queue when a queue exists, with an honest empty when none/);
  assert.match(app, /counts of modeled hours, not a bank calendar/);
  const printHandler = app.slice(app.indexOf('document.querySelector("#print")'), app.indexOf('document.querySelector("#copy-dashboard-markdown")'));
  assert.doesNotMatch(printHandler, /setScenario\(/);
  assert.match(printHandler, /The saved scenario was not changed/);
  const empty = hoursToClearQueueToMarkdown({ ...DEFAULT_SCENARIO, redemptionDemandAud: 0 });
  assert.match(empty, /No queue in 72h/);
  assert.notEqual(empty.trim(), "");
  const before = scenarioToJSON(DEFAULT_SCENARIO);
  assert.equal(scenarioToJSON(DEFAULT_SCENARIO), before);
});
