import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  compareScenarios,
  hoursToFirstSettlement,
  runSimulation
} from "../src/model.js";

test("normal Friday settles in the first interval so hours-to-first-settlement is zero", () => {
  const result = runSimulation(DEFAULT_SCENARIO);
  assert.ok(result.timeline[1].settledThisHour > 0);
  assert.equal(result.summary.hoursToFirstSettlement, 0);
  assert.equal(hoursToFirstSettlement(result.timeline), 0);
});

test("closed payout chain reports no settlement in 72 hours", () => {
  const result = runSimulation({ ...DEFAULT_SCENARIO, payoutThroughputAudPerHour: 0 });
  assert.equal(result.summary.totalSettledAud, 0);
  assert.equal(result.summary.hoursToFirstSettlement, null);
  assert.equal(hoursToFirstSettlement(result.timeline), null);
});

test("Monday-only overlap reports hours from Friday 15:00 to the first settling interval", () => {
  const result = runSimulation({
    ...DEFAULT_SCENARIO,
    issuerOpenStartHour: 8,
    issuerOpenEndHour: 12,
    bankOpenStartHour: 8,
    bankOpenEndHour: 12,
    payoutOpenStartHour: 8,
    payoutOpenEndHour: 12
  });
  assert.equal(result.timeline[1].settledThisHour, 0);
  assert.ok(result.summary.hoursToFirstSettlement > 0);
  assert.ok(result.summary.hoursToFirstSettlement < 72);
  const first = result.timeline.find((point) => point.settledThisHour > 0);
  assert.equal(result.summary.hoursToFirstSettlement, first.hour - 1);
});

test("comparison deltas stay numeric for matching settlement hours and stay null when one run never settles", () => {
  const same = compareScenarios(DEFAULT_SCENARIO, DEFAULT_SCENARIO);
  assert.equal(same.deltas.hoursToFirstSettlement, 0);
  const mixed = compareScenarios(DEFAULT_SCENARIO, { ...DEFAULT_SCENARIO, issuerThroughputAudPerHour: 0 });
  assert.equal(mixed.candidate.summary.hoursToFirstSettlement, null);
  assert.equal(mixed.deltas.hoursToFirstSettlement, null);
});

test("dashboard surfaces hours to first settlement or the 72-hour empty result", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="first-settlement-value"/);
  assert.match(html, /Hours to first settlement/);
  assert.match(app, /No settlement in 72h/);
  assert.match(app, /hoursToFirstSettlement/);
});
