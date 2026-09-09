import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DEFAULT_SCENARIO, PRESETS, queueToCSV, runSimulation } from "../src/model.js";

function parseCsv(text) {
  return text.trimEnd().split("\r\n").map((row) => {
    const cells = [];
    let current = "";
    let inQuotes = false;
    for (let index = 0; index < row.length; index += 1) {
      const char = row[index];
      if (inQuotes) {
        if (char === '"' && row[index + 1] === '"') {
          current += '"';
          index += 1;
        } else if (char === '"') inQuotes = false;
        else current += char;
      } else if (char === '"') inQuotes = true;
      else if (char === ",") {
        cells.push(current);
        current = "";
      } else current += char;
    }
    cells.push(current);
    return cells;
  });
}

test("queue CSV includes hour labels and queue size for every checkpoint", () => {
  const run = runSimulation(PRESETS.weekendRush);
  const base = runSimulation(DEFAULT_SCENARIO);
  const rows = parseCsv(queueToCSV(PRESETS.weekendRush, DEFAULT_SCENARIO));
  assert.deepEqual(rows[0], ["hour", "time_label", "queued_aud", "baseline_queued_aud", "scenario_name"]);
  assert.equal(rows.length, 74);
  assert.equal(rows[1][0], "0");
  assert.equal(rows[1][1], "Fri 15:00");
  for (let hour = 0; hour <= 72; hour += 1) {
    assert.equal(rows[hour + 1][0], String(hour));
    assert.equal(rows[hour + 1][1], run.timeline[hour].timeLabel);
    assert.equal(Number(rows[hour + 1][2]), run.timeline[hour].queuedAud);
    assert.equal(Number(rows[hour + 1][3]), base.timeline[hour].queuedAud);
    assert.equal(rows[hour + 1][4], PRESETS.weekendRush.name);
  }
});

test("queue CSV quotes cells and prefixes formula-like scenario names", () => {
  const text = queueToCSV({ ...DEFAULT_SCENARIO, name: '=HYPERLINK("bad")\nextra' });
  assert.equal(text.trimEnd().split("\r\n").length, 74);
  assert.match(text, /^"hour","time_label","queued_aud","baseline_queued_aud","scenario_name"\r\n/);
  assert.match(text, /"'=HYPERLINK\(""bad""\)\nextra"/);
  assert.doesNotMatch(text, /(?:^|,)=HYPERLINK/m);
});

test("queue CSV download is wired next to the queue SVG download", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="export-queue-csv"/);
  assert.match(html, /Export queue CSV/);
  assert.match(app, /queueToCSV\(scenario,baselineScenario\)/);
  assert.match(app, /weekend-gap-queue\.csv/);
  assert.match(app, /formula-safe spreadsheet cells/);
});
