import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

// The release workflow is the only one with write access, so its guards are
// pinned here: read-only by default, write only in the release job, and a
// publish step that runs only for a pushed vX.Y.Z tag after every gate.
const workflowsDir = new URL('../.github/workflows/', import.meta.url);
const release = readFileSync(new URL('release.yml', workflowsDir), 'utf8');

test('release workflow is read-only by default and writes only from its job', () => {
  assert.match(release, /^on:\n {2}push:\n {4}tags: \["v\*\.\*\.\*"\]\n {2}workflow_dispatch:\n/m);
  assert.match(release, /^permissions:\n {2}contents: read\n/m);
  assert.equal(release.match(/contents: write/g)?.length, 1);
  assert.match(release, /^ {4}permissions:\n {6}contents: write\n/m);
  assert.match(release, /persist-credentials: false/);
});

test('release workflow gates, packages and publishes in order', () => {
  const steps = [
    'node scripts/versions.mjs check --tag "$TAG"',
    'node scripts/test-catalog.mjs',
    'npm run check',
    'node scripts/versions.mjs notes "$TAG" > "$RUNNER_TEMP/notes.md"',
    'node scripts/versions.mjs assets "$RUNNER_TEMP/dist"',
    'gh release create "$TAG" "$RUNNER_TEMP"/dist/*.html --verify-tag',
  ];
  const positions = steps.map((step) => release.indexOf(step));
  for (const [index, position] of positions.entries()) assert.ok(position > 0, `missing step: ${steps[index]}`);
  assert.deepEqual([...positions].sort((a, b) => a - b), positions, 'steps run in order');
  const publish = release.slice(release.indexOf('- name: Publish the GitHub release'));
  assert.match(publish, /^ {8}if: github\.event_name == 'push' && startsWith\(github\.ref, 'refs\/tags\/v'\)$/m);
  assert.doesNotMatch(release, /\$\{\{\s*github\.ref_name\s*\}\}|\$\{\{\s*github\.event\./, 'refs reach the shell through the environment only');
});

test('every workflow pins actions to a full commit SHA', () => {
  for (const name of readdirSync(workflowsDir).filter((file) => file.endsWith('.yml'))) {
    const text = readFileSync(new URL(name, workflowsDir), 'utf8');
    for (const [, action] of text.matchAll(/uses:\s*(\S+)/g)) {
      assert.match(action, /^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/, `${name}: ${action}`);
    }
    assert.match(text, /^permissions:\n {2}contents: read\n/m, `${name}: top-level permissions`);
  }
});
