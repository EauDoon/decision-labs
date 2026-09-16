import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { DEFAULT_SCENARIO, PRESETS } from "../src/model.js";

test("1.5.23 retains last-open-FX controls and Friday bank presets", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-open-fx"/);
  assert.match(html, /id="gantt-hide-weekend-fx-open"/);
  assert.match(html, /id="copy-last-open-payout"/);
  assert.match(html, /id="gantt-hide-weekend-payout-open"/);
  assert.match(html, /id="copy-last-closed-fx"/);
  assert.match(html, /id="gantt-hide-weekend-payout-closed"/);
  assert.match(html, /data-preset="saturdayLateBankOpen"/);
  assert.match(html, /data-preset="fridayLateBankOpen"/);
  assert.match(app, /copyLastOpenFxHourMarkdown\(\)/);
  assert.match(app, /jumpToLastOpenFxCopy\(\)/);
  assert.match(app, /jumpToHideWeekendFxOpenFilter\(\)/);
  assert.match(app, /copyLastOpenPayoutHourMarkdown\(\)/);
  assert.match(app, /jumpToLastOpenPayoutCopy\(\)/);
  assert.match(app, /jumpToHideWeekendPayoutOpenFilter\(\)/);
  assert.match(app, /copyLastClosedFxHourMarkdown\(\)/);
  assert.match(app, /jumpToLastClosedFxCopy\(\)/);
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
});
