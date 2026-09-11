import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  firstClosedBankHourToMarkdown,
  formatTime,
  lastClosedBankGanttHour,
  lastClosedBankHourToMarkdown,
  lastClosedIssuerGanttHour,
  lastClosedIssuerHourToMarkdown
} from "../src/model.js";

test("last closed bank hour Markdown is one synthetic line with an honest empty", () => {
  const text = lastClosedBankHourToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, lastClosedBankHourToMarkdown(DEFAULT_SCENARIO));
  assert.equal(text.split("\n").length, 1);
  const hour = lastClosedBankGanttHour(DEFAULT_SCENARIO);
  const issuerHour = lastClosedIssuerGanttHour(DEFAULT_SCENARIO);
  assert.equal(issuerHour, 64);
  assert.equal(hour, 64);
  assert.equal(formatTime(hour), "Mon 07:00");
  assert.equal(text, "Last closed bank hour: Mon 07:00 (hour 64). Counts of modeled hours, not a bank calendar.");
  assert.match(text, /Counts of modeled hours/);
  assert.match(text, /not a bank calendar/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, lastClosedIssuerHourToMarkdown(DEFAULT_SCENARIO));
  assert.notEqual(text, firstClosedBankHourToMarkdown(DEFAULT_SCENARIO));
  const laterBank = {
    ...DEFAULT_SCENARIO,
    bankOpenStartHour: 9
  };
  const bankHour = lastClosedBankGanttHour(laterBank);
  assert.equal(bankHour, 65);
  assert.equal(formatTime(bankHour), "Mon 08:00");
  const bankText = lastClosedBankHourToMarkdown(laterBank);
  assert.equal(bankText, "Last closed bank hour: Mon 08:00 (hour 65). Counts of modeled hours, not a bank calendar.");
  assert.notEqual(bankText, lastClosedIssuerHourToMarkdown(laterBank));
  assert.notEqual(lastClosedBankGanttHour(laterBank), lastClosedIssuerGanttHour(laterBank));
});

test("last closed bank hour Markdown uses none when no modeled hour is closed", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const start = model.indexOf("export function lastClosedBankHourToMarkdown");
  const next = model.indexOf("export function ", start + 1);
  const body = model.slice(start, next === -1 ? undefined : next);
  assert.match(body, /hour === null/);
  assert.match(body, /Last closed bank hour: none\. Counts of modeled hours, not a bank calendar\./);
  const empty = "Last closed bank hour: none. Counts of modeled hours, not a bank calendar.";
  assert.equal(empty.split("\n").length, 1);
  assert.doesNotMatch(empty, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(empty, lastClosedIssuerHourToMarkdown(DEFAULT_SCENARIO));
  assert.doesNotMatch(model, /Date\.now/);
});

test("copy last closed bank hour uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-closed-bank"/);
  assert.match(html, /Copy last closed bank hour/);
  assert.match(html, /id="last-closed-bank-copy-fallback"/);
  assert.match(html, /id="copy-last-closed-issuer"/);
  assert.match(app, /lastClosedBankHourToMarkdown\(scenario\)/);
  assert.match(app, /last-closed-bank-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /synthetic label, not live bank data/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
  assert.notEqual(app.match(/function copyLastClosedBankHourMarkdown/)?.[0], app.match(/function copyLastClosedIssuerHourMarkdown/)?.[0]);
});
