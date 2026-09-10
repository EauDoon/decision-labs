import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  hoursToClearQueueToMarkdown,
  remainingReserveAtHourToMarkdown,
  runSimulation,
  selectedGanttHourToMarkdown
} from "../src/model.js";

test("remaining reserve Markdown is one synthetic line at the selected hour", () => {
  const text = remainingReserveAtHourToMarkdown(DEFAULT_SCENARIO, 0);
  assert.equal(text, remainingReserveAtHourToMarkdown(DEFAULT_SCENARIO, 0));
  assert.equal(text.split("\n").length, 1);
  const point = runSimulation(DEFAULT_SCENARIO).timeline[0];
  assert.match(text, new RegExp("^Remaining reserve: " + point.reserveRemainingAud + " AUD\\. Queued AUD: " + point.queuedAud + "\\. Hour: Fri 15:00 \\(hour 0\\)\\. "));
  assert.match(text, /Synthetic educational snapshot/);
  assert.match(text, /not live market data/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, hoursToClearQueueToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, selectedGanttHourToMarkdown(DEFAULT_SCENARIO, 0));
});

test("remaining reserve Markdown follows the selected Gantt hour", () => {
  const saturday = remainingReserveAtHourToMarkdown(DEFAULT_SCENARIO, 21);
  const point = runSimulation(DEFAULT_SCENARIO).timeline[21];
  assert.equal(saturday.split("\n").length, 1);
  assert.match(saturday, /Hour: Sat 12:00 \(hour 21\)/);
  assert.match(saturday, new RegExp("Remaining reserve: " + point.reserveRemainingAud + " AUD"));
  assert.match(saturday, new RegExp("Queued AUD: " + point.queuedAud));
  assert.ok(point.queuedAud > 0);
  assert.notEqual(saturday, remainingReserveAtHourToMarkdown(DEFAULT_SCENARIO, 0));
});

test("copy remaining reserve uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-remaining-reserve"/);
  assert.match(html, /Copy remaining reserve/);
  assert.match(html, /id="remaining-reserve-copy-fallback"/);
  assert.match(app, /remainingReserveAtHourToMarkdown\(scenario, selectedHour\)/);
  assert.match(app, /remaining-reserve-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
});
