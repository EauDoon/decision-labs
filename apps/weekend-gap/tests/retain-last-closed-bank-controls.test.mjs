import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { DEFAULT_SCENARIO, PRESETS } from "../src/model.js";

test("1.5.20 keeps 1 2 3 last-closed-bank controls and Friday issuer presets", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-closed-bank"[^>]*aria-keyshortcuts="1"/);
  assert.match(html, /<kbd>1<\/kbd>/);
  assert.match(html, /<kbd>2<\/kbd>/);
  assert.match(html, /<kbd>3<\/kbd>/);
  assert.match(html, /id="gantt-hide-weekend-bank-closed"[^>]*aria-keyshortcuts="3"/);
  assert.match(html, /data-preset="fridayEarlyIssuerOpen"/);
  assert.match(html, /id="copy-last-open-bank"[^>]*aria-keyshortcuts="4"/);
  assert.match(html, /id="gantt-hide-weekend-bank-open"[^>]*aria-keyshortcuts="End"/);
  assert.match(app, /event\.key === "1"/);
  assert.match(app, /copyLastClosedBankHourMarkdown\(\)/);
  assert.match(app, /event\.key === "2"/);
  assert.match(app, /jumpToLastClosedBankCopy\(\)/);
  assert.match(app, /event\.key === "3"/);
  assert.match(app, /jumpToHideWeekendBankClosedFilter\(\)/);
  assert.match(app, /event\.key === "8"/);
  assert.match(app, /copyLastClosedIssuerHourMarkdown\(\)/);
  assert.match(app, /event\.key === "9"/);
  assert.match(app, /jumpToLastClosedIssuerCopy\(\)/);
  assert.match(app, /event\.key === "0"/);
  assert.match(app, /jumpToHideWeekendIssuerClosedFilter\(\)/);
  assert.equal(PRESETS.fridayEarlyIssuerOpen.fridayEarlyIssuerOpen, true);
  assert.equal(PRESETS.saturdayEarlyIssuerOpen.saturdayEarlyIssuerOpen, true);
  assert.equal(PRESETS.saturdayEarlyBankOpen.saturdayEarlyBankOpen, true);
  assert.equal(PRESETS.saturdayEarlyBankOpen.fridayEarlyIssuerOpen, false);
  assert.equal(PRESETS.saturdayEarlyBankOpen.saturdayEarlyIssuerOpen, false);
  assert.equal(PRESETS.saturdayEarlyBankOpen.sundayLateBankClose, false);
  assert.equal(
    PRESETS.saturdayEarlyBankOpen.bankOpenStartHour,
    DEFAULT_SCENARIO.bankOpenStartHour,
    "saturday early bank open is not earlyMondayBankOpen (that preset uses bankOpenStartHour 7)"
  );
  assert.notDeepEqual(PRESETS.saturdayEarlyBankOpen, PRESETS.fridayEarlyIssuerOpen);
  assert.notDeepEqual(PRESETS.saturdayEarlyBankOpen, PRESETS.saturdayEarlyIssuerOpen);
  assert.notDeepEqual(PRESETS.saturdayEarlyBankOpen, PRESETS.sundayLateBankClose);
  assert.notDeepEqual(PRESETS.saturdayEarlyBankOpen, PRESETS.earlyMondayBankOpen);
  assert.equal(DEFAULT_SCENARIO.fridayEarlyIssuerOpen, false);
  assert.equal(DEFAULT_SCENARIO.saturdayEarlyBankOpen, false);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  assert.ok(handler.indexOf('event.key === "1"') !== handler.indexOf('event.key === "4"'));
  assert.ok(handler.indexOf('event.key === "2"') !== handler.indexOf('event.key === "Home"'));
  assert.ok(handler.indexOf('event.key === "3"') !== handler.indexOf('event.key === "End"'));
  assert.ok(handler.indexOf('event.key === "3"') !== handler.indexOf('event.key === "0"'));
});
