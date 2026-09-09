import {
  createPartnershipReviewPacket,
  replayPartnershipReviewPacket,
  PARTNERSHIP_REVIEW_TOOLS,
  analyzePartnershipReview,
  PRESETS,
  DEFAULT_STRESS,
  MAX_PARTICIPANTS,
  ValidationError,
  applyStressProposal,
  calculatePartnership,
  calculateFeeRequirements,
  clonePreset,
  compareImportedCase,
  compareThreeSnapshots,
  duplicateDisplayNames,
  duplicateParticipant,
  dropAndReallocate,
  evaluateStressGrid,
  exportDownloadName,
  makeParticipant,
  materializeStressCase,
  moveParticipant,
  participantsFromCsv,
  participantsFromRosterText,
  participantsToCsv,
  redactConfiguration,
  solveFeeForAllHold,
  solveMinimumShareToHold,
  solveMinimumVolumeToHold,
  stressGridCsv,
  uniqueCopyName,
  validateConfiguration,
} from './model.js';

const STORAGE_KEY = 'partnership-breakpoint.v1';
const LIBRARY_KEY = 'partnership-breakpoint.cases.v1';
const COACH_KEY = 'partnership-breakpoint.coach.v1';
const MAX_HASH_LENGTH = 60_000;
const app = document.querySelector('#workbench');
const standaloneFileMode = window.location.protocol === 'file:';
let openedFromShareLink = false;
let participantSequence = 0;
let importSequence = 0;
let activePreset = 'balanced';
let pendingNotice = '';
let persistenceWarning = '';
let partnershipReviewPacket = null;
let partnershipReviewSequence = 0;
let state = withStress(loadInitialState());
let eventsBound = false;
let caseName = '';
let caseLibrary = loadCaseLibrary();
let removedCase = null;
let comparisonId = '';
let pinFirstId = '';
let pinSecondId = '';
let importedCompare = null;
let stressPreviewId = '';
let shareHoldPreview = null;
let feeHoldPreview = null;
let volumeHoldPreview = null;
let briefCopyText = '';
let csvCopyText = '';
let breakpointCopyText = '';
let rosterPasteText = '';
let invalidFieldCount = 0;
let coachVisible = !openedFromShareLink && !coachIsDismissed();
let helpOpen = false;
let dialogOpener = null;
let dialogNeedsInitialFocus = coachVisible;
const mutedStressIds = new Set();
let collapseAllHoldCases = false;
let hideHoldingParticipants = false;
let printRedacted = false;
const undoHistory = [];
const redoHistory = [];

function checkpoint() {
  stressPreviewId = '';
  shareHoldPreview = null;
  feeHoldPreview = null;
  volumeHoldPreview = null;
  briefCopyText = '';
  csvCopyText = '';
  breakpointCopyText = '';
  importSequence += 1;
  undoHistory.push(clone(state));
  if (undoHistory.length > 50) undoHistory.shift();
  redoHistory.length = 0;
}

function travelHistory(direction) {
  const source = direction === 'undo' ? undoHistory : redoHistory;
  const destination = direction === 'undo' ? redoHistory : undoHistory;
  if (!source.length) return;
  destination.push(clone(state));
  state = source.pop();
  stressPreviewId = '';
  shareHoldPreview = null;
  feeHoldPreview = null;
  volumeHoldPreview = null;
  briefCopyText = '';
  csvCopyText = '';
  breakpointCopyText = '';
  importSequence += 1;
  activePreset = '';
  refresh(direction === 'undo' ? 'Previous edit restored.' : 'Edit reapplied.');
}

function loadCaseLibrary() {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw) return [];
    if (raw.length > 3_000_000) throw new Error('Library too large');
    const cases = JSON.parse(raw);
    if (!Array.isArray(cases) || cases.length > 12 || new Set(cases.map((item) => item?.id)).size !== cases.length || cases.some((item) => !item || typeof item.id !== 'string' || !/^case-[0-9]+$/.test(item.id) || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 80 || !validateConfiguration(item.config).valid)) throw new Error('Invalid library');
    return cases;
  } catch { pendingNotice += ' Saved case library is unavailable or invalid. Export individual JSON backups for recovery.'; return []; }
}

function persistLibrary(candidate) {
  try { localStorage.setItem(LIBRARY_KEY, JSON.stringify(candidate)); }
  catch { setNotice('Case library could not be saved. Export JSON to keep this case.'); return false; }
  caseLibrary = candidate;
  return true;
}

function libraryPanel() {
  return `<section class="input-section" aria-labelledby="library-title"><h2 id="library-title">Saved cases</h2><p class="notice">Up to 12 named snapshots in this browser. Saving creates a separate case; export JSON for a portable backup. Pin first and Pin second, then compare those two snapshots with the current draft.</p><label>Snapshot name<input type="text" data-action="case-name" maxlength="80" value="${escapeAttribute(caseName)}" /></label><div class="button-row"><button type="button" data-action="save-case" ${caseLibrary.length >= 12 ? 'disabled' : ''}>Save new snapshot</button><button type="button" data-action="duplicate-case" ${caseLibrary.length >= 12 ? 'disabled' : ''}>Duplicate current case as snapshot</button><button type="button" data-action="restore-case" ${removedCase && caseLibrary.length < 12 ? '' : 'disabled'}>Restore last removed snapshot</button></div><ul class="saved-cases">${caseLibrary.map((item) => `<li><strong>${escapeAttribute(item.name)}</strong><div class="button-row"><button type="button" data-action="load-case" data-case-id="${item.id}">Load</button><button type="button" data-action="compare-case" data-case-id="${item.id}" aria-pressed="${comparisonId === item.id}">Compare</button><button type="button" data-action="pin-first" data-case-id="${item.id}" aria-pressed="${pinFirstId === item.id}">Pin first</button><button type="button" data-action="pin-second" data-case-id="${item.id}" aria-pressed="${pinSecondId === item.id}">Pin second</button><button type="button" data-action="remove-case" data-case-id="${item.id}">Remove snapshot</button></div></li>`).join('') || '<li>No named snapshots yet.</li>'}</ul></section>`;
}

