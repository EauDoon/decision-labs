import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);

// Exact public surface. Add a path here only together with a launcher test.
export const PUBLIC_PATHS = Object.freeze([
  '/',
  '/index.html',
  '/apps/partnership-breakpoint/standalone.html',
  '/apps/common-cart/standalone.html',
  '/apps/smallest-agreement/standalone.html',
  '/apps/weekend-gap/standalone.html',
]);

export const CONTENT_SECURITY_POLICY = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

export function publicFile(pathname) {
  if (!PUBLIC_PATHS.includes(pathname)) return null;
  return pathname === '/' ? 'index.html' : pathname.slice(1);
}

export function catalogVersionLine() {
  const apps = [
    ['partnership-breakpoint', 'Partnership Breakpoint'],
    ['common-cart', 'Common Cart'],
    ['smallest-agreement', 'The Smallest Agreement'],
    ['weekend-gap', 'Weekend Gap'],
  ];
  return apps.map(([id, label]) => {
    const version = JSON.parse(readFileSync(new URL(`apps/${id}/package.json`, root), 'utf8')).version;
    return `${label} ${version}`;
  }).join(', ');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function catalogJobs() {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  const cards = [];
  const re = /<article class="workbench"[^>]*>[\s\S]*?<h3>([^<]+)<\/h3>[\s\S]*?<p class="job">([^<]+)<\/p>/g;
  let match;
  while ((match = re.exec(html))) {
    cards.push({ name: match[1].trim(), job: match[2].trim() });
  }
  return cards;
}

function catalogWhatsNewHeadings() {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  const start = html.indexOf('id="whats-new"');
  const end = html.indexOf('id="workbenches"', start);
  const section = start >= 0 && end > start ? html.slice(start, end) : '';
  return [...section.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map((match) => match[1].trim());
}

export function catalogFirstWhatsNewHeading() {
  return catalogWhatsNewHeadings()[0] ?? '';
}

export function catalogLastWhatsNewHeading() {
  const headings = catalogWhatsNewHeadings();
  return headings[headings.length - 1] ?? '';
}

function catalogWorkbenchHeadings() {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  const start = html.indexOf('id="workbenches"');
  if (start < 0) return [];
  const how = html.indexOf('id="how-it-works"', start);
  const section = how > start ? html.slice(start, how) : html.slice(start);
  const cards = [...section.matchAll(/<article class="workbench"[^>]*>[\s\S]*?<h3>([^<]+)<\/h3>/g)].map((match) => match[1].trim());
  if (cards.length) return cards;
  return [...section.matchAll(/<article[^>]*class="workbench"[^>]*>[\s\S]*?<h3>([^<]+)<\/h3>/g)].map((match) => match[1].trim());
}

export function catalogFirstWorkbenchHeading() {
  return catalogWorkbenchHeadings()[0] ?? '';
}

export function catalogLastWorkbenchHeading() {
  const headings = catalogWorkbenchHeadings();
  return headings[headings.length - 1] ?? '';
}

function catalogReviewPaths() {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  const start = html.indexOf('id="workbenches"');
  if (start < 0) return [];
  const how = html.indexOf('id="how-it-works"', start);
  const section = how > start ? html.slice(start, how) : html.slice(start);
  return [...section.matchAll(/<p class="review-path"[^>]*>([\s\S]*?)<\/p>/g)].map((match) =>
    match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  );
}

export function catalogFirstReviewPath() {
  return catalogReviewPaths()[0] ?? '';
}

export function catalogLastReviewPath() {
  const paths = catalogReviewPaths();
  return paths[paths.length - 1] ?? '';
}

function catalogOpenHrefs() {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  const start = html.indexOf('id="workbenches"');
  if (start < 0) return [];
  const how = html.indexOf('id="how-it-works"', start);
  const section = how > start ? html.slice(start, how) : html.slice(start);
  return [...section.matchAll(/<a class="open"[^>]*href="([^"]+)"/g)].map((match) => match[1].trim());
}

export function catalogFirstOpenHref() {
  return catalogOpenHrefs()[0] ?? '';
}

export function catalogLastOpenHref() {
  const hrefs = catalogOpenHrefs();
  return hrefs[hrefs.length - 1] ?? '';
}

export function catalogSkipLinks() {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  const start = html.indexOf('id="skips"');
  if (start < 0) return [];
  const header = html.indexOf('<header', start);
  const section = header > start ? html.slice(start, header) : html.slice(start);
  return [...section.matchAll(/<a class="skip"[^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/g)].map((match) => ({
    href: match[1].trim(),
    text: match[2].trim(),
  }));
}

export function catalogSkipHrefs() {
  return catalogSkipLinks().map((link) => link.href);
}

export function catalogFirstSkipHref() {
  return catalogSkipHrefs()[0] ?? '';
}

export function catalogFirstSkipText() {
  return catalogSkipLinks()[0]?.text ?? '';
}

export function catalogLastSkipHref() {
  return catalogSkipHrefs().at(-1) ?? '';
}

export function catalogLastSkipText() {
  return catalogSkipLinks().at(-1)?.text ?? '';
}

function catalogMarkupTag(html, id) {
  const needle = `id="${id}"`;
  const idx = html.indexOf(needle);
  if (idx < 0) return null;
  const tagStart = html.lastIndexOf('<', idx);
  const tagEnd = html.indexOf('>', idx);
  if (tagStart < 0 || tagEnd < 0) return null;
  return { start: tagStart, end: tagEnd, tag: html.slice(tagStart, tagEnd + 1) };
}

function catalogMarkupText(html, id) {
  const found = catalogMarkupTag(html, id);
  if (!found) return '';
  const closeLt = html.indexOf('<', found.end + 1);
  if (closeLt < 0) return '';
  return html.slice(found.end + 1, closeLt).trim();
}

function catalogSkipTargetText(href) {
  if (!href.startsWith('#') || href.length < 2) return '';
  const html = readFileSync(new URL('index.html', root), 'utf8');
  const found = catalogMarkupTag(html, href.slice(1));
  if (!found) return '';
  const labelled = found.tag.match(/aria-labelledby="([^"]+)"/);
  if (labelled) return catalogMarkupText(html, labelled[1]);
  if (/^<h[1-6]\b/i.test(found.tag)) return catalogMarkupText(html, href.slice(1));
  return '';
}

export function catalogFirstSkipTargetText() {
  return catalogSkipTargetText(catalogFirstSkipHref());
}

export function catalogFirstLabelledSkipTargetText() {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  for (const link of catalogSkipLinks()) {
    const href = link.href;
    if (!href.startsWith('#') || href.length < 2) continue;
    const found = catalogMarkupTag(html, href.slice(1));
    if (!found) continue;
    const labelled = found.tag.match(/aria-labelledby="([^"]+)"/);
    if (!labelled) continue;
    return catalogMarkupText(html, labelled[1]);
  }
  return '';
}

export function catalogLastSkipTargetText() {
  const links = catalogSkipLinks();
  for (let i = links.length - 1; i >= 0; i -= 1) {
    const text = catalogSkipTargetText(links[i].href);
    if (text) return text;
  }
  return '';
}

export function catalogFirstLabelledSkipHref() {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  for (const link of catalogSkipLinks()) {
    const href = link.href;
    if (!href.startsWith('#') || href.length < 2) continue;
    const found = catalogMarkupTag(html, href.slice(1));
    if (!found) continue;
    if (!found.tag.match(/aria-labelledby="([^"]+)"/)) continue;
    return href;
  }
  return '';
}

export function catalogFirstLabelledSkipText() {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  for (const link of catalogSkipLinks()) {
    const href = link.href;
    if (!href.startsWith('#') || href.length < 2) continue;
    const found = catalogMarkupTag(html, href.slice(1));
    if (!found) continue;
    if (!found.tag.match(/aria-labelledby="([^"]+)"/)) continue;
    return link.text;
  }
  return '';
}

export function catalogLastLabelledSkipHref() {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  const links = catalogSkipLinks();
  for (let i = links.length - 1; i >= 0; i -= 1) {
    const href = links[i].href;
    if (!href.startsWith('#') || href.length < 2) continue;
    const found = catalogMarkupTag(html, href.slice(1));
    if (!found) continue;
    if (!found.tag.match(/aria-labelledby="([^"]+)"/)) continue;
    return href;
  }
  return '';
}

export function catalogLastLabelledSkipText() {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  const links = catalogSkipLinks();
  for (let i = links.length - 1; i >= 0; i -= 1) {
    const href = links[i].href;
    if (!href.startsWith('#') || href.length < 2) continue;
    const found = catalogMarkupTag(html, href.slice(1));
    if (!found) continue;
    if (!found.tag.match(/aria-labelledby="([^"]+)"/)) continue;
    return links[i].text;
  }
  return '';
}

export function catalogLastLabelledSkipTargetText() {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  const links = catalogSkipLinks();
  for (let i = links.length - 1; i >= 0; i -= 1) {
    const href = links[i].href;
    if (!href.startsWith('#') || href.length < 2) continue;
    const found = catalogMarkupTag(html, href.slice(1));
    if (!found) continue;
    const labelled = found.tag.match(/aria-labelledby="([^"]+)"/);
    if (!labelled) continue;
    return catalogMarkupText(html, labelled[1]);
  }
  return '';
}

export function catalogFirstUnlabelledSkipHref() {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  for (const link of catalogSkipLinks()) {
    const href = link.href;
    if (!href.startsWith('#') || href.length < 2) continue;
    const found = catalogMarkupTag(html, href.slice(1));
    if (!found) continue;
    if (found.tag.match(/aria-labelledby="([^"]+)"/)) continue;
    return href;
  }
  return '';
}

export function catalogLastUnlabelledSkipHref() {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  const links = catalogSkipLinks();
  for (let i = links.length - 1; i >= 0; i -= 1) {
    const href = links[i].href;
    if (!href.startsWith('#') || href.length < 2) continue;
    const found = catalogMarkupTag(html, href.slice(1));
    if (!found) continue;
    if (found.tag.match(/aria-labelledby="([^"]+)"/)) continue;
    return href;
  }
  return '';
}

export function catalogLastUnlabelledSkipText() {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  const links = catalogSkipLinks();
  for (let i = links.length - 1; i >= 0; i -= 1) {
    const href = links[i].href;
    if (!href.startsWith('#') || href.length < 2) continue;
    const found = catalogMarkupTag(html, href.slice(1));
    if (!found) continue;
    if (found.tag.match(/aria-labelledby="([^"]+)"/)) continue;
    return links[i].text;
  }
  return '';
}

export function catalogFirstUnlabelledSkipText() {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  for (const link of catalogSkipLinks()) {
    const href = link.href;
    if (!href.startsWith('#') || href.length < 2) continue;
    const found = catalogMarkupTag(html, href.slice(1));
    if (!found) continue;
    if (found.tag.match(/aria-labelledby="([^"]+)"/)) continue;
    return link.text;
  }
  return '';
}

export function catalogFirstUnlabelledSkipTargetText() {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  for (const link of catalogSkipLinks()) {
    const href = link.href;
    if (!href.startsWith('#') || href.length < 2) continue;
    const found = catalogMarkupTag(html, href.slice(1));
    if (!found) continue;
    if (found.tag.match(/aria-labelledby="([^"]+)"/)) continue;
    return catalogMarkupText(html, href.slice(1));
  }
  return '';
}

