import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { DEFAULT_SCENARIO, firstClosedGanttHour, formatTime, getOperationalStatus } from "../src/model.js";

const BANK_LIMITER = Object.freeze({
  ...DEFAULT_SCENARIO,
  name: "Bank limiter fixture",
  issuerOpenStartHour: 8,
  issuerOpenEndHour: 17,
  payoutOpenStartHour: 8,
  payoutOpenEndHour: 17,
  bankOpenStartHour: 18,
  bankOpenEndHour: 19
});

test("first closed Gantt hour is the first bank-closed chart hour", () => {
  const hour = firstClosedGanttHour(DEFAULT_SCENARIO);
  assert.equal(hour, 2);
  assert.equal(formatTime(hour), "Fri 17:00");
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, hour).bankOpen, false);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 0).bankOpen, true);
  assert.equal(getOperationalStatus(DEFAULT_SCENARIO, 1).bankOpen, true);
});

test("always-open bank windows still close on the weekend, and issuer-open bank-closed hours prefer the bank", () => {
  const alwaysOpenBank = firstClosedGanttHour({
    ...DEFAULT_SCENARIO,
    bankOpenStartHour: 0,
    bankOpenEndHour: 24
  });
  assert.equal(alwaysOpenBank, 9);
  assert.equal(formatTime(alwaysOpenBank), "Sat 00:00");
  assert.equal(firstClosedGanttHour(BANK_LIMITER), 0);
  assert.equal(getOperationalStatus(BANK_LIMITER, 0).bankOpen, false);
  assert.equal(getOperationalStatus(BANK_LIMITER, 0).issuerOpen, true);
});

test("keyboard f is wired to the first closed bank hour jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /<kbd>F<\/kbd>/);
  assert.match(app, /function jumpToFirstClosedBank/);
  assert.match(app, /firstClosedGanttHour\(scenario\)/);
  assert.match(app, /No closed bank or gate hour in this 72-hour calendar/);
});