function handleLibraryAction(action, id) {
  if (action === 'save-case') {
    if (!validateConfiguration(state).valid) { setNotice('Resolve invalid inputs before saving a snapshot.'); return; }
    if (!caseName.trim() || caseName.trim().length > 80) { setNotice('Enter a snapshot name of 1 to 80 characters.'); return; }
    if (caseLibrary.length >= 12) { setNotice('The library holds 12 snapshots. Remove one before saving another.'); return; }
    let sequence = 1;
    while (caseLibrary.some((item) => item.id === `case-${sequence}`) || removedCase?.id === `case-${sequence}`) sequence += 1;
    if (persistLibrary([...caseLibrary, { id: `case-${sequence}`, name: caseName.trim(), config: clone(state) }])) { render(); setNotice('Named snapshot saved locally.'); }
  }
  if (action === 'duplicate-case') {
    if (!validateConfiguration(state).valid) { setNotice('Resolve invalid inputs before duplicating the case.'); return; }
    if (caseLibrary.length >= 12) { setNotice('The library holds 12 snapshots. Remove one before duplicating.'); return; }
    const base = (typeof state.deal.title === 'string' && state.deal.title.trim()) || caseName.trim() || 'Current case';
    let name;
    try {
      name = uniqueCopyName(base, caseLibrary.map((item) => item.name));
    } catch (error) {
      if (!(error instanceof ValidationError)) throw error;
      setNotice(`Duplicate rejected: ${summarizeErrors(error.errors)}`);
      return;
    }
    let sequence = 1;
    while (caseLibrary.some((item) => item.id === `case-${sequence}`) || removedCase?.id === `case-${sequence}`) sequence += 1;
    const config = clone(state);
    config.deal.title = name;
    if (persistLibrary([...caseLibrary, { id: `case-${sequence}`, name, config }])) {
      render();
      setNotice(`Independent snapshot saved as ${name}. Later edits to the current draft do not change it.`);
    }
  }
  if (action === 'load-case') {
    const item = caseLibrary.find((entry) => entry.id === id);
    if (!item) return;
    checkpoint(); state = withStress(clone(item.config)); activePreset = ''; caseName = item.name;
    refresh(`Loaded snapshot: ${item.name}. Undo restores your prior draft.`);
  }
  if (action === 'remove-case') {
    const item = caseLibrary.find((entry) => entry.id === id);
    if (item && persistLibrary(caseLibrary.filter((entry) => entry.id !== id))) {
      removedCase = item;
      if (comparisonId === id) comparisonId = '';
      if (pinFirstId === id) pinFirstId = '';
      if (pinSecondId === id) pinSecondId = '';
      render();
      setNotice('Snapshot removed. Restore last removed snapshot is available in this tab.');
    }
  }
  if (action === 'restore-case' && removedCase && caseLibrary.length < 12) {
    if (persistLibrary([...caseLibrary, removedCase])) { removedCase = null; render(); setNotice('Snapshot restored.'); }
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function displayState() {
  if (!printRedacted) return state;
  const copy = clone(state);
  copy.participants.forEach((item, index) => {
    item.name = `Participant ${index + 1}`;
  });
  return copy;
}

function printSafeName(index, name) {
  return `<span class="participant-live-name">${escapeAttribute(name)}</span><span class="participant-redacted-name">Participant ${index + 1}</span>`;
}

function withStress(config) {
  return { ...config, stress: { ...(config.stress ?? DEFAULT_STRESS) } };
}

function compactErrorMessage(error) {
  if (!(error instanceof Error) || !error.message) return '';
  return error.message.replace(/\s+/g, ' ').trim().slice(0, 140);
}

function summarizeErrors(errors) {
  if (!errors.length) return 'unknown issue.';
  const extra = errors.length > 1 ? ` (${errors.length - 1} more)` : '';
  return `${errors[0]}${extra}`;
}

function describeJsonFailure(subject, error) {
  const detail = compactErrorMessage(error);
  if (error instanceof SyntaxError) {
    return detail ? `${subject} is not valid JSON (${detail}).` : `${subject} is not valid JSON.`;
  }
  return detail ? `${subject} could not be decoded (${detail}).` : `${subject} could not be decoded.`;
}

function decodeHash(hash) {
  if (!hash.startsWith('#deal=')) return { kind: 'none' };
  if (hash.length > MAX_HASH_LENGTH) {
    return { kind: 'invalid', reason: 'The share link is longer than 60,000 characters.' };
  }
  try {
    const encoded = hash.slice(6).replace(/-/g, '+').replace(/_/g, '/');
    const padded = encoded + '='.repeat((4 - encoded.length % 4) % 4);
    const parsed = JSON.parse(decodeURIComponent(Array.from(atob(padded), (character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')));
    const validation = validateConfiguration(parsed);
    return validation.valid
      ? { kind: 'ok', config: parsed }
      : { kind: 'invalid', reason: `The share link failed validation: ${summarizeErrors(validation.errors)}` };
  } catch (error) {
    return { kind: 'invalid', reason: describeJsonFailure('The share link', error) };
  }
}

function encodeHash(config) {
  const bytes = new TextEncoder().encode(JSON.stringify(config));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `#deal=${btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')}`;
}

function loadStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    if (raw.length > 250_000) throw new Error('Oversized saved case');
    const parsed = JSON.parse(raw);
    if (!validateConfiguration(parsed).valid) throw new Error('Invalid saved case');
    return parsed;
  } catch {
    pendingNotice = 'The previous local case could not be read. Showing Balanced; import an exported JSON backup to recover.';
    return null;
  }
}

function loadInitialState() {
  const fromHash = decodeHash(window.location.hash);
  if (fromHash.kind === 'ok') {
    openedFromShareLink = true;
    return fromHash.config;
  }
  const fromStorage = loadStoredState();
  if (fromHash.kind === 'invalid') {
    const fallback = fromStorage
      ? 'Showing the last saved case.'
      : 'Showing the Balanced starting point.';
    pendingNotice = fromHash.reason
      ? `Share link could not be loaded. ${fallback} ${fromHash.reason}`
      : `Share link could not be loaded. ${fallback}`;
  }
  return fromStorage ?? clonePreset('balanced');
}

function setNotice(message) {
  const notice = document.querySelector('#notice');
  if (notice) notice.textContent = persistenceWarning ? `${message.replace(/Saved locally(?: and updated the shareable URL)?\.?/, 'Updated in this tab.')} ${persistenceWarning}`.trim() : message;
}

function saveState() {
  const validation = validateConfiguration(state);
  if (!validation.valid) return;
  persistenceWarning = '';
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {
    persistenceWarning = 'Local saving is unavailable. Export JSON before closing this tab.';
  }
  if (standaloneFileMode) return;
  const hash = encodeHash(state);
  try {
    history.replaceState(null, '', hash.length <= MAX_HASH_LENGTH
      ? `${window.location.pathname}${window.location.search}${hash}`
      : `${window.location.pathname}${window.location.search}`);
  } catch {
    persistenceWarning += ' The share URL could not be updated. Export JSON to transfer this case.';
  }
}

function numberFromInput(value, optional = false) {
  if (optional && value.trim() === '') return null;
  if (value.trim() === '') return Number.NaN;
  return Number(value);
}

function inputValue(value) {
  return value === null || value === undefined || Number.isNaN(value) ? '' : String(value);
}

function field({ label, path, value, optional = false, min = 0, max = null, step = 'any', wide = false, type = 'number', title = '', maxLength = 80, pattern = null }) {
  const optionalText = optional ? '<span class="optional">optional</span>' : '';
  const titleAttr = title ? ` title="${escapeAttribute(title)}"` : '';
  const sharesInvalid = path.endsWith('.revenueShare') && Math.abs(state.participants.reduce((sum, item) => sum + item.revenueShare, 0) - 1) > 1e-9;
  const textValue = String(value ?? '');
  const textInvalid = pattern
    ? (optional ? textValue !== '' && !pattern.test(textValue) : !pattern.test(textValue))
    : (optional ? textValue !== '' && (textValue.trim() === '' || textValue.trim().length > maxLength) : !textValue.trim() || textValue.trim().length > maxLength);
  const invalid = type === 'text' || type === 'textarea'
    ? textInvalid
    : !(optional && value == null) && (!Number.isFinite(value) || value < min || (max !== null && value > max) || sharesInvalid);
  if (invalid) invalidFieldCount += 1;
  const inputId = `field-${path.replace(/\./g, '-')}`;
  const optionalAttr = optional ? ' data-optional="true"' : '';
  const input = type === 'textarea'
    ? `<textarea id="${inputId}" aria-invalid="${invalid}" data-path="${path}" data-type="text"${optionalAttr} maxlength="${maxLength}" rows="4" ${optional ? '' : 'required '}${titleAttr}>${escapeAttribute(value ?? '')}</textarea>`
    : type === 'text'
      ? `<input id="${inputId}" aria-invalid="${invalid}" type="text" data-path="${path}" data-type="text"${optionalAttr} value="${escapeAttribute(value ?? '')}" maxlength="${maxLength}" ${optional ? '' : 'required '}${titleAttr} />`
      : `<input id="${inputId}" aria-invalid="${invalid}" type="number" data-path="${path}" ${optional ? 'data-optional="true"' : ''} min="${min}" ${max === null ? '' : `max="${max}"`} step="${step}" value="${inputValue(value)}" ${optional ? '' : 'required'}${titleAttr} />`;
  return `<div class="field ${wide ? 'wide' : ''}"><label>${label} ${optionalText}${input}</label></div>`;
}

function escapeAttribute(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatNumber(value, digits = 0) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'Impossible';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
}

function currencyPrefix() {
  return typeof state.deal.currency === 'string' && /^[A-Z]{3}$/.test(state.deal.currency)
    ? state.deal.currency
    : '';
}

function formatMoney(value) {
  if (!Number.isFinite(value)) return 'Impossible';
  const amount = formatNumber(value, 2);
  const currency = currencyPrefix();
  return currency ? `${currency} ${amount}` : `${amount} units`;
}

function formatPct(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'n/a';
  return `${formatNumber(value, 1)}%`;
}

function formatVolume(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'Impossible';
  return `${formatNumber(value)} txn`;
}

function compactShock(shock, units) {
  if (shock.status === 'already-failing') return 'Already failing';
  if (shock.status === 'unbounded') return 'No adverse threshold';
  if (shock.status === 'at-breakpoint') return 'At breakpoint';
  const percent = shock.changePct === null ? '' : `, ${formatPct(shock.changePct)}`;
  return `${formatNumber(shock.change, units === 'txn' ? 0 : 4)} ${units}${percent}`;
}

function shockLabel(kind) {
  return { volume: 'volume decrease', volumeIncrease: 'volume increase', fee: 'fee decrease', variableCost: 'variable cost increase' }[kind] ?? kind;
}

function shockUnits(kind) {
  return kind === 'volume' || kind === 'volumeIncrease' ? 'txn' : 'units / txn';
}

function copyFirstBreakpointButton() {
  return `<div class="button-row"><button type="button" data-action="copy-first-breakpoint">Copy first breakpoint</button></div>`;
}

function breakpointSection(result) {
  const breakpoint = result.firstBreakpoint;
  if (!breakpoint?.participant) {
    return `<section class="panel breakpoint-summary" id="first-breakpoint"><div class="panel-heading"><h2>First breakpoint</h2><span class="optional">relative adverse movement</span></div><div class="panel-body"><p>No bounded adverse shock is available in the current inputs. The displayed participant thresholds remain unbounded.</p>${copyFirstBreakpointButton()}</div></section>`;
  }

  const participantName = escapeAttribute(breakpoint.participant.name);
  const label = shockLabel(breakpoint.kind);
  const shock = breakpoint.shock;
  if (breakpoint.status === 'already-failing') {
    return `<section class="panel breakpoint-summary alarm" id="first-breakpoint"><div class="panel-heading"><h2>First breakpoint</h2><span class="optional">action now</span></div><div class="panel-body"><p><strong>${participantName}</strong> is already failing an exit criterion. Resolve the input before relying on a shock threshold.</p>${copyFirstBreakpointButton()}</div></section>`;
  }
  if (breakpoint.status === 'at-breakpoint') {
    return `<section class="panel breakpoint-summary alarm" id="first-breakpoint"><div class="panel-heading"><h2>First breakpoint</h2><span class="optional">action now</span></div><div class="panel-body"><p><strong>${participantName}</strong> is already at its ${label}. Any further adverse movement fails.</p>${copyFirstBreakpointButton()}</div></section>`;
  }

  const units = shockUnits(breakpoint.kind);
  const threshold = units === 'txn'
    ? `${formatNumber(shock.breakpoint)} txn`
    : `${formatNumber(shock.breakpoint, 4)} units / txn`;
  return `<section class="panel breakpoint-summary" id="first-breakpoint"><div class="panel-heading"><h2>First breakpoint</h2><span class="optional">relative adverse movement</span></div><div class="panel-body"><p><strong>Protect ${participantName} first.</strong> A ${label} of <strong>${compactShock(shock, units)}</strong> reaches the boundary at ${threshold}.</p><p class="output-note">This ranks the smallest percentage movement from the current scenario. It is a comparison aid, not a probability forecast.</p>${copyFirstBreakpointButton()}</div></section>`;
}

function participantDetailsOpen(index) {
  const nodes = app?.querySelectorAll?.('.participant-details');
  if (!nodes?.length) return true;
  const match = [...nodes].find((node) => Number(node.dataset?.participantIndex) === index);
  if (match) return Boolean(match.open);
  return Boolean(nodes[index]?.open);
}

function participantCurrentlyHolds(result, participantId) {
  return Boolean(result?.participants.find((item) => item.id === participantId)?.viable);
}

function inputPanel(result) {
  const firstFailId = result?.participants.find((participant) => !participant.viable)?.id ?? null;
  const hiddenHoldCount = hideHoldingParticipants && result
    ? state.participants.filter((participant) => participantCurrentlyHolds(result, participant.id)).length
    : 0;
  const firstVisibleIndex = state.participants.findIndex((participant) => !(hideHoldingParticipants && participantCurrentlyHolds(result, participant.id)));
  const participantForms = state.participants.map((participant, index) => {
    if (hideHoldingParticipants && participantCurrentlyHolds(result, participant.id)) return '';
    return `
    <section class="participant-form${firstFailId === participant.id ? ' first-fail' : ''}" aria-labelledby="participant-${index}-title">
      <div class="participant-toolbar">
        <div class="button-row participant-roster">
          <button type="button" data-action="duplicate-participant" data-index="${index}" ${state.participants.length >= MAX_PARTICIPANTS ? 'disabled title="Participant limit reached"' : ''}>Duplicate</button>
          <button type="button" data-action="move-participant-up" data-index="${index}" ${index === 0 ? 'disabled title="Already first"' : ''}>Move up</button>
          <button type="button" data-action="move-participant-down" data-index="${index}" ${index === state.participants.length - 1 ? 'disabled title="Already last"' : ''}>Move down</button>
          <button type="button" class="danger" data-action="remove-participant" data-index="${index}" ${state.participants.length <= 2 ? 'disabled title="At least two participants are required"' : ''}>Remove</button>
        </div>
      </div>
      ${firstFailId === participant.id ? '<p class="first-fail-label">First listed participant who fails an exit test in this baseline. Roster order, not a ranking of who will act.</p>' : ''}
      <details class="participant-details"${participantDetailsOpen(index) ? ' open' : ''} data-participant-index="${index}">
        <summary id="participant-${index}-title">Participant ${index + 1}: ${escapeAttribute(participant.name)}</summary>
        <div class="field-grid">
        ${field({ label: 'Name', path: `participants.${index}.name`, value: participant.name, wide: true, type: 'text', title: 'Display name, 1 through 80 characters after trimming spaces.' })}
        ${field({ label: 'Revenue share', path: `participants.${index}.revenueShare`, value: participant.revenueShare, min: 0, max: 1, step: '0.0001', title: 'Share of gross fee revenue, 0 through 1. All shares must sum to 1.' })}
        ${field({ label: 'Variable cost / txn', path: `participants.${index}.variableCostPerTransaction`, value: participant.variableCostPerTransaction, step: '0.0001' })}
        ${field({ label: 'Fixed monthly cost', path: `participants.${index}.fixedMonthlyCost`, value: participant.fixedMonthlyCost, step: '0.01' })}
        ${field({ label: 'Minimum monthly profit', path: `participants.${index}.minimumAcceptableProfit`, value: participant.minimumAcceptableProfit, step: '0.01' })}
        ${field({ label: 'Capacity / month', path: `participants.${index}.capacity`, value: participant.capacity, optional: true, step: '1', title: 'Leave blank for no capacity limit. Zero forbids any volume.' })}
        ${field({ label: 'Minimum commitment', path: `participants.${index}.minimumCommitment`, value: participant.minimumCommitment, optional: true, step: '1', title: 'Leave blank for no commitment. Blank and zero are equivalent here.' })}
        ${field({ label: 'Risk cost / month', path: `participants.${index}.riskCost`, value: participant.riskCost, step: '0.01', wide: true })}
      </div>
      <div class="button-row"><button type="button"${index === firstVisibleIndex ? ' id="share-hold-jump"' : ''} data-action="solve-share-hold" data-participant-id="${escapeAttribute(participant.id)}">Solve minimum share to hold</button><button type="button" data-action="solve-volume-hold" data-participant-id="${escapeAttribute(participant.id)}">Solve minimum volume to hold</button></div>
      </details>
    </section>`;
  }).join('');
  const rosterFilterNote = hideHoldingParticipants
    ? `${hiddenHoldCount} participant${hiddenHoldCount === 1 ? '' : 's'} who currently hold ${hiddenHoldCount === 1 ? 'is' : 'are'} hidden from this roster display. Expand restores them. Tested-case and model counts are unchanged.`
    : 'Hide participants who currently hold to filter this roster display only. Expand restores them. Counts stay the same.';

  return `
    <aside class="panel inputs" aria-label="Deal inputs">
      <div class="panel-heading"><h1>Deal ledger</h1><span class="optional">editable</span></div>
      <div class="panel-body">
        <section class="input-section" aria-labelledby="deal-inputs-title">
          <h2 id="deal-inputs-title">Shared deal</h2>
          <p class="notice">Volume shock % is the only baseline volume reduction, 0 through 100. Addressable volume caps realized demand. Empty required fields are not saved. An optional title, notes, and 3-letter currency code travel with JSON, hash links, and autosave. Currency is a display prefix only; omitted currency keeps the word units.</p>
          <div class="field-grid">
            ${field({ label: 'Deal title', path: 'deal.title', value: state.deal.title ?? '', optional: true, wide: true, type: 'text', title: 'Optional display name, 1 through 80 characters after trimming. Leave blank to omit.' })}
            ${field({ label: 'Currency code', path: 'deal.currency', value: state.deal.currency ?? '', optional: true, type: 'text', maxLength: 3, pattern: /^[A-Z]{3}$/, title: 'Optional 3-letter uppercase code such as USD. Leave blank to display units. The model does not convert currencies.' })}
            ${field({ label: 'Monthly volume', path: 'deal.monthlyVolume', value: state.deal.monthlyVolume, step: '1', title: 'Planned transactions per month, zero or greater.' })}
            ${field({ label: 'Fee / transaction', path: 'deal.feePerTransaction', value: state.deal.feePerTransaction, step: '0.0001', title: 'Gross fee collected per transaction, zero or greater.' })}
            ${field({ label: 'Addressable volume', path: 'deal.addressableVolume', value: state.deal.addressableVolume, step: '1', title: 'Maximum transactions available from demand, zero or greater.' })}
            ${field({ label: 'Volume shock %', path: 'deal.volumeShockPct', value: state.deal.volumeShockPct ?? 0, min: 0, max: 100, step: '0.1', title: 'Baseline volume reduction, 0 through 100. There is no separate churn field.' })}
            ${field({ label: 'Deal notes', path: 'deal.notes', value: state.deal.notes ?? '', optional: true, wide: true, type: 'textarea', maxLength: 500, title: 'Optional notes, 1 through 500 characters after trimming. Leave blank to omit. Shown in reports and print.' })}
          </div>
        </section>
        <section class="input-section" aria-labelledby="stress-inputs-title">
          <h2 id="stress-inputs-title">Compound stress settings</h2>
          <p class="notice">Test simultaneous shocks. Volume changes start from current effective volume and remain capped by addressable demand.</p>
          <div class="field-grid">
            ${field({ label: 'Volume decline %', path: 'stress.volumeDropPct', value: state.stress.volumeDropPct, max: 100, title: 'Additional volume decline from current effective volume, 0 through 100.' })}
            ${field({ label: 'Volume growth %', path: 'stress.volumeGrowthPct', value: state.stress.volumeGrowthPct, max: 100, title: 'Additional volume growth from current effective volume, 0 through 100, still capped by addressable demand.' })}
            ${field({ label: 'Fee reduction %', path: 'stress.feeDropPct', value: state.stress.feeDropPct, max: 100, title: 'Fee cut from the current fee, 0 through 100.' })}
            ${field({ label: 'Variable cost increase %', path: 'stress.variableCostRisePct', value: state.stress.variableCostRisePct, max: 200, title: 'Variable-cost increase from each participant current cost, 0 through 200.' })}
          </div>
          <p class="notice">Volume: decline, current, growth. Fee and cost: current, half, full shock. Up to 27 cases, with no assigned probabilities.</p>
        </section>
        <section class="input-section" aria-labelledby="presets-title">
          <h2 id="presets-title">Starting points</h2>
          <div class="preset-row">
            ${Object.entries(PRESETS).map(([key, preset]) => `<button type="button" data-action="preset" data-preset="${key}" aria-pressed="${activePreset === key}">${preset.name}</button>`).join('')}
          </div>
        </section>
        <section class="input-section" aria-labelledby="participant-inputs-title">
          <h2 id="participant-inputs-title">Participants</h2>
          <p class="notice">Shares must add to exactly 1. Leave capacity blank for no limit; a capacity of zero forbids any volume. Minimum commitment may be left blank; blank and zero are equivalent. Removing a participant reallocates that share across whoever remains. The last two participants cannot be removed.</p>
          ${duplicateNameWarning()}
          <p class="share-balance" aria-live="polite">${shareBalanceText()}</p><div class="button-row"><button type="button" data-action="equal-shares">Split equally</button><button type="button" data-action="normalize-shares">Normalize current shares</button></div>          <p class="notice">These actions change revenue shares only. Equal split assigns the same share to each participant. Normalize preserves the current proportions. Neither guarantees viability.</p>
          <div class="button-row"><button type="button" data-action="hide-holding-participants" aria-pressed="${hideHoldingParticipants}" ${result ? '' : 'disabled title="Resolve invalid inputs before filtering the roster"'}>Hide participants who currently hold</button><button type="button" data-action="show-holding-participants" ${hideHoldingParticipants ? '' : 'disabled'}>Show holding participants</button></div>
          <p class="notice">${rosterFilterNote}</p>
          ${participantForms || (hideHoldingParticipants ? `<p class="notice">${firstVisibleIndex === -1 ? '<span id="share-hold-jump" tabindex="-1"></span>' : ''}Every displayed participant currently holds. Expand to edit the hidden roster cards. Counts are unchanged.</p>` : '')}
          <div class="button-row"><button type="button" id="add-participant" data-action="add-participant" ${state.participants.length >= MAX_PARTICIPANTS ? 'disabled title="Participant limit reached"' : ''}>Add participant</button></div>
          <label class="roster-paste-label" for="roster-paste">Paste participant CSV or TSV</label>
          <textarea id="roster-paste" data-action="roster-paste" rows="6">${escapeAttribute(rosterPasteText)}</textarea>
          <div class="button-row"><button type="button" data-action="import-roster-paste">Import pasted roster</button></div>
          <p class="notice">Pasted CSV or TSV uses the same columns and validation as file import. Deal terms stay unchanged.</p>
        </section>
        <section class="input-section" aria-labelledby="data-title">
          <h2 id="data-title">Data</h2>
          ${libraryPanel()}
          <div class="button-row"><button type="button" data-action="undo" ${undoHistory.length ? '' : 'disabled'}>Undo</button><button type="button" data-action="redo" ${redoHistory.length ? '' : 'disabled'}>Redo</button><button type="button" data-action="open-help">Keyboard shortcuts</button><button type="button" data-action="show-coach">Show tour</button></div>
          <p class="notice">Undo retains the last 50 edits in this tab, including resets and imports.</p>
          <p class="notice">Import a JSON case exported by this workbench. Files must be 250 KB or smaller. Empty files, invalid JSON, and failed validation name the parse or field cause. Compare imported JSON shows honest diffs against the current draft without replacing it. Participant CSV replaces the roster only after every row validates; deal terms stay unchanged. Export participant CSV uses those same columns and formula-safe cells.</p>
          <div class="button-row">
            <button type="button" data-action="export">Export JSON</button><button type="button" data-action="export-redacted">Export redacted JSON (names replaced, title cleared)</button><button type="button" data-action="print-report">Print report</button><button type="button" data-action="print-redacted">Print redacted</button><button type="button" data-action="export-report">Export decision report</button><button type="button" data-action="copy-brief">Copy negotiation brief</button>${standaloneFileMode ? '' : '<button type="button" data-action="copy-share-url">Copy share URL</button>'}<button type="button" data-action="export-csv">Export stress CSV</button><button type="button" data-action="export-visible-csv">Export visible stress CSV</button><button type="button" data-action="copy-visible-csv">Copy visible stress CSV</button><button type="button" data-action="export-participants-csv">Export participant CSV</button>
            <label class="file-button">Import JSON<input type="file" data-action="import" accept="application/json,.json" /></label>
            <label class="file-button">Compare imported JSON<input type="file" data-action="compare-import" accept="application/json,.json" /></label>
            <label class="file-button">Import participant CSV<input type="file" data-action="import-participants-csv" accept="text/csv,.csv" /></label>
            <button type="button" data-action="reset">Reset</button>
          </div>
          <p id="notice" class="notice" aria-live="polite">${standaloneFileMode ? 'Standalone file mode: export JSON to transfer a case. File URLs are not portable.' : ''}</p>
        </section>
      </div>
    </aside>`;
}

function errorBox(errors) {
  const count = invalidFieldCount;
  const countText = count === 1 ? '1 field needs attention.' : `${count} fields need attention.`;
  return `<section class="error-box" role="alert"><h2>Resolve these inputs</h2><p class="invalid-count">${countText}</p><button type="button" data-action="focus-invalid">Go to first invalid field</button><ul>${errors.map((error) => `<li>${escapeAttribute(error)}</li>`).join('')}</ul></section>`;
}

function invalidSummary() {
  if (invalidFieldCount === 0) return '';
  const countText = invalidFieldCount === 1 ? '1 field needs attention.' : `${invalidFieldCount} fields need attention.`;
  return `<div class="invalid-summary" role="status"><p class="invalid-count" aria-live="polite">${countText}</p><button type="button" data-action="focus-invalid">Go to first invalid field</button></div>`;
}

function resultsPanel(result) {
  if (!result) {
    const errors = validateConfiguration(state).errors;
    return `<section class="results" id="results-start">${errorBox(errors)}${importedCompareSection()}<section class="panel"><div class="panel-heading"><h2>Model status</h2></div><div class="panel-body"><p class="notice">Calculations return once every required field is valid and shares reconcile to 1.</p></div></section>${methodAndLimits()}</section>`;
  }
  const statusClass = result.viable ? 'viable' : 'fragile';
  const status = result.viable ? 'Operating region holds' : 'A participant exits';
  const identity = [
    state.deal.title ? escapeAttribute(state.deal.title.trim()) : '',
    currencyPrefix() ? `Amounts displayed with ${currencyPrefix()} prefix` : '',
  ].filter(Boolean).join('. ');
  const statusDetail = escapeAttribute(result.viable
    ? `${result.weakestParticipant.name} has the least volume headroom to its ${result.weakestParticipant.bindingConstraint.label} limit.`
    : `${result.participants.filter((participant) => !participant.viable).map((participant) => participant.name).join(', ')} fails at least one exit criterion.`);
  return `<section class="results" id="results-start">
    <section class="status-card ${statusClass}" aria-live="polite">
      <div><span class="eyebrow">Partnership viability</span><h1>${status}</h1>${identity ? `<p>${identity}</p>` : ''}<p>${statusDetail}</p></div>
      <div class="score"><strong>${result.viable ? 'VIABLE' : 'NOT VIABLE'}</strong><span>at ${formatVolume(result.effectiveVolume)} / month</span></div>
    </section>
    <section class="metric-strip" aria-label="Deal summary">
      <div class="metric"><span>Effective volume</span><strong>${formatVolume(result.effectiveVolume)}</strong></div>
      <div class="metric"><span>Total revenue</span><strong>${formatMoney(result.totalRevenue)}</strong></div>
      <div class="metric"><span>Total participant profit</span><strong>${formatMoney(result.totalProfit)}</strong></div>
      <div class="metric"><span>Capacity ceiling</span><strong>${formatVolume(result.capacityCeiling)}</strong></div>
    </section>
    <section class="print-only print-keep"><h2>Deal notes</h2>${state.deal.notes ? `<p>${escapeAttribute(state.deal.notes)}</p>` : '<p>No deal notes were entered.</p>'}</section>
    <section class="print-only print-hide"><h2>Case assumptions</h2><p>Reproducible inputs. Deterministic monthly model; money is expressed in consistent currency units.</p><pre>${escapeAttribute(JSON.stringify(state, null, 2))}</pre></section>
    <nav class="results-jump" aria-label="Jump in results" id="results-jump" tabindex="-1">
      <span class="eyebrow">Jump in results</span>
      <a href="#first-breakpoint">First breakpoint</a>
      <a href="#fee-guidance-title">Fee guide</a>
      <a href="#three-compare-title">Three-snapshot compare</a>
      ${importedCompare ? '<a href="#imported-compare-title">Imported JSON compare</a>' : ''}
      <a href="#charts-title">Charts</a>
      <a href="#compound-title">Compound stress</a>
      <a href="#participant-ledger">Participant ledger</a>
    </nav>
    ${feeRequirementsSection()}
    ${feeHoldPreviewSection()}
    ${shareHoldPreviewSection()}
    ${volumeHoldPreviewSection()}
    ${briefCopySection()}
    ${csvCopySection()}
    ${breakpointCopySection()}
    ${comparisonSection(result)}
    ${threeCompareSection(result)}
    ${importedCompareSection()}
    ${breakpointSection(result)}
    <h2 id="charts-title" class="visually-hidden">Charts</h2>
    ${tornadoSection(result)}
    ${waterfallSection(result)}
    ${stressSection()}
    ${result.volumeCappedByAddressableDemand ? '<p class="error-box">Addressable demand limits realized volume below the post-shock monthly-volume input.</p>' : ''}
    ${participantTable(result)}
    ${shockSection(result)}
    ${sensitivitySection(result)}
    ${methodAndLimits()}
  </section>`;
}

function caseLabel(scenario) {
  return `${scenario.id}: volume ${formatPct(scenario.volumeChangePct)}, fee cut ${formatPct(scenario.feeDropPct)}, cost rise ${formatPct(scenario.variableCostRisePct)}`;
}

function visibleStressScenarios(stress) {
  if (!collapseAllHoldCases) return stress.scenarios;
  return stress.scenarios.filter((scenario) => !scenario.viable);
}

function stressSection() {
  const stress = evaluateStressGrid(state);
  const negotiation = stress.negotiation;
  const statusText = {
    'operational-breach': 'Revenue shares cannot fix every case. Review capacity or minimum commitments shown in the case evidence.',
    'no-revenue': 'At least one case cannot fund a participant\'s required costs and profit with any finite share of its fee revenue.',
    'insufficient-revenue': 'No single fixed revenue split can fund every participant across all tested cases. Reduce the shocks, costs, or profit floors, or change the fee.',
    'precision-limit': 'A candidate split failed numerical rechecking. No proposal is offered.',
    feasible: 'A fixed-share proposal passes every tested case. Remaining revenue is distributed in proportion to the current shares. Applying it changes only revenue shares.',
  }[negotiation.status];
  const rows = stress.participants.map((participant, index) => {
    if (mutedStressIds.has(participant.id)) {
      return `<tr class="stress-muted"><th scope="row">${escapeAttribute(participant.name)}</th><td colspan="6">Hidden from this table only. Still counted in the ${stress.caseCount} tested cases and any proposal. <button type="button" data-action="unmute-stress-row" data-participant-id="${escapeAttribute(participant.id)}">Show row</button></td></tr>`;
    }
    const worstCase = stress.scenarios.find((scenario) => scenario.id === participant.worst.scenarioId);
    const operations = negotiation.operationalFailures.filter((failure) => failure.participantId === participant.id);
    return `<tr><th scope="row">${escapeAttribute(participant.name)}<br><button type="button" data-action="mute-stress-row" data-participant-id="${escapeAttribute(participant.id)}">Hide in table</button></th>
      <td>${participant.passCount} / ${stress.caseCount} hold</td>
      <td>${formatMoney(participant.worst.profitGap)}<br><small>${caseLabel(worstCase)}</small></td>
      <td>${operations.length ? `${operations.length} cases fail capacity or commitment` : 'All operational tests pass'}</td>
      <td>${formatPct(participant.currentShare * 100)}</td>
      <td>${participant.requiredShare === null ? 'No finite share' : formatPct(participant.requiredShare * 100)}<br><small>${participant.requiredShareScenarioId}</small></td>
      <td>${negotiation.proposal ? formatPct(negotiation.proposal[index].revenueShare * 100) : 'Not available'}</td></tr>`;
  }).join('');
  const visibleCases = visibleStressScenarios(stress);
  const hiddenHoldCount = stress.scenarios.length - visibleCases.length;
  const cases = visibleCases.map((scenario) => `<tr><th scope="row">${caseLabel(scenario)}<br><button type="button" data-action="inspect-stress" data-scenario-id="${scenario.id}">Inspect ${scenario.id}</button></th>
    <td>${formatVolume(scenario.volume)}</td><td>${formatNumber(scenario.fee, 4)}</td><td>${formatMoney(scenario.totalProfit)}</td>
    <td class="${scenario.viable ? 'pass-text' : 'failure-text'}">${scenario.viable ? 'All participants hold' : scenario.participants.filter((participant) => !participant.viable).map((participant) => `${escapeAttribute(participant.name)}: ${escapeAttribute(participant.failureReasons.join('; '))}`).join('<br>')}</td></tr>`).join('');
  const collapseNote = collapseAllHoldCases
    ? `${hiddenHoldCount} all-hold ${hiddenHoldCount === 1 ? 'case is' : 'cases are'} hidden from this table. ${stress.passCount} of ${stress.caseCount} tested cases still hold. Counts are unchanged.`
    : 'Collapse cases every participant holds to hide those rows from this table only. Counts stay the same.';
  return `<section class="panel compound-panel" aria-labelledby="compound-title"><div class="panel-heading"><h2 id="compound-title">Compound stress and negotiation</h2><span class="optional">v1.4.3</span></div>
    <div class="panel-body"><p class="stress-summary" aria-live="polite"><strong>${stress.passCount} of ${stress.caseCount} tested cases hold</strong> under the current shares.</p>
      <p>${statusText}</p><p>Minimum shares across all cases total <strong>${negotiation.requiredShareTotal === null ? 'no finite allocation' : formatPct(negotiation.requiredShareTotal * 100)}</strong>. Available revenue share: 100%. Profit gap means monthly profit less the participant's minimum.</p>
      <div class="button-row"><button type="button" class="primary" data-action="apply-stress-proposal" ${negotiation.proposal ? '' : 'disabled'}>Apply tested revenue split</button><button type="button" data-action="edit-stress-settings">Edit stress settings</button><button type="button" data-action="collapse-all-hold-cases" aria-pressed="${collapseAllHoldCases}">Collapse cases every participant holds</button><button type="button" data-action="expand-all-hold-cases" ${collapseAllHoldCases ? '' : 'disabled'}>Show all-hold cases</button><button type="button" data-action="export-csv">Export all cases CSV</button><button type="button" data-action="export-visible-csv">Export visible cases CSV</button><button type="button" data-action="copy-visible-csv">Copy visible cases CSV</button></div>
      <p class="notice">The proposal is conditional on the entered cases, not an agreed contract or an optimal negotiation. Preview the shares below before applying. Hide in table removes a row from this display only; counts and proposals still include that participant. ${collapseNote}</p></div>
    <div class="table-wrap" tabindex="0" role="region" aria-label="Stress participant ledger, scroll horizontally"><table class="stress-table"><caption>Participant stress ledger and proposed shares</caption><thead><tr><th scope="col">Participant</th><th scope="col">Cases held</th><th scope="col">Worst profit gap</th><th scope="col">Operations</th><th scope="col">Current share</th><th scope="col">Minimum share</th><th scope="col">Proposal</th></tr></thead><tbody>${rows}</tbody></table></div>
    ${stressCasePreview(stress)}
    <details class="case-details"><summary>Inspect all ${stress.caseCount} compound cases</summary><div class="table-wrap" tabindex="0" role="region" aria-label="Compound case evidence, scroll horizontally"><table class="stress-table"><caption>Deterministic case evidence, counts are not likelihoods. ${visibleCases.length} of ${stress.caseCount} rows are visible.</caption><thead><tr><th scope="col">Case and simultaneous shocks</th><th scope="col">Effective volume</th><th scope="col">Fee / transaction</th><th scope="col">Total profit</th><th scope="col">Participant tests</th></tr></thead><tbody>${cases || `<tr><td colspan="5">Every displayed case currently holds. ${stress.passCount} of ${stress.caseCount} tested cases hold. Expand to inspect all-hold rows. Counts are unchanged.</td></tr>`}</tbody></table></div></details>
    <p class="output-note">Only these discrete cases are evaluated. No claim is made about untested cases or future participant behavior. Edit Compound stress settings in the Deal ledger.</p></section>`;
}

function capacityUtilizationCell(participant) {
  if (participant.capacity == null || participant.capacityUtilization == null) {
    return '<td>Unbounded</td>';
  }
  if (!Number.isFinite(participant.capacityUtilization)) {
    return '<td class="failure-text">Exceeds zero capacity</td>';
  }
  const pct = participant.capacityUtilization * 100;
  const capped = Math.max(0, Math.min(100, pct));
  const over = pct > 100 + 1e-9;
  const label = `${formatPct(pct)} of capacity`;
  return `<td><span class="capacity-use"><svg class="capacity-meter" role="img" aria-label="${escapeAttribute(label)}" viewBox="0 0 100 8" width="72" height="8"><rect x="0" y="0" width="100" height="8" fill="#eae7de"></rect><rect x="0" y="0" width="${capped}" height="8" fill="${over ? '#d94f3d' : '#1558d6'}"></rect></svg><span>${escapeAttribute(label)}</span></span></td>`;
}

function participantTable(result) {
  const rows = result.participants.map((participant, index) => `
    <tr>
      <td><strong>${printSafeName(index, participant.name)}</strong></td>
      <td>${formatMoney(participant.revenue)}</td>
      <td>${formatMoney(participant.variableCost)}</td>
      <td>${formatMoney(participant.fixedCost)}</td>
      <td>${formatMoney(participant.riskCost)}</td>
      <td>${formatMoney(participant.monthlyProfit)}</td>
      <td>${participant.margin === null ? 'n/a' : formatPct(participant.margin * 100)}</td>
      <td>${formatVolume(participant.breakEvenVolume)}</td>
      <td>${formatVolume(participant.exitVolume)}</td>
      <td>${participant.headroomToExit === null ? 'Impossible' : formatVolume(participant.headroomToExit)}</td>
      <td>${participant.capacity === null ? 'Unbounded' : formatVolume(participant.capacity)}</td>
      ${capacityUtilizationCell(participant)}
      <td>${escapeAttribute(participant.bindingConstraint.label)}</td>
      <td class="${participant.viable ? 'pass-text' : 'failure-text'}">${participant.viable ? 'Holds' : escapeAttribute(participant.failureReasons.join('; '))}</td>
    </tr>`).join('');
  return `<section class="panel print-keep" id="participant-ledger"><div class="table-wrap" tabindex="0" role="region" aria-label="Participant ledger, scroll horizontally"><table><caption>Participant ledger</caption><thead><tr><th>Participant</th><th>Revenue</th><th>Variable cost</th><th>Fixed cost</th><th>Risk cost</th><th>Monthly profit</th><th>Margin</th><th>Break-even volume</th><th>Exit volume</th><th>Headroom</th><th>Capacity</th><th>Capacity use</th><th>Binding limit</th><th>Exit test</th></tr></thead><tbody>${rows}</tbody></table></div><p class="output-note">Exit volume is the greater of the profit threshold and minimum commitment. Binding limit identifies the nearest economic or capacity boundary. Capacity use is effective volume divided by capacity, or Unbounded when no capacity is supplied.</p></section>`;
}

function shockCard(label, shock, units) {
  const alert = shock.status === 'already-failing' ? 'alarm' : shock.status === 'unbounded' ? 'safe' : '';
  const threshold = shock.breakpoint === null ? '' : `<p>Threshold: ${formatNumber(shock.breakpoint, units === 'txn' ? 0 : 4)} ${units}. Any additional adverse movement fails.</p>`;
  return `<article class="shock-card ${alert}"><h3>${label}</h3><strong>${compactShock(shock, units)}</strong><p>${escapeAttribute(shock.reason)}</p>${threshold}</article>`;
}

function shockSection(result) {
  return `<section class="panel"><div class="panel-heading"><h2>Smallest adverse shock by participant</h2><span class="optional">threshold is not a forecast</span></div><div class="panel-body">${result.participants.map((participant) => `<section class="input-section"><h2>${escapeAttribute(participant.name)}</h2><div class="shock-grid">${shockCard('Volume decrease', participant.shocks.volume, 'txn')}${shockCard('Volume increase', participant.shocks.volumeIncrease, 'txn')}${shockCard('Fee decrease', participant.shocks.fee, 'units / txn')}${shockCard('Variable cost increase', participant.shocks.variableCost, 'units / txn')}</div></section>`).join('')}</div></section>`;
}

function chartLabel(value, max = 24) {
  const text = String(value ?? '');
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function tornadoChart(result) {
  const kinds = [
    ['volume', 'Volume down'],
    ['volumeIncrease', 'Volume up'],
    ['fee', 'Fee down'],
    ['variableCost', 'Cost up'],
  ];
  const rows = [];
  for (const participant of result.participants) {
    for (const [kind, label] of kinds) {
      const shock = participant.shocks[kind];
      const bounded = shock.status === 'bounded' && shock.changePct != null && Number.isFinite(shock.changePct);
      rows.push({
        name: participant.name,
        label,
        status: shock.status,
        changePct: bounded ? shock.changePct : null,
        display: shock.status === 'already-failing' ? 'Already failing'
          : shock.status === 'at-breakpoint' ? 'At breakpoint'
          : bounded ? formatPct(shock.changePct)
            : 'No bounded shock',
      });
    }
  }
  const finite = rows.map((row) => row.changePct).filter((value) => value != null);
  const maxPct = Math.max(1, ...finite);
  const rowHeight = 22;
  const left = 190;
  const width = 720;
  const height = 28 + rows.length * rowHeight;
  const barMax = width - left - 90;
  const bars = rows.map((row, index) => {
    const y = 8 + index * rowHeight;
    const barWidth = row.changePct == null ? 0 : (row.changePct / maxPct) * barMax;
    return `<text x="8" y="${y + 13}" font-size="11" fill="#1f2328">${escapeAttribute(chartLabel(`${row.name} / ${row.label}`, 28))}</text>
      <rect x="${left}" y="${y}" width="${Math.max(0, barWidth)}" height="14" fill="${row.changePct == null ? '#eae7de' : '#1558d6'}"></rect>
      <text x="${left + Math.max(0, barWidth) + 6}" y="${y + 13}" font-size="11" fill="#1f2328">${escapeAttribute(row.display)}</text>`;
  }).join('');
  const tableRows = rows.map((row) => `<tr><th scope="row">${escapeAttribute(row.name)}</th><td>${escapeAttribute(row.label)}</td><td>${escapeAttribute(row.display)}</td></tr>`).join('');
  return { width, height, bars, tableRows };
}

function tornadoSvgMarkup(result, { standalone = false } = {}) {
  const chart = tornadoChart(result);
  const xmlns = standalone ? ' xmlns="http://www.w3.org/2000/svg"' : '';
  const role = standalone ? '' : ' class="chart-svg" role="img" aria-label="Tornado chart of smallest bounded adverse percentage shocks by participant. The table lists the same values."';
  return `<svg${xmlns}${role} viewBox="0 0 ${chart.width} ${chart.height}" width="${standalone ? chart.width : '100%'}" height="${standalone ? chart.height : Math.min(chart.height, 520)}">${chart.bars}</svg>`;
}

function tornadoSvgFile(result) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n${tornadoSvgMarkup(result, { standalone: true })}\n`;
}

function tornadoSection(result) {
  const chart = tornadoChart(result);
  return `<section class="panel print-keep"><div class="panel-heading"><h2>Adverse-shock tornado</h2><span class="optional">percentage movement</span></div><div class="panel-body"><p>Each bar is that participant's smallest bounded adverse percentage shock in one direction. Unbounded and already-failing cases have no bar. This ranks displayed movements; it does not assign probability.</p><div class="button-row"><button type="button" data-action="export-tornado-svg">Download tornado SVG</button></div><div class="chart-frame">${tornadoSvgMarkup(result)}</div></div><div class="table-wrap" tabindex="0" role="region" aria-label="Tornado values, text equivalent"><table class="tornado-table"><caption>Text equivalent of the tornado chart</caption><thead><tr><th scope="col">Participant</th><th scope="col">Shock</th><th scope="col">Adverse movement</th></tr></thead><tbody>${chart.tableRows}</tbody></table></div></section>`;
}

function waterfallChart(participant) {
  const minimum = participant.minimumAcceptableProfit;
  const afterVariable = participant.revenue - participant.variableCost;
  const afterFixed = afterVariable - participant.fixedCost;
  const columns = [
    { label: 'Revenue', start: 0, end: participant.revenue, fill: '#1558d6' },
    { label: 'Variable', start: participant.revenue, end: afterVariable, fill: '#d94f3d' },
    { label: 'Fixed', start: afterVariable, end: afterFixed, fill: '#d94f3d' },
    { label: 'Risk', start: afterFixed, end: participant.monthlyProfit, fill: '#d94f3d' },
    { label: 'Profit', start: 0, end: participant.monthlyProfit, fill: participant.monthlyProfit + 1e-9 >= minimum ? '#0b5c78' : '#d94f3d' },
  ];
  const peaks = [0, participant.revenue, afterVariable, afterFixed, participant.monthlyProfit, minimum];
  const yMin = Math.min(...peaks);
  const yMax = Math.max(...peaks, 1);
  const width = 640;
  const height = 220;
  const margin = { top: 18, right: 12, bottom: 36, left: 8 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const y = (value) => margin.top + innerH * (1 - (value - yMin) / (yMax - yMin || 1));
  const gap = 10;
  const colW = (innerW - gap * (columns.length - 1)) / columns.length;
  const rects = columns.map((column, columnIndex) => {
    const x = margin.left + columnIndex * (colW + gap);
    const top = y(Math.max(column.start, column.end));
    const bottom = y(Math.min(column.start, column.end));
    return `<rect x="${x}" y="${top}" width="${colW}" height="${Math.max(1, bottom - top)}" fill="${column.fill}"></rect>
        <text x="${x + colW / 2}" y="${height - 14}" text-anchor="middle" font-size="11" fill="#1f2328">${column.label}</text>`;
  }).join('');
  const zeroY = y(0);
  const minY = y(minimum);
  const connectors = columns.slice(0, 4).map((column, columnIndex) => {
    const x1 = margin.left + columnIndex * (colW + gap) + colW;
    const x2 = x1 + gap;
    const y1 = y(column.end);
    return `<line x1="${x1}" x2="${x2}" y1="${y1}" y2="${y1}" stroke="#5b6269"></line>`;
  }).join('');
  const inner = `<line x1="${margin.left}" x2="${width - margin.right}" y1="${zeroY}" y2="${zeroY}" stroke="#1f2328"></line>
      <line x1="${margin.left}" x2="${width - margin.right}" y1="${minY}" y2="${minY}" stroke="#8a5a05" stroke-dasharray="4 3"></line>
      <text x="${width - margin.right}" y="${minY - 4}" text-anchor="end" font-size="10" fill="#8a5a05">Minimum ${escapeAttribute(formatMoney(minimum))}</text>
      ${connectors}${rects}`;
  return { name: participant.name, width, height, inner, minimum };
}

function waterfallSvgMarkup(result, { standalone = false } = {}) {
  const charts = result.participants.map((participant) => waterfallChart(participant));
  const titleBand = 28;
  const gap = 16;
  const width = 640;
  let offset = 0;
  const groups = charts.map((chart) => {
    const block = `<text x="8" y="${offset + 18}" font-size="14" fill="#1f2328">${escapeAttribute(chart.name)}</text>
      <g transform="translate(0 ${offset + titleBand})">${chart.inner}</g>`;
    offset += titleBand + chart.height + gap;
    return block;
  }).join('');
  const height = Math.max(1, offset - gap);
  const xmlns = standalone ? ' xmlns="http://www.w3.org/2000/svg"' : '';
  const role = standalone ? '' : ' class="chart-svg" role="img" aria-label="Contribution waterfall charts for every participant, stacked from revenue through costs to profit. Each on-screen chart has its own table."';
  return `<svg${xmlns}${role} viewBox="0 0 ${width} ${height}" width="${standalone ? width : '100%'}" height="${standalone ? height : Math.min(height, 720)}">${groups}</svg>`;
}

function waterfallSvgFile(result) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n${waterfallSvgMarkup(result, { standalone: true })}\n`;
}

function waterfallSection(result) {
  const charts = result.participants.map((participant) => {
    const chart = waterfallChart(participant);
    const svg = `<svg class="chart-svg" role="img" aria-label="Contribution waterfall for ${escapeAttribute(participant.name)} showing revenue, costs, profit, and the minimum acceptable profit. The table lists the same values." viewBox="0 0 ${chart.width} ${chart.height}" width="100%">
      ${chart.inner}
    </svg>`;
    return `<section class="input-section"><h3>${escapeAttribute(participant.name)}</h3>${svg}
      <div class="table-wrap" tabindex="0" role="region" aria-label="Waterfall values for ${escapeAttribute(participant.name)}"><table><caption>Text equivalent for ${escapeAttribute(participant.name)}</caption><thead><tr><th scope="col">Step</th><th scope="col">Amount</th></tr></thead><tbody>
        <tr><th scope="row">Revenue</th><td>${formatMoney(participant.revenue)}</td></tr>
        <tr><th scope="row">Variable cost</th><td>${formatMoney(participant.variableCost)}</td></tr>
        <tr><th scope="row">Fixed cost</th><td>${formatMoney(participant.fixedCost)}</td></tr>
        <tr><th scope="row">Risk cost</th><td>${formatMoney(participant.riskCost)}</td></tr>
        <tr><th scope="row">Monthly profit</th><td>${formatMoney(participant.monthlyProfit)}</td></tr>
        <tr><th scope="row">Minimum acceptable profit</th><td>${formatMoney(chart.minimum)}</td></tr>
      </tbody></table></div></section>`;
  }).join('');
  return `<section class="panel print-keep"><div class="panel-heading"><h2>Contribution waterfall</h2><span class="optional">revenue to profit</span></div><div class="panel-body"><p>Each chart steps from fee revenue through variable, fixed, and risk cost to monthly profit. The dashed line is the entered minimum acceptable profit. The participant ledger remains the full numeric record.</p><div class="button-row"><button type="button" data-action="export-waterfall-svg">Download waterfall SVG</button></div>${charts}</div></section>`;
}

function sensitivityGrid() {
  const columns = 7;
  const rows = 7;
  const maxVolume = Math.max(state.deal.addressableVolume, state.deal.monthlyVolume, 1);
  const maxFee = Math.max(state.deal.feePerTransaction * 1.5, 0.01);
  const volumes = Array.from({ length: columns }, (_, index) => maxVolume * index / (columns - 1));
  const fees = Array.from({ length: rows }, (_, index) => maxFee * (rows - 1 - index) / (rows - 1));
  const cells = fees.map((fee) => volumes.map((volume) => {
    const config = clone(state);
    config.deal.monthlyVolume = volume;
    config.deal.addressableVolume = Math.max(maxVolume, volume);
    config.deal.volumeShockPct = 0;
    config.deal.feePerTransaction = fee;
    try { return calculatePartnership(config).viable; } catch { return false; }
  }));
  return { volumes, fees, cells };
}

function sensitivitySection() {
  const grid = sensitivityGrid();
  const tableRows = grid.fees.map((fee, row) => `<tr><th scope="row">${formatNumber(fee, 3)}</th>${grid.volumes.map((volume, column) => `<td class="${grid.cells[row][column] ? 'cell-viable' : 'cell-fail'}" aria-label="Fee ${formatNumber(fee, 3)}, volume ${formatNumber(volume)}: ${grid.cells[row][column] ? 'viable' : 'not viable'}">${grid.cells[row][column] ? 'Holds' : 'Exit'}</td>`).join('')}</tr>`).join('');
  return `<section class="panel"><div class="panel-heading"><h2>Operating region</h2><span class="optional">fee and volume sensitivity</span></div><div class="sensitivity-layout"><div><canvas id="sensitivity-canvas" width="560" height="400" role="img" aria-label="Canvas chart of viable and non-viable fee and monthly-volume combinations. The visible table provides the same values.">Canvas chart unavailable. Use the operating region table.</canvas><div class="legend"><span><i class="swatch viable"></i>Every participant holds</span><span><i class="swatch fail"></i>At least one participant exits</span></div></div><div class="table-wrap" tabindex="0" role="region" aria-label="Operating region values, scroll horizontally"><table class="sensitivity-table"><caption>Operating region table. Rows are fee per transaction. Columns are monthly volume.</caption><thead><tr><th>Fee / volume</th>${grid.volumes.map((volume) => `<th>${formatNumber(volume)}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table></div></div></section>`;
}

function methodAndLimits() {
  return `<section class="disclosure-grid"><section class="panel"><div class="panel-heading"><h2>Method</h2></div><div class="panel-body"><p>Revenue equals effective monthly volume times fee per transaction times revenue share. Monthly profit equals revenue less variable cost, fixed monthly cost, and risk cost. Effective volume is post-shock monthly volume capped by addressable volume.</p><p>A participant holds only when monthly profit meets its minimum acceptable profit, volume meets any minimum commitment, and volume does not exceed capacity.</p><p>The viability card names the participant with the least volume headroom. First breakpoint ranks bounded shocks by percentage movement and can name a different participant. Share-to-hold, volume-to-hold, and fee-to-hold are deterministic floors with preview-then-apply. They do not assign probability.</p></div></section><section class="panel"><div class="panel-heading"><h2>Limits</h2></div><div class="panel-body"><p>This is a deterministic monthly contribution model, not a forecast or valuation. It does not prove legal enforceability, participant behavior, credit performance, demand response, tax treatment, timing of cash flows, or the completeness of cost inputs.</p><p>Shock thresholds show the boundary under unchanged inputs. Compound case counts describe only the selected discrete combinations. Neither assigns probability or cause. Currency codes are display prefixes only and are not converted.</p></div></section></section>`;
}

function render() {
  clearPartnershipReview();
  const casesOpen = app.querySelector?.('.case-details')?.open;
  invalidFieldCount = 0;
  let result = null;
  try { result = calculatePartnership(displayState()); } catch (error) {
    if (!(error instanceof ValidationError)) throw error;
  }
  const inputs = inputPanel(result);
  const results = resultsPanel(result);
  app.innerHTML = `${coachOverlay()}${helpDialog()}${invalidSummary()}<div class="app-grid${printRedacted ? ' print-redacted' : ''}">${inputs}${results}</div>`;
  attachEvents();
  if (casesOpen && app.querySelector?.('.case-details')) app.querySelector('.case-details').open = true;
  if (result) drawSensitivityChart(sensitivityGrid());
  if (dialogNeedsInitialFocus) {
    dialogNeedsInitialFocus = false;
    if (coachVisible) app.querySelector?.('[data-action="dismiss-coach"]')?.focus();
    else if (helpOpen) app.querySelector?.('[data-action="close-help"]')?.focus();
  }
  if (pendingNotice) {
    const message = pendingNotice;
    pendingNotice = '';
    setNotice(message);
  }
}

function getPath(path) {
  return path.split('.').reduce((object, key) => object[key], state);
}

function setPath(path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const parent = keys.reduce((object, key) => object[key], state);
  parent[last] = value;
}

function refresh(message = '') {
  const focusedPath = document.activeElement?.dataset?.path;
  const focusedAction = document.activeElement?.dataset?.action;
  const focusedCase = document.activeElement?.dataset?.caseId;
  saveState();
  render();
  if (focusedPath) {
    const replacement = [...app.querySelectorAll('[data-path]')].find((node) => node.dataset.path === focusedPath);
    replacement?.focus({ preventScroll: true });
  } else if (focusedAction) {
    [...app.querySelectorAll('button[data-action]')].find((button) => button.dataset.action === focusedAction && button.dataset.caseId === focusedCase)?.focus({ preventScroll: true });
  }
  setNotice(message);
}

function attachEvents() {
  if (eventsBound) return;
  eventsBound = true;
  app.addEventListener('change', (event) => {
    const input = event.target;
    const isField = input instanceof HTMLInputElement
      || (typeof HTMLTextAreaElement === 'function' && input instanceof HTMLTextAreaElement);
    if (!isField) return;
    if (input.dataset.action === 'case-name') { caseName = input.value; return; }
    if (input.dataset.action === 'roster-paste') { rosterPasteText = input.value; return; }
    if (input.dataset.path) {
      checkpoint();
      if (input.dataset.type === 'text') {
        const trimmed = input.value.trim();
        if (input.dataset.optional === 'true' && trimmed === '') {
          const keys = input.dataset.path.split('.');
          const last = keys.pop();
          const parent = keys.reduce((object, key) => object[key], state);
          delete parent[last];
        } else {
          setPath(input.dataset.path, trimmed);
        }
      } else {
        setPath(input.dataset.path, numberFromInput(input.value, input.dataset.optional === 'true'));
      }
      activePreset = '';
      const validation = validateConfiguration(state);
      refresh(validation.valid
        ? (standaloneFileMode ? 'Saved locally. Export JSON to transfer this standalone case.' : 'Saved locally and updated the shareable URL.')
        : `Invalid inputs are not saved. ${summarizeErrors(validation.errors)}`);
      return;
    }
    if (input.dataset.action === 'import' && input.files?.[0]) importFile(input.files[0]);
    if (input.dataset.action === 'compare-import' && input.files?.[0]) importCompareFile(input.files[0]);
    if (input.dataset.action === 'import-participants-csv' && input.files?.[0]) importParticipantCsv(input.files[0]);
  });
  app.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'focus-invalid') {
      const input = app.querySelector('input[aria-invalid="true"]');
      const details = input?.closest?.('details');
      if (details) details.open = true;
      input?.focus();
      return;
    }
    if (action === 'dismiss-coach') { dismissCoach(); return; }
    if (action === 'show-coach') {
      rememberDialogOpener(button);
      coachVisible = true;
      helpOpen = false;
      dialogNeedsInitialFocus = true;
      render();
      return;
    }
    if (action === 'open-help') {
      rememberDialogOpener(button);
      helpOpen = true;
      dialogNeedsInitialFocus = true;
      render();
      return;
    }
    if (action === 'close-help') { closeHelp(); return; }
    if (action === 'print-report') {
      printOnePager();
      return;
    }
    if (action === 'print-redacted') {
      if (!validateConfiguration(state).valid) { setNotice('Resolve invalid inputs before printing a redacted report.'); return; }
      printRedacted = true;
      render();
      window.print();
      printRedacted = false;
      render();
      return;
    }
    if (action === 'inspect-stress') { stressPreviewId = button.dataset.scenarioId; render(); document.querySelector('#stress-preview-title')?.focus(); return; }
    if (action === 'close-stress-preview') { stressPreviewId = ''; render(); return; }
    if (action === 'solve-share-hold') { previewShareHold(button.dataset.participantId); return; }
    if (action === 'apply-share-hold') { applyShareHold(); return; }
    if (action === 'close-share-hold') { shareHoldPreview = null; render(); return; }
    if (action === 'solve-volume-hold') { previewVolumeHold(button.dataset.participantId); return; }
    if (action === 'apply-volume-hold') { applyVolumeHold(); return; }
    if (action === 'close-volume-hold') { volumeHoldPreview = null; render(); return; }
    if (action === 'close-brief-copy') { briefCopyText = ''; render(); return; }
    if (action === 'close-csv-copy') { csvCopyText = ''; render(); return; }
    if (action === 'close-breakpoint-copy') { breakpointCopyText = ''; render(); return; }
    if (action === 'solve-fee-hold') { previewFeeHold(); return; }
    if (action === 'apply-fee-hold') { applyFeeHold(); return; }
    if (action === 'close-fee-hold') { feeHoldPreview = null; render(); return; }
    if (action === 'apply-stress-case') { applyInspectedStressCase(); return; }
    if (action === 'mute-stress-row') {
      mutedStressIds.add(button.dataset.participantId);
      render();
      return;
    }
    if (action === 'unmute-stress-row') {
      mutedStressIds.delete(button.dataset.participantId);
      render();
      return;
    }
    if (action === 'collapse-all-hold-cases') {
      collapseAllHoldCases = true;
      render();
      return;
    }
    if (action === 'expand-all-hold-cases') {
      collapseAllHoldCases = false;
      render();
      return;
    }
    if (action === 'hide-holding-participants') {
      if (!validateConfiguration(state).valid) {
        setNotice('Resolve invalid inputs before hiding participants who currently hold.');
        return;
      }
      hideHoldingParticipants = true;
      render();
      return;
    }
    if (action === 'show-holding-participants') {
      hideHoldingParticipants = false;
      render();
      return;
    }
    if (action === 'compare-case') { comparisonId = button.dataset.caseId; render(); document.querySelector('#comparison-title')?.focus(); return; }
    if (action === 'pin-first') {
      pinFirstId = pinFirstId === button.dataset.caseId ? '' : button.dataset.caseId;
      render();
      document.querySelector('#three-compare-title')?.focus();
      return;
    }
    if (action === 'pin-second') {
      pinSecondId = pinSecondId === button.dataset.caseId ? '' : button.dataset.caseId;
      render();
      document.querySelector('#three-compare-title')?.focus();
      return;
    }
    if (action === 'clear-three-compare') { pinFirstId = ''; pinSecondId = ''; render(); return; }
    if (action === 'clear-imported-compare') { importedCompare = null; render(); return; }
    if (action === 'clear-comparison') { comparisonId = ''; render(); return; }
    if (['save-case', 'load-case', 'remove-case', 'restore-case', 'duplicate-case'].includes(action)) { handleLibraryAction(action, button.dataset.caseId); return; }
    if (action === 'undo' || action === 'redo') { travelHistory(action); return; }
    if (action === 'edit-stress-settings') {
      app.querySelector('input[data-path="stress.volumeDropPct"]')?.focus();
    }
    if (action === 'preset') {
      checkpoint();
      activePreset = button.dataset.preset;
      state = withStress(clonePreset(activePreset));
      refresh(`${PRESETS[activePreset].name} loaded.`);
    }
    if (action === 'add-participant' && state.participants.length < MAX_PARTICIPANTS) {
      checkpoint();
      participantSequence += 1;
      state.participants.push(makeParticipant(nextParticipantId()));
      activePreset = '';
      refresh('Participant added. Set shares to reconcile to 1.');
    }
    if (action === 'duplicate-participant') {
      try {
        const next = duplicateParticipant(state.participants, Number(button.dataset.index));
        checkpoint();
        state.participants = next;
        activePreset = '';
        refresh('Participant duplicated with a unique id and a zero share so the current allocation still sums to the same total.');
      } catch (error) {
        if (!(error instanceof ValidationError)) throw error;
        setNotice(`Duplicate rejected: ${summarizeErrors(error.errors)}`);
      }
    }
    if (action === 'move-participant-up' || action === 'move-participant-down') {
      const direction = action === 'move-participant-up' ? 'up' : 'down';
      const next = moveParticipant(state.participants, Number(button.dataset.index), direction);
      const unchanged = next.every((item, index) => item.id === state.participants[index].id);
      if (unchanged) return;
      checkpoint();
      state.participants = next;
      activePreset = '';
      refresh(direction === 'up' ? 'Participant moved up. Shares are unchanged.' : 'Participant moved down. Shares are unchanged.');
    }
    if (action === 'remove-participant' && state.participants.length > 2) {
      try {
        const removed = state.participants[Number(button.dataset.index)];
        const next = dropAndReallocate(state.participants, Number(button.dataset.index));
        checkpoint();
        state.participants = next;
        activePreset = '';
        const sharePct = Number.isFinite(removed.revenueShare) ? formatPct(removed.revenueShare * 100) : 'their share';
        refresh(`Removed ${removed.name}. ${sharePct} was reallocated across the remaining participants in proportion to their current shares.`);
      } catch (error) {
        if (!(error instanceof ValidationError)) throw error;
        setNotice(`Remove rejected: ${summarizeErrors(error.errors)}`);
      }
    }
    if (action === 'equal-shares' || action === 'normalize-shares') reconcileShares(action);
    if (action === 'export') exportFile();
    if (action === 'export-redacted') exportRedactedFile();
    if (action === 'export-report') exportReport();
    if (action === 'copy-brief') copyNegotiationBrief();
    if (action === 'copy-first-breakpoint') copyFirstBreakpoint();
    if (action === 'copy-share-url') copyShareUrl();
    if (action === 'export-csv') exportStressCsv(false);
    if (action === 'export-visible-csv') exportStressCsv(true);
    if (action === 'copy-visible-csv') copyVisibleStressCsv();
    if (action === 'export-participants-csv') exportParticipantsCsv();
    if (action === 'import-roster-paste') importPastedRoster();
    if (action === 'export-tornado-svg') exportTornadoSvg();
    if (action === 'export-waterfall-svg') exportWaterfallSvg();
    if (action === 'apply-stress-proposal') {
      try {
        const proposal = applyStressProposal(state);
        checkpoint();
        state = proposal;
        activePreset = '';
        refresh('Tested revenue split applied. Every selected compound case was rechecked.');
      } catch (error) {
        if (!(error instanceof ValidationError)) throw error;
        refresh(`Apply tested revenue split rejected: ${summarizeErrors(error.errors)}`);
      }
    }
    if (action === 'reset') {
      checkpoint();
      activePreset = 'balanced';
      state = withStress(clonePreset('balanced'));
      refresh('Reset to Balanced.');
    }
  });
}

function caseExportTitle() {
  return typeof state.deal.title === 'string' ? state.deal.title : '';
}

function printOnePager() {
  if (!validateConfiguration(state).valid) { setNotice('Resolve invalid inputs before printing.'); return; }
  printRedacted = false;
  window.print();
}

function exportFile() {
  const validation = validateConfiguration(state);
  if (!validation.valid) {
    setNotice(`Resolve invalid inputs before exporting. ${summarizeErrors(validation.errors)}`);
    return;
  }
  const blob = new Blob([`${JSON.stringify(state, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = exportDownloadName('json', caseExportTitle());
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  setNotice('JSON exported.');
}

function exportRedactedFile() {
  const validation = validateConfiguration(state);
  if (!validation.valid) {
    setNotice(`Resolve invalid inputs before exporting. ${summarizeErrors(validation.errors)}`);
    return;
  }
  const redacted = redactConfiguration(state);
  downloadText(`${JSON.stringify(redacted, null, 2)}\n`, 'application/json', exportDownloadName('redacted', caseExportTitle()));
  setNotice('Redacted JSON exported. Participant names are Participant 1 through N and the deal title is cleared. Identifiers and economics are unchanged.');
}

function importFile(file) {
  const sequence = ++importSequence;
  if (file.size === 0) {
    setNotice('Import rejected: the file is empty.');
    return;
  }
  if (file.size > 250_000) {
    setNotice('Import rejected: files must be 250 KB or smaller.');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    if (sequence !== importSequence) return;
    const text = String(reader.result ?? '').trim();
    if (!text) {
      setNotice('Import rejected: the file is empty.');
      return;
    }
    try {
      const candidate = JSON.parse(text);
      const validation = validateConfiguration(candidate);
      if (!validation.valid) throw new ValidationError(validation.errors);
      checkpoint();
      state = withStress(candidate);
      activePreset = '';
      refresh('JSON imported.');
    } catch (error) {
      if (error instanceof ValidationError) {
        setNotice(`Import rejected: ${summarizeErrors(error.errors)}`);
        return;
      }
      setNotice(`Import rejected: ${describeJsonFailure('the file', error)}`);
    }
  };
  reader.onerror = () => {
    if (sequence !== importSequence) return;
    const detail = compactErrorMessage(reader.error);
    setNotice(detail ? `Import rejected: file could not be read (${detail}).` : 'Import rejected: file could not be read.');
  };
  reader.readAsText(file);
}

function importCompareFile(file) {
  const sequence = ++importSequence;
  if (file.size === 0) {
    setNotice('Compare rejected: the file is empty.');
    return;
  }
  if (file.size > 250_000) {
    setNotice('Compare rejected: files must be 250 KB or smaller.');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    if (sequence !== importSequence) return;
    const text = String(reader.result ?? '').trim();
    if (!text) {
      setNotice('Compare rejected: the file is empty.');
      return;
    }
    try {
      const candidate = JSON.parse(text);
      const validation = validateConfiguration(candidate);
      if (!validation.valid) throw new ValidationError(validation.errors);
      importedCompare = { config: withStress(candidate), name: typeof file.name === 'string' && file.name.trim() ? file.name.trim().slice(0, 80) : 'Imported JSON' };
      render();
      document.querySelector('#imported-compare-title')?.focus();
      setNotice('Imported JSON compared with the current draft. The current case is unchanged. Different identifiers are labeled, not filled with zeros.');
    } catch (error) {
      if (error instanceof ValidationError) {
        setNotice(`Compare rejected: ${summarizeErrors(error.errors)}`);
        return;
      }
      setNotice(`Compare rejected: ${describeJsonFailure('the file', error)}`);
    }
  };
  reader.onerror = () => {
    if (sequence !== importSequence) return;
    const detail = compactErrorMessage(reader.error);
    setNotice(detail ? `Compare rejected: file could not be read (${detail}).` : 'Compare rejected: file could not be read.');
  };
  reader.readAsText(file);
}

function importParticipantCsv(file) {
  const sequence = ++importSequence;
  if (file.size === 0) {
    setNotice('Participant CSV rejected: the file is empty.');
    return;
  }
  if (file.size > 250_000) {
    setNotice('Participant CSV rejected: files must be 250 KB or smaller.');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    if (sequence !== importSequence) return;
    const text = String(reader.result ?? '');
    try {
      const participants = participantsFromCsv(text);
      checkpoint();
      state.participants = participants;
      activePreset = '';
      refresh('Participant roster replaced from CSV. Deal terms are unchanged.');
    } catch (error) {
      if (error instanceof ValidationError) {
        setNotice(`Participant CSV rejected: ${summarizeErrors(error.errors)}`);
        return;
      }
      setNotice(`Participant CSV rejected: ${describeJsonFailure('the file', error)}`);
    }
  };
  reader.onerror = () => {
    if (sequence !== importSequence) return;
    const detail = compactErrorMessage(reader.error);
    setNotice(detail ? `Participant CSV rejected: file could not be read (${detail}).` : 'Participant CSV rejected: file could not be read.');
  };
  reader.readAsText(file);
}

function importPastedRoster() {
  try {
    const participants = participantsFromRosterText(rosterPasteText);
    checkpoint();
    state.participants = participants;
    activePreset = '';
    rosterPasteText = '';
    refresh('Participant roster replaced from pasted CSV or TSV. Deal terms are unchanged.');
  } catch (error) {
    if (error instanceof ValidationError) {
      setNotice(`Pasted roster rejected: ${summarizeErrors(error.errors)}`);
      return;
    }
    setNotice(`Pasted roster rejected: ${describeJsonFailure('the pasted text', error)}`);
  }
}

function nextParticipantId() {
  while (state.participants.some((participant) => participant.id === `participant-${participantSequence}`)) {
    participantSequence += 1;
  }
  return `participant-${participantSequence}`;
}

function drawSensitivityChart(grid) {
  const canvas = document.querySelector('#sensitivity-canvas');
  const context = canvas?.getContext('2d');
  if (!canvas || !context) return;
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(320, Math.round(bounds.width * pixelRatio));
  canvas.height = Math.round(canvas.width * 0.7);
  context.scale(pixelRatio, pixelRatio);
  const width = canvas.width / pixelRatio;
  const height = canvas.height / pixelRatio;
  const margin = { top: 25, right: 14, bottom: 39, left: 49 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const cellWidth = chartWidth / grid.volumes.length;
  const cellHeight = chartHeight / grid.fees.length;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  grid.cells.forEach((row, y) => row.forEach((viable, x) => {
    context.fillStyle = viable ? '#1558d6' : '#d94f3d';
    context.fillRect(margin.left + x * cellWidth, margin.top + y * cellHeight, cellWidth - 1, cellHeight - 1);
  }));
  context.strokeStyle = '#1f2328';
  context.lineWidth = 1;
  context.strokeRect(margin.left, margin.top, chartWidth, chartHeight);
  context.fillStyle = '#1f2328';
  context.font = '11px ui-sans-serif, system-ui';
  context.textAlign = 'center';
  grid.volumes.forEach((volume, index) => context.fillText(formatNumber(volume), margin.left + (index + .5) * cellWidth, height - 16));
  context.save();
  context.translate(14, margin.top + chartHeight / 2);
  context.rotate(-Math.PI / 2);
  context.fillText('Fee / transaction', 0, 0);
  context.restore();
  context.textAlign = 'center';
  context.fillText('Monthly volume', margin.left + chartWidth / 2, height - 2);
  context.textAlign = 'right';
  grid.fees.forEach((fee, index) => context.fillText(formatNumber(fee, 3), margin.left - 6, margin.top + (index + .5) * cellHeight + 4));
}

window.addEventListener('keydown', (event) => {
  if ((coachVisible || helpOpen) && event.key === 'Tab') {
    trapDialogTab(event);
    return;
  }
  if (event.key === 'Escape') {
    if (helpOpen) { closeHelp(); return; }
    if (coachVisible) { dismissCoach(); return; }
    return;
  }
  const tag = event.target?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.target?.isContentEditable) return;
  if (event.key === '?' || (event.key === '/' && event.shiftKey)) {
    if (coachVisible) return;
    if (helpOpen) closeHelp();
    else {
      rememberDialogOpener(event.target);
      helpOpen = true;
      dialogNeedsInitialFocus = true;
      render();
    }
    return;
  }
  if (event.key === 'u' || event.key === 'U') { travelHistory('undo'); return; }
  if (event.key === 'r' || event.key === 'R') { travelHistory('redo'); return; }
  if (event.key === 'e' || event.key === 'E') exportFile();
  if (event.key === 'g' || event.key === 'G') {
    const jump = document.querySelector('#results-jump');
    const start = jump ?? document.querySelector('#results-start');
    start?.focus?.({ preventScroll: false });
    start?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === 'n' || event.key === 'N') {
    const add = document.querySelector('#add-participant');
    if (add) {
      add.focus?.({ preventScroll: false });
      add.scrollIntoView?.({ block: 'start' });
      return;
    }
    if (state.participants.length < MAX_PARTICIPANTS) {
      checkpoint();
      participantSequence += 1;
      state.participants.push(makeParticipant(nextParticipantId()));
      activePreset = '';
      refresh('Participant added. Set shares to reconcile to 1.');
    }
  }
  if (event.key === 's' || event.key === 'S') {
    const target = document.querySelector('#share-hold-title') ?? document.querySelector('#share-hold-jump');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === 'c' || event.key === 'C') {
    const target = document.querySelector('#imported-compare-title')
      ?? document.querySelector('#comparison-title')
      ?? document.querySelector('#three-compare-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === 'p' || event.key === 'P') printOnePager();
});

window.addEventListener('resize', () => {
  if (validateConfiguration(state).valid) drawSensitivityChart(sensitivityGrid());
});

window.addEventListener('hashchange', () => {
  const shared = decodeHash(window.location.hash);
  if (shared.kind === 'none') return;
  if (shared.kind !== 'ok') {
    saveState();
    setNotice(shared.reason
      ? `Share link could not be loaded. The current case is unchanged. ${shared.reason}`
      : 'Share link could not be loaded. The current case is unchanged.');
    return;
  }
  importSequence += 1;
  checkpoint();
  state = withStress(shared.config);
  activePreset = '';
  refresh('Shared case loaded.');
});

render();

function comparisonSection(current) {
  const snapshot = caseLibrary.find((item) => item.id === comparisonId);
  if (!snapshot) return '';
  const baseline = calculatePartnership(snapshot.config);
  const baselineStress = evaluateStressGrid(snapshot.config);
  const currentStress = evaluateStressGrid(state);
  const ids = [...new Set([...baseline.participants.map((item) => item.id), ...current.participants.map((item) => item.id)])];
  const rows = ids.map((id) => {
    const before = baseline.participants.find((item) => item.id === id);
    const after = current.participants.find((item) => item.id === id);
    const delta = before && after ? after.monthlyProfit - before.monthlyProfit : null;
    const deltaClass = delta == null || Math.abs(delta) <= 1e-9 ? '' : delta > 0 ? 'diff-up' : 'diff-down';
    const viabilityChanged = Boolean(before && after && before.viable !== after.viable);
    return `<tr class="${viabilityChanged ? 'diff-changed' : ''}"><th scope="row">${escapeAttribute(after?.name ?? before.name)}</th><td>${before ? formatMoney(before.monthlyProfit) : 'Added'}</td><td>${after ? formatMoney(after.monthlyProfit) : 'Removed'}</td><td class="${deltaClass}">${before && after ? formatMoney(delta) : 'n/a'}</td><td>${before ? before.viable ? 'Holds' : 'Exits' : 'n/a'} to ${after ? after.viable ? 'Holds' : 'Exits' : 'n/a'}</td></tr>`;
  }).join('');
  const profitDelta = current.totalProfit - baseline.totalProfit;
  const profitClass = Math.abs(profitDelta) <= 1e-9 ? '' : profitDelta > 0 ? 'diff-up' : 'diff-down';
  return `<section class="panel" aria-labelledby="comparison-title"><div class="panel-heading"><h2 id="comparison-title" tabindex="-1">Compare with ${escapeAttribute(snapshot.name)}</h2><button type="button" data-action="clear-comparison">Close comparison</button></div><div class="panel-body"><p>Total monthly profit change: <strong class="${profitClass}">${formatMoney(profitDelta)}</strong>. Effective volume change: ${formatNumber(current.effectiveVolume - baseline.effectiveVolume)} txn.</p><p>Snapshot stress cases held: ${baselineStress.passCount} / ${baselineStress.caseCount}. Current: ${currentStress.passCount} / ${currentStress.caseCount}. Each uses its own stress settings, so counts may not be directly comparable. Profit decreases are highlighted; increases use a cooler fill. This is a difference table, not a judgement of which case is better.</p></div><div class="table-wrap" tabindex="0" role="region" aria-label="Case comparison"><table><caption>Current minus snapshot. Participants matched by stable identifier. Highlighted profit cells changed.</caption><thead><tr><th scope="col">Participant</th><th scope="col">Snapshot profit</th><th scope="col">Current profit</th><th scope="col">Profit change</th><th scope="col">Exit test</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}

function snapshotCell(column) {
  if (!column) return '<td>Not in this roster</td><td>n/a</td>';
  return `<td>${formatMoney(column.monthlyProfit)}</td><td class="${column.viable ? 'pass-text' : 'failure-text'}">${column.viable ? 'Holds' : 'Fails'}</td>`;
}

function threeCompareSection(current) {
  const firstItem = caseLibrary.find((item) => item.id === pinFirstId);
  const secondItem = caseLibrary.find((item) => item.id === pinSecondId);
  if (!firstItem && !secondItem) return '';
  if (!firstItem || !secondItem) {
    return `<section class="panel" aria-labelledby="three-compare-title"><div class="panel-heading"><h2 id="three-compare-title" tabindex="-1">Three-snapshot compare</h2><button type="button" data-action="clear-three-compare">Clear pins</button></div><div class="panel-body"><p>Pin two saved snapshots to compare them with the current draft. ${firstItem ? `First pin: ${escapeAttribute(firstItem.name)}.` : 'First pin is empty.'} ${secondItem ? `Second pin: ${escapeAttribute(secondItem.name)}.` : 'Second pin is empty.'}</p></div></section>`;
  }
  const compared = compareThreeSnapshots(state, firstItem.config, secondItem.config);
  const rosterNote = compared.sameRoster
    ? 'All three cases share the same participant identifiers.'
    : 'Participant sets differ. Rows that are missing from a case are labeled Not in this roster rather than filled with a zero.';
  const rows = compared.rows.map((row) => `<tr class="${row.rosterMismatch ? 'diff-changed' : ''}"><th scope="row">${escapeAttribute(row.name)}${row.rosterMismatch ? ' <span class="optional">roster mismatch</span>' : ''}</th>${snapshotCell(row.first)}${snapshotCell(row.second)}${snapshotCell(row.current)}</tr>`).join('');
  return `<section class="panel" aria-labelledby="three-compare-title"><div class="panel-heading"><h2 id="three-compare-title" tabindex="-1">Three-snapshot compare</h2><button type="button" data-action="clear-three-compare">Clear pins</button></div><div class="panel-body"><p>First pin: <strong>${escapeAttribute(firstItem.name)}</strong> (${compared.firstViable ? 'holds' : 'exits'}, ${formatMoney(compared.firstTotalProfit)} total profit). Second pin: <strong>${escapeAttribute(secondItem.name)}</strong> (${compared.secondViable ? 'holds' : 'exits'}, ${formatMoney(compared.secondTotalProfit)}). Current draft (${compared.currentViable ? 'holds' : 'exits'}, ${formatMoney(compared.currentTotalProfit)}).</p><p>${rosterNote} This is a difference table, not a ranking of which case is better.</p></div><div class="table-wrap" tabindex="0" role="region" aria-label="Three-snapshot comparison"><table><caption>Profit and hold or fail for two pinned snapshots plus the current draft. Participants matched by identifier.</caption><thead><tr><th scope="col">Participant</th><th scope="col">${escapeAttribute(firstItem.name)} profit</th><th scope="col">${escapeAttribute(firstItem.name)} exit</th><th scope="col">${escapeAttribute(secondItem.name)} profit</th><th scope="col">${escapeAttribute(secondItem.name)} exit</th><th scope="col">Current profit</th><th scope="col">Current exit</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}

function importedCompareSection() {
  if (!importedCompare) return '';
  if (!validateConfiguration(state).valid) {
    return `<section class="panel" aria-labelledby="imported-compare-title"><div class="panel-heading"><h2 id="imported-compare-title" tabindex="-1">Compare with imported JSON</h2><button type="button" data-action="clear-imported-compare">Close comparison</button></div><div class="panel-body"><p>Resolve invalid inputs on the current draft to compare it with <strong>${escapeAttribute(importedCompare.name)}</strong>. The current case is unchanged.</p></div></section>`;
  }
  const compared = compareImportedCase(state, importedCompare.config);
  const rosterNote = compared.sameRoster
    ? 'Both cases share the same participant identifiers.'
    : 'Participant sets differ. Missing identifiers are labeled Not in this roster rather than filled with a zero.';
  const rows = compared.rows.map((row) => {
    const delta = row.current && row.imported ? row.current.monthlyProfit - row.imported.monthlyProfit : null;
    const deltaClass = delta == null || Math.abs(delta) <= 1e-9 ? '' : delta > 0 ? 'diff-up' : 'diff-down';
    return `<tr class="${row.rosterMismatch ? 'diff-changed' : ''}"><th scope="row">${escapeAttribute(row.name)}${row.rosterMismatch ? ' <span class="optional">roster mismatch</span>' : ''}</th>${snapshotCell(row.imported)}${snapshotCell(row.current)}<td class="${deltaClass}">${row.current && row.imported ? formatMoney(delta) : 'n/a'}</td></tr>`;
  }).join('');
  return `<section class="panel" aria-labelledby="imported-compare-title"><div class="panel-heading"><h2 id="imported-compare-title" tabindex="-1">Compare with imported JSON</h2><button type="button" data-action="clear-imported-compare">Close comparison</button></div><div class="panel-body"><p>Imported file: <strong>${escapeAttribute(importedCompare.name)}</strong> (${compared.importedViable ? 'holds' : 'exits'}, ${formatMoney(compared.importedTotalProfit)} total profit). Current draft (${compared.currentViable ? 'holds' : 'exits'}, ${formatMoney(compared.currentTotalProfit)}).</p><p>${rosterNote} This is a difference table, not a ranking of which case is better. The current case was not replaced.</p></div><div class="table-wrap" tabindex="0" role="region" aria-label="Imported JSON comparison"><table><caption>Current minus imported JSON. Participants matched by identifier. Missing identifiers are labeled, not zero-filled.</caption><thead><tr><th scope="col">Participant</th><th scope="col">Imported profit</th><th scope="col">Imported exit</th><th scope="col">Current profit</th><th scope="col">Current exit</th><th scope="col">Profit change</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}

function reportText(value) {
  return String(value).replace(/[\r\n\t]/g, ' ').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\\`*_[\]{}()#+!|]/g, (character) => '\\' + character);
}

function decisionReport(config, title = 'Current case') {
  const result = calculatePartnership(config);
  const stress = evaluateStressGrid(config);
  const lines = ['# Partnership Breakpoint decision report', '', 'Case: ' + reportText(title), '',
    ...(config.deal.notes ? ['Notes: ' + reportText(config.deal.notes), ''] : []),
    'Deterministic monthly contribution analysis. All money uses one consistent currency unit.', '',
    '## Current outcome', '',
    'Partnership: ' + (result.viable ? 'all participants hold' : 'at least one participant exits') + '.',
    'Effective volume: ' + result.effectiveVolume + ' transactions per month.',
    'Total revenue: ' + result.totalRevenue + ' units. Total participant profit: ' + result.totalProfit + ' units.', '',
    '| Participant | Monthly profit | Minimum profit | Outcome |', '| --- | ---: | ---: | --- |',
    ...result.participants.map((item, index) => '| ' + reportText(item.name) + ' | ' + item.monthlyProfit + ' | ' + config.participants[index].minimumAcceptableProfit + ' | ' + reportText(item.viable ? 'Holds' : item.failureReasons.join('; ')) + ' |'), '',
    '## Compound stress evidence', '',
    stress.passCount + ' of ' + stress.caseCount + ' selected cases hold. Counts are not probabilities.',
    'Negotiation status: ' + stress.negotiation.status + '.', '',
    ...stress.scenarios.map((scenario) => '- ' + scenario.id + ': volume ' + scenario.volume + ', fee ' + scenario.fee + ', total profit ' + scenario.totalProfit + '. ' + reportText(scenario.viable ? 'All participants hold.' : scenario.participants.filter((item) => !item.viable).map((item) => item.name + ': ' + item.failureReasons.join('; ')).join(' / '))), '',
    '## Limits', '',
    'These inputs are assumptions, not verified commercial terms. Results do not establish demand, legal enforceability, credit performance, taxes, cash-flow timing, or participant behavior. Discrete stress cases do not cover every possible future.', '',
    '## Reproducible case JSON', '', '```json', JSON.stringify(config, null, 2), '```', ''];
  return lines.join('\n');
}

function downloadText(contents, type, filename) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportReport() {
  const validation = validateConfiguration(state);
  if (!validation.valid) { setNotice('Resolve invalid inputs before exporting a report. ' + summarizeErrors(validation.errors)); return; }
  downloadText(decisionReport(state, caseName.trim() || 'Current case'), 'text/markdown;charset=utf-8', exportDownloadName('report', caseExportTitle()));
  setNotice('Decision report exported with assumptions and reproducible case JSON.');
}

function negotiationBrief(config, title = 'Current case') {
  const result = calculatePartnership(config);
  const stress = evaluateStressGrid(config);
  const breakpoint = result.firstBreakpoint;
  const unit = config.deal.currency && /^[A-Z]{3}$/.test(config.deal.currency) ? config.deal.currency : 'units';
  const breakpointLine = !breakpoint?.participant
    ? 'No bounded adverse shock is available under the current inputs.'
    : breakpoint.status === 'already-failing'
      ? reportText(breakpoint.participant.name) + ' is already failing an exit criterion.'
      : 'Protect ' + reportText(breakpoint.participant.name) + ' first. Direction: ' + shockLabel(breakpoint.kind) + '. Status: ' + breakpoint.status + '.';
  return [
    '# Partnership Breakpoint negotiation brief', '',
    'Case: ' + reportText(title), '',
    ...(config.deal.notes ? ['Notes: ' + reportText(config.deal.notes), ''] : []),
    'Deterministic monthly contribution snapshot. Money uses ' + unit + '. This is not a forecast or a recommendation.', '',
    '## Outcome',
    result.viable ? 'Every participant holds at current inputs.' : 'At least one participant exits at current inputs.',
    'Effective volume: ' + result.effectiveVolume + ' transactions per month.',
    'Total participant profit: ' + result.totalProfit + ' ' + unit + '.', '',
    '## Weakest participant (volume headroom)',
    reportText(result.weakestParticipant.name) + ' is nearest its ' + result.weakestParticipant.bindingConstraint.label + ' limit. Exit test: ' + reportText(result.weakestParticipant.viable ? 'holds' : result.weakestParticipant.failureReasons.join('; ')) + '.', '',
    '## First breakpoint (relative adverse movement)',
    breakpointLine, '',
    '## Participant profit',
    ...result.participants.map((item) => '- ' + reportText(item.name) + ': ' + item.monthlyProfit + ' ' + unit + ' (' + (item.viable ? 'holds' : 'exits') + ')'), '',
    '## Compound cases',
    stress.passCount + ' of ' + stress.caseCount + ' selected cases hold. Counts are not probabilities. Negotiation status: ' + stress.negotiation.status + '.', '',
    '## Limits',
    'Assumptions are user-entered. Results do not prove demand, legal enforceability, credit, taxes, cash-flow timing, or participant behavior.', '',
  ].join('\n');
}

function copyShareUrl() {
  if (standaloneFileMode) {
    setNotice('Share URLs are not available in standalone file mode. Export JSON to transfer this case.');
    return;
  }
  const validation = validateConfiguration(state);
  if (!validation.valid) {
    setNotice(`Resolve invalid inputs before copying a share URL. ${summarizeErrors(validation.errors)}`);
    return;
  }
  saveState();
  const url = String(window.location.href || '');
  const clipboard = globalThis.navigator?.clipboard;
  if (clipboard && typeof clipboard.writeText === 'function') {
    Promise.resolve(clipboard.writeText(url)).then(() => {
      setNotice('Share URL copied. The link loads this case locally; no server stores it.');
    }).catch(() => {
      setNotice(`Clipboard unavailable. Share URL: ${url}`);
    });
    return;
  }
  setNotice(`Clipboard unavailable. Share URL: ${url}`);
}

function showBriefCopyFallback(text, message) {
  briefCopyText = text;
  render();
  document.querySelector('#brief-copy-text')?.focus();
  setNotice(message);
}

function briefCopySection() {
  if (!briefCopyText) return '';
  return `<section class="panel" aria-labelledby="brief-copy-title"><div class="panel-heading"><h2 id="brief-copy-title">Negotiation brief</h2><button type="button" data-action="close-brief-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it.</p><label class="brief-copy-label" for="brief-copy-text">Markdown negotiation brief</label><textarea id="brief-copy-text" readonly rows="16">${escapeAttribute(briefCopyText)}</textarea></div></section>`;
}

function showCsvCopyFallback(text, message) {
  csvCopyText = text;
  render();
  document.querySelector('#csv-copy-text')?.focus();
  setNotice(message);
}

function csvCopySection() {
  if (!csvCopyText) return '';
  return `<section class="panel" aria-labelledby="csv-copy-title"><div class="panel-heading"><h2 id="csv-copy-title">Visible stress CSV</h2><button type="button" data-action="close-csv-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the CSV below and copy it. This is the currently visible stress grid, not every tested case.</p><label class="brief-copy-label" for="csv-copy-text">Visible stress-grid CSV</label><textarea id="csv-copy-text" readonly rows="16">${escapeAttribute(csvCopyText)}</textarea></div></section>`;
}

function copyVisibleStressCsv() {
  const validation = validateConfiguration(state);
  if (!validation.valid) {
    setNotice('Resolve invalid inputs before copying visible stress CSV. ' + summarizeErrors(validation.errors));
    return;
  }
  const stress = evaluateStressGrid(state);
  const visible = visibleStressScenarios(stress);
  const text = stressGridCsv(state, { scenarioIds: visible.map((scenario) => scenario.id) });
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = `Visible stress CSV copied. ${visible.length} of ${stress.caseCount} tested cases included. Case counts are not probabilities.`;
  const fallbackNote = 'Clipboard unavailable. Copy the visible stress CSV from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          csvCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showCsvCopyFallback(text, fallbackNote);
        });
        return;
      }
      csvCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showCsvCopyFallback(text, fallbackNote);
      return;
    }
  }
  showCsvCopyFallback(text, fallbackNote);
}

