import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  clonePreset,
  compareRoomsByOfferIdentity,
  createOfferIdentityCompareMarkdown,
  evaluateMarket,
  validateScenario
} from "../src/model.js";

function secretRoom(name) {
  const scenario = clonePreset(name);
  scenario.title = "SECRET_TITLE";
  scenario.buyers[0].label = "SECRET_LABEL";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  return scenario;
}

test("offer identity compare lists missing ids and does not zero-fill them", () => {
  const left = clonePreset("neighbourhood");
  const right = clonePreset("neighbourhood");
  const extra = { ...right.offers[0], id: "O09", merchant: "Annex Bid" };
  right.offers = right.offers.filter((offer) => offer.id !== "O03").concat(extra);
  const comparison = compareRoomsByOfferIdentity(left, right);
  assert.deepEqual(comparison.shared.map((entry) => entry.offerId), ["O01", "O02"]);
  assert.deepEqual(comparison.missingFromRight, ["O03"]);
  assert.deepEqual(comparison.missingFromLeft, ["O09"]);
  assert.equal(comparison.shared.some((entry) => entry.offerId === "O03"), false);
  assert.equal(comparison.shared.some((entry) => entry.offerId === "O09"), false);
  const o01 = comparison.shared.find((entry) => entry.offerId === "O01");
  assert.equal(o01.left.fulfilledUnits, evaluateMarket(left).results.find((result) => result.offer.id === "O01").fulfilledUnits);
  assert.equal(o01.left.includedBuyerCount, evaluateMarket(left).results.find((result) => result.offer.id === "O01").deliveredBuyers);
  assert.equal(Object.hasOwn(comparison, "missingFromRight"), true);
  const markdown = createOfferIdentityCompareMarkdown(left, right);
  assert.match(markdown, /## Missing from right/);
  assert.match(markdown, /^- O03$/m);
  assert.match(markdown, /## Missing from left/);
  assert.match(markdown, /^- O09$/m);
  assert.doesNotMatch(markdown, /O03: left 0 units|O03.*right 0 units|O09: left 0 units/u);
  assert.match(markdown, /O01/);
  assert.match(markdown, /not filled with zeros/);
});

test("offer identity compare is merchant-facing counts and does not mutate either room", () => {
  const left = secretRoom("neighbourhood");
  const right = secretRoom("studio");
  const before = JSON.stringify([left, right]);
  const markdown = createOfferIdentityCompareMarkdown(left, right);
  const json = JSON.stringify(compareRoomsByOfferIdentity(left, right));
  assert.equal(JSON.stringify([left, right]), before);
  for (const text of [markdown, json]) {
    assert.equal(text.includes("SECRET_TITLE"), false);
    assert.equal(text.includes("SECRET_LABEL"), false);
    assert.equal(text.includes("SECRET_ID"), false);
    assert.equal(text.includes("987654.32"), false);
    assert.equal(text.includes("maxUnitPrice"), false);
    assert.equal(text.includes("leftoverBuyerIds"), false);
    assert.equal(text.includes('"selectedBuyerIds":'), false);
    assert.equal(text.includes('"allocations":'), false);
  }
  assert.match(markdown, /omit private buyer labels, IDs, budgets, and allocations/);
});

test("offer identity compare omits landed totals when currencies differ", () => {
  const left = clonePreset("neighbourhood");
  const right = clonePreset("neighbourhood");
  right.currency = "USD";
  const comparison = compareRoomsByOfferIdentity(left, right);
  assert.equal(comparison.sameCurrency, false);
  assert.equal(comparison.shared.every((entry) => entry.left.landedTotal === null && entry.right.landedTotal === null), true);
  const markdown = createOfferIdentityCompareMarkdown(left, right);
  assert.match(markdown, /different currencies/);
  assert.match(markdown, /landed total omitted/);
});

test("comparing two JSON files does not replace the open room", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  assert.match(merchantPanel, /id="compare-offer-json-left"/u);
  assert.match(merchantPanel, /id="compare-offer-json-right"/u);
  assert.match(merchantPanel, /id="compare-offer-identity"/u);
  assert.match(merchantPanel, /The open room stays in place/u);
  assert.match(app, /function compareOfferIdentityFiles\(/u);
  assert.match(app, /createOfferIdentityCompareMarkdown\(/u);
  assert.match(app, /The open room was not replaced/u);
  const compareFn = app.slice(app.indexOf("async function compareOfferIdentityFiles"), app.indexOf("async function importOffersCsv"));
  assert.doesNotMatch(compareFn, /scenario = /u);
});

test("offer identity compare validates both rooms", () => {
  assert.throws(() => compareRoomsByOfferIdentity({}, clonePreset("neighbourhood")));
  assert.throws(() => createOfferIdentityCompareMarkdown(clonePreset("neighbourhood"), { title: "Bad" }));
  validateScenario(clonePreset("neighbourhood"));
});
