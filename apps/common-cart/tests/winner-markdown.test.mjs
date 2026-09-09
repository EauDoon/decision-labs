import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { clonePreset, createWinnerAggregatesMarkdown, evaluateMarket } from "../src/model.js";

test("winner aggregates markdown uses counts and omits private buyer rows", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].label = "SECRET_LABEL";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 123456.78;
  const markdown = createWinnerAggregatesMarkdown(scenario);
  const market = evaluateMarket(scenario);
  assert.match(markdown, /# Common Cart winner aggregates/);
  assert.match(markdown, /AUD/);
  assert.match(markdown, new RegExp(`Fulfilled units: ${market.winner.fulfilledUnits}`));
  assert.match(markdown, new RegExp(`Included buyers: ${market.winner.deliveredBuyers}`));
  assert.match(markdown, new RegExp(`Landed total: ${market.winner.totalCost}`));
  assert.match(markdown, /Harbour Roasters/);
  assert.equal(markdown.includes("SECRET_TITLE"), false);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("123456.78"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes('"selectedBuyerIds":'), false);
  assert.equal(markdown.includes('"allocations":'), false);
  assert.match(markdown, /omit private buyer labels, IDs, budgets, and allocations/);
});

test("winner aggregates markdown names residual fills without buyer rows", () => {
  const scenario = clonePreset("neighbourhood");
  const labels = scenario.buyers.map((buyer) => buyer.label);
  const markdown = createWinnerAggregatesMarkdown(scenario);
  for (const label of labels) assert.equal(markdown.includes(label), false);
  assert.match(markdown, /Leftover after winner:/);
  assert.match(markdown, /Still unfilled:/);
  assert.match(markdown, /Tertiary fill:/);
});

test("the merchant table can copy winner aggregates as Markdown", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="copy-winner-aggregates"/u);
  assert.match(html, /Copy winner aggregates/u);
  assert.match(app, /createWinnerAggregatesMarkdown\(/u);
  assert.match(app, /navigator\.clipboard/u);
});
