import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

// Scenario JSON and analysis JSON revoked their blob URLs in the same task as
// link.click(). Firefox can cancel the save before it reads the blob. Workspace
// export already defers the revoke; these two downloads did not.
const source = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

function between(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.ok(start !== -1 && end > start, `missing ${startMarker} .. ${endMarker}`);
  return source.slice(start, end);
}

function run(fragment, call) {
  const revoked = [];
  const timers = [];
  let clicked = 0;
  const link = {
    href: "",
    download: "",
    click() { clicked += 1; },
    remove() {},
  };
  const context = vm.createContext({
    Blob: class { constructor(parts) { this.parts = parts; } },
    URL: {
      createObjectURL() { return "blob:weekend-1"; },
      revokeObjectURL(url) { revoked.push(url); },
    },
    document: {
      body: { append() {}, },
      createElement: () => link,
    },
    window: {
      setTimeout(fn, ms) { timers.push({ fn, ms }); return timers.length; },
    },
    setTimeout(fn, ms) { timers.push({ fn, ms }); return timers.length; },
    scenario: { name: "case" },
    baselineScenario: { name: "base" },
    reservePlan: { targetPercent: 80, deadlineHour: 48 },
    scenarioToJSON: () => "{\"scenario\":true}",
    analysisToJSON: () => "{\"analysis\":true}",
    setMessage() {},
  });
  vm.runInContext(`${fragment}\n${call}`, context);
  return { revoked, timers, clicked, download: link.download };
}

const helpers = `${between("function downloadScenario()", "function planningAud(")}\n${between("function downloadAnalysis()", "document.querySelector(\"#analysis-export\")")}\n${between("function downloadText(", "document.querySelector(\"#workspace-notes\")")}`;

test("scenario export clicks the link before the blob URL is revoked", () => {
  const result = run(helpers, "downloadScenario();");
  assert.equal(result.clicked, 1);
  assert.equal(result.download, "weekend-gap-scenario.json");
  assert.deepEqual(result.revoked, []);
  assert.equal(result.timers.length, 1);
  assert.ok(result.timers[0].ms >= 100);
  result.timers[0].fn();
  assert.deepEqual(result.revoked, ["blob:weekend-1"]);
});

test("analysis export does not revoke its blob URL in the click task", () => {
  const analysis = between('document.querySelector("#analysis-export").addEventListener', "function hourDeltaLabel(");
  assert.match(analysis, /downloadAnalysis\(/);
  assert.doesNotMatch(analysis, /revokeObjectURL/);
  const result = run(helpers, "downloadAnalysis();");
  assert.equal(result.clicked, 1);
  assert.equal(result.download, "weekend-gap-analysis.json");
  assert.deepEqual(result.revoked, []);
  assert.equal(result.timers.length, 1);
  result.timers[0].fn();
  assert.deepEqual(result.revoked, ["blob:weekend-1"]);
});
