import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const publicFiles = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) await walk(fullPath);
    else publicFiles.push(fullPath);
  }
}
await walk(root);
const forbidden = [
  { label: 'em dash', expression: /\u2014/ },
  { label: 'private filesystem path', expression: new RegExp('C:' + '\\\\' + 'Users' + '\\\\|/' + 'Users' + '/') },
  { label: 'common private key marker', expression: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
];
const findings = [];
for (const file of publicFiles) {
  const text = await readFile(file, 'utf8');
  for (const rule of forbidden) {
    if (rule.expression.test(text)) findings.push(`${relative(root, file)} contains ${rule.label}.`);
  }
}
if (findings.length) {
  console.error(findings.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Checked ${publicFiles.length} files: no em dashes, private paths, or private key markers found.`);
}