function copyNegotiationBrief() {
  const validation = validateConfiguration(state);
  if (!validation.valid) {
    setNotice('Resolve invalid inputs before copying a brief. ' + summarizeErrors(validation.errors));
    return;
  }
  const title = (state.deal.title && state.deal.title.trim()) || caseName.trim() || 'Current case';
  const text = negotiationBrief(state, title);
  const clipboard = globalThis.navigator?.clipboard;
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          briefCopyText = '';
          render();
          setNotice('Negotiation brief copied as Markdown.');
        }).catch(() => {
          showBriefCopyFallback(text, 'Clipboard unavailable. Copy the Markdown from the text area.');
        });
        return;
      }
      briefCopyText = '';
      render();
      setNotice('Negotiation brief copied as Markdown.');
      return;
    } catch {
      showBriefCopyFallback(text, 'Clipboard unavailable. Copy the Markdown from the text area.');
      return;
    }
  }
  showBriefCopyFallback(text, 'Clipboard unavailable. Copy the Markdown from the text area.');
}

function firstBreakpointMarkdown(result) {
  const breakpoint = result.firstBreakpoint;
  const lines = ['# First breakpoint', ''];
  if (!breakpoint?.participant) {
    lines.push('No bounded adverse shock is available in the current inputs.');
  } else {
    const units = shockUnits(breakpoint.kind);
    const magnitude = breakpoint.status === 'already-failing' || breakpoint.status === 'at-breakpoint' || !breakpoint.shock
      ? compactShock(breakpoint.shock ?? { status: breakpoint.status, change: null, changePct: null }, units)
      : compactShock(breakpoint.shock, units);
    lines.push('Participant: ' + reportText(breakpoint.participant.name));
    lines.push('Shock axis: ' + shockLabel(breakpoint.kind));
    lines.push('Magnitude: ' + magnitude);
  }
  lines.push('');
  lines.push('This ranks the smallest percentage movement from the current scenario. It is a comparison aid, not a probability forecast.');
  lines.push('');
  return lines.join('\n');
}

