import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("organizer warning names the local matching cap and not a server quota", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="entry-cap-warning"/u);
  assert.match(app, /function renderEntryCapWarning\(/u);
  assert.match(app, /not a server quota/u);
  assert.match(app, /local matching cap of 40 buyers/u);
  assert.match(app, /local matching cap of 40 offers/u);
  assert.match(app, /It is not a server quota/u);
  assert.doesNotMatch(app, /rate limit|hosted plan/iu);
  assert.doesNotMatch(html, /rate limit|hosted plan/iu);
});
