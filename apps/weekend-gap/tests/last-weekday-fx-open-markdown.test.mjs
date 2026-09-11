import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  PRESETS,
  firstClosedFxHourToMarkdown,
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

test("last weekday-FX-open hour Markdown is one synthetic line distinct from weekend-FX-open copy", () => {
  const text = lastWeekdayFxOpenHourToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, lastWeekdayFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.equal(text.split("\n").length, 1);
  const hour = lastWeekdayFxOpenGanttHour(DEFAULT_SCENARIO);
  const weekendOpenHour = lastWeekendFxOpenGanttHour(DEFAULT_SCENARIO);
  const weekdayClosedHour = lastWeekdayFxClosedGanttHour(DEFAULT_SCENARIO);
  const weekendClosedHour = lastWeekendFxClosedGanttHour(DEFAULT_SCENARIO);
  const fxHour = lastClosedFxGanttHour(DEFAULT_SCENARIO);
  assert.equal(hour, 71);
  assert.equal(formatTime(hour), "Mon 14:00");
  assert.equal(weekendOpenHour, null);
  assert.equal(weekdayClosedHour, null);
  assert.equal(weekendClosedHour, 56);
  assert.equal(fxHour, 56);
  assert.equal(text, "Last weekday-FX-open hour: Mon 14:00 (hour 71). Counts of modeled hours, not an FX calendar.");
  assert.match(text, /Counts of modeled hours/);
  assert.match(text, /not an FX calendar/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, lastWeekendFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastWeekdayFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastWeekendFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  const holiday = { ...DEFAULT_SCENARIO, mondayHoliday: true };
  assert.equal(lastWeekdayFxOpenGanttHour(holiday), 8);
  assert.equal(formatTime(8), "Fri 23:00");
  const holidayEarly = { ...DEFAULT_SCENARIO, mondayHoliday: true, mondayEarlyFxOpen: true };
  const holidayEarlyHour = lastWeekdayFxOpenGanttHour(holidayEarly);
  assert.equal(holidayEarlyHour, 66);
  assert.equal(formatTime(holidayEarlyHour), "Mon 09:00");
  const holidayEarlyText = lastWeekdayFxOpenHourToMarkdown(holidayEarly);
  assert.equal(holidayEarlyText, "Last weekday-FX-open hour: Mon 09:00 (hour 66). Counts of modeled hours, not an FX calendar.");
  assert.notEqual(holidayEarlyText, lastWeekendFxOpenHourToMarkdown(holidayEarly));
  assert.notEqual(holidayEarlyText, lastWeekdayFxClosedHourToMarkdown(holidayEarly));
  assert.notEqual(lastWeekdayFxOpenGanttHour(holidayEarly), lastWeekendFxOpenGanttHour(holidayEarly));
  assert.notEqual(lastWeekdayFxOpenGanttHour(holidayEarly), lastWeekdayFxClosedGanttHour(holidayEarly));
  const sundayAndHoliday = { ...DEFAULT_SCENARIO, mondayHoliday: true, sundayEarlyFxOpen: true };
  assert.equal(lastWeekendFxOpenGanttHour(sundayAndHoliday), 42);
  assert.equal(lastWeekdayFxOpenGanttHour(sundayAndHoliday), 8);
  assert.equal(lastOpenFxGanttHour(sundayAndHoliday), 42);
  assert.notEqual(lastWeekdayFxOpenGanttHour(sundayAndHoliday), lastWeekendFxOpenGanttHour(sundayAndHoliday));
  assert.notEqual(lastWeekdayFxOpenGanttHour(sundayAndHoliday), lastOpenFxGanttHour(sundayAndHoliday));
  const early = PRESETS.mondayEarlyFxOpen;
  assert.equal(lastWeekdayFxOpenGanttHour(early), 71);
  assert.notEqual(lastWeekdayFxOpenHourToMarkdown(early), lastWeekendFxOpenHourToMarkdown(PRESETS.sundayEarlyFxOpen));
});

test("last weekday-FX-open hour Markdown uses none when no modeled hour is open", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const start = model.indexOf("export function lastWeekdayFxOpenHourToMarkdown");
  const next = model.indexOf("export function ", start + 1);
  const body = model.slice(start, next === -1 ? undefined : next);
  assert.match(body, /hour === null/);
  assert.match(body, /Last weekday-FX-open hour: none\. Counts of modeled hours, not an FX calendar\./);
  const empty = "Last weekday-FX-open hour: none. Counts of modeled hours, not an FX calendar.";
  assert.equal(empty.split("\n").length, 1);
  assert.doesNotMatch(empty, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(empty, lastWeekendFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastWeekdayFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastWeekendFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.doesNotMatch(model, /Date\.now/);
});

test("copy last weekday-FX-open hour uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-weekday-fx-open"/);
  assert.match(html, /Copy last weekday-FX-open hour/);
  assert.match(html, /id="last-weekday-fx-open-copy-fallback"/);
  assert.match(html, /id="copy-last-weekend-fx-open"/);
  assert.match(html, /id="copy-last-weekday-fx-closed"/);
  assert.match(html, /id="copy-last-weekend-fx-closed"/);
  assert.match(app, /lastWeekdayFxOpenHourToMarkdown\(scenario\)/);
  assert.match(app, /last-weekday-fx-open-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /local drawing, not a live FX feed/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
  assert.notEqual(app.match(/function copyLastWeekdayFxOpenHourMarkdown/)?.[0], app.match(/function copyLastWeekendFxOpenHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastWeekdayFxOpenHourMarkdown/)?.[0], app.match(/function copyLastWeekdayFxClosedHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastWeekdayFxOpenHourMarkdown/)?.[0], app.match(/function copyLastWeekendFxClosedHourMarkdown/)?.[0]);
});
