import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { APPS } from './apps.mjs';

const root = new URL('../', import.meta.url);
const tests = readdirSync(new URL('../tests/', import.meta.url))
  .filter((name) => name.endsWith('.mjs'))
  .sort()
  .map((name) => `tests/${name}`);
const scripts = [
  'scripts/apps.mjs',
  'scripts/serve.mjs',
  'scripts/run-apps.mjs',
  'scripts/check-hub.mjs',
  ...tests,
];
const copy = ['index.html', '404.html', 'README.md', 'package.json', '.github/workflows/decision-labs.yml', ...scripts];

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
const serve = readFileSync(new URL('scripts/serve.mjs', root), 'utf8');
const expectedCsp = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
if (!serve.includes(`CONTENT_SECURITY_POLICY = "${expectedCsp}"`)) {
  console.error('scripts/serve.mjs: Content-Security-Policy must stay the catalog CSP.');
  failed += 1;
}
// Public paths come from the canonical apps module; the launcher surface test
// in tests/launcher.test.mjs proves every APP_PATHS entry still serves.
if (!/from ['"]\.\/apps\.mjs['"]/.test(serve)) {
  console.error('scripts/serve.mjs: must import PUBLIC_PATHS source from ./apps.mjs.');
  failed += 1;
}
if (!serve.includes("request.method !== 'GET' && request.method !== 'HEAD'")) {
  console.error('scripts/serve.mjs: launcher must accept only GET and HEAD.');
  failed += 1;
}
if (!serve.includes("server.listen(port, '127.0.0.1'")) {
  console.error('scripts/serve.mjs: launcher must bind loopback only.');
  failed += 1;
}
const versionLine = html.match(/class="version-line">([^<]+)</)?.[1] ?? '';
for (const { id, label } of APPS) {
  const version = JSON.parse(readFileSync(new URL(`apps/${id}/package.json`, root), 'utf8')).version;
  const escaped = version.replaceAll('.', '\\.');
  const listed = new RegExp(`data-app="${id}">\\s*${escaped}\\s*<`).test(html);
  const card = new RegExp(`data-app-version="${id}">\\s*${escaped}\\s*<`).test(html);
  const line = versionLine.includes(`${label} ${version}`);
  if (!listed || !card || !line) {
    console.error(`index.html: ${id} should show version ${version} on the version list, catalog card, and print version line.`);
    failed += 1;
  }
}

if (failed) {
  process.exitCode = 1;
}
