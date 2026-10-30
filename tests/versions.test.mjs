import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { APPS } from '../scripts/apps.mjs';
import { checkVersions, readVersions, releaseNotes, syncVersions } from '../scripts/versions.mjs';

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

// Sets the catalog version in a fixture's root package.json, or removes it when
// version is null, so no test depends on whether the real catalog is versioned.
function setCatalogVersion(root, version) {
  edit(root, 'package.json', (text) => {
    const pkg = JSON.parse(text);
    delete pkg.version;
    const next = version === null ? pkg : { name: pkg.name, version, ...pkg };
    return `${JSON.stringify(next, null, 2)}\n`;
  });
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

test('the real catalog version is ready to tag and has release notes', () => {
  const { catalog } = readVersions(repo);
  assert.match(String(catalog), /^\d+\.\d+\.\d+$/, 'the root package.json carries the catalog version');
  const tag = `v${catalog}`;
  assert.deepEqual(checkVersions(repo, { tag }), []);
  const notes = releaseNotes(read(repo, 'CHANGELOG.md'), tag);
  assert.match(notes, /^### (?:Added|Changed|Deprecated|Removed|Fixed|Security)$/m, 'the notes use Keep a Changelog sections');
  assert.doesNotMatch(notes, /^## |^\[[^\]]+\]: /m, 'the notes hold one section body without link references');
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
  setCatalogVersion(root, null);
  edit(root, 'CHANGELOG.md', () => '# Changelog\n\n## [Unreleased]\n\n### Added\n- Not released yet.\n');
  assert.deepEqual(checkVersions(root), [], 'an unversioned catalog skips the root changelog rule');
  setCatalogVersion(root, '2.3.4');
  assert.match(checkVersions(root).join('\n'), /CHANGELOG\.md: the first release heading must be "## \[2\.3\.4\] - YYYY-MM-DD"/);
  edit(root, 'CHANGELOG.md', (text) => text.replace('## [Unreleased]', '## [Unreleased]\n\n## [2.3.3] - 2026-10-01'));
  assert.match(checkVersions(root).join('\n'), /CHANGELOG\.md: the first release is 2\.3\.3 but package\.json says 2\.3\.4\./);
  edit(root, 'CHANGELOG.md', (text) => text.replace('## [2.3.3] - 2026-10-01', '## [2.3.4] - 2026-10-02'));
  assert.deepEqual(checkVersions(root), []);
  edit(root, 'package.json', (text) => text.replace('"version": "2.3.4"', '"version": "2.3"'));
  assert.deepEqual(checkVersions(root), ['package.json: version "2.3" is not x.y.z.']);
});

// A fixture whose catalog is released as 2.3.4, in Keep a Changelog form with
// link references at the end, as the root CHANGELOG.md is for a real release.
function releaseFixture(t) {
  const root = fixture(t);
  setCatalogVersion(root, '2.3.4');
  edit(root, 'CHANGELOG.md', () => [
    '# Changelog',
    '',
    '## [Unreleased]',
    '',
    '### Added',
    '- Not released yet.',
    '',
    '## [2.3.4] - 2026-10-09',
    '',
    '### Added',
    '- Release workflow.',
    '',
    '```text',
    '## [9.9.9] - inside a fence, not a heading',
    '[not]: a link reference',
    '```',
    '',
    '### Fixed',
    '- Port errors.',
    '',
    '## [2.3.3] - 2026-10-01',
    '',
    '### Fixed',
    '- Older fix.',
    '',
    '[Unreleased]: https://github.com/EauDoon/decision-labs/compare/v2.3.4...HEAD',
    '[2.3.4]: https://github.com/EauDoon/decision-labs/compare/v2.3.3...v2.3.4',
    '[2.3.3]: https://github.com/EauDoon/decision-labs/releases/tag/v2.3.3',
    '',
  ].join('\n'));
  assert.deepEqual(checkVersions(root), []);
  return root;
}

test('check --tag accepts only the tag that names the catalog version', (t) => {
  const root = releaseFixture(t);
  assert.deepEqual(checkVersions(root, { tag: 'v2.3.4' }), []);
  const passed = run(root, 'check', '--tag', 'v2.3.4');
  assert.equal(passed.status, 0, passed.stderr);
  assert.match(passed.stdout, /v2\.3\.4 names the catalog version/);
  for (const [tag, message] of [
    ['v2.3.5', /Tag v2\.3\.5 does not match the catalog version 2\.3\.4 in package\.json; the tag must be v2\.3\.4\./],
    ['2.3.4', /Tag "2\.3\.4" is not a vX\.Y\.Z release tag\./],
    ['v2.3', /Tag "v2\.3" is not a vX\.Y\.Z release tag\./],
    ['', /Tag "" is not a vX\.Y\.Z release tag\./],
  ]) {
    assert.match(checkVersions(root, { tag }).join('\n'), message, tag);
    const failed = run(root, 'check', '--tag', tag);
    assert.equal(failed.status, 1, tag);
    assert.match(failed.stderr, message, tag);
  }
});

test('check --tag fails clearly while the catalog has no version', (t) => {
  const root = fixture(t);
  setCatalogVersion(root, null);
  assert.equal(JSON.parse(read(root, 'package.json')).version, undefined);
  const result = run(root, 'check', '--tag', 'v1.0.0');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /package\.json has no version, so there is no catalog release to tag as "v1\.0\.0"\./);
  assert.match(run(root, 'check', '--tag', 'v').stderr, /package\.json has no version/);
});

test('notes prints only the release section body for a tag', (t) => {
  const root = releaseFixture(t);
  const result = run(root, 'notes', 'v2.3.4');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, [
    '### Added',
    '- Release workflow.',
    '',
    '```text',
    '## [9.9.9] - inside a fence, not a heading',
    '[not]: a link reference',
    '```',
    '',
    '### Fixed',
    '- Port errors.',
    '',
  ].join('\n'));
  const older = run(root, 'notes', 'v2.3.3');
  assert.equal(older.stdout, '### Fixed\n- Older fix.\n', 'link references at the end are not notes');
  for (const [tag, message] of [
    ['v9.9.9', /CHANGELOG\.md has no "## \[9\.9\.9\]" section for v9\.9\.9\./],
    ['latest', /Tag "latest" is not a vX\.Y\.Z release tag\./],
  ]) {
    const failed = run(root, 'notes', tag);
    assert.equal(failed.status, 1, tag);
    assert.equal(failed.stdout, '');
    assert.match(failed.stderr, message, tag);
  }
  edit(root, 'CHANGELOG.md', (text) => text.replace('### Fixed\n- Older fix.\n', ''));
  assert.match(run(root, 'notes', 'v2.3.3').stderr, /CHANGELOG\.md: the 2\.3\.3 section is empty\./);
});

test('assets writes each standalone page under its workbench name and version', (t) => {
  const root = releaseFixture(t);
  const out = join(root, 'release-assets');
  const result = run(root, 'assets', out);
  assert.equal(result.status, 0, result.stderr);
  const versions = Object.fromEntries(APPS.map(({ id }) => [id, JSON.parse(read(root, `apps/${id}/package.json`)).version]));
  const expected = APPS.map(({ id }) => join(out, `${id}-${versions[id]}.html`));
  assert.deepEqual(result.stdout.trim().split(/\r?\n/), expected);
  for (const { id } of APPS) {
    assert.equal(read(out, `${id}-${versions[id]}.html`), read(root, `apps/${id}/standalone.html`));
  }
  edit(root, 'apps/weekend-gap/standalone.html', (text) => text.replace(/(<meta name="generator" content="Weekend Gap )[^"]*"/, '$10.0.1"'));
  const refused = run(root, 'assets', join(root, 'stale-assets'));
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /Refusing to package release assets:\napps\/weekend-gap\/standalone\.html: was built as "Weekend Gap 0\.0\.1"/);
});

test('only check takes --tag, and notes and assets take one argument', (t) => {
  const root = releaseFixture(t);
  for (const args of [['sync', '--tag', 'v2.3.4'], ['notes', 'v2.3.4', '--tag', 'v2.3.4'], ['notes'], ['notes', 'v2.3.4', 'extra'], ['assets'], ['assets', 'a', 'b']]) {
    const result = run(root, ...args);
    assert.equal(result.status, 1, args.join(' '));
    assert.match(result.stderr, /^Usage: node scripts\/versions\.mjs/, args.join(' '));
  }
});

// A releaseFixture committed to its own git repository and tagged v2.3.4, so
// check --since can compare a later commit with that release. Every call sets
// its own identity and disables signing and line-ending conversion, so the
// test runs the same on every runner and developer machine.
function git(root, ...args) {
  const result = spawnSync('git', [
    '-c', 'user.name=Synthetic', '-c', 'user.email=synthetic@example.invalid',
    '-c', 'commit.gpgsign=false', '-c', 'tag.gpgsign=false', '-c', 'core.autocrlf=false',
    '-C', root, ...args,
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, `git ${args.join(' ')}: ${result.stderr}`);
  return result.stdout;
}

function commitAll(root, message) {
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '--allow-empty', '-m', message);
}

function write(root, file, text) {
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), text);
}

