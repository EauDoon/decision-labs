import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  PRESETS,
  hoursToClearQueueToMarkdown
} from "../src/model.js";

test("hours-to-clear copy stays a dedicated button with clipboard fallback and honest empty", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-hours-to-clear"/);
  assert.match(html, /Copy hours to clear/);
  assert.match(html, /id="hours-to-clear-copy-fallback"/);
  assert.match(app, /function copyHoursToClearMarkdown/);
  assert.match(app, /hoursToClearQueueToMarkdown\(scenario\)/);
  assert.match(app, /#copy-hours-to-clear/);
  assert.match(app, /hours-to-clear-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
  const empty = hoursToClearQueueToMarkdown({ ...DEFAULT_SCENARIO, redemptionDemandAud: 0 });
  assert.equal(empty.split("\n").length, 1);
  assert.match(empty, /No queue in 72h/);
  assert.notEqual(empty.trim(), "");
  assert.doesNotMatch(empty, /Hours to clear queue: \./);
  const leftover = hoursToClearQueueToMarkdown(PRESETS.marketStress);
  assert.match(leftover, /queue remains/);
  assert.notEqual(leftover, empty);
});
