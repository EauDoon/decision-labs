import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PRESETS,
  ValidationError,
  clonePreset,
  compareImportedCase,
  participantsFromCsv,
  participantsFromRosterText,
  participantsToCsv,
  redactConfiguration,
  validateConfiguration,
} from '../src/model.js';

const cli = fileURLToPath(new URL('../scripts/analyze.mjs', import.meta.url));
const HEADER = 'name,revenue share,variable cost,fixed cost,min profit,risk';

function runCli(args, input) {
  return spawnSync(process.execPath, [cli, ...args], { input, encoding: 'utf8', timeout: 30000 });
}

function withDirectory(fn) {
  const directory = mkdtempSync(join(tmpdir(), 'partnership-roster-ids-'));
  try { return fn(directory); } finally { rmSync(directory, { recursive: true, force: true }); }
}

function rejects(text, pattern) {
  assert.throws(() => participantsFromCsv(text), (error) => {
    assert.ok(error instanceof ValidationError);
    assert.match(error.errors.join(' '), pattern);
    return true;
  });
}

function planCase() {
  const config = clonePreset('threePartyJv');
  config.plan = {
    startingCash: 0, collectionLagPeriods: 0, paymentLagPeriods: 0,
    periods: [{ volume: 12000, feePerTransaction: 40, participants: { capital: { fixedMonthlyCost: 500 } } }],
  };
  config.alternatives = {
    feeLevels: [40], shareModes: ['current'], commitmentRelief: false,
    capacityInvestments: [{ participantId: 'capital', addedCapacity: 1000, investmentCost: 100 }],
    objective: 'profit',
  };
  assert.equal(validateConfiguration(config).valid, true, validateConfiguration(config).errors.join(' '));
  return config;
}

test('every preset roster survives an unchanged CSV export and import, identifiers included', () => {
  const ids = Object.keys(PRESETS);
  assert.ok(ids.length >= 61, `expected at least 61 presets, found ${ids.length}`);
  for (const id of ids) {
    const config = clonePreset(id);
    assert.deepStrictEqual(participantsFromRosterText(participantsToCsv(config)), config.participants, id);
  }
});

test('the roster export appends an id column after the eight import columns', () => {
  const lines = participantsToCsv(clonePreset('threePartyJv')).trim().split('\r\n');
  assert.equal(lines[0], '"name","revenue share","variable cost","fixed cost","min profit","capacity","commitment","risk","id"');
  assert.match(lines[2], /^"Capital Partner",.*,"capital"$/);
});

test('the CLI roster round trip keeps plan overrides and capacity investments valid', () => {
  withDirectory((directory) => {
    const config = planCase();
    const casePath = join(directory, 'case.json');
    const rosterPath = join(directory, 'roster.csv');
    writeFileSync(casePath, JSON.stringify(config));
    const exported = runCli(['roster', casePath]);
    assert.equal(exported.status, 0, exported.stderr);
    writeFileSync(rosterPath, exported.stdout);
    const imported = runCli(['roster', casePath, rosterPath]);
    assert.equal(imported.status, 0, imported.stderr);
    const back = JSON.parse(imported.stdout);
    assert.deepStrictEqual(back, config);
    const backPath = join(directory, 'back.json');
    writeFileSync(backPath, imported.stdout);
    const planBefore = runCli(['plan', casePath]);
    const planAfter = runCli(['plan', backPath]);
    assert.equal(planAfter.status, 0, planAfter.stderr);
    assert.equal(planAfter.stdout, planBefore.stdout);
    assert.equal(readFileSync(rosterPath, 'utf8'), exported.stdout);
  });
});

test('compare aligns an original case with its roster round trip', () => {
  const config = clonePreset('threePartyJv');
  const back = { ...config, participants: participantsFromCsv(participantsToCsv(config)) };
  const comparison = compareImportedCase(config, back);
  assert.equal(comparison.sameRoster, true);
  assert.equal(comparison.rows.length, config.participants.length);
  assert.equal(comparison.rows.some((row) => row.rosterMismatch), false);
});

