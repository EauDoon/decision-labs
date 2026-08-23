import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const outputPath = new URL("../standalone.html", import.meta.url);
const inputs = {
  html: new URL("../index.html", import.meta.url),
  css: new URL("../styles.css", import.meta.url),
  model: new URL("../src/model.js", import.meta.url),
  app: new URL("../src/app.js", import.meta.url),
};
const stylesheetMarker = '<link rel="stylesheet" href="styles.css">';
const scriptMarker = '<script type="module" src="src/app.js"></script>';
const cspMarker = "    <title>The Smallest Agreement</title>";
const appImport = `import {
  MAX_COMBINATIONS,
  canonicalProposal,
  findSmallestAgreement,
  formatPercent,
  formatDecisionBrief,
  validateProposal,
} from "./model.js";

`;

function lf(value) {
  return value.replace(/\r\n?/gu, "\n");
}

function replaceOnce(value, marker, replacement, label) {
  const first = value.indexOf(marker);
  if (first === -1 || first !== value.lastIndexOf(marker)) {
    throw new Error(`${label} marker is missing or ambiguous.`);
  }
  return value.slice(0, first) + replacement + value.slice(first + marker.length);
}

function requireSafeInline(value, label) {
  if (/<\/script/iu.test(value) || /<\/style/iu.test(value) || /@import\b/iu.test(value) || /\burl\s*\(/iu.test(value)) {
    throw new Error(`${label} contains markup or a stylesheet reference that cannot be inlined safely.`);
  }
}

function inlineModel(value) {
  const inlined = value.replace(/^export\s+(?=(?:const|function|class)\b)/gmu, "");
  if (/^export\s/mu.test(inlined)) throw new Error("Model contains an unsupported export.");
  for (const name of ["MAX_COMBINATIONS", "canonicalProposal", "findSmallestAgreement", "formatPercent", "validateProposal"]) {
    if (!new RegExp(`\\b${name}\\b`, "u").test(inlined)) throw new Error(`Model is missing ${name}.`);
  }
  return inlined;
}

const standaloneCsp = "default-src 'none'; base-uri 'none'; object-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'none'; font-src 'none'; connect-src 'none'; media-src 'none'; worker-src 'none'; frame-src 'none'; form-action 'none'";

export async function standaloneBytes() {
  const [html, css, model, app] = await Promise.all(Object.values(inputs).map(async (path) => lf(await readFile(path, "utf8"))));
  requireSafeInline(css, "Stylesheet");
  requireSafeInline(model, "Model");
  requireSafeInline(app, "Application");
  if (app.indexOf(appImport) === -1 || app.indexOf(appImport) !== app.lastIndexOf(appImport)) {
    throw new Error("Application model import is missing or ambiguous.");
  }

  const combinedScript = `${inlineModel(model)}\n${app.replace(appImport, "")}`;
  const inlineStyle = `\n${css}`;
  const inlineScript = `\n${combinedScript}`;
  let standalone = replaceOnce(html, stylesheetMarker, `<style>${inlineStyle}</style>`, "Stylesheet");
  standalone = replaceOnce(standalone, scriptMarker, `<script type="module">${inlineScript}</script>`, "Application script");
  standalone = replaceOnce(standalone, cspMarker, `    <meta http-equiv="Content-Security-Policy" content="${standaloneCsp}">\n${cspMarker}`, "Content Security Policy");
  standalone = `${lf(standalone).trimEnd()}\n`;

  if (/<link\b/iu.test(standalone) || /<script\b[^>]*\bsrc\s*=/iu.test(standalone) || /\bhttps?:\/\//iu.test(standalone)) {
    throw new Error("Standalone output still contains an external resource reference.");
  }
  return standalone;
}

async function main(args) {
  if (args.length > 1 || (args.length === 1 && args[0] !== "--check")) {
    throw new Error("Usage: node scripts/build-standalone.mjs [--check]");
  }
  const expected = await standaloneBytes();
  if (args[0] === "--check") {
    let actual;
    try {
      actual = await readFile(outputPath, "utf8");
    } catch {
      console.error("standalone.html is missing. Run npm run build:standalone.");
      return 1;
    }
    if (actual !== expected) {
      console.error("standalone.html is stale. Run npm run build:standalone.");
      return 1;
    }
    console.log("standalone.html is current and deterministic.");
    return 0;
  }
  await writeFile(outputPath, expected, "utf8");
  console.log(`Built ${fileURLToPath(outputPath).replace(root, "")}`);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; }).catch((error) => {
    console.error(`Standalone build refused: ${error.message}`);
    process.exitCode = 1;
  });
}
