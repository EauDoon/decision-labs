import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard Shift+F9 jumps to hide-last-group-without-floor before unshifted F9", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="hide-last-group-without-floor"/);
  assert.match(html, /id="hide-first-group-without-floor"/);
  assert.match(html, /<kbd>Shift\+F9<\/kbd> Jump to the hide-last-group-without-floor control, or the groups heading/);
  assert.match(html, /id="hide-last-group-without-floor"[^>]*aria-keyshortcuts="F9"/);
  assert.match(html, /id="hide-first-group-without-floor"[^>]*aria-keyshortcuts="F12"/);
  assert.equal(app.includes('} else if (event.shiftKey && key === "F9") {\n    event.preventDefault();\n    jumpToHideLastGroupWithoutFloor();'), true);
  assert.equal(app.includes('} else if (key === "F9") {\n    event.preventDefault();\n    jumpToHideLastGroupWithoutFloor();'), true);
  assert.equal(app.includes('} else if (event.shiftKey && key === "F12") {\n    event.preventDefault();\n    jumpToHideFirstGroupWithoutFloor();'), true);
  assert.ok(app.indexOf('event.shiftKey && key === "F9"') < app.indexOf('} else if (key === "F9")'));
  assert.doesNotMatch(app, /event\.shiftKey && key === "F9"\) \{\s*event\.preventDefault\(\);\s*jumpToHideFirstGroupWithoutFloor/);
});
