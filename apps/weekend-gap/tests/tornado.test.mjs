import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SCENARIO, buildSensitivityBarsSvg, runSensitivity } from "../src/model.js";

test("sensitivity bars SVG matches the five cases and both metrics", () => {
  const rows = runSensitivity(DEFAULT_SCENARIO, "fxDepthAudPerHour");
  const settled = buildSensitivityBarsSvg(rows, "totalSettledAud");
  const peak = buildSensitivityBarsSvg(rows, "peakQueuedAud");
  assert.equal(settled, buildSensitivityBarsSvg(rows, "totalSettledAud"));
  assert.match(settled, /Settled total/);
  assert.match(peak, /Peak queue/);
  assert.match(settled, /50%/);
  assert.match(settled, /150%/);
  assert.notEqual(settled, peak);
  assert.throws(() => buildSensitivityBarsSvg(rows, "discountBps"), RangeError);
});
