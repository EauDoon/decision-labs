import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, extname, isAbsolute, join, normalize, relative, sep } from "node:path";

const root = normalize(join(dirname(fileURLToPath(import.meta.url)), ".."));
const port = Number.parseInt(process.env.PORT ?? "4173", 10);
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

createServer((request, response) => {
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
  const file = normalize(join(root, requestedPath));
  const fromRoot = relative(root, file);
  if (fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot) || !statSafe(file)) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "cache-control": "no-store",
    "content-type": types[extname(file)] ?? "application/octet-stream"
  });
  createReadStream(file).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Common Cart is running at http://127.0.0.1:${port}`);
});

function statSafe(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}
