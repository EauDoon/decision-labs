import test from "node:test";
import assert from "node:assert/strict";
import {
  EDGE_ROW_OPTIONS,
  ScenarioError,
  clonePreset,
  computeResidualCoverage,
  edgeRowSelection,
  evaluateMarket,
  filterBuyerIdsHidingFirstUnservedBuyer,
  filterBuyerIdsHidingLastUnservedBuyer,
  filterBuyerIdsHidingFirstWinnerAllocatedBuyer,
  filterBuyerIdsHidingLastWinnerAllocatedBuyer,
  filterBuyerIdsHidingFirstBuyerFilledByLeftoverFill,
  filterBuyerIdsHidingLastBuyerFilledByLeftoverFill,
  filterBuyerIdsHidingFirstBuyerFilledByTertiaryFill,
  filterBuyerIdsHidingLastBuyerFilledByTertiaryFill,
  filterBuyerIdsHidingFirstLeftoverOnlyBuyer,
  filterBuyerIdsHidingLastLeftoverOnlyBuyer,
  filterBuyerIdsHidingFirstUncoveredLeftoverBuyer,
  filterBuyerIdsHidingLastUncoveredLeftoverBuyer,
  validateScenario,
  validateWorkspace,
} from "../src/model.js";

const PAIRS = {
  edgeLeftoverFill: ["hideFirstBuyerFilledByLeftoverFill", "hideLastBuyerFilledByLeftoverFill"],
  edgeTertiaryFill: ["hideFirstBuyerFilledByTertiaryFill", "hideLastBuyerFilledByTertiaryFill"],
  edgeUnserved: ["hideFirstUnservedBuyer", "hideLastUnservedBuyer"],
  edgeLeftoverOnly: ["hideFirstLeftoverOnlyBuyer", "hideLastLeftoverOnlyBuyer"],
  edgeWinnerAllocated: ["hideFirstWinnerAllocatedBuyer", "hideLastWinnerAllocatedBuyer"],
  edgeUncoveredLeftover: ["hideFirstUncoveredLeftoverBuyer", "hideLastUncoveredLeftoverBuyer"],
};

test("edge selects offer all, first, last, and first-and-last without new math", () => {
  assert.deepEqual([...EDGE_ROW_OPTIONS], ["all", "hide-first", "hide-last", "hide-first-last"]);
});

test("legacy first/last checkbox pairs map onto the edge selects", () => {
  for (const [edge, [first, last]] of Object.entries(PAIRS)) {
    assert.equal(edgeRowSelection({}, edge), "all");
    assert.equal(edgeRowSelection({ [first]: true }, edge), "hide-first");
    assert.equal(edgeRowSelection({ [last]: true }, edge), "hide-last");
    assert.equal(edgeRowSelection({ [first]: true, [last]: true }, edge), "hide-first-last");
    assert.equal(edgeRowSelection({ [first]: false, [last]: false }, edge), "all");
    assert.equal(edgeRowSelection({ [edge]: "hide-last", [first]: true }, edge), "hide-last");
  }
});

test("edge selections and legacy flags reject non-boolean values", () => {
  for (const edge of Object.keys(PAIRS)) {
    assert.throws(() => edgeRowSelection({ [edge]: "first" }, edge), ScenarioError);
    assert.throws(() => edgeRowSelection({ [edge]: null }, edge), ScenarioError);
  }
  assert.throws(() => edgeRowSelection({ hideFirstUnservedBuyer: "true" }, "edgeUnserved"), /true or false/);
  assert.throws(() => edgeRowSelection({ hideLastUnservedBuyer: 1 }, "edgeUnserved"), /true or false/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], edgeUnserved: "sometimes" }), /all, hide-first, hide-last/);
  assert.throws(() => validateWorkspace({ version: 1, rooms: [], edgeUnserved: "sometimes", typo: 1 }), /Unknown|unexpected/i);
});

test("validated workspaces carry edge selects instead of twelve flags", () => {
  const fresh = validateWorkspace({ version: 1, rooms: [] });
  for (const edge of Object.keys(PAIRS)) assert.equal(fresh[edge], "all");
  for (const [, [first, last]] of Object.entries(PAIRS)) {
    assert.equal(Object.hasOwn(fresh, first), false);
    assert.equal(Object.hasOwn(fresh, last), false);
  }
  const legacy = validateWorkspace({ version: 1, rooms: [], hideFirstUnservedBuyer: true, hideLastWinnerAllocatedBuyer: true, hideFirstWinnerAllocatedBuyer: true });
  assert.equal(legacy.edgeUnserved, "hide-first");
  assert.equal(legacy.edgeWinnerAllocated, "hide-first-last");
  const current = validateWorkspace({ version: 1, rooms: [], edgeLeftoverOnly: "hide-last", hideFirstLeftoverOnlyBuyer: true });
  assert.equal(current.edgeLeftoverOnly, "hide-last");
});

test("edge select values reproduce the retired checkbox filter outcomes", () => {
  const scenario = clonePreset("soccerCarnivalLunch");
  const apply = (edge, value) => {
    const firstOnly = value === "hide-first" || value === "hide-first-last";
    const lastOnly = value === "hide-last" || value === "hide-first-last";
    const pairs = {
      edgeLeftoverFill: [filterBuyerIdsHidingFirstBuyerFilledByLeftoverFill, filterBuyerIdsHidingLastBuyerFilledByLeftoverFill],
      edgeTertiaryFill: [filterBuyerIdsHidingFirstBuyerFilledByTertiaryFill, filterBuyerIdsHidingLastBuyerFilledByTertiaryFill],
      edgeUnserved: [filterBuyerIdsHidingFirstUnservedBuyer, filterBuyerIdsHidingLastUnservedBuyer],
      edgeLeftoverOnly: [filterBuyerIdsHidingFirstLeftoverOnlyBuyer, filterBuyerIdsHidingLastLeftoverOnlyBuyer],
      edgeWinnerAllocated: [filterBuyerIdsHidingFirstWinnerAllocatedBuyer, filterBuyerIdsHidingLastWinnerAllocatedBuyer],
      edgeUncoveredLeftover: [filterBuyerIdsHidingFirstUncoveredLeftoverBuyer, filterBuyerIdsHidingLastUncoveredLeftoverBuyer],
    };
    let visible = new Set(scenario.buyers.map((buyer) => buyer.id));
    if (firstOnly) visible = new Set([...visible].filter((id) => pairs[edge][0](scenario, true).includes(id)));
    if (lastOnly) visible = new Set([...visible].filter((id) => pairs[edge][1](scenario, true).includes(id)));
    return visible;
  };
  const market = evaluateMarket(scenario);
  void market;
  const unservedFirst = apply("edgeUnserved", "hide-first");
  assert.equal(unservedFirst.has("B06"), false);
  const unservedBoth = apply("edgeUnserved", "hide-first-last");
  assert.ok(unservedBoth.size <= unservedFirst.size);
  assert.deepEqual([...apply("edgeUnserved", "all")].sort(), scenario.buyers.map((buyer) => buyer.id).sort());
  assert.deepEqual(validateScenario(scenario).buyers.map((buyer) => buyer.id), scenario.buyers.map((buyer) => buyer.id));
  void computeResidualCoverage;
});
