import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { buildStandalone } from "../scripts/build-standalone.mjs";

test("generated standalone parses as a module without duplicate declarations", async () => {
  const html = await buildStandalone();
  const source = html.match(/<script type="module">([\s\S]*?)<\/script>/u)?.[1];
  assert.ok(source);
  const result = spawnSync(process.execPath, ["--check", "--input-type=module"], { input: source, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
});

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

test("standalone retains 1.4.16 leftover-fill minimum tools and 1.4.17 leftover-fill maximum controls", async () => {
  const html = await buildStandalone();
  assert.match(html, /id="copy-leftover-fill-label"/u);
  assert.match(html, /id="copy-leftover-fill-label"[^>]*aria-keyshortcuts="\$"/u);
  assert.match(html, /id="hide-first-buyer-filled-by-leftover-fill"/u);
  assert.match(html, /id="hide-last-buyer-filled-by-leftover-fill"/u);
  assert.match(html, /data-preset="tennisCarnivalLunch"/u);
  assert.match(html, /id="copy-leftover-fill-minimum"/u);
  assert.match(html, /id="copy-leftover-fill-minimum"[^>]*aria-keyshortcuts="5"/u);
  assert.match(html, /id="hide-first-buyer-filled-by-tertiary-fill"/u);
  assert.match(html, /id="leftover-print-fill-minimum"/u);
  assert.match(html, /Leftover fill minimum: none/u);
  assert.match(html, /data-preset="basketballCarnivalLunch"/u);
  assert.match(html, /function copyLeftoverFillMinimum\(/u);
  assert.match(html, /function focusLeftoverFillMinimumCopy\(/u);
  assert.match(html, /function focusHideFirstBuyerFilledByTertiaryFill\(/u);
  assert.match(html, /filterBuyerIdsHidingFirstBuyerFilledByTertiaryFill\(/u);
  assert.match(html, /hideFirstBuyerFilledByTertiaryFill/u);
  assert.match(html, /if \(key === "5"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillMinimum\(\);/u);
  assert.match(html, /if \(key === "6"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverFillMinimumCopy\(\);/u);
  assert.match(html, /if \(key === "7"\) \{\s*event\.preventDefault\(\);\s*focusHideFirstBuyerFilledByTertiaryFill\(\);/u);
  assert.match(html, /id="copy-leftover-fill-maximum"/u);
  assert.match(html, /id="copy-leftover-fill-maximum"[^>]*aria-keyshortcuts="8"/u);
  assert.match(html, /id="hide-last-buyer-filled-by-tertiary-fill"/u);
  assert.match(html, /id="leftover-print-fill-maximum"/u);
  assert.match(html, /Leftover fill maximum: none/u);
  assert.match(html, /data-preset="volleyballCarnivalLunch"/u);
  assert.match(html, /function copyLeftoverFillMaximum\(/u);
  assert.match(html, /function focusLeftoverFillMaximumCopy\(/u);
  assert.match(html, /function focusHideLastBuyerFilledByTertiaryFill\(/u);
  assert.match(html, /filterBuyerIdsHidingLastBuyerFilledByTertiaryFill\(/u);
  assert.match(html, /hideLastBuyerFilledByTertiaryFill/u);
  assert.match(html, /if \(key === "8"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillMaximum\(\);/u);
  assert.match(html, /if \(key === "9"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverFillMaximumCopy\(\);/u);
  assert.match(html, /if \(key === "0"\) \{\s*event\.preventDefault\(\);\s*focusHideLastBuyerFilledByTertiaryFill\(\);/u);
  assert.match(html, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.doesNotMatch(html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"')), /copy-leftover-fill-minimum/u);
  assert.doesNotMatch(html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"')), /hide-first-buyer-filled-by-tertiary-fill/u);
  assert.doesNotMatch(html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"')), /copy-leftover-fill-maximum/u);
  assert.doesNotMatch(html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"')), /hide-last-buyer-filled-by-tertiary-fill/u);
});

