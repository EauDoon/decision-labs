import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { DEFAULT_SCENARIO, PRESETS } from "../src/model.js";

test("1.5.27 retains weekday FX controls and Sunday FX presets", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-last-weekday-fx-closed"/);
  assert.match(html, /id="gantt-hide-weekend-fx-open"/);
  assert.match(html, /id="copy-last-weekend-fx-closed"/);
  assert.match(html, /id="gantt-hide-weekday-fx-closed"/);
  assert.match(html, /data-preset="sundayLateFxOpen"/);
  assert.match(html, /data-preset="sundayEarlyFxOpen"/);
  assert.match(app, /copyLastWeekdayFxClosedHourMarkdown\(\)/);
  assert.match(app, /jumpToLastWeekdayFxClosedCopy\(\)/);
  assert.match(app, /jumpToHideWeekendFxOpenFilter\(\)/);
  assert.match(app, /copyLastWeekendFxClosedHourMarkdown\(\)/);
  assert.match(app, /if \(event\.defaultPrevented\) return/);
  assert.equal(PRESETS.sundayLateFxOpen.sundayLateFxOpen, true);
  assert.equal(PRESETS.sundayEarlyFxOpen.sundayEarlyFxOpen, true);
  assert.equal(PRESETS.sundayEarlyFxOpen.sundayLateFxOpen, false);
  assert.equal(DEFAULT_SCENARIO.sundayEarlyFxOpen, false);
  assert.equal(DEFAULT_SCENARIO.sundayLateFxOpen, false);
});
