import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SCENARIO,
  previewWindowShift,
  runSimulation,
  shiftOperatingWindow
} from "../src/model.js";

test("window shift clamps to valid hours and keeps a one-hour minimum", () => {
  const source = { ...DEFAULT_SCENARIO };
  const shifted = shiftOperatingWindow(source, "issuer", -20, 20);
  assert.equal(source.issuerOpenStartHour, DEFAULT_SCENARIO.issuerOpenStartHour);
  assert.equal(shifted.issuerOpenStartHour, 0);
  assert.equal(shifted.issuerOpenEndHour, 24);
  const tight = shiftOperatingWindow({ ...DEFAULT_SCENARIO, issuerOpenStartHour: 22, issuerOpenEndHour: 23 }, "issuer", 5, 5);
  assert.equal(tight.issuerOpenStartHour, 23);
  assert.equal(tight.issuerOpenEndHour, 24);
});

test("window shift rejects unknown gates and fractional hours", () => {
  assert.throws(() => shiftOperatingWindow(DEFAULT_SCENARIO, "fx", 1, 1), RangeError);
  assert.throws(() => shiftOperatingWindow(DEFAULT_SCENARIO, "issuer", 1.5, 0), RangeError);
  assert.throws(() => previewWindowShift(DEFAULT_SCENARIO, "issuer", 0, "1"), RangeError);
});

test("window-shift preview reports peak queue and settled deltas without applying", () => {
  const source = { ...DEFAULT_SCENARIO, bankOpenStartHour: 8, bankOpenEndHour: 17 };
  const preview = previewWindowShift(source, "bank", 10, 5);
  assert.equal(source.bankOpenStartHour, 8);
  assert.equal(preview.applied.bankOpenStartHour, 18);
  assert.equal(preview.applied.bankOpenEndHour, 22);
  const current = runSimulation(source).summary;
  const candidate = runSimulation(preview.applied).summary;
  assert.equal(preview.current.peakQueuedAud, current.peakQueuedAud);
  assert.equal(preview.current.totalSettledAud, current.totalSettledAud);
  assert.equal(preview.candidate.peakQueuedAud, candidate.peakQueuedAud);
  assert.equal(preview.candidate.totalSettledAud, candidate.totalSettledAud);
  assert.equal(preview.deltas.peakQueuedAud, candidate.peakQueuedAud - current.peakQueuedAud);
  assert.equal(preview.deltas.totalSettledAud, candidate.totalSettledAud - current.totalSettledAud);
  assert.equal(preview.current.hoursToFirstSettlement, current.hoursToFirstSettlement);
  assert.equal(preview.candidate.hoursToFirstSettlement, candidate.hoursToFirstSettlement);
  if (typeof current.hoursToFirstSettlement === "number" && typeof candidate.hoursToFirstSettlement === "number") {
    assert.equal(preview.deltas.hoursToFirstSettlement, candidate.hoursToFirstSettlement - current.hoursToFirstSettlement);
  } else {
    assert.equal(preview.deltas.hoursToFirstSettlement, current.hoursToFirstSettlement === candidate.hoursToFirstSettlement ? 0 : null);
  }
  assert.ok(preview.deltas.totalSettledAud < 0);
});

test("window-shift hours-to-first-settlement delta stays null when one side never settles", () => {
  const closed = { ...DEFAULT_SCENARIO, payoutThroughputAudPerHour: 0 };
  const preview = previewWindowShift(closed, "payout", 0, 0);
  assert.equal(preview.current.hoursToFirstSettlement, null);
  assert.equal(preview.candidate.hoursToFirstSettlement, null);
  assert.equal(preview.deltas.hoursToFirstSettlement, 0);
  const mixed = previewWindowShift(DEFAULT_SCENARIO, "payout", 10, 10);
  assert.equal(mixed.current.hoursToFirstSettlement, 0);
  assert.equal(mixed.candidate.hoursToFirstSettlement, null);
  assert.equal(mixed.deltas.hoursToFirstSettlement, null);
});

test("zero shift preview is a no-op on windows and settlement", () => {
  const preview = previewWindowShift(DEFAULT_SCENARIO, "payout", 0, 0);
  assert.equal(preview.applied.payoutOpenStartHour, DEFAULT_SCENARIO.payoutOpenStartHour);
  assert.equal(preview.applied.payoutOpenEndHour, DEFAULT_SCENARIO.payoutOpenEndHour);
  assert.equal(preview.deltas.peakQueuedAud, 0);
  assert.equal(preview.deltas.totalSettledAud, 0);
  assert.equal(preview.deltas.hoursToFirstSettlement, 0);
});
