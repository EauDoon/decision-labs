import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { BIND_HOST, DEFAULT_PORT, parsePort } from "./listen-config.mjs";

const minimumNodeMajor = 20;
const serverPath = fileURLToPath(new URL("./dev-server.mjs", import.meta.url));
const usage = `Usage: node scripts/launch.mjs [options]

Start the local loopback GUI for The Smallest Agreement.

Options:
  -h, --help             Show this help and exit
  --no-open              Print the local URL without opening a browser
  --exit-after-ready     Stop the server after it begins listening

Environment:
  PORT                   Loopback TCP port from 1 through 65535 (default ${DEFAULT_PORT})

The server listens only on ${BIND_HOST}. HOST is not read. Press Ctrl+C to stop it.

Examples:
  npm run launch
  npm run launch -- --help
  npm run launch -- --no-open
  PORT=4174 npm run launch -- --no-open
`;

function nodeMajorVersion() {
  const major = Number.parseInt(process.versions.node.split(".")[0], 10);
  return Number.isSafeInteger(major) ? major : null;
}

function parseArgs(argv) {
  const flags = { help: false, noOpen: false, exitAfterReady: false };
  const unknown = [];
  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") flags.help = true;
    else if (arg === "--no-open") flags.noOpen = true;
    else if (arg === "--exit-after-ready") flags.exitAfterReady = true;
    else unknown.push(arg);
  }
  return { flags, unknown };
}

function openerCommand(url) {
  if (process.platform === "win32") return { command: "cmd.exe", args: ["/d", "/s", "/c", `start \"\" \"${url}\"`] };
  if (process.platform === "darwin") return { command: "open", args: [url] };
  return { command: "xdg-open", args: [url] };
}

function openBrowser(url) {
  const { command, args } = openerCommand(url);
  return new Promise((resolve) => {
    const opener = spawn(command, args, { stdio: "ignore", detached: true });
    opener.once("error", () => resolve(false));
    opener.once("close", (code) => resolve(code === 0));
    opener.unref();
  });
}

function startServer(port, { noOpen, exitAfterReady }) {
  const server = spawn(process.execPath, [serverPath], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let ready = false;
  let shuttingDown = false;
  let stdoutBuffer = "";

  function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Stopping local server (${signal}).`);
    server.kill("SIGTERM");
  }

  server.stdout.on("data", async (chunk) => {
    process.stdout.write(chunk);
    stdoutBuffer += chunk.toString("utf8");
    const match = stdoutBuffer.match(/The Smallest Agreement is serving at (http:\/\/127\.0\.0\.1:\d+)\r?\n/);
    if (!match || ready) return;
    ready = true;
    const url = match[1];
    console.log(`Local GUI ready: ${url}`);
    if (noOpen) {
      console.log("Browser opening skipped.");
    } else if (!await openBrowser(url)) {
      console.log(`Could not open a browser automatically. Open this URL manually: ${url}`);
    }
    if (exitAfterReady) shutdown("readiness check");
    else console.log("Press Ctrl+C to stop the local server.");
  });
  server.stderr.on("data", (chunk) => process.stderr.write(chunk));

  server.once("error", (error) => {
    console.error(`Could not start the local server: ${error.message}`);
  });
  server.once("exit", (code, signal) => {
    if (!ready && !shuttingDown) console.error("The local server exited before it began listening.");
    process.exitCode = shuttingDown ? 0 : code ?? (signal ? 1 : 0);
  });
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

function main(argv, env) {
  const { flags, unknown } = parseArgs(argv);
  if (flags.help) {
    console.log(usage.trimEnd());
    return 0;
  }
  if (unknown.length > 0) {
    const label = unknown.length === 1 ? "Unknown argument" : "Unknown arguments";
    console.error(`${label}: ${unknown.join(", ")}`);
    console.error(usage.trimEnd());
    return 1;
  }

  const major = nodeMajorVersion();
  if (major === null || major < minimumNodeMajor) {
    console.error(`Node.js ${minimumNodeMajor} or newer is required. Found ${process.version}.`);
    return 1;
  }

  const parsedPort = parsePort(env.PORT);
  if (parsedPort.error) {
    console.error(parsedPort.error);
    return 1;
  }
  startServer(parsedPort.port, flags);
  return 0;
}

process.exitCode = main(process.argv.slice(2), process.env);
