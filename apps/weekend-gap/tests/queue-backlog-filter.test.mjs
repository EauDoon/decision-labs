import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { DEFAULT_SCENARIO, SIMULATION_HOURS, runSimulation } from "../src/model.js";

test("backlog-only queue table filter is display-only and leaves dashboard counts unchanged", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="queue-backlog-only"/);
  assert.match(html, /Show only hours with backlog/);
  assert.match(html, /id="queue-backlog-filter-note"/);
  assert.match(app, /queue-backlog-only/);
  assert.match(app, /Dashboard counts are unchanged/);
  const result = runSimulation(DEFAULT_SCENARIO);
  assert.equal(result.summary.hoursWithQueue, result.timeline.filter((point) => point.queuedAud > 0).length);
  assert.equal(result.timeline.length, SIMULATION_HOURS + 1);
  assert.ok(result.summary.hoursWithQueue > 0);
  assert.ok(result.summary.hoursWithQueue < result.timeline.length);
});
