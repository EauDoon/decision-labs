import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { DEFAULT_SCENARIO, runSimulation } from "../src/model.js";

test("hourly table highlights the peak queue row with text", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="peak-queue-row-note"/);
  assert.match(css, /tr\.is-peak-queue/);
  assert.match(app, /is-peak-queue/);
  assert.match(app, /Peak queue/);
  const result = runSimulation(DEFAULT_SCENARIO);
  assert.equal(result.summary.peakQueueHour, 65);
  assert.ok(result.summary.peakQueuedAud > 0);
});
