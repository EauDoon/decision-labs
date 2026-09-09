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

if (failed) {
  process.exitCode = 1;
}
