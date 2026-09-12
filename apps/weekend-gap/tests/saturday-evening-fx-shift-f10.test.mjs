import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("keyboard Shift+F10 stays first weekday-FX-open copy after Saturday evening FX open", async () => {
  const html = (await readFile(new URL("../index.html", import.meta.url), "utf8")).replaceAll("\r\n", "\n");
  const app = (await readFile(new URL("../src/app.js", import.meta.url), "utf8")).replaceAll("\r\n", "\n");
  assert.match(html, /data-preset="saturdayEveningFxOpen"/);
  assert.match(html, /id="saturdayEveningFxOpen"/);
  assert.match(html, /id="copy-first-weekday-fx-open"[^>]*aria-keyshortcuts="Shift\+F10"/);
  assert.match(html, /id="copy-last-weekday-fx-closed"[^>]*aria-keyshortcuts="F10"/);
  assert.doesNotMatch(html, /id="copy-last-weekday-fx-open"[^>]*aria-keyshortcuts="Shift\+F10"/);
  const handler = app.slice(app.indexOf('document.addEventListener("keydown"'));
  const shiftF10 = handler.indexOf('event.key === "F10" && event.shiftKey');
  const unshiftedF10 = handler.lastIndexOf('event.key === "F10"');
  assert.ok(shiftF10 !== -1 && unshiftedF10 > shiftF10);
  const shiftSlice = handler.slice(shiftF10, shiftF10 + 180);
  assert.match(shiftSlice, /copyFirstWeekdayFxOpenHourMarkdown\(\)/);
  assert.doesNotMatch(shiftSlice, /copyLastWeekdayFxOpenHourMarkdown/);
  assert.doesNotMatch(shiftSlice, /copyLastWeekdayFxClosedHourMarkdown/);
});