export function notFoundPage() {
  const versions = catalogVersionLine();
  const jobsList = catalogJobs().map(({ name, job }) => `<li>${escapeHtml(name)}: ${escapeHtml(job)}</li>`).join('\n      ');
  const firstWhatsNew = catalogFirstWhatsNewHeading();
  const lastWhatsNew = catalogLastWhatsNewHeading();
  const firstWorkbench = catalogFirstWorkbenchHeading();
  const lastWorkbench = catalogLastWorkbenchHeading();
  const firstReview = catalogFirstReviewPath();
  const lastReview = catalogLastReviewPath();
  const firstOpen = catalogFirstOpenHref();
  const lastOpen = catalogLastOpenHref();
  const skipLinks = catalogSkipLinks();
  const skipNav = skipLinks.map(({ href, text }) => `    <a class="skip" href="${escapeHtml(href)}">${escapeHtml(text)}</a>`).join('\n');
  const newsHeadings = [];
  if (firstWhatsNew) newsHeadings.push(firstWhatsNew);
  if (lastWhatsNew && lastWhatsNew !== firstWhatsNew) newsHeadings.push(lastWhatsNew);
  const newsList = newsHeadings.map((heading) => `<li><h3>${escapeHtml(heading)}</h3></li>`).join('\n        ');
  const workbenchHeadings = [];
  if (firstWorkbench) workbenchHeadings.push(firstWorkbench);
  if (lastWorkbench && lastWorkbench !== firstWorkbench) workbenchHeadings.push(lastWorkbench);
  const workbenchList = workbenchHeadings.map((heading, index, all) => {
    const reviews = [];
    if (index === 0 && firstReview) {
      reviews.push(`<p class="review-path">${escapeHtml(firstReview)}</p>`);
    }
    if (index === all.length - 1 && lastReview && !(index === 0 && firstReview === lastReview)) {
      reviews.push(`<p class="review-path">${escapeHtml(lastReview)}</p>`);
    }
    const review = reviews.length ? `\n        ${reviews.join('\n        ')}` : '';
    const opens = [];
    if (index === 0 && firstOpen) {
      opens.push(`<a class="open" href="${escapeHtml(firstOpen)}">Open workbench</a>`);
    }
    if (index === all.length - 1 && lastOpen && !(index === 0 && firstOpen === lastOpen)) {
      opens.push(`<a class="open" href="${escapeHtml(lastOpen)}">Open workbench</a>`);
    }
    const open = opens.length ? `\n        ${opens.join('\n        ')}` : '';
    return `<article class="workbench">
        <h3>${escapeHtml(heading)}</h3>${review}${open}
      </article>`;
  }).join('\n      ');
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Not found · Decision Labs</title>
  <style>
    :root { color-scheme: light; font-family: "Segoe UI", system-ui, sans-serif; }
    body { margin: 0; border-top: 7px solid #0f5a4b; background: #f2f6f5; color: #0e1f23; }
    main { max-width: 40rem; margin: 48px auto; padding: 0 24px; }
    .eyebrow { margin: 0 0 12px; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #0a4439; }
    h1 { font-family: Georgia, "Times New Roman", serif; font-weight: 500; font-size: 2rem; line-height: 1.2; margin: 0 0 14px; }
    p { line-height: 1.6; color: #0e1f23; }
    .version-line { font-weight: 650; }
    a {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
      max-width: 100%;
      flex-wrap: wrap;
      color: #0a4439;
      font-weight: 650;
      text-underline-offset: 3px;
    }
    a:hover { text-decoration-thickness: 2px; }
    a:focus-visible, button:focus-visible { outline: 3px solid #8a3800; outline-offset: 4px; }
    .copy-versions-tools { margin: 16px 0 0; }
    .copy-version-line-tools { margin: 16px 0 0; }
    .copy-first-trust-tools { margin: 16px 0 0; }
    .copy-first-how-tools { margin: 16px 0 0; }
    .copy-last-how-tools { margin: 16px 0 0; }
    .copy-last-job-tools { margin: 16px 0 0; }
    .copy-last-whats-new-tools { margin: 16px 0 0; }
    .copy-first-whats-new-tools { margin: 16px 0 0; }
    .copy-first-workbench-tools { margin: 16px 0 0; }
    .copy-last-workbench-tools { margin: 16px 0 0; }
    .copy-first-open-tools { margin: 16px 0 0; }
    .copy-last-open-tools { margin: 16px 0 0; }
    .copy-first-skip-tools { margin: 16px 0 0; }
    .copy-last-skip-tools { margin: 16px 0 0; }
    .copy-first-skip-text-tools { margin: 16px 0 0; }
    .copy-last-skip-text-tools { margin: 16px 0 0; }
    .copy-first-skip-target-text-tools { margin: 16px 0 0; }
    .copy-last-skip-target-text-tools { margin: 16px 0 0; }
    .copy-first-labelled-skip-target-text-tools { margin: 16px 0 0; }
    .copy-last-labelled-skip-target-text-tools { margin: 16px 0 0; }
    .copy-first-labelled-skip-href-tools { margin: 16px 0 0; }
    .copy-last-labelled-skip-href-tools { margin: 16px 0 0; }
    .copy-last-labelled-skip-text-tools { margin: 16px 0 0; }
    .copy-first-labelled-skip-text-tools { margin: 16px 0 0; }
    .copy-first-unlabelled-skip-text-tools { margin: 16px 0 0; }
    .copy-last-unlabelled-skip-text-tools { margin: 16px 0 0; }
    .copy-first-unlabelled-skip-href-tools { margin: 16px 0 0; }
    .copy-last-unlabelled-skip-href-tools { margin: 16px 0 0; }
    .copy-first-unlabelled-skip-target-text-tools { margin: 16px 0 0; }
    .copy-first-review-tools { margin: 16px 0 0; }
    .copy-last-review-tools { margin: 16px 0 0; }
    .copy-lede-tools { margin: 16px 0 0; }
    .copy-versions, .copy-trust, .copy-how, .copy-jobs, .copy-lede, .copy-version-line, .copy-first-trust, .copy-first-how, .copy-last-how, .copy-last-job, .copy-last-whats-new, .copy-first-whats-new, .copy-first-workbench, .copy-last-workbench, .copy-first-open, .copy-last-open, .copy-first-skip, .copy-last-skip, .copy-first-skip-text, .copy-last-skip-text, .copy-first-skip-target-text, .copy-last-skip-target-text, .copy-first-labelled-skip-target-text, .copy-last-labelled-skip-target-text, .copy-first-labelled-skip-href, .copy-last-labelled-skip-href, .copy-last-labelled-skip-text, .copy-first-labelled-skip-text, .copy-first-unlabelled-skip-text, .copy-last-unlabelled-skip-text, .copy-first-unlabelled-skip-href, .copy-last-unlabelled-skip-href, .copy-first-unlabelled-skip-target-text, .copy-first-review, .copy-last-review {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
      padding: 8px 14px;
      border: 1px solid #0f5a4b;
      border-radius: 4px;
      background: #ffffff;
      color: #0a4439;
      font: inherit;
      font-weight: 650;
      cursor: pointer;
    }
    .copy-versions-status, .copy-trust-status, .copy-how-status, .copy-jobs-status, .copy-lede-status, .copy-version-line-status, .copy-first-trust-status, .copy-first-how-status, .copy-last-how-status, .copy-last-job-status, .copy-last-whats-new-status, .copy-first-whats-new-status, .copy-first-workbench-status, .copy-last-workbench-status, .copy-first-open-status, .copy-last-open-status, .copy-first-skip-status, .copy-last-skip-status, .copy-first-skip-text-status, .copy-last-skip-text-status, .copy-first-skip-target-text-status, .copy-last-skip-target-text-status, .copy-first-labelled-skip-target-text-status, .copy-last-labelled-skip-target-text-status, .copy-first-labelled-skip-href-status, .copy-last-labelled-skip-href-status, .copy-last-labelled-skip-text-status, .copy-first-labelled-skip-text-status, .copy-first-unlabelled-skip-text-status, .copy-last-unlabelled-skip-text-status, .copy-first-unlabelled-skip-href-status, .copy-last-unlabelled-skip-href-status, .copy-first-unlabelled-skip-target-text-status, .copy-first-review-status, .copy-last-review-status { display: inline-block; margin-left: 12px; font-size: 15px; color: #1e3a42; }
    .copy-versions-fallback, .copy-trust-fallback, .copy-how-fallback, .copy-jobs-fallback, .copy-lede-fallback, .copy-version-line-fallback, .copy-first-trust-fallback, .copy-first-how-fallback, .copy-last-how-fallback, .copy-last-job-fallback, .copy-last-whats-new-fallback, .copy-first-whats-new-fallback, .copy-first-workbench-fallback, .copy-last-workbench-fallback, .copy-first-open-fallback, .copy-last-open-fallback, .copy-first-skip-fallback, .copy-last-skip-fallback, .copy-first-skip-text-fallback, .copy-last-skip-text-fallback, .copy-first-skip-target-text-fallback, .copy-last-skip-target-text-fallback, .copy-first-labelled-skip-target-text-fallback, .copy-last-labelled-skip-target-text-fallback, .copy-first-labelled-skip-href-fallback, .copy-last-labelled-skip-href-fallback, .copy-last-labelled-skip-text-fallback, .copy-first-labelled-skip-text-fallback, .copy-first-unlabelled-skip-text-fallback, .copy-last-unlabelled-skip-text-fallback, .copy-first-unlabelled-skip-href-fallback, .copy-last-unlabelled-skip-href-fallback, .copy-first-unlabelled-skip-target-text-fallback, .copy-first-review-fallback, .copy-last-review-fallback {
      display: block;
      width: 100%;
      margin-top: 10px;
      min-height: 6rem;
      padding: 10px 12px;
      font: 15px/1.5 ui-monospace, monospace;
      border: 1px solid #c3d0d3;
      border-radius: 4px;
    }
    .copy-versions-fallback[hidden], .copy-trust-fallback[hidden], .copy-how-fallback[hidden], .copy-jobs-fallback[hidden], .copy-lede-fallback[hidden], .copy-version-line-fallback[hidden], .copy-first-trust-fallback[hidden], .copy-first-how-fallback[hidden], .copy-last-how-fallback[hidden], .copy-last-job-fallback[hidden], .copy-last-whats-new-fallback[hidden], .copy-first-whats-new-fallback[hidden], .copy-first-workbench-fallback[hidden], .copy-last-workbench-fallback[hidden], .copy-first-open-fallback[hidden], .copy-last-open-fallback[hidden], .copy-first-skip-fallback[hidden], .copy-last-skip-fallback[hidden], .copy-first-skip-text-fallback[hidden], .copy-last-skip-text-fallback[hidden], .copy-first-skip-target-text-fallback[hidden], .copy-last-skip-target-text-fallback[hidden], .copy-first-labelled-skip-target-text-fallback[hidden], .copy-last-labelled-skip-target-text-fallback[hidden], .copy-first-labelled-skip-href-fallback[hidden], .copy-last-labelled-skip-href-fallback, .copy-last-labelled-skip-text-fallback[hidden], .copy-first-labelled-skip-text-fallback[hidden], .copy-first-unlabelled-skip-text-fallback[hidden], .copy-last-unlabelled-skip-text-fallback[hidden], .copy-first-unlabelled-skip-href-fallback[hidden], .copy-last-unlabelled-skip-href-fallback[hidden], .copy-first-unlabelled-skip-target-text-fallback[hidden], .copy-first-review-fallback[hidden], .copy-last-review-fallback[hidden] { display: none; }
    .trust, .guide { margin: 28px 0 8px; padding-top: 8px; }
    .trust ul, .guide ul { margin: 12px 0 0; padding-left: 1.2rem; color: #1e3a42; }
    .trust li, .guide li { margin: 8px 0; }
    .copy-trust-tools, .copy-how-tools, .copy-jobs-tools { margin: 16px 0 0; }
    #catalog-jobs { margin: 16px 0 0; padding-left: 1.2rem; color: #1e3a42; }
    #catalog-jobs li { margin: 8px 0; }
  </style>
</head>
<body>
  <nav class="skips" id="skips" aria-label="Skip">
${skipNav}
  </nav>
  <main>
    <p class="eyebrow">Decision Labs</p>
    <h1>This path is not in the catalog</h1>
    <p class="lede">The local launcher serves only the Decision Labs catalog page and the four workbenches. It does not serve source, notes, or drafts.</p>
    <p class="copy-lede-tools">
      <button type="button" class="copy-lede" id="copy-lede">Copy catalog intro</button>
      <span class="copy-lede-status" id="copy-lede-status" role="status"></span>
    </p>
    <textarea id="copy-lede-fallback" class="copy-lede-fallback" hidden readonly rows="4" aria-label="Catalog heading and lede as Markdown"></textarea>
    <p id="version-line" class="version-line">Current catalog: ${versions}.</p>
    <p class="copy-versions-tools">
      <button type="button" class="copy-versions" id="copy-versions">Copy versions</button>
      <span class="copy-versions-status" id="copy-versions-status" role="status"></span>
    </p>
    <textarea id="copy-versions-fallback" class="copy-versions-fallback" hidden readonly rows="4" aria-label="Workbench versions as Markdown"></textarea>
    <p class="copy-version-line-tools">
      <button type="button" class="copy-version-line" id="copy-version-line">Copy version line</button>
      <span class="copy-version-line-status" id="copy-version-line-status" role="status"></span>
    </p>
    <textarea id="copy-version-line-fallback" class="copy-version-line-fallback" hidden readonly rows="2" aria-label="Catalog version line as Markdown"></textarea>
    <ul id="catalog-jobs">
      ${jobsList}
    </ul>
    <p class="copy-jobs-tools">
      <button type="button" class="copy-jobs" id="copy-jobs">Copy jobs</button>
      <span class="copy-jobs-status" id="copy-jobs-status" role="status"></span>
    </p>
    <textarea id="copy-jobs-fallback" class="copy-jobs-fallback" hidden readonly rows="4" aria-label="Workbench jobs as Markdown"></textarea>
    <p class="copy-last-job-tools">
      <button type="button" class="copy-last-job" id="copy-last-job">Copy last job</button>
      <span class="copy-last-job-status" id="copy-last-job-status" role="status"></span>
    </p>
    <textarea id="copy-last-job-fallback" class="copy-last-job-fallback" hidden readonly rows="2" aria-label="Last workbench job as Markdown"></textarea>
    <section class="whats-new" id="whats-new" aria-labelledby="whats-new-title">
      <h2 id="whats-new-title">What's new</h2>
      <ul class="whats-new-list">
        ${newsList}
      </ul>
    </section>
    <p class="copy-first-whats-new-tools">
      <button type="button" class="copy-first-whats-new" id="copy-first-whats-new">Copy first What's new heading</button>
      <span class="copy-first-whats-new-status" id="copy-first-whats-new-status" role="status"></span>
    </p>
    <textarea id="copy-first-whats-new-fallback" class="copy-first-whats-new-fallback" hidden readonly rows="2" aria-label="First What's new heading as Markdown"></textarea>
    <p class="copy-last-whats-new-tools">
      <button type="button" class="copy-last-whats-new" id="copy-last-whats-new">Copy last What's new heading</button>
      <span class="copy-last-whats-new-status" id="copy-last-whats-new-status" role="status"></span>
    </p>
    <textarea id="copy-last-whats-new-fallback" class="copy-last-whats-new-fallback" hidden readonly rows="2" aria-label="Last What's new heading as Markdown"></textarea>
    <section id="workbenches" aria-labelledby="workbenches-title">
      <h2 id="workbenches-title">The workbenches</h2>
      ${workbenchList}
    </section>
    <p class="copy-first-workbench-tools">
      <button type="button" class="copy-first-workbench" id="copy-first-workbench">Copy first workbench heading</button>
      <span class="copy-first-workbench-status" id="copy-first-workbench-status" role="status"></span>
    </p>
    <textarea id="copy-first-workbench-fallback" class="copy-first-workbench-fallback" hidden readonly rows="2" aria-label="First workbench heading as Markdown"></textarea>
    <p class="copy-last-workbench-tools">
      <button type="button" class="copy-last-workbench" id="copy-last-workbench">Copy last workbench heading</button>
      <span class="copy-last-workbench-status" id="copy-last-workbench-status" role="status"></span>
    </p>
    <textarea id="copy-last-workbench-fallback" class="copy-last-workbench-fallback" hidden readonly rows="2" aria-label="Last workbench heading as Markdown"></textarea>
    <p class="copy-first-open-tools">
      <button type="button" class="copy-first-open" id="copy-first-open">Copy first Open href</button>
      <span class="copy-first-open-status" id="copy-first-open-status" role="status"></span>
    </p>
    <textarea id="copy-first-open-fallback" class="copy-first-open-fallback" hidden readonly rows="2" aria-label="First Open workbench href as Markdown"></textarea>
    <p class="copy-last-open-tools">
      <button type="button" class="copy-last-open" id="copy-last-open">Copy last Open href</button>
      <span class="copy-last-open-status" id="copy-last-open-status" role="status"></span>
    </p>
    <textarea id="copy-last-open-fallback" class="copy-last-open-fallback" hidden readonly rows="2" aria-label="Last Open workbench href as Markdown"></textarea>
    <p class="copy-first-skip-tools">
      <button type="button" class="copy-first-skip" id="copy-first-skip">Copy first skip href</button>
      <span class="copy-first-skip-status" id="copy-first-skip-status" role="status"></span>
    </p>
    <textarea id="copy-first-skip-fallback" class="copy-first-skip-fallback" hidden readonly rows="2" aria-label="First skip-link href as Markdown"></textarea>
    <p class="copy-last-skip-tools">
      <button type="button" class="copy-last-skip" id="copy-last-skip">Copy last skip href</button>
      <span class="copy-last-skip-status" id="copy-last-skip-status" role="status"></span>
    </p>
    <textarea id="copy-last-skip-fallback" class="copy-last-skip-fallback" hidden readonly rows="2" aria-label="Last skip-link href as Markdown"></textarea>
    <p class="copy-first-skip-text-tools">
      <button type="button" class="copy-first-skip-text" id="copy-first-skip-text">Copy first skip text</button>
      <span class="copy-first-skip-text-status" id="copy-first-skip-text-status" role="status"></span>
    </p>
    <textarea id="copy-first-skip-text-fallback" class="copy-first-skip-text-fallback" hidden readonly rows="2" aria-label="First skip-link text as Markdown"></textarea>
    <p class="copy-last-skip-text-tools">
      <button type="button" class="copy-last-skip-text" id="copy-last-skip-text">Copy last skip text</button>
      <span class="copy-last-skip-text-status" id="copy-last-skip-text-status" role="status"></span>
    </p>
    <textarea id="copy-last-skip-text-fallback" class="copy-last-skip-text-fallback" hidden readonly rows="2" aria-label="Last skip-link text as Markdown"></textarea>
    <p class="copy-first-skip-target-text-tools">
      <button type="button" class="copy-first-skip-target-text" id="copy-first-skip-target-text">Copy first skip target text</button>
      <span class="copy-first-skip-target-text-status" id="copy-first-skip-target-text-status" role="status"></span>
    </p>
    <textarea id="copy-first-skip-target-text-fallback" class="copy-first-skip-target-text-fallback" hidden readonly rows="2" aria-label="First skip-target text as Markdown"></textarea>
    <p class="copy-last-skip-target-text-tools">
      <button type="button" class="copy-last-skip-target-text" id="copy-last-skip-target-text">Copy last skip target text</button>
      <span class="copy-last-skip-target-text-status" id="copy-last-skip-target-text-status" role="status"></span>
    </p>
    <textarea id="copy-last-skip-target-text-fallback" class="copy-last-skip-target-text-fallback" hidden readonly rows="2" aria-label="Last skip-target text as Markdown"></textarea>
    <p class="copy-first-labelled-skip-target-text-tools">
      <button type="button" class="copy-first-labelled-skip-target-text" id="copy-first-labelled-skip-target-text">Copy first labelled skip target text</button>
      <span class="copy-first-labelled-skip-target-text-status" id="copy-first-labelled-skip-target-text-status" role="status"></span>
    </p>
    <textarea id="copy-first-labelled-skip-target-text-fallback" class="copy-first-labelled-skip-target-text-fallback" hidden readonly rows="2" aria-label="First labelled skip-target text as Markdown"></textarea>
    <p class="copy-last-labelled-skip-target-text-tools">
      <button type="button" class="copy-last-labelled-skip-target-text" id="copy-last-labelled-skip-target-text">Copy last labelled skip target text</button>
      <span class="copy-last-labelled-skip-target-text-status" id="copy-last-labelled-skip-target-text-status" role="status"></span>
    </p>
    <textarea id="copy-last-labelled-skip-target-text-fallback" class="copy-last-labelled-skip-target-text-fallback" hidden readonly rows="2" aria-label="Last labelled skip-target text as Markdown"></textarea>
    <p class="copy-first-labelled-skip-href-tools">
      <button type="button" class="copy-first-labelled-skip-href" id="copy-first-labelled-skip-href">Copy first labelled skip href</button>
      <span class="copy-first-labelled-skip-href-status" id="copy-first-labelled-skip-href-status" role="status"></span>
    </p>
    <textarea id="copy-first-labelled-skip-href-fallback" class="copy-first-labelled-skip-href-fallback" hidden readonly rows="2" aria-label="First labelled skip-link href as Markdown"></textarea>
    <p class="copy-last-labelled-skip-href-tools">
      <button type="button" class="copy-last-labelled-skip-href" id="copy-last-labelled-skip-href">Copy last labelled skip href</button>
      <span class="copy-last-labelled-skip-href-status" id="copy-last-labelled-skip-href-status" role="status"></span>
    </p>
    <textarea id="copy-last-labelled-skip-href-fallback" class="copy-last-labelled-skip-href-fallback" hidden readonly rows="2" aria-label="Last labelled skip-link href as Markdown"></textarea>
    <p class="copy-last-labelled-skip-text-tools">
      <button type="button" class="copy-last-labelled-skip-text" id="copy-last-labelled-skip-text">Copy last labelled skip text</button>
      <span class="copy-last-labelled-skip-text-status" id="copy-last-labelled-skip-text-status" role="status"></span>
    </p>
    <textarea id="copy-last-labelled-skip-text-fallback" class="copy-last-labelled-skip-text-fallback" hidden readonly rows="2" aria-label="Last labelled skip-link text as Markdown"></textarea>
    <p class="copy-first-labelled-skip-text-tools">
      <button type="button" class="copy-first-labelled-skip-text" id="copy-first-labelled-skip-text">Copy first labelled skip text</button>
      <span class="copy-first-labelled-skip-text-status" id="copy-first-labelled-skip-text-status" role="status"></span>
    </p>
    <textarea id="copy-first-labelled-skip-text-fallback" class="copy-first-labelled-skip-text-fallback" hidden readonly rows="2" aria-label="First labelled skip-link text as Markdown"></textarea>
    <p class="copy-first-unlabelled-skip-text-tools">
      <button type="button" class="copy-first-unlabelled-skip-text" id="copy-first-unlabelled-skip-text">Copy first unlabelled skip text</button>
      <span class="copy-first-unlabelled-skip-text-status" id="copy-first-unlabelled-skip-text-status" role="status"></span>
    </p>
    <textarea id="copy-first-unlabelled-skip-text-fallback" class="copy-first-unlabelled-skip-text-fallback" hidden readonly rows="2" aria-label="First unlabelled skip-link text as Markdown"></textarea>
    <p class="copy-last-unlabelled-skip-text-tools">
      <button type="button" class="copy-last-unlabelled-skip-text" id="copy-last-unlabelled-skip-text">Copy last unlabelled skip text</button>
      <span class="copy-last-unlabelled-skip-text-status" id="copy-last-unlabelled-skip-text-status" role="status"></span>
    </p>
    <textarea id="copy-last-unlabelled-skip-text-fallback" class="copy-last-unlabelled-skip-text-fallback" hidden readonly rows="2" aria-label="Last unlabelled skip-link text as Markdown"></textarea>
    <p class="copy-first-unlabelled-skip-href-tools">
      <button type="button" class="copy-first-unlabelled-skip-href" id="copy-first-unlabelled-skip-href">Copy first unlabelled skip href</button>
      <span class="copy-first-unlabelled-skip-href-status" id="copy-first-unlabelled-skip-href-status" role="status"></span>
    </p>
    <textarea id="copy-first-unlabelled-skip-href-fallback" class="copy-first-unlabelled-skip-href-fallback" hidden readonly rows="2" aria-label="First unlabelled skip-link href as Markdown"></textarea>
    <p class="copy-last-unlabelled-skip-href-tools">
      <button type="button" class="copy-last-unlabelled-skip-href" id="copy-last-unlabelled-skip-href">Copy last unlabelled skip href</button>
      <span class="copy-last-unlabelled-skip-href-status" id="copy-last-unlabelled-skip-href-status" role="status"></span>
    </p>
    <textarea id="copy-last-unlabelled-skip-href-fallback" class="copy-last-unlabelled-skip-href-fallback" hidden readonly rows="2" aria-label="Last unlabelled skip-link href as Markdown"></textarea>
    <p class="copy-first-unlabelled-skip-target-text-tools">
      <button type="button" class="copy-first-unlabelled-skip-target-text" id="copy-first-unlabelled-skip-target-text">Copy first unlabelled skip target text</button>
      <span class="copy-first-unlabelled-skip-target-text-status" id="copy-first-unlabelled-skip-target-text-status" role="status"></span>
    </p>
    <textarea id="copy-first-unlabelled-skip-target-text-fallback" class="copy-first-unlabelled-skip-target-text-fallback" hidden readonly rows="2" aria-label="First unlabelled skip-target text as Markdown"></textarea>
    <p class="copy-first-review-tools">
      <button type="button" class="copy-first-review" id="copy-first-review">Copy first review path</button>
      <span class="copy-first-review-status" id="copy-first-review-status" role="status"></span>
    </p>
    <textarea id="copy-first-review-fallback" class="copy-first-review-fallback" hidden readonly rows="2" aria-label="First review path as Markdown"></textarea>
    <p class="copy-last-review-tools">
      <button type="button" class="copy-last-review" id="copy-last-review">Copy last review path</button>
      <span class="copy-last-review-status" id="copy-last-review-status" role="status"></span>
    </p>
    <textarea id="copy-last-review-fallback" class="copy-last-review-fallback" hidden readonly rows="2" aria-label="Last review path as Markdown"></textarea>
    <section class="guide" id="how-it-works" aria-labelledby="how-title">
      <h2 id="how-title">How it works</h2>
      <ul>
        <li><strong>Local catalog.</strong> The launcher serves only the catalog page and the four workbenches. It does not serve source, notes, or drafts.</li>
        <li><strong>Standalone files.</strong> Every workbench ships interface, styles, and model in one document. The file makes no requests to Decision Labs or to anyone else.</li>
        <li><strong>Independent workbenches.</strong> The four tools do not share drafts, storage keys, or versions. This catalog is not a fifth product.</li>
      </ul>
    </section>
    <p class="copy-how-tools">
      <button type="button" class="copy-how" id="copy-how">Copy How it works</button>
      <span class="copy-how-status" id="copy-how-status" role="status"></span>
    </p>
    <textarea id="copy-how-fallback" class="copy-how-fallback" hidden readonly rows="8" aria-label="How it works as Markdown"></textarea>
    <p class="copy-first-how-tools">
      <button type="button" class="copy-first-how" id="copy-first-how">Copy first How it works item</button>
      <span class="copy-first-how-status" id="copy-first-how-status" role="status"></span>
    </p>
    <textarea id="copy-first-how-fallback" class="copy-first-how-fallback" hidden readonly rows="2" aria-label="First How it works item as Markdown"></textarea>
    <p class="copy-last-how-tools">
      <button type="button" class="copy-last-how" id="copy-last-how">Copy last How it works item</button>
      <span class="copy-last-how-status" id="copy-last-how-status" role="status"></span>
    </p>
    <textarea id="copy-last-how-fallback" class="copy-last-how-fallback" hidden readonly rows="2" aria-label="Last How it works item as Markdown"></textarea>
    <section class="trust" id="trust" aria-labelledby="trust-title">
      <h2 id="trust-title">Trust and limits</h2>
      <ul>
        <li><strong>Local-first.</strong> Pages run in your browser. The optional launcher binds loopback only. Nothing here calls a remote API or loads live market, merchant, or account data.</li>
        <li><strong>No account.</strong> There is no sign-in, cloud save, or hosted workspace. Browser storage stays on this device. Clear the site data and those drafts are gone unless you exported JSON.</li>
        <li><strong>Deterministic math.</strong> The same valid inputs produce the same outputs. The models do not sample, forecast, or assign probabilities, prices, fairness, or legitimacy.</li>
        <li><strong>Not a decision maker.</strong> A ranked shock, a pooled offer, a clause package, or a weekend queue is evidence for a conversation. People keep judgment, governing rules, and accountability.</li>
        <li><strong>Model notes live in each workbench.</strong> Formulas, units, and non-goals are documented beside the tool that uses them. This launcher does not serve those files; open the workbench when you need the exact conventions.</li>
      </ul>
    </section>
    <p class="copy-trust-tools">
      <button type="button" class="copy-trust" id="copy-trust">Copy Trust and limits</button>
      <span class="copy-trust-status" id="copy-trust-status" role="status"></span>
    </p>
    <textarea id="copy-trust-fallback" class="copy-trust-fallback" hidden readonly rows="8" aria-label="Trust and limits as Markdown"></textarea>
    <p class="copy-first-trust-tools">
      <button type="button" class="copy-first-trust" id="copy-first-trust">Copy first Trust item</button>
      <span class="copy-first-trust-status" id="copy-first-trust-status" role="status"></span>
    </p>
    <textarea id="copy-first-trust-fallback" class="copy-first-trust-fallback" hidden readonly rows="2" aria-label="First Trust and limits item as Markdown"></textarea>
    <p><a href="/">Open the Decision Labs catalog for Partnership Breakpoint, Common Cart, The Smallest Agreement, and Weekend Gap</a></p>
  </main>
  <script>
    (function () {
      const ledeBtn = document.getElementById('copy-lede');
      const ledeStatus = document.getElementById('copy-lede-status');
      const ledeFallback = document.getElementById('copy-lede-fallback');
      const ledeMarkdown = () => {
        const heading = document.querySelector('h1')?.textContent.trim() ?? '';
        const lede = document.querySelector('p.lede')?.textContent.trim() ?? '';
        if (!heading && !lede) return '';
        if (!heading) return lede;
        if (!lede) return '# ' + heading;
        return '# ' + heading + '\\n\\n' + lede;
      };
      ledeBtn?.addEventListener('click', async () => {
        const markdown = ledeMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (ledeFallback) ledeFallback.hidden = true;
          if (ledeStatus) {
            ledeStatus.textContent = empty
              ? 'Catalog heading and lede were missing. Copied an empty string. This is catalog copy, not a live product feed.'
              : 'Copied the catalog heading and lede from this page as Markdown. Not a live product feed.';
          }
        } catch {
          if (ledeFallback) {
            ledeFallback.hidden = false;
            ledeFallback.value = markdown;
            ledeFallback.focus();
            ledeFallback.select();
          }
          if (ledeStatus) {
            ledeStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. Catalog heading and lede were missing. This is catalog copy, not a live product feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the catalog heading and lede, not a live product feed.';
          }
        }
      });
      const versionsBtn = document.getElementById('copy-versions');
      const versionsStatus = document.getElementById('copy-versions-status');
      const versionsFallback = document.getElementById('copy-versions-fallback');
      const versionsMarkdown = () => {
        const line = document.querySelector('.version-line')?.textContent ?? '';
        const listed = line.replace(/^\\s*Current catalog:\\s*/i, '').replace(/\\.\\s*$/, '');
        const parts = listed.split(',').map((part) => part.trim()).filter(Boolean);
        return parts.map((part) => '- ' + part).join('\\n');
      };
      versionsBtn?.addEventListener('click', async () => {
        const markdown = versionsMarkdown();
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (versionsFallback) versionsFallback.hidden = true;
          if (versionsStatus) versionsStatus.textContent = 'Copied names and versions from this catalog list as Markdown. Not a live product version.';
        } catch {
          if (versionsFallback) {
            versionsFallback.hidden = false;
            versionsFallback.value = markdown;
            versionsFallback.focus();
            versionsFallback.select();
          }
          if (versionsStatus) versionsStatus.textContent = 'Clipboard unavailable. Copy the Markdown from the text box. This is the catalog list, not a live product version.';
        }
      });
      const versionLineBtn = document.getElementById('copy-version-line');
      const versionLineStatus = document.getElementById('copy-version-line-status');
      const versionLineFallback = document.getElementById('copy-version-line-fallback');
      const versionLineMarkdown = () => {
        const line = document.querySelector('.version-line')?.textContent ?? '';
        return line.replace(/^\\s*Current catalog:\\s*/i, '').replace(/\\.\\s*$/, '').trim();
      };
      versionLineBtn?.addEventListener('click', async () => {
        const markdown = versionLineMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (versionLineFallback) versionLineFallback.hidden = true;
          if (versionLineStatus) {
            versionLineStatus.textContent = empty
              ? 'Catalog version line was missing. Copied an empty string. This is catalog copy, not a live product version.'
              : 'Copied the catalog version line from this page as Markdown. Not a live product version.';
          }
        } catch {
          if (versionLineFallback) {
            versionLineFallback.hidden = false;
            versionLineFallback.value = markdown;
            versionLineFallback.focus();
            versionLineFallback.select();
          }
          if (versionLineStatus) {
            versionLineStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. Catalog version line was missing. This is catalog copy, not a live product version.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the catalog version line, not a live product version.';
          }
        }
      });
      const jobsBtn = document.getElementById('copy-jobs');
      const jobsStatus = document.getElementById('copy-jobs-status');
      const jobsFallback = document.getElementById('copy-jobs-fallback');
      const jobsMarkdown = () => [...document.querySelectorAll('#catalog-jobs li')].map((item) => '- ' + item.textContent.trim()).filter((line) => line !== '- ').join('\\n');
      jobsBtn?.addEventListener('click', async () => {
        const markdown = jobsMarkdown();
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (jobsFallback) jobsFallback.hidden = true;
          if (jobsStatus) jobsStatus.textContent = 'Copied names and jobs from this catalog list as Markdown. Not a live product feed.';
        } catch {
          if (jobsFallback) {
            jobsFallback.hidden = false;
            jobsFallback.value = markdown;
            jobsFallback.focus();
            jobsFallback.select();
          }
          if (jobsStatus) jobsStatus.textContent = 'Clipboard unavailable. Copy the Markdown from the text box. This is the catalog list, not a live product feed.';
        }
      });
      const lastJobBtn = document.getElementById('copy-last-job');
      const lastJobStatus = document.getElementById('copy-last-job-status');
      const lastJobFallback = document.getElementById('copy-last-job-fallback');
      const lastJobMarkdown = () => {
        const items = document.querySelectorAll('#catalog-jobs li');
        const item = items[items.length - 1];
        const text = item?.textContent.trim() ?? '';
        if (!text) return '';
        return '- ' + text;
      };
      lastJobBtn?.addEventListener('click', async () => {
        const markdown = lastJobMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (lastJobFallback) lastJobFallback.hidden = true;
          if (lastJobStatus) {
            lastJobStatus.textContent = empty
              ? 'Last workbench job was missing. Copied an empty string. This is catalog copy, not a live product feed.'
              : 'Copied the last workbench name and job from this page as Markdown. Not a live product feed.';
          }
        } catch {
          if (lastJobFallback) {
            lastJobFallback.hidden = false;
            lastJobFallback.value = markdown;
            lastJobFallback.focus();
            lastJobFallback.select();
          }
          if (lastJobStatus) {
            lastJobStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. Last workbench job was missing. This is catalog copy, not a live product feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the last catalog job, not a live product feed.';
          }
        }
      });
      const firstWhatsNewBtn = document.getElementById('copy-first-whats-new');
      const firstWhatsNewStatus = document.getElementById('copy-first-whats-new-status');
      const firstWhatsNewFallback = document.getElementById('copy-first-whats-new-fallback');
      const firstWhatsNewMarkdown = () => {
        const heading = document.querySelector('#whats-new h3');
        const text = heading?.textContent.trim() ?? '';
        if (!text) return '';
        return '- ' + text;
      };
      firstWhatsNewBtn?.addEventListener('click', async () => {
        const markdown = firstWhatsNewMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (firstWhatsNewFallback) firstWhatsNewFallback.hidden = true;
          if (firstWhatsNewStatus) {
            firstWhatsNewStatus.textContent = empty
              ? "First What's new heading was missing. Copied an empty string. This is catalog copy, not a live product feed."
              : "Copied the first What's new heading from this page as Markdown. Not a live product feed.";
          }
        } catch {
          if (firstWhatsNewFallback) {
            firstWhatsNewFallback.hidden = false;
            firstWhatsNewFallback.value = markdown;
            firstWhatsNewFallback.focus();
            firstWhatsNewFallback.select();
          }
          if (firstWhatsNewStatus) {
            firstWhatsNewStatus.textContent = empty
              ? "Clipboard unavailable. Copy the empty string from the text box. First What's new heading was missing. This is catalog copy, not a live product feed."
              : "Clipboard unavailable. Copy the Markdown from the text box. This is the first What's new heading, not a live product feed.";
          }
        }
      });
      const firstWorkbenchBtn = document.getElementById('copy-first-workbench');
      const firstWorkbenchStatus = document.getElementById('copy-first-workbench-status');
      const firstWorkbenchFallback = document.getElementById('copy-first-workbench-fallback');
      const firstWorkbenchMarkdown = () => {
        const heading = document.querySelector('#workbenches article.workbench h3');
        const text = heading?.textContent.trim() ?? '';
        if (!text) return '';
        return '- ' + text;
      };
      firstWorkbenchBtn?.addEventListener('click', async () => {
        const markdown = firstWorkbenchMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (firstWorkbenchFallback) firstWorkbenchFallback.hidden = true;
          if (firstWorkbenchStatus) {
            firstWorkbenchStatus.textContent = empty
              ? 'First workbench heading was missing. Copied an empty string. This is catalog copy, not a live product feed.'
              : 'Copied the first workbench heading from this page as Markdown. Not a live product feed.';
          }
        } catch {
          if (firstWorkbenchFallback) {
            firstWorkbenchFallback.hidden = false;
            firstWorkbenchFallback.value = markdown;
            firstWorkbenchFallback.focus();
            firstWorkbenchFallback.select();
          }
          if (firstWorkbenchStatus) {
            firstWorkbenchStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. First workbench heading was missing. This is catalog copy, not a live product feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the first workbench heading, not a live product feed.';
          }
        }
      });
      const lastWorkbenchBtn = document.getElementById('copy-last-workbench');
      const lastWorkbenchStatus = document.getElementById('copy-last-workbench-status');
      const lastWorkbenchFallback = document.getElementById('copy-last-workbench-fallback');
      const lastWorkbenchMarkdown = () => {
        const headings = document.querySelectorAll('#workbenches article.workbench h3');
        const heading = headings[headings.length - 1];
        const text = heading?.textContent.trim() ?? '';
        if (!text) return '';
        return '- ' + text;
      };
      lastWorkbenchBtn?.addEventListener('click', async () => {
        const markdown = lastWorkbenchMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (lastWorkbenchFallback) lastWorkbenchFallback.hidden = true;
          if (lastWorkbenchStatus) {
            lastWorkbenchStatus.textContent = empty
              ? 'Last workbench heading was missing. Copied an empty string. This is catalog copy, not a live product feed.'
              : 'Copied the last workbench heading from this page as Markdown. Not a live product feed.';
          }
        } catch {
          if (lastWorkbenchFallback) {
            lastWorkbenchFallback.hidden = false;
            lastWorkbenchFallback.value = markdown;
            lastWorkbenchFallback.focus();
            lastWorkbenchFallback.select();
          }
          if (lastWorkbenchStatus) {
            lastWorkbenchStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. Last workbench heading was missing. This is catalog copy, not a live product feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the last workbench heading, not a live product feed.';
          }
        }
      });
      const firstOpenBtn = document.getElementById('copy-first-open');
      const firstOpenStatus = document.getElementById('copy-first-open-status');
      const firstOpenFallback = document.getElementById('copy-first-open-fallback');
      const firstOpenMarkdown = () => {
        const open = document.querySelector('#workbenches a.open');
        const href = open?.getAttribute?.('href')?.trim() ?? '';
        if (!href) return '';
        return '- ' + href;
      };
      firstOpenBtn?.addEventListener('click', async () => {
        const markdown = firstOpenMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (firstOpenFallback) firstOpenFallback.hidden = true;
          if (firstOpenStatus) {
            firstOpenStatus.textContent = empty
              ? 'First Open workbench href was missing. Copied an empty string. This is catalog copy, not a live product feed.'
              : 'Copied the first Open workbench href from this page as Markdown. Not a live product feed.';
          }
        } catch {
          if (firstOpenFallback) {
            firstOpenFallback.hidden = false;
            firstOpenFallback.value = markdown;
            firstOpenFallback.focus();
            firstOpenFallback.select();
          }
          if (firstOpenStatus) {
            firstOpenStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. First Open workbench href was missing. This is catalog copy, not a live product feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the first Open workbench href, not a live product feed.';
          }
        }
      });
      const lastOpenBtn = document.getElementById('copy-last-open');
      const lastOpenStatus = document.getElementById('copy-last-open-status');
      const lastOpenFallback = document.getElementById('copy-last-open-fallback');
      const lastOpenMarkdown = () => {
        const opens = document.querySelectorAll('#workbenches a.open');
        const open = opens[opens.length - 1];
        const href = open?.getAttribute?.('href')?.trim() ?? '';
        if (!href) return '';
        return '- ' + href;
      };
      lastOpenBtn?.addEventListener('click', async () => {
        const markdown = lastOpenMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (lastOpenFallback) lastOpenFallback.hidden = true;
          if (lastOpenStatus) {
            lastOpenStatus.textContent = empty
              ? 'Last Open workbench href was missing. Copied an empty string. This is catalog copy, not a live product feed.'
              : 'Copied the last Open workbench href from this page as Markdown. Not a live product feed.';
          }
        } catch {
          if (lastOpenFallback) {
            lastOpenFallback.hidden = false;
            lastOpenFallback.value = markdown;
            lastOpenFallback.focus();
            lastOpenFallback.select();
          }
          if (lastOpenStatus) {
            lastOpenStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. Last Open workbench href was missing. This is catalog copy, not a live product feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the last Open workbench href, not a live product feed.';
          }
        }
      });
      const firstSkipBtn = document.getElementById('copy-first-skip');
      const firstSkipStatus = document.getElementById('copy-first-skip-status');
      const firstSkipFallback = document.getElementById('copy-first-skip-fallback');
      const firstSkipMarkdown = () => {
        const skip = document.querySelector('#skips a.skip');
        const href = skip?.getAttribute?.('href')?.trim() ?? '';
        if (!href) return '';
        return '- ' + href;
      };
      firstSkipBtn?.addEventListener('click', async () => {
        const markdown = firstSkipMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (firstSkipFallback) firstSkipFallback.hidden = true;
          if (firstSkipStatus) {
            firstSkipStatus.textContent = empty
              ? 'First skip-link href was missing. Copied an empty string. This is catalog copy, not a live product feed.'
              : 'Copied the first skip-link href from this page as Markdown. Not a live product feed.';
          }
        } catch {
          if (firstSkipFallback) {
            firstSkipFallback.hidden = false;
            firstSkipFallback.value = markdown;
            firstSkipFallback.focus();
            firstSkipFallback.select();
          }
          if (firstSkipStatus) {
            firstSkipStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. First skip-link href was missing. This is catalog copy, not a live product feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the first skip-link href, not a live product feed.';
          }
        }
      });
      const lastSkipBtn = document.getElementById('copy-last-skip');
      const lastSkipStatus = document.getElementById('copy-last-skip-status');
      const lastSkipFallback = document.getElementById('copy-last-skip-fallback');
      const lastSkipMarkdown = () => {
        const skips = document.querySelectorAll('#skips a.skip');
        const skip = skips[skips.length - 1];
        const href = skip?.getAttribute?.('href')?.trim() ?? '';
        if (!href) return '';
        return '- ' + href;
      };
      lastSkipBtn?.addEventListener('click', async () => {
        const markdown = lastSkipMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (lastSkipFallback) lastSkipFallback.hidden = true;
          if (lastSkipStatus) {
            lastSkipStatus.textContent = empty
              ? 'Last skip-link href was missing. Copied an empty string. This is catalog copy, not a live product feed.'
              : 'Copied the last skip-link href from this page as Markdown. Not a live product feed.';
          }
        } catch {
          if (lastSkipFallback) {
            lastSkipFallback.hidden = false;
            lastSkipFallback.value = markdown;
            lastSkipFallback.focus();
            lastSkipFallback.select();
          }
          if (lastSkipStatus) {
            lastSkipStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. Last skip-link href was missing. This is catalog copy, not a live product feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the last skip-link href, not a live product feed.';
          }
        }
      });
      const firstSkipTextBtn = document.getElementById('copy-first-skip-text');
      const firstSkipTextStatus = document.getElementById('copy-first-skip-text-status');
      const firstSkipTextFallback = document.getElementById('copy-first-skip-text-fallback');
      const firstSkipTextMarkdown = () => {
        const skip = document.querySelector('#skips a.skip');
        const text = skip?.textContent.trim() ?? '';
        if (!text) return '';
        return '- ' + text;
      };
      firstSkipTextBtn?.addEventListener('click', async () => {
        const markdown = firstSkipTextMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (firstSkipTextFallback) firstSkipTextFallback.hidden = true;
          if (firstSkipTextStatus) {
            firstSkipTextStatus.textContent = empty
              ? 'First skip-link text was missing. Copied an empty string. This is catalog copy, not a live product feed.'
              : 'Copied the first skip-link text from this page as Markdown. Not a live product feed.';
          }
        } catch {
          if (firstSkipTextFallback) {
            firstSkipTextFallback.hidden = false;
            firstSkipTextFallback.value = markdown;
            firstSkipTextFallback.focus();
            firstSkipTextFallback.select();
          }
          if (firstSkipTextStatus) {
            firstSkipTextStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. First skip-link text was missing. This is catalog copy, not a live product feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the first skip-link text, not a live product feed.';
          }
        }
      });
      const lastSkipTextBtn = document.getElementById('copy-last-skip-text');
      const lastSkipTextStatus = document.getElementById('copy-last-skip-text-status');
      const lastSkipTextFallback = document.getElementById('copy-last-skip-text-fallback');
      const lastSkipTextMarkdown = () => {
        const skips = document.querySelectorAll('#skips a.skip');
        const skip = skips[skips.length - 1];
        const text = skip?.textContent.trim() ?? '';
        if (!text) return '';
        return '- ' + text;
      };
      lastSkipTextBtn?.addEventListener('click', async () => {
        const markdown = lastSkipTextMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (lastSkipTextFallback) lastSkipTextFallback.hidden = true;
          if (lastSkipTextStatus) {
            lastSkipTextStatus.textContent = empty
              ? 'Last skip-link text was missing. Copied an empty string. This is catalog copy, not a live product feed.'
              : 'Copied the last skip-link text from this page as Markdown. Not a live product feed.';
          }
        } catch {
          if (lastSkipTextFallback) {
            lastSkipTextFallback.hidden = false;
            lastSkipTextFallback.value = markdown;
            lastSkipTextFallback.focus();
            lastSkipTextFallback.select();
          }
          if (lastSkipTextStatus) {
            lastSkipTextStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. Last skip-link text was missing. This is catalog copy, not a live product feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the last skip-link text, not a live product feed.';
          }
        }
      });
      const firstSkipTargetTextBtn = document.getElementById('copy-first-skip-target-text');
      const firstSkipTargetTextStatus = document.getElementById('copy-first-skip-target-text-status');
      const firstSkipTargetTextFallback = document.getElementById('copy-first-skip-target-text-fallback');
      const firstSkipTargetTextMarkdown = () => {
        const skip = document.querySelector('#skips a.skip');
        const href = skip && skip.getAttribute ? skip.getAttribute('href') : '';
        if (!href || href.charAt(0) !== '#' || href.length < 2) return '';
        const target = document.getElementById(href.slice(1));
        if (!target) return '';
        const labelledBy = target.getAttribute ? target.getAttribute('aria-labelledby') : '';
        const label = labelledBy ? document.getElementById(labelledBy) : null;
        let text = '';
        if (label) text = label.textContent.trim();
        else if (target.tagName && /^H[1-6]$/.test(target.tagName)) text = target.textContent.trim();
        if (!text) return '';
        return '- ' + text;
      };
      firstSkipTargetTextBtn?.addEventListener('click', async () => {
        const markdown = firstSkipTargetTextMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (firstSkipTargetTextFallback) firstSkipTargetTextFallback.hidden = true;
          if (firstSkipTargetTextStatus) {
            firstSkipTargetTextStatus.textContent = empty
              ? 'First skip-target text was missing. Copied an empty string. This is catalog copy, not a live product feed.'
              : 'Copied the first skip-target text from this page as Markdown. Not a live product feed.';
          }
        } catch {
          if (firstSkipTargetTextFallback) {
            firstSkipTargetTextFallback.hidden = false;
            firstSkipTargetTextFallback.value = markdown;
            firstSkipTargetTextFallback.focus();
            firstSkipTargetTextFallback.select();
          }
          if (firstSkipTargetTextStatus) {
            firstSkipTargetTextStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. First skip-target text was missing. This is catalog copy, not a live product feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the first skip-target text, not a live product feed.';
          }
        }
      });
      const lastSkipTargetTextBtn = document.getElementById('copy-last-skip-target-text');
      const lastSkipTargetTextStatus = document.getElementById('copy-last-skip-target-text-status');
      const lastSkipTargetTextFallback = document.getElementById('copy-last-skip-target-text-fallback');
      const lastSkipTargetTextMarkdown = () => {
        const skips = document.querySelectorAll('#skips a.skip');
        for (let i = skips.length - 1; i >= 0; i -= 1) {
          const skip = skips[i];
          const href = skip && skip.getAttribute ? skip.getAttribute('href') : '';
          if (!href || href.charAt(0) !== '#' || href.length < 2) continue;
          const target = document.getElementById(href.slice(1));
          if (!target) continue;
          const labelledBy = target.getAttribute ? target.getAttribute('aria-labelledby') : '';
          const label = labelledBy ? document.getElementById(labelledBy) : null;
          let text = '';
          if (label) text = label.textContent.trim();
          else if (target.tagName && /^H[1-6]$/.test(target.tagName)) text = target.textContent.trim();
          if (text) return '- ' + text;
        }
        return '';
      };
      lastSkipTargetTextBtn?.addEventListener('click', async () => {
        const markdown = lastSkipTargetTextMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (lastSkipTargetTextFallback) lastSkipTargetTextFallback.hidden = true;
          if (lastSkipTargetTextStatus) {
            lastSkipTargetTextStatus.textContent = empty
              ? 'Last skip-target text was missing. Copied an empty string. This is catalog copy, not a live product feed.'
              : 'Copied the last skip-target text from this page as Markdown. Not a live product feed.';
          }
        } catch {
          if (lastSkipTargetTextFallback) {
            lastSkipTargetTextFallback.hidden = false;
            lastSkipTargetTextFallback.value = markdown;
            lastSkipTargetTextFallback.focus();
            lastSkipTargetTextFallback.select();
          }
          if (lastSkipTargetTextStatus) {
            lastSkipTargetTextStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. Last skip-target text was missing. This is catalog copy, not a live product feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the last skip-target text, not a live product feed.';
          }
        }
      });
      const firstLabelledSkipTargetTextBtn = document.getElementById('copy-first-labelled-skip-target-text');
      const firstLabelledSkipTargetTextStatus = document.getElementById('copy-first-labelled-skip-target-text-status');
      const firstLabelledSkipTargetTextFallback = document.getElementById('copy-first-labelled-skip-target-text-fallback');
      const firstLabelledSkipTargetTextMarkdown = () => {
        const skips = document.querySelectorAll('#skips a.skip');
        for (let i = 0; i < skips.length; i += 1) {
          const skip = skips[i];
          const href = skip && skip.getAttribute ? skip.getAttribute('href') : '';
          if (!href || href.charAt(0) !== '#' || href.length < 2) continue;
          const target = document.getElementById(href.slice(1));
          if (!target) continue;
          const labelledBy = target.getAttribute ? target.getAttribute('aria-labelledby') : '';
          if (!labelledBy) continue;
          const label = document.getElementById(labelledBy);
          const text = label && label.textContent ? label.textContent.trim() : '';
          if (!text) return '';
          return '- ' + text;
        }
        return '';
      };
      firstLabelledSkipTargetTextBtn?.addEventListener('click', async () => {
        const markdown = firstLabelledSkipTargetTextMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (firstLabelledSkipTargetTextFallback) firstLabelledSkipTargetTextFallback.hidden = true;
          if (firstLabelledSkipTargetTextStatus) {
            firstLabelledSkipTargetTextStatus.textContent = empty
              ? 'First labelled skip-target text was missing. Copied an empty string. This is catalog copy, not a live product feed.'
              : 'Copied the first labelled skip-target text from this page as Markdown. Not a live product feed.';
          }
        } catch {
          if (firstLabelledSkipTargetTextFallback) {
            firstLabelledSkipTargetTextFallback.hidden = false;
            firstLabelledSkipTargetTextFallback.value = markdown;
            firstLabelledSkipTargetTextFallback.focus();
            firstLabelledSkipTargetTextFallback.select();
          }
          if (firstLabelledSkipTargetTextStatus) {
            firstLabelledSkipTargetTextStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. First labelled skip-target text was missing. This is catalog copy, not a live product feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the first labelled skip-target text, not a live product feed.';
          }
        }
      });
      const lastLabelledSkipTargetTextBtn = document.getElementById('copy-last-labelled-skip-target-text');
      const lastLabelledSkipTargetTextStatus = document.getElementById('copy-last-labelled-skip-target-text-status');
      const lastLabelledSkipTargetTextFallback = document.getElementById('copy-last-labelled-skip-target-text-fallback');
      const lastLabelledSkipTargetTextMarkdown = () => {
        const skips = document.querySelectorAll('#skips a.skip');
        for (let i = skips.length - 1; i >= 0; i -= 1) {
          const skip = skips[i];
          const href = skip && skip.getAttribute ? skip.getAttribute('href') : '';
          if (!href || href.charAt(0) !== '#' || href.length < 2) continue;
          const target = document.getElementById(href.slice(1));
          if (!target) continue;
          const labelledBy = target.getAttribute ? target.getAttribute('aria-labelledby') : '';
          if (!labelledBy) continue;
          const label = document.getElementById(labelledBy);
          const text = label && label.textContent ? label.textContent.trim() : '';
          if (!text) return '';
          return '- ' + text;
        }
        return '';
      };
      lastLabelledSkipTargetTextBtn?.addEventListener('click', async () => {
        const markdown = lastLabelledSkipTargetTextMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (lastLabelledSkipTargetTextFallback) lastLabelledSkipTargetTextFallback.hidden = true;
          if (lastLabelledSkipTargetTextStatus) {
            lastLabelledSkipTargetTextStatus.textContent = empty
              ? 'Last labelled skip-target text was missing. Copied an empty string. This is catalog copy, not a live product feed.'
              : 'Copied the last labelled skip-target text from this page as Markdown. Not a live product feed.';
          }
        } catch {
          if (lastLabelledSkipTargetTextFallback) {
            lastLabelledSkipTargetTextFallback.hidden = false;
            lastLabelledSkipTargetTextFallback.value = markdown;
            lastLabelledSkipTargetTextFallback.focus();
            lastLabelledSkipTargetTextFallback.select();
          }
          if (lastLabelledSkipTargetTextStatus) {
            lastLabelledSkipTargetTextStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. Last labelled skip-target text was missing. This is catalog copy, not a live product feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the last labelled skip-target text, not a live product feed.';
          }
        }
      });

      const firstLabelledSkipHrefBtn = document.getElementById('copy-first-labelled-skip-href');
      const firstLabelledSkipHrefStatus = document.getElementById('copy-first-labelled-skip-href-status');
      const firstLabelledSkipHrefFallback = document.getElementById('copy-first-labelled-skip-href-fallback');
      const firstLabelledSkipHrefMarkdown = () => {
        const skips = document.querySelectorAll('#skips a.skip');
        for (let i = 0; i < skips.length; i += 1) {
          const skip = skips[i];
          const href = skip && skip.getAttribute ? skip.getAttribute('href') : '';
          if (!href || href.charAt(0) !== '#' || href.length < 2) continue;
          const target = document.getElementById(href.slice(1));
          if (!target) continue;
          const labelledBy = target.getAttribute ? target.getAttribute('aria-labelledby') : '';
          if (!labelledBy) continue;
          return '- ' + href;
        }
        return '';
      };
      firstLabelledSkipHrefBtn?.addEventListener('click', async () => {
        const markdown = firstLabelledSkipHrefMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (firstLabelledSkipHrefFallback) firstLabelledSkipHrefFallback.hidden = true;
          if (firstLabelledSkipHrefStatus) {
            firstLabelledSkipHrefStatus.textContent = empty
              ? 'First labelled skip-link href was missing. Copied an empty string. This is catalog copy, not a live product feed.'
              : 'Copied the first labelled skip-link href from this page as Markdown. Not a live product feed.';
          }
        } catch {
          if (firstLabelledSkipHrefFallback) {
            firstLabelledSkipHrefFallback.hidden = false;
            firstLabelledSkipHrefFallback.value = markdown;
            firstLabelledSkipHrefFallback.focus();
            firstLabelledSkipHrefFallback.select();
          }
          if (firstLabelledSkipHrefStatus) {
            firstLabelledSkipHrefStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. First labelled skip-link href was missing. This is catalog copy, not a live product feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the first labelled skip-link href, not a live product feed.';
          }
        }
      });

      const lastLabelledSkipHrefBtn = document.getElementById('copy-last-labelled-skip-href');
      const lastLabelledSkipHrefStatus = document.getElementById('copy-last-labelled-skip-href-status');
      const lastLabelledSkipHrefFallback = document.getElementById('copy-last-labelled-skip-href-fallback');
      const lastLabelledSkipHrefMarkdown = () => {
        const skips = document.querySelectorAll('#skips a.skip');
        for (let i = skips.length - 1; i >= 0; i -= 1) {
          const skip = skips[i];
          const href = skip && skip.getAttribute ? skip.getAttribute('href') : '';
          if (!href || href.charAt(0) !== '#' || href.length < 2) continue;
          const target = document.getElementById(href.slice(1));
          if (!target) continue;
          const labelledBy = target.getAttribute ? target.getAttribute('aria-labelledby') : '';
          if (!labelledBy) continue;
          return '- ' + href;
        }
        return '';
      };
      lastLabelledSkipHrefBtn?.addEventListener('click', async () => {
        const markdown = lastLabelledSkipHrefMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (lastLabelledSkipHrefFallback) lastLabelledSkipHrefFallback.hidden = true;
          if (lastLabelledSkipHrefStatus) {
            lastLabelledSkipHrefStatus.textContent = empty
              ? 'Last labelled skip-link href was missing. Copied an empty string. This is catalog copy, not a live product feed.'
              : 'Copied the last labelled skip-link href from this page as Markdown. Not a live product feed.';
          }
        } catch {
          if (lastLabelledSkipHrefFallback) {
            lastLabelledSkipHrefFallback.hidden = false;
            lastLabelledSkipHrefFallback.value = markdown;
            lastLabelledSkipHrefFallback.focus();
            lastLabelledSkipHrefFallback.select();
          }
          if (lastLabelledSkipHrefStatus) {
            lastLabelledSkipHrefStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. Last labelled skip-link href was missing. This is catalog copy, not a live product feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the last labelled skip-link href, not a live product feed.';
          }
        }
      });

      const lastLabelledSkipTextBtn = document.getElementById('copy-last-labelled-skip-text');
      const lastLabelledSkipTextStatus = document.getElementById('copy-last-labelled-skip-text-status');
      const lastLabelledSkipTextFallback = document.getElementById('copy-last-labelled-skip-text-fallback');
      const lastLabelledSkipTextMarkdown = () => {
        const skips = document.querySelectorAll('#skips a.skip');
        for (let i = skips.length - 1; i >= 0; i -= 1) {
          const skip = skips[i];
          const href = skip && skip.getAttribute ? skip.getAttribute('href') : '';
          if (!href || href.charAt(0) !== '#' || href.length < 2) continue;
          const target = document.getElementById(href.slice(1));
          if (!target) continue;
          const labelledBy = target.getAttribute ? target.getAttribute('aria-labelledby') : '';
          if (!labelledBy) continue;
          const text = skip.textContent ? skip.textContent.trim() : '';
          if (!text) return '';
          return '- ' + text;
        }
        return '';
      };
      lastLabelledSkipTextBtn?.addEventListener('click', async () => {
        const markdown = lastLabelledSkipTextMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (lastLabelledSkipTextFallback) lastLabelledSkipTextFallback.hidden = true;
          if (lastLabelledSkipTextStatus) {
            lastLabelledSkipTextStatus.textContent = empty
              ? 'Last labelled skip-link text was missing. Copied an empty string. This is catalog copy, not a live product feed.'
              : 'Copied the last labelled skip-link text from this page as Markdown. Not a live product feed.';
          }
        } catch {
          if (lastLabelledSkipTextFallback) {
            lastLabelledSkipTextFallback.hidden = false;
            lastLabelledSkipTextFallback.value = markdown;
            lastLabelledSkipTextFallback.focus();
            lastLabelledSkipTextFallback.select();
          }
          if (lastLabelledSkipTextStatus) {
            lastLabelledSkipTextStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. Last labelled skip-link text was missing. This is catalog copy, not a live product feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the last labelled skip-link text, not a live product feed.';
          }
        }
      });

      const firstLabelledSkipTextBtn = document.getElementById('copy-first-labelled-skip-text');
      const firstLabelledSkipTextStatus = document.getElementById('copy-first-labelled-skip-text-status');
      const firstLabelledSkipTextFallback = document.getElementById('copy-first-labelled-skip-text-fallback');
      const firstLabelledSkipTextMarkdown = () => {
        const skips = document.querySelectorAll('#skips a.skip');
        for (let i = 0; i < skips.length; i += 1) {
          const skip = skips[i];
          const href = skip && skip.getAttribute ? skip.getAttribute('href') : '';
          if (!href || href.charAt(0) !== '#' || href.length < 2) continue;
          const target = document.getElementById(href.slice(1));
          if (!target) continue;
          const labelledBy = target.getAttribute ? target.getAttribute('aria-labelledby') : '';
          if (!labelledBy) continue;
          const text = skip.textContent ? skip.textContent.trim() : '';
          if (!text) return '';
          return '- ' + text;
        }
        return '';
      };
      const firstLabelledSkipLink = () => {
        const skips = document.querySelectorAll('#skips a.skip');
        for (let i = 0; i < skips.length; i += 1) {
          const skip = skips[i];
          const href = skip && skip.getAttribute ? skip.getAttribute('href') : '';
          if (!href || href.charAt(0) !== '#' || href.length < 2) continue;
          const target = document.getElementById(href.slice(1));
          if (!target) continue;
          const labelledBy = target.getAttribute ? target.getAttribute('aria-labelledby') : '';
          if (!labelledBy) continue;
          return skip;
        }
        return null;
      };
      firstLabelledSkipTextBtn?.addEventListener('click', async () => {
        const markdown = firstLabelledSkipTextMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (firstLabelledSkipTextFallback) firstLabelledSkipTextFallback.hidden = true;
          if (firstLabelledSkipTextStatus) {
            firstLabelledSkipTextStatus.textContent = empty
              ? 'First labelled skip-link text was missing. Copied an empty string. This is catalog copy, not a live product feed.'
              : 'Copied the first labelled skip-link text from this page as Markdown. Not a live product feed.';
          }
        } catch {
          if (firstLabelledSkipTextFallback) {
            firstLabelledSkipTextFallback.hidden = false;
            firstLabelledSkipTextFallback.value = markdown;
            firstLabelledSkipTextFallback.focus();
            firstLabelledSkipTextFallback.select();
          }
          if (firstLabelledSkipTextStatus) {
            firstLabelledSkipTextStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. First labelled skip-link text was missing. This is catalog copy, not a live product feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the first labelled skip-link text, not a live product feed.';
          }
        }
      });
      const lastUnlabelledSkipTextBtn = document.getElementById('copy-last-unlabelled-skip-text');
      const lastUnlabelledSkipTextStatus = document.getElementById('copy-last-unlabelled-skip-text-status');
      const lastUnlabelledSkipTextFallback = document.getElementById('copy-last-unlabelled-skip-text-fallback');
      const lastUnlabelledSkipTextMarkdown = () => {
        const skips = document.querySelectorAll('#skips a.skip');
        for (let i = skips.length - 1; i >= 0; i -= 1) {
          const skip = skips[i];
          const href = skip && skip.getAttribute ? skip.getAttribute('href') : '';
          if (!href || href.charAt(0) !== '#' || href.length < 2) continue;
          const target = document.getElementById(href.slice(1));
          if (!target) continue;
          const labelledBy = target.getAttribute ? target.getAttribute('aria-labelledby') : '';
          if (labelledBy) continue;
          const text = skip.textContent ? skip.textContent.trim() : '';
          if (!text) return '';
          return '- ' + text;
        }
        return '';
      };
      lastUnlabelledSkipTextBtn?.addEventListener('click', async () => {
        const markdown = lastUnlabelledSkipTextMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (lastUnlabelledSkipTextFallback) lastUnlabelledSkipTextFallback.hidden = true;
          if (lastUnlabelledSkipTextStatus) {
            lastUnlabelledSkipTextStatus.textContent = empty
              ? 'Last unlabelled skip-link text was missing. Copied an empty string. This is catalog copy, not a live product feed.'
              : 'Copied the last unlabelled skip-link text from this page as Markdown. Not a live product feed.';
          }
        } catch {
          if (lastUnlabelledSkipTextFallback) {
            lastUnlabelledSkipTextFallback.hidden = false;
            lastUnlabelledSkipTextFallback.value = markdown;
            lastUnlabelledSkipTextFallback.focus();
            lastUnlabelledSkipTextFallback.select();
          }
          if (lastUnlabelledSkipTextStatus) {
            lastUnlabelledSkipTextStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. Last unlabelled skip-link text was missing. This is catalog copy, not a live product feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the last unlabelled skip-link text, not a live product feed.';
          }
        }
      });
      const firstUnlabelledSkipTextBtn = document.getElementById('copy-first-unlabelled-skip-text');
      const firstUnlabelledSkipTextStatus = document.getElementById('copy-first-unlabelled-skip-text-status');
      const firstUnlabelledSkipTextFallback = document.getElementById('copy-first-unlabelled-skip-text-fallback');
      const firstUnlabelledSkipTextMarkdown = () => {
        const skips = document.querySelectorAll('#skips a.skip');
        for (let i = 0; i < skips.length; i += 1) {
          const skip = skips[i];
          const href = skip && skip.getAttribute ? skip.getAttribute('href') : '';
          if (!href || href.charAt(0) !== '#' || href.length < 2) continue;
          const target = document.getElementById(href.slice(1));
          if (!target) continue;
          const labelledBy = target.getAttribute ? target.getAttribute('aria-labelledby') : '';
          if (labelledBy) continue;
          const text = skip.textContent ? skip.textContent.trim() : '';
          if (!text) return '';
          return '- ' + text;
        }
        return '';
      };
      firstUnlabelledSkipTextBtn?.addEventListener('click', async () => {
        const markdown = firstUnlabelledSkipTextMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (firstUnlabelledSkipTextFallback) firstUnlabelledSkipTextFallback.hidden = true;
          if (firstUnlabelledSkipTextStatus) {
            firstUnlabelledSkipTextStatus.textContent = empty
              ? 'First unlabelled skip-link text was missing. Copied an empty string. This is catalog copy, not a live product feed.'
              : 'Copied the first unlabelled skip-link text from this page as Markdown. Not a live product feed.';
          }
        } catch {
          if (firstUnlabelledSkipTextFallback) {
            firstUnlabelledSkipTextFallback.hidden = false;
            firstUnlabelledSkipTextFallback.value = markdown;
            firstUnlabelledSkipTextFallback.focus();
            firstUnlabelledSkipTextFallback.select();
          }
          if (firstUnlabelledSkipTextStatus) {
            firstUnlabelledSkipTextStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. First unlabelled skip-link text was missing. This is catalog copy, not a live product feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the first unlabelled skip-link text, not a live product feed.';
          }
        }
      });
      const firstUnlabelledSkipHrefBtn = document.getElementById('copy-first-unlabelled-skip-href');
      const firstUnlabelledSkipHrefStatus = document.getElementById('copy-first-unlabelled-skip-href-status');
      const firstUnlabelledSkipHrefFallback = document.getElementById('copy-first-unlabelled-skip-href-fallback');
      const firstUnlabelledSkipHrefMarkdown = () => {
        const skips = document.querySelectorAll('#skips a.skip');
        for (let i = 0; i < skips.length; i += 1) {
          const skip = skips[i];
          const href = skip && skip.getAttribute ? skip.getAttribute('href') : '';
          if (!href || href.charAt(0) !== '#' || href.length < 2) continue;
          const target = document.getElementById(href.slice(1));
          if (!target) continue;
          const labelledBy = target.getAttribute ? target.getAttribute('aria-labelledby') : '';
          if (labelledBy) continue;
          return '- ' + href;
        }
        return '';
      };
      firstUnlabelledSkipHrefBtn?.addEventListener('click', async () => {
        const markdown = firstUnlabelledSkipHrefMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (firstUnlabelledSkipHrefFallback) firstUnlabelledSkipHrefFallback.hidden = true;
          if (firstUnlabelledSkipHrefStatus) {
            firstUnlabelledSkipHrefStatus.textContent = empty
              ? 'First unlabelled skip-link href was missing. Copied an empty string. This is catalog copy, not a live product feed.'
              : 'Copied the first unlabelled skip-link href from this page as Markdown. Not a live product feed.';
          }
        } catch {
          if (firstUnlabelledSkipHrefFallback) {
            firstUnlabelledSkipHrefFallback.hidden = false;
            firstUnlabelledSkipHrefFallback.value = markdown;
            firstUnlabelledSkipHrefFallback.focus();
            firstUnlabelledSkipHrefFallback.select();
          }
          if (firstUnlabelledSkipHrefStatus) {
            firstUnlabelledSkipHrefStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. First unlabelled skip-link href was missing. This is catalog copy, not a live product feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the first unlabelled skip-link href, not a live product feed.';
          }
        }
      });
      const lastUnlabelledSkipHrefBtn = document.getElementById('copy-last-unlabelled-skip-href');
      const lastUnlabelledSkipHrefStatus = document.getElementById('copy-last-unlabelled-skip-href-status');
      const lastUnlabelledSkipHrefFallback = document.getElementById('copy-last-unlabelled-skip-href-fallback');
      const lastUnlabelledSkipHrefMarkdown = () => {
        const skips = document.querySelectorAll('#skips a.skip');
        for (let i = skips.length - 1; i >= 0; i -= 1) {
          const skip = skips[i];
          const href = skip && skip.getAttribute ? skip.getAttribute('href') : '';
          if (!href || href.charAt(0) !== '#' || href.length < 2) continue;
          const target = document.getElementById(href.slice(1));
          if (!target) continue;
          const labelledBy = target.getAttribute ? target.getAttribute('aria-labelledby') : '';
          if (labelledBy) continue;
          return '- ' + href;
        }
        return '';
      };
      lastUnlabelledSkipHrefBtn?.addEventListener('click', async () => {
        const markdown = lastUnlabelledSkipHrefMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (lastUnlabelledSkipHrefFallback) lastUnlabelledSkipHrefFallback.hidden = true;
          if (lastUnlabelledSkipHrefStatus) {
            lastUnlabelledSkipHrefStatus.textContent = empty
              ? 'Last unlabelled skip-link href was missing. Copied an empty string. This is catalog copy, not a live product feed.'
              : 'Copied the last unlabelled skip-link href from this page as Markdown. Not a live product feed.';
          }
        } catch {
          if (lastUnlabelledSkipHrefFallback) {
            lastUnlabelledSkipHrefFallback.hidden = false;
            lastUnlabelledSkipHrefFallback.value = markdown;
            lastUnlabelledSkipHrefFallback.focus();
            lastUnlabelledSkipHrefFallback.select();
          }
          if (lastUnlabelledSkipHrefStatus) {
            lastUnlabelledSkipHrefStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. Last unlabelled skip-link href was missing. This is catalog copy, not a live product feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the last unlabelled skip-link href, not a live product feed.';
          }
        }
      });
      const firstUnlabelledSkipTargetTextBtn = document.getElementById('copy-first-unlabelled-skip-target-text');
      const firstUnlabelledSkipTargetTextStatus = document.getElementById('copy-first-unlabelled-skip-target-text-status');
      const firstUnlabelledSkipTargetTextFallback = document.getElementById('copy-first-unlabelled-skip-target-text-fallback');
      const firstUnlabelledSkipTargetTextMarkdown = () => {
        const skips = document.querySelectorAll('#skips a.skip');
        for (let i = 0; i < skips.length; i += 1) {
          const skip = skips[i];
          const href = skip && skip.getAttribute ? skip.getAttribute('href') : '';
          if (!href || href.charAt(0) !== '#' || href.length < 2) continue;
          const target = document.getElementById(href.slice(1));
          if (!target) continue;
          const labelledBy = target.getAttribute ? target.getAttribute('aria-labelledby') : '';
          if (labelledBy) continue;
          const text = target.textContent ? target.textContent.trim() : '';
          if (!text) return '';
          return '- ' + text;
        }
        return '';
      };
      firstUnlabelledSkipTargetTextBtn?.addEventListener('click', async () => {
        const markdown = firstUnlabelledSkipTargetTextMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (firstUnlabelledSkipTargetTextFallback) firstUnlabelledSkipTargetTextFallback.hidden = true;
          if (firstUnlabelledSkipTargetTextStatus) {
            firstUnlabelledSkipTargetTextStatus.textContent = empty
              ? 'First unlabelled skip-target text was missing. Copied an empty string. This is catalog copy, not a live product feed.'
              : 'Copied the first unlabelled skip-target text from this page as Markdown. Not a live product feed.';
          }
        } catch {
          if (firstUnlabelledSkipTargetTextFallback) {
            firstUnlabelledSkipTargetTextFallback.hidden = false;
            firstUnlabelledSkipTargetTextFallback.value = markdown;
            firstUnlabelledSkipTargetTextFallback.focus();
            firstUnlabelledSkipTargetTextFallback.select();
          }
          if (firstUnlabelledSkipTargetTextStatus) {
            firstUnlabelledSkipTargetTextStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. First unlabelled skip-target text was missing. This is catalog copy, not a live product feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the first unlabelled skip-target text, not a live product feed.';
          }
        }
      });
      const firstReviewBtn = document.getElementById('copy-first-review');
      const firstReviewStatus = document.getElementById('copy-first-review-status');
      const firstReviewFallback = document.getElementById('copy-first-review-fallback');
      const firstReviewMarkdown = () => {
        const path = document.querySelector('#workbenches article.workbench .review-path');
        const text = path?.textContent.trim() ?? '';
        if (!text) return '';
        return '- ' + text;
      };
      firstReviewBtn?.addEventListener('click', async () => {
        const markdown = firstReviewMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (firstReviewFallback) firstReviewFallback.hidden = true;
          if (firstReviewStatus) {
            firstReviewStatus.textContent = empty
              ? 'First review path was missing. Copied an empty string. This is catalog copy, not a live product feed.'
              : 'Copied the first review path from this page as Markdown. Not a live product feed.';
          }
        } catch {
          if (firstReviewFallback) {
            firstReviewFallback.hidden = false;
            firstReviewFallback.value = markdown;
            firstReviewFallback.focus();
            firstReviewFallback.select();
          }
          if (firstReviewStatus) {
            firstReviewStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. First review path was missing. This is catalog copy, not a live product feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the first review path, not a live product feed.';
          }
        }
      });
      const lastReviewBtn = document.getElementById('copy-last-review');
      const lastReviewStatus = document.getElementById('copy-last-review-status');
      const lastReviewFallback = document.getElementById('copy-last-review-fallback');
      const lastReviewMarkdown = () => {
        const paths = document.querySelectorAll('#workbenches article.workbench .review-path');
        const path = paths[paths.length - 1];
        const text = path?.textContent.trim() ?? '';
        if (!text) return '';
        return '- ' + text;
      };
      lastReviewBtn?.addEventListener('click', async () => {
        const markdown = lastReviewMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (lastReviewFallback) lastReviewFallback.hidden = true;
          if (lastReviewStatus) {
            lastReviewStatus.textContent = empty
              ? 'Last review path was missing. Copied an empty string. This is catalog copy, not a live product feed.'
              : 'Copied the last review path from this page as Markdown. Not a live product feed.';
          }
        } catch {
          if (lastReviewFallback) {
            lastReviewFallback.hidden = false;
            lastReviewFallback.value = markdown;
            lastReviewFallback.focus();
            lastReviewFallback.select();
          }
          if (lastReviewStatus) {
            lastReviewStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. Last review path was missing. This is catalog copy, not a live product feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the last review path, not a live product feed.';
          }
        }
      });
      const lastWhatsNewBtn = document.getElementById('copy-last-whats-new');
      const lastWhatsNewStatus = document.getElementById('copy-last-whats-new-status');
      const lastWhatsNewFallback = document.getElementById('copy-last-whats-new-fallback');
      const lastWhatsNewMarkdown = () => {
        const headings = document.querySelectorAll('#whats-new h3');
        const heading = headings[headings.length - 1];
        const text = heading?.textContent.trim() ?? '';
        if (!text) return '';
        return '- ' + text;
      };
      lastWhatsNewBtn?.addEventListener('click', async () => {
        const markdown = lastWhatsNewMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (lastWhatsNewFallback) lastWhatsNewFallback.hidden = true;
          if (lastWhatsNewStatus) {
            lastWhatsNewStatus.textContent = empty
              ? "Last What's new heading was missing. Copied an empty string. This is catalog copy, not a live product feed."
              : "Copied the last What's new heading from this page as Markdown. Not a live product feed.";
          }
        } catch {
          if (lastWhatsNewFallback) {
            lastWhatsNewFallback.hidden = false;
            lastWhatsNewFallback.value = markdown;
            lastWhatsNewFallback.focus();
            lastWhatsNewFallback.select();
          }
          if (lastWhatsNewStatus) {
            lastWhatsNewStatus.textContent = empty
              ? "Clipboard unavailable. Copy the empty string from the text box. Last What's new heading was missing. This is catalog copy, not a live product feed."
              : "Clipboard unavailable. Copy the Markdown from the text box. This is the last What's new heading, not a live product feed.";
          }
        }
      });
      const trustBtn = document.getElementById('copy-trust');
      const trustStatus = document.getElementById('copy-trust-status');
      const trustFallback = document.getElementById('copy-trust-fallback');
      const trustMarkdown = () => {
        const section = document.getElementById('trust');
        const heading = section?.querySelector('h2')?.textContent.trim() ?? '';
        const items = [...(section?.querySelectorAll('ul li') ?? [])].map((item) => '- ' + item.textContent.trim()).filter((line) => line !== '- ');
        return ['## ' + heading, ...items].join('\\n');
      };
      trustBtn?.addEventListener('click', async () => {
        const markdown = trustMarkdown();
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (trustFallback) trustFallback.hidden = true;
          if (trustStatus) trustStatus.textContent = 'Copied Trust and limits from this catalog page as Markdown. Not a live policy feed.';
        } catch {
          if (trustFallback) {
            trustFallback.hidden = false;
            trustFallback.value = markdown;
            trustFallback.focus();
            trustFallback.select();
          }
          if (trustStatus) trustStatus.textContent = 'Clipboard unavailable. Copy the Markdown from the text box. This is the catalog Trust and limits list, not a live policy feed.';
        }
      });
      const firstTrustBtn = document.getElementById('copy-first-trust');
      const firstTrustStatus = document.getElementById('copy-first-trust-status');
      const firstTrustFallback = document.getElementById('copy-first-trust-fallback');
      const firstTrustMarkdown = () => {
        const item = document.querySelector('#trust li');
        const text = item?.textContent.trim() ?? '';
        if (!text) return '';
        return '- ' + text;
      };
      firstTrustBtn?.addEventListener('click', async () => {
        const markdown = firstTrustMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (firstTrustFallback) firstTrustFallback.hidden = true;
          if (firstTrustStatus) {
            firstTrustStatus.textContent = empty
              ? 'First Trust and limits list item was missing. Copied an empty string. This is catalog copy, not a live policy feed.'
              : 'Copied the first Trust and limits list item from this page as Markdown. Not a live policy feed.';
          }
        } catch {
          if (firstTrustFallback) {
            firstTrustFallback.hidden = false;
            firstTrustFallback.value = markdown;
            firstTrustFallback.focus();
            firstTrustFallback.select();
          }
          if (firstTrustStatus) {
            firstTrustStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. First Trust and limits list item was missing. This is catalog copy, not a live policy feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the first Trust and limits item, not a live policy feed.';
          }
        }
      });
      const howBtn = document.getElementById('copy-how');
      const howStatus = document.getElementById('copy-how-status');
      const howFallback = document.getElementById('copy-how-fallback');
      const howMarkdown = () => {
        const section = document.getElementById('how-it-works');
        const heading = section?.querySelector('h2')?.textContent.trim() ?? '';
        const items = [...(section?.querySelectorAll('ul li') ?? [])].map((item) => '- ' + item.textContent.trim()).filter((line) => line !== '- ');
        return ['## ' + heading, ...items].join('\\n');
      };
      howBtn?.addEventListener('click', async () => {
        const markdown = howMarkdown();
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (howFallback) howFallback.hidden = true;
          if (howStatus) howStatus.textContent = 'Copied How it works from this catalog page as Markdown. Not a live policy feed.';
        } catch {
          if (howFallback) {
            howFallback.hidden = false;
            howFallback.value = markdown;
            howFallback.focus();
            howFallback.select();
          }
          if (howStatus) howStatus.textContent = 'Clipboard unavailable. Copy the Markdown from the text box. This is the catalog How it works list, not a live policy feed.';
        }
      });
      const firstHowBtn = document.getElementById('copy-first-how');
      const firstHowStatus = document.getElementById('copy-first-how-status');
      const firstHowFallback = document.getElementById('copy-first-how-fallback');
      const firstHowMarkdown = () => {
        const item = document.querySelector('#how-it-works li');
        const text = item?.textContent.trim() ?? '';
        if (!text) return '';
        return '- ' + text;
      };
      firstHowBtn?.addEventListener('click', async () => {
        const markdown = firstHowMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (firstHowFallback) firstHowFallback.hidden = true;
          if (firstHowStatus) {
            firstHowStatus.textContent = empty
              ? 'First How it works list item was missing. Copied an empty string. This is catalog copy, not a live policy feed.'
              : 'Copied the first How it works list item from this page as Markdown. Not a live policy feed.';
          }
        } catch {
          if (firstHowFallback) {
            firstHowFallback.hidden = false;
            firstHowFallback.value = markdown;
            firstHowFallback.focus();
            firstHowFallback.select();
          }
          if (firstHowStatus) {
            firstHowStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. First How it works list item was missing. This is catalog copy, not a live policy feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the first How it works item, not a live policy feed.';
          }
        }
      });
      const lastHowBtn = document.getElementById('copy-last-how');
      const lastHowStatus = document.getElementById('copy-last-how-status');
      const lastHowFallback = document.getElementById('copy-last-how-fallback');
      const lastHowMarkdown = () => {
        const items = document.querySelectorAll('#how-it-works li');
        const item = items[items.length - 1];
        const text = item?.textContent.trim() ?? '';
        if (!text) return '';
        return '- ' + text;
      };
      lastHowBtn?.addEventListener('click', async () => {
        const markdown = lastHowMarkdown();
        const empty = markdown === '';
        try {
          if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (lastHowFallback) lastHowFallback.hidden = true;
          if (lastHowStatus) {
            lastHowStatus.textContent = empty
              ? 'Last How it works list item was missing. Copied an empty string. This is catalog copy, not a live policy feed.'
              : 'Copied the last How it works list item from this page as Markdown. Not a live policy feed.';
          }
        } catch {
          if (lastHowFallback) {
            lastHowFallback.hidden = false;
            lastHowFallback.value = markdown;
            lastHowFallback.focus();
            lastHowFallback.select();
          }
          if (lastHowStatus) {
            lastHowStatus.textContent = empty
              ? 'Clipboard unavailable. Copy the empty string from the text box. Last How it works list item was missing. This is catalog copy, not a live policy feed.'
              : 'Clipboard unavailable. Copy the Markdown from the text box. This is the last How it works item, not a live policy feed.';
          }
        }
      });
    })();
  </script>
