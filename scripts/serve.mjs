import { createServer } from 'node:http';
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

export function publicFile(pathname) {
  if (!PUBLIC_PATHS.includes(pathname)) return null;
  return pathname === '/' ? 'index.html' : pathname.slice(1);
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
      'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
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
      finish(404, 'Not found');
      return;
    }
    try {
      const content = await readFile(new URL(relative, root));
      finish(200, content);
    } catch {
      finish(404, 'Not found');
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
