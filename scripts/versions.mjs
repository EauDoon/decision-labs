// Version surfaces for the catalog. Each workbench's apps/<id>/package.json is
// the single source of truth for that workbench's version, and the root
// package.json for the catalog's. Every other place a version appears is
// written by `sync` or verified by `check`, including the order of every
// changelog and the version stamped into each generated standalone.html.
// The release workflow uses the same script to verify a tag, extract its
// release notes and name the standalone files it attaches.
//
//   node scripts/versions.mjs sync [--root <dir>]
//   node scripts/versions.mjs check [--tag vX.Y.Z] [--root <dir>]
//   node scripts/versions.mjs notes vX.Y.Z [--root <dir>]
//   node scripts/versions.mjs assets <dir> [--root <dir>]
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { APPS } from './apps.mjs';

export const DEFAULT_ROOT = fileURLToPath(new URL('../', import.meta.url));

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

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
  const catalog = JSON.parse(readText(root, 'package.json')).version ?? null;
  return { catalog, apps };
}

export function compareVersions(left, right) {
  const a = left.match(SEMVER).slice(1).map(Number);
  const b = right.match(SEMVER).slice(1).map(Number);
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
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

// Lines outside fenced code blocks, so example output cannot pass for a heading.
function proseLines(text) {
  let fenced = false;
  const lines = [];
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('```')) fenced = !fenced;
    else if (!fenced) lines.push(line);
  }
  return lines;
}

