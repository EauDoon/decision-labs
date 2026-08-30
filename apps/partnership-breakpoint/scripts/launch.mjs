import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const minimumNodeMajor = 20;
const currentNodeMajor = Number.parseInt(process.versions.node.split('.')[0], 10);
const root = fileURLToPath(new URL('..', import.meta.url));
const server = fileURLToPath(new URL('./dev-server.mjs', import.meta.url));
const skipBrowserOpen = process.env.PARTNERSHIP_BREAKPOINT_NO_OPEN === '1';

if (!Number.isInteger(currentNodeMajor) || currentNodeMajor < minimumNodeMajor) {
  console.error(`Partnership Breakpoint requires Node.js ${minimumNodeMajor} or newer. Found ${process.versions.node}.`);
  process.exitCode = 1;
} else {
  launch();
}

function launch() {
  const child = spawn(process.execPath, [server], {
    cwd: root,
    env: process.env,
    stdio: ['inherit', 'pipe', 'pipe'],
  });
  let ready = false;
  let stopping = false;
  let stdoutBuffer = '';

  child.stdout.on('data', (chunk) => {
    process.stdout.write(chunk);
    stdoutBuffer += chunk;
    const lines = stdoutBuffer.split(/\r?\n/);
    stdoutBuffer = lines.pop();
    for (const line of lines) handleServerLine(line);
  });
  child.stderr.on('data', (chunk) => process.stderr.write(chunk));
  child.once('error', (error) => {
    console.error(`Could not start the local server: ${error.message}`);
    process.exitCode = 1;
  });
  child.once('exit', (code) => {
    if (!ready && !stopping) console.error('The local server stopped before it began listening.');
    process.exitCode = code ?? (stopping ? 0 : 1);
  });

  process.once('SIGINT', () => stopServer(child, 'SIGINT'));
  process.once('SIGTERM', () => stopServer(child, 'SIGTERM'));

  function handleServerLine(line) {
    if (ready) return;
    const match = line.match(/https?:\/\/127\.0\.0\.1:\d+/);
    if (!match) return;
    ready = true;
    const url = match[0];
    console.log(`GUI ready at ${url}`);
    console.log('Press Ctrl+C to stop the local server.');
    if (skipBrowserOpen) {
      console.log('Browser opening is disabled for this launch.');
      return;
    }
    openBrowser(url);
  }

  function stopServer(serverProcess, signal) {
    if (stopping) return;
    stopping = true;
    console.log('Stopping the local server.');
    serverProcess.kill(signal);
  }
}

function openBrowser(url) {
  const command = process.platform === 'win32' ? 'cmd.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/d', '/s', '/c', `start "" "${url}"`] : [url];
  let opener;
  try {
    opener = spawn(command, args, { detached: true, stdio: 'ignore' });
  } catch (error) {
    console.error(`Could not open a browser. Open ${url} manually. (${error.message})`);
    return;
  }
  opener.once('error', () => console.error(`Could not open a browser. Open ${url} manually.`));
  opener.once('exit', (code) => {
    if (code !== 0) console.error(`Could not open a browser. Open ${url} manually.`);
  });
  opener.unref();
}
