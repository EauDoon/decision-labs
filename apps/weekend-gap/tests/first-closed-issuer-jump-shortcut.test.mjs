import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard hyphen is wired to the first-closed-issuer-hour copy control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-first-closed-issuer"/);
  assert.match(html, /id="gantt-title"/);
  assert.match(html, /<kbd>-<\/kbd>/);
  assert.match(html, /Jump to the first-closed-issuer-hour copy control/);
  assert.match(html, /id="copy-first-closed-issuer"[^>]*aria-keyshortcuts="[^"]*-/);
  assert.match(app, /function jumpToFirstClosedIssuerCopy/);
  assert.match(app, /#copy-first-closed-issuer/);
  assert.ok(app.includes('event.key === "-"'));
  assert.match(app, /function jumpToGantt/);
  assert.match(app, /function jumpToFirstClosedBankCopy/);
  assert.notEqual(app.match(/function jumpToFirstClosedIssuerCopy/)?.[0], app.match(/function jumpToFirstClosedBankCopy/)?.[0]);
  assert.notEqual(app.match(/function jumpToFirstClosedIssuerCopy/)?.[0], app.match(/function jumpToGantt/)?.[0]);
});