function releasedRepo(t) {
  const root = releaseFixture(t);
  for (const { id } of APPS) {
    write(root, `apps/${id}/src/model.js`, 'export const model = 1;\n');
    write(root, `apps/${id}/tests/model.test.mjs`, '// synthetic\n');
    write(root, `apps/${id}/MODEL.md`, '# Model\n');
  }
  git(root, 'init', '-q');
  commitAll(root, 'release 2.3.4');
  git(root, 'tag', '-a', 'v2.3.4', '-m', 'Decision Labs 2.3.4');
  return root;
}

function bumpCatalog(root, version) {
  setCatalogVersion(root, version);
  edit(root, 'CHANGELOG.md', (text) => text.replace('## [Unreleased]\n', `## [Unreleased]\n\n## [${version}] - 2026-10-31\n\n### Fixed\n- Synthetic.\n`));
}

function bumpApp(root, id, version) {
  setVersion(root, id, version);
  prependEntry(root, id, `## ${version} - 2026-10-31`);
  syncVersions(root);
  restamp(root, id, version);
}

test('check --since passes when nothing changed since the release', (t) => {
  const root = releasedRepo(t);
  assert.deepEqual(checkVersions(root, { since: 'v2.3.4' }), []);
  const result = run(root, 'check', '--since', 'v2.3.4');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /nothing shipped changed since v2\.3\.4 without a version bump/);
});

