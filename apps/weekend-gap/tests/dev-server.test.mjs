import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdir, rm, symlink, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const serverPath = fileURLToPath(new URL("../scripts/dev-server.mjs", import.meta.url));

async function startServer(t) {
  const child = spawn(process.execPath, [serverPath], {
    env: { ...process.env, PORT: "0" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  t.after(async () => {
    if (child.exitCode !== null || child.signalCode !== null) return;
    const exited = once(child, "exit");
    if (child.kill()) await exited;
  });

  const url = await new Promise((resolve, reject) => {
    let output = "";
    const fail = (error) => {
      clearTimeout(timeout);
      reject(error);
    };
    const timeout = setTimeout(() => fail(new Error("Server did not report its listening URL.")), 5000);
    child.stdout.on("data", (chunk) => {
      output += chunk;
      const match = /Weekend Gap is running at (http:\/\/127\.0\.0\.1:\d+)/.exec(output);
      if (!match) return;
      clearTimeout(timeout);
      resolve(match[1]);
    });
    child.once("error", fail);
    child.once("exit", (code) => fail(new Error(`Server exited before listening (${code}).`)));
  });
  return url;
}

test("server reports a reachable port selected by the operating system", async (t) => {
  const url = await startServer(t);
  assert.notEqual(new URL(url).port, "0");
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  assert.equal(response.status, 200);
  assert.match(await response.text(), /<title>Weekend Gap \| AUD liquidity simulator<\/title>/);
});

test("server blocks hidden repository metadata", async (t) => {
  const url = await startServer(t);
  const response = await fetch(`${url}/.git/HEAD`, { signal: AbortSignal.timeout(5000) });
  assert.equal(response.status, 403);
  assert.doesNotMatch(await response.text(), /refs\/heads/);
});

test("server blocks symlinked directories that escape the project root", async (t) => {
  const id = randomUUID();
  const linkName = `weekend-gap-outside-${id}`;
  const linkPath = fileURLToPath(new URL(`../${linkName}`, import.meta.url));
  const outsidePath = path.join(tmpdir(), `weekend-gap-outside-${id}`);
  t.after(async () => {
    try {
      await unlink(linkPath);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    await rm(outsidePath, { recursive: true, force: true });
  });
  await mkdir(outsidePath);
  await writeFile(path.join(outsidePath, "secret.txt"), "outside project root", "utf8");
  await symlink(outsidePath, linkPath, process.platform === "win32" ? "junction" : "dir");

  const url = await startServer(t);
  const escaped = await fetch(`${url}/${linkName}`, { signal: AbortSignal.timeout(5000) });
  assert.equal(escaped.status, 403);
  assert.doesNotMatch(await escaped.text(), /outside project root/);
});
