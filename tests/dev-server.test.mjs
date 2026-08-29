import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import test from "node:test";
import { fileURLToPath } from "node:url";

const serverPath = fileURLToPath(new URL("../scripts/dev-server.mjs", import.meta.url));

test("server reports a reachable port selected by the operating system", async (t) => {
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

  assert.notEqual(new URL(url).port, "0");
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  assert.equal(response.status, 200);
  assert.match(await response.text(), /<title>Weekend Gap \| AUD liquidity simulator<\/title>/);
});
