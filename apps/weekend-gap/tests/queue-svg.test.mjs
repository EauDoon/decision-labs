import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
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

test("queue SVG download uses the same file pattern as the Gantt download", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="export-queue-svg"/);
  assert.match(html, /Download queue SVG/);
  assert.match(app, /weekend-gap-queue\.svg/);
  assert.match(app, /image\/svg\+xml;charset=utf-8/);
  assert.match(app, /buildQueueChartSvg\(scenario,baselineScenario,selectedHour\)/);
  assert.match(app, /#export-queue-svg/);
  const ganttClick = app.slice(app.indexOf("#export-gantt"), app.indexOf("#export-queue-svg"));
  assert.match(ganttClick, /downloadText\(buildGateGanttSvg/);
  assert.match(ganttClick, /weekend-gap-gantt\.svg/);
});
