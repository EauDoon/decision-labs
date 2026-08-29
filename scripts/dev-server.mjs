import { createReadStream, promises as fs } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requestedPort = Number(process.env.PORT || 5173);
const canSelectFallbackPort = !process.env.PORT;
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
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const candidate = path.resolve(root, `.${safePath}`);
  const relative = path.relative(root, candidate);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return candidate;
}

const server = createServer(async (request, response) => {
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
    const info = await fs.stat(filePath);
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
    createReadStream(filePath).pipe(response);
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
  if (error.code === "EADDRINUSE" && canSelectFallbackPort && currentPort < 5183) {
    currentPort += 1;
    console.warn(`Port ${currentPort - 1} is busy. Trying http://127.0.0.1:${currentPort}`);
    listen(currentPort);
    return;
  }
  throw error;
});

listen(requestedPort);
