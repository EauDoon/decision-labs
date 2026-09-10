import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  PRESETS,
  dashboardToMarkdown,
  hoursToClearQueueToMarkdown,
  runSimulation
} from "../src/model.js";

test("hours-to-clear Markdown is one synthetic line and not a live feed", () => {
  const text = hoursToClearQueueToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, hoursToClearQueueToMarkdown(DEFAULT_SCENARIO));
  assert.equal(text.split("\n").length, 1);
  const result = runSimulation(DEFAULT_SCENARIO);
  assert.match(text, new RegExp("^Hours to clear queue: " + result.summary.hoursToClearQueue + " hours\\. "));
  assert.match(text, /Synthetic educational snapshot/);
  assert.match(text, /not live market data/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, dashboardToMarkdown(DEFAULT_SCENARIO));
});

test("hours-to-clear Markdown uses residual-queue and no-queue wording", () => {
  const leftover = hoursToClearQueueToMarkdown(PRESETS.marketStress);
  assert.equal(leftover.split("\n").length, 1);
  assert.match(leftover, /queue remains/);
  const empty = hoursToClearQueueToMarkdown({ ...DEFAULT_SCENARIO, redemptionDemandAud: 0 });
  assert.match(empty, /No queue in 72h/);
});

test("copy hours to clear uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-hours-to-clear"/);
  assert.match(html, /Copy hours to clear/);
  assert.match(html, /id="hours-to-clear-copy-fallback"/);
  assert.match(app, /hoursToClearQueueToMarkdown\(scenario\)/);
  assert.match(app, /hours-to-clear-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
});
