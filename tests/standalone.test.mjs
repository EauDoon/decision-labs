import assert from 'node:assert/strict';
import test from 'node:test';
import { renderStandalone } from '../scripts/build-standalone.mjs';

const html = '<html><head><title>Partnership Breakpoint</title><link rel="stylesheet" href="styles.css" /></head><body><a href="MODEL.md">Read the full model</a><script type="module" src="src/app.js"></script></body></html>';
const appImport = `import {
  PRESETS,
  ValidationError,
  calculatePartnership,
  clonePreset,
  makeParticipant,
  validateConfiguration,
} from './model.js';

`;

test('standalone renderer inlines local assets with deterministic LF bytes', () => {
  const input = { html, css: 'body { color: black; }', model: 'export const value = 1;\n', app: `${appImport}console.log(value);\n` };
  const first = renderStandalone(input);
  const second = renderStandalone(input);
  assert.equal(first, second);
  assert.match(first, /<style>\nbody \{ color: black; \}\n<\/style>/);
  assert.match(first, /http-equiv="Content-Security-Policy"/);
  assert.match(first, /default-src 'none'; base-uri 'none'; connect-src 'none'; form-action 'none'; img-src 'none'; media-src 'none'; object-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'/);
  assert.match(first, /const value = 1;/);
  assert.doesNotMatch(first, /src="src\/app\.js"|href="styles\.css"|href="MODEL\.md"/);
  assert.doesNotMatch(first, /\r/);
});

test('standalone renderer refuses missing markers and external CSS resources', () => {
  assert.throws(() => renderStandalone({ html: '<html></html>', css: '', model: '', app: appImport }), /marker/);
  assert.throws(() => renderStandalone({ html, css: 'body { background: url(image.png); }', model: '', app: appImport }), /URL resource/);
});
