import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ScenarioError,
  clonePreset,
  createOfferCsv,
  evaluateMarket,
  importOffersFromCsv,
  offerCsvTemplate,
  parseOfferCsv,
  presets,
  validateScenario
} from "../src/model.js";

const LEGACY = "name,capacity,unit price,shipping,fulfillment,variants";
const FULL = `${LEGACY},category,minimum,delivery,tiers,id`;
const script = fileURLToPath(new URL("../scripts/analyze.mjs", import.meta.url));

function winnerSummary(scenario) {
  const winner = evaluateMarket(scenario).winner;
  if (!winner) return null;
  return { id: winner.offer.id, fulfilledUnits: winner.fulfilledUnits, totalCost: winner.totalCost };
}

test("every preset's offers survive an unchanged offer CSV export and import", () => {
  const ids = Object.keys(presets);
  assert.ok(ids.length >= 60, `expected at least 60 presets, found ${ids.length}`);
  for (const id of ids) {
    const scenario = validateScenario(clonePreset(id));
    const back = importOffersFromCsv(scenario, createOfferCsv(scenario));
    assert.deepStrictEqual(back.offers, scenario.offers, `${id}: offers changed in the CSV round trip`);
    assert.deepStrictEqual(back.buyers, scenario.buyers, `${id}: buyers changed`);
    assert.deepStrictEqual(winnerSummary(back), winnerSummary(scenario), `${id}: winner changed`);
  }
});

test("offer CSV export writes every offer term after the original six columns", () => {
  const csv = createOfferCsv(clonePreset("tiers"));
  const [header, first] = csv.split("\r\n");
  assert.equal(header, FULL.split(",").map((name) => `"${name}"`).join(","));
  assert.match(first, /"10@24; 18@20","O01"$/u);
  const untiered = createOfferCsv(clonePreset("neighbourhood")).split("\r\n")[1];
  assert.match(untiered, /,"","O01"$/u);
});

test("a six-column offer CSV and the template still import with today's defaults", () => {
  const offers = parseOfferCsv(`${offerCsvTemplate()}A,20,26,2,shipping,Dark\r\nB,30,24,1,pickup,Dark\r\n`, { category: "Coffee" });
  assert.deepEqual(offers.map((offer) => offer.id), ["O01", "O02"]);
  for (const offer of offers) {
    assert.equal(offer.minimumUnits, 1);
    assert.equal(offer.deliveryDays, 7);
    assert.equal(offer.category, "Coffee");
    assert.equal(Object.hasOwn(offer, "tiers"), false);
  }
});

test("a 1.8.0-style offer CSV with category, minimum and delivery imports exactly as before", () => {
  const csv = `${LEGACY},category,minimum,delivery\nA,20,26,2,shipping,Dark,Beans,8,5\nB,30,24,1,pickup,Dark,,,\n`;
  const offers = parseOfferCsv(csv, { category: "Coffee" });
  assert.deepEqual(offers, [
    { id: "O01", merchant: "A", category: "Beans", variant: "Dark", unitPrice: 26, minimumUnits: 8, deliveryDays: 5, capacity: 20, shippingPerBuyer: 2, fulfillment: "shipping" },
    { id: "O02", merchant: "B", category: "Coffee", variant: "Dark", unitPrice: 24, minimumUnits: 1, deliveryDays: 7, capacity: 30, shippingPerBuyer: 1, fulfillment: "pickup" }
  ]);
});

test("price tier cells are read as minimum@unit price pairs separated by semicolons", () => {
  const offers = parseOfferCsv(`${LEGACY},minimum,tiers\nA,2000,26,2,shipping,Dark,5,"10@24; 1,000@20 ;1500@18.5"\nB,20,26,2,shipping,Dark,1,"  "\n`);
  assert.deepEqual(offers[0].tiers, [
    { minimumUnits: 10, unitPrice: 24 },
    { minimumUnits: 1000, unitPrice: 20 },
    { minimumUnits: 1500, unitPrice: 18.5 }
  ]);
  assert.equal(Object.hasOwn(offers[1], "tiers"), false);
  const aliased = parseOfferCsv(`${LEGACY},price tiers,offer id\nA,20,26,2,shipping,Dark,10@24,X1\n`);
  assert.deepEqual(aliased[0].tiers, [{ minimumUnits: 10, unitPrice: 24 }]);
  assert.equal(aliased[0].id, "X1");
});

