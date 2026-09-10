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

test("release 1.5.1 ships Gantt hour copy, payday burst and dashboard CSV", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  const html = await buildStandalone();
  assert.equal(pkg.version, "1.5.1");
  assert.match(readme, /New in v1\.5\.1/);
  assert.match(readme, /Payday Friday burst/);
  assert.match(html, /id="copy-gantt-hour"/);
  assert.match(html, /event\.key === "f"/);
  assert.match(html, /id="gantt-closed-only"/);
  assert.match(html, /id="compare-three-scenario-files"/);
  assert.match(html, /data-preset="paydayFridayBurst"/);
  assert.match(html, /event\.key === "s"/);
  assert.match(html, /id="export-dashboard-csv"/);
  assert.match(html, /ganttClosedOnly/);
  assert.match(html, /id="print-redacted"/);
  assert.match(html, /id="copy-bottleneck-markdown"/);
});

test("release 1.5.1 retains 1.5.0 timing review, dashboard copy, file compare and compressed Friday close", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  const html = await buildStandalone();
  assert.equal(pkg.version, "1.5.1");
  assert.match(readme, /New in v1\.5\.0/);
  assert.match(readme, /New in v1\.4\.3/);
  assert.match(readme, /Compressed Friday close/);
  assert.match(html, /id="weekend-review"/);
  assert.match(html, /id="weekend-review-export"/);
  assert.match(html, /createWeekendReviewPacket/);
  assert.match(html, /replayWeekendReviewPacket/);
  assert.match(html, /WEEKEND_REVIEW_TOOLS/);
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
