import test from "node:test";
import assert from "node:assert/strict";
import { clonePreset, evaluateMarket, validateScenario } from "../src/model.js";

test("office pantry and hardware presets evaluate with distinct categories", () => {
  const office = evaluateMarket(clonePreset("officePantry"));
  const hardware = evaluateMarket(clonePreset("hardware"));
  assert.ok(office.winner);
  assert.ok(hardware.winner);
  assert.equal(office.categoryCount, 1);
  assert.equal(hardware.categoryCount, 1);
  assert.equal(office.scenario.buyers[0].category, "Office pantry crate");
  assert.equal(hardware.scenario.buyers[0].category, "Hand tool kit");
  assert.ok(office.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Sweet snack")));
  assert.ok(hardware.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Imperial")));
  assert.notEqual(office.winner.offer.category, hardware.winner.offer.category);
  assert.ok(hardware.results.some((result) => result.offer.fulfillment === "pickup"));
});

test("community garden bulk seed is distinct and includes a pickup offer", () => {
  const garden = evaluateMarket(clonePreset("garden"));
  const coffee = evaluateMarket(clonePreset("neighbourhood"));
  const office = evaluateMarket(clonePreset("officePantry"));
  const hardware = evaluateMarket(clonePreset("hardware"));
  assert.ok(garden.winner);
  assert.equal(garden.scenario.title, "Community garden bulk seed");
  assert.equal(garden.scenario.buyers[0].category, "Garden seed pack");
  assert.notEqual(garden.scenario.buyers[0].category, coffee.scenario.buyers[0].category);
  assert.notEqual(garden.scenario.buyers[0].category, office.scenario.buyers[0].category);
  assert.notEqual(garden.scenario.buyers[0].category, hardware.scenario.buyers[0].category);
  assert.ok(garden.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Heirloom tomato")));
  assert.ok(garden.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Cover crop")));
  assert.ok(garden.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Potting soil")));
  assert.ok(garden.results.some((result) => result.offer.fulfillment === "pickup"));
  const quantities = garden.scenario.buyers.map((buyer) => buyer.quantity);
  assert.equal(new Set(quantities).size > 1, true);
  const first = evaluateMarket(clonePreset("garden"));
  const second = evaluateMarket(validateScenario(clonePreset("garden")));
  assert.equal(first.winner.offer.id, second.winner.offer.id);
  assert.equal(first.winner.fulfilledUnits, second.winner.fulfilledUnits);
});

test("school fete catering is distinct synthetic bulk catering", () => {
  const fete = evaluateMarket(clonePreset("schoolFete"));
  const coffee = evaluateMarket(clonePreset("neighbourhood"));
  const studio = evaluateMarket(clonePreset("studio"));
  const pantry = evaluateMarket(clonePreset("pantry"));
  const office = evaluateMarket(clonePreset("officePantry"));
  const hardware = evaluateMarket(clonePreset("hardware"));
  const garden = evaluateMarket(clonePreset("garden"));
  const ladder = evaluateMarket(clonePreset("tiers"));
  assert.ok(fete.winner);
  assert.equal(fete.scenario.title, "School fete catering");
  assert.equal(fete.scenario.buyers[0].category, "Fete catering pack");
  assert.notEqual(fete.scenario.buyers[0].category, coffee.scenario.buyers[0].category);
  assert.notEqual(fete.scenario.buyers[0].category, studio.scenario.buyers[0].category);
  assert.notEqual(fete.scenario.buyers[0].category, pantry.scenario.buyers[0].category);
  assert.notEqual(fete.scenario.buyers[0].category, office.scenario.buyers[0].category);
  assert.notEqual(fete.scenario.buyers[0].category, hardware.scenario.buyers[0].category);
  assert.notEqual(fete.scenario.buyers[0].category, garden.scenario.buyers[0].category);
  assert.notEqual(fete.scenario.title, ladder.scenario.title);
  assert.ok(fete.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Sausage sizzle")));
  assert.ok(fete.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Cake stall")));
  assert.ok(fete.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Drinks cooler")));
  assert.ok(fete.results.some((result) => result.offer.fulfillment === "pickup"));
  const quantities = fete.scenario.buyers.map((buyer) => buyer.quantity);
  assert.equal(new Set(quantities).size > 1, true);
  const first = evaluateMarket(clonePreset("schoolFete"));
  const second = evaluateMarket(validateScenario(clonePreset("schoolFete")));
  assert.equal(first.winner.offer.id, second.winner.offer.id);
  assert.equal(first.winner.fulfilledUnits, second.winner.fulfilledUnits);
});

test("office fruit box is distinct synthetic weekly fruit for an office", () => {
  const fruit = evaluateMarket(clonePreset("officeFruit"));
  const coffee = evaluateMarket(clonePreset("neighbourhood"));
  const studio = evaluateMarket(clonePreset("studio"));
  const pantry = evaluateMarket(clonePreset("pantry"));
  const office = evaluateMarket(clonePreset("officePantry"));
  const hardware = evaluateMarket(clonePreset("hardware"));
  const garden = evaluateMarket(clonePreset("garden"));
  const fete = evaluateMarket(clonePreset("schoolFete"));
  const ladder = evaluateMarket(clonePreset("tiers"));
  assert.ok(fruit.winner);
  assert.equal(fruit.scenario.title, "Office fruit box");
  assert.equal(fruit.scenario.buyers[0].category, "Office fruit crate");
  assert.notEqual(fruit.scenario.buyers[0].category, coffee.scenario.buyers[0].category);
  assert.notEqual(fruit.scenario.buyers[0].category, studio.scenario.buyers[0].category);
  assert.notEqual(fruit.scenario.buyers[0].category, pantry.scenario.buyers[0].category);
  assert.notEqual(fruit.scenario.buyers[0].category, office.scenario.buyers[0].category);
  assert.notEqual(fruit.scenario.buyers[0].category, hardware.scenario.buyers[0].category);
  assert.notEqual(fruit.scenario.buyers[0].category, garden.scenario.buyers[0].category);
  assert.notEqual(fruit.scenario.buyers[0].category, fete.scenario.buyers[0].category);
  assert.notEqual(fruit.scenario.title, ladder.scenario.title);
  assert.ok(fruit.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Citrus mix")));
  assert.ok(fruit.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Apple crate")));
  assert.ok(fruit.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Mixed seasonal")));
  assert.ok(fruit.results.some((result) => result.offer.fulfillment === "pickup"));
  const quantities = fruit.scenario.buyers.map((buyer) => buyer.quantity);
  assert.equal(new Set(quantities).size > 1, true);
  const first = evaluateMarket(clonePreset("officeFruit"));
  const second = evaluateMarket(validateScenario(clonePreset("officeFruit")));
  assert.equal(first.winner.offer.id, second.winner.offer.id);
  assert.equal(first.winner.fulfilledUnits, second.winner.fulfilledUnits);
});

test("new presets survive validation and keep a deterministic winner", () => {
  for (const name of ["officePantry", "hardware", "garden", "schoolFete", "officeFruit", "libraryPaper", "sportsKit"]) {
    const first = evaluateMarket(clonePreset(name));
    const second = evaluateMarket(validateScenario(clonePreset(name)));
    assert.equal(first.winner.offer.id, second.winner.offer.id);
    assert.equal(first.winner.fulfilledUnits, second.winner.fulfilledUnits);
  }
});

test("the example bar includes school fete catering", async () => {
  const { readFile } = await import("node:fs/promises");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="schoolFete"/u);
  assert.match(html, /School fete/u);
});

test("the example bar includes the community garden bulk seed preset", async () => {
  const { readFile } = await import("node:fs/promises");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="garden"/u);
  assert.match(html, /Garden seed/u);
});

test("the example bar includes the office fruit box preset", async () => {
  const { readFile } = await import("node:fs/promises");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="officeFruit"/u);
  assert.match(html, /Office fruit/u);
});

test("library photocopy paper is distinct synthetic mixed-ream paper for a library", () => {
  const paper = evaluateMarket(clonePreset("libraryPaper"));
  const coffee = evaluateMarket(clonePreset("neighbourhood"));
  const studio = evaluateMarket(clonePreset("studio"));
  const pantry = evaluateMarket(clonePreset("pantry"));
  const office = evaluateMarket(clonePreset("officePantry"));
  const hardware = evaluateMarket(clonePreset("hardware"));
  const garden = evaluateMarket(clonePreset("garden"));
  const fete = evaluateMarket(clonePreset("schoolFete"));
  const fruit = evaluateMarket(clonePreset("officeFruit"));
  const ladder = evaluateMarket(clonePreset("tiers"));
  assert.ok(paper.winner);
  assert.equal(paper.scenario.title, "Library photocopy paper");
  assert.equal(paper.scenario.buyers[0].category, "Photocopy paper ream");
  assert.notEqual(paper.scenario.buyers[0].category, coffee.scenario.buyers[0].category);
  assert.notEqual(paper.scenario.buyers[0].category, studio.scenario.buyers[0].category);
  assert.notEqual(paper.scenario.buyers[0].category, pantry.scenario.buyers[0].category);
  assert.notEqual(paper.scenario.buyers[0].category, office.scenario.buyers[0].category);
  assert.notEqual(paper.scenario.buyers[0].category, hardware.scenario.buyers[0].category);
  assert.notEqual(paper.scenario.buyers[0].category, garden.scenario.buyers[0].category);
  assert.notEqual(paper.scenario.buyers[0].category, fete.scenario.buyers[0].category);
  assert.notEqual(paper.scenario.buyers[0].category, fruit.scenario.buyers[0].category);
  assert.notEqual(paper.scenario.title, ladder.scenario.title);
  assert.ok(paper.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("A4 80gsm")));
  assert.ok(paper.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("A3 80gsm")));
  assert.ok(paper.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Recycled A4")));
  assert.ok(paper.results.some((result) => result.offer.merchant === "Desk Delivery Paper" && result.offer.fulfillment === "shipping"));
  assert.ok(paper.results.some((result) => result.offer.merchant === "Lobby Paper Pickup" && result.offer.fulfillment === "pickup"));
  const quantities = paper.scenario.buyers.map((buyer) => buyer.quantity);
  assert.equal(new Set(quantities).size > 1, true);
  const first = evaluateMarket(clonePreset("libraryPaper"));
  const second = evaluateMarket(validateScenario(clonePreset("libraryPaper")));
  assert.equal(first.winner.offer.id, second.winner.offer.id);
  assert.equal(first.winner.fulfilledUnits, second.winner.fulfilledUnits);
});

test("the example bar includes the library photocopy paper preset", async () => {
  const { readFile } = await import("node:fs/promises");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="libraryPaper"/u);
  assert.match(html, /Library paper/u);
});

test("sports club match-day kit is distinct synthetic mixed kit for a club", () => {
  const kit = evaluateMarket(clonePreset("sportsKit"));
  const coffee = evaluateMarket(clonePreset("neighbourhood"));
  const studio = evaluateMarket(clonePreset("studio"));
  const pantry = evaluateMarket(clonePreset("pantry"));
  const office = evaluateMarket(clonePreset("officePantry"));
  const hardware = evaluateMarket(clonePreset("hardware"));
  const garden = evaluateMarket(clonePreset("garden"));
  const fete = evaluateMarket(clonePreset("schoolFete"));
  const fruit = evaluateMarket(clonePreset("officeFruit"));
  const paper = evaluateMarket(clonePreset("libraryPaper"));
  const ladder = evaluateMarket(clonePreset("tiers"));
  assert.ok(kit.winner);
  assert.equal(kit.scenario.title, "Sports club match-day kit");
  assert.equal(kit.scenario.buyers[0].category, "Match-day kit pack");
  assert.notEqual(kit.scenario.buyers[0].category, coffee.scenario.buyers[0].category);
  assert.notEqual(kit.scenario.buyers[0].category, studio.scenario.buyers[0].category);
  assert.notEqual(kit.scenario.buyers[0].category, pantry.scenario.buyers[0].category);
  assert.notEqual(kit.scenario.buyers[0].category, office.scenario.buyers[0].category);
  assert.notEqual(kit.scenario.buyers[0].category, hardware.scenario.buyers[0].category);
  assert.notEqual(kit.scenario.buyers[0].category, garden.scenario.buyers[0].category);
  assert.notEqual(kit.scenario.buyers[0].category, fete.scenario.buyers[0].category);
  assert.notEqual(kit.scenario.buyers[0].category, fruit.scenario.buyers[0].category);
  assert.notEqual(kit.scenario.buyers[0].category, paper.scenario.buyers[0].category);
  assert.notEqual(kit.scenario.title, ladder.scenario.title);
  assert.ok(kit.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Club jersey")));
  assert.ok(kit.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Training shorts")));
  assert.ok(kit.scenario.buyers.some((buyer) => buyer.allowedVariants.includes("Water crate")));
  assert.ok(kit.results.some((result) => result.offer.merchant === "Field Kit Delivery" && result.offer.fulfillment === "shipping"));
  assert.ok(kit.results.some((result) => result.offer.merchant === "Clubhouse Kit Pickup" && result.offer.fulfillment === "pickup"));
  const quantities = kit.scenario.buyers.map((buyer) => buyer.quantity);
  assert.equal(new Set(quantities).size > 1, true);
  const first = evaluateMarket(clonePreset("sportsKit"));
  const second = evaluateMarket(validateScenario(clonePreset("sportsKit")));
  assert.equal(first.winner.offer.id, second.winner.offer.id);
  assert.equal(first.winner.fulfilledUnits, second.winner.fulfilledUnits);
});

test("the example bar includes the sports club match-day kit preset", async () => {
  const { readFile } = await import("node:fs/promises");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /data-preset="sportsKit"/u);
  assert.match(html, /Sports kit/u);
});