function showBreakpointCopyFallback(text, message) {
  breakpointCopyText = text;
  render();
  document.querySelector('#breakpoint-copy-text')?.focus();
  setNotice(message);
}

function breakpointCopySection() {
  if (!breakpointCopyText) return '';
  return `<section class="panel" aria-labelledby="breakpoint-copy-title"><div class="panel-heading"><h2 id="breakpoint-copy-title">First breakpoint Markdown</h2><button type="button" data-action="close-breakpoint-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This is the displayed ranking, not a forecast.</p><label class="brief-copy-label" for="breakpoint-copy-text">First breakpoint Markdown</label><textarea id="breakpoint-copy-text" readonly rows="10">${escapeAttribute(breakpointCopyText)}</textarea></div></section>`;
}

function copyFirstBreakpoint() {
  const validation = validateConfiguration(state);
  if (!validation.valid) {
    setNotice('Resolve invalid inputs before copying the first breakpoint. ' + summarizeErrors(validation.errors));
    return;
  }
  const text = firstBreakpointMarkdown(calculatePartnership(state));
  const clipboard = globalThis.navigator?.clipboard;
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          breakpointCopyText = '';
          render();
          setNotice('First breakpoint copied as Markdown. It is a comparison aid, not a forecast.');
        }).catch(() => {
          showBreakpointCopyFallback(text, 'Clipboard unavailable. Copy the Markdown from the text area.');
        });
        return;
      }
      breakpointCopyText = '';
      render();
      setNotice('First breakpoint copied as Markdown. It is a comparison aid, not a forecast.');
      return;
    } catch {
      showBreakpointCopyFallback(text, 'Clipboard unavailable. Copy the Markdown from the text area.');
      return;
    }
  }
  showBreakpointCopyFallback(text, 'Clipboard unavailable. Copy the Markdown from the text area.');
}

