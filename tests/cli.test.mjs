import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const launchScript = fileURLToPath(new URL("../scripts/launch.mjs", import.meta.url));
const buildScript = fileURLToPath(new URL("../scripts/build-standalone.mjs", import.meta.url));

function run(script, args, env = {}) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: "utf8",
    timeout: 5000,
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

test("launcher --help documents flags and exits without starting the server", () => {
  for (const flag of ["--help", "-h"]) {
    const result = run(launchScript, [flag, "--no-open"]);
    assert.equal(result.status, 0, flag);
    assert.match(result.stdout, /Usage: node scripts\/launch\.mjs/u);
    assert.match(result.stdout, /--no-open/u);
    assert.match(result.stdout, /--exit-after-ready/u);
    assert.match(result.stdout, /PORT/u);
    assert.doesNotMatch(result.stdout, /serving at/u);
    assert.equal(result.stderr, "");
  }
});

test("launcher rejects unknown arguments with usage on stderr", () => {
  const result = run(launchScript, ["--no-open", "--bogus", "extra"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown arguments: --bogus, extra/u);
  assert.match(result.stderr, /Usage: node scripts\/launch\.mjs/u);
  assert.doesNotMatch(result.stdout + result.stderr, /serving at/u);
});

test("launcher rejects empty and invalid PORT values before listening", () => {
  const cases = [
    ["", /PORT is empty/u],
    ["   ", /PORT is empty/u],
    ["0", /PORT must be an integer from 1 through 65535/u],
    ["65536", /PORT must be an integer from 1 through 65535/u],
    ["4173.5", /PORT must be an integer from 1 through 65535/u],
    ["abc", /PORT must be an integer from 1 through 65535/u],
  ];
  for (const [port, pattern] of cases) {
    const result = run(launchScript, ["--no-open"], { PORT: port });
    assert.equal(result.status, 1, `PORT=${JSON.stringify(port)}`);
    assert.match(result.stderr, pattern, `PORT=${JSON.stringify(port)}`);
    assert.doesNotMatch(result.stdout + result.stderr, /serving at/u);
  }
});

test("standalone builder --help documents --check and unknown args still fail closed", () => {
  const help = run(buildScript, ["--help"]);
  assert.equal(help.status, 0);
  assert.match(help.stdout, /Usage: node scripts\/build-standalone\.mjs/u);
  assert.match(help.stdout, /--check/u);
  assert.doesNotMatch(help.stdout, /standalone\.html is current/u);

  const mixed = run(buildScript, ["--check", "--help"]);
  assert.equal(mixed.status, 0);
  assert.match(mixed.stdout, /Usage: node scripts\/build-standalone\.mjs/u);

  const unknown = run(buildScript, ["--bogus"]);
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /Usage: node scripts\/build-standalone\.mjs/u);
});
