import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { DEFAULT_SCENARIO, PRESETS, dashboardToMarkdown, runSimulation } from "../src/model.js";

test("dashboard Markdown copies hours to clear, peak hour and first settlement", () => {
  const text = dashboardToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, dashboardToMarkdown(DEFAULT_SCENARIO));
  const result = runSimulation(DEFAULT_SCENARIO);
  assert.match(text, /Hours to clear queue/);
  assert.match(text, /Peak queue hour/);
  assert.match(text, /Hours to first settlement/);
  assert.match(text, new RegExp(String(result.summary.hoursToClearQueue) + " hours"));
  assert.match(text, /Mon 08:00 \(hour 65\)/);
  assert.match(text, /0 hours/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.match(text, /Not financial advice/);
});

test("dashboard Markdown uses residual-queue and no-settlement wording", () => {
  const leftover = dashboardToMarkdown(PRESETS.marketStress);
  assert.match(leftover, /queue remains/);
  assert.match(leftover, /Mon 15:00 \(hour 72\)/);
  const empty = dashboardToMarkdown({ ...DEFAULT_SCENARIO, redemptionDemandAud: 0 });
  assert.match(empty, /No queue in 72h/);
  const closed = dashboardToMarkdown({ ...DEFAULT_SCENARIO, payoutThroughputAudPerHour: 0 });
  assert.match(closed, /No settlement in 72h/);
});

test("copy dashboard numbers control sits on the outcome card", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-dashboard-markdown"/);
  assert.match(html, /Copy dashboard numbers/);
  assert.match(app, /dashboardToMarkdown\(scenario\)/);
  assert.match(app, /Hours to clear, peak hour and first settlement/);
});
