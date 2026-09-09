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
    a:focus-visible { outline: 3px solid #8a3800; outline-offset: 4px; }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">Decision Labs</p>
    <h1>This path is not in the catalog</h1>
    <p>The local launcher serves only the Decision Labs catalog page and the four workbenches. It does not serve source, notes, or drafts.</p>
    <p class="version-line">Current catalog: ${versions}.</p>
    <p><a href="/">Open the Decision Labs catalog for Partnership Breakpoint, Common Cart, The Smallest Agreement, and Weekend Gap</a></p>
  </main>
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
