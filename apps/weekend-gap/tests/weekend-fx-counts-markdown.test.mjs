import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SCENARIO,
  SIMULATION_HOURS,
  fxGanttHoursToMarkdown,
  ganttHourIsWeekend,
  buildGateSchedule,
  weekendFxHourCountsToMarkdown
} from "../src/model.js";

test("weekend FX hour counts are compact open and closed counts, not a bank calendar", () => {
  const text = weekendFxHourCountsToMarkdown(DEFAULT_SCENARIO);
  assert.equal(text, weekendFxHourCountsToMarkdown(DEFAULT_SCENARIO));
  assert.equal(text.split("\n").length, 1);
  const schedule = buildGateSchedule(DEFAULT_SCENARIO);
  let open = 0;
  let closed = 0;
  for (let hour = 0; hour < SIMULATION_HOURS; hour += 1) {
    const point = schedule.hours[hour];
    if (!ganttHourIsWeekend(point)) continue;
    if (point.fxWeekday) open += 1;
    else closed += 1;
  }
  assert.equal(open, 0);
  assert.equal(closed, 48);
  assert.equal(text, "Weekend FX hours: " + open + " open, " + closed + " closed. Counts of modeled hours, not a bank calendar.");
  assert.match(text, /not a bank calendar/);
  assert.doesNotMatch(text, /timestamp|createdAt|exportedAt/i);
  assert.notEqual(text, fxGanttHoursToMarkdown(DEFAULT_SCENARIO));
});
