import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  PRESETS,
  firstClosedFxHourToMarkdown,
  firstWeekdayFxOpenGanttHour,
  firstWeekdayFxOpenHourToMarkdown,
  formatTime,
  lastClosedFxGanttHour,
  lastClosedFxHourToMarkdown,
  lastOpenFxGanttHour,
  lastWeekendFxClosedGanttHour,
  lastWeekendFxClosedHourToMarkdown,
  lastWeekdayFxClosedGanttHour,
  lastWeekdayFxClosedHourToMarkdown,
  lastWeekendFxOpenGanttHour,
  lastWeekendFxOpenHourToMarkdown,
  lastWeekdayFxOpenGanttHour,
  lastWeekdayFxOpenHourToMarkdown
} from "../src/model.js";

test("first weekday-FX-open hour Markdown is one synthetic line distinct from last-weekday-FX-open copy", () => {
  const text = firstWeekdayFxOpenHourToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, firstWeekdayFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.equal(text.split("\n").length, 1);
  const hour = firstWeekdayFxOpenGanttHour(DEFAULT_SCENARIO);
  const lastHour = lastWeekdayFxOpenGanttHour(DEFAULT_SCENARIO);
  const weekendOpenHour = lastWeekendFxOpenGanttHour(DEFAULT_SCENARIO);
  const weekdayClosedHour = lastWeekdayFxClosedGanttHour(DEFAULT_SCENARIO);
  const weekendClosedHour = lastWeekendFxClosedGanttHour(DEFAULT_SCENARIO);
  const fxHour = lastClosedFxGanttHour(DEFAULT_SCENARIO);
  assert.equal(hour, 0);
  assert.equal(formatTime(hour), "Fri 15:00");
  assert.equal(lastHour, 71);
  assert.equal(formatTime(lastHour), "Mon 14:00");
  assert.equal(weekendOpenHour, null);
  assert.equal(weekdayClosedHour, null);
  assert.equal(weekendClosedHour, 56);
  assert.equal(fxHour, 56);
  assert.equal(text, "First weekday-FX-open hour: Fri 15:00 (hour 0). Counts of modeled hours, not an FX calendar.");
  assert.match(text, /Counts of modeled hours/);
  assert.match(text, /not an FX calendar/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, lastWeekdayFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastWeekendFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastWeekdayFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastWeekendFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  const holiday = { ...DEFAULT_SCENARIO, mondayHoliday: true };
  assert.equal(firstWeekdayFxOpenGanttHour(holiday), 0);
  assert.equal(lastWeekdayFxOpenGanttHour(holiday), 8);
  assert.equal(formatTime(8), "Fri 23:00");
  const holidayEarly = { ...DEFAULT_SCENARIO, mondayHoliday: true, mondayEarlyFxOpen: true };
  assert.equal(firstWeekdayFxOpenGanttHour(holidayEarly), 0);
  assert.equal(lastWeekdayFxOpenGanttHour(holidayEarly), 66);
  const holidayLate = { ...DEFAULT_SCENARIO, mondayHoliday: true, mondayLateFxOpen: true };
  assert.equal(firstWeekdayFxOpenGanttHour(holidayLate), 0);
  assert.notEqual(firstWeekdayFxOpenHourToMarkdown(holidayLate), lastWeekdayFxOpenHourToMarkdown(holidayLate));
  const sundayAndHoliday = { ...DEFAULT_SCENARIO, mondayHoliday: true, sundayEarlyFxOpen: true };
  assert.equal(lastWeekendFxOpenGanttHour(sundayAndHoliday), 42);
  assert.equal(firstWeekdayFxOpenGanttHour(sundayAndHoliday), 0);
  assert.equal(lastWeekdayFxOpenGanttHour(sundayAndHoliday), 8);
  assert.equal(lastOpenFxGanttHour(sundayAndHoliday), 42);
  assert.notEqual(firstWeekdayFxOpenGanttHour(sundayAndHoliday), lastWeekdayFxOpenGanttHour(sundayAndHoliday));
  assert.notEqual(firstWeekdayFxOpenGanttHour(sundayAndHoliday), lastWeekendFxOpenGanttHour(sundayAndHoliday));
  const early = PRESETS.mondayEarlyFxOpen;
  assert.equal(firstWeekdayFxOpenGanttHour(early), 0);
  assert.equal(lastWeekdayFxOpenGanttHour(early), 71);
  assert.notEqual(firstWeekdayFxOpenHourToMarkdown(early), lastWeekdayFxOpenHourToMarkdown(early));
  assert.notEqual(firstWeekdayFxOpenHourToMarkdown(early), lastWeekendFxOpenHourToMarkdown(PRESETS.sundayEarlyFxOpen));
  const late = PRESETS.mondayLateFxOpen;
  assert.equal(firstWeekdayFxOpenGanttHour(late), 0);
  assert.notEqual(firstWeekdayFxOpenHourToMarkdown(late), lastWeekdayFxOpenHourToMarkdown(late));
});

test("first weekday-FX-open hour Markdown uses none when no modeled hour is open", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const start = model.indexOf("export function firstWeekdayFxOpenHourToMarkdown");
  const next = model.indexOf("export function ", start + 1);
  const body = model.slice(start, next === -1 ? undefined : next);
  assert.match(body, /hour === null/);
  assert.match(body, /First weekday-FX-open hour: none\. Counts of modeled hours, not an FX calendar\./);
  const finderStart = model.indexOf("export function firstWeekdayFxOpenGanttHour");
  const finderNext = model.indexOf("export function ", finderStart + 1);
  const finder = model.slice(finderStart, finderNext === -1 ? undefined : finderNext);
  assert.match(finder, /\.find\(/);
  assert.doesNotMatch(finder, /findLast/);
  const empty = "First weekday-FX-open hour: none. Counts of modeled hours, not an FX calendar.";
  assert.equal(empty.split("\n").length, 1);
  assert.doesNotMatch(empty, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(empty, lastWeekdayFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastWeekendFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastWeekdayFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastWeekendFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.doesNotMatch(model, /Date\.now/);
});

test("copy first weekday-FX-open hour uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-first-weekday-fx-open"/);
  assert.match(html, /Copy first weekday-FX-open hour/);
  assert.match(html, /id="first-weekday-fx-open-copy-fallback"/);
  assert.match(html, /id="copy-last-weekday-fx-open"/);
  assert.match(html, /id="copy-last-weekend-fx-open"/);
  assert.match(html, /id="copy-last-weekday-fx-closed"/);
  assert.match(app, /firstWeekdayFxOpenHourToMarkdown\(scenario\)/);
  assert.match(app, /first-weekday-fx-open-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /local drawing, not a live FX feed/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
  assert.notEqual(app.match(/function copyFirstWeekdayFxOpenHourMarkdown/)?.[0], app.match(/function copyLastWeekdayFxOpenHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyFirstWeekdayFxOpenHourMarkdown/)?.[0], app.match(/function copyLastWeekendFxOpenHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyFirstWeekdayFxOpenHourMarkdown/)?.[0], app.match(/function copyLastWeekdayFxClosedHourMarkdown/)?.[0]);
});
