import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildStandalone } from "../scripts/build-standalone.mjs";

test("standalone GUI is deterministic and current", async () => {
  const expected = await buildStandalone();
  const current = (await readFile(new URL("../standalone.html", import.meta.url), "utf8")).replace(/\r\n?/gu, "\n");
  assert.equal(current, expected);
});

test("standalone GUI has no external resource dependency", async () => {
  const html = await buildStandalone();
  assert.match(html, /Content-Security-Policy/u);
  assert.match(html, /default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'/u);
  assert.match(html, /<style>[\s\S]+<\/style>/u);
  assert.match(html, /<script type="module">[\s\S]+<\/script>/u);
  assert.doesNotMatch(html, /<script[^>]+src=/iu);
  assert.doesNotMatch(html, /<link[^>]+stylesheet/iu);
  assert.doesNotMatch(html, /(?:src|href)=["'](?:\.\/|https?:|\/\/)/iu);
  assert.match(html, /window\.location\.protocol === "file:"/u);
  assert.match(html, /Use Export JSON to share a standalone scenario\./u);
  assert.match(html, /Included locally/u);
  assert.match(html, /No complete buyer set/u);
  assert.match(html, /Three ASCII letters, e\.g\. AUD/u);
  assert.match(html, /Accepted variants are a comma-separated list/u);
  assert.match(html, /cannot be empty/u);
  assert.match(html, /"Room name"/u);
  assert.match(html, /Share link could not be opened/u);
  assert.match(html, /Saved room could not be restored/u);
  assert.match(html, /not valid JSON/u);
});
