import test from 'node:test';
import assert from 'node:assert/strict';

test('rounds section markup wires save, load, delete, and compare controls', async () => {
  const { readFile } = await import('node:fs/promises');
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.match(html, /id="rounds-heading"/);
  assert.match(html, /id="round-name"/);
  assert.match(html, /id="round-notes"/);
  assert.match(html, /id="round-decision"/);
  assert.match(html, /id="save-round"/);
  assert.match(html, /id="round-select"/);
  assert.match(html, /id="load-round"/);
  assert.match(html, /id="delete-round"/);
  assert.match(html, /id="round-compare"/);
  assert.match(html, /id="round-comparison"/);
  assert.match(html, /id="round-count"/);
  assert.match(html, /not a recorded vote unless/);
  assert.match(app, /function renderRounds\(/);
  assert.match(app, /function renderRoundComparison\(/);
  assert.match(app, /function persistRounds\(/);
  assert.match(app, /function loadRounds\(/);
  assert.match(app, /\$\("#save-round"\)\.addEventListener\("click"/);
  assert.match(app, /\$\("#load-round"\)\.addEventListener\("click"/);
  assert.match(app, /\$\("#delete-round"\)\.addEventListener\("click"/);
  assert.match(app, /\$\("#round-compare"\)\.addEventListener\("change"/);
  assert.match(app, /Human-authored round notes/);
  assert.match(app, /Human-recorded outcome/);
  assert.match(app, /Undo restores the previous draft/);
});

test('workspace export and import thread rounds through the envelope', async () => {
  const { readFile } = await import('node:fs/promises');
  const app = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.match(app, /formatWorkspaceJson\(state\.proposal, \{[^}]*\}, rounds\)/);
  assert.match(app, /rounds = workspace\.rounds \?\? \[\]/);
  assert.match(app, /localStorage\.setItem\(ROUNDS_KEY/);
});
