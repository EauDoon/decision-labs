import test from "node:test";
import assert from "node:assert/strict";
import {
  ScenarioError,
  clonePreset,
  importBuyersFromCsv,
  neutralizeSpreadsheetCell,
  parseBuyerCsv,
  validateScenario
} from "../src/model.js";

const HEADER = "label,category,quantity,max unit price,latest delivery days,variants,max order total";

test("buyer CSV import replaces buyers and keeps existing offers", () => {
  const csv = `${HEADER}\r\nKitchen one,Pantry box,8,52,5,"Standard, Gluten free",400\r\nKitchen two,Pantry box,12,48,4,Standard,\r\n`;
  const imported = importBuyersFromCsv(clonePreset("neighbourhood"), csv);
  assert.equal(imported.buyers.length, 2);
  assert.equal(imported.buyers[0].label, "Kitchen one");
  assert.equal(imported.buyers[0].quantity, 8);
  assert.deepEqual(imported.buyers[0].allowedVariants, ["Standard", "Gluten free"]);
  assert.equal(imported.buyers[0].maxOrderTotal, 400);
  assert.equal(Object.hasOwn(imported.buyers[1], "maxOrderTotal"), false);
  assert.equal(imported.offers[0].id, clonePreset("neighbourhood").offers[0].id);
  assert.equal(imported.buyers[0].id, "B01");
  assert.equal(imported.buyers[1].id, "B02");
});

test("buyer CSV import strips spreadsheet formula prefixes like export", () => {
  const csv = `${HEADER}\n"'=HYPERLINK(""x"")",Coffee beans,2,30,7,Medium roast,\n`;
  const buyers = parseBuyerCsv(csv);
  assert.equal(buyers[0].label, '=HYPERLINK("x")');
  assert.equal(neutralizeSpreadsheetCell("'+cmd"), "+cmd");
  assert.equal(neutralizeSpreadsheetCell("North block"), "North block");
});

test("buyer CSV import names missing columns and invalid values", () => {
  assert.throws(() => parseBuyerCsv(""), /empty/);
  assert.throws(() => parseBuyerCsv("label,category\nA,B\n"), /must include label, category, quantity/);
  assert.throws(() => parseBuyerCsv(`${HEADER}\nOnly hall,Coffee beans,not-a-number,30,7,Medium roast,\n`), /CSV buyer 1/);
  assert.throws(() => parseBuyerCsv(`${HEADER}\nOnly hall,Coffee beans,2,30,7,,\n`), /CSV buyer 1: accepted variants must contain 1 to 12 names/);
  const badQty = `${HEADER}\nOnly hall,Coffee beans,0,30,7,Medium roast,\n`;
  assert.throws(() => parseBuyerCsv(badQty), /CSV buyer 1: quantity must be between 1 and 5000/);
  assert.throws(() => parseBuyerCsv(`${HEADER}\n`), /header row and at least one buyer/);
  assert.throws(() => parseBuyerCsv("note,category,quantity,max unit price,latest delivery days,variants\nA,B,1,2,3,C\n"), /unknown column: note/);
});

test("buyer CSV import accepts quoted commas and rejects an unclosed quote", () => {
  const csv = "label,category,quantity,max unit price,latest delivery days,variants\n\"Hall, north\",Coffee beans,2,30,7,\"Medium roast, Dark roast\"\n";
  const buyers = parseBuyerCsv(csv);
  assert.equal(buyers[0].label, "Hall, north");
  assert.deepEqual(buyers[0].allowedVariants, ["Medium roast", "Dark roast"]);
  assert.throws(() => parseBuyerCsv("label,category,quantity,max unit price,latest delivery days,variants\n\"open,Coffee beans,2,30,7,Medium roast\n"), /unclosed quote/);
});

test("buyer CSV import does not mutate the source scenario until validation succeeds", () => {
  const original = clonePreset("studio");
  const before = JSON.stringify(original);
  assert.throws(() => importBuyersFromCsv(original, `${HEADER}\nBad,Chairs,5001,10,7,Black,\n`), ScenarioError);
  assert.equal(JSON.stringify(original), before);
  const ok = importBuyersFromCsv(original, `${HEADER}\nStudio A,Desk chair,4,280,14,Black,\n`);
  assert.equal(ok.buyers.length, 1);
  assert.equal(original.buyers.length, 4);
  validateScenario(ok);
});
