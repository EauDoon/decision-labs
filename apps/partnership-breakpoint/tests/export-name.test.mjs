import test from 'node:test';
import assert from 'node:assert/strict';
import { exportDownloadName, sanitizeExportSlug } from '../src/model.js';

test('sanitizeExportSlug lowercases, hyphenates, and drops path punctuation', () => {
  assert.equal(sanitizeExportSlug('Harbor JV'), 'harbor-jv');
  assert.equal(sanitizeExportSlug('  Harbor   JV  '), 'harbor-jv');
  assert.equal(sanitizeExportSlug('../secret/case.json'), 'secret-case-json');
  assert.equal(sanitizeExportSlug('Harbor\\JV'), 'harbor-jv');
  assert.equal(sanitizeExportSlug('=CMD|secret'), 'cmd-secret');
  assert.equal(sanitizeExportSlug('---'), '');
  assert.equal(sanitizeExportSlug(''), '');
  assert.equal(sanitizeExportSlug(null), '');
  assert.equal(sanitizeExportSlug('x'.repeat(80)).length, 40);
});

test('exportDownloadName includes a title slug and falls back to the current names', () => {
  assert.equal(exportDownloadName('json', 'Harbor JV'), 'partnership-breakpoint-harbor-jv.json');
  assert.equal(exportDownloadName('json', ''), 'partnership-breakpoint.json');
  assert.equal(exportDownloadName('redacted', 'Harbor JV'), 'partnership-breakpoint-harbor-jv-redacted.json');
  assert.equal(exportDownloadName('redacted', '   '), 'partnership-breakpoint-redacted.json');
  assert.equal(exportDownloadName('report', 'Harbor JV'), 'partnership-breakpoint-harbor-jv-report.md');
  assert.equal(exportDownloadName('brief', null), 'partnership-breakpoint-brief.md');
  assert.equal(exportDownloadName('csv', 'Harbor JV'), 'partnership-breakpoint-harbor-jv-stress.csv');
  assert.equal(exportDownloadName('csv-visible', 'Harbor JV'), 'partnership-breakpoint-harbor-jv-stress-visible.csv');
  assert.equal(exportDownloadName('csv-visible', ''), 'partnership-breakpoint-stress-visible.csv');
  assert.equal(exportDownloadName('participants', 'Harbor JV'), 'partnership-breakpoint-harbor-jv-participants.csv');
  assert.equal(exportDownloadName('participants', ''), 'partnership-breakpoint-participants.csv');
  assert.equal(exportDownloadName('tornado', 'Harbor JV'), 'partnership-breakpoint-harbor-jv-tornado.svg');
  assert.equal(exportDownloadName('tornado', ''), 'partnership-breakpoint-tornado.svg');
  assert.equal(exportDownloadName('waterfall', 'Harbor JV'), 'partnership-breakpoint-harbor-jv-waterfall.svg');
  assert.equal(exportDownloadName('waterfall', ''), 'partnership-breakpoint-waterfall.svg');
});
