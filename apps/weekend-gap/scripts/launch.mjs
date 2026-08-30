import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const minimumNodeMajor = 20;
const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const serverPath = path.join(projectRoot, "scripts", "dev-server.mjs");

export function isSupportedNodeVersion(version) {
  const major = Number.parseInt(String(version).split(".")[0], 10);
  return Number.isInteger(major) && major >= minimumNodeMajor;
}

export function urlFromServerOutput(text) {
  const match = /Weekend Gap is running at (http:\/\/127\.0\.0\.1:\d+)/.exec(text);
  return match ? match[1] : null;
}

export function parseLaunchOptions(args) {
  if (args.length === 0) return { noOpen: false };
  if (args.length === 1 && args[0] === "--no-open") return { noOpen: true };
  return null;
}

function printNodeRequirement() {
  console.error(`Weekend Gap needs Node.js ${minimumNodeMajor} or newer. Found ${process.versions.node}.`);
  console.error("Install a supported Node.js version, then run the launcher again.");
}

function openBrowser(url) {
  const command = process.platform === "win32"
    ? { file: "cmd", args: ["/c", "start", "", url] }
    : process.platform === "darwin"
      ? { file: "open", args: [url] }
      : { file: "xdg-open", args: [url] };

  return new Promise((resolve) => {
    let settled = false;
    const finish = (opened) => {
      if (settled) return;
      settled = true;
      resolve(opened);
    };
    let opener;
    try {
      opener = spawn(command.file, command.args, { stdio: "ignore", detached: process.platform !== "win32" });
    } catch {
      finish(false);
      return;
    }
    opener.once("error", () => finish(false));
    opener.once("exit", (code) => finish(code === 0));
    opener.unref();
  });
}

export async function main(args = process.argv.slice(2)) {
  const options = parseLaunchOptions(args);
  if (!options) {
    console.error("Usage: npm run launch [-- --no-open]");
    return 1;
  }
  if (!isSupportedNodeVersion(process.versions.node)) {
    printNodeRequirement();
    return 1;
  }

  const server = spawn(process.execPath, [serverPath], {
    cwd: projectRoot,
    env: process.env,
    stdio: ["inherit", "pipe", "pipe"],
  });
  let outputBuffer = "";
  let listening = false;
  let stopping = false;

  const forward = (stream, destination) => {
    stream.on("data", (chunk) => {
      destination.write(chunk);
      if (stream !== server.stdout || listening) return;
      outputBuffer += chunk.toString();
      const url = urlFromServerOutput(outputBuffer);
      if (!url) return;
      listening = true;
      if (options.noOpen) {
        console.log(`Browser opening skipped. Open ${url}`);
        return;
      }
      void openBrowser(url).then((opened) => {
        if (!opened) console.error(`Could not open a browser. Open ${url}`);
      });
    });
  };
  forward(server.stdout, process.stdout);
  forward(server.stderr, process.stderr);

  const stop = (signal) => {
    stopping = true;
    if (server.exitCode === null && !server.killed) server.kill(signal);
  };
  process.once("SIGINT", () => stop("SIGINT"));
  process.once("SIGTERM", () => stop("SIGTERM"));

  return await new Promise((resolve) => {
    server.once("error", (error) => {
      console.error(`Could not start Weekend Gap: ${error.message}`);
      resolve(1);
    });
    server.once("exit", (code, signal) => {
      if (!stopping && !listening) console.error("Weekend Gap stopped before its local server was ready.");
      if (!stopping && signal) console.error(`Weekend Gap stopped with ${signal}.`);
      resolve(stopping ? 0 : code ?? 1);
    });
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().then((exitCode) => {
    if (exitCode !== 0) process.exitCode = exitCode;
  }).catch((error) => {
    console.error(`Weekend Gap launcher failed: ${error.message}`);
    process.exitCode = 1;
  });
}