test('check --since names a workbench whose shipped files changed without a bump', (t) => {
  const root = releasedRepo(t);
  edit(root, 'apps/smallest-agreement/src/model.js', () => 'export const model = 2;\n');
  edit(root, 'apps/smallest-agreement/standalone.html', (text) => `${text}<!-- rebuilt -->\n`);
  bumpCatalog(root, '2.4.0');
  commitAll(root, 'change without bump');
  const problems = checkVersions(root, { since: 'v2.3.4' });
  assert.equal(problems.length, 1, problems.join('\n'));
  const version = readVersions(root).apps['smallest-agreement'];
  assert.equal(problems[0], `apps/smallest-agreement changed since v2.3.4 (src/model.js, standalone.html) but is still ${version}; bump its package version and add its changelog entry.`);
  const result = run(root, 'check', '--since', 'v2.3.4');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /apps\/smallest-agreement changed since v2\.3\.4/);
  assert.match(result.stderr, /npm run versions:sync/);
});

test('check --since ignores app tests and Markdown, which no standalone page embeds', (t) => {
  const root = releasedRepo(t);
  edit(root, 'apps/weekend-gap/tests/model.test.mjs', () => '// changed\n');
  edit(root, 'apps/weekend-gap/MODEL.md', () => '# Model\n\nClarified.\n');
  bumpCatalog(root, '2.3.5');
  commitAll(root, 'docs and tests only');
  assert.deepEqual(checkVersions(root, { since: 'v2.3.4' }), []);
});

test('check --since passes once the changed workbench is bumped, synced and restamped', (t) => {
  const root = releasedRepo(t);
  edit(root, 'apps/common-cart/src/model.js', () => 'export const model = 2;\n');
  write(root, 'apps/common-cart/src/café.js', 'export const name = 1;\n');
  bumpCatalog(root, '2.4.0');
  commitAll(root, 'change');
  assert.match(checkVersions(root, { since: 'v2.3.4' }).join('\n'), /apps\/common-cart changed since v2\.3\.4 \(src\/café\.js, src\/model\.js\)/);
  bumpApp(root, 'common-cart', '99.1.0');
  commitAll(root, 'bump');
  assert.deepEqual(checkVersions(root, { since: 'v2.3.4' }), []);
});

