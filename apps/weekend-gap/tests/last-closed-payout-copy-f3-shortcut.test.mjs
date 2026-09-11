import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard F3 is wired to copy last closed payout hour through the new control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-closed-payout"/);
  assert.match(html, /<kbd>F3<\/kbd>/u);
  assert.match(html, /Copy last closed payout hour as Markdown/);
  assert.match(html, /id="copy-last-closed-payout"[^>]*aria-keyshortcuts="F3"/);
  assert.match(app, /function copyLastClosedPayoutHourMarkdown/);
  assert.match(app, /lastClosedPayoutHourToMarkdown\(scenario\)/);
  assert.match(app, /event\.key === "F3"/);
  assert.match(app, /copyLastClosedPayoutHourMarkdown\(\)/);
  assert.match(app, /event\.key === "Delete"/);
  assert.match(app, /copyLastClosedFxHourMarkdown\(\)/);
  assert.match(app, /event\.key === "PageUp"/);
  assert.match(app, /copyLastOpenPayoutHourMarkdown\(\)/);
  assert.notEqual(app.match(/function copyLastClosedPayoutHourMarkdown/)?.[0], app.match(/function copyLastClosedFxHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastClosedPayoutHourMarkdown/)?.[0], app.match(/function copyLastOpenPayoutHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastClosedPayoutHourMarkdown/)?.[0], app.match(/function copyFirstClosedPayoutHourMarkdown/)?.[0]);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "F3"') !== handler.indexOf('event.key === "Delete"'));
  assert.ok(handler.indexOf('event.key === "F3"') !== handler.indexOf('event.key === "PageUp"'));
});
