import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { buildStandalone, isStandaloneCurrent, standaloneCsp } from "../scripts/build-standalone.mjs";

test("standalone build is self-contained, LF-only, and deterministic", async () => {
  const first = await buildStandalone();
  const second = await buildStandalone();
  assert.equal(first, second);
  assert.equal(isStandaloneCurrent(first, second), true);
  assert.equal(isStandaloneCurrent(first.replace(/\n/g, "\r\n"), second), true);
  assert.equal(isStandaloneCurrent("stale", second), false);
  assert.match(first, /data-weekend-gap-standalone="true"/);
  assert.match(first, /Sharing unavailable in standalone file/);
  assert.match(first, /A\$\$\{/);
  assert.match(first, new RegExp(`<meta http-equiv="Content-Security-Policy" content="${standaloneCsp}">`));
  assert.doesNotMatch(first, /(?:script|style)-src[^\"]*(?:'self'|https?:|data:|blob:)/);
  assert.doesNotMatch(first, /src="src\/app\.js"|href="styles\.css"|href="MODEL\.md"/);
  assert.doesNotMatch(first, /\r/);
});

test("release 1.4.3 ships dashboard copy, file compare and compressed Friday close", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  const html = await buildStandalone();
  assert.equal(pkg.version, "1.4.3");
  assert.match(readme, /New in v1\.4\.3/);
  assert.match(readme, /Compressed Friday close/);
  assert.match(html, /id="copy-dashboard-markdown"/);
  assert.match(html, /event\.key === "d"/);
  assert.match(html, /id="compare-scenario-files"/);
  assert.match(html, /id="monday-saturday-holiday-notice"/);
  assert.match(html, /id="preview-demand-earlier"/);
  assert.match(html, /id="selected-chart"/);
  assert.match(html, /id="peak-queue-row-note"/);
  assert.match(html, /event\.key === "q"/);
  assert.match(html, /data-preset="compressedFridayClose"/);
});
