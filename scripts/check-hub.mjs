import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const tests = readdirSync(new URL('../tests/', import.meta.url))
  .filter((name) => name.endsWith('.mjs'))
  .sort()
  .map((name) => `tests/${name}`);
const scripts = [
  'scripts/serve.mjs',
  'scripts/run-apps.mjs',
  'scripts/check-hub.mjs',
  ...tests,
];
const copy = ['index.html', 'README.md', 'package.json', '.github/workflows/decision-labs.yml', ...scripts];

let failed = 0;
for (const file of scripts) {
  const result = spawnSync(process.execPath, ['--check', fileURLToPath(new URL(file, root))], { stdio: 'inherit' });
  if (result.status !== 0) failed += 1;
}

for (const file of copy) {
  const text = readFileSync(new URL(file, root), 'utf8');
  if (text.includes('\u2014') || text.includes('\u2013')) {
    console.error(`${file}: en dashes and em dashes are not allowed in hub files.`);
    failed += 1;
  }
}

const html = readFileSync(new URL('index.html', root), 'utf8');
const apps = [
  ['partnership-breakpoint', 'Partnership Breakpoint'],
  ['common-cart', 'Common Cart'],
  ['smallest-agreement', 'The Smallest Agreement'],
  ['weekend-gap', 'Weekend Gap'],
];
const versionLine = html.match(/class="version-line">([^<]+)</)?.[1] ?? '';
for (const [app, label] of apps) {
  const version = JSON.parse(readFileSync(new URL(`apps/${app}/package.json`, root), 'utf8')).version;
  const escaped = version.replaceAll('.', '\\.');
  const listed = new RegExp(`data-app="${app}">\\s*${escaped}\\s*<`).test(html);
  const card = new RegExp(`data-app-version="${app}">\\s*${escaped}\\s*<`).test(html);
  const line = versionLine.includes(`${label} ${version}`);
  if (!listed || !card || !line) {
    console.error(`index.html: ${app} should show version ${version} on the version list, catalog card, and print version line.`);
    failed += 1;
  }
}

if (failed) {
  process.exitCode = 1;
}
