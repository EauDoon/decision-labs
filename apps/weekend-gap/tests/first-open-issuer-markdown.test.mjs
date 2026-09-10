import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  firstClosedIssuerHourToMarkdown,
  firstOpenBankGanttHour,
  firstOpenBankHourToMarkdown,
  firstOpenIssuerGanttHour,
  firstOpenIssuerHourToMarkdown,
  formatTime
} from "../src/model.js";

test("first open issuer hour Markdown is one synthetic line with an honest empty", () => {
  const text = firstOpenIssuerHourToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, firstOpenIssuerHourToMarkdown(DEFAULT_SCENARIO));
  assert.equal(text.split("\n").length, 1);
  const hour = firstOpenIssuerGanttHour(DEFAULT_SCENARIO);
  assert.equal(hour, 0);
  assert.equal(formatTime(hour), "Fri 15:00");
  assert.equal(text, "First open issuer hour: Fri 15:00 (hour 0). Counts of modeled hours, not a bank calendar.");
  assert.match(text, /Counts of modeled hours/);
  assert.match(text, /not a bank calendar/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, firstOpenBankHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstClosedIssuerHourToMarkdown(DEFAULT_SCENARIO));
  const laterIssuer = {
    ...DEFAULT_SCENARIO,
    issuerOpenStartHour: 16
  };
  const issuerHour = firstOpenIssuerGanttHour(laterIssuer);
  assert.equal(issuerHour, 1);
  assert.equal(formatTime(issuerHour), "Fri 16:00");
  const issuerText = firstOpenIssuerHourToMarkdown(laterIssuer);
  assert.equal(issuerText, "First open issuer hour: Fri 16:00 (hour 1). Counts of modeled hours, not a bank calendar.");
  assert.equal(firstOpenBankGanttHour(laterIssuer), 0);
  assert.notEqual(issuerText, firstOpenBankHourToMarkdown(laterIssuer));
});

test("first open issuer hour Markdown uses none when no modeled hour is open", async () => {
  const neverOpen = {
    ...DEFAULT_SCENARIO,
    issuerOpenStartHour: 0,
    issuerOpenEndHour: 1,
    mondayHoliday: true
  };
  const empty = firstOpenIssuerHourToMarkdown(neverOpen);
  assert.equal(firstOpenIssuerGanttHour(neverOpen), null);
  assert.equal(empty, "First open issuer hour: none. Counts of modeled hours, not a bank calendar.");
  assert.equal(empty.split("\n").length, 1);
  assert.doesNotMatch(empty, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(empty, firstOpenBankHourToMarkdown(DEFAULT_SCENARIO));
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const start = model.indexOf("export function firstOpenIssuerHourToMarkdown");
  const next = model.indexOf("export function ", start + 1);
  const body = model.slice(start, next === -1 ? undefined : next);
  assert.match(body, /hour === null/);
  assert.match(body, /First open issuer hour: none\. Counts of modeled hours, not a bank calendar\./);
});

test("copy first open issuer hour uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-first-open-issuer"/);
  assert.match(html, /Copy first open issuer hour/);
  assert.match(html, /id="first-open-issuer-copy-fallback"/);
  assert.match(html, /id="copy-first-open-bank"/);
  assert.match(html, /id="copy-first-closed-issuer"/);
  assert.match(app, /firstOpenIssuerHourToMarkdown\(scenario\)/);
  assert.match(app, /first-open-issuer-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /synthetic label, not live issuer data/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
  assert.notEqual(app.match(/function copyFirstOpenIssuerHourMarkdown/)?.[0], app.match(/function copyFirstOpenBankHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyFirstOpenIssuerHourMarkdown/)?.[0], app.match(/function copyFirstClosedIssuerHourMarkdown/)?.[0]);
});
