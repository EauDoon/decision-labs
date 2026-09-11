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
  lastWeekendFxClosedGanttHour,
  lastWeekendFxClosedHourToMarkdown,
  lastWeekdayFxClosedGanttHour,
  lastWeekdayFxClosedHourToMarkdown,
  lastWeekendFxOpenGanttHour,
  lastWeekendFxOpenHourToMarkdown
} from "../src/model.js";

test("last weekend-FX-open hour Markdown is one synthetic line with an honest empty", () => {
  const text = lastWeekendFxOpenHourToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, lastWeekendFxOpenHourToMarkdown(DEFAULT_SCENARIO));
  assert.equal(text.split("\n").length, 1);
  const hour = lastWeekendFxOpenGanttHour(DEFAULT_SCENARIO);
  const weekendClosedHour = lastWeekendFxClosedGanttHour(DEFAULT_SCENARIO);
  const weekdayClosedHour = lastWeekdayFxClosedGanttHour(DEFAULT_SCENARIO);
  const fxHour = lastClosedFxGanttHour(DEFAULT_SCENARIO);
  assert.equal(hour, null);
  assert.equal(weekendClosedHour, 56);
  assert.equal(weekdayClosedHour, null);
  assert.equal(fxHour, 56);
  assert.equal(text, "Last weekend-FX-open hour: none. Counts of modeled hours, not an FX calendar.");
  assert.match(text, /Counts of modeled hours/);
  assert.match(text, /not an FX calendar/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, lastWeekendFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastWeekdayFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  const early = PRESETS.sundayEarlyFxOpen;
  const openHour = lastWeekendFxOpenGanttHour(early);
  assert.equal(openHour, 42);
  assert.equal(formatTime(openHour), "Sun 09:00");
  const openText = lastWeekendFxOpenHourToMarkdown(early);
  assert.equal(openText, "Last weekend-FX-open hour: Sun 09:00 (hour 42). Counts of modeled hours, not an FX calendar.");
  assert.notEqual(openText, lastWeekendFxClosedHourToMarkdown(early));
  assert.notEqual(openText, lastWeekdayFxClosedHourToMarkdown(early));
  assert.notEqual(openText, lastClosedFxHourToMarkdown(early));
  assert.notEqual(lastWeekendFxOpenGanttHour(early), lastWeekendFxClosedGanttHour(early));
  assert.notEqual(lastWeekendFxOpenGanttHour(early), lastClosedFxGanttHour(early));
  const saturdayEarly = PRESETS.saturdayEarlyFxOpen;
  assert.equal(lastWeekendFxOpenGanttHour(saturdayEarly), 20);
  assert.equal(formatTime(20), "Sat 11:00");
  assert.notEqual(lastWeekendFxOpenHourToMarkdown(saturdayEarly), lastWeekendFxOpenHourToMarkdown(early));
});

test("last weekend-FX-open hour Markdown uses none when no modeled hour is open", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const start = model.indexOf("export function lastWeekendFxOpenHourToMarkdown");
  const next = model.indexOf("export function ", start + 1);
  const body = model.slice(start, next === -1 ? undefined : next);
  assert.match(body, /hour === null/);
  assert.match(body, /Last weekend-FX-open hour: none\. Counts of modeled hours, not an FX calendar\./);
  const empty = "Last weekend-FX-open hour: none. Counts of modeled hours, not an FX calendar.";
  assert.equal(empty.split("\n").length, 1);
  assert.doesNotMatch(empty, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(empty, lastWeekendFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastWeekdayFxClosedHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, firstClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.doesNotMatch(model, /Date\.now/);
});

test("copy last weekend-FX-open hour uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-weekend-fx-open"/);
  assert.match(html, /Copy last weekend-FX-open hour/);
  assert.match(html, /id="last-weekend-fx-open-copy-fallback"/);
  assert.match(html, /id="copy-last-weekday-fx-closed"/);
  assert.match(html, /id="copy-last-weekend-fx-closed"/);
  assert.match(html, /id="copy-last-closed-fx"/);
  assert.match(app, /lastWeekendFxOpenHourToMarkdown\(scenario\)/);
  assert.match(app, /last-weekend-fx-open-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /local drawing, not a live FX feed/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
  assert.notEqual(app.match(/function copyLastWeekendFxOpenHourMarkdown/)?.[0], app.match(/function copyLastWeekdayFxClosedHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastWeekendFxOpenHourMarkdown/)?.[0], app.match(/function copyLastWeekendFxClosedHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastWeekendFxOpenHourMarkdown/)?.[0], app.match(/function copyLastClosedFxHourMarkdown/)?.[0]);
});
