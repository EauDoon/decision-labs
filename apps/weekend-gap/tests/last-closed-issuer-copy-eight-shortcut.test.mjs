import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard 8 is wired to copy last closed issuer hour through the new control", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-closed-issuer"/);
  assert.match(html, /<kbd>8<\/kbd>/u);
  assert.match(html, /Copy last closed issuer hour as Markdown/);
  assert.match(html, /id="copy-last-closed-issuer"[^>]*aria-keyshortcuts="8"/);
  assert.match(app, /function copyLastClosedIssuerHourMarkdown/);
  assert.match(app, /lastClosedIssuerHourToMarkdown\(scenario\)/);
  assert.match(app, /event\.key === "8"/);
  assert.match(app, /copyLastClosedIssuerHourMarkdown\(\)/);
  assert.match(app, /event\.key === "5"/);
  assert.match(app, /copyLastOpenIssuerHourMarkdown\(\)/);
  assert.match(app, /event\.key === "\$"/);
  assert.match(app, /copyFirstOpenIssuerHourMarkdown\(\)/);
  assert.notEqual(app.match(/function copyLastClosedIssuerHourMarkdown/)?.[0], app.match(/function copyLastOpenIssuerHourMarkdown/)?.[0]);
  assert.notEqual(app.match(/function copyLastClosedIssuerHourMarkdown/)?.[0], app.match(/function copyFirstOpenIssuerHourMarkdown/)?.[0]);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "8"') !== handler.indexOf('event.key === "5"'));
  assert.ok(handler.indexOf('event.key === "8"') !== handler.indexOf('event.key === "$"'));
});
