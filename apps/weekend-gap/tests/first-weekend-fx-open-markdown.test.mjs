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
  firstWeekendFxOpenGanttHour,
  firstWeekendFxOpenHourToMarkdown,
  firstWeekendFxClosedGanttHour,
  firstWeekendFxClosedHourToMarkdown,
  formatTime,
  lastClosedFxGanttHour,
  lastClosedFxHourToMarkdown,
  lastWeekendFxClosedGanttHour,
  lastWeekendFxClosedHourToMarkdown,
  lastWeekdayFxClosedGanttHour,
  lastWeekdayFxClosedHourToMarkdown,
  lastWeekendFxOpenGanttHour,
  lastWeekendFxOpenHourToMarkdown,
  lastWeekdayFxOpenGanttHour,
  lastWeekdayFxOpenHourToMarkdown
} from "../src/model.js";

test("first weekend-FX-open hour Markdown is one synthetic line distinct from last-weekend-FX-open copy", () => {
  const text = firstWeekendFxOpenHourToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, firstWeekendFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.equal(text.split("\n").length, 1);
  const hour = firstWeekendFxOpenGanttHour(DEFAULT_SCENARIO);
  const lastHour = lastWeekendFxOpenGanttHour(DEFAULT_SCENARIO);
  const firstWeekdayOpenHour = firstWeekdayFxOpenGanttHour(DEFAULT_SCENARIO);
  const lastWeekdayOpenHour = lastWeekdayFxOpenGanttHour(DEFAULT_SCENARIO);
  const firstWeekdayClosedHour = firstWeekdayFxClosedGanttHour(DEFAULT_SCENARIO);
  const lastWeekdayClosedHour = lastWeekdayFxClosedGanttHour(DEFAULT_SCENARIO);
  const weekendClosedHour = lastWeekendFxClosedGanttHour(DEFAULT_SCENARIO);
  const fxHour = lastClosedFxGanttHour(DEFAULT_SCENARIO);
  assert.equal(hour, null);
  assert.equal(lastHour, null);
  assert.equal(firstWeekdayOpenHour, 0);
  assert.equal(lastWeekdayOpenHour, 71);
  assert.equal(firstWeekdayClosedHour, null);
  assert.equal(lastWeekdayClosedHour, null);
  assert.equal(weekendClosedHour, 56);
  assert.equal(firstWeekendFxClosedGanttHour(DEFAULT_SCENARIO), 9);
  assert.equal(fxHour, 56);
  assert.equal(text, "First weekend-FX-open hour: none. Counts of modeled hours, not an FX calendar.");
  assert.match(text, /Counts of modeled hours/);
  assert.match(text, /not an FX calendar/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, lastWeekendFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstWeekdayFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstWeekdayFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastWeekdayFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastWeekdayFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastWeekendFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstWeekendFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  const early = PRESETS.sundayEarlyFxOpen;
  const openHour = firstWeekendFxOpenGanttHour(early);
  assert.equal(openHour, 41);
  assert.equal(formatTime(openHour), "Sun 08:00");
  assert.equal(lastWeekendFxOpenGanttHour(early), 42);
  assert.equal(formatTime(42), "Sun 09:00");
  const openText = firstWeekendFxOpenHourToMarkdown(early);
  assert.equal(openText, "First weekend-FX-open hour: Sun 08:00 (hour 41). Counts of modeled hours, not an FX calendar.");
  assert.notEqual(openText, lastWeekendFxOpenHourToMarkdown(early));
  assert.notEqual(openText, firstWeekdayFxClosedHourToMarkdown(early));
  assert.notEqual(openText, firstWeekdayFxOpenHourToMarkdown(early));
  assert.notEqual(openText, lastWeekdayFxOpenHourToMarkdown(early));
  assert.notEqual(openText, lastWeekendFxClosedHourToMarkdown(early));
  assert.notEqual(openText, firstWeekendFxClosedHourToMarkdown(early));
  assert.notEqual(openText, lastClosedFxHourToMarkdown(early));
  assert.notEqual(firstWeekendFxOpenGanttHour(early), lastWeekendFxOpenGanttHour(early));
  assert.notEqual(firstWeekendFxOpenGanttHour(early), firstWeekdayFxOpenGanttHour(early));
  assert.notEqual(firstWeekendFxOpenGanttHour(early), lastClosedFxGanttHour(early));
  const saturdayEarly = PRESETS.saturdayEarlyFxOpen;
  assert.equal(firstWeekendFxOpenGanttHour(saturdayEarly), 15);
  assert.equal(formatTime(15), "Sat 06:00");
  assert.equal(lastWeekendFxOpenGanttHour(saturdayEarly), 20);
  assert.notEqual(firstWeekendFxOpenHourToMarkdown(saturdayEarly), lastWeekendFxOpenHourToMarkdown(saturdayEarly));
  assert.notEqual(firstWeekendFxOpenHourToMarkdown(saturdayEarly), firstWeekendFxOpenHourToMarkdown(early));
  const saturdayLate = PRESETS.saturdayLateFxOpen;
  assert.equal(firstWeekendFxOpenGanttHour(saturdayLate), 25);
  assert.equal(formatTime(25), "Sat 16:00");
  assert.notEqual(firstWeekendFxOpenHourToMarkdown(saturdayLate), lastWeekendFxOpenHourToMarkdown(saturdayLate));
  assert.equal(firstWeekendFxOpenGanttHour(PRESETS.fridayLateFxOpen), null);
  assert.equal(firstWeekendFxOpenGanttHour(PRESETS.tuesdayEarlyFxOpen), null);
  assert.equal(firstWeekendFxOpenGanttHour(PRESETS.tuesdayLateFxOpen), null);
});

test("first weekend-FX-open hour Markdown uses none when no modeled hour is open", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const start = model.indexOf("export function firstWeekendFxOpenHourToMarkdown");
  const next = model.indexOf("export function ", start + 1);
  const body = model.slice(start, next === -1 ? undefined : next);
  assert.match(body, /hour === null/);
  assert.match(body, /First weekend-FX-open hour: none\. Counts of modeled hours, not an FX calendar\./);
  const finderStart = model.indexOf("export function firstWeekendFxOpenGanttHour");
  const finderNext = model.indexOf("export function ", finderStart + 1);
  const finder = model.slice(finderStart, finderNext === -1 ? undefined : finderNext);
  assert.match(finder, /\.find\(/);
  assert.doesNotMatch(finder, /findLast/);
  assert.doesNotMatch(finder, /links\.length\s*-\s*1/);
  const empty = "First weekend-FX-open hour: none. Counts of modeled hours, not an FX calendar.";
  assert.equal(empty.split("\n").length, 1);
  assert.doesNotMatch(empty, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(empty, firstWeekdayFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, firstWeekdayFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastWeekdayFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastWeekendFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastWeekdayFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastWeekendFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, firstWeekendFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.doesNotMatch(model, /Date\.now/);
});

test("copy first weekend-FX-open hour uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-first-weekend-fx-open"/);
  assert.match(html, /Copy first weekend-FX-open hour/);
  assert.match(html, /id="first-weekend-fx-open-copy-fallback"/);
  assert.match(html, /id="copy-first-weekend-fx-closed"/);
  assert.match(html, /id="copy-first-weekday-fx-closed"/);
  assert.match(html, /id="copy-first-weekday-fx-open"/);
  assert.match(html, /id="copy-last-weekday-fx-open"/);
  assert.match(html, /id="copy-last-weekend-fx-open"/);
  assert.match(html, /id="copy-last-weekday-fx-closed"/);
  assert.match(html, /id="copy-last-weekend-fx-closed"/);
  assert.match(html, /id="copy-last-closed-fx"/);
  assert.match(app, /firstWeekendFxOpenHourToMarkdown\(scenario\)/);
  assert.match(app, /first-weekend-fx-open-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /local drawing, not a live FX feed/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
  assert.notEqual(app.match(/function copyFirstWeekendFxOpenHourMarkdown/)?.[0], app.match(/function copyFirstWeekdayFxClosedHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyFirstWeekendFxOpenHourMarkdown/)?.[0], app.match(/function copyFirstWeekdayFxOpenHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyFirstWeekendFxOpenHourMarkdown/)?.[0], app.match(/function copyLastWeekendFxOpenHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyFirstWeekendFxOpenHourMarkdown/)?.[0], app.match(/function copyFirstWeekendFxClosedHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyFirstWeekendFxOpenHourMarkdown/)?.[0], app.match(/function copyLastWeekdayFxOpenHourMarkdown/)?.[0]);
});
