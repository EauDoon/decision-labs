import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const outputPath = fileURLToPath(new URL('../standalone.html', import.meta.url));
const appImport = `import {
  PRESETS,
  ValidationError,
  calculatePartnership,
  clonePreset,
  makeParticipant,
  validateConfiguration,
} from './model.js';

`;
const styleMarker = '<link rel="stylesheet" href="styles.css" />';
const modelLinkMarker = '<a href="MODEL.md">Read the full model</a>';
const scriptMarker = '<script type="module" src="src/app.js"></script>';
const titleMarker = '<title>Partnership Breakpoint</title>';

function normaliseLf(text) {
  return text.replace(/\r\n?/g, '\n');
}

function replaceExactlyOnce(text, marker, replacement, label) {
  const first = text.indexOf(marker);
  if (first === -1 || first !== text.lastIndexOf(marker)) {
    throw new Error(`Standalone build refused: expected exactly one ${label} marker.`);
  }
  return `${text.slice(0, first)}${replacement}${text.slice(first + marker.length)}`;
}

function rejectUnsafeInlineContent(text, closingTag, label) {
  if (text.toLowerCase().includes(closingTag)) {
    throw new Error(`Standalone build refused: ${label} contains ${closingTag}.`);
  }
}

function cspMeta() {
  const policy = [
    "default-src 'none'",
    "base-uri 'none'",
    "connect-src 'none'",
    "form-action 'none'",
    "img-src 'none'",
    "media-src 'none'",
    "object-src 'none'",
    "style-src 'unsafe-inline'",
    "script-src 'unsafe-inline'",
  ].join('; ');
  return `<meta http-equiv="Content-Security-Policy" content="${policy}" />`;
}

export function renderStandalone({ html, css, model, app }) {
  if (!app.startsWith(appImport)) {
    throw new Error('Standalone build refused: app module import marker is missing or changed.');
  }
  rejectUnsafeInlineContent(css, '</style', 'stylesheet');
  rejectUnsafeInlineContent(model, '</script', 'model module');
  rejectUnsafeInlineContent(app, '</script', 'app module');
  if (/\burl\s*\(/i.test(css)) {
    throw new Error('Standalone build refused: stylesheet contains a URL resource.');
  }

  const inlineModel = model.replace(/^export\s+/gm, '');
  const inlineApp = app.slice(appImport.length);
  const inlineStyle = `\n${css}\n`;
  const inlineScript = `\n${inlineModel}\n${inlineApp}`;
  let output = normaliseLf(html);
  output = replaceExactlyOnce(output, titleMarker, `${titleMarker}\n    ${cspMeta()}`, 'title');
  output = replaceExactlyOnce(output, styleMarker, `<style>${inlineStyle}</style>`, 'stylesheet');
  output = replaceExactlyOnce(output, modelLinkMarker, '<span>Single-file local workbench. Export JSON to transfer a case.</span>', 'model link');
  output = replaceExactlyOnce(output, scriptMarker, `<script type="module">${inlineScript}</script>`, 'app script');
  if (/<script\b[^>]*\bsrc\s*=|<link\b[^>]*\bhref\s*=/i.test(output)) {
    throw new Error('Standalone build refused: generated HTML still contains an external script or stylesheet.');
  }
  return `${output.trimEnd()}\n`;
}

export async function buildStandalone() {
  const [html, css, model, app] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../styles.css', import.meta.url), 'utf8'),
    readFile(new URL('../src/model.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/app.js', import.meta.url), 'utf8'),
  ]);
  return renderStandalone({
    html: normaliseLf(html),
    css: normaliseLf(css),
    model: normaliseLf(model),
    app: normaliseLf(app),
  });
}

async function main(args) {
  if (args.length > 1 || (args.length === 1 && args[0] !== '--check')) {
    throw new Error('Usage: npm run build:standalone [-- --check]');
  }
  const output = await buildStandalone();
  if (args[0] === '--check') {
    let existing = null;
    try { existing = await readFile(outputPath, 'utf8'); } catch { /* Report the missing output below. */ }
    if (existing !== output) {
      throw new Error('standalone.html is missing or stale. Run npm run build:standalone.');
    }
    console.log('standalone.html is current.');
    return;
  }
  await writeFile(outputPath, output, 'utf8');
  console.log('Built standalone.html.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
