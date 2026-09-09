import test from 'node:test';
import assert from 'node:assert/strict';
import { uniqueCopyName } from '../src/model.js';

test('uniqueCopyName appends copy and numbers collisions without timestamps', () => {
  assert.equal(uniqueCopyName('Harbor JV', []), 'Harbor JV copy');
  assert.equal(uniqueCopyName('Harbor JV', ['Harbor JV copy']), 'Harbor JV copy 2');
  assert.equal(uniqueCopyName('Harbor JV', ['Harbor JV copy', 'Harbor JV copy 2']), 'Harbor JV copy 3');
  assert.equal(uniqueCopyName('   ', []), 'Current case copy');
  assert.equal(uniqueCopyName(null, []), 'Current case copy');
  const long = 'x'.repeat(80);
  const named = uniqueCopyName(long, []);
  assert.ok(named.length <= 80);
  assert.match(named, /copy$/);
  assert.equal(uniqueCopyName('Alpha', ['Alpha copy', 'Alpha copy 2', 'Alpha copy 3']), 'Alpha copy 4');
});
