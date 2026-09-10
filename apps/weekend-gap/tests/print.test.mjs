import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("print operations brief hides coach and help and keeps dashboard, Gantt and hours-to-clear", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const printBlock = css.slice(css.indexOf("@media print"));
  assert.match(html, /class="metrics print-keep"/);
  assert.match(html, /class="outcome-card card print-keep"/);
  assert.match(html, /class="planning-card card gantt-card print-keep"/);
  assert.match(html, /id="queue-clear-value"/);
  assert.match(html, /id="peak-queue-hour-value"/);
  assert.match(html, /id="coach-overlay"/);
  assert.match(html, /id="coach-overlay"/);
  assert.match(html, /id="shortcut-overlay"/);
  assert.match(printBlock, /#coach-overlay/);
  assert.match(printBlock, /#shortcut-overlay/);
  assert.match(printBlock, /#shortcut-open/);
  assert.match(printBlock, /display: none !important/);
  assert.match(printBlock, /\.print-keep/);
  assert.match(printBlock, /\.metrics, \.outcome-card, \.gantt-card/);
});

test("print stylesheet hides live labels when print-redacted is set", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  assert.match(css, /\.print-redacted \.gate-live-label \{ display: none !important; \}/);
  assert.match(css, /\.print-redacted \.gate-redacted-label \{ display: inline !important; \}/);
});
