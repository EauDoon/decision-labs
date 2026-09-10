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

test("shortcut help documents the uncovered leftover jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>j<\/kbd> Focus the first uncovered leftover row/u);
  assert.match(html, /id="leftover-buyer-rows"/u);
  assert.match(html, /id="uncovered-leftover"|id="leftover-coverage-rows"/u);
});

test("keyboard handler jumps to uncovered leftover when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "j"\)/u);
  assert.match(app, /function focusUncoveredLeftover\(/u);
  assert.match(app, /#leftover-buyer-rows \.leftover-uncovered/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /#buyer-tab/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
});

test("shortcut help documents the uncovered leftover coverage jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>d<\/kbd> Focus the first uncovered leftover coverage row, or leftover heading if none/u);
  assert.match(html, /id="leftover-coverage-rows"/u);
  assert.match(html, /id="residual-title"/u);
});

test("keyboard handler jumps to the first uncovered leftover coverage row when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "d"\)/u);
  assert.match(app, /function focusUncoveredLeftoverCoverageRow\(/u);
  assert.match(app, /#leftover-coverage-rows \.leftover-uncovered/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /#buyer-tab/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
});

test("shortcut help documents the buyer paste jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>s<\/kbd> Focus the buyer CSV or TSV paste control/u);
  assert.match(html, /id="paste-buyers"/u);
});

test("keyboard handler jumps to buyer paste when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "s"\)/u);
  assert.match(app, /function focusBuyerPaste\(/u);
  assert.match(app, /#paste-buyers/u);
  assert.match(app, /#buyer-tab/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
});

test("shortcut help documents leftover print", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>p<\/kbd> Print an organizer leftover one-pager/u);
});

test("keyboard handler prints leftover one-pager when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "p"\)/u);
  assert.match(app, /function printLeftoverOnePager\(/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
});

test("shortcut help documents the variant overlap jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>v<\/kbd> Focus the variant overlap region/u);
  assert.match(html, /id="variant-overlap-region"/u);
});

test("keyboard handler jumps to variant overlap when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "v"\)/u);
  assert.match(app, /function focusVariantOverlap\(/u);
  assert.match(app, /#variant-overlap-region/u);
  assert.match(app, /#merchant-tab/u);
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

test("shortcut help documents leftover residual coverage copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>c<\/kbd> Copy leftover residual coverage \(organizer private\)/u);
  assert.match(html, /id="copy-leftover-coverage"/u);
});

test("keyboard handler copies leftover residual coverage when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "c"\)/u);
  assert.match(app, /function copyLeftoverCoverage\(/u);
  assert.match(app, /createLeftoverCoverageMarkdown\(scenario\)/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.match(app, /organizer-private Markdown/u);
});

test("shortcut help documents the tertiary leftover fill jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>t<\/kbd> Focus tertiary leftover fill/u);
  assert.match(html, /id="tertiary-fill"|id="leftover-coverage-rows"/u);
  assert.match(html, /id="residual-title"/u);
});

test("keyboard handler jumps to tertiary leftover fill when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "t"\)/u);
  assert.match(app, /function focusTertiaryLeftoverFill\(/u);
  assert.match(app, /#tertiary-fill/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /#buyer-tab/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
});

test("shortcut help documents the offer fulfillment filter jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>f<\/kbd> Focus the offer fulfillment filter/u);
  assert.match(html, /id="offer-fulfillment-filter"/u);
});

test("keyboard handler focuses the offer fulfillment filter when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "f"\)/u);
  assert.match(app, /function focusOfferFulfillmentFilter\(/u);
  assert.match(app, /#offer-fulfillment-filter/u);
  assert.match(app, /#merchant-tab/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
});

test("shortcut help documents leftover item headroom jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>h<\/kbd> Focus leftover item headroom after the winner/u);
  assert.match(html, /id="leftover-headroom"[^>]*tabindex="-1"/u);
});

test("keyboard handler jumps to leftover item headroom when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "h"\)/u);
  assert.match(app, /function focusLeftoverHeadroom\(/u);
  assert.match(app, /#leftover-headroom/u);
  assert.match(app, /#buyer-tab/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
});

test("shortcut help documents the organizer review panel jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>k<\/kbd> Focus the organizer review panel/u);
  assert.match(html, /id="cart-review"/u);
  assert.match(html, /<summary>Review buyer coverage and offer resilience<\/summary>/u);
});

test("keyboard handler opens and focuses the review panel when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "k"\)/u);
  assert.match(app, /function focusCartReview\(/u);
  assert.match(app, /#cart-review/u);
  assert.match(app, /panel\.open = true/u);
  assert.match(app, /querySelector\("summary"\)\?\.focus\(\)/u);
  assert.match(app, /#buyer-tab/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
});

test("shortcut help documents the group headroom jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>g<\/kbd> Focus group headroom/u);
  assert.match(html, /id="metric-savings"[^>]*tabindex="-1"/u);
});

test("keyboard handler jumps to group headroom when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "g"\)/u);
  assert.match(app, /function focusGroupHeadroom\(/u);
  assert.match(app, /#metric-savings/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
});

test("shortcut help documents leftover unspent item headroom copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>i<\/kbd> Copy leftover unspent item headroom \(organizer private\)/u);
  assert.match(html, /id="copy-leftover-headroom"/u);
});

test("keyboard handler copies leftover unspent item headroom when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "i"\)/u);
  assert.match(app, /function copyLeftoverHeadroom\(/u);
  assert.match(app, /createLeftoverHeadroomMarkdown\(scenario\)/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.match(app, /organizer-private Markdown/u);
});