test("malformed or invalid price tier cells name the CSV offer and the tier", () => {
  const row = (tiers, capacity = 20) => `${LEGACY},minimum,tiers\nOK,20,26,2,shipping,Dark,1,\nA,${capacity},26,2,shipping,Dark,5,"${tiers}"\n`;
  const cases = [
    ["10@24; 10@20", /^CSV offer 2: tier 2 minimum units must increase above the previous minimum\.$/u],
    ["4@24", /^CSV offer 2: tier 1 minimum units must increase above the previous minimum\.$/u],
    ["10@24; 12@24", /^CSV offer 2: tier 2 unit price must decrease below the previous price\.$/u],
    ["21@24", /^CSV offer 2: tier 1 minimum units must be between 1 and 20\.$/u],
    [Array.from({ length: 9 }, (_, index) => `${6 + index}@${25 - index}`).join("; "), /^CSV offer 2: price tiers must contain at most 8 entries\.$/u],
    ["10-24", /^CSV offer 2: tier 1 must be minimum@unit price\.$/u],
    ["=1@2", /^CSV offer 2: tier 1 minimum units must be a number\.$/u],
    ["@24", /^CSV offer 2: tier 1 must be minimum@unit price\.$/u],
    ["10@", /^CSV offer 2: tier 1 must be minimum@unit price\.$/u],
    ["10@24@20", /^CSV offer 2: tier 1 must be minimum@unit price\.$/u],
    ["10@24;;18@20", /^CSV offer 2: tier 2 must be minimum@unit price\.$/u],
    ["10@24;", /^CSV offer 2: tier 2 must be minimum@unit price\.$/u],
    ["10@abc", /^CSV offer 2: tier 1 unit price must be a number\.$/u]
  ];
  for (const [tiers, pattern] of cases) {
    assert.throws(() => parseOfferCsv(row(tiers)), (error) => error instanceof ScenarioError && pattern.test(error.message), tiers);
  }
  assert.deepEqual(parseOfferCsv(row("1,000@20", 2000))[1].tiers, [{ minimumUnits: 1000, unitPrice: 20 }]);
});

test("explicit offer ids survive row reordering and blank ids fill unused O-numbers", () => {
  const scenario = clonePreset("neighbourhood");
  const csv = createOfferCsv(scenario).trimEnd().split("\r\n");
  const reordered = [csv[0], ...csv.slice(1).reverse()].join("\r\n");
  const back = importOffersFromCsv(scenario, reordered);
  assert.deepEqual(back.offers.map((offer) => offer.id), scenario.offers.map((offer) => offer.id).reverse());
  assert.deepEqual([...back.offers].reverse(), validateScenario(scenario).offers);

  const mixed = parseOfferCsv(`${LEGACY},id\nA,20,26,2,shipping,Dark,\nB,20,26,2,shipping,Dark,O01\nC,20,26,2,shipping,Dark,\nD,20,26,2,shipping,Dark, custom \n`);
  assert.deepEqual(mixed.map((offer) => offer.id), ["O02", "O01", "O03", "custom"]);
});

test("duplicate or over-long explicit offer ids are rejected with the CSV offer", () => {
  assert.throws(
    () => parseOfferCsv(`${LEGACY},id\nA,20,26,2,shipping,Dark,X\nB,20,26,2,shipping,Dark, X\n`),
    /: CSV offer 2: id X repeats CSV offer 1\.$/u
  );
  assert.throws(
    () => parseOfferCsv(`${LEGACY},id\nA,20,26,2,shipping,Dark,${"x".repeat(25)}\n`),
    /: CSV offer 1: id must be 1 to 24 characters\.$/u
  );
});

test("the analyst CLI imports an exported tiered offer CSV unchanged", () => {
  const dir = mkdtempSync(join(tmpdir(), "common-cart-offer-rt-"));
  try {
    const scenario = validateScenario(clonePreset("tiers"));
    const scenarioPath = join(dir, "scenario.json");
    const csvPath = join(dir, "offers.csv");
    writeFileSync(scenarioPath, JSON.stringify(scenario));
    writeFileSync(csvPath, createOfferCsv(scenario));
    const result = spawnSync(process.execPath, [script, "import", "--input", scenarioPath, "--kind", "offers", "--csv", csvPath], { encoding: "utf8", timeout: 30000 });
    assert.equal(result.status, 0, result.stderr);
    assert.deepStrictEqual(JSON.parse(result.stdout).offers, scenario.offers);
    assert.equal(readFileSync(csvPath, "utf8"), createOfferCsv(scenario));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the analyst CLI help shows the offer import", () => {
  const result = spawnSync(process.execPath, [script, "--help"], { encoding: "utf8", timeout: 30000 });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /import --input scenario\.json --kind offers --csv offers\.csv/u);
});
