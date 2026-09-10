import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  clonePreset,
  createScenarioHistory,
  importBuyersFromTable,
  parseBuyerCsv,
  parseBuyerTable,
  validateScenario
} from "../src/model.js";

const HEADER = "label,category,quantity,max unit price,latest delivery days,variants,max order total";
const TSV = "label\tcategory\tquantity\tmax unit price\tlatest delivery days\tvariants\tmax order total";

test("pasted TSV buyers replace buyers, keep offers, and share CSV validation", () => {
  const tsv = `${TSV}\nKitchen one\tPantry box\t8\t52\t5\tStandard, Gluten free\t400\nKitchen two\tPantry box\t12\t48\t4\tStandard\t\n`;
  const original = clonePreset("neighbourhood");
  const beforeOffers = original.offers.map((offer) => offer.id);
  const imported = importBuyersFromTable(original, tsv);
  assert.equal(imported.buyers.length, 2);
  assert.equal(imported.buyers[0].label, "Kitchen one");
  assert.equal(imported.buyers[0].quantity, 8);
  assert.deepEqual(imported.buyers[0].allowedVariants, ["Standard", "Gluten free"]);
  assert.equal(imported.buyers[0].maxOrderTotal, 400);
  assert.equal(Object.hasOwn(imported.buyers[1], "maxOrderTotal"), false);
  assert.deepEqual(imported.offers.map((offer) => offer.id), beforeOffers);
  assert.equal(original.buyers.length, 5);
  validateScenario(imported);
  const csvBuyers = parseBuyerCsv(`${HEADER}\nKitchen one,Pantry box,8,52,5,"Standard, Gluten free",400\n`);
  assert.deepEqual(imported.buyers[0].allowedVariants, csvBuyers[0].allowedVariants);
});

test("pasted CSV without tabs uses the same buyer CSV import path", () => {
  const csv = `${HEADER}\nStudio A,Desk chair,4,280,14,Black,\n`;
  const fromTable = parseBuyerTable(csv);
  const fromCsv = parseBuyerCsv(csv);
  assert.deepEqual(fromTable, fromCsv);
  const imported = importBuyersFromTable(clonePreset("studio"), csv);
  assert.equal(imported.buyers.length, 1);
  assert.equal(imported.offers[0].id, clonePreset("studio").offers[0].id);
});

test("invalid pasted buyers do not replace the room and name the same fields as CSV import", () => {
  const original = clonePreset("studio");
  const before = JSON.stringify(original);
  assert.throws(() => importBuyersFromTable(original, ""), /empty/);
  assert.throws(() => importBuyersFromTable(original, `${TSV}\nOnly hall\tCoffee beans\tnot-a-number\t30\t7\tMedium roast\t\n`), /CSV buyer 1/);
  assert.throws(() => importBuyersFromTable(original, `${HEADER}\nOnly hall,Coffee beans,0,30,7,Medium roast,\n`), /quantity must be between 1 and 5000/);
  assert.equal(JSON.stringify(original), before);
  assert.throws(() => parseBuyerTable(`${TSV}\n`), /header row and at least one buyer/);
});

test("replacing buyers from paste is a new history state so undo restores the previous list", () => {
  const original = clonePreset("neighbourhood");
  const history = createScenarioHistory(original);
  const next = importBuyersFromTable(original, `${TSV}\nPlot twelve\tGarden seed pack\t4\t22\t10\tHeirloom tomato\t\n`);
  history.record(next);
  assert.equal(history.current().buyers.length, 1);
  assert.equal(history.current().buyers[0].label, "Plot twelve");
  assert.equal(history.current().offers[0].id, original.offers[0].id);
  assert.equal(history.undo().buyers.length, 5);
  assert.equal(history.current().buyers[0].label, "North block");
});

test("the buyer room has a paste area that is ignored by shortcuts while typing", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const buyerPanel = html.slice(html.indexOf('id="buyer-panel"'), html.indexOf('id="merchant-panel"'));
  assert.match(buyerPanel, /id="paste-buyers"/u);
  assert.match(buyerPanel, /id="paste-buyers-apply"/u);
  assert.match(buyerPanel, /A tab in the first line is read as TSV/u);
  assert.match(app, /importBuyersFromTable\(/u);
  assert.match(app, /function pasteBuyersTable\(/u);
  assert.match(app, /function focusBuyerPaste\(/u);
  assert.match(app, /isTypingTarget\(event\.target\)/u);
  assert.match(app, /textarea/u);
});
