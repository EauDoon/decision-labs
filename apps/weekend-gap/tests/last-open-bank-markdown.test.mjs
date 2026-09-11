import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  firstOpenBankHourToMarkdown,
  formatTime,
  lastClosedBankGanttHour,
  lastClosedBankHourToMarkdown,
  lastOpenBankGanttHour,
  lastOpenBankHourToMarkdown,
  lastOpenIssuerGanttHour,
  lastOpenIssuerHourToMarkdown
} from "../src/model.js";

test("last open bank hour Markdown is one synthetic line with an honest empty", () => {
  const text = lastOpenBankHourToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, lastOpenBankHourToMarkdown(DEFAULT_SCENARIO));
  assert.equal(text.split("\n").length, 1);
  const hour = lastOpenBankGanttHour(DEFAULT_SCENARIO);
  const issuerHour = lastOpenIssuerGanttHour(DEFAULT_SCENARIO);
  const closedHour = lastClosedBankGanttHour(DEFAULT_SCENARIO);
  assert.equal(issuerHour, 71);
  assert.equal(hour, 71);
  assert.equal(closedHour, 64);
  assert.equal(formatTime(hour), "Mon 14:00");
  assert.equal(text, "Last open bank hour: Mon 14:00 (hour 71). Counts of modeled hours, not a bank calendar.");
  assert.match(text, /Counts of modeled hours/);
  assert.match(text, /not a bank calendar/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, lastOpenIssuerHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, lastClosedBankHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstOpenBankHourToMarkdown(DEFAULT_SCENARIO));
  const earlierBank = {
    ...DEFAULT_SCENARIO,
    bankOpenEndHour: 14
  };
  const bankHour = lastOpenBankGanttHour(earlierBank);
  assert.equal(bankHour, 70);
  assert.equal(formatTime(bankHour), "Mon 13:00");
  const bankText = lastOpenBankHourToMarkdown(earlierBank);
  assert.equal(bankText, "Last open bank hour: Mon 13:00 (hour 70). Counts of modeled hours, not a bank calendar.");
  assert.notEqual(bankText, lastOpenIssuerHourToMarkdown(earlierBank));
  assert.notEqual(lastOpenBankGanttHour(earlierBank), lastOpenIssuerGanttHour(earlierBank));
  assert.notEqual(lastOpenBankGanttHour(earlierBank), lastClosedBankGanttHour(earlierBank));
});

test("last open bank hour Markdown uses none when no modeled hour is open", async () => {
  const neverOpen = {
    ...DEFAULT_SCENARIO,
    bankOpenStartHour: 0,
    bankOpenEndHour: 1,
    mondayHoliday: true
  };
  const empty = lastOpenBankHourToMarkdown(neverOpen);
  assert.equal(lastOpenBankGanttHour(neverOpen), null);
  assert.equal(empty, "Last open bank hour: none. Counts of modeled hours, not a bank calendar.");
  assert.equal(empty.split("\n").length, 1);
  assert.doesNotMatch(empty, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(empty, lastOpenIssuerHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(empty, lastClosedBankHourToMarkdown(DEFAULT_SCENARIO));
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const start = model.indexOf("export function lastOpenBankHourToMarkdown");
  const next = model.indexOf("export function ", start + 1);
  const body = model.slice(start, next === -1 ? undefined : next);
  assert.match(body, /hour === null/);
  assert.match(body, /Last open bank hour: none\. Counts of modeled hours, not a bank calendar\./);
  assert.doesNotMatch(model, /Date\.now/);
});

test("copy last open bank hour uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-open-bank"/);
  assert.match(html, /Copy last open bank hour/);
  assert.match(html, /id="last-open-bank-copy-fallback"/);
  assert.match(html, /id="copy-last-closed-bank"/);
  assert.match(html, /id="copy-last-open-issuer"/);
  assert.match(app, /lastOpenBankHourToMarkdown\(scenario\)/);
  assert.match(app, /last-open-bank-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /synthetic label, not live bank data/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
  assert.notEqual(app.match(/function copyLastOpenBankHourMarkdown/)?.[0], app.match(/function copyLastClosedBankHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastOpenBankHourMarkdown/)?.[0], app.match(/function copyLastOpenIssuerHourMarkdown/)?.[0]);
});