test('a roster CSV without an id column keeps the name-derived identifiers', () => {
  const csv = `${HEADER}\nOperator,0.45,8,25000,15000,4000\nCapital Partner,0.35,0,0,80000,12000\nIP Owner,0.2,1.5,8000,20000,2000\n`;
  assert.deepEqual(participantsFromCsv(csv).map((participant) => participant.id), ['operator', 'capital-partner', 'ip-owner']);
  for (const id of ['balanced', 'threePartyJv', 'creatorTakeRate']) {
    const config = clonePreset(id);
    const legacy = participantsToCsv(config).split('\r\n').map((line) => line.replace(/,"[^"]*"$/, '')).join('\r\n');
    const names = participantsFromCsv(legacy).map((participant) => participant.id);
    const expected = config.participants.map((participant) => participant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
    assert.deepEqual(names, expected, id);
  }
});

test('blank id cells are generated without colliding with explicit identifiers', () => {
  const csv = `${HEADER},id\nCapital,0.5,0,0,0,0,\nOther,0.3,0,0,0,0,capital\nThird,0.2,0,0,0,0,\n`;
  assert.deepEqual(participantsFromCsv(csv).map((participant) => participant.id), ['capital-2', 'capital', 'third']);
  const aliased = participantsFromCsv(`${HEADER},Participant ID\nA,0.5,0,0,0,0, keep-me \nB,0.5,0,0,0,0,\n`);
  assert.deepEqual(aliased.map((participant) => participant.id), ['keep-me', 'b']);
});

test('duplicate or over-long explicit identifiers are rejected with their row', () => {
  rejects(`${HEADER},id\nA,0.5,0,0,0,0,same\nB,0.5,0,0,0,0, same\n`, /Row 3 id must be unique\./);
  rejects(`${HEADER},id\nA,0.5,0,0,0,0,${'x'.repeat(65)}\nB,0.5,0,0,0,0,\n`, /Row 2 id must be no longer than 64 characters\./);
  rejects(`${HEADER},id,id\nA,0.5,0,0,0,0,a,b\nB,0.5,0,0,0,0,c,d\n`, /CSV column id is duplicated\./);
});

test('a formula-escaped id cell is read back as text', () => {
  const ids = participantsFromCsv(`${HEADER},id\nA,0.5,0,0,0,0,"'=x"\nB,0.5,0,0,0,0,b\n`).map((participant) => participant.id);
  assert.deepEqual(ids, ['=x', 'b']);
  const config = clonePreset('balanced');
  config.participants[0].id = '=x';
  assert.deepStrictEqual(participantsFromCsv(participantsToCsv(config)), config.participants);
});

test('a pasted TSV roster with an id column keeps its identifiers', () => {
  const tsv = 'name\trevenue share\tvariable cost\tfixed cost\tmin profit\trisk\tid\nAlpha\t0.6\t0\t0\t0\t0\tfirst\nBeta\t0.4\t0\t0\t0\t0\tsecond\n';
  assert.deepEqual(participantsFromRosterText(tsv).map((participant) => participant.id), ['first', 'second']);
});

test('renaming a participant in the CSV keeps its identifier', () => {
  const config = clonePreset('threePartyJv');
  const csv = participantsToCsv(config).replace('"Capital Partner"', '"Renamed Fund"');
  const participants = participantsFromCsv(csv);
  assert.equal(participants[1].name, 'Renamed Fund');
  assert.equal(participants[1].id, 'capital');
});

test('redacted JSON replaces identifiers and every reference to them', () => {
  const redacted = redactConfiguration(planCase());
  assert.deepEqual(redacted.participants.map((participant) => participant.id), ['participant-1', 'participant-2', 'participant-3']);
  assert.deepEqual(Object.keys(redacted.plan.periods[0].participants), ['participant-2']);
  assert.equal(redacted.alternatives.capacityInvestments[0].participantId, 'participant-2');
  assert.equal(validateConfiguration(redacted).valid, true);
  assert.doesNotMatch(JSON.stringify(redacted), /capital|operator|ip-owner/i);
});

test('a CSV-imported roster exports redacted JSON without name-derived identifiers', () => {
  const config = clonePreset('balanced');
  const csv = `${HEADER}\nAcme Bank,0.5,0,0,0,0\nSynthetic Lender,0.5,0,0,0,0\n`;
  const imported = { ...config, participants: participantsFromCsv(csv) };
  const redacted = JSON.stringify(redactConfiguration(imported));
  assert.doesNotMatch(redacted, /acme|lender/i);
});

test('the CLI redact output equals redactConfiguration', () => {
  withDirectory((directory) => {
    const config = planCase();
    const path = join(directory, 'case.json');
    writeFileSync(path, JSON.stringify(config));
    const result = runCli(['redact', path]);
    assert.equal(result.status, 0, result.stderr);
    assert.deepStrictEqual(JSON.parse(result.stdout), redactConfiguration(config));
  });
});
