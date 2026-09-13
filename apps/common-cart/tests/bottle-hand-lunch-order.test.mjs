import test from "node:test";
import assert from "node:assert/strict";
import { presets } from "../src/model.js";

test("bottle-hand cycling carnival lunch sits immediately after domestique in presets", () => {
  const keys = Object.keys(presets);
  assert.ok(keys.indexOf("domestiqueCyclingCarnivalLunch") !== -1);
  assert.ok(keys.indexOf("bottleHandCyclingCarnivalLunch") !== -1);
  assert.equal(keys.indexOf("bottleHandCyclingCarnivalLunch"), keys.indexOf("domestiqueCyclingCarnivalLunch") + 1);
  assert.equal(keys.indexOf("domestiqueCyclingCarnivalLunch"), keys.indexOf("soigneurCyclingCarnivalLunch") + 1);
});