</body>
</html>`;
}

// Serve only the launch page and generated self-contained applications.
// Source, hidden files, local drafts and repository metadata stay outside this surface.
export function createLauncher() {
  return createServer(async (request, response) => {
    const headers = {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Content-Security-Policy': CONTENT_SECURITY_POLICY,
    };
    const finish = (status, body, extra = {}) => {
      response.writeHead(status, { ...headers, ...extra });
      response.end(request.method === 'HEAD' ? undefined : body);
    };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      finish(405, 'Method not allowed', { Allow: 'GET, HEAD' });
      return;
    }
    // Reject DNS-rebinding hostnames. Loopback binding alone does not check Host.
    if (!/^(127\.0\.0\.1|localhost)(?::[0-9]+)?$/.test(request.headers.host ?? '')) {
      finish(403, 'Host not allowed');
      return;
    }
    const pathname = (request.url ?? '').split('?')[0];
    const relative = publicFile(pathname);
    if (!relative) {
      finish(404, notFoundPage());
      return;
    }
    try {
      const content = await readFile(new URL(relative, root));
      finish(200, content);
    } catch {
      finish(404, notFoundPage());
    }
  });
}

export function parsePort(raw = '4170') {
  if (!/^[0-9]+$/.test(raw) || Number(raw) < 1 || Number(raw) > 65535) {
    throw new Error('PORT must be an integer from 1 through 65535.');
  }
  return Number(raw);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const port = parsePort(process.env.PORT);
    const server = createLauncher();
    server.on('error', () => {
      console.error('Could not start Decision Labs. Choose a free PORT and try again.');
      process.exitCode = 1;
    });
    server.listen(port, '127.0.0.1', () => {
      console.log(`Decision Labs: http://127.0.0.1:${port}`);
      console.log('Open this address in your browser. Press Ctrl+C to stop.');
    });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
