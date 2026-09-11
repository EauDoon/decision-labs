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
  formatTime,
  lastClosedFxGanttHour,
  lastClosedFxHourToMarkdown,
  lastWeekendFxClosedGanttHour,
  lastWeekendFxClosedHourToMarkdown,
  lastWeekdayFxClosedGanttHour,
  lastWeekdayFxClosedHourToMarkdown,
  lastWeekdayFxOpenGanttHour,
  lastWeekdayFxOpenHourToMarkdown
} from "../src/model.js";

test("first weekday-FX-closed hour Markdown is one synthetic line distinct from last-weekday-FX-closed copy", () => {
  const text = firstWeekdayFxClosedHourToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, firstWeekdayFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.equal(text.split("\n").length, 1);
  const hour = firstWeekdayFxClosedGanttHour(DEFAULT_SCENARIO);
  const lastHour = lastWeekdayFxClosedGanttHour(DEFAULT_SCENARIO);
  const firstOpenHour = firstWeekdayFxOpenGanttHour(DEFAULT_SCENARIO);
  const lastOpenHour = lastWeekdayFxOpenGanttHour(DEFAULT_SCENARIO);
  const weekendClosedHour = lastWeekendFxClosedGanttHour(DEFAULT_SCENARIO);
  const fxHour = lastClosedFxGanttHour(DEFAULT_SCENARIO);
  assert.equal(hour, null);
  assert.equal(lastHour, null);
  assert.equal(firstOpenHour, 0);
  assert.equal(lastOpenHour, 71);
  assert.equal(weekendClosedHour, 56);
  assert.equal(fxHour, 56);
  assert.equal(text, "First weekday-FX-closed hour: none. Counts of modeled hours, not an FX calendar.");
  assert.match(text, /Counts of modeled hours/);
  assert.match(text, /not an FX calendar/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, lastWeekdayFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstWeekdayFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastWeekdayFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastWeekendFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  const holiday = { ...DEFAULT_SCENARIO, mondayHoliday: true };
  assert.equal(firstWeekdayFxClosedGanttHour(holiday), 57);
  assert.equal(formatTime(57), "Mon 00:00");
  assert.equal(lastWeekdayFxClosedGanttHour(holiday), 71);
  assert.equal(formatTime(71), "Mon 14:00");
  const holidayText = firstWeekdayFxClosedHourToMarkdown(holiday);
  assert.equal(holidayText, "First weekday-FX-closed hour: Mon 00:00 (hour 57). Counts of modeled hours, not an FX calendar.");
  assert.notEqual(holidayText, lastWeekdayFxClosedHourToMarkdown(holiday));
  assert.notEqual(holidayText, firstWeekdayFxOpenHourToMarkdown(holiday));
  assert.notEqual(firstWeekdayFxClosedGanttHour(holiday), lastWeekdayFxClosedGanttHour(holiday));
  assert.notEqual(firstWeekdayFxClosedGanttHour(holiday), firstWeekdayFxOpenGanttHour(holiday));
  const holidayEarly = { ...DEFAULT_SCENARIO, mondayHoliday: true, mondayEarlyFxOpen: true };
  assert.equal(firstWeekdayFxClosedGanttHour(holidayEarly), 57);
  assert.equal(firstWeekdayFxOpenGanttHour(holidayEarly), 0);
  const holidayLate = { ...DEFAULT_SCENARIO, mondayHoliday: true, mondayLateFxOpen: true };
  assert.equal(firstWeekdayFxClosedGanttHour(holidayLate), 57);
  assert.notEqual(firstWeekdayFxClosedHourToMarkdown(holidayLate), lastWeekdayFxClosedHourToMarkdown(holidayLate));
  const tuesday = PRESETS.tuesdayEarlyFxOpen;
  assert.equal(firstWeekdayFxClosedGanttHour(tuesday), null);
  assert.notEqual(firstWeekdayFxClosedHourToMarkdown(holiday), firstWeekdayFxOpenHourToMarkdown(holiday));
  assert.notEqual(firstWeekdayFxClosedHourToMarkdown(holiday), lastWeekendFxClosedHourToMarkdown(holiday));
});

test("first weekday-FX-closed hour Markdown uses none when no modeled hour is closed", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const start = model.indexOf("export function firstWeekdayFxClosedHourToMarkdown");
  const next = model.indexOf("export function ", start + 1);
  const body = model.slice(start, next === -1 ? undefined : next);
  assert.match(body, /hour === null/);
  assert.match(body, /First weekday-FX-closed hour: none\. Counts of modeled hours, not an FX calendar\./);
  const finderStart = model.indexOf("export function firstWeekdayFxClosedGanttHour");
  const finderNext = model.indexOf("export function ", finderStart + 1);
  const finder = model.slice(finderStart, finderNext === -1 ? undefined : finderNext);
  assert.match(finder, /\.find\(/);
  assert.doesNotMatch(finder, /findLast/);
  const empty = "First weekday-FX-closed hour: none. Counts of modeled hours, not an FX calendar.";
  assert.equal(empty.split("\n").length, 1);
  assert.doesNotMatch(empty, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(empty, firstWeekdayFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastWeekdayFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastWeekendFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.doesNotMatch(model, /Date\.now/);
});

test("copy first weekday-FX-closed hour uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-first-weekday-fx-closed"/);
  assert.match(html, /Copy first weekday-FX-closed hour/);
  assert.match(html, /id="first-weekday-fx-closed-copy-fallback"/);
  assert.match(html, /id="copy-first-weekday-fx-open"/);
  assert.match(html, /id="copy-last-weekday-fx-closed"/);
  assert.match(html, /id="copy-last-weekday-fx-open"/);
  assert.match(html, /id="copy-last-weekend-fx-closed"/);
  assert.match(app, /firstWeekdayFxClosedHourToMarkdown\(scenario\)/);
  assert.match(app, /first-weekday-fx-closed-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /local drawing, not a live FX feed/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
  assert.notEqual(app.match(/function copyFirstWeekdayFxClosedHourMarkdown/)?.[0], app.match(/function copyFirstWeekdayFxOpenHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyFirstWeekdayFxClosedHourMarkdown/)?.[0], app.match(/function copyLastWeekdayFxClosedHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyFirstWeekdayFxClosedHourMarkdown/)?.[0], app.match(/function copyLastWeekdayFxOpenHourMarkdown/)?.[0]);
});
