import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { DEFAULT_SCENARIO, PRESETS } from "../src/model.js";

test("1.5.22 keeps PageUp PageDown ArrowUp last-open-payout controls and Friday bank presets", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-open-payout"[^>]*aria-keyshortcuts="PageUp"/);
  assert.match(html, /<kbd>PageUp<\/kbd>/);
  assert.match(html, /<kbd>PageDown<\/kbd>/);
  assert.match(html, /<kbd>ArrowUp<\/kbd>/);
  assert.match(html, /id="gantt-hide-weekend-payout-open"[^>]*aria-keyshortcuts="ArrowUp"/);
  assert.match(html, /data-preset="fridayEarlyBankOpen"/);
  assert.match(html, /id="copy-last-open-fx"[^>]*aria-keyshortcuts="Insert"/);
  assert.match(html, /id="gantt-hide-weekend-fx-open"[^>]*aria-keyshortcuts="ArrowLeft"/);
  assert.match(app, /event\.key === "PageUp"/);
  assert.match(app, /copyLastOpenPayoutHourMarkdown\(\)/);
  assert.match(app, /event\.key === "PageDown"/);
  assert.match(app, /jumpToLastOpenPayoutCopy\(\)/);
  assert.match(app, /event\.key === "ArrowUp"/);
  assert.match(app, /jumpToHideWeekendPayoutOpenFilter\(\)/);
  assert.match(app, /event\.key === "Insert"/);
  assert.match(app, /copyLastOpenFxHourMarkdown\(\)/);
  assert.match(app, /event\.key === "ArrowDown"/);
  assert.match(app, /jumpToLastOpenFxCopy\(\)/);
  assert.match(app, /event\.key === "ArrowLeft"/);
  assert.match(app, /jumpToHideWeekendFxOpenFilter\(\)/);
  assert.equal(PRESETS.fridayEarlyBankOpen.fridayEarlyBankOpen, true);
  assert.equal(PRESETS.saturdayEarlyBankOpen.saturdayEarlyBankOpen, true);
  assert.equal(PRESETS.saturdayLateBankOpen.saturdayLateBankOpen, true);
  assert.equal(PRESETS.saturdayLateBankOpen.saturdayEarlyBankOpen, false);
  assert.equal(PRESETS.saturdayLateBankOpen.fridayEarlyBankOpen, false);
  assert.equal(PRESETS.saturdayLateBankOpen.fridayEarlyIssuerOpen, false);
  assert.equal(
    PRESETS.saturdayLateBankOpen.bankOpenStartHour,
    DEFAULT_SCENARIO.bankOpenStartHour,
    "saturday late bank open is not earlyMondayBankOpen (that preset uses bankOpenStartHour 7)"
  );
  assert.notDeepEqual(PRESETS.saturdayLateBankOpen, PRESETS.saturdayEarlyBankOpen);
  assert.notDeepEqual(PRESETS.saturdayLateBankOpen, PRESETS.fridayEarlyBankOpen);
  assert.notDeepEqual(PRESETS.saturdayLateBankOpen, PRESETS.fridayEarlyIssuerOpen);
  assert.notDeepEqual(PRESETS.saturdayLateBankOpen, PRESETS.sundayLateBankClose);
  assert.notDeepEqual(PRESETS.saturdayLateBankOpen, PRESETS.earlyMondayBankOpen);
  assert.equal(DEFAULT_SCENARIO.saturdayEarlyBankOpen, false);
  assert.equal(DEFAULT_SCENARIO.fridayEarlyBankOpen, false);
  assert.equal(DEFAULT_SCENARIO.saturdayLateBankOpen, false);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "PageUp"') !== handler.indexOf('event.key === "Insert"'));
  assert.ok(handler.indexOf('event.key === "PageDown"') !== handler.indexOf('event.key === "ArrowDown"'));
  assert.ok(handler.indexOf('event.key === "ArrowUp"') !== handler.indexOf('event.key === "ArrowLeft"'));
});
