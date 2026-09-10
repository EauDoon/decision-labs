import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard tilde is wired to copy first open payout hour through the existing control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-first-open-payout"/);
  assert.match(html, /<kbd>~<\/kbd>/u);
  assert.match(html, /Copy first open payout hour as Markdown/);
  assert.match(html, /id="copy-first-open-payout"[^>]*aria-keyshortcuts="~"/);
  assert.match(app, /function copyFirstOpenPayoutHourMarkdown/);
  assert.match(app, /firstOpenPayoutHourToMarkdown\(scenario\)/);
  assert.match(app, /event\.key === "~"/);
  assert.match(app, /copyFirstOpenPayoutHourMarkdown\(\)/);
  assert.match(app, /event\.key === "\}"/u);
  assert.match(app, /copyFirstClosedFxHourMarkdown\(\)/);
  assert.match(app, /event\.key === '"'/);
  assert.match(app, /copyFirstClosedPayoutHourMarkdown\(\)/);
  assert.notEqual(app.match(/function copyFirstOpenPayoutHourMarkdown/)?.[0], app.match(/function copyFirstClosedFxHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyFirstOpenPayoutHourMarkdown/)?.[0], app.match(/function copyFirstClosedPayoutHourMarkdown/)?.[0]);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "~"') !== handler.indexOf('event.key === "}"'));
  assert.ok(handler.indexOf('event.key === "~"') !== handler.indexOf("event.key === '\"'"));
});
