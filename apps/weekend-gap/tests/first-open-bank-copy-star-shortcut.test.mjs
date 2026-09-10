import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard star is wired to copy first open bank hour through the existing control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-first-open-bank"/);
  assert.match(html, /<kbd>\*<\/kbd>/u);
  assert.match(html, /Copy first open bank hour as Markdown/);
  assert.match(html, /id="copy-first-open-bank"[^>]*aria-keyshortcuts="\*"/);
  assert.match(app, /function copyFirstOpenBankHourMarkdown/);
  assert.match(app, /firstOpenBankHourToMarkdown\(scenario\)/);
  assert.match(app, /event\.key === "\*"/);
  assert.match(app, /copyFirstOpenBankHourMarkdown\(\)/);
  assert.match(app, /event\.key === "\("/);
  assert.match(app, /copyFirstOpenFxHourMarkdown\(\)/);
  assert.match(app, /event\.key === "~"/);
  assert.match(app, /copyFirstOpenPayoutHourMarkdown\(\)/);
  assert.notEqual(app.match(/function copyFirstOpenBankHourMarkdown/)?.[0], app.match(/function copyFirstOpenFxHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyFirstOpenBankHourMarkdown/)?.[0], app.match(/function copyFirstOpenPayoutHourMarkdown/)?.[0]);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "*"') !== handler.indexOf('event.key === "("'));
  assert.ok(handler.indexOf('event.key === "*"') !== handler.indexOf('event.key === "~"'));
});
