import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  peakQueueHourToMarkdown,
  runSimulation,
  selectedGanttHourToMarkdown,
  selectedVersusPeakHourToMarkdown
} from "../src/model.js";

test("selected versus peak-queue Markdown is two lines and is not a forecast", () => {
  const text = selectedVersusPeakHourToMarkdown(DEFAULT_SCENARIO, 0);
  assert.equal(text, selectedVersusPeakHourToMarkdown(DEFAULT_SCENARIO, 0));
  assert.equal(text.split("\n").length, 2);
  const result = runSimulation(DEFAULT_SCENARIO);
  assert.match(text, /^Selected Gantt hour: Fri 15:00 \(hour 0\)\.\n/);
  assert.match(text, new RegExp("Peak-queue hour: Mon 08:00 \\(hour " + result.summary.peakQueueHour + "\\)\\. Not a forecast\\.$"));
  assert.match(text, /Not a forecast/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, selectedGanttHourToMarkdown(DEFAULT_SCENARIO, 0));
  assert.notEqual(text, peakQueueHourToMarkdown(DEFAULT_SCENARIO));
});

test("selected versus peak-queue Markdown follows the selected hour and reports none when empty", () => {
  const saturday = selectedVersusPeakHourToMarkdown(DEFAULT_SCENARIO, 21);
  assert.equal(saturday.split("\n").length, 2);
  assert.match(saturday, /Selected Gantt hour: Sat 12:00 \(hour 21\)\./);
  const empty = selectedVersusPeakHourToMarkdown({ ...DEFAULT_SCENARIO, redemptionDemandAud: 0 }, 0);
  assert.equal(empty.split("\n").length, 2);
  assert.match(empty, /Peak-queue hour: none\. Not a forecast\./);
});

test("copy selected versus peak-queue hour uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-selected-versus-peak"/);
  assert.match(html, /Copy selected versus peak hour/);
  assert.match(html, /id="selected-versus-peak-copy-fallback"/);
  assert.match(app, /selectedVersusPeakHourToMarkdown\(scenario, selectedHour\)/);
  assert.match(app, /selected-versus-peak-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
});
