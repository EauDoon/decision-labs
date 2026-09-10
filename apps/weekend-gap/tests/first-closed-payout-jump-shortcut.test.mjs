import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard underscore is wired to the first-closed-payout-hour copy control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-first-closed-payout"/);
  assert.match(html, /id="gantt-title"/);
  assert.match(html, /<kbd>_<\/kbd>/);
  assert.match(html, /Jump to the first-closed-payout-hour copy control/);
  assert.match(app, /function jumpToFirstClosedPayoutCopy/);
  assert.match(app, /#copy-first-closed-payout/);
  assert.ok(app.includes('event.key === "_"'));
  assert.match(app, /function jumpToGantt/);
  assert.match(app, /function jumpToFirstClosedIssuerCopy/);
  assert.notEqual(app.match(/function jumpToFirstClosedPayoutCopy/)?.[0], app.match(/function jumpToFirstClosedIssuerCopy/)?.[0]);
  assert.notEqual(app.match(/function jumpToFirstClosedPayoutCopy/)?.[0], app.match(/function jumpToGantt/)?.[0]);
});