function exportTornadoSvg() {
  const validation = validateConfiguration(state);
  if (!validation.valid) {
    setNotice('Resolve invalid inputs before downloading the tornado SVG. ' + summarizeErrors(validation.errors));
    return;
  }
  const result = calculatePartnership(state);
  downloadText(tornadoSvgFile(result), 'image/svg+xml;charset=utf-8', exportDownloadName('tornado', caseExportTitle()));
  setNotice('Tornado SVG downloaded. It ranks displayed movements and does not assign probability.');
}

function exportWaterfallSvg() {
  const validation = validateConfiguration(state);
  if (!validation.valid) {
    setNotice('Resolve invalid inputs before downloading the waterfall SVG. ' + summarizeErrors(validation.errors));
    return;
  }
  const result = calculatePartnership(state);
  downloadText(waterfallSvgFile(result), 'image/svg+xml;charset=utf-8', exportDownloadName('waterfall', caseExportTitle()));
  setNotice('Waterfall SVG downloaded. It shows contribution steps and does not assign probability.');
}

function exportParticipantsCsv() {
  const validation = validateConfiguration(state);
  if (!validation.valid) {
    setNotice('Resolve invalid inputs before exporting participant CSV. ' + summarizeErrors(validation.errors));
    return;
  }
  downloadText(participantsToCsv(state), 'text/csv;charset=utf-8', exportDownloadName('participants', caseExportTitle()));
  setNotice('Participant CSV exported. Columns match import. Formula-like names are stored as text.');
}

