import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  PRESETS,
  analysisToJSON,
  dashboardToCSV,
  runSimulation
} from "../src/model.js";

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

test("dashboard CSV is one formula-safe row with empty cells when events never occur", () => {
  const open = parseCsv(dashboardToCSV(DEFAULT_SCENARIO));
  const result = runSimulation(DEFAULT_SCENARIO);
  assert.deepEqual(open[0], ["hours_to_clear", "peak_hour_label", "hours_to_first_settlement"]);
  assert.equal(open.length, 2);
  assert.equal(open[1][0], String(result.summary.hoursToClearQueue));
  assert.equal(open[1][1], "Mon 08:00 (hour 65)");
  assert.equal(open[1][2], "0");
  assert.match(dashboardToCSV(DEFAULT_SCENARIO), /^"hours_to_clear","peak_hour_label","hours_to_first_settlement"\r\n/);
  const leftover = parseCsv(dashboardToCSV(PRESETS.marketStress));
  assert.equal(leftover[1][0], "");
  assert.match(leftover[1][1], /Mon 15:00/);
  const closed = parseCsv(dashboardToCSV({ ...DEFAULT_SCENARIO, payoutThroughputAudPerHour: 0 }));
  assert.equal(closed[1][2], "");
  const empty = parseCsv(dashboardToCSV({ ...DEFAULT_SCENARIO, redemptionDemandAud: 0 }));
  assert.equal(empty[1][0], "");
  assert.equal(empty[1][1], "");
  assert.equal(empty[1][2], "");
  const unsafe = dashboardToCSV({ ...DEFAULT_SCENARIO, name: '=HYPERLINK("bad")' });
  assert.doesNotMatch(unsafe, /(?:^|,)=HYPERLINK/m);
  assert.doesNotMatch(unsafe, /timestamp|createdAt|exportedAt/i);
});

test("analysis JSON still has no created or exported clocks after dashboard CSV", () => {
  const output = analysisToJSON(DEFAULT_SCENARIO, PRESETS.weekendRush, 80, 70);
  const report = JSON.parse(output);
  for (const key of ["timestamp", "createdAt", "exportedAt", "generatedAt"]) {
    assert.equal(Object.prototype.hasOwnProperty.call(report, key), false);
  }
  assert.doesNotMatch(output, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
});

test("dashboard CSV export is wired on the outcome card", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="export-dashboard-csv"/);
  assert.match(html, /Export dashboard CSV/);
  assert.match(app, /dashboardToCSV\(scenario\)/);
  assert.match(app, /weekend-gap-dashboard\.csv/);
  assert.match(app, /no timestamps/);
});
