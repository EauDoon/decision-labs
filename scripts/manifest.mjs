// Offline inventory of the exact portable artifacts in this checkout.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { APPS } from './apps.mjs';

export async function artifactManifest(base = new URL('../', import.meta.url)) {
  const catalog = JSON.parse(await readFile(new URL('package.json', base), 'utf8'));
  const apps = [];
  // Complete each artifact before starting the next. A missing or invalid file
  // must not reject while other reads still hold files open (notably on Windows).
  for (const { id, label } of APPS) {
    const metadata = JSON.parse(await readFile(new URL(`apps/${id}/package.json`, base), 'utf8'));
    const path = `apps/${id}/standalone.html`;
    const bytes = await readFile(new URL(path, base));
    apps.push({ id, label, version: metadata.version, path, bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  return { schemaVersion: 1, catalogVersion: catalog.version, apps };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 2) {
    console.error('Usage: node scripts/manifest.mjs');
    process.exitCode = 2;
  } else {
    try { console.log(JSON.stringify(await artifactManifest(), null, 2)); }
    catch (error) { console.error(`Cannot create artifact manifest: ${error.message}`); process.exitCode = 1; }
  }
}
