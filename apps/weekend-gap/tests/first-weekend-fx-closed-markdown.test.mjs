import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  PRESETS,
  firstClosedFxHourToMarkdown,
  firstWeekdayFxClosedGanttHour,
  firstWeekdayFxClosedHourToMarkdown,
  firstWeekdayFxOpenGanttHour,
  firstWeekdayFxOpenHourToMarkdown,
  firstWeekendFxClosedGanttHour,
  firstWeekendFxClosedHourToMarkdown,
  firstWeekendFxOpenGanttHour,
  firstWeekendFxOpenHourToMarkdown,
  formatTime,
  lastClosedFxGanttHour,
  lastClosedFxHourToMarkdown,
  lastWeekendFxClosedGanttHour,
  lastWeekendFxClosedHourToMarkdown,
  lastWeekdayFxClosedGanttHour,
  lastWeekdayFxClosedHourToMarkdown,
  lastWeekendFxOpenHourToMarkdown,
  lastWeekdayFxOpenGanttHour,
  lastWeekdayFxOpenHourToMarkdown
} from "../src/model.js";

test("first weekend-FX-closed hour Markdown is one synthetic line distinct from last-weekend-FX-closed copy", () => {
  const text = firstWeekendFxClosedHourToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, firstWeekendFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.equal(text.split("\n").length, 1);
  const hour = firstWeekendFxClosedGanttHour(DEFAULT_SCENARIO);
  const lastHour = lastWeekendFxClosedGanttHour(DEFAULT_SCENARIO);
  const firstOpenHour = firstWeekendFxOpenGanttHour(DEFAULT_SCENARIO);
  const firstWeekdayOpenHour = firstWeekdayFxOpenGanttHour(DEFAULT_SCENARIO);
  const lastWeekdayOpenHour = lastWeekdayFxOpenGanttHour(DEFAULT_SCENARIO);
  const firstWeekdayClosedHour = firstWeekdayFxClosedGanttHour(DEFAULT_SCENARIO);
  const lastWeekdayClosedHour = lastWeekdayFxClosedGanttHour(DEFAULT_SCENARIO);
  const fxHour = lastClosedFxGanttHour(DEFAULT_SCENARIO);
  assert.equal(hour, 9);
  assert.equal(lastHour, 56);
  assert.equal(firstOpenHour, null);
  assert.equal(firstWeekdayOpenHour, 0);
  assert.equal(lastWeekdayOpenHour, 71);
  assert.equal(firstWeekdayClosedHour, null);
  assert.equal(lastWeekdayClosedHour, null);
  assert.equal(fxHour, 56);
  assert.equal(formatTime(hour), "Sat 00:00");
  assert.equal(text, "First weekend-FX-closed hour: Sat 00:00 (hour 9). Counts of modeled hours, not an FX calendar.");
  assert.match(text, /Counts of modeled hours/);
  assert.match(text, /not an FX calendar/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, lastWeekendFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstWeekendFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstWeekdayFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstWeekdayFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastWeekdayFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastWeekdayFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastWeekendFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(firstWeekendFxClosedGanttHour(DEFAULT_SCENARIO), lastWeekendFxClosedGanttHour(DEFAULT_SCENARIO));
  assert.notEqual(firstWeekendFxClosedGanttHour(DEFAULT_SCENARIO), firstWeekendFxOpenGanttHour(DEFAULT_SCENARIO));
  const lateClose = { ...DEFAULT_SCENARIO, fridayFxLateClose: true };
  assert.equal(firstWeekendFxClosedGanttHour(lateClose), 10);
  assert.equal(formatTime(10), "Sat 01:00");
  assert.equal(lastWeekendFxClosedGanttHour(lateClose), 56);
  const lateText = firstWeekendFxClosedHourToMarkdown(lateClose);
  assert.equal(lateText, "First weekend-FX-closed hour: Sat 01:00 (hour 10). Counts of modeled hours, not an FX calendar.");
  assert.notEqual(lateText, lastWeekendFxClosedHourToMarkdown(lateClose));
  assert.notEqual(lateText, firstWeekendFxOpenHourToMarkdown(lateClose));
  assert.notEqual(lateText, firstWeekendFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  const early = PRESETS.sundayEarlyFxOpen;
  assert.equal(firstWeekendFxClosedGanttHour(early), 9);
  assert.equal(firstWeekendFxOpenGanttHour(early), 41);
  assert.notEqual(firstWeekendFxClosedHourToMarkdown(early), firstWeekendFxOpenHourToMarkdown(early));
  assert.notEqual(firstWeekendFxClosedHourToMarkdown(early), lastWeekendFxClosedHourToMarkdown(early));
  assert.equal(firstWeekendFxClosedGanttHour(PRESETS.wednesdayEarlyFxOpen), 9);
  assert.equal(firstWeekendFxClosedGanttHour(PRESETS.wednesdayLateFxOpen), 9);
  assert.equal(firstWeekendFxClosedGanttHour(PRESETS.thursdayEarlyFxOpen), 9);
  assert.equal(firstWeekendFxClosedGanttHour(PRESETS.thursdayLateFxOpen), 9);
  assert.equal(firstWeekendFxClosedGanttHour(PRESETS.fridayEarlyFxOpen), 9);
  assert.equal(firstWeekendFxClosedGanttHour(PRESETS.tuesdayLateFxOpen), 9);
  assert.equal(firstWeekendFxClosedGanttHour(PRESETS.tuesdayEarlyFxOpen), 9);
});

test("first weekend-FX-closed hour Markdown uses none when no modeled hour is closed", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const start = model.indexOf("export function firstWeekendFxClosedHourToMarkdown");
  const next = model.indexOf("export function ", start + 1);
  const body = model.slice(start, next === -1 ? undefined : next);
  assert.match(body, /hour === null/);
  assert.match(body, /First weekend-FX-closed hour: none\. Counts of modeled hours, not an FX calendar\./);
  const finderStart = model.indexOf("export function firstWeekendFxClosedGanttHour");
  const finderNext = model.indexOf("export function ", finderStart + 1);
  const finder = model.slice(finderStart, finderNext === -1 ? undefined : finderNext);
  assert.match(finder, /\.find\(/);
  assert.doesNotMatch(finder, /findLast/);
  assert.doesNotMatch(finder, /links\.length\s*-\s*1/);
  const empty = "First weekend-FX-closed hour: none. Counts of modeled hours, not an FX calendar.";
  assert.equal(empty.split("\n").length, 1);
  assert.doesNotMatch(empty, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(empty, firstWeekendFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, firstWeekdayFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, firstWeekdayFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastWeekdayFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastWeekendFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastWeekdayFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastWeekendFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.doesNotMatch(model, /Date\.now/);
});

test("copy first weekend-FX-closed hour uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-first-weekend-fx-closed"/);
  assert.match(html, /Copy first weekend-FX-closed hour/);
  assert.match(html, /id="first-weekend-fx-closed-copy-fallback"/);
  assert.match(html, /id="copy-first-weekend-fx-open"/);
  assert.match(html, /id="copy-first-weekday-fx-closed"/);
  assert.match(html, /id="copy-first-weekday-fx-open"/);
  assert.match(html, /id="copy-last-weekday-fx-open"/);
  assert.match(html, /id="copy-last-weekend-fx-open"/);
  assert.match(html, /id="copy-last-weekday-fx-closed"/);
  assert.match(html, /id="copy-last-weekend-fx-closed"/);
  assert.match(html, /id="copy-last-closed-fx"/);
  assert.match(app, /firstWeekendFxClosedHourToMarkdown\(scenario\)/);
  assert.match(app, /first-weekend-fx-closed-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /local drawing, not a live FX feed/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
  assert.notEqual(app.match(/function copyFirstWeekendFxClosedHourMarkdown/)?.[0], app.match(/function copyFirstWeekendFxOpenHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyFirstWeekendFxClosedHourMarkdown/)?.[0], app.match(/function copyFirstWeekdayFxClosedHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyFirstWeekendFxClosedHourMarkdown/)?.[0], app.match(/function copyLastWeekendFxClosedHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyFirstWeekendFxClosedHourMarkdown/)?.[0], app.match(/function copyLastClosedFxHourMarkdown/)?.[0]);
});