test('check --since rejects a workbench version lower than at the release', (t) => {
  const root = releasedRepo(t);
  bumpApp(root, 'weekend-gap', '0.0.1');
  bumpCatalog(root, '2.4.0');
  commitAll(root, 'downgrade');
  // The changelog order rule also objects to the 0.0.1 entry; the drift rule
  // names the downgrade against the release itself.
  const drift = checkVersions(root, { since: 'v2.3.4' }).filter((problem) => !problem.includes('CHANGELOG.md'));
  assert.equal(drift.length, 1, drift.join('\n'));
  assert.match(drift[0], /^apps\/weekend-gap is 0\.0\.1, lower than \d+\.\d+\.\d+ at v2\.3\.4\.$/);
});

test('check --since requires a catalog bump for any change since the release', (t) => {
  const root = releasedRepo(t);
  edit(root, 'apps/common-cart/src/model.js', () => 'export const model = 2;\n');
  bumpApp(root, 'common-cart', '99.1.0');
  commitAll(root, 'app bump without catalog bump');
  const problems = checkVersions(root, { since: 'v2.3.4' });
  assert.deepEqual(problems, ['The catalog changed since v2.3.4 but package.json is still 2.3.4; bump the catalog version and add its CHANGELOG.md section.']);
});

test('check --since fails clearly for an unknown ref or a missing git', (t) => {
  const root = releasedRepo(t);
  const unknown = run(root, 'check', '--since', 'v9.9.9');
  assert.equal(unknown.status, 1);
  assert.equal(unknown.stdout, '');
  assert.match(unknown.stderr, /Cannot resolve "v9\.9\.9" to a commit; fetch the release tags \(git fetch --tags\) or name an existing ref\./);
  const plain = mkdtempSync(join(tmpdir(), 'decision-labs-no-git-'));
  t.after(() => rmSync(plain, { recursive: true, force: true }));
  cpSync(root, plain, { recursive: true, filter: (source) => !source.split(/[\\/]/).includes('.git') });
  assert.match(checkVersions(plain, { since: 'v2.3.4' }).join('\n'), /Cannot resolve "v2\.3\.4" to a commit/);
  const noGit = spawnSync(process.execPath, [script, 'check', '--since', 'v2.3.4', '--root', root], {
    encoding: 'utf8', env: { SystemRoot: process.env.SystemRoot ?? '', PATH: '' },
  });
  assert.equal(noGit.status, 1);
  assert.match(noGit.stderr, /git is not available, so check --since v2\.3\.4 cannot compare with the release\./);
});

test('check combines --since with --tag', (t) => {
  const root = releasedRepo(t);
  edit(root, 'apps/common-cart/src/model.js', () => 'export const model = 2;\n');
  bumpApp(root, 'common-cart', '99.1.0');
  bumpCatalog(root, '2.4.0');
  commitAll(root, 'release 2.4.0');
  const passed = run(root, 'check', '--tag', 'v2.4.0', '--since', 'v2.3.4');
  assert.equal(passed.status, 0, passed.stderr);
  assert.match(passed.stdout, /v2\.4\.0 names the catalog version, and nothing shipped changed since v2\.3\.4 without a version bump\./);
  const wrongTag = run(root, 'check', '--tag', 'v2.4.1', '--since', 'v2.3.4');
  assert.equal(wrongTag.status, 1);
  assert.match(wrongTag.stderr, /Tag v2\.4\.1 does not match the catalog version 2\.4\.0/);
  for (const args of [['sync', '--since', 'v2.3.4'], ['notes', 'v2.4.0', '--since', 'v2.3.4']]) {
    const result = run(root, ...args);
    assert.equal(result.status, 1, args.join(' '));
    assert.match(result.stderr, /^Usage: node scripts\/versions\.mjs/, args.join(' '));
  }
});
