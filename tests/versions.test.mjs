import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { APPS } from '../scripts/apps.mjs';
import { checkVersions, syncVersions } from '../scripts/versions.mjs';

const repo = fileURLToPath(new URL('../', import.meta.url));
const script = fileURLToPath(new URL('../scripts/versions.mjs', import.meta.url));
const SURFACE_FILES = ['index.html', '404.html', 'README.md'];

// A temporary copy of every file the version contract reads.
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'decision-labs-versions-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const files = [
    ...SURFACE_FILES, 'package.json', 'CHANGELOG.md',
    ...APPS.flatMap(({ id }) => [`apps/${id}/package.json`, `apps/${id}/CHANGELOG.md`, `apps/${id}/standalone.html`]),
  ];
  for (const file of files) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    cpSync(join(repo, file), join(root, file));
  }
  return root;
}

function read(root, file) {
  return readFileSync(join(root, file), 'utf8');
}

function edit(root, file, change) {
  writeFileSync(join(root, file), change(read(root, file)));
}

function setVersion(root, id, version) {
  edit(root, `apps/${id}/package.json`, (text) => text.replace(/"version": "[^"]+"/, `"version": "${version}"`));
}

function run(root, ...args) {
  return spawnSync(process.execPath, [script, ...args, '--root', root], { encoding: 'utf8' });
}

test('the real tree already matches its package versions', (t) => {
  assert.deepEqual(checkVersions(repo), []);
  const root = fixture(t);
  assert.deepEqual(syncVersions(root), [], 'sync on a copy of the real tree changes nothing');
  for (const file of SURFACE_FILES) assert.equal(read(root, file), read(repo, file));
});

// What npm run build:standalone changes in a page when only the version moves.
function restamp(root, id, version) {
  const { label } = APPS.find((app) => app.id === id);
  edit(root, `apps/${id}/standalone.html`, (text) => text.replace(/(<meta name="generator" content=")[^"]*"/, `$1${label} ${version}"`));
}

function prependEntry(root, id, heading) {
  edit(root, `apps/${id}/CHANGELOG.md`, (text) => text.replace('# Changelog\n\n', `# Changelog\n\n${heading}\n\n- Synthetic entry.\n\n`));
}

test('sync writes a bumped version to every surface and check then passes', (t) => {
  const root = fixture(t);
  setVersion(root, 'common-cart', '9.8.7');
  const problems = checkVersions(root);
  assert.equal(problems.length, 7, problems.join('\n'));
  assert.ok(problems.some((problem) => /apps\/common-cart\/CHANGELOG\.md: the first entry is .* but package\.json says 9\.8\.7\./.test(problem)));
  assert.ok(problems.some((problem) => /apps\/common-cart\/standalone\.html: was built as "Common Cart [^"]+" but the package is "Common Cart 9\.8\.7"; run npm run build:standalone\./.test(problem)));
  prependEntry(root, 'common-cart', '## 9.8.7 - 2026-10-09');
  restamp(root, 'common-cart', '9.8.7');
  assert.deepEqual(syncVersions(root).sort(), ['404.html', 'README.md', 'index.html']);
  assert.deepEqual(checkVersions(root), []);
  const html = read(root, 'index.html');
  assert.match(html, /<li data-app="common-cart">9\.8\.7<\/li>/);
  assert.match(html, /<span data-app-version="common-cart">9\.8\.7<\/span>/);
  assert.match(html, /class="version-line">Partnership Breakpoint [^,]+, Common Cart 9\.8\.7, [^<]*\. Each workbench versions itself\.<\/p>/);
  assert.match(read(root, '404.html'), /Current catalog: [^<]*Common Cart 9\.8\.7, [^<]*\.<\/p>/);
  assert.match(read(root, 'README.md'), /\| \[Common Cart\]\(apps\/common-cart\/\) \| 9\.8\.7 \|/);
  const result = run(root, 'check');
  assert.equal(result.status, 0, result.stderr);
});

test('check names each drifted surface', (t) => {
  const cases = [
    ['index.html', /<li data-app="weekend-gap">[^<]*</, '<li data-app="weekend-gap">0.0.1<', /index\.html: the weekend-gap version list entry says "0\.0\.1"/],
    ['index.html', /<span data-app-version="weekend-gap">[^<]*</, '<span data-app-version="weekend-gap">0.0.1<', /index\.html: the weekend-gap catalog card says "0\.0\.1"/],
    ['index.html', /Weekend Gap \d+\.\d+\.\d+\. Each/, 'Weekend Gap 0.0.1. Each', /index\.html: the footer version line says ".*Weekend Gap 0\.0\.1"/],
    ['404.html', /Weekend Gap \d+\.\d+\.\d+\.<\/p>/, 'Weekend Gap 0.0.1.</p>', /404\.html: the current catalog line says ".*Weekend Gap 0\.0\.1"/],
    ['README.md', /(\| \[Weekend Gap\]\(apps\/weekend-gap\/\) \| )[^ |]+/, '$10.0.1', /README\.md: the weekend-gap table row says "0\.0\.1"/],
    ['index.html', /<span data-app-version="weekend-gap">[^<]*<\/span>/, '', /index\.html: the weekend-gap catalog card is missing\./],
  ];
  for (const [file, pattern, replacement, message] of cases) {
    const root = fixture(t);
    edit(root, file, (text) => {
      const next = text.replace(pattern, replacement);
      assert.notEqual(next, text, `${file} fixture edit did not apply`);
      return next;
    });
    const problems = checkVersions(root);
    assert.equal(problems.length, 1, problems.join('\n'));
    assert.match(problems[0], message);
    const result = run(root, 'check');
    assert.equal(result.status, 1);
    assert.match(result.stderr, message);
    assert.match(result.stderr, /npm run versions:sync/);
  }
});

test('the versions command rejects unknown commands and options', (t) => {
  const root = fixture(t);
  for (const args of [['publish'], ['check', 'extra'], ['check', '--force']]) {
    const result = run(root, ...args);
    assert.equal(result.status, 1, args.join(' '));
    assert.equal(result.stdout, '');
    assert.notEqual(result.stderr, '');
  }
});

test('a bump needs only the package version, a matching changelog entry, sync and a rebuild', (t) => {
  const root = fixture(t);
  setVersion(root, 'weekend-gap', '99.0.0');
  prependEntry(root, 'weekend-gap', '## 99.0.0');
  syncVersions(root);
  restamp(root, 'weekend-gap', '99.0.0');
  assert.deepEqual(checkVersions(root), []);
});

test('each standalone page must carry exactly one generator stamp for its package version', (t) => {
  const cases = [
    ['a stale stamp', (text) => text.replace(/(<meta name="generator" content="The Smallest Agreement )[^"]*"/, '$10.0.1"'), /apps\/smallest-agreement\/standalone\.html: was built as "The Smallest Agreement 0\.0\.1" but the package is "The Smallest Agreement \d+\.\d+\.\d+"/],
    ['a missing stamp', (text) => text.replace(/<meta name="generator" content="[^"]*">\n/, ''), /apps\/smallest-agreement\/standalone\.html: needs exactly one generator meta tag/],
    ['a second stamp', (text) => text.replace('<head>', '<head>\n<meta name="generator" content="Other 1.0.0">'), /apps\/smallest-agreement\/standalone\.html: needs exactly one generator meta tag/],
  ];
  for (const [name, change, message] of cases) {
    const root = fixture(t);
    edit(root, 'apps/smallest-agreement/standalone.html', (text) => {
      const next = change(text);
      assert.notEqual(next, text, `${name}: fixture edit did not apply`);
      return next;
    });
    const problems = checkVersions(root);
    assert.equal(problems.length, 1, `${name}: ${problems.join(' | ')}`);
    assert.match(problems[0], message, name);
  }
});

test('app changelogs must stay unique and in descending SemVer order', (t) => {
  const cases = [
    ['swapped entries', (text) => {
      const lines = text.split('\n');
      const [first, second] = lines.map((line, index) => (line.startsWith('## ') ? index : -1)).filter((index) => index >= 0);
      [lines[first], lines[second]] = [lines[second], lines[first]];
      return lines.join('\n');
    }, /is followed by .*descending SemVer order/],
    ['a duplicate entry', (text) => `${text}\n## 1.0.0\n\n- Again.\n\n## 1.0.0\n\n- Twice.\n`, /1\.0\.0 is followed by 1\.0\.0/],
    ['a stray title', (text) => `${text}\n# Changelog\n`, /needs exactly one "# Changelog" title/],
    ['a missing title', (text) => text.replace('# Changelog\n\n', ''), /needs exactly one "# Changelog" title/],
    ['a heading that is not a version', (text) => `${text}\n## Unreleased\n`, /"## Unreleased" is not a "## x\.y\.z" release heading/],
  ];
  for (const [name, change, message] of cases) {
    const root = fixture(t);
    edit(root, 'apps/smallest-agreement/CHANGELOG.md', change);
    const problems = checkVersions(root);
    assert.ok(problems.some((problem) => problem.startsWith('apps/smallest-agreement/CHANGELOG.md: ') && message.test(problem)), `${name}: ${problems.join(' | ')}`);
    assert.equal(run(root, 'check').status, 1, name);
  }
});

test('changelog headings inside fenced code are ignored', (t) => {
  const root = fixture(t);
  edit(root, 'apps/common-cart/CHANGELOG.md', (text) => `${text}\n\`\`\`text\n# Changelog\n## 0.0.0 example output\n\`\`\`\n`);
  assert.deepEqual(checkVersions(root), []);
});

test('a versioned catalog needs a matching Keep a Changelog release heading', (t) => {
  const root = fixture(t);
  assert.equal(JSON.parse(read(root, 'package.json')).version ?? null, null, 'the catalog is unversioned in this fixture');
  assert.deepEqual(checkVersions(root), [], 'an unversioned catalog skips the root changelog rule');
  edit(root, 'package.json', (text) => text.replace('"private": true,', '"private": true,\n  "version": "2.3.4",'));
  assert.match(checkVersions(root).join('\n'), /CHANGELOG\.md: the first release heading must be "## \[2\.3\.4\] - YYYY-MM-DD"/);
  edit(root, 'CHANGELOG.md', (text) => text.replace('## [Unreleased]', '## [Unreleased]\n\n## [2.3.3] - 2026-10-01'));
  assert.match(checkVersions(root).join('\n'), /CHANGELOG\.md: the first release is 2\.3\.3 but package\.json says 2\.3\.4\./);
  edit(root, 'CHANGELOG.md', (text) => text.replace('## [2.3.3] - 2026-10-01', '## [2.3.4] - 2026-10-02'));
  assert.deepEqual(checkVersions(root), []);
  edit(root, 'package.json', (text) => text.replace('"version": "2.3.4"', '"version": "2.3"'));
  assert.deepEqual(checkVersions(root), ['package.json: version "2.3" is not x.y.z.']);
});
