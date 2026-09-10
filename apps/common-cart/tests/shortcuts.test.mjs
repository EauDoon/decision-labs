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

test("shortcut help documents the requested units jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>q<\/kbd> Focus requested units/u);
  assert.match(html, /id="metric-units"[^>]*tabindex="-1"/u);
});

test("keyboard handler jumps to requested units when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "q"\)/u);
  assert.match(app, /function focusRequestedUnits\(/u);
  assert.match(app, /#metric-units/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
});

test("shortcut help documents the private buyer report jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>x<\/kbd> Focus Export private buyer report \(organizer private\)/u);
  assert.match(html, /id="buyer-report"/u);
});

test("keyboard handler focuses Export private buyer report when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "x"\)/u);
  assert.match(app, /function focusPrivateBuyerReport\(/u);
  assert.match(app, /#buyer-report/u);
  assert.match(app, /#buyer-tab/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
});

test("shortcut help documents leftover fill copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>y<\/kbd> Copy leftover fill \(organizer private\)/u);
  assert.match(html, /<kbd>;<\/kbd> Copy leftover fill \(organizer private\)/u);
  assert.match(html, /id="copy-leftover-fill"/u);
});

test("keyboard handler copies leftover fill when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "y" \|\| key === ";"\)/u);
  assert.match(app, /function copyLeftoverFill\(/u);
  assert.match(app, /createLeftoverFillMarkdown\(scenario\)/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.match(app, /organizer-private Markdown/u);
});

test("semicolon leftover fill copy uses the existing leftover-fill control and y still copies", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(app, /if \(key === "y" \|\| key === ";"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFill\(\);/u);
  assert.match(app, /function copyLeftoverFill\(/u);
  assert.match(app, /createLeftoverFillMarkdown\(scenario\)/u);
  assert.match(html, /id="copy-leftover-fill"/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
});

test("shortcut help documents the leftover fill jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>z<\/kbd> Focus leftover fill, or leftover heading if none/u);
  assert.match(html, /id="leftover-fill"|id="leftover-coverage-rows"/u);
  assert.match(html, /id="residual-title"/u);
});

test("keyboard handler jumps to leftover fill when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "z"\)/u);
  assert.match(app, /function focusLeftoverFill\(/u);
  assert.match(app, /#leftover-fill/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /#buyer-tab/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
});

test("shortcut help documents remaining capacity copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>,<\/kbd> Copy remaining capacity on the unlocked winner/u);
  assert.match(html, /id="copy-winning-remaining-capacity"/u);
});

test("keyboard handler copies remaining capacity with comma when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === ","\)/u);
  assert.match(app, /function copyWinningRemainingCapacity\(/u);
  assert.match(app, /createWinningRemainingCapacityMarkdown\(scenario\)/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
});

test("shortcut help documents remaining capacity copy jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>\.<\/kbd> Focus the remaining-capacity copy control, or winner heading if missing/u);
  assert.match(html, /id="copy-winning-remaining-capacity"/u);
  assert.match(html, /id="winner-summary"/u);
});

test("keyboard handler jumps to remaining capacity copy when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "\."\)/u);
  assert.match(app, /function focusWinningRemainingCapacityCopy\(/u);
  assert.match(app, /#copy-winning-remaining-capacity/u);
  assert.match(app, /#winner-summary/u);
  assert.match(app, /#buyer-tab/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
});

test("shortcut help documents leftover fill copy jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>\/<\/kbd> Focus the leftover-fill copy control/u);
  assert.match(html, /id="copy-leftover-fill"/u);
});

test("keyboard handler jumps to leftover fill copy with slash without Shift", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "\/" && !event\.shiftKey\)/u);
  assert.match(app, /function focusLeftoverFillCopy\(/u);
  assert.match(app, /#copy-leftover-fill/u);
  assert.match(app, /#buyer-tab/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.match(app, /event\.key === "\?" \|\| \(event\.shiftKey && event\.key === "\/"\)/u);
  assert.match(app, /if \(key === "y" \|\| key === ";"\)/u);
  assert.match(app, /function copyLeftoverFill\(/u);
});

test("shortcut help documents requested units copy jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>\[<\/kbd> Focus the requested-units copy control, or requested units heading if missing/u);
  assert.match(html, /id="copy-requested-units"/u);
  assert.match(html, /id="metric-units"/u);
  assert.match(html, /id="buyer-tab"/u);
});

test("keyboard handler jumps to requested units copy when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "\["\)/u);
  assert.match(app, /function focusRequestedUnitsCopy\(/u);
  assert.match(app, /#copy-requested-units/u);
  assert.match(app, /#metric-units/u);
  assert.match(app, /#buyer-tab/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(key === "\["\) \{\s*event\.preventDefault\(\);\s*copyRequestedUnits/u);
});

test("shortcut help documents leftover print control jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>\]<\/kbd> Focus the leftover print control, or leftover heading if missing/u);
  assert.match(html, /id="leftover-print-fill"/u);
  assert.match(html, /id="residual-title"/u);
});

test("keyboard handler jumps to leftover print control when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "\]"\)/u);
  assert.match(app, /function focusLeftoverPrintControl\(/u);
  assert.match(app, /#leftover-print-fill/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /#buyer-tab/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(key === "\]"\) \{\s*event\.preventDefault\(\);\s*focusWinningRemainingCapacityCopy/u);
  assert.match(app, /if \(key === "\."\)/u);
  assert.match(app, /function focusWinningRemainingCapacityCopy\(/u);
});

test("shortcut help documents leftover fill unit-count copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>'<\/kbd> Copy leftover fill units \(organizer private\)/u);
  assert.match(html, /id="copy-leftover-fill-units"/u);
});

test("keyboard handler copies leftover fill unit-count with apostrophe when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.match(app, /if \(key === "'"\)/u);
  assert.match(app, /function copyLeftoverFillUnitCount\(/u);
  assert.match(app, /createLeftoverFillUnitCountMarkdown\(scenario\)/u);
  assert.match(app, /#copy-leftover-fill-units/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.match(app, /organizer-private Markdown/u);
});

test("shortcut help documents leftover fill unit-count copy jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>&lt;<\/kbd> Focus the leftover-fill-units copy control, or leftover heading if missing/u);
  assert.match(html, /id="copy-leftover-fill-units"/u);
  assert.match(html, /id="residual-title"/u);
});

test("keyboard handler jumps to leftover fill unit-count copy when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "<"\)/u);
  assert.match(app, /function focusLeftoverFillUnitCountCopy\(/u);
  assert.match(app, /#copy-leftover-fill-units/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /#buyer-tab/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(key === "<"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillUnitCount/u);
  assert.match(app, /if \(key === "'"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillUnitCount\(\);/u);
  assert.match(app, /if \(key === ","\)/u);
  assert.match(app, /function copyWinningRemainingCapacity\(/u);
});

test("shortcut help documents hide fully filled buyers jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>&gt;<\/kbd> Focus hide fully filled buyers, or the buyer list if missing/u);
  assert.match(html, /id="hide-fully-filled-buyers"/u);
  assert.match(html, /id="buyers-list"/u);
});

test("keyboard handler jumps to hide fully filled buyers when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === ">"\)/u);
  assert.match(app, /function focusHideFullyFilledBuyers\(/u);
  assert.match(app, /#hide-fully-filled-buyers/u);
  assert.match(app, /#buyers-list/u);
  assert.match(app, /#buyer-tab/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(key === ">"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverFillUnitCountCopy/u);
  assert.match(app, /if \(key === "<"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverFillUnitCountCopy\(\);/u);
  assert.match(app, /if \(key === "\."\)/u);
  assert.match(app, /function focusWinningRemainingCapacityCopy\(/u);
});

test("shortcut help documents uncovered leftover unit-count copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>:<\/kbd> Copy uncovered leftover units \(organizer private\)/u);
  assert.match(html, /id="copy-uncovered-leftover-units"/u);
});

test("keyboard handler copies uncovered leftover unit-count with colon when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.match(app, /if \(key === ":"\)/u);
  assert.match(app, /function copyUncoveredLeftoverUnitCount\(/u);
  assert.match(app, /createUncoveredLeftoverUnitCountMarkdown\(scenario\)/u);
  assert.match(app, /#copy-uncovered-leftover-units/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.doesNotMatch(app, /if \(key === ":"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillUnitCount/u);
  assert.match(app, /if \(key === "'"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillUnitCount\(\);/u);
});

test("colon uncovered leftover unit-count copy uses the existing uncovered leftover units control", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(app, /if \(key === ":"\) \{\s*event\.preventDefault\(\);\s*copyUncoveredLeftoverUnitCount\(\);/u);
  assert.match(app, /function copyUncoveredLeftoverUnitCount\(/u);
  assert.match(app, /createUncoveredLeftoverUnitCountMarkdown\(scenario\)/u);
  assert.match(html, /id="copy-uncovered-leftover-units"/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(key === ":"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFill\(\);/u);
  assert.match(app, /if \(key === "y" \|\| key === ";"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFill\(\);/u);
});

test("shortcut help documents uncovered leftover unit-count copy jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>-<\/kbd> Focus the uncovered leftover units copy control, or leftover heading if missing/u);
  assert.match(html, /id="copy-uncovered-leftover-units"/u);
  assert.match(html, /id="residual-title"/u);
});

test("keyboard handler jumps to uncovered leftover unit-count copy when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "-"\)/u);
  assert.match(app, /function focusUncoveredLeftoverUnitCountCopy\(/u);
  assert.match(app, /#copy-uncovered-leftover-units/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /#buyer-tab/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(key === "-"\) \{\s*event\.preventDefault\(\);\s*copyUncoveredLeftoverUnitCount/u);
  assert.match(app, /if \(key === ":"\) \{\s*event\.preventDefault\(\);\s*copyUncoveredLeftoverUnitCount\(\);/u);
});

test("shortcut help documents hide buyers with leftover jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>=<\/kbd> Focus hide buyers with leftover, or the buyer list if missing/u);
  assert.match(html, /id="hide-buyers-with-leftover"/u);
  assert.match(html, /id="buyers-list"/u);
});

test("keyboard handler jumps to hide buyers with leftover when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "="\)/u);
  assert.match(app, /function focusHideBuyersWithLeftover\(/u);
  assert.match(app, /#hide-buyers-with-leftover/u);
  assert.match(app, /#buyers-list/u);
  assert.match(app, /#buyer-tab/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(key === "="\) \{\s*event\.preventDefault\(\);\s*focusHideFullyFilledBuyers/u);
  assert.match(app, /if \(key === ">"\) \{\s*event\.preventDefault\(\);\s*focusHideFullyFilledBuyers\(\);/u);
  assert.match(app, /if \(key === "-"\) \{\s*event\.preventDefault\(\);\s*focusUncoveredLeftoverUnitCountCopy\(\);/u);
});

test("shortcut help documents leftover fill merchant copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>"<\/kbd> Copy leftover fill merchant \(organizer private\)/u);
  assert.match(html, /id="copy-leftover-fill-merchant"/u);
});

test("keyboard handler copies leftover fill merchant with quote when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.match(app, /if \(key === '"'\)/u);
  assert.match(app, /function copyLeftoverFillMerchantLabel\(/u);
  assert.match(app, /createLeftoverFillMerchantLabelMarkdown\(scenario\)/u);
  assert.match(app, /#copy-leftover-fill-merchant/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.doesNotMatch(app, /if \(key === '"'\) \{\s*event\.preventDefault\(\);\s*copyUncoveredLeftoverUnitCount/u);
  assert.doesNotMatch(app, /if \(key === '"'\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillUnitCount/u);
  assert.match(app, /if \(key === ":"\) \{\s*event\.preventDefault\(\);\s*copyUncoveredLeftoverUnitCount\(\);/u);
  assert.match(app, /if \(key === "'"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillUnitCount\(\);/u);
});

test("quote leftover fill merchant copy uses the existing leftover-fill merchant control", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(app, /if \(key === '"'\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillMerchantLabel\(\);/u);
  assert.match(app, /function copyLeftoverFillMerchantLabel\(/u);
  assert.match(app, /createLeftoverFillMerchantLabelMarkdown\(scenario\)/u);
  assert.match(html, /id="copy-leftover-fill-merchant"/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(key === '"'\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFill\(\);/u);
  assert.match(app, /if \(key === "y" \|\| key === ";"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFill\(\);/u);
});

test("shortcut help documents leftover fill merchant copy jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>_<\/kbd> Focus the leftover-fill merchant copy control, or leftover heading if missing/u);
  assert.match(html, /id="copy-leftover-fill-merchant"/u);
  assert.match(html, /id="residual-title"/u);
});

test("keyboard handler jumps to leftover fill merchant copy when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "_"\)/u);
  assert.match(app, /function focusLeftoverFillMerchantCopy\(/u);
  assert.match(app, /#copy-leftover-fill-merchant/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /#buyer-tab/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(key === "_"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillMerchantLabel/u);
  assert.match(app, /if \(key === '"'\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillMerchantLabel\(\);/u);
});

test("shortcut help documents hide offers with remaining capacity jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>\{<\/kbd> Focus hide offers with remaining capacity, or the offers list if missing/u);
  assert.match(html, /id="hide-offers-with-remaining-capacity"/u);
  assert.match(html, /id="offers-list"/u);
});

test("keyboard handler jumps to hide offers with remaining capacity when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "\{"\)/u);
  assert.match(app, /function focusHideOffersWithRemainingCapacity\(/u);
  assert.match(app, /#hide-offers-with-remaining-capacity/u);
  assert.match(app, /#offers-list/u);
  assert.match(app, /#merchant-tab/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(key === "\{"\) \{\s*event\.preventDefault\(\);\s*focusHideBuyersWithLeftover/u);
  assert.match(app, /if \(key === "="\) \{\s*event\.preventDefault\(\);\s*focusHideBuyersWithLeftover\(\);/u);
});

test("shortcut help documents leftover fill remaining capacity copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>\}<\/kbd> Copy leftover fill remaining capacity \(organizer private\)/u);
  assert.match(html, /id="copy-leftover-fill-remaining"/u);
  assert.match(html, /id="copy-leftover-fill-remaining"[^>]*aria-keyshortcuts="\}"/u);
});

test("keyboard handler copies leftover fill remaining capacity with brace when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.match(app, /if \(key === "\}"\)/u);
  assert.match(app, /function copyLeftoverFillRemainingCapacity\(/u);
  assert.match(app, /createLeftoverFillRemainingCapacityMarkdown\(scenario\)/u);
  assert.match(app, /#copy-leftover-fill-remaining/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.doesNotMatch(app, /if \(key === "\}"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillMerchantLabel/u);
  assert.doesNotMatch(app, /if \(key === "\}"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillUnitCount/u);
  assert.match(app, /if \(key === '"'\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillMerchantLabel\(\);/u);
  assert.match(app, /if \(key === "'"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillUnitCount\(\);/u);
});

test("brace leftover fill remaining copy uses the existing leftover-fill remaining control", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(app, /if \(key === "\}"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillRemainingCapacity\(\);/u);
  assert.match(app, /function copyLeftoverFillRemainingCapacity\(/u);
  assert.match(app, /createLeftoverFillRemainingCapacityMarkdown\(scenario\)/u);
  assert.match(html, /id="copy-leftover-fill-remaining"/u);
  assert.match(html, /aria-keyshortcuts="\}"/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(key === "\}"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFill\(\);/u);
  assert.match(app, /if \(key === "y" \|\| key === ";"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFill\(\);/u);
});

test("shortcut help documents leftover fill remaining capacity copy jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>\+<\/kbd> Focus the leftover-fill remaining copy control, or leftover heading if missing/u);
  assert.match(html, /id="copy-leftover-fill-remaining"/u);
  assert.match(html, /id="residual-title"/u);
});

test("keyboard handler jumps to leftover fill remaining copy when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "\+"\)/u);
  assert.match(app, /function focusLeftoverFillRemainingCopy\(/u);
  assert.match(app, /#copy-leftover-fill-remaining/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /#buyer-tab/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(key === "\+"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillRemainingCapacity/u);
  assert.doesNotMatch(app, /if \(key === "\+"\) \{\s*event\.preventDefault\(\);\s*focusHideBuyersWithLeftover/u);
  assert.match(app, /if \(key === "\}"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillRemainingCapacity\(\);/u);
  assert.match(app, /if \(key === "="\) \{\s*event\.preventDefault\(\);\s*focusHideBuyersWithLeftover\(\);/u);
});

test("shortcut help documents hide unserved buyers jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>\|<\/kbd> Focus hide unserved buyers, or the buyer list if missing/u);
  assert.match(html, /id="hide-unserved-buyers"/u);
  assert.match(html, /id="hide-unserved-buyers"[^>]*aria-keyshortcuts="\|"/u);
  assert.match(html, /id="buyers-list"/u);
});

test("keyboard handler jumps to hide unserved buyers when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "\|"\)/u);
  assert.match(app, /function focusHideUnservedBuyers\(/u);
  assert.match(app, /#hide-unserved-buyers/u);
  assert.match(app, /#buyers-list/u);
  assert.match(app, /#buyer-tab/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(key === "\|"\) \{\s*event\.preventDefault\(\);\s*focusHideOffersWithRemainingCapacity/u);
  assert.match(app, /if \(key === "\{"\) \{\s*event\.preventDefault\(\);\s*focusHideOffersWithRemainingCapacity\(\);/u);
});

test("shortcut help documents leftover fill fulfillment copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>~<\/kbd> Copy leftover fill fulfillment \(organizer private\)/u);
  assert.match(html, /id="copy-leftover-fill-fulfillment"/u);
  assert.match(html, /id="copy-leftover-fill-fulfillment"[^>]*aria-keyshortcuts="~"/u);
});

test("keyboard handler copies leftover fill fulfillment with tilde when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /const key = event\.key\.length === 1 \? event\.key\.toLowerCase\(\) : event\.key;/u);
  assert.match(app, /if \(key === "~"\)/u);
  assert.match(app, /function copyLeftoverFillFulfillment\(/u);
  assert.match(app, /createLeftoverFillFulfillmentMarkdown\(scenario\)/u);
  assert.match(app, /#copy-leftover-fill-fulfillment/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.match(app, /organizer-private Markdown/u);
  assert.doesNotMatch(app, /if \(key === "~"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillRemainingCapacity/u);
  assert.doesNotMatch(app, /if \(key === "~"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillMerchantLabel/u);
  assert.match(app, /if \(key === "\}"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillRemainingCapacity\(\);/u);
  assert.match(app, /if \(key === '"'\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillMerchantLabel\(\);/u);
});

test("tilde leftover fill fulfillment copy uses the existing leftover-fill fulfillment control", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(app, /if \(key === "~"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillFulfillment\(\);/u);
  assert.match(app, /function copyLeftoverFillFulfillment\(/u);
  assert.match(app, /createLeftoverFillFulfillmentMarkdown\(scenario\)/u);
  assert.match(html, /id="copy-leftover-fill-fulfillment"/u);
  assert.match(html, /aria-keyshortcuts="~"/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(key === "~"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFill\(\);/u);
  assert.match(app, /if \(key === "y" \|\| key === ";"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFill\(\);/u);
});

test("shortcut help documents leftover fill fulfillment copy jump", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<kbd>!<\/kbd> Focus the leftover-fill fulfillment copy control, or leftover heading if missing/u);
  assert.match(html, /id="copy-leftover-fill-fulfillment"/u);
  assert.match(html, /id="residual-title"/u);
});

test("keyboard handler jumps to leftover fill fulfillment copy when not typing", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /if \(key === "!"\)/u);
  assert.match(app, /function focusLeftoverFillFulfillmentCopy\(/u);
  assert.match(app, /#copy-leftover-fill-fulfillment/u);
  assert.match(app, /#residual-title/u);
  assert.match(app, /#buyer-tab/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(key === "!"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillFulfillment/u);
  assert.doesNotMatch(app, /if \(key === "!"\) \{\s*event\.preventDefault\(\);\s*focusLeftoverFillRemainingCopy/u);
  assert.match(app, /if \(key === "~"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillFulfillment\(\);/u);
});

test("apostrophe leftover fill unit-count copy uses the existing leftover-fill-units control", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(app, /if \(key === "'"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFillUnitCount\(\);/u);
  assert.match(app, /function copyLeftoverFillUnitCount\(/u);
  assert.match(app, /createLeftoverFillUnitCountMarkdown\(scenario\)/u);
  assert.match(html, /id="copy-leftover-fill-units"/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.doesNotMatch(app, /if \(key === "'"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFill\(\);/u);
  assert.match(app, /if \(key === "y" \|\| key === ";"\) \{\s*event\.preventDefault\(\);\s*copyLeftoverFill\(\);/u);
});

test("Export private buyer report stays organizer-private in the buyer room", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  const report = buyerPanel.slice(buyerPanel.indexOf('id="buyer-report"'), buyerPanel.indexOf("Capacity leftover"));
  assert.match(report, /This export is organizer-private/u);
  assert.equal(merchantPanel.includes("buyer-report"), false);
  assert.match(app, /organizer private/u);
  assert.match(app, /This is not a merchant export/u);
});
