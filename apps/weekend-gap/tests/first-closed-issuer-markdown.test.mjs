import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  firstClosedBankHourToMarkdown,
  firstClosedFxHourToMarkdown,
  firstClosedIssuerGanttHour,
  firstClosedIssuerHourToMarkdown,
  formatTime
} from "../src/model.js";

test("first closed issuer hour Markdown is one synthetic line with an honest empty", () => {
  const text = firstClosedIssuerHourToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, firstClosedIssuerHourToMarkdown(DEFAULT_SCENARIO));
  assert.equal(text.split("\n").length, 1);
  const hour = firstClosedIssuerGanttHour(DEFAULT_SCENARIO);
  assert.equal(hour, 2);
  assert.equal(formatTime(hour), "Fri 17:00");
  assert.equal(text, "First closed issuer hour: Fri 17:00 (hour 2). Counts of modeled hours, not a bank calendar.");
  assert.match(text, /Counts of modeled hours/);
  assert.match(text, /not a bank calendar/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, firstClosedFxHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstClosedBankHourToMarkdown(DEFAULT_SCENARIO));
  const earlierIssuer = {
    ...DEFAULT_SCENARIO,
    issuerOpenEndHour: 16
  };
  const issuerHour = firstClosedIssuerGanttHour(earlierIssuer);
  assert.equal(issuerHour, 1);
  assert.equal(formatTime(issuerHour), "Fri 16:00");
  const issuerText = firstClosedIssuerHourToMarkdown(earlierIssuer);
  assert.equal(issuerText, "First closed issuer hour: Fri 16:00 (hour 1). Counts of modeled hours, not a bank calendar.");
  assert.notEqual(issuerText, firstClosedBankHourToMarkdown(earlierIssuer));
  assert.notEqual(issuerText, firstClosedFxHourToMarkdown(earlierIssuer));
});

test("first closed issuer hour Markdown uses none when no modeled hour is closed", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const start = model.indexOf("export function firstClosedIssuerHourToMarkdown");
  const next = model.indexOf("export function ", start + 1);
  const body = model.slice(start, next);
  assert.match(body, /hour === null/);
  assert.match(body, /First closed issuer hour: none\. Counts of modeled hours, not a bank calendar\./);
  const empty = "First closed issuer hour: none. Counts of modeled hours, not a bank calendar.";
  assert.equal(empty.split("\n").length, 1);
  assert.doesNotMatch(empty, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(empty, firstClosedBankHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, firstClosedFxHourToMarkdown(DEFAULT_SCENARIO));
});

test("copy first closed issuer hour uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-first-closed-issuer"/);
  assert.match(html, /Copy first closed issuer hour/);
  assert.match(html, /id="first-closed-issuer-copy-fallback"/);
  assert.match(html, /id="copy-first-closed-fx"/);
  assert.match(html, /id="copy-first-closed-bank"/);
  assert.match(app, /firstClosedIssuerHourToMarkdown\(scenario\)/);
  assert.match(app, /first-closed-issuer-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /synthetic label, not live issuer data/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
  assert.notEqual(app.match(/function copyFirstClosedIssuerHourMarkdown/)?.[0], app.match(/function copyFirstClosedBankHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyFirstClosedIssuerHourMarkdown/)?.[0], app.match(/function copyFirstClosedFxHourMarkdown/)?.[0]);
});