function exportStressCsv(visibleOnly = false) {
  const validation = validateConfiguration(state);
  if (!validation.valid) { setNotice('Resolve invalid inputs before exporting CSV. ' + summarizeErrors(validation.errors)); return; }
  const stress = evaluateStressGrid(state);
  const visible = visibleStressScenarios(stress);
  const options = visibleOnly ? { scenarioIds: visible.map((scenario) => scenario.id) } : undefined;
  const kind = visibleOnly ? 'csv-visible' : 'csv';
  downloadText(stressGridCsv(state, options), 'text/csv;charset=utf-8', exportDownloadName(kind, caseExportTitle()));
  if (visibleOnly) {
    setNotice(`Visible stress CSV exported. ${visible.length} of ${stress.caseCount} tested cases included. Case counts are not probabilities.`);
  } else {
    setNotice('Stress CSV exported. Each row is one participant in one selected case; case counts are not probabilities.');
  }
}

function feeRequirementsSection() {
  const guidance = calculateFeeRequirements(state);
  return `<section class="panel" aria-labelledby="fee-guidance-title"><div class="panel-heading"><h2 id="fee-guidance-title">Fee negotiation guide</h2><span class="optional">fixed volume and shares</span></div><div class="panel-body"><p>At ${formatVolume(guidance.volume)}, the mathematical fee floor for all participant profit requirements is <strong>${guidance.requiredFee === null ? 'unavailable within the input limits' : formatNumber(guidance.requiredFee, 6) + ' units / transaction'}</strong>.</p><p>${guidance.operationallyFeasible ? 'Current capacity and commitment tests hold.' : 'Fee changes cannot repair the capacity or commitment failures below.'} A rounded floor is a guide; recheck the full model after changing a fee. Demand response and compound stress are not included in this floor.</p><div class="button-row"><button type="button" data-action="solve-fee-hold">Solve fee for all to hold</button></div></div><div class="table-wrap" tabindex="0" role="region" aria-label="Participant fee requirements"><table><caption>Fee needed to meet each minimum monthly profit</caption><thead><tr><th scope="col">Participant</th><th scope="col">Fee floor</th><th scope="col">Operational restrictions</th></tr></thead><tbody>${guidance.participants.map((item) => `<tr><th scope="row">${escapeAttribute(item.name)}</th><td>${item.requiredFee === null ? 'No bounded fee can fund this share' : formatNumber(item.requiredFee, 6)}</td><td>${item.operationalFailures.length ? escapeAttribute(item.operationalFailures.join(', ')) : 'None at current volume'}</td></tr>`).join('')}</tbody></table></div></section>`;
}

