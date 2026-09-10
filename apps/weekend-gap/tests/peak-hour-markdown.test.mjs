import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  peakQueueHourToMarkdown,
  runSimulation,
  selectedGanttHourToMarkdown
} from "../src/model.js";

test("peak-queue hour Markdown lists hour, queued AUD and gate state with a synthetic notice", () => {
  const text = peakQueueHourToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, peakQueueHourToMarkdown(DEFAULT_SCENARIO));
  const result = runSimulation(DEFAULT_SCENARIO);
  assert.equal(result.summary.peakQueueHour, 65);
  assert.match(text, /Synthetic educational snapshot/);
  assert.match(text, /Not a live bank or payout queue/);
  assert.match(text, /Hour: Mon 08:00 \(hour 65\)/);
  assert.match(text, new RegExp("Queued AUD: " + result.summary.peakQueuedAud));
  assert.match(text, /\| Issuer \| Open \|/);
  assert.match(text, /\| Bank \| Open \|/);
  assert.match(text, /\| Payout \| Open \|/);
  assert.match(text, /\| FX \| Weekday depth \|/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, selectedGanttHourToMarkdown(DEFAULT_SCENARIO, 65));
});

test("peak-queue hour Markdown reports no queue without inventing an hour", () => {
  const text = peakQueueHourToMarkdown({ ...DEFAULT_SCENARIO, redemptionDemandAud: 0 });
  assert.match(text, /No queue in 72h/);
  assert.doesNotMatch(text, /Hour:/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
});

test("copy peak-queue hour uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-peak-hour"/);
  assert.match(html, /Copy peak-queue hour/);
  assert.match(html, /id="peak-hour-copy-fallback"/);
  assert.match(app, /peakQueueHourToMarkdown\(scenario\)/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /peak-hour-copy-fallback/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
  assert.match(app, /selectedGanttHourToMarkdown\(scenario, selectedHour\)/);
});
