import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  nextPayoutHourToMarkdown,
  runSimulation
} from "../src/model.js";

test("next-payout hour Markdown is one synthetic line with an honest empty", () => {
  const text = nextPayoutHourToMarkdown(DEFAULT_SCENARIO, 0);
  assert.equal(text, nextPayoutHourToMarkdown(DEFAULT_SCENARIO, 0));
  assert.equal(text.split("\n").length, 1);
  const nextHour = runSimulation(DEFAULT_SCENARIO).timeline[0].nextPayoutHour;
  assert.equal(nextHour, 0);
  assert.match(text, /^Next payout hour: Fri 15:00 \(hour 0\)\. /);
  assert.match(text, /Synthetic educational label/);
  assert.match(text, /not a live payout time/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
});

test("next-payout hour Markdown uses none when no payout window exists", () => {
  const empty = nextPayoutHourToMarkdown({ ...DEFAULT_SCENARIO, payoutThroughputAudPerHour: 0 }, 0);
  assert.equal(empty.split("\n").length, 1);
  assert.match(empty, /^Next payout hour: none\. /);
  assert.doesNotMatch(empty, /Hour: /);
  assert.doesNotMatch(empty, /timestamp|createdAt|exportedAt/i);
});

test("copy next-payout hour uses clipboard and a textarea fallback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-next-payout"/);
  assert.match(html, /Copy next-payout hour/);
  assert.match(html, /id="next-payout-copy-fallback"/);
  assert.match(app, /nextPayoutHourToMarkdown\(scenario, selectedHour\)/);
  assert.match(app, /next-payout-copy-fallback/);
  assert.match(app, /copyTextWithFallback/);
  assert.match(app, /Clipboard unavailable\. Copy the Markdown from the text box\./);
});
