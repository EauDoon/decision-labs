import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard PageUp is wired to copy last open payout hour through the new control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-open-payout"/);
  assert.match(html, /<kbd>PageUp<\/kbd>/u);
  assert.match(html, /Copy last open payout hour as Markdown/);
  assert.match(html, /id="copy-last-open-payout"[^>]*aria-keyshortcuts="PageUp"/);
  assert.match(app, /function copyLastOpenPayoutHourMarkdown/);
  assert.match(app, /lastOpenPayoutHourToMarkdown\(scenario\)/);
  assert.match(app, /event\.key === "PageUp"/);
  assert.match(app, /copyLastOpenPayoutHourMarkdown\(\)/);
  assert.match(app, /event\.key === "4"/);
  assert.match(app, /copyLastOpenBankHourMarkdown\(\)/);
  assert.match(app, /event\.key === "5"/);
  assert.match(app, /copyLastOpenIssuerHourMarkdown\(\)/);
  assert.notEqual(app.match(/function copyLastOpenPayoutHourMarkdown/)?.[0], app.match(/function copyLastOpenBankHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastOpenPayoutHourMarkdown/)?.[0], app.match(/function copyLastOpenIssuerHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastOpenPayoutHourMarkdown/)?.[0], app.match(/function copyFirstOpenPayoutHourMarkdown/)?.[0]);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "PageUp"') !== handler.indexOf('event.key === "4"'));
  assert.ok(handler.indexOf('event.key === "PageUp"') !== handler.indexOf('event.key === "5"'));
});
