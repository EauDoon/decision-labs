import { constants } from 'node:fs';
import { open } from 'node:fs/promises';
import {
  findSmallestAgreement, proposalFromWorkshopDocument, evaluatePackage, stressPackage,
  compareScenarioInputs, createAgreementReviewPacket, replayAgreementReviewPacket,
  AGREEMENT_REVIEW_TOOLS, MAX_CHANGE_COST, MAX_CLAUSES, previewLockedOption,
  formatDecisionBrief, formatEvidenceCsv, formatSupportMatrixCsv,
  formatParticipantGroupsCsv, formatClauseOptionsCsv, formatDiscussionWorksheetCsv,
} from '../src/model.js';

process.stdout.on('error', () => {
  process.stderr.write(JSON.stringify({ status: 'error', error: 'Cannot write output stream.' }) + '\n');
  process.exitCode = 2;
});

const usage = `Usage: node scripts/analyze.mjs <command> <input.json|-> [arguments]
  solve
  evaluate <option IDs separated by commas, in clause order>
  stress <option IDs> <support drops separated by commas>
  compare <second workshop.json>
  review <tool: ${AGREEMENT_REVIEW_TOOLS.map(tool => tool.id).join(', ')}>
  replay (input is a review packet)
  batch (input is JSONL, one proposal or workspace per nonblank line)
  sweep <threshold|maxChangeCost> <numeric levels separated by commas>
  lock <clause ID> <option ID>
  export <brief|evidence|support|groups|options|worksheet>`;

function localPath(path) {
  if (!path || /^[\\/]{2}/.test(path) || path.split(/[\\/]/).some(part => /^(con|conin\$|conout\$|prn|aux|nul|com[0-9¹²³]|lpt[0-9¹²³])$/i.test(part.split('.')[0].trimEnd())) || /:/.test(path.replace(/^[A-Za-z]:[\\/]/, ''))) {
    throw new TypeError('Use an ordinary local file path, not a device, stream, or network path.');
  }
  return path;
}

async function readText(path, limit = 262144) {
  const chunks = [];
  let bytes = 0;
  let file;
  try {
    let stream = process.stdin;
    if (path !== '-') {
      file = await open(localPath(path), constants.O_RDONLY | constants.O_NONBLOCK);
      if (!(await file.stat()).isFile()) throw new TypeError('Input must be a regular file.');
      stream = file.createReadStream({ autoClose: false });
    }
    for await (const chunk of stream) {
      bytes += chunk.length;
      if (bytes > limit) throw new TypeError(`Input exceeds ${limit / 1024} KiB.`);
      chunks.push(chunk);
    }
  } catch (error) {
    if (error instanceof TypeError) throw error;
    throw new TypeError('Cannot read input file or stream.');
  } finally { await file?.close(); }
  try { return new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)); }
  catch { throw new TypeError('Input must be UTF-8.'); }
}

function parseJson(text) {
  let value;
  try { value = JSON.parse(text); }
  catch { throw new TypeError('Input must contain valid JSON.'); }
  // Grammar is already valid; inspect member names before last-wins values reach the model.
  const scopes = [];
  let lastString;
  for (const [token] of text.matchAll(/"(?:\\.|[^"\\])*"|\{|\}|\[|\]|:/g)) {
    if (token === '{') scopes.push(new Set());
    else if (token === '[') scopes.push(null);
    else if (token === '}' || token === ']') scopes.pop();
    else if (token === ':') {
      const members = scopes.at(-1);
      const key = JSON.parse(lastString);
      if (members.has(key)) throw new TypeError('Input contains a duplicate JSON member.');
      members.add(key);
    } else lastString = token;
  }
  return value;
}

function checked(value) {
  if (value.status === 'invalid') throw new TypeError(value.errors.map(error => error.message ?? error).join(' '));
  return value;
}

function proposalFrom(raw) { return checked(proposalFromWorkshopDocument(raw)).proposal; }
function solve(proposal) { return findSmallestAgreement(proposal, { alternativesLimit: 5 }); }

function levels(text, maximum) {
  const parts = text.split(',');
  if (parts.length > 20 || parts.some(part => !part.trim() || !Number.isFinite(Number(part)) || Number(part) < 0 || Number(part) > maximum)) {
    throw new TypeError(`Supply 1 to 20 numeric levels from 0 to ${maximum}.`);
  }
  return parts.map(Number);
}

