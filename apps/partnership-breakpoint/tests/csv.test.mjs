import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ValidationError,
  clonePreset,
  escapeCsvCell,
  neutralizeCsvCell,
  parseCsv,
  participantsFromCsv,
  participantsFromRosterText,
  participantsToCsv,
  stressGridCsv,
  validateConfiguration,
} from '../src/model.js';

const HEADER = 'name,revenue share,variable cost,fixed cost,min profit,capacity,commitment,risk';

function csvFrom(rows) {
  return [HEADER, ...rows].join('\n');
}

test('neutralizeCsvCell strips a spreadsheet quoting apostrophe from formula prefixes', () => {
  assert.equal(neutralizeCsvCell("'=HYPERLINK(\"x\")"), '=HYPERLINK("x")');
  assert.equal(neutralizeCsvCell("'+SUM(1,2)"), '+SUM(1,2)');
  assert.equal(neutralizeCsvCell("'@cmd"), '@cmd');
  assert.equal(neutralizeCsvCell("'-1+1"), '-1+1');
  assert.equal(neutralizeCsvCell("'\t=CMD"), '\t=CMD');
  assert.equal(neutralizeCsvCell('Platform'), 'Platform');
  assert.equal(neutralizeCsvCell("O'Brien"), "O'Brien");
});

test('parseCsv reads quoted commas, escaped quotes, and CRLF rows', () => {
  const rows = parseCsv('name,share\r\n"Acme, Inc.",0.5\n"Quote ""marks""",0.5\n');
  assert.deepEqual(rows, [
    ['name', 'share'],
    ['Acme, Inc.', '0.5'],
    ['Quote "marks"', '0.5'],
  ]);
});

test('parseCsv rejects empty text, non-text, and unterminated quotes', () => {
  assert.throws(() => parseCsv(''), (error) => error instanceof ValidationError && /CSV is empty/.test(error.errors.join(' ')));
  assert.throws(() => parseCsv(null), (error) => error instanceof ValidationError && /CSV must be text/.test(error.errors.join(' ')));
  assert.throws(() => parseCsv('"open'), (error) => error instanceof ValidationError && /unterminated quoted field/.test(error.errors.join(' ')));
});

test('participantsFromCsv replaces a roster from named columns and optional blanks', () => {
  const text = csvFrom([
    'Platform,0.4,0.04,1800,1200,130000,,300',
    'Distributor,0.6,0.05,500,400,,2000,100',
  ]);
  const participants = participantsFromCsv(text);
  assert.equal(participants.length, 2);
  assert.equal(participants[0].id, 'platform');
  assert.equal(participants[0].name, 'Platform');
  assert.equal(participants[0].revenueShare, 0.4);
  assert.equal(participants[0].capacity, 130000);
  assert.equal(participants[0].minimumCommitment, null);
  assert.equal(participants[1].id, 'distributor');
  assert.equal(participants[1].capacity, null);
  assert.equal(participants[1].minimumCommitment, 2000);
  const config = { ...clonePreset('balanced'), participants };
  assert.equal(validateConfiguration(config).valid, true);
});

test('participantsFromCsv keeps formula-like names as text and does not read deal columns', () => {
  const text = [
    'name,revenue share,variable cost,fixed cost,min profit,risk,monthlyVolume',
    `"'=HYPERLINK(""bad"")",0.5,0,0,0,0`,
    'Other,0.5,0,0,0,0',
  ].join('\n');
  assert.throws(() => participantsFromCsv(text), (error) => {
    assert.match(error.errors.join(' '), /unknown column: monthlyvolume/);
    return error instanceof ValidationError;
  });

  const allowed = csvFrom([
    `"'=HYPERLINK(""bad"")",0.5,0,0,0,,,0`,
    'Other,0.5,0,0,0,,,0',
  ]);
  const participants = participantsFromCsv(allowed);
  assert.equal(participants[0].name, '=HYPERLINK("bad")');
  assert.equal(participants[0].id, 'hyperlink-bad');
});

test('participantsFromCsv names missing columns, bad numbers, and share totals', () => {
  assert.throws(() => participantsFromCsv('name,share\nA,0.5\nB,0.5\n'), (error) => {
    assert.match(error.errors.join(' '), /missing required column: variable cost/);
    return error instanceof ValidationError;
  });

  const badNumber = csvFrom([
    'A,0.5,0,0,0,,,0',
    'B,0.5,cost,0,0,,,0',
  ]);
  assert.throws(() => participantsFromCsv(badNumber), (error) => {
    assert.match(error.errors.join(' '), /Row 3 variable cost must be a finite decimal number/);
    return error instanceof ValidationError;
  });

  const shares = csvFrom([
    'A,0.4,0,0,0,,,0',
    'B,0.4,0,0,0,,,0',
  ]);
  assert.throws(() => participantsFromCsv(shares), (error) => {
    assert.match(error.errors.join(' '), /shares must sum to 1/);
    return error instanceof ValidationError;
  });
});

