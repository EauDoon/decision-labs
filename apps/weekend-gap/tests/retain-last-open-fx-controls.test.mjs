import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { DEFAULT_SCENARIO, PRESETS } from "../src/model.js";

test("1.5.23 keeps Insert ArrowDown ArrowLeft last-open-FX controls and PageUp PageDown ArrowUp", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-open-fx"[^>]*aria-keyshortcuts="Insert"/);
  assert.match(html, /<kbd>Insert<\/kbd>/);
  assert.match(html, /<kbd>ArrowDown<\/kbd>/);
  assert.match(html, /<kbd>ArrowLeft<\/kbd>/);
  assert.match(html, /id="gantt-hide-weekend-fx-open"[^>]*aria-keyshortcuts="ArrowLeft"/);
  assert.match(html, /id="copy-last-open-payout"[^>]*aria-keyshortcuts="PageUp"/);
  assert.match(html, /<kbd>PageUp<\/kbd>/);
  assert.match(html, /<kbd>PageDown<\/kbd>/);
  assert.match(html, /<kbd>ArrowUp<\/kbd>/);
  assert.match(html, /id="gantt-hide-weekend-payout-open"[^>]*aria-keyshortcuts="ArrowUp"/);
  assert.match(html, /id="copy-last-closed-fx"[^>]*aria-keyshortcuts="Delete"/);
  assert.match(html, /id="gantt-hide-weekend-payout-closed"[^>]*aria-keyshortcuts="ArrowRight"/);
  assert.match(html, /data-preset="saturdayLateBankOpen"/);
  assert.match(html, /data-preset="fridayLateBankOpen"/);
  assert.match(app, /event\.key === "Insert"/);
  assert.match(app, /copyLastOpenFxHourMarkdown\(\)/);
  assert.match(app, /event\.key === "ArrowDown"/);
  assert.match(app, /jumpToLastOpenFxCopy\(\)/);
  assert.match(app, /event\.key === "ArrowLeft"/);
  assert.match(app, /jumpToHideWeekendFxOpenFilter\(\)/);
  assert.match(app, /event\.key === "PageUp"/);
  assert.match(app, /copyLastOpenPayoutHourMarkdown\(\)/);
  assert.match(app, /event\.key === "PageDown"/);
  assert.match(app, /jumpToLastOpenPayoutCopy\(\)/);
  assert.match(app, /event\.key === "ArrowUp"/);
  assert.match(app, /jumpToHideWeekendPayoutOpenFilter\(\)/);
  assert.match(app, /event\.key === "Delete"/);
  assert.match(app, /copyLastClosedFxHourMarkdown\(\)/);
  assert.match(app, /event\.key === "F2"/);
  assert.match(app, /jumpToLastClosedFxCopy\(\)/);
  assert.match(app, /event\.key === "ArrowRight"/);
  assert.match(app, /jumpToHideWeekendPayoutClosedFilter\(\)/);
  assert.equal(PRESETS.saturdayLateBankOpen.saturdayLateBankOpen, true);
  assert.equal(PRESETS.fridayEarlyBankOpen.fridayEarlyBankOpen, true);
  assert.equal(PRESETS.fridayLateBankOpen.fridayLateBankOpen, true);
  assert.equal(PRESETS.fridayLateBankOpen.fridayEarlyBankOpen, false);
  assert.equal(PRESETS.fridayLateBankOpen.saturdayLateBankOpen, false);
  assert.equal(PRESETS.fridayLateBankOpen.saturdayEarlyBankOpen, false);
  assert.equal(PRESETS.fridayLateBankOpen.fridayEarlyIssuerOpen, false);
  assert.equal(
    PRESETS.fridayLateBankOpen.bankOpenStartHour,
    DEFAULT_SCENARIO.bankOpenStartHour,
    "friday late bank open is not earlyMondayBankOpen (that preset uses bankOpenStartHour 7)"
  );
  assert.notDeepEqual(PRESETS.fridayLateBankOpen, PRESETS.fridayEarlyBankOpen);
  assert.notDeepEqual(PRESETS.fridayLateBankOpen, PRESETS.saturdayLateBankOpen);
  assert.notDeepEqual(PRESETS.fridayLateBankOpen, PRESETS.saturdayEarlyBankOpen);
  assert.notDeepEqual(PRESETS.fridayLateBankOpen, PRESETS.fridayEarlyIssuerOpen);
  assert.equal(DEFAULT_SCENARIO.fridayLateBankOpen, false);
  assert.equal(DEFAULT_SCENARIO.saturdayLateBankOpen, false);
  assert.equal(DEFAULT_SCENARIO.fridayEarlyBankOpen, false);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "Insert"') !== handler.indexOf('event.key === "Delete"'));
  assert.ok(handler.indexOf('event.key === "ArrowDown"') !== handler.indexOf('event.key === "F2"'));
  assert.ok(handler.indexOf('event.key === "ArrowLeft"') !== handler.indexOf('event.key === "ArrowRight"'));
  assert.ok(handler.indexOf('event.key === "PageUp"') !== handler.indexOf('event.key === "Delete"'));
  assert.ok(handler.indexOf('event.key === "PageDown"') !== handler.indexOf('event.key === "F2"'));
  assert.ok(handler.indexOf('event.key === "ArrowUp"') !== handler.indexOf('event.key === "ArrowRight"'));
});
