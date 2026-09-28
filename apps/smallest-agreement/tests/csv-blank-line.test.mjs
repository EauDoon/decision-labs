import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatClauseOptionsCsv,
  formatParticipantGroupsCsv,
  formatSupportMatrixCsv,
  parseClauseOptionsCsv,
  parseParticipantGroupsCsv,
  parseSupportMatrixCsv,
} from '../src/model.js';

// Synthetic fixture. Group ids and support scores are made up for this test.
const proposal = {
  title: 'Blank line fixture',
  threshold: 60,
  groups: [
    { id: 'alpha', name: 'Alpha', weight: 1, minSupport: 40, veto: true },
    { id: 'bravo', name: 'Bravo', weight: 1 },
  ],
  clauses: [
    {
      id: 'venue',
      title: 'Venue',
      options: [
        { id: 'hall', label: 'Village hall', original: true, changeCost: 0, support: { alpha: 50, bravo: 50 } },
        { id: 'annexe', label: 'Sports annexe', changeCost: 4, support: { alpha: 80, bravo: 80 } },
        { id: 'park', label: 'Riverside park', changeCost: 2, support: { alpha: 60, bravo: 60 } },
      ],
    },
  ],
};

const SPACES = '   ';

test('parseSupportMatrixCsv ignores a whitespace-only line between real rows', () => {
  const clean = formatSupportMatrixCsv(proposal);
  const withBlankLine = clean.replace('\r\n', `\r\n${SPACES}\r\n`);
  assert.notEqual(withBlankLine, clean, 'fixture must actually contain the blank line');

  const imported = parseSupportMatrixCsv(withBlankLine, proposal);
  assert.equal(imported.status, 'ok', JSON.stringify(imported.errors));
  assert.equal(imported.updatedCells, 6);
  assert.deepEqual(imported.proposal.clauses[0].options[1].support, { alpha: 80, bravo: 80 });
});

test('parseSupportMatrixCsv still ignores a tab-only and a fully empty line', () => {
  const clean = formatSupportMatrixCsv(proposal);
  for (const blank of ['', '\t', SPACES]) {
    const imported = parseSupportMatrixCsv(clean.replace('\r\n', `\r\n${blank}\r\n`), proposal);
    assert.equal(imported.status, 'ok', `${JSON.stringify(blank)}: ${JSON.stringify(imported.errors)}`);
  }
});

test('parseParticipantGroupsCsv ignores a whitespace-only line between real rows', () => {
  const clean = formatParticipantGroupsCsv(proposal);
  const imported = parseParticipantGroupsCsv(clean.replace('\r\n', `\r\n${SPACES}\r\n`), proposal);
  assert.equal(imported.status, 'ok', JSON.stringify(imported.errors));
  assert.equal(imported.importedGroups, 2);
  assert.deepEqual(imported.proposal.groups.map((group) => group.name), ['Alpha', 'Bravo']);
});

test('parseClauseOptionsCsv ignores a whitespace-only line between real rows', () => {
  const exported = formatClauseOptionsCsv(proposal);
  assert.equal(exported.status, 'ok');
  const imported = parseClauseOptionsCsv(exported.csv.replace('\r\n', `\r\n${SPACES}\r\n`), proposal);
  assert.equal(imported.status, 'ok', JSON.stringify(imported.errors));
  assert.equal(imported.proposal.clauses[0].options.length, 3);
});

test('a whitespace-only row is still rejected when it is the only body row', () => {
  // Dropping blank rows must not invent data: a file with a header and no
  // real rows is still an empty CSV, not a successful import of nothing.
  const imported = parseSupportMatrixCsv(`"clause_id","option_id","alpha","bravo"\r\n${SPACES}\r\n`, proposal);
  assert.equal(imported.status, 'invalid');
  assert.deepEqual(imported.errors.map((error) => error.code), ['empty_csv']);
});
