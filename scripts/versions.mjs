// Version surfaces for the catalog. Each workbench's apps/<id>/package.json is
// the single source of truth for that workbench's version. Every other place a
// version appears is written by `sync` or verified by `check`.
//
//   node scripts/versions.mjs sync [--root <dir>]
//   node scripts/versions.mjs check [--root <dir>]
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { APPS } from './apps.mjs';

export const DEFAULT_ROOT = fileURLToPath(new URL('../', import.meta.url));

function escape(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readText(root, file) {
  return readFileSync(resolve(root, file), 'utf8');
}

export function readVersions(root = DEFAULT_ROOT) {
  const apps = {};
  for (const { id } of APPS) {
    apps[id] = JSON.parse(readText(root, `apps/${id}/package.json`)).version;
  }
  return { apps };
}

export function versionList(versions) {
  return APPS.map(({ id, label }) => `${label} ${versions.apps[id]}`).join(', ');
}

// A version list runs up to the first period that ends a sentence. Versions
// and labels never contain a period followed by a space or a tag.
const LIST = '[^<]*?(?=\\.(?:\\s|<))';

// Each surface names one place a version appears, a pattern whose three
// groups are the text before the version, the version and the text after it,
// and what the version must be.
function surfaces(versions) {
  const list = versionList(versions);
  const items = [];
  for (const { id, label } of APPS) {
    const version = versions.apps[id];
    items.push(
      { file: 'index.html', what: `${id} version list entry`, pattern: new RegExp(`(<li data-app="${id}">)([^<]*)(</li>)`), expected: version },
      { file: 'index.html', what: `${id} catalog card`, pattern: new RegExp(`(<span data-app-version="${id}">)([^<]*)(</span>)`), expected: version },
      { file: 'README.md', what: `${id} table row`, pattern: new RegExp(`(\\| \\[${escape(label)}\\]\\(apps/${id}/\\) \\| )([^|]*?)( \\|)`), expected: version },
    );
  }
  items.push(
    { file: 'index.html', what: 'footer version line', pattern: new RegExp(`(<p id="version-line"[^>]*>)(${LIST})()`), expected: list },
    { file: '404.html', what: 'current catalog line', pattern: new RegExp(`(<p class="version-line">Current catalog: )(${LIST})()`), expected: list },
  );
  return items;
}

// Rewrite every surface from the package versions. Returns the changed files.
export function syncVersions(root = DEFAULT_ROOT) {
  const versions = readVersions(root);
  const texts = new Map();
  for (const surface of surfaces(versions)) {
    const text = texts.get(surface.file) ?? readText(root, surface.file);
    if (!surface.pattern.test(text)) throw new Error(`${surface.file}: cannot find the ${surface.what} to update.`);
    texts.set(surface.file, text.replace(surface.pattern, (match, before, current, after) => `${before}${surface.expected}${after}`));
  }
  const changed = [];
  for (const [file, text] of texts) {
    if (text !== readText(root, file)) {
      writeFileSync(resolve(root, file), text);
      changed.push(file);
    }
  }
  return changed;
}

// Every disagreement between the package versions and the surfaces, as messages.
export function checkVersions(root = DEFAULT_ROOT) {
  const versions = readVersions(root);
  const problems = [];
  const texts = new Map();
  for (const surface of surfaces(versions)) {
    if (!texts.has(surface.file)) texts.set(surface.file, readText(root, surface.file));
    const found = texts.get(surface.file).match(surface.pattern)?.[2]?.trim();
    if (found === undefined) problems.push(`${surface.file}: the ${surface.what} is missing.`);
    else if (found !== surface.expected) problems.push(`${surface.file}: the ${surface.what} says "${found}" but should say "${surface.expected}".`);
  }
  return problems;
}

function main(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { root: { type: 'string' } },
  });
  const [command, ...extra] = positionals;
  const root = values.root ? resolve(values.root) : DEFAULT_ROOT;
  if (command === 'sync' && extra.length === 0) {
    const changed = syncVersions(root);
    console.log(changed.length ? `Updated ${changed.join(', ')}.` : 'Version surfaces already match the packages.');
    return 0;
  }
  if (command === 'check' && extra.length === 0) {
    const problems = checkVersions(root);
    for (const problem of problems) console.error(problem);
    if (problems.length) {
      console.error('Run npm run versions:sync after changing a package version.');
      return 1;
    }
    console.log('Version surfaces match the packages.');
    return 0;
  }
  console.error('Usage: node scripts/versions.mjs <sync|check> [--root <dir>]');
  return 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
