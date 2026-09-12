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

export function notFoundPage() {
  const versions = catalogVersionLine();
  const jobsList = catalogJobs().map(({ name, job }) => `<li>${escapeHtml(name)}: ${escapeHtml(job)}</li>`).join('\n      ');
  const firstWhatsNew = catalogFirstWhatsNewHeading();
  const lastWhatsNew = catalogLastWhatsNewHeading();
  const firstWorkbench = catalogFirstWorkbenchHeading();
  const firstOpen = catalogFirstOpenHref();
  const skipLinks = catalogSkipLinks();
  const skipNav = skipLinks.map(({ href, text }) => `    <a class="skip" href="${escapeHtml(href)}">${escapeHtml(text)}</a>`).join('\n');
  const newsHeadings = [];
  if (firstWhatsNew) newsHeadings.push(firstWhatsNew);
  if (lastWhatsNew && lastWhatsNew !== firstWhatsNew) newsHeadings.push(lastWhatsNew);
  const newsList = newsHeadings.map((heading) => `<li><h3>${escapeHtml(heading)}</h3></li>`).join('\n        ');
  const openLink = firstOpen ? `\n        <a class="open" href="${escapeHtml(firstOpen)}">Open workbench</a>` : '';
  const firstCard = firstWorkbench
    ? `\n      <article class="workbench">\n        <h3>${escapeHtml(firstWorkbench)}</h3>${openLink}\n      </article>`
    : '';
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
    a { display: inline-flex; align-items: center; min-height: 44px; max-width: 100%; flex-wrap: wrap; color: #0a4439; font-weight: 650; text-underline-offset: 3px; }
    a:hover { text-decoration-thickness: 2px; }
    a:focus-visible, button:focus-visible { outline: 3px solid #8a3800; outline-offset: 4px; }
    .copy-versions, .copy-trust, .copy-how, .copy-jobs, .copy-lede { display: inline-flex; align-items: center; min-height: 44px; padding: 8px 14px; border: 1px solid #0f5a4b; border-radius: 4px; background: #ffffff; color: #0a4439; font: inherit; font-weight: 650; cursor: pointer; }
    .copy-versions-status, .copy-trust-status, .copy-how-status, .copy-jobs-status, .copy-lede-status { display: inline-block; margin-left: 12px; font-size: 15px; color: #1e3a42; }
    .copy-versions-fallback, .copy-trust-fallback, .copy-how-fallback, .copy-jobs-fallback, .copy-lede-fallback { display: block; width: 100%; margin-top: 10px; min-height: 6rem; padding: 10px 12px; font: 15px/1.5 ui-monospace, monospace; border: 1px solid #c3d0d3; border-radius: 4px; }
    .copy-versions-fallback[hidden], .copy-trust-fallback[hidden], .copy-how-fallback[hidden], .copy-jobs-fallback[hidden], .copy-lede-fallback[hidden] { display: none; }
    .trust, .guide { margin: 28px 0 8px; padding-top: 8px; }
    .trust ul, .guide ul { margin: 12px 0 0; padding-left: 1.2rem; color: #1e3a42; }
    .trust li, .guide li { margin: 8px 0; }
    .copy-trust-tools, .copy-how-tools, .copy-jobs-tools, .copy-lede-tools, .copy-versions-tools { margin: 16px 0 0; }
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
    <p><a href="/">Open the Decision Labs catalog for Partnership Breakpoint, Common Cart, The Smallest Agreement, and Weekend Gap</a></p>
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
    <ul id="catalog-jobs">
      ${jobsList}
    </ul>
    <p class="copy-jobs-tools">
      <button type="button" class="copy-jobs" id="copy-jobs">Copy jobs</button>
      <span class="copy-jobs-status" id="copy-jobs-status" role="status"></span>
    </p>
    <textarea id="copy-jobs-fallback" class="copy-jobs-fallback" hidden readonly rows="4" aria-label="Workbench jobs as Markdown"></textarea>
    <section class="whats-new" id="whats-new" aria-labelledby="whats-new-title">
      <h2 id="whats-new-title">What's new</h2>
      <ul class="whats-new-list">
        ${newsList}
      </ul>
    </section>
    <section id="workbenches" aria-labelledby="workbenches-title">
      <h2 id="workbenches-title">The workbenches</h2>${firstCard}
    </section>
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
    <section class="trust" id="trust" aria-labelledby="trust-title">
      <h2 id="trust-title">Trust and limits</h2>
      <ul>
        <li><strong>Local-first.</strong> Pages run in your browser. The optional launcher binds loopback only.</li>
        <li><strong>Deterministic math.</strong> The same valid inputs produce the same outputs.</li>
        <li><strong>Not a decision maker.</strong> Results are evidence for a conversation; people keep judgment and accountability.</li>
      </ul>
    </section>
    <p class="copy-trust-tools">
      <button type="button" class="copy-trust" id="copy-trust">Copy Trust and limits</button>
      <span class="copy-trust-status" id="copy-trust-status" role="status"></span>
    </p>
    <textarea id="copy-trust-fallback" class="copy-trust-fallback" hidden readonly rows="8" aria-label="Trust and limits as Markdown"></textarea>
  </main>
  <script>
    (function () {
      async function copyWithFallback(markdown, statusNode, fallbackNode, doneMessage) {
        try {
          if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('clipboard unavailable');
          await navigator.clipboard.writeText(markdown);
          if (fallbackNode) { fallbackNode.hidden = true; fallbackNode.value = ''; }
          if (statusNode) statusNode.textContent = doneMessage;
        } catch {
          if (fallbackNode) {
            fallbackNode.hidden = false;
            fallbackNode.value = markdown;
            fallbackNode.focus();
            fallbackNode.select();
          }
          if (statusNode) statusNode.textContent = 'Clipboard unavailable. Copy the Markdown from the text box.';
        }
      }
      function wireCopy(id, markdownBuilder, doneMessage) {
        const btn = document.getElementById(id);
        const status = document.getElementById(id + '-status');
        const fallback = document.getElementById(id + '-fallback');
        if (!btn) return;
        btn.addEventListener('click', () => copyWithFallback(markdownBuilder(), status, fallback, doneMessage));
      }
      wireCopy('copy-lede', () => {
        const heading = document.querySelector('h1');
        const lede = document.querySelector('.lede');
        return [heading && heading.textContent.trim(), lede && lede.textContent.trim()].filter(Boolean).join('\\n');
      }, 'Copied the catalog heading and lede as Markdown. Not a live product feed.');
      wireCopy('copy-versions', () => {
        const line = document.querySelector('.version-line')?.textContent ?? '';
        const listed = line.replace(/^\\s*Current catalog:\\s*/i, '').replace(/\\.\\s*$/, '');
        return listed.split(',').map((part) => part.trim()).filter(Boolean).map((part) => '- ' + part).join('\\n');
      }, 'Copied names and versions from this catalog list as Markdown. Not a live product version.');
      wireCopy('copy-jobs', () => [...document.querySelectorAll('#catalog-jobs li')].map((item) => '- ' + item.textContent.trim()).filter((line) => line !== '- ').join('\\n'), 'Copied names and jobs from this catalog list as Markdown. Not a live product feed.');
      wireCopy('copy-how', () => [...document.querySelectorAll('#how-it-works ul li')].map((item) => '- ' + item.textContent.trim()).join('\\n'), 'Copied the printed How it works heading and list as Markdown. Not a live policy feed.');
      wireCopy('copy-trust', () => [...document.querySelectorAll('#trust ul li')].map((item) => '- ' + item.textContent.trim()).join('\\n'), 'Copied the printed Trust and limits heading and list as Markdown. Not a live policy feed.');
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
