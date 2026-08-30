import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, extname, isAbsolute, join, normalize, relative, sep } from "node:path";
import { DEFAULT_HOST, parsePort } from "./listen-config.mjs";

const root = normalize(join(dirname(fileURLToPath(import.meta.url)), ".."));
const parsedPort = parsePort(process.env.PORT);
if (parsedPort.error) {
  console.error(parsedPort.error);
  process.exit(1);
}
const port = parsedPort.port;
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

export function createCommonCartServer(serveRoot = root) {
  return createServer((request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, {
        "allow": "GET, HEAD",
        "content-type": "text/plain; charset=utf-8"
      });
      response.end("Method not allowed");
      return;
    }
    let requestedPath;
    try {
      const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
      requestedPath = pathname === "/" ? "index.html" : decodeURIComponent(pathname.slice(1));
    } catch {
      response.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
      response.end("Bad request");
      return;
    }
    if (requestedPath.includes("\\")) {
      response.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
      response.end("Bad request");
      return;
    }
    const file = normalize(join(serveRoot, requestedPath));
    const fromRoot = relative(serveRoot, file);
    if (fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    const fileInfo = statSafe(file);
    if (fileInfo === null) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "cache-control": "no-store",
      "content-length": fileInfo.size,
      "content-type": types[extname(file)] ?? "application/octet-stream"
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    createReadStream(file).pipe(response);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createCommonCartServer().listen(port, DEFAULT_HOST, () => {
    console.log(`Common Cart is running at http://${DEFAULT_HOST}:${port}`);
  });
}

function statSafe(path) {
  try {
    const info = statSync(path);
    return info.isFile() ? info : null;
  } catch {
    return null;
  }
}