function duplicateNameWarning() {
  const dupes = duplicateDisplayNames(state.participants);
  if (!dupes.length) return '';
  const details = dupes.map((item) => {
    const count = item.indexes.length;
    return `${count} participants share the name ${item.name}`;
  }).join('. ');
  return `<p class="duplicate-name-warning" role="status">${escapeAttribute(details)}. This is a label warning. It does not block editing and does not claim they are the same party.</p>`;
}

function shareBalanceText() {
  const total = state.participants.reduce((sum, item) => sum + item.revenueShare, 0);
  if (!Number.isFinite(total)) return 'Enter each revenue share to calculate the allocation balance.';
  return 'Allocated: ' + formatPct(total * 100) + '. ' + (Math.abs(total - 1) <= 1e-9 ? 'Shares reconcile to 100%.' : total < 1 ? formatPct((1 - total) * 100) + ' remains unallocated.' : formatPct((total - 1) * 100) + ' is overallocated.');
}

function reconcileShares(action) {
  const equal = action === 'equal-shares';
  const total = state.participants.reduce((sum, item) => sum + item.revenueShare, 0);
  if (!equal && (!(total > 0) || !Number.isFinite(total) || state.participants.some((item) => !Number.isFinite(item.revenueShare) || item.revenueShare < 0))) {
    setNotice('Normalize requires non-negative numeric shares with a positive total. Use Equal split to start over.'); return;
  }
  checkpoint();
  let assigned = 0;
  state.participants.forEach((item, index) => {
    const share = index === state.participants.length - 1 ? Math.max(0, 1 - assigned) : equal ? 1 / state.participants.length : item.revenueShare / total;
    item.revenueShare = share; assigned += share;
  });
  activePreset = '';
  refresh('Revenue shares reconciled. Review participant outcomes; Undo restores the previous allocation.');
}

function stressCasePreview(stress) {
  const scenario = stress.scenarios.find((item) => item.id === stressPreviewId);
  if (!scenario) return '';
  return `<section class="panel-body stress-preview" aria-labelledby="stress-preview-title"><h3 id="stress-preview-title" tabindex="-1">Inspect ${scenario.id} as a new baseline</h3><p>Monthly volume becomes ${formatNumber(scenario.volume)}; fee becomes ${formatNumber(scenario.fee, 6)}; each variable cost increases by ${formatPct(scenario.variableCostRisePct)}. Baseline volume shock resets to zero to avoid counting it twice. Shares, fixed costs, capacity and commitments stay unchanged.</p><p>Applying creates a new baseline. The existing compound stress settings will then test additional shocks from that baseline.</p><div class="button-row"><button type="button" data-action="apply-stress-case">Apply inspected case</button><button type="button" data-action="close-stress-preview">Close preview</button></div></section>`;
}

function applyInspectedStressCase() {
  try {
    const candidate = materializeStressCase(state, stressPreviewId);
    checkpoint(); state = withStress(candidate); activePreset = '';
    refresh('Inspected stress case applied as the new baseline. Undo restores the prior inputs.');
  } catch (error) {
    if (!(error instanceof ValidationError)) throw error;
    setNotice('Stress case could not be applied: ' + summarizeErrors(error.errors));
  }
}

