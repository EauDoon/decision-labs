// Offline inventory of the exact portable artifacts in this checkout.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { APPS } from './apps.mjs';

function requiredVersion(metadata, source) {
  if (typeof metadata?.version !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(metadata.version)) {
    throw new Error(`${source} must declare a numeric X.Y.Z version`);
  }
  return metadata.version;
}

export async function artifactManifest(base = new URL('../', import.meta.url)) {
  const catalog = JSON.parse(await readFile(new URL('package.json', base), 'utf8'));
  const catalogVersion = requiredVersion(catalog, 'catalog');
  const apps = [];
  // Complete each artifact before starting the next. A missing or invalid file
  // must not reject while other reads still hold files open (notably on Windows).
  for (const { id, label } of APPS) {
    const metadata = JSON.parse(await readFile(new URL(`apps/${id}/package.json`, base), 'utf8'));
    const path = `apps/${id}/standalone.html`;
    const bytes = await readFile(new URL(path, base));
    apps.push({ id, label, version: requiredVersion(metadata, id), path, bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  return { schemaVersion: 1, catalogVersion, apps };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const verify = args.length === 2 && args[0] === '--verify';
  if (args.length !== 0 && !verify) {
    console.error('Usage: node scripts/manifest.mjs [--verify MANIFEST.json]');
    process.exitCode = 2;
  } else {
    try {
      const actual = await artifactManifest();
      if (!verify) console.log(JSON.stringify(actual, null, 2));
      else {
        // Enumerate only the checkout's known artifacts. Expected paths are data, not inputs to read.
        const expected = JSON.parse((await readFile(args[1], 'utf8')).replace(/^\uFEFF/, ''));
        if (!isDeepStrictEqual(actual, expected)) throw new Error('Manifest does not match the catalog and its four artifacts.');
        console.log('Verified catalog and all four standalone artifacts.');
      }
    } catch (error) { console.error(`Artifact manifest: ${error.message}`); process.exitCode = 1; }
  }
}