function batch(text) {
  const lines = text.split(/\r?\n/).map((text, index) => ({ text, line: index + 1 })).filter(row => row.text.trim());
  if (lines.length < 1 || lines.length > 20) throw new TypeError('Batch requires 1 to 20 nonblank JSONL records.');
  return lines.map(({ text, line }) => {
    try {
      if (Buffer.byteLength(text) > 262144) throw new TypeError('Record exceeds 256 KiB.');
      const proposal = proposalFrom(parseJson(text));
      return { line, status: 'ok', result: findSmallestAgreement(proposal, { alternativesLimit: 5, maxCombinations: 2500 }) };
    } catch (error) {
      process.exitCode = 1;
      return { line, status: 'error', error: error.message };
    }
  });
}

try {
  const [command, path, ...args] = process.argv.slice(2);
  if (command === '--help' && path === undefined) {
    process.stdout.write(usage + '\n');
  } else {
    const arity = { solve: 0, evaluate: 1, stress: 2, compare: 1, review: 1, replay: 0, batch: 0, sweep: 2, lock: 2, export: 1 };
    if (!Object.hasOwn(arity, command) || !path || args.length !== arity[command]) throw new TypeError(usage);
    if (command === 'compare' && path === '-' && args[0] === '-') throw new TypeError('Only one comparison input may use stdin.');
    const inputText = await readText(path, ['replay', 'batch'].includes(command) ? 1048576 : 262144);
    const raw = command === 'batch' ? null : parseJson(inputText);
    const proposal = ['replay', 'batch'].includes(command) ? null : proposalFrom(raw);
    let output;
    switch (command) {
      case 'solve': output = solve(proposal); break;
      case 'evaluate': output = checked(evaluatePackage(proposal, args[0].split(','))); break;
      case 'review': output = createAgreementReviewPacket(proposal, args[0]); break;
      case 'replay': output = replayAgreementReviewPacket(raw); break;
      case 'batch': output = batch(inputText); break;
      case 'lock': output = checked(previewLockedOption(proposal, args[0], args[1], { alternativesLimit: 5 })); break;
      case 'export': {
        const formats = {
          brief: p => formatDecisionBrief(p, solve(p)),
          evidence: p => formatEvidenceCsv(p, solve(p)),
          support: formatSupportMatrixCsv, groups: formatParticipantGroupsCsv,
          options: p => checked(formatClauseOptionsCsv(p)).csv,
          worksheet: p => checked(formatDiscussionWorksheetCsv(p)).csv,
        };
        if (!Object.hasOwn(formats, args[0])) throw new TypeError('Unknown export format. ' + usage);
        output = formats[args[0]](proposal);
        break;
      }
      case 'sweep': {
        const field = args[0];
        if (field !== 'threshold' && field !== 'maxChangeCost') throw new TypeError('Sweep field must be threshold or maxChangeCost.');
        const values = levels(args[1], field === 'threshold' ? 100 : MAX_CHANGE_COST * MAX_CLAUSES);
        const maxCombinations = Math.floor(50000 / values.length);
        output = { field, maxCombinationsPerRow: maxCombinations, rows: values.map(value => ({
          value, result: checked(findSmallestAgreement({ ...proposal, [field]: value }, { alternativesLimit: 5, maxCombinations })),
        })) };
        break;
      }
      case 'stress': output = {
        method: 'Fixed package, all support scores reduced and clamped at zero; no reoptimization or probabilities.',
        rows: levels(args[1], 100).map(drop => checked(stressPackage(proposal, args[0].split(','), drop))),
      }; break;
      case 'compare': {
        const rightText = await readText(args[0]);
        const right = proposalFrom(parseJson(rightText));
        output = { inputs: compareScenarioInputs(proposal, right), before: solve(proposal), after: solve(right) };
        break;
      }
    }
    process.stdout.write(command === 'export' ? output : (command === 'batch' ? output.map(row => JSON.stringify(row)).join('\n') : JSON.stringify(output)) + '\n');
  }
} catch (error) {
  process.stderr.write(JSON.stringify({ status: 'error', error: error.message }) + '\n');
  process.exitCode = 2;
}