function previewShareHold(participantId) {
  if (!validateConfiguration(state).valid) {
    setNotice('Resolve invalid inputs before solving a hold share.');
    return;
  }
  try {
    shareHoldPreview = solveMinimumShareToHold(state, participantId);
    render();
    document.querySelector('#share-hold-title')?.focus();
  } catch (error) {
    if (!(error instanceof ValidationError)) throw error;
    setNotice(`Share-to-hold solver rejected: ${summarizeErrors(error.errors)}`);
  }
}

function applyShareHold() {
  if (!shareHoldPreview || shareHoldPreview.status !== 'possible' || !shareHoldPreview.proposal) {
    setNotice('No share-to-hold proposal is available to apply.');
    return;
  }
  const proposal = shareHoldPreview.proposal;
  const share = shareHoldPreview.share;
  checkpoint();
  state.participants = proposal.map((item) => ({ ...item }));
  shareHoldPreview = null;
  activePreset = '';
  refresh(`Applied minimum hold share of ${formatPct(share * 100)}. Remaining participants kept their relative leftover. Undo restores the previous allocation.`);
}

function previewVolumeHold(participantId) {
  if (!validateConfiguration(state).valid) {
    setNotice('Resolve invalid inputs before solving a hold volume.');
    return;
  }
  try {
    volumeHoldPreview = solveMinimumVolumeToHold(state, participantId);
    render();
    document.querySelector('#volume-hold-title')?.focus();
  } catch (error) {
    if (!(error instanceof ValidationError)) throw error;
    setNotice(`Volume-to-hold solver rejected: ${summarizeErrors(error.errors)}`);
  }
}

function applyVolumeHold() {
  if (!volumeHoldPreview || volumeHoldPreview.status !== 'possible' || volumeHoldPreview.monthlyVolume == null) {
    setNotice('No volume-to-hold proposal is available to apply.');
    return;
  }
  const monthlyVolume = volumeHoldPreview.monthlyVolume;
  checkpoint();
  state.deal.monthlyVolume = monthlyVolume;
  volumeHoldPreview = null;
  activePreset = '';
  refresh(`Applied hold volume of ${formatVolume(monthlyVolume)}. Fee and shares are unchanged. Undo restores the previous volume.`);
}

function volumeHoldPreviewSection() {
  if (!volumeHoldPreview) return '';
  const solved = volumeHoldPreview;
  const target = state.participants.find((item) => item.id === solved.participantId);
  const name = escapeAttribute(target?.name ?? solved.participantId);
  if (solved.status === 'impossible') {
    return `<section class="panel" aria-labelledby="volume-hold-title"><div class="panel-heading"><h2 id="volume-hold-title" tabindex="-1">Volume-to-hold preview</h2><button type="button" data-action="close-volume-hold">Close preview</button></div><div class="panel-body"><p>${escapeAttribute(solved.reason)}</p><p class="output-note">This is a deterministic solvability result, not a forecast of demand or of who will stay.</p></div></section>`;
  }
  return `<section class="panel" aria-labelledby="volume-hold-title"><div class="panel-heading"><h2 id="volume-hold-title" tabindex="-1">Volume-to-hold preview</h2><button type="button" data-action="close-volume-hold">Close preview</button></div><div class="panel-body"><p><strong>${name}</strong> holds at a minimum monthly volume of <strong>${formatVolume(solved.monthlyVolume)}</strong> (effective ${formatVolume(solved.effectiveVolume)}). Current monthly volume: ${formatVolume(state.deal.monthlyVolume)}. Apply is required; fee, shares, addressable demand, and volume shock stay unchanged until then.</p><p>${escapeAttribute(solved.reason)}</p><div class="button-row"><button type="button" class="primary" data-action="apply-volume-hold">Apply hold volume</button><button type="button" data-action="close-volume-hold">Keep current volume</button></div></div></section>`;
}

function shareHoldPreviewSection() {
  if (!shareHoldPreview) return '';
  const solved = shareHoldPreview;
  const target = state.participants.find((item) => item.id === solved.participantId);
  const name = escapeAttribute(target?.name ?? solved.participantId);
  if (solved.status === 'impossible') {
    return `<section class="panel" aria-labelledby="share-hold-title"><div class="panel-heading"><h2 id="share-hold-title" tabindex="-1">Share-to-hold preview</h2><button type="button" data-action="close-share-hold">Close preview</button></div><div class="panel-body"><p>${escapeAttribute(solved.reason)}</p><p class="output-note">This is a deterministic solvability result, not a probability that the participant will stay.</p></div></section>`;
  }
  const rows = solved.proposal.map((item, index) => {
    const current = state.participants.find((participant) => participant.id === item.id);
    return `<tr><th scope="row">${escapeAttribute(item.name)}</th><td>${current ? formatPct(current.revenueShare * 100) : 'n/a'}</td><td>${formatPct(item.revenueShare * 100)}</td></tr>`;
  }).join('');
  return `<section class="panel" aria-labelledby="share-hold-title"><div class="panel-heading"><h2 id="share-hold-title" tabindex="-1">Share-to-hold preview</h2><button type="button" data-action="close-share-hold">Close preview</button></div><div class="panel-body"><p><strong>${name}</strong> holds at a minimum revenue share of <strong>${formatPct(solved.share * 100)}</strong>. Remaining participants keep their relative shares of the leftover. Apply is required; the current case is unchanged until then.</p><p>${escapeAttribute(solved.reason)}</p></div><div class="table-wrap" tabindex="0" role="region" aria-label="Proposed hold shares"><table><caption>Current shares versus proposed hold split</caption><thead><tr><th scope="col">Participant</th><th scope="col">Current share</th><th scope="col">Proposed share</th></tr></thead><tbody>${rows}</tbody></table></div><div class="panel-body"><div class="button-row"><button type="button" class="primary" data-action="apply-share-hold">Apply minimum hold share</button><button type="button" data-action="close-share-hold">Keep current shares</button></div></div></section>`;
}

function previewFeeHold() {
  if (!validateConfiguration(state).valid) {
    setNotice('Resolve invalid inputs before solving a hold fee.');
    return;
  }
  try {
    feeHoldPreview = solveFeeForAllHold(state);
    render();
    document.querySelector('#fee-hold-title')?.focus();
  } catch (error) {
    if (!(error instanceof ValidationError)) throw error;
    setNotice(`Fee-to-hold solver rejected: ${summarizeErrors(error.errors)}`);
  }
}

function applyFeeHold() {
  if (!feeHoldPreview || feeHoldPreview.status !== 'possible' || feeHoldPreview.fee == null) {
    setNotice('No fee-to-hold proposal is available to apply.');
    return;
  }
  const fee = feeHoldPreview.fee;
  checkpoint();
  state.deal.feePerTransaction = fee;
  feeHoldPreview = null;
  activePreset = '';
  refresh(`Applied hold fee of ${formatNumber(fee, 6)} per transaction. Volume and shares are unchanged. Undo restores the previous fee.`);
}

function feeHoldPreviewSection() {
  if (!feeHoldPreview) return '';
  const solved = feeHoldPreview;
  if (solved.status === 'impossible') {
    return `<section class="panel" aria-labelledby="fee-hold-title"><div class="panel-heading"><h2 id="fee-hold-title" tabindex="-1">Fee-to-hold preview</h2><button type="button" data-action="close-fee-hold">Close preview</button></div><div class="panel-body"><p>${escapeAttribute(solved.reason)}</p></div></section>`;
  }
  return `<section class="panel" aria-labelledby="fee-hold-title"><div class="panel-heading"><h2 id="fee-hold-title" tabindex="-1">Fee-to-hold preview</h2><button type="button" data-action="close-fee-hold">Close preview</button></div><div class="panel-body"><p>Current fee: <strong>${formatNumber(state.deal.feePerTransaction, 6)}</strong>. Proposed hold fee: <strong>${formatNumber(solved.fee, 6)}</strong> per transaction. Apply is required; volume, shares, and costs stay unchanged until then.</p><p>${escapeAttribute(solved.reason)}</p><div class="button-row"><button type="button" class="primary" data-action="apply-fee-hold">Apply hold fee</button><button type="button" data-action="close-fee-hold">Keep current fee</button></div></div></section>`;
}

function coachIsDismissed() {
  try { return localStorage.getItem(COACH_KEY) === 'dismissed'; } catch { return false; }
}

function dismissCoach() {
  coachVisible = false;
  try { localStorage.setItem(COACH_KEY, 'dismissed'); } catch { /* The overlay still closes for this visit. */ }
  render();
  restoreDialogOpener();
  setNotice('Coach dismissed. Enter the deal, then read the weakest participant and First breakpoint.');
}

function rememberDialogOpener(node) {
  dialogOpener = node && typeof node.focus === 'function' ? node : document.activeElement;
}

function restoreDialogOpener() {
  const opener = dialogOpener;
  dialogOpener = null;
  opener?.focus?.();
}

function closeHelp() {
  helpOpen = false;
  render();
  restoreDialogOpener();
}

function dialogFocusables(root) {
  if (!root?.querySelectorAll) return [];
  return [...root.querySelectorAll('a[href], button:not([disabled]), textarea, input:not([type="hidden"]), select, [tabindex]:not([tabindex="-1"])')];
}

function trapDialogTab(event) {
  event.preventDefault?.();
  const root = app.querySelector?.('[data-focus-trap]') ?? document.querySelector?.('[data-focus-trap]');
  if (!root) return;
  const nodes = dialogFocusables(root);
  if (!nodes.length) return;
  const current = nodes.indexOf(document.activeElement);
  const next = event.shiftKey
    ? (current <= 0 ? nodes.length - 1 : current - 1)
    : (current === -1 || current >= nodes.length - 1 ? 0 : current + 1);
  nodes[next]?.focus?.();
}

function coachOverlay() {
  if (!coachVisible) return '';
  return `<div class="coach-overlay" role="dialog" aria-modal="true" aria-labelledby="coach-title" data-focus-trap="dialog">
    <div class="coach-card" tabindex="-1">
      <h2 id="coach-title">Three steps to a first read</h2>
      <ol>
        <li>Enter the shared deal and each participant's costs and share.</li>
        <li>Read the viability card for the weakest participant by volume headroom.</li>
        <li>Inspect First breakpoint for the smallest adverse percentage move.</li>
      </ol>
      <p>This is a local decision aid. It does not say who will actually exit. Press Escape to dismiss. Press ? after dismissing for keyboard shortcuts. Tab stays inside this dialog.</p>
      <button type="button" class="primary" data-action="dismiss-coach">Got it</button>
    </div>
  </div>`;
}

function helpDialog() {
  if (!helpOpen) return '';
  return `<div class="help-overlay" role="dialog" aria-modal="true" aria-labelledby="help-title" data-focus-trap="dialog">
    <div class="coach-card" tabindex="-1">
      <h2 id="help-title">Keyboard shortcuts</h2>
      <ul class="shortcut-list">
        <li><kbd>?</kbd> Open or close this help dialog</li>
        <li><kbd>u</kbd> Undo the last edit in this tab (up to 50)</li>
        <li><kbd>r</kbd> Redo</li>
        <li><kbd>e</kbd> Export JSON of the current valid case</li>
        <li><kbd>g</kbd> Jump to the results nav or the first results heading</li>
        <li><kbd>n</kbd> Focus Add participant, or add one if that control is missing</li>
        <li><kbd>s</kbd> Jump to share-to-hold (preview if open, otherwise the first solver)</li>
        <li><kbd>c</kbd> Jump to snapshot or imported JSON compare heading</li>
        <li><kbd>p</kbd> Print the one-pager when the case is valid</li>
        <li><kbd>Escape</kbd> Close help or the first-run coach</li>
        <li><kbd>Tab</kbd> Cycle controls inside this dialog</li>
      </ul>
      <p>Shortcuts are ignored while a text or number field is focused, so typing a name or share is never stolen. Tab stays inside this dialog until it is closed.</p>
      <button type="button" data-action="close-help">Close help</button>
    </div>
  </div>`;
}

function clearPartnershipReview() {
 partnershipReviewPacket=null;partnershipReviewSequence++;
 const exportButton=document.querySelector('#partnership-review-export');if(exportButton)exportButton.disabled=true;
 const origin=document.querySelector('#partnership-review-origin');if(origin)origin.textContent='';
 const output=document.querySelector('#partnership-review-output');
 if(output) output.textContent='Run a review for the current valid inputs. Results clear when the case changes.';
}
function showPartnershipReview(review) {
 const output=document.querySelector('#partnership-review-output');output.replaceChildren();
 const title=document.createElement('h2');title.textContent=review.title;const note=document.createElement('p');note.textContent=review.note;output.append(title,note);
 const scroll=document.createElement('div');scroll.className='review-scroll';scroll.tabIndex=0;
 const table=document.createElement('table');const caption=document.createElement('caption');caption.textContent='Declared-input review. Monetary values use '+review.currency+'. Blank cells mean unavailable or unbounded as explained above.';table.append(caption);
 const head=document.createElement('thead');const headings=document.createElement('tr');for(const label of review.columns){const th=document.createElement('th');th.scope='col';th.textContent=label;headings.append(th);}head.append(headings);table.append(head);
 const body=document.createElement('tbody');for(const values of review.rows){const row=document.createElement('tr');for(const value of values){const cell=document.createElement('td');cell.textContent=value===null?'':typeof value==='number'?new Intl.NumberFormat('en-US',{maximumSignificantDigits:10}).format(value):value;row.append(cell);}body.append(row);}table.append(body);scroll.append(table);output.append(scroll);
}
function initializePartnershipReview(){
 const select=document.querySelector('#partnership-review-tool');if(!select)return;
 for(const tool of PARTNERSHIP_REVIEW_TOOLS){const option=document.createElement('option');option.value=tool.id;option.textContent=tool.title;select.append(option);}
 select.value='interval';select.addEventListener('change',clearPartnershipReview);
 document.querySelector('#partnership-review-run').addEventListener('click',()=>{clearPartnershipReview();try{partnershipReviewPacket=createPartnershipReviewPacket(state,select.value);showPartnershipReview(partnershipReviewPacket.review);document.querySelector('#partnership-review-export').disabled=false;document.querySelector('#partnership-review-origin').textContent='Current case: '+(state.deal.title||'Untitled');}catch(error){clearPartnershipReview();document.querySelector('#partnership-review-output').textContent='Review unavailable. '+(error.errors?.join(' ')||error.message);}});
}
initializePartnershipReview();

function initializePartnershipReviewPacket(){
 const button=document.querySelector('#partnership-review-export');if(!button)return;
 button.addEventListener('click',()=>{if(partnershipReviewPacket)downloadText(JSON.stringify(partnershipReviewPacket),'application/json','partnership-review.json');});
 document.querySelector('#partnership-review-import').addEventListener('click',()=>document.querySelector('#partnership-review-file').click());
 document.querySelector('#partnership-review-file').addEventListener('change',async event=>{
  const file=event.target.files[0];event.target.value='';if(!file)return;clearPartnershipReview();const sequence=partnershipReviewSequence;
  try{
   if(file.size>1048576)throw new Error('Review packet exceeds 1 MiB.');
   const text=await file.text();if(sequence!==partnershipReviewSequence)return;
   const packet=replayPartnershipReviewPacket(JSON.parse(text));partnershipReviewPacket=packet;
   document.querySelector('#partnership-review-tool').value=packet.tool;showPartnershipReview(packet.review);button.disabled=false;
   document.querySelector('#partnership-review-origin').textContent='Inspected saved case: '+(packet.scenario.deal.title||'Untitled')+'. Current case and autosave unchanged.';
  }catch(error){if(sequence!==partnershipReviewSequence)return;clearPartnershipReview();document.querySelector('#partnership-review-output').textContent='Review rejected: '+(error.errors?.join(' ')||error.message);}
 });
}
initializePartnershipReviewPacket();
