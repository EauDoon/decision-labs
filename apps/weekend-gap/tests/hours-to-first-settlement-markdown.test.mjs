import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  PRESETS,
  hoursToClearQueueToMarkdown,
  hoursToFirstSettlementToMarkdown,
  runSimulation
} from "../src/model.js";

test("hours-to-first-settlement Markdown is one synthetic line and not hours-to-clear", () => {
  const text = hoursToFirstSettlementToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, hoursToFirstSettlementToMarkdown(DEFAULT_SCENARIO));
  assert.equal(text.split("\n").length, 1);
  const result = runSimulation(DEFAULT_SCENARIO);
  assert.match(text, new RegExp("^Hours to first settlement: " + result.summary.hoursToFirstSettlement + " hours\\. "));
  assert.match(text, /Synthetic educational snapshot/);
  assert.match(text, /not live market data/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, hoursToClearQueueToMarkdown(DEFAULT_SCENARIO));
});

test("hours-to-first-settlement Markdown uses the 72-hour empty wording", () => {
  const empty = hoursToFirstSettlementToMarkdown({ ...DEFAULT_SCENARIO, payoutThroughputAudPerHour: 0 });
  assert.equal(empty.split("\n").length, 1);
  assert.match(empty, /No settlement in 72h/);
  const leftover = hoursToClearQueueToMarkdown(PRESETS.marketStress);
  assert.notEqual(empty, leftover);
});

test("copy hours to first settlement uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-hours-to-first-settlement"/);
  assert.match(html, /Copy hours to first settlement/);
  assert.match(html, /id="hours-to-first-settlement-copy-fallback"/);
  assert.match(app, /hoursToFirstSettlementToMarkdown\(scenario\)/);
  assert.match(app, /hours-to-first-settlement-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
});
