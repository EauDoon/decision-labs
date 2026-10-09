import { createServer } from "node:http";
import { readFile, realpath } from "node:fs/promises";
import { extname, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { BIND_HOST, parsePort } from "./listen-config.mjs";

const root = await realpath(resolve(fileURLToPath(new URL("..", import.meta.url))));
const parsedPort = parsePort(process.env.PORT);
if (parsedPort.error) {
  console.error(parsedPort.error);
  process.exit(1);
}
const port = parsedPort.port;
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8" };

function safePath(urlPath) {
  const pathname = decodeURIComponent(urlPath.split("?")[0]);
  if (pathname.split(/[/\\]/).some((segment) => segment.startsWith("."))) return null;
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^[/\\]+/, "");
  const target = resolve(root, normalize(relative));
  return target === root || target.startsWith(`${root}${sep}`) ? target : null;
}

const server = createServer(async (request, response) => {
  if (!/^(127\.0\.0\.1|localhost)(?::[0-9]+)?$/.test(request.headers.host ?? "")) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Host not allowed");
    return;
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Method not allowed");
    return;
  }
  try {
    const target = safePath(request.url || "/");
    if (!target) throw new Error("not found");
    const resolved = await realpath(target);
    if (!resolved.startsWith(`${root}${sep}`) || resolved.slice(root.length + 1).split(sep).some(segment => segment.startsWith("."))) throw new Error("not found");
    const content = await readFile(resolved);
    response.writeHead(200, { "Content-Type": types[extname(target)] || "application/octet-stream", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

// Without this listener a busy port surfaces as an uncaught error, or on some
// platforms as a silent exit 0, so report it and exit 1.
server.on("error", (error) => {
  console.error(error.code === "EADDRINUSE"
    ? `Port ${port} is already in use. Set PORT to a free integer from 1 through 65535.`
    : `Could not start the local server: ${error.message}`);
  process.exitCode = 1;
});

server.listen(port, BIND_HOST, () => {
  console.log(`The Smallest Agreement is serving at http://${BIND_HOST}:${port}`);
});
