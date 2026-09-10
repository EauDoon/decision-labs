import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("shortcut help documents the merchant inspector jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>m<\/kbd> Focus the merchant inspector region/u);
  assert.match(html, /id="merchant-inspector-region"/u);
  assert.match(html, /id="merchant-panel"[^>]*tabindex="-1"/u);
});

test("shortcut help documents the offers list jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>o<\/kbd> Focus the offers list/u);
  assert.match(html, /id="offers-list"[^>]*tabindex="-1"/u);
});

test("keyboard handler jumps to the merchant inspector when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "m"\)/u);
  assert.match(app, /function focusMerchantInspector\(/u);
  assert.match(app, /#merchant-inspector-region/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
});

test("keyboard handler jumps to the offers list when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "o"\)/u);
  assert.match(app, /function focusOffersList\(/u);
  assert.match(app, /#offers-list/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.match(app, /#merchant-tab/u);
});

test("shortcut help documents the buyer list jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>b<\/kbd> Focus the buyer list/u);
  assert.match(html, /id="buyers-list"[^>]*tabindex="-1"/u);
});

test("keyboard handler jumps to the buyer list when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "b"\)/u);
  assert.match(app, /function focusBuyersList\(/u);
  assert.match(app, /#buyers-list/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.match(app, /#buyer-tab/u);
});

test("shortcut help documents the winner summary jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>w<\/kbd> Focus the winner and inspector summary/u);
  assert.match(html, /id="winner-summary"[^>]*tabindex="-1"/u);
  assert.match(html, /id="inspector-summary"[^>]*tabindex="-1"/u);
});

test("keyboard handler jumps to the winner summary when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "w"\)/u);
  assert.match(app, /function focusWinnerSummary\(/u);
  assert.match(app, /#winner-summary/u);
  assert.match(app, /#inspector-summary/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
});

test("shortcut help documents the leftover residual coverage jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>l<\/kbd> Focus leftover residual coverage/u);
  assert.match(html, /id="residual-title"[^>]*tabindex="-1"/u);
});

test("keyboard handler jumps to leftover residual coverage when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "l"\)/u);
  assert.match(app, /function focusResidualCoverage\(/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.match(app, /#buyer-tab/u);
});

test("shortcut help documents the add offer key", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>a<\/kbd> Add an offer/u);
  assert.match(html, /id="add-offer"/u);
});

test("keyboard handler clicks add offer when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "a"\)/u);
  assert.match(app, /#add-offer/u);
  assert.match(app, /#merchant-tab/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
});
