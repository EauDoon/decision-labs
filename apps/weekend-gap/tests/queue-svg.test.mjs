import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SCENARIO, PRESETS, buildQueueChartSvg } from "../src/model.js";

test("queue SVG path is deterministic and includes current, baseline and playhead", () => {
  const svg = buildQueueChartSvg(PRESETS.weekendRush, DEFAULT_SCENARIO, 21);
  assert.equal(svg, buildQueueChartSvg(PRESETS.weekendRush, DEFAULT_SCENARIO, 21));
  assert.match(svg, /<path d="M/);
  assert.match(svg, /stroke-dasharray/);
  assert.match(svg, /fill="#f7fafb"/);
  assert.doesNotMatch(svg, /<\/script/i);
  assert.notEqual(svg, buildQueueChartSvg(PRESETS.weekendRush, DEFAULT_SCENARIO, 65));
});
