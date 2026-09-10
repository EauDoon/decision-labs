import test from "node:test";
import assert from "node:assert/strict";
import { clonePreset, variantOverlapMatrix, createVariantOverlapCsv, createVariantOverlapMarkdown } from "../src/model.js";
import { readFile } from "node:fs/promises";

test("variant overlap matrix counts buyers who accept each offered variant", () => {
  const scenario = clonePreset("neighbourhood");
  const matrix = variantOverlapMatrix(scenario);
  assert.deepEqual(matrix.variants.map((entry) => entry.variant), ["Medium roast", "Dark roast"]);
  const medium = matrix.variants.find((entry) => entry.variant === "Medium roast");
  const dark = matrix.variants.find((entry) => entry.variant === "Dark roast");
  assert.equal(medium.buyerCount, 4);
  assert.equal(medium.units, 12);
  assert.equal(medium.offerCount, 2);
  assert.equal(dark.buyerCount, 3);
  assert.equal(dark.units, 8);
  assert.equal(dark.offerCount, 1);
  assert.equal(matrix.cells[0][0].buyerCount, 4);
  assert.equal(matrix.cells[1][1].buyerCount, 3);
  assert.equal(matrix.cells[0][1].buyerCount, 2);
  assert.equal(matrix.cells[1][0].buyerCount, 2);
  assert.equal(matrix.cells[0][1].units, 6);
});

test("variant overlap matrix omits buyer labels, ids, budgets, and allocations", () => {
  const scenario = clonePreset("studio");
  scenario.buyers[0].label = "SECRET_LABEL";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const json = JSON.stringify(variantOverlapMatrix(scenario));
  assert.equal(json.includes("SECRET_LABEL"), false);
  assert.equal(json.includes("SECRET_ID"), false);
  assert.equal(json.includes("987654.32"), false);
  assert.equal(json.includes("maxUnitPrice"), false);
  assert.equal(json.includes("selectedBuyerIds"), false);
  assert.equal(json.includes("allocations"), false);
});

test("variant overlap matrix treats canonically equivalent offered variants as one column", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.offers[2].variant = "medium roast";
  const matrix = variantOverlapMatrix(scenario);
  assert.equal(matrix.variants.length, 2);
  assert.equal(matrix.variants[0].offerCount, 2);
  assert.equal(matrix.variants[0].variant, "Medium roast");
});

test("variant overlap CSV is formula-safe and counts only", () => {
  const scenario = clonePreset("studio");
  scenario.buyers[0].label = "SECRET_LABEL";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const csv = createVariantOverlapCsv(scenario);
  const matrix = variantOverlapMatrix(scenario);
  assert.equal(csv.includes("SECRET_LABEL"), false);
  assert.equal(csv.includes("SECRET_ID"), false);
  assert.equal(csv.includes("987654.32"), false);
  assert.equal(csv.includes("maxUnitPrice"), false);
  assert.equal(csv.includes("selectedBuyerIds"), false);
  assert.equal(csv.includes("allocations"), false);
  assert.match(csv, /^"Accepted variant"/u);
  assert.match(csv, /"Variant","Offers","Buyers","Units"/);
  for (const entry of matrix.variants) {
    assert.match(csv, new RegExp(`"${entry.variant}","${entry.offerCount}","${entry.buyerCount}","${entry.units}"`));
  }
  const firstRow = matrix.cells[0].map((cell) => cell.buyerCount).join('","');
  assert.match(csv, new RegExp(`"${matrix.variants[0].variant}","${firstRow}"`));
  assert.equal(csv.endsWith("\r\n"), true);
});

test("variant overlap CSV escapes formula-like variant names", () => {
  const scenario = clonePreset("neighbourhood");
  scenario.offers[0].variant = "=cmd";
  scenario.buyers[0].allowedVariants = ["=cmd"];
  const csv = createVariantOverlapCsv(scenario);
  assert.match(csv, /"'=cmd"/);
});

test("variant overlap Markdown is counts only and omits private buyer rows", () => {
  const scenario = clonePreset("studio");
  scenario.buyers[0].label = "SECRET_LABEL";
  scenario.buyers[0].id = "SECRET_ID";
  scenario.buyers[0].maxOrderTotal = 987654.32;
  const markdown = createVariantOverlapMarkdown(scenario);
  const matrix = variantOverlapMatrix(scenario);
  assert.equal(markdown.includes("SECRET_LABEL"), false);
  assert.equal(markdown.includes("SECRET_ID"), false);
  assert.equal(markdown.includes("987654.32"), false);
  assert.equal(markdown.includes("maxUnitPrice"), false);
  assert.equal(markdown.includes("leftoverBuyerIds"), false);
  assert.equal(markdown.includes('"selectedBuyerIds":'), false);
  assert.equal(markdown.includes('"allocations":'), false);
  assert.match(markdown, /# Common Cart variant overlap/);
  assert.match(markdown, /Labels, IDs, budgets, and allocations are omitted/);
  assert.match(markdown, new RegExp(`\\| ${matrix.variants[0].variant} \\| ${matrix.cells[0].map((cell) => cell.buyerCount).join(" \\| ")} \\|`));
  for (const entry of matrix.variants) {
    assert.match(markdown, new RegExp(`\\| ${entry.variant} \\| ${entry.offerCount} \\| ${entry.buyerCount} \\| ${entry.units} \\|`));
  }
});

test("the merchant table can copy overlap Markdown", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="overlap-markdown"/u);
  assert.match(html, /Copy overlap Markdown/u);
  assert.match(html, /id="clipboard-fallback-text"/u);
  assert.match(app, /createVariantOverlapMarkdown\(/u);
  assert.match(app, /function copyTextWithFallback\(/u);
  assert.match(app, /clipboard-fallback-text/u);
});

test("variant overlap region is merchant-facing counts only", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const merchantPanel = html.slice(html.indexOf('id="merchant-panel"'), html.indexOf('id="method-panel"'));
  const region = merchantPanel.slice(merchantPanel.indexOf('id="variant-overlap-region"'), merchantPanel.indexOf("Copy overlap Markdown"));
  assert.match(merchantPanel, /id="variant-overlap-region"/u);
  assert.match(region, /Labels, IDs, budgets, and allocations are omitted/u);
  assert.equal(region.includes("Private label"), false);
  assert.equal(region.includes("maxUnitPrice"), false);
  assert.equal(region.includes("leftoverBuyerIds"), false);
});

