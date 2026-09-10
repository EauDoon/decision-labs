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

export function notFoundPage() {
  const versions = catalogVersionLine();
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
    .copy-versions, .copy-trust {
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
    .copy-versions-status, .copy-trust-status { display: inline-block; margin-left: 12px; font-size: 15px; color: #1e3a42; }
    .copy-versions-fallback, .copy-trust-fallback {
      display: block;
      width: 100%;
      margin-top: 10px;
      min-height: 6rem;
      padding: 10px 12px;
      font: 15px/1.5 ui-monospace, monospace;
      border: 1px solid #c3d0d3;
      border-radius: 4px;
    }
    .copy-versions-fallback[hidden], .copy-trust-fallback[hidden] { display: none; }
    .trust { margin: 28px 0 8px; padding-top: 8px; }
    .trust ul { margin: 12px 0 0; padding-left: 1.2rem; color: #1e3a42; }
    .trust li { margin: 8px 0; }
    .copy-trust-tools { margin: 16px 0 0; }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">Decision Labs</p>
    <h1>This path is not in the catalog</h1>
    <p>The local launcher serves only the Decision Labs catalog page and the four workbenches. It does not serve source, notes, or drafts.</p>
    <p class="version-line">Current catalog: ${versions}.</p>
    <p class="copy-versions-tools">
      <button type="button" class="copy-versions" id="copy-versions">Copy versions</button>
      <span class="copy-versions-status" id="copy-versions-status" role="status"></span>
    </p>
    <textarea id="copy-versions-fallback" class="copy-versions-fallback" hidden readonly rows="4" aria-label="Workbench versions as Markdown"></textarea>
    <section class="trust" id="trust">
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
    <p><a href="/">Open the Decision Labs catalog for Partnership Breakpoint, Common Cart, The Smallest Agreement, and Weekend Gap</a></p>
  </main>
  <script>
    (function () {
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
