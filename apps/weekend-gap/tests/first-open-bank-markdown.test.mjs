import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  firstClosedBankHourToMarkdown,
  firstClosedFxHourToMarkdown,
  firstOpenBankGanttHour,
  firstOpenBankHourToMarkdown,
  firstOpenFxGanttHour,
  firstOpenFxHourToMarkdown,
  formatTime
} from "../src/model.js";

test("first open bank hour Markdown is one synthetic line with an honest empty", () => {
  const text = firstOpenBankHourToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, firstOpenBankHourToMarkdown(DEFAULT_SCENARIO));
  assert.equal(text.split("\n").length, 1);
  const hour = firstOpenBankGanttHour(DEFAULT_SCENARIO);
  assert.equal(hour, 0);
  assert.equal(formatTime(hour), "Fri 15:00");
  assert.equal(text, "First open bank hour: Fri 15:00 (hour 0). Counts of modeled hours, not a bank calendar.");
  assert.match(text, /Counts of modeled hours/);
  assert.match(text, /not a bank calendar/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, firstOpenFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstClosedBankHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  const laterBank = {
    ...DEFAULT_SCENARIO,
    bankOpenStartHour: 16
  };
  const bankHour = firstOpenBankGanttHour(laterBank);
  assert.equal(bankHour, 1);
  assert.equal(formatTime(bankHour), "Fri 16:00");
  const bankText = firstOpenBankHourToMarkdown(laterBank);
  assert.equal(bankText, "First open bank hour: Fri 16:00 (hour 1). Counts of modeled hours, not a bank calendar.");
  assert.equal(firstOpenFxGanttHour(laterBank), 0);
  assert.notEqual(bankText, firstOpenFxHourToMarkdown(laterBank));
});

test("first open bank hour Markdown uses none when no modeled hour is open", async () => {
  const neverOpen = {
    ...DEFAULT_SCENARIO,
    bankOpenStartHour: 0,
    bankOpenEndHour: 1,
    mondayHoliday: true
  };
  const empty = firstOpenBankHourToMarkdown(neverOpen);
  assert.equal(firstOpenBankGanttHour(neverOpen), null);
  assert.equal(empty, "First open bank hour: none. Counts of modeled hours, not a bank calendar.");
  assert.equal(empty.split("\n").length, 1);
  assert.doesNotMatch(empty, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(empty, firstOpenFxHourToMarkdown(DEFAULT_SCENARIO));
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const start = model.indexOf("export function firstOpenBankHourToMarkdown");
  const next = model.indexOf("export function ", start + 1);
  const body = model.slice(start, next);
  assert.match(body, /hour === null/);
  assert.match(body, /First open bank hour: none\. Counts of modeled hours, not a bank calendar\./);
});

test("copy first open bank hour uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-first-open-bank"/);
  assert.match(html, /Copy first open bank hour/);
  assert.match(html, /id="first-open-bank-copy-fallback"/);
  assert.match(html, /id="copy-first-open-fx"/);
  assert.match(html, /id="copy-first-closed-bank"/);
  assert.match(app, /firstOpenBankHourToMarkdown\(scenario\)/);
  assert.match(app, /first-open-bank-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /local drawing, not a live bank feed/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
  assert.notEqual(app.match(/function copyFirstOpenBankHourMarkdown/)?.[0], app.match(/function copyFirstOpenFxHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyFirstOpenBankHourMarkdown/)?.[0], app.match(/function copyFirstClosedBankHourMarkdown/)?.[0]);
});
