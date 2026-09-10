import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  clonePreset,
  createWinnerInspectorSummaryMarkdown,
  computeResidualCoverage,
  evaluateMarket
} from "../src/model.js";

test("winner inspector summary Markdown is organizer-private leftover counts", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].label = "SECRET_LABEL";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createWinnerInspectorSummaryMarkdown(scenario);
  const market = evaluateMarket(scenario);
  const coverage = computeResidualCoverage(scenario);
  assert.match(markdown, /organizer private/);
  assert.match(markdown, /not a merchant export/);
  assert.match(markdown, new RegExp(`Offer: ${market.winner.offer.merchant} / ${market.winner.offer.variant}`));
  assert.match(markdown, new RegExp(`Leftover buyers: ${coverage.leftoverBuyerCount}`));
  assert.match(markdown, new RegExp(`Leftover units: ${coverage.leftoverUnits}`));
  assert.match(markdown, /Residual coverage/);
  assert.match(markdown, /Tertiary fill:/);
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes('"selectedBuyerIds":'), false);
  assert.equal(markdown.includes('"allocations":'), false);
});

test("the buyer room copies winner inspector summary and the merchant table does not", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(buyerPanel, /id="copy-winner-inspector"/u);
  assert.match(buyerPanel, /organizer private/u);
  assert.equal(merchantPanel.includes("copy-winner-inspector"), false);
  assert.match(app, /createWinnerInspectorSummaryMarkdown\(/u);
});
