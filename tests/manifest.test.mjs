import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, copyFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { artifactManifest } from '../scripts/manifest.mjs';
import { APPS } from '../scripts/apps.mjs';

test('manifest identifies every standalone artifact with exact bytes and SHA-256', async () => {
  const manifest = await artifactManifest();
  assert.deepEqual(manifest.apps.map(a => a.id), APPS.map(a => a.id));
  for (const app of manifest.apps) {
    const bytes = readFileSync(new URL(`../${app.path}`, import.meta.url));
    assert.equal(app.bytes, bytes.length);
    assert.equal(app.sha256, createHash('sha256').update(bytes).digest('hex'));
    assert.match(app.version, /^\d+\.\d+\.\d+$/);
  }
  assert.deepEqual(await artifactManifest(), manifest);
});
test('CLI emits machine-readable JSON and rejects unexpected arguments', () => {
  const script = new URL('../scripts/manifest.mjs', import.meta.url);
  const result = spawnSync(process.execPath, [fileURLToPath(script)], { encoding: 'utf8' });
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).schemaVersion, 1);
  const invalid = spawnSync(process.execPath, [fileURLToPath(script), '--unknown'], { encoding: 'utf8' });
  assert.equal(invalid.status, 2);
  assert.equal(invalid.stdout, '');
});
for (const missing of APPS) test(`missing ${missing.id} fails without returning a partial manifest`, async () => {
  const root = mkdtempSync(join(tmpdir(), 'manifest fixture '));
  try {
    writeFileSync(join(root, 'package.json'), JSON.stringify({ version: '1.0.0' }));
    for (const app of APPS) {
      const dir = join(root, 'apps', app.id);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'package.json'), JSON.stringify({ version: '1.0.0' }));
      if (app.id !== missing.id) writeFileSync(join(dir, 'standalone.html'), '<html></html>');
    }
    mkdirSync(join(root, 'scripts'));
    for (const file of ['manifest.mjs', 'apps.mjs']) copyFileSync(new URL(`../scripts/${file}`, import.meta.url), join(root, 'scripts', file));
    const failed = spawnSync(process.execPath, [join(root, 'scripts', 'manifest.mjs')], { encoding: 'utf8' });
    assert.equal(failed.status, 1);
    assert.equal(failed.stdout, '');
    assert.match(failed.stderr, /standalone\.html/);
    await assert.rejects(artifactManifest(pathToFileURL(`${root}/`)), error => {
      assert.equal(error.code, 'ENOENT');
      assert.match(error.path, /standalone\.html$/);
      return true;
    });
  } finally { rmSync(root, { recursive: true, force: true }); }
});
