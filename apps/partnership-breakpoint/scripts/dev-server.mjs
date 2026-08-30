import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, isAbsolute, join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
export const DEFAULT_PORT = 4173;
export const LISTEN_HOST = '127.0.0.1';
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
};

/**
 * Loopback bind options. PORT must be a base-10 integer from 1 through 65535.
 * HOST is ignored; the listener is always 127.0.0.1.
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {{host: string, port: number}}
 */
export function resolveListenOptions(env = process.env) {
  const raw = env.PORT;
  if (raw === undefined || raw === '') return { host: LISTEN_HOST, port: DEFAULT_PORT };
  const text = String(raw);
  const port = Number(text);
  if (!/^[0-9]+$/.test(text) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be an integer from 1 through 65535. Received ${JSON.stringify(text)}.`);
  }
  return { host: LISTEN_HOST, port };
}

export function createWorkbenchServer(serveRoot = root) {
  return createServer((request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { allow: 'GET, HEAD', 'content-type': 'text/plain; charset=utf-8' });
      response.end('Method not allowed');
      return;
    }
    let requestPath;
    try {
      requestPath = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    } catch {
      response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Bad request');
      return;
    }
    if (requestPath.includes('\\')) {
      response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Bad request');
      return;
    }
    const relativePath = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
    const target = normalize(join(serveRoot, relativePath));
    const fromRoot = relative(serveRoot, target);
    if (fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot) || !existsSync(target) || !statSync(target).isFile()) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }
    response.writeHead(200, {
      'content-type': mimeTypes[extname(target)] || 'application/octet-stream',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    });
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    createReadStream(target).pipe(response);
  });
}

export function listenWorkbench(server, options = resolveListenOptions()) {
  return new Promise((resolveListening, reject) => {
    const onError = (error) => {
      server.close();
      reject(error);
    };
    server.once('error', onError);
    server.listen(options.port, options.host, () => {
      server.off('error', onError);
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : options.port;
      resolveListening({ host: options.host, port, url: `http://${options.host}:${port}` });
    });
  });
}

async function main() {
  let options;
  try {
    options = resolveListenOptions();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }
  const server = createWorkbenchServer();
  try {
    const listening = await listenWorkbench(server, options);
    console.log(`Partnership Breakpoint is running at ${listening.url}`);
  } catch (error) {
    const message = error.code === 'EADDRINUSE'
      ? `Port ${options.port} is already in use. Set PORT to a free integer from 1 through 65535.`
      : `Could not start the local server: ${error.message}`;
    console.error(message);
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
