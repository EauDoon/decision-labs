import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

test("standard navigation and function keys keep their browser behavior outside fields", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const typingStart = app.indexOf("function isTypingTarget");
  const handlerStart = app.indexOf("function handleShortcut");
  const handlerEnd = app.indexOf("\nfunction focusBuyersList", handlerStart);
  assert.ok(typingStart >= 0 && handlerStart > typingStart && handlerEnd > handlerStart);
  const handleShortcut = vm.runInNewContext(
    `${app.slice(typingStart, handlerStart)}${app.slice(handlerStart, handlerEnd)}; handleShortcut`,
    { Element: class Element {}, document: { querySelector: () => null } },
  );
  const keys = ["Home", "End", "PageUp", "PageDown", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Delete", "Insert", "Backspace",
    "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"];
  for (const key of keys) {
    for (const shiftKey of [false, true]) {
      let prevented = false;
      handleShortcut({ key, shiftKey, defaultPrevented: false, metaKey: false, ctrlKey: false, altKey: false, target: {}, preventDefault() { prevented = true; } });
      assert.equal(prevented, false, `${shiftKey ? "Shift+" : ""}${key} should not be prevented on the document`);
    }
  }
});

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

test("shortcut help documents leftover fill evidence copy on y", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /<kbd>y<\/kbd> Copy leftover fill evidence \(organizer private\)/u);
  assert.match(html, /id="copy-leftover-fill-evidence"/u);
  assert.match(app, /if \(key === "y"\)/u);
  assert.match(app, /copyLeftoverFillEvidence\(\)/u);
  assert.doesNotMatch(app, /key === ";"\)/u);
});

test("retired punctuation, digit, and shifted keys stay unbound", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const typingStart = app.indexOf("function isTypingTarget");
  const handlerStart = app.indexOf("function handleShortcut");
  const handlerEnd = app.indexOf("\nfunction focusBuyersList", handlerStart);
  const handler = app.slice(handlerStart, handlerEnd);
  for (const key of [",", ".", "[", "]", "'", "<", ">", ":", "-", "=", '"', "_", "{", "}", "+", "|", "~", "!", "@", "(", ")", "#", "*", "&", "%", "$", "^", "`", ";", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]) {
    assert.equal(handler.includes(`key === "${key}"`), false, `${key} should not be bound`);
  }
  assert.equal(handler.includes('key === "/" &&'), false, "/ should not be bound");
  assert.equal(/Shift\+F\d/.test(handler), false);
  const handled = vm.runInNewContext(
    `${app.slice(typingStart, handlerStart)}${app.slice(handlerStart, handlerEnd)}; handleShortcut`,
    { Element: class Element {}, document: { querySelector: () => null } },
  );
  for (const key of [",", ".", "5", "8", "1", "4", "}", "~", "$"]) {
    let prevented = false;
    handled({ key, shiftKey: false, defaultPrevented: false, metaKey: false, ctrlKey: false, altKey: false, target: {}, preventDefault() { prevented = true; } });
    assert.equal(prevented, false, `${key} should keep its browser behavior`);
  }
});

test("help list matches the handled letter keys exactly", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const handlerStart = app.indexOf("function handleShortcut");
  const handlerEnd = app.indexOf("\nfunction focusBuyersList", handlerStart);
  const handler = app.slice(handlerStart, handlerEnd);
  const helpStart = html.indexOf('<ul class="shortcut-list">');
  const helpEnd = html.indexOf("</ul>", helpStart);
  const help = html.slice(helpStart, helpEnd);
  for (const key of ["u", "r", "e", "n", "a", "m", "o", "b", "w", "l", "p", "v", "j", "d", "s", "c", "t", "f", "h", "k", "g", "i", "q", "x", "y", "z"]) {
    assert.equal(handler.includes(`key === "${key}"`), true, `${key} should stay handled`);
    assert.match(help, new RegExp(`<kbd>${key}</kbd>`, "u"), `${key} should stay listed`);
  }
  assert.match(help, /<kbd>\?<\/kbd> Open this help/u);
  assert.match(help, /<kbd>Esc<\/kbd>/u);
  assert.doesNotMatch(help, /<kbd>,<\/kbd>/u);
  assert.doesNotMatch(help, /<kbd>1<\/kbd>/u);
});
