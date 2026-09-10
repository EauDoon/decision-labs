import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  GANTT_GATE_FILTERS,
  SIMULATION_HOURS,
  attributeBottlenecks,
  buildGateGanttSvg,
  runSimulation
} from "../src/model.js";

test("single-gate Gantt SVG shows one gate row and leaves the 72-hour model unchanged", () => {
  const full = buildGateGanttSvg(DEFAULT_SCENARIO, 0);
  const issuer = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { gateFilter: "issuer" });
  const bank = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { gateFilter: "bank" });
  const payout = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { gateFilter: "payout" });
  const fx = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { gateFilter: "fx" });
  assert.deepEqual([...GANTT_GATE_FILTERS], ["all", "issuer", "bank", "payout", "fx"]);
  assert.notEqual(full, issuer);
  assert.notEqual(issuer, bank);
  assert.match(issuer, />Issuer</);
  assert.doesNotMatch(issuer, />Bank</);
  assert.doesNotMatch(issuer, />Payout</);
  assert.match(bank, />Bank</);
  assert.doesNotMatch(bank, />Issuer</);
  assert.match(payout, />Payout</);
  assert.match(fx, />FX</);
  assert.doesNotMatch(fx, />Issuer</);
  const issuerRects = (issuer.match(/<rect /g) || []).length;
  const fullRects = (full.match(/<rect /g) || []).length;
  assert.ok(issuerRects < fullRects);
  assert.equal(attributeBottlenecks(DEFAULT_SCENARIO).hours, SIMULATION_HOURS);
  assert.equal(runSimulation(DEFAULT_SCENARIO).timeline.length, SIMULATION_HOURS + 1);
});

test("unknown Gantt gate filter values restore all gates without changing simulation", () => {
  const full = buildGateGanttSvg(DEFAULT_SCENARIO, 0);
  const restored = buildGateGanttSvg(DEFAULT_SCENARIO, 0, { gateFilter: "issuer-only" });
  assert.equal(restored, full);
  assert.equal(runSimulation(DEFAULT_SCENARIO).summary.peakQueueHour, 65);
});

test("single-gate Gantt filter is a display control with an All gates restore", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="gantt-gate-filter"/);
  assert.match(html, /All gates/);
  assert.match(html, /Issuer only/);
  assert.match(html, /Bank only/);
  assert.match(html, /Payout only/);
  assert.match(html, /FX only/);
  assert.match(app, /gateFilter/);
  assert.match(app, /Chart shows/);
  assert.match(app, /Simulation is unchanged/);
});
