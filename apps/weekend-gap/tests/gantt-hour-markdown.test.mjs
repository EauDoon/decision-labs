import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { DEFAULT_SCENARIO, selectedGanttHourToMarkdown } from "../src/model.js";

test("selected Gantt hour Markdown lists issuer, bank, payout and FX with a synthetic notice", () => {
  const text = selectedGanttHourToMarkdown(DEFAULT_SCENARIO, 0);
  assert.equal(text, selectedGanttHourToMarkdown(DEFAULT_SCENARIO, 0));
  assert.match(text, /Synthetic educational calendar/);
  assert.match(text, /Not a live bank or payout queue/);
  assert.match(text, /Hour: Fri 15:00 \(hour 0\)/);
  assert.match(text, /\| Issuer \| Open \|/);
  assert.match(text, /\| Bank \| Open \|/);
  assert.match(text, /\| Payout \| Open \|/);
  assert.match(text, /\| FX \| Weekday depth \|/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
});

test("selected Gantt hour Markdown reports closed weekend gates", () => {
  const text = selectedGanttHourToMarkdown(DEFAULT_SCENARIO, 21);
  assert.match(text, /Hour: Sat 12:00 \(hour 21\)/);
  assert.match(text, /\| Issuer \| Closed \|/);
  assert.match(text, /\| Bank \| Closed \|/);
  assert.match(text, /\| Payout \| Closed \|/);
  assert.match(text, /\| FX \| Weekend thinned \|/);
});

test("copy selected Gantt hour uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-gantt-hour"/);
  assert.match(html, /Copy selected hour/);
  assert.match(html, /id="gantt-hour-copy-fallback"/);
  assert.match(app, /selectedGanttHourToMarkdown\(scenario, selectedHour\)/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /gantt-hour-copy-fallback/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
});
