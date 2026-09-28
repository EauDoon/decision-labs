import test from 'node:test';
import assert from 'node:assert/strict';
import { participantsFromCsv, participantsFromRosterText } from '../src/model.js';

const header = 'name,revenue share,variable cost,fixed cost,min profit,risk';
const ada = 'Ada,0.5,1,2,3,4';
const bea = 'Bea,0.5,1,2,3,4';

test('unicode line and paragraph separators keep roster rows separate', () => {
  // U+2028 and U+2029 joined the header to the first person, so the file
  // looked like it had no participant rows.
  for (const separator of ['\u2028', '\u2029']) {
    const people = participantsFromCsv(`${header}${separator}${ada}${separator}${bea}`);
    assert.deepEqual(people.map((person) => person.name), ['Ada', 'Bea']);
    assert.equal(people[0].revenueShare, 0.5);
    assert.equal(people[1].revenueShare, 0.5);
  }
});

test('a quoted unicode line separator stays inside the participant name', () => {
  const people = participantsFromCsv(`${header}\n"Ada\u2028North",0.5,1,2,3,4\nBea,0.5,1,2,3,4\n`);
  assert.equal(people[0].name, 'Ada\u2028North');
  assert.equal(people[1].name, 'Bea');
});

test('a roster TSV separated only by a unicode line separator still imports', () => {
  const tsv = 'name\trevenue share\tvariable cost\tfixed cost\tmin profit\trisk\u2028Ada\t0.5\t1\t2\t3\t4\u2028Bea\t0.5\t1\t2\t3\t4';
  const people = participantsFromRosterText(tsv);
  assert.deepEqual(people.map((person) => person.name), ['Ada', 'Bea']);
});