test('escapeCsvCell quotes fields and prefixes formula strings, not negative numbers', () => {
  assert.equal(escapeCsvCell('Platform'), '"Platform"');
  assert.equal(escapeCsvCell('=HYPERLINK("bad")'), '"\'=HYPERLINK(""bad"")"');
  assert.equal(escapeCsvCell('+SUM(1,2)'), '"\'+SUM(1,2)"');
  assert.equal(escapeCsvCell('@cmd'), '"\'@cmd"');
  assert.equal(escapeCsvCell('-1+1'), '"\'-1+1"');
  assert.equal(escapeCsvCell('\t=CMD'), '"\'\t=CMD"');
  assert.equal(escapeCsvCell(-20), '"-20"');
  assert.equal(escapeCsvCell('Quote "marks"'), '"Quote ""marks"""');
});

test('stressGridCsv exports every participant case and can filter by scenario ids', () => {
  const config = clonePreset('balanced');
  config.participants[0].name = '=HYPERLINK("bad")';
  const csv = stressGridCsv(config);
  assert.equal(csv.trim().split('\r\n').length, 82);
  assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));
  assert.match(csv, /Profit gap/);
  assert.doesNotMatch(csv, /probab/i);

  const oneCase = stressGridCsv(config, { scenarioIds: ['case-1', 'missing', 'case-1'] });
  assert.equal(oneCase.trim().split('\r\n').length, 4);
  assert.match(oneCase, /"case-1"/);
  assert.doesNotMatch(oneCase, /"case-2"/);

  const none = stressGridCsv(config, { scenarioIds: [] });
  assert.equal(none.trim().split('\r\n').length, 1);

  assert.throws(() => stressGridCsv(config, { extra: true }), (error) => {
    assert.match(error.errors.join(' '), /unknown field: extra/);
    return error instanceof ValidationError;
  });
  const reserved = {};
  Object.defineProperty(reserved, '__proto__', { value: {}, enumerable: true, configurable: true });
  Object.defineProperty(reserved, 'constructor', { value: 1, enumerable: true, configurable: true });
  assert.throws(() => stressGridCsv(config, reserved), (error) => {
    assert.match(error.errors.join(' '), /reserved field: __proto__/);
    assert.match(error.errors.join(' '), /reserved field: constructor/);
    return error instanceof ValidationError;
  });
  assert.throws(() => stressGridCsv(config, { scenarioIds: ['case-1', 2] }), (error) => {
    assert.match(error.errors.join(' '), /scenarioIds must be an array of case identifiers/);
    return error instanceof ValidationError;
  });
});

test('participantsToCsv uses import columns, formula-safe cells, and empty optional blanks', () => {
  const config = clonePreset('balanced');
  config.participants[0].name = '=HYPERLINK("bad")';
  config.participants[1].capacity = null;
  config.participants[1].minimumCommitment = 2000;
  const csv = participantsToCsv(config);
  const lines = csv.trim().split('\r\n');
  assert.equal(lines[0], '"name","revenue share","variable cost","fixed cost","min profit","capacity","commitment","risk"');
  assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));
  assert.match(lines[2], /"","2000"/);
  assert.doesNotMatch(csv, /probab/i);
  const roundTrip = participantsFromCsv(csv);
  assert.equal(roundTrip.length, 3);
  assert.equal(roundTrip[0].name, '=HYPERLINK("bad")');
  assert.equal(roundTrip[0].revenueShare, 0.4);
  assert.equal(roundTrip[1].capacity, null);
  assert.equal(roundTrip[1].minimumCommitment, 2000);
  assert.equal(validateConfiguration({ ...config, participants: roundTrip }).valid, true);
});

test('participantsFromRosterText reads TSV with the same validation as CSV', () => {
  const tsv = [
    'name\trevenue share\tvariable cost\tfixed cost\tmin profit\tcapacity\tcommitment\trisk',
    'Alpha\t0.55\t0.01\t100\t50\t90000\t\t10',
    'Beta\t0.45\t0.02\t80\t40\t\t1000\t5',
  ].join('\n');
  const participants = participantsFromRosterText(tsv);
  assert.equal(participants.length, 2);
  assert.equal(participants[0].name, 'Alpha');
  assert.equal(participants[0].revenueShare, 0.55);
  assert.equal(participants[1].minimumCommitment, 1000);
  assert.equal(participants[1].capacity, null);

  const csv = participantsToCsv({ deal: { monthlyVolume: 0, feePerTransaction: 0, addressableVolume: 0 }, participants });
  assert.deepEqual(participantsFromRosterText(csv).map((item) => item.name), ['Alpha', 'Beta']);

  assert.throws(() => participantsFromRosterText('name\tshare\nA\t0.5\nB\t0.5\n'), (error) => {
    assert.match(error.errors.join(' '), /missing required column: variable cost/);
    return error instanceof ValidationError;
  });
});

test('participantsFromCsv requires two to 24 rows and unique generated ids', () => {
  assert.throws(() => participantsFromCsv(`${HEADER}\nOnly,1,0,0,0,,,0\n`), (error) => {
    assert.match(error.errors.join(' '), /at least 2 participant rows/);
    return error instanceof ValidationError;
  });

  const twins = csvFrom([
    'Alpha,0.5,0,0,0,,,0',
    'Alpha,0.5,0,0,0,,,0',
  ]);
  const participants = participantsFromCsv(twins);
  assert.deepEqual(participants.map((item) => item.id), ['alpha', 'alpha-2']);
});
