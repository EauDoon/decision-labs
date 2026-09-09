import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('root package is a catalog with no npm dependencies', () => {
  assert.equal(pkg.name, 'decision-labs');
  assert.equal(pkg.private, true);
  assert.match(pkg.description, /local catalog of four independent, offline decision workbenches/i);
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.devDependencies, undefined);
  assert.equal(pkg.optionalDependencies, undefined);
  assert.match(pkg.scripts.start, /scripts\/serve\.mjs/);
  assert.match(pkg.scripts.test, /tests\/hub-page\.test\.mjs/);
  assert.match(pkg.scripts.test, /tests\/launcher\.test\.mjs/);
  assert.equal(pkg.engines.node, '>=20');
});
