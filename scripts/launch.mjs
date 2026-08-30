import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parsePort } from "./listen-config.mjs";

const minimumNodeMajor = 20;
const nodeMajor = Number.parseInt(process.versions.node.split(".")[0], 10);

if (!Number.isInteger(nodeMajor) || nodeMajor < minimumNodeMajor) {
  console.error(`Common Cart requires Node.js ${minimumNodeMajor} or newer. This is ${process.versions.node}.`);
  process.exit(1);
}

const parsedPort = parsePort(process.env.PORT);
if (parsedPort.error) {
  console.error(parsedPort.error);
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const serverPath = resolve(root, "scripts", "dev-server.mjs");
const skipBrowser = process.argv.includes("--no-open") || process.env.NO_BROWSER === "1";
const server = spawn(process.execPath, [serverPath], {
  cwd: root,
  env: { ...process.env, PORT: String(parsedPort.port) },
  stdio: ["inherit", "pipe", "inherit"],
  windowsHide: false,
});

let outputBuffer = "";
let opened = false;
let stopping = false;

function openBrowser(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" || parsed.hostname !== "127.0.0.1" || !parsed.port) {
    console.error(`The local server reported an unexpected address. Open this manually: ${url}`);
    return;
  }
  if (skipBrowser) {
    console.log(`GUI ready at ${url}. Browser opening was skipped.`);
    return;
  }

  let command;
  let args;
  if (process.platform === "win32") {
    command = "cmd.exe";
    args = ["/d", "/s", "/c", `start "" "${url}"`];
  } else if (process.platform === "darwin") {
    command = "open";
    args = [url];
  } else {
    command = "xdg-open";
    args = [url];
  }

  const opener = spawn(command, args, { stdio: "ignore", windowsHide: true });
  let failureReported = false;
  const reportFailure = () => {
    if (failureReported) return;
    failureReported = true;
    console.error(`The browser could not be opened automatically. Open ${url} manually.`);
  };
  opener.on("error", reportFailure);
  opener.on("exit", (code) => { if (code !== 0) reportFailure(); });
  opener.unref();
}

server.stdout.setEncoding("utf8");
server.stdout.on("data", (chunk) => {
  process.stdout.write(chunk);
  outputBuffer = `${outputBuffer}${chunk}`.slice(-1024);
  if (opened) return;
  const match = outputBuffer.match(/http:\/\/127\.0\.0\.1:\d+/u);
  if (!match) return;
  opened = true;
  openBrowser(match[0]);
});

function stopServer() {
  if (stopping) return;
  stopping = true;
  if (!server.killed) server.kill();
}

process.once("SIGINT", stopServer);
process.once("SIGTERM", stopServer);
process.once("exit", () => {
  if (!server.killed) server.kill();
});

server.on("error", (error) => {
  console.error(`Common Cart could not start: ${error.message}`);
  process.exitCode = 1;
});

server.on("exit", (code, signal) => {
  if (!opened && !stopping) console.error("Common Cart stopped before the GUI was ready.");
  process.exitCode = stopping ? 0 : (code ?? (signal ? 1 : 0));
});
