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

test("standalone build ships the consolidated filter and gate evidence controls", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const changelog = await readFile(new URL("../CHANGELOG.md", import.meta.url), "utf8");
  const html = await buildStandalone();
  assert.match(changelog, new RegExp(pkg.version.replace(/\./g, "\\.")));
  for (const marker of [
    /id="gantt-hour-filter"/,
    /Hours closed on at least one gate/,
    /id="copy-gate-evidence-issuer"/,
    /id="copy-gate-evidence-bank"/,
    /id="copy-gate-evidence-payout"/,
    /id="copy-gate-evidence-fx"/,
    /gateHourEvidenceToMarkdown/,
    /ganttHourMatchesFilter/,
    /GANTT_HOUR_FILTERS/,
    /legacyHourFilterFromKeys/
  ]) {
    assert.match(html, marker);
  }
  assert.doesNotMatch(html, /id="gantt-hide-bank-closed"/);
  assert.doesNotMatch(html, /id="copy-first-closed-fx"/);
  assert.doesNotMatch(html, /aria-keyshortcuts="ArrowUp"/);
});
