import { createReadStream, promises as fs } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_PORT = 5173;
const LAST_FALLBACK_PORT = 5183;

// PORT unset or blank keeps the default with fallback through 5183. Any other
// value must be a plain base-10 integer from 0 through 65535 (0 asks the
// operating system for a free port); values like "abc", "5173.0" or "0x1F90"
// are rejected instead of crashing or being silently coerced.
function parsePort(raw) {
  const text = raw === undefined ? "" : String(raw).trim();
  if (text === "") return { port: DEFAULT_PORT, fallback: true };
  if (!/^[0-9]{1,5}$/.test(text) || Number(text) > 65535) {
    return { error: "PORT must be an integer from 0 through 65535." };
  }
  return { port: Number(text), fallback: false };
}

const parsedPort = parsePort(process.env.PORT);
if (parsedPort.error) {
  console.error(parsedPort.error);
  process.exit(1);
}
const root = await fs.realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
const requestedPort = parsedPort.port;
const canSelectFallbackPort = parsedPort.fallback;
let currentPort = requestedPort;
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

function resolvedFile(urlPath) {
  const pathname = decodeURIComponent(urlPath.split("?")[0]);
  if (pathname.split(/[\\/]/).some((segment) => segment.startsWith("."))) return null;
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const candidate = path.resolve(root, `.${safePath}`);
  const relative = path.relative(root, candidate);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return candidate;
}

const server = createServer(async (request, response) => {
  if (!/^(127\.0\.0\.1|localhost)(?::[0-9]+)?$/.test(request.headers.host ?? "")) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Host not allowed");
    return;
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, {
      "Allow": "GET, HEAD",
      "Content-Type": "text/plain; charset=utf-8"
    });
    response.end("Method not allowed");
    return;
  }
  let filePath;
  try {
    filePath = resolvedFile(request.url || "/");
  } catch {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Bad request");
    return;
  }
  if (!filePath) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }
  try {
    const realPath = await fs.realpath(filePath);
    const relative = path.relative(root, realPath);
    if (relative.split(path.sep).some(segment => segment.startsWith(".")) || path.isAbsolute(relative)) {
      response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Forbidden");
      return;
    }
    const info = await fs.stat(realPath);
    if (!info.isFile()) throw new Error("Not a file");
    response.writeHead(200, {
      "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    createReadStream(realPath).on("error", () => response.destroy()).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

function listen(port) {
  server.listen(port, "127.0.0.1", () => {
    const address = server.address();
    const listeningPort = typeof address === "object" && address ? address.port : port;
    console.log(`Weekend Gap is running at http://127.0.0.1:${listeningPort}`);
  });
}

server.on("error", (error) => {
  if (error.code === "EADDRINUSE" && canSelectFallbackPort && currentPort < LAST_FALLBACK_PORT) {
    currentPort += 1;
    console.warn(`Port ${currentPort - 1} is busy. Trying http://127.0.0.1:${currentPort}`);
    listen(currentPort);
    return;
  }
  if (error.code === "EADDRINUSE") {
    console.error(canSelectFallbackPort
      ? `Ports ${DEFAULT_PORT} through ${LAST_FALLBACK_PORT} are all in use. Set PORT to a free integer from 0 through 65535.`
      : `Port ${currentPort} is already in use. Set PORT to a free integer from 0 through 65535, or unset PORT to try ${DEFAULT_PORT} through ${LAST_FALLBACK_PORT}.`);
  } else {
    console.error(`Could not start the local server: ${error.message}`);
  }
  process.exitCode = 1;
});

listen(requestedPort);
