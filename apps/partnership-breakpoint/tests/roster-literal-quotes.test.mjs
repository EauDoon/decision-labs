import test from 'node:test';
import assert from 'node:assert/strict';
import { participantsFromCsv } from '../src/model.js';

const header = 'name,revenue share,variable cost,fixed cost,min profit,risk';

test('an interior quotation mark stays in an unquoted participant name', () => {
  // A quote in the middle of the name started quote mode and was then
  // discarded, so Cafe "North" imported as Cafe North.
  const people = participantsFromCsv(`${header}\nCafe "North",0.5,1,2,3,4\nBea,0.5,1,2,3,4\n`);
  assert.equal(people[0].name, 'Cafe "North"');
  assert.equal(people[1].name, 'Bea');
  assert.equal(people[0].revenueShare, 0.5);
});

test('a name that starts with a quote still unquotes and keeps an escaped quote', () => {
  const quoted = participantsFromCsv(`${header}\n"Cafe, North",0.5,1,2,3,4\nBea,0.5,1,2,3,4\n`);
  assert.equal(quoted[0].name, 'Cafe, North');
  const escaped = participantsFromCsv(`${header}\n"Cafe ""North""",0.5,1,2,3,4\nBea,0.5,1,2,3,4\n`);
  assert.equal(escaped[0].name, 'Cafe "North"');
});
