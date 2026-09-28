import test from "node:test";
import assert from "node:assert/strict";
import { parseBuyerCsv, parseBuyerTable } from "../src/model.js";

const HEADER = "label,category,quantity,max unit price,latest delivery days,variants,max order total";

test("buyer CSV rejects a repeated column instead of keeping the later value", () => {
  // A second quantity column used to overwrite the first. The imported buyer
  // then had quantity 99 with no error, so the spreadsheet's first number was
  // discarded. Aliases such as qty name the same field and are the same repeat.
  const repeated = `${HEADER},quantity\nKitchen one,Pantry box,8,52,5,Standard,,99\n`;
  assert.throws(() => parseBuyerCsv(repeated), /Buyer CSV column quantity repeats quantity/);

  const alias = "label,category,qty,max unit price,latest delivery days,variants,quantity\nKitchen one,Pantry box,8,52,5,Standard,99\n";
  assert.throws(() => parseBuyerCsv(alias), /Buyer CSV column quantity repeats qty/);

  const pasted = "label\tcategory\tquantity\tmax unit price\tlatest delivery days\tvariants\tquantity\nKitchen one\tPantry box\t8\t52\t5\tStandard\t99\n";
  assert.throws(() => parseBuyerTable(pasted), /Buyer CSV column quantity repeats quantity/);
});

test("buyer CSV still imports one column per field", () => {
  const buyers = parseBuyerCsv(`${HEADER}\nKitchen one,Pantry box,8,52,5,Standard,400\n`);
  assert.equal(buyers[0].quantity, 8);
  assert.equal(buyers[0].maxOrderTotal, 400);
});