// An app changelog has one "# Changelog" title on line 1 and "## x.y.z" entry
// headings (optionally followed by a space and a date) that are unique and in
// strictly descending SemVer order, with the package version on top. Dates are
// not ordered: two parallel version lines made date and SemVer order diverge.
export function appChangelogProblems(file, text, version) {
  const problems = [];
  const lines = proseLines(text);
  const titles = lines.filter((line) => line.startsWith('# '));
  if (titles.length !== 1 || lines[0] !== '# Changelog') problems.push(`${file}: needs exactly one "# Changelog" title, on line 1.`);
  const versions = [];
  for (const heading of lines.filter((line) => line.startsWith('## '))) {
    const found = heading.match(/^## (\d+\.\d+\.\d+)(?:$| )/)?.[1];
    if (found) versions.push(found);
    else problems.push(`${file}: "${heading}" is not a "## x.y.z" release heading.`);
  }
  for (let index = 1; index < versions.length; index += 1) {
    if (compareVersions(versions[index - 1], versions[index]) <= 0) {
      problems.push(`${file}: ${versions[index - 1]} is followed by ${versions[index]}; entries must be unique and in descending SemVer order.`);
    }
  }
  if (versions[0] !== version) problems.push(`${file}: the first entry is ${versions[0] ?? 'missing'} but package.json says ${version}.`);
  return problems;
}

// The root changelog follows Keep a Changelog: an optional "## [Unreleased]"
// section, then "## [x.y.z] - YYYY-MM-DD" for the current catalog version.
export function rootChangelogProblems(text, version) {
  const headings = proseLines(text).filter((line) => line.startsWith('## '));
  const release = headings[0] === '## [Unreleased]' ? headings[1] : headings[0];
  const found = release?.match(/^## \[(\d+\.\d+\.\d+)\] - \d{4}-\d{2}-\d{2}$/)?.[1];
  if (!found) return [`CHANGELOG.md: the first release heading must be "## [${version}] - YYYY-MM-DD" but is "${release ?? 'missing'}".`];
  if (found !== version) return [`CHANGELOG.md: the first release is ${found} but package.json says ${version}.`];
  return [];
}

// Each generated standalone.html names the release that built it in a
// generator meta tag. The app builders write it; this only verifies it.
export function standaloneStampProblems(file, html, label, version) {
  const stamps = [...html.matchAll(/<meta name="generator" content="([^"]*)"/g)].map((match) => match[1]);
  const expected = `${label} ${version}`;
  if (stamps.length !== 1) return [`${file}: needs exactly one generator meta tag ("${expected}"); run npm run build:standalone.`];
  if (stamps[0] !== expected) return [`${file}: was built as "${stamps[0]}" but the package is "${expected}"; run npm run build:standalone.`];
  return [];
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

const TAG = /^v(\d+\.\d+\.\d+)$/;

// A release tag names the catalog version: vX.Y.Z for root package.json X.Y.Z.
// Workbench versions travel in the release notes and asset names, not in tags.
export function tagProblems(tag, catalog) {
  if (catalog === null) return [`package.json has no version, so there is no catalog release to tag as "${tag}". Add the version and its CHANGELOG.md entry first.`];
  const tagged = String(tag).match(TAG)?.[1];
  if (!tagged) return [`Tag "${tag}" is not a vX.Y.Z release tag.`];
  if (tagged !== catalog) return [`Tag ${tag} does not match the catalog version ${catalog} in package.json; the tag must be v${catalog}.`];
  return [];
}

// The body of the root CHANGELOG.md section for a release tag, without its
// heading or the link references that close the file. This is the text the
// GitHub release publishes. Throws when the section is missing or empty.
export function releaseNotes(text, tag) {
  const version = String(tag).match(TAG)?.[1];
  if (!version) throw new Error(`Tag "${tag}" is not a vX.Y.Z release tag.`);
  const heading = new RegExp(`^## \\[${escape(version)}\\](?: |$)`);
  let fenced = false;
  let inside = false;
  let found = false;
  const body = [];
  for (const line of text.split(/\r?\n/)) {
    const prose = !fenced;
    if (line.startsWith('```')) fenced = !fenced;
    if (prose && line.startsWith('## ')) {
      if (inside) break;
      inside = found = heading.test(line);
      continue;
    }
    if (inside && !(prose && /^\[[^\]]+\]:\s*\S/.test(line))) body.push(line);
  }
  if (!found) throw new Error(`CHANGELOG.md has no "## [${version}]" section for ${tag}.`);
  const notes = body.join('\n').trim();
  if (!notes) throw new Error(`CHANGELOG.md: the ${version} section is empty.`);
  return `${notes}\n`;
}

// Every disagreement between the package versions and the surfaces and
// changelogs, as messages. With a tag, the tag must also name the catalog
// version, which is how the release workflow gates a publish.
export function checkVersions(root = DEFAULT_ROOT, { tag } = {}) {
  const versions = readVersions(root);
  const problems = tag === undefined ? [] : tagProblems(tag, versions.catalog);
  if (versions.catalog !== null && !SEMVER.test(String(versions.catalog))) problems.push(`package.json: version "${versions.catalog}" is not x.y.z.`);
  for (const [id, version] of Object.entries(versions.apps)) {
    if (!SEMVER.test(String(version))) problems.push(`apps/${id}/package.json: version "${version}" is not x.y.z.`);
  }
  if (problems.length) return problems;
  const texts = new Map();
  for (const surface of surfaces(versions)) {
    if (!texts.has(surface.file)) texts.set(surface.file, readText(root, surface.file));
    const found = texts.get(surface.file).match(surface.pattern)?.[2]?.trim();
    if (found === undefined) problems.push(`${surface.file}: the ${surface.what} is missing.`);
    else if (found !== surface.expected) problems.push(`${surface.file}: the ${surface.what} says "${found}" but should say "${surface.expected}".`);
  }
  for (const { id, label } of APPS) {
    const file = `apps/${id}/CHANGELOG.md`;
    problems.push(...appChangelogProblems(file, readText(root, file), versions.apps[id]));
    problems.push(...standaloneStampProblems(`apps/${id}/standalone.html`, readText(root, `apps/${id}/standalone.html`), label, versions.apps[id]));
  }
  if (versions.catalog !== null) problems.push(...rootChangelogProblems(readText(root, 'CHANGELOG.md'), versions.catalog));
  return problems;
}

// Copies each workbench's standalone.html to <dir>/<id>-<version>.html, the
// files a release attaches, after the same check `npm run check` runs.
// Returns the written paths.
export function writeReleaseAssets(dir, root = DEFAULT_ROOT) {
  const problems = checkVersions(root);
  if (problems.length) throw new Error(`Refusing to package release assets:\n${problems.join('\n')}`);
  const versions = readVersions(root);
  mkdirSync(dir, { recursive: true });
  return APPS.map(({ id }) => {
    const target = resolve(dir, `${id}-${versions.apps[id]}.html`);
    copyFileSync(resolve(root, `apps/${id}/standalone.html`), target);
    return target;
  });
}

const USAGE = 'Usage: node scripts/versions.mjs <sync | check [--tag vX.Y.Z] | notes vX.Y.Z | assets <dir>> [--root <dir>]';

function main(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { root: { type: 'string' }, tag: { type: 'string' } },
  });
  const [command, ...extra] = positionals;
  const root = values.root ? resolve(values.root) : DEFAULT_ROOT;
  if (values.tag !== undefined && command !== 'check') {
    console.error(USAGE);
    return 1;
  }
  if (command === 'sync' && extra.length === 0) {
    const changed = syncVersions(root);
    console.log(changed.length ? `Updated ${changed.join(', ')}.` : 'Version surfaces already match the packages.');
    return 0;
  }
  if (command === 'check' && extra.length === 0) {
    const problems = checkVersions(root, { tag: values.tag });
    const tagIssues = values.tag === undefined ? [] : tagProblems(values.tag, readVersions(root).catalog);
    for (const problem of problems) console.error(problem);
    if (problems.length > tagIssues.length) {
      console.error('After changing a package version, run npm run versions:sync and npm run build:standalone, and put the matching entry at the top of that changelog, which stays in descending SemVer order.');
    }
    if (problems.length) return 1;
    console.log(values.tag === undefined
      ? 'Version surfaces, changelogs and standalone stamps match the packages.'
      : `Version surfaces, changelogs and standalone stamps match the packages, and ${values.tag} names the catalog version.`);
    return 0;
  }
  if (command === 'notes' && extra.length === 1) {
    process.stdout.write(releaseNotes(readText(root, 'CHANGELOG.md'), extra[0]));
    return 0;
  }
  if (command === 'assets' && extra.length === 1) {
    for (const file of writeReleaseAssets(resolve(extra[0]), root)) console.log(file);
    return 0;
  }
  console.error(USAGE);
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
