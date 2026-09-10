import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard open-paren is wired to copy first open FX hour through the existing control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-first-open-fx"/);
  assert.match(html, /<kbd>\(<\/kbd>/u);
  assert.match(html, /Copy first open FX hour as Markdown/);
  assert.match(html, /id="copy-first-open-fx"[^>]*aria-keyshortcuts="\("/);
  assert.match(app, /function copyFirstOpenFxHourMarkdown/);
  assert.match(app, /firstOpenFxHourToMarkdown\(scenario\)/);
  assert.match(app, /event\.key === "\("/);
  assert.match(app, /copyFirstOpenFxHourMarkdown\(\)/);
  assert.match(app, /event\.key === "~"/);
  assert.match(app, /copyFirstOpenPayoutHourMarkdown\(\)/);
  assert.match(app, /event\.key === "\}"/u);
  assert.match(app, /copyFirstClosedFxHourMarkdown\(\)/);
  assert.notEqual(app.match(/function copyFirstOpenFxHourMarkdown/)?.[0], app.match(/function copyFirstOpenPayoutHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyFirstOpenFxHourMarkdown/)?.[0], app.match(/function copyFirstClosedFxHourMarkdown/)?.[0]);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "("') !== handler.indexOf('event.key === "~"'));
  assert.ok(handler.indexOf('event.key === "("') !== handler.indexOf('event.key === "}"'));
});
