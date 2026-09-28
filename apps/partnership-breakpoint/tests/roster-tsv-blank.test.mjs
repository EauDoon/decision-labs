import test from 'node:test';
import assert from 'node:assert/strict';
import { participantsFromRosterText } from '../src/model.js';

const tsv = [
  'name\trevenue share\tvariable cost\tfixed cost\tmin profit\trisk',
  'Ada\t0.5\t1\t0\t0\t0',
  'Bea\t0.5\t1\t0\t0\t0',
  '',
].join('\n');

const csv = [
  'name,revenue share,variable cost,fixed cost,min profit,risk',
  'Ada,0.5,1,0,0,0',
  'Bea,0.5,1,0,0,0',
  '',
].join('\n');

test('pasted roster TSV still imports when blank lines precede the header', () => {
  // The delimiter check looked at the first physical line. A leading blank
  // line has no tab, so the paste was read as CSV and the header became one
  // unknown column. Deal terms are not part of this text.
  for (const prefix of ['\n', '\r\n', '   \n', '\n\n']) {
    const people = participantsFromRosterText(`${prefix}${tsv}`);
    assert.deepEqual(people.map((person) => person.name), ['Ada', 'Bea']);
    assert.deepEqual(people.map((person) => person.revenueShare), [0.5, 0.5]);
  }
  const fromCsv = participantsFromRosterText(`\n${csv}`);
  assert.deepEqual(fromCsv.map((person) => person.name), ['Ada', 'Bea']);
});
