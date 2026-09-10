import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard close-brace is wired to copy first closed FX hour through the existing control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-first-closed-fx"/);
  assert.match(html, /<kbd>\}<\/kbd>/u);
  assert.match(html, /Copy first closed FX hour as Markdown/);
  assert.match(html, /id="copy-first-closed-fx"[^>]*aria-keyshortcuts="[^"]*\}/u);
  assert.match(app, /function copyFirstClosedFxHourMarkdown/);
  assert.match(app, /firstClosedFxHourToMarkdown\(scenario\)/);
  assert.match(app, /event\.key === "\}"/u);
  assert.match(app, /copyFirstClosedFxHourMarkdown\(\)/);
  assert.match(app, /event\.key === '"'/);
  assert.match(app, /copyFirstClosedPayoutHourMarkdown\(\)/);
  assert.match(app, /event\.key === ":"/);
  assert.match(app, /copyFirstClosedIssuerHourMarkdown\(\)/);
  assert.notEqual(app.match(/function copyFirstClosedFxHourMarkdown/)?.[0], app.match(/function copyFirstClosedPayoutHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyFirstClosedFxHourMarkdown/)?.[0], app.match(/function copyFirstClosedIssuerHourMarkdown/)?.[0]);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "}"') !== handler.indexOf("event.key === '\"'"));
  assert.ok(handler.indexOf('event.key === "}"') !== handler.indexOf('event.key === ":"'));
});
