import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard less-than is wired to the first-closed-bank-hour copy control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-first-closed-bank"/);
  assert.match(html, /<kbd>&lt;<\/kbd>/);
  assert.match(html, /Jump to the first-closed-bank-hour copy control/);
  assert.match(app, /function jumpToFirstClosedBankCopy/);
  assert.match(app, /#copy-first-closed-bank/);
  assert.ok(app.includes('event.key === "<"'));
  assert.match(app, /function jumpToFirstClosedBank/);
  assert.match(app, /function jumpToGantt/);
  assert.notEqual(app.match(/function jumpToFirstClosedBankCopy/)?.[0], app.match(/function jumpToFirstClosedBank/)?.[0]);
  assert.notEqual(app.match(/function jumpToFirstClosedBankCopy/)?.[0], app.match(/function jumpToGantt/)?.[0]);
});
