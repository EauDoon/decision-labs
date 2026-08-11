import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const minimumNodeMajor = 20;
const requestedPort = process.env.PORT ?? "4173";
const serverPath = fileURLToPath(new URL("./dev-server.mjs", import.meta.url));
const noOpen = process.argv.includes("--no-open");
const exitAfterReady = process.argv.includes("--exit-after-ready");

function nodeMajorVersion() {
  const major = Number.parseInt(process.versions.node.split(".")[0], 10);
  return Number.isSafeInteger(major) ? major : null;
}

function portValue(value) {
  if (!/^(?:[1-9][0-9]{0,4})$/.test(value)) return null;
  const port = Number(value);
  return port <= 65535 ? port : null;
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

const major = nodeMajorVersion();
if (major === null || major < minimumNodeMajor) {
  console.error(`Node.js ${minimumNodeMajor} or newer is required. Found ${process.version}.`);
  process.exitCode = 1;
} else {
  const port = portValue(requestedPort);
  if (port === null) {
    console.error("PORT must be an integer from 1 through 65535.");
    process.exitCode = 1;
  } else {
    const server = spawn(process.execPath, [serverPath], {
      cwd: fileURLToPath(new URL("..", import.meta.url)),
      env: { ...process.env, PORT: String(port) },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let ready = false;
    let shuttingDown = false;
    let stdoutBuffer = "";

    function forward(stream, target) {
      stream.on("data", (chunk) => target.write(chunk));
    }

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
    forward(server.stderr, process.stderr);

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
}
