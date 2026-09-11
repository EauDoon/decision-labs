import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { DEFAULT_SCENARIO, PRESETS } from "../src/model.js";

test("1.5.21 keeps 4 Home End last-open-bank controls and Saturday bank presets", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-open-bank"[^>]*aria-keyshortcuts="4"/);
  assert.match(html, /<kbd>4<\/kbd>/);
  assert.match(html, /<kbd>Home<\/kbd>/);
  assert.match(html, /<kbd>End<\/kbd>/);
  assert.match(html, /id="gantt-hide-weekend-bank-open"[^>]*aria-keyshortcuts="End"/);
  assert.match(html, /data-preset="saturdayEarlyBankOpen"/);
  assert.match(html, /id="copy-last-open-payout"[^>]*aria-keyshortcuts="PageUp"/);
  assert.match(html, /id="gantt-hide-weekend-payout-open"[^>]*aria-keyshortcuts="ArrowUp"/);
  assert.match(app, /event\.key === "4"/);
  assert.match(app, /copyLastOpenBankHourMarkdown\(\)/);
  assert.match(app, /event\.key === "Home"/);
  assert.match(app, /jumpToLastOpenBankCopy\(\)/);
  assert.match(app, /event\.key === "End"/);
  assert.match(app, /jumpToHideWeekendBankOpenFilter\(\)/);
  assert.match(app, /event\.key === "PageUp"/);
  assert.match(app, /copyLastOpenPayoutHourMarkdown\(\)/);
  assert.match(app, /event\.key === "PageDown"/);
  assert.match(app, /jumpToLastOpenPayoutCopy\(\)/);
  assert.match(app, /event\.key === "ArrowUp"/);
  assert.match(app, /jumpToHideWeekendPayoutOpenFilter\(\)/);
  assert.equal(PRESETS.saturdayEarlyBankOpen.saturdayEarlyBankOpen, true);
  assert.equal(PRESETS.fridayEarlyBankOpen.fridayEarlyBankOpen, true);
  assert.equal(PRESETS.fridayEarlyBankOpen.saturdayEarlyBankOpen, false);
  assert.equal(PRESETS.fridayEarlyBankOpen.fridayEarlyIssuerOpen, false);
  assert.equal(PRESETS.fridayEarlyBankOpen.saturdayEarlyIssuerOpen, false);
  assert.equal(PRESETS.fridayEarlyBankOpen.sundayLateBankClose, false);
  assert.equal(
    PRESETS.fridayEarlyBankOpen.bankOpenStartHour,
    DEFAULT_SCENARIO.bankOpenStartHour,
    "friday early bank open is not earlyMondayBankOpen (that preset uses bankOpenStartHour 7)"
  );
  assert.notDeepEqual(PRESETS.fridayEarlyBankOpen, PRESETS.saturdayEarlyBankOpen);
  assert.notDeepEqual(PRESETS.fridayEarlyBankOpen, PRESETS.fridayEarlyIssuerOpen);
  assert.notDeepEqual(PRESETS.fridayEarlyBankOpen, PRESETS.saturdayEarlyIssuerOpen);
  assert.notDeepEqual(PRESETS.fridayEarlyBankOpen, PRESETS.sundayLateBankClose);
  assert.notDeepEqual(PRESETS.fridayEarlyBankOpen, PRESETS.earlyMondayBankOpen);
  assert.notDeepEqual(PRESETS.fridayEarlyBankOpen, PRESETS.saturdayLateBankOpen);
  assert.equal(DEFAULT_SCENARIO.saturdayEarlyBankOpen, false);
  assert.equal(DEFAULT_SCENARIO.fridayEarlyBankOpen, false);
  assert.equal(DEFAULT_SCENARIO.saturdayLateBankOpen, false);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "4"') !== handler.indexOf('event.key === "PageUp"'));
  assert.ok(handler.indexOf('event.key === "Home"') !== handler.indexOf('event.key === "PageDown"'));
  assert.ok(handler.indexOf('event.key === "End"') !== handler.indexOf('event.key === "ArrowUp"'));
});
