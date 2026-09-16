import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { DEFAULT_SCENARIO, PRESETS } from "../src/model.js";

test("1.5.21 retains the last-open-bank control and Saturday bank presets", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-open-bank"[^>]*aria-keyshortcuts="4"/);
  assert.match(html, /<kbd>4<\/kbd>/);
  assert.match(html, /id="gantt-hide-weekend-bank-open"/);
  assert.match(html, /data-preset="saturdayEarlyBankOpen"/);
  assert.match(html, /id="copy-last-open-payout"/);
  assert.match(html, /id="gantt-hide-weekend-payout-open"/);
  assert.match(app, /event\.key === "4"/);
  assert.match(app, /copyLastOpenBankHourMarkdown\(\)/);
  assert.match(app, /jumpToLastOpenBankCopy\(\)/);
  assert.match(app, /jumpToHideWeekendBankOpenFilter\(\)/);
  assert.match(app, /copyLastOpenPayoutHourMarkdown\(\)/);
  assert.match(app, /jumpToLastOpenPayoutCopy\(\)/);
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
});
