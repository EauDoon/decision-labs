import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { DEFAULT_SCENARIO, PRESETS, analysisToJSON } from "../src/model.js";

const TIMESTAMP_KEYS = ["timestamp", "createdAt", "exportedAt", "generatedAt", "created_at", "exported_at"];

test("analysis JSON remains timestamp-free for identical inputs", () => {
  const output = analysisToJSON(DEFAULT_SCENARIO, PRESETS.weekendRush, 80, 70);
  assert.equal(output, analysisToJSON(DEFAULT_SCENARIO, PRESETS.weekendRush, 80, 70));
  const payout = analysisToJSON(DEFAULT_SCENARIO, PRESETS.sundayLatePayoutClose, 80, 70);
  assert.equal(payout, analysisToJSON(DEFAULT_SCENARIO, PRESETS.sundayLatePayoutClose, 80, 70));
  const saturday = analysisToJSON(DEFAULT_SCENARIO, PRESETS.saturdayEarlyPayoutOpen, 80, 70);
  assert.equal(saturday, analysisToJSON(DEFAULT_SCENARIO, PRESETS.saturdayEarlyPayoutOpen, 80, 70));
  const friday = analysisToJSON(DEFAULT_SCENARIO, PRESETS.fridayEarlyPayoutOpen, 80, 70);
  assert.equal(friday, analysisToJSON(DEFAULT_SCENARIO, PRESETS.fridayEarlyPayoutOpen, 80, 70));
  const saturdayLate = analysisToJSON(DEFAULT_SCENARIO, PRESETS.saturdayLatePayoutOpen, 80, 70);
  assert.equal(saturdayLate, analysisToJSON(DEFAULT_SCENARIO, PRESETS.saturdayLatePayoutOpen, 80, 70));
  const sundayEarly = analysisToJSON(DEFAULT_SCENARIO, PRESETS.sundayEarlyPayoutOpen, 80, 70);
  assert.equal(sundayEarly, analysisToJSON(DEFAULT_SCENARIO, PRESETS.sundayEarlyPayoutOpen, 80, 70));
  const sundayIssuer = analysisToJSON(DEFAULT_SCENARIO, PRESETS.sundayLateIssuerClose, 80, 70);
  assert.equal(sundayIssuer, analysisToJSON(DEFAULT_SCENARIO, PRESETS.sundayLateIssuerClose, 80, 70));
  const sundayEarlyIssuer = analysisToJSON(DEFAULT_SCENARIO, PRESETS.sundayEarlyIssuerOpen, 80, 70);
  assert.equal(sundayEarlyIssuer, analysisToJSON(DEFAULT_SCENARIO, PRESETS.sundayEarlyIssuerOpen, 80, 70));
  const saturdayEarlyIssuer = analysisToJSON(DEFAULT_SCENARIO, PRESETS.saturdayEarlyIssuerOpen, 80, 70);
  assert.equal(saturdayEarlyIssuer, analysisToJSON(DEFAULT_SCENARIO, PRESETS.saturdayEarlyIssuerOpen, 80, 70));
  const fridayEarlyIssuer = analysisToJSON(DEFAULT_SCENARIO, PRESETS.fridayEarlyIssuerOpen, 80, 70);
  assert.equal(fridayEarlyIssuer, analysisToJSON(DEFAULT_SCENARIO, PRESETS.fridayEarlyIssuerOpen, 80, 70));
  const saturdayEarlyBank = analysisToJSON(DEFAULT_SCENARIO, PRESETS.saturdayEarlyBankOpen, 80, 70);
  assert.equal(saturdayEarlyBank, analysisToJSON(DEFAULT_SCENARIO, PRESETS.saturdayEarlyBankOpen, 80, 70));
  const report = JSON.parse(output);
  const payoutReport = JSON.parse(payout);
  const saturdayReport = JSON.parse(saturday);
  const fridayReport = JSON.parse(friday);
  const saturdayLateReport = JSON.parse(saturdayLate);
  const sundayEarlyReport = JSON.parse(sundayEarly);
  const sundayIssuerReport = JSON.parse(sundayIssuer);
  const sundayEarlyIssuerReport = JSON.parse(sundayEarlyIssuer);
  const saturdayEarlyIssuerReport = JSON.parse(saturdayEarlyIssuer);
  const fridayEarlyIssuerReport = JSON.parse(fridayEarlyIssuer);
  const saturdayEarlyBankReport = JSON.parse(saturdayEarlyBank);
  for (const key of TIMESTAMP_KEYS) {
    assert.equal(Object.prototype.hasOwnProperty.call(report, key), false, `analysis JSON must not include ${key}`);
    assert.equal(Object.prototype.hasOwnProperty.call(payoutReport, key), false, `analysis JSON must not include ${key}`);
    assert.equal(Object.prototype.hasOwnProperty.call(saturdayReport, key), false, `analysis JSON must not include ${key}`);
    assert.equal(Object.prototype.hasOwnProperty.call(fridayReport, key), false, `analysis JSON must not include ${key}`);
    assert.equal(Object.prototype.hasOwnProperty.call(saturdayLateReport, key), false, `analysis JSON must not include ${key}`);
    assert.equal(Object.prototype.hasOwnProperty.call(sundayEarlyReport, key), false, `analysis JSON must not include ${key}`);
    assert.equal(Object.prototype.hasOwnProperty.call(sundayIssuerReport, key), false, `analysis JSON must not include ${key}`);
    assert.equal(Object.prototype.hasOwnProperty.call(sundayEarlyIssuerReport, key), false, `analysis JSON must not include ${key}`);
    assert.equal(Object.prototype.hasOwnProperty.call(saturdayEarlyIssuerReport, key), false, `analysis JSON must not include ${key}`);
    assert.equal(Object.prototype.hasOwnProperty.call(fridayEarlyIssuerReport, key), false, `analysis JSON must not include ${key}`);
    assert.equal(Object.prototype.hasOwnProperty.call(saturdayEarlyBankReport, key), false, `analysis JSON must not include ${key}`);
  }
  assert.doesNotMatch(output, /"timestamp"\s*:/);
  assert.doesNotMatch(output, /"createdAt"\s*:/);
  assert.doesNotMatch(output, /"exportedAt"\s*:/);
  assert.doesNotMatch(output, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  assert.doesNotMatch(payout, /"timestamp"\s*:/);
  assert.doesNotMatch(payout, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  assert.doesNotMatch(saturday, /"timestamp"\s*:/);
  assert.doesNotMatch(saturday, /"createdAt"\s*:/);
  assert.doesNotMatch(saturday, /"exportedAt"\s*:/);
  assert.doesNotMatch(saturday, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  assert.doesNotMatch(friday, /"timestamp"\s*:/);
  assert.doesNotMatch(friday, /"createdAt"\s*:/);
  assert.doesNotMatch(friday, /"exportedAt"\s*:/);
  assert.doesNotMatch(friday, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  assert.doesNotMatch(saturdayLate, /"timestamp"\s*:/);
  assert.doesNotMatch(saturdayLate, /"createdAt"\s*:/);
  assert.doesNotMatch(saturdayLate, /"exportedAt"\s*:/);
  assert.doesNotMatch(saturdayLate, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  assert.doesNotMatch(sundayEarly, /"timestamp"\s*:/);
  assert.doesNotMatch(sundayEarly, /"createdAt"\s*:/);
  assert.doesNotMatch(sundayEarly, /"exportedAt"\s*:/);
  assert.doesNotMatch(sundayEarly, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  assert.doesNotMatch(sundayIssuer, /"timestamp"\s*:/);
  assert.doesNotMatch(sundayIssuer, /"createdAt"\s*:/);
  assert.doesNotMatch(sundayIssuer, /"exportedAt"\s*:/);
  assert.doesNotMatch(sundayIssuer, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  assert.doesNotMatch(sundayEarlyIssuer, /"timestamp"\s*:/);
  assert.doesNotMatch(sundayEarlyIssuer, /"createdAt"\s*:/);
  assert.doesNotMatch(sundayEarlyIssuer, /"exportedAt"\s*:/);
  assert.doesNotMatch(sundayEarlyIssuer, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  assert.doesNotMatch(saturdayEarlyIssuer, /"timestamp"\s*:/);
  assert.doesNotMatch(saturdayEarlyIssuer, /"createdAt"\s*:/);
  assert.doesNotMatch(saturdayEarlyIssuer, /"exportedAt"\s*:/);
  assert.doesNotMatch(saturdayEarlyIssuer, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  assert.doesNotMatch(fridayEarlyIssuer, /"timestamp"\s*:/);
  assert.doesNotMatch(fridayEarlyIssuer, /"createdAt"\s*:/);
  assert.doesNotMatch(fridayEarlyIssuer, /"exportedAt"\s*:/);
  assert.doesNotMatch(fridayEarlyIssuer, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  assert.doesNotMatch(saturdayEarlyBank, /"timestamp"\s*:/);
  assert.doesNotMatch(saturdayEarlyBank, /"createdAt"\s*:/);
  assert.doesNotMatch(saturdayEarlyBank, /"exportedAt"\s*:/);
  assert.doesNotMatch(saturdayEarlyBank, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
});

test("analysis JSON for Saturday early payout open still has no timestamps", () => {
  const output = analysisToJSON(DEFAULT_SCENARIO, PRESETS.saturdayEarlyPayoutOpen, 75, 72);
  assert.equal(output, analysisToJSON(DEFAULT_SCENARIO, PRESETS.saturdayEarlyPayoutOpen, 75, 72));
  assert.doesNotMatch(output, /timestamp|createdAt|exportedAt|generatedAt|created_at|exported_at/i);
  assert.doesNotMatch(output, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  const walk = (value) => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const key of Object.keys(value)) {
      assert.equal(TIMESTAMP_KEYS.includes(key), false, `analysis JSON must not include ${key}`);
      walk(value[key]);
    }
  };
  walk(JSON.parse(output));
});

test("analysis JSON for Friday early payout open still has no timestamps", () => {
  const output = analysisToJSON(DEFAULT_SCENARIO, PRESETS.fridayEarlyPayoutOpen, 75, 72);
  assert.equal(output, analysisToJSON(DEFAULT_SCENARIO, PRESETS.fridayEarlyPayoutOpen, 75, 72));
  assert.doesNotMatch(output, /timestamp|createdAt|exportedAt|generatedAt|created_at|exported_at/i);
  assert.doesNotMatch(output, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  const walk = (value) => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const key of Object.keys(value)) {
      assert.equal(TIMESTAMP_KEYS.includes(key), false, `analysis JSON must not include ${key}`);
      walk(value[key]);
    }
  };
  walk(JSON.parse(output));
});

test("analysis JSON for Saturday late payout open still has no timestamps", () => {
  const output = analysisToJSON(DEFAULT_SCENARIO, PRESETS.saturdayLatePayoutOpen, 75, 72);
  assert.equal(output, analysisToJSON(DEFAULT_SCENARIO, PRESETS.saturdayLatePayoutOpen, 75, 72));
  assert.doesNotMatch(output, /timestamp|createdAt|exportedAt|generatedAt|created_at|exported_at/i);
  assert.doesNotMatch(output, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  const walk = (value) => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const key of Object.keys(value)) {
      assert.equal(TIMESTAMP_KEYS.includes(key), false, `analysis JSON must not include ${key}`);
      walk(value[key]);
    }
  };
  walk(JSON.parse(output));
});

test("analysis JSON for Sunday early payout open still has no timestamps", () => {
  const output = analysisToJSON(DEFAULT_SCENARIO, PRESETS.sundayEarlyPayoutOpen, 75, 72);
  assert.equal(output, analysisToJSON(DEFAULT_SCENARIO, PRESETS.sundayEarlyPayoutOpen, 75, 72));
  assert.doesNotMatch(output, /timestamp|createdAt|exportedAt|generatedAt|created_at|exported_at/i);
  assert.doesNotMatch(output, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  const walk = (value) => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const key of Object.keys(value)) {
      assert.equal(TIMESTAMP_KEYS.includes(key), false, `analysis JSON must not include ${key}`);
      walk(value[key]);
    }
  };
  walk(JSON.parse(output));
});

test("analysis JSON for Sunday late issuer close still has no timestamps", () => {
  const output = analysisToJSON(DEFAULT_SCENARIO, PRESETS.sundayLateIssuerClose, 75, 72);
  assert.equal(output, analysisToJSON(DEFAULT_SCENARIO, PRESETS.sundayLateIssuerClose, 75, 72));
  assert.doesNotMatch(output, /timestamp|createdAt|exportedAt|generatedAt|created_at|exported_at/i);
  assert.doesNotMatch(output, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  const walk = (value) => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const key of Object.keys(value)) {
      assert.equal(TIMESTAMP_KEYS.includes(key), false, `analysis JSON must not include ${key}`);
      walk(value[key]);
    }
  };
  walk(JSON.parse(output));
});

test("analysis JSON for Sunday early issuer open still has no timestamps", () => {
  const output = analysisToJSON(DEFAULT_SCENARIO, PRESETS.sundayEarlyIssuerOpen, 75, 72);
  assert.equal(output, analysisToJSON(DEFAULT_SCENARIO, PRESETS.sundayEarlyIssuerOpen, 75, 72));
  assert.doesNotMatch(output, /timestamp|createdAt|exportedAt|generatedAt|created_at|exported_at/i);
  assert.doesNotMatch(output, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  const walk = (value) => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const key of Object.keys(value)) {
      assert.equal(TIMESTAMP_KEYS.includes(key), false, `analysis JSON must not include ${key}`);
      walk(value[key]);
    }
  };
  walk(JSON.parse(output));
});

test("analysis JSON for Saturday early issuer open still has no timestamps", () => {
  const output = analysisToJSON(DEFAULT_SCENARIO, PRESETS.saturdayEarlyIssuerOpen, 75, 72);
  assert.equal(output, analysisToJSON(DEFAULT_SCENARIO, PRESETS.saturdayEarlyIssuerOpen, 75, 72));
  assert.doesNotMatch(output, /timestamp|createdAt|exportedAt|generatedAt|created_at|exported_at/i);
  assert.doesNotMatch(output, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  const walk = (value) => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const key of Object.keys(value)) {
      assert.equal(TIMESTAMP_KEYS.includes(key), false, `analysis JSON must not include ${key}`);
      walk(value[key]);
    }
  };
  walk(JSON.parse(output));
});

test("analysis JSON for Friday early issuer open still has no timestamps", () => {
  const output = analysisToJSON(DEFAULT_SCENARIO, PRESETS.fridayEarlyIssuerOpen, 75, 72);
  assert.equal(output, analysisToJSON(DEFAULT_SCENARIO, PRESETS.fridayEarlyIssuerOpen, 75, 72));
  assert.doesNotMatch(output, /timestamp|createdAt|exportedAt|generatedAt|created_at|exported_at/i);
  assert.doesNotMatch(output, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  const walk = (value) => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const key of Object.keys(value)) {
      assert.equal(TIMESTAMP_KEYS.includes(key), false, `analysis JSON must not include ${key}`);
      walk(value[key]);
    }
  };
  walk(JSON.parse(output));
});

test("analysis JSON for Saturday early bank open still has no timestamps", () => {
  const output = analysisToJSON(DEFAULT_SCENARIO, PRESETS.saturdayEarlyBankOpen, 75, 72);
  assert.equal(output, analysisToJSON(DEFAULT_SCENARIO, PRESETS.saturdayEarlyBankOpen, 75, 72));
  assert.doesNotMatch(output, /timestamp|createdAt|exportedAt|generatedAt|created_at|exported_at/i);
  assert.doesNotMatch(output, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  const walk = (value) => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const key of Object.keys(value)) {
      assert.equal(TIMESTAMP_KEYS.includes(key), false, `analysis JSON must not include ${key}`);
      walk(value[key]);
    }
  };
  walk(JSON.parse(output));
});

test("analysisToJSON does not call the clock", async () => {
  const model = await readFile(new URL("../src/model.js", import.meta.url), "utf8");
  const start = model.indexOf("export function analysisToJSON");
  const next = model.indexOf("export function ", start + 1);
  const body = model.slice(start, next);
  assert.doesNotMatch(body, /Date\.now|new Date|toISOString|performance\.now/);
  assert.doesNotMatch(model, /Date\.now|Math\.random|fetch\(|XMLHttpRequest/);
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /analysisToJSON\(baselineScenario, scenario/);
});
