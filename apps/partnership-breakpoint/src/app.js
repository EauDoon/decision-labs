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
  swapAdjacentParticipants,
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
let breakpointSnapshotCopyText = '';
let shareHoldCopyText = '';
let notesCopyText = '';
let waterfallCopyText = '';
let viabilityCopyText = '';
let utilizationCopyText = '';
let tornadoCopyText = '';
let operatingCopyText = '';
let splitCopyText = '';
let allocationCopyText = '';
let titleCopyText = '';
let breakpointLabelCopyText = '';
let remainingCopyText = '';
let volumeCopyText = '';
let viabilityLabelCopyText = '';
let overCapacityCountCopyText = '';
let firstOverCapacityLabelCopyText = '';
let firstOverCapacityRemainingCopyText = '';
let lastOverCapacityLabelCopyText = '';
let lastOverCapacityRemainingCopyText = '';
let firstWithinCapacityRemainingCopyText = '';
let lastWithinCapacityRemainingCopyText = '';
let lastSpareCapacityRemainingCopyText = '';
let firstSpareCapacityRemainingCopyText = '';
let lastUnboundedRemainingCopyText = '';
let firstUnboundedRemainingCopyText = '';
let lastAtHoldRemainingCopyText = '';
let firstAtHoldRemainingCopyText = '';
let lastZeroShareLabelCopyText = '';
let lastZeroShareRemainingCopyText = '';
let firstZeroShareRemainingCopyText = '';
let firstZeroShareLabelCopyText = '';
let lastBreakpointLabelCopyText = '';
let rosterPasteText = '';
let invalidFieldCount = 0;
let coachVisible = !openedFromShareLink && !coachIsDismissed();
let helpOpen = false;
let dialogOpener = null;
let dialogNeedsInitialFocus = coachVisible;
const mutedStressIds = new Set();
let collapseAllHoldCases = false;
let hideHoldingParticipants = false;
let hideAllCompoundHolders = false;
let hideZeroShareParticipants = false;
let hideParticipantsOverCapacity = false;
let hideParticipantsAtHold = false;
let hideParticipantsWithoutCapacity = false;
let hideParticipantsWithSpareCapacity = false;
let hideParticipantsAtLeastHeadroom = false;
let hideParticipantsWithinCapacity = false;
let hideFirstBreakpointParticipant = false;
let hideFirstOverCapacityParticipant = false;
let hideLastOverCapacityParticipant = false;
let hideLastBreakpointParticipant = false;
let hideLastWithinCapacityParticipant = false;
let hideFirstWithinCapacityParticipant = false;
let hideLastSpareCapacityParticipant = false;
let hideFirstSpareCapacityParticipant = false;
let hideLastParticipantWithoutCapacity = false;
let hideFirstParticipantWithoutCapacity = false;
let hideLastParticipantAtHold = false;
let hideFirstParticipantAtHold = false;
let hideFirstZeroShareParticipant = false;
let hideLastZeroShareParticipant = false;
let hideUnboundedTornado = false;
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
  breakpointSnapshotCopyText = '';
  shareHoldCopyText = '';
  notesCopyText = '';
  waterfallCopyText = '';
  viabilityCopyText = '';
  utilizationCopyText = '';
  tornadoCopyText = '';
  operatingCopyText = '';
  splitCopyText = '';
  allocationCopyText = '';
  titleCopyText = '';
  breakpointLabelCopyText = '';
  remainingCopyText = '';
  volumeCopyText = '';
  viabilityLabelCopyText = '';
  overCapacityCountCopyText = '';
  firstOverCapacityLabelCopyText = '';
  firstOverCapacityRemainingCopyText = '';
  lastOverCapacityLabelCopyText = '';
  lastOverCapacityRemainingCopyText = '';
  firstWithinCapacityRemainingCopyText = '';
  lastWithinCapacityRemainingCopyText = '';
  lastSpareCapacityRemainingCopyText = '';
  firstSpareCapacityRemainingCopyText = '';
  lastUnboundedRemainingCopyText = '';
  firstUnboundedRemainingCopyText = '';
  lastAtHoldRemainingCopyText = '';
  firstAtHoldRemainingCopyText = '';
  lastZeroShareLabelCopyText = '';
  lastZeroShareRemainingCopyText = '';
  firstZeroShareRemainingCopyText = '';
  firstZeroShareLabelCopyText = '';
  lastBreakpointLabelCopyText = '';
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
  readCollapsePreference();
  stressPreviewId = '';
  shareHoldPreview = null;
  feeHoldPreview = null;
  volumeHoldPreview = null;
  briefCopyText = '';
  csvCopyText = '';
  breakpointCopyText = '';
  breakpointSnapshotCopyText = '';
  shareHoldCopyText = '';
  notesCopyText = '';
  waterfallCopyText = '';
  viabilityCopyText = '';
  utilizationCopyText = '';
  tornadoCopyText = '';
  operatingCopyText = '';
  splitCopyText = '';
  allocationCopyText = '';
  titleCopyText = '';
  breakpointLabelCopyText = '';
  remainingCopyText = '';
  volumeCopyText = '';
  viabilityLabelCopyText = '';
  overCapacityCountCopyText = '';
  firstOverCapacityLabelCopyText = '';
  firstOverCapacityRemainingCopyText = '';
  lastOverCapacityLabelCopyText = '';
  lastOverCapacityRemainingCopyText = '';
  firstWithinCapacityRemainingCopyText = '';
  lastWithinCapacityRemainingCopyText = '';
  lastSpareCapacityRemainingCopyText = '';
  firstSpareCapacityRemainingCopyText = '';
  lastUnboundedRemainingCopyText = '';
  firstUnboundedRemainingCopyText = '';
  lastAtHoldRemainingCopyText = '';
  firstAtHoldRemainingCopyText = '';
  lastZeroShareLabelCopyText = '';
  lastZeroShareRemainingCopyText = '';
  firstZeroShareRemainingCopyText = '';
  firstZeroShareLabelCopyText = '';
  lastBreakpointLabelCopyText = '';
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
    checkpoint(); state = withStress(clone(item.config)); readCollapsePreference(); activePreset = ''; caseName = item.name;
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

function readCollapsePreference() {
  collapseAllHoldCases = state.collapseAllHoldCases === true;
  hideHoldingParticipants = state.hideHoldingParticipants === true;
  hideAllCompoundHolders = state.hideAllHoldLedger === true;
  hideZeroShareParticipants = state.hideZeroShareParticipants === true;
  hideParticipantsOverCapacity = state.hideParticipantsOverCapacity === true;
  hideParticipantsAtHold = state.hideParticipantsAtHold === true;
  hideParticipantsWithoutCapacity = state.hideParticipantsWithoutCapacity === true;
  hideParticipantsWithSpareCapacity = state.hideParticipantsWithSpareCapacity === true;
  hideParticipantsAtLeastHeadroom = state.hideParticipantsAtLeastHeadroom === true;
  hideParticipantsWithinCapacity = state.hideParticipantsWithinCapacity === true;
  hideFirstBreakpointParticipant = state.hideFirstBreakpointParticipant === true;
  hideFirstOverCapacityParticipant = state.hideFirstOverCapacityParticipant === true;
  hideLastOverCapacityParticipant = state.hideLastOverCapacityParticipant === true;
  hideLastBreakpointParticipant = state.hideLastBreakpointParticipant === true;
  hideLastWithinCapacityParticipant = state.hideLastWithinCapacityParticipant === true;
  hideFirstWithinCapacityParticipant = state.hideFirstWithinCapacityParticipant === true;
  hideLastSpareCapacityParticipant = state.hideLastSpareCapacityParticipant === true;
  hideFirstSpareCapacityParticipant = state.hideFirstSpareCapacityParticipant === true;
  hideLastParticipantWithoutCapacity = state.hideLastParticipantWithoutCapacity === true;
  hideFirstParticipantWithoutCapacity = state.hideFirstParticipantWithoutCapacity === true;
  hideLastParticipantAtHold = state.hideLastParticipantAtHold === true;
  hideFirstParticipantAtHold = state.hideFirstParticipantAtHold === true;
  hideFirstZeroShareParticipant = state.hideFirstZeroShareParticipant === true;
  hideLastZeroShareParticipant = state.hideLastZeroShareParticipant === true;
}

function writeCollapsePreference() {
  if (collapseAllHoldCases) state.collapseAllHoldCases = true;
  else delete state.collapseAllHoldCases;
  if (hideHoldingParticipants) state.hideHoldingParticipants = true;
  else delete state.hideHoldingParticipants;
  if (hideAllCompoundHolders) state.hideAllHoldLedger = true;
  else delete state.hideAllHoldLedger;
  if (hideZeroShareParticipants) state.hideZeroShareParticipants = true;
  else delete state.hideZeroShareParticipants;
  if (hideParticipantsOverCapacity) state.hideParticipantsOverCapacity = true;
  else delete state.hideParticipantsOverCapacity;
  if (hideParticipantsAtHold) state.hideParticipantsAtHold = true;
  else delete state.hideParticipantsAtHold;
  if (hideParticipantsWithoutCapacity) state.hideParticipantsWithoutCapacity = true;
  else delete state.hideParticipantsWithoutCapacity;
  if (hideParticipantsWithSpareCapacity) state.hideParticipantsWithSpareCapacity = true;
  else delete state.hideParticipantsWithSpareCapacity;
  if (hideParticipantsAtLeastHeadroom) state.hideParticipantsAtLeastHeadroom = true;
  else delete state.hideParticipantsAtLeastHeadroom;
  if (hideParticipantsWithinCapacity) state.hideParticipantsWithinCapacity = true;
  else delete state.hideParticipantsWithinCapacity;
  if (hideFirstBreakpointParticipant) state.hideFirstBreakpointParticipant = true;
  else delete state.hideFirstBreakpointParticipant;
  if (hideFirstOverCapacityParticipant) state.hideFirstOverCapacityParticipant = true;
  else delete state.hideFirstOverCapacityParticipant;
  if (hideLastOverCapacityParticipant) state.hideLastOverCapacityParticipant = true;
  else delete state.hideLastOverCapacityParticipant;
  if (hideLastBreakpointParticipant) state.hideLastBreakpointParticipant = true;
  else delete state.hideLastBreakpointParticipant;
  if (hideLastWithinCapacityParticipant) state.hideLastWithinCapacityParticipant = true;
  else delete state.hideLastWithinCapacityParticipant;
  if (hideFirstWithinCapacityParticipant) state.hideFirstWithinCapacityParticipant = true;
  else delete state.hideFirstWithinCapacityParticipant;
  if (hideLastSpareCapacityParticipant) state.hideLastSpareCapacityParticipant = true;
  else delete state.hideLastSpareCapacityParticipant;
  if (hideFirstSpareCapacityParticipant) state.hideFirstSpareCapacityParticipant = true;
  else delete state.hideFirstSpareCapacityParticipant;
  if (hideLastParticipantWithoutCapacity) state.hideLastParticipantWithoutCapacity = true;
  else delete state.hideLastParticipantWithoutCapacity;
  if (hideFirstParticipantWithoutCapacity) state.hideFirstParticipantWithoutCapacity = true;
  else delete state.hideFirstParticipantWithoutCapacity;
  if (hideLastParticipantAtHold) state.hideLastParticipantAtHold = true;
  else delete state.hideLastParticipantAtHold;
  if (hideFirstParticipantAtHold) state.hideFirstParticipantAtHold = true;
  else delete state.hideFirstParticipantAtHold;
  if (hideFirstZeroShareParticipant) state.hideFirstZeroShareParticipant = true;
  else delete state.hideFirstZeroShareParticipant;
  if (hideLastZeroShareParticipant) state.hideLastZeroShareParticipant = true;
  else delete state.hideLastZeroShareParticipant;
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
  return `<div class="button-row"><button type="button" data-action="copy-first-breakpoint">Copy first breakpoint</button><button type="button" data-action="copy-first-breakpoint-snapshot">Copy first-breakpoint snapshot</button><button type="button" id="copy-first-breakpoint-label" data-action="copy-first-breakpoint-label">Copy first-breakpoint participant label</button><button type="button" id="copy-first-breakpoint-remaining" data-action="copy-first-breakpoint-remaining">Copy first-breakpoint remaining-to-hold</button><button type="button" id="copy-first-breakpoint-volume" data-action="copy-first-breakpoint-volume" aria-keyshortcuts=":">Copy first-breakpoint volume-to-hold</button></div>`;
}

function breakpointSection(result) {
  const breakpoint = result.firstBreakpoint;
  if (!breakpoint?.participant) {
    return `<section class="panel breakpoint-summary" id="first-breakpoint"><div class="panel-heading"><h2 id="first-breakpoint-title" tabindex="-1">First breakpoint</h2><span class="optional">relative adverse movement</span></div><div class="panel-body"><p>No bounded adverse shock is available in the current inputs. The displayed participant thresholds remain unbounded.</p>${copyFirstBreakpointButton()}</div></section>`;
  }

  const participantName = escapeAttribute(breakpoint.participant.name);
  const label = shockLabel(breakpoint.kind);
  const shock = breakpoint.shock;
  if (breakpoint.status === 'already-failing') {
    return `<section class="panel breakpoint-summary alarm" id="first-breakpoint"><div class="panel-heading"><h2 id="first-breakpoint-title" tabindex="-1">First breakpoint</h2><span class="optional">action now</span></div><div class="panel-body"><p><strong>${participantName}</strong> is already failing an exit criterion. Resolve the input before relying on a shock threshold.</p>${copyFirstBreakpointButton()}</div></section>`;
  }
  if (breakpoint.status === 'at-breakpoint') {
    return `<section class="panel breakpoint-summary alarm" id="first-breakpoint"><div class="panel-heading"><h2 id="first-breakpoint-title" tabindex="-1">First breakpoint</h2><span class="optional">action now</span></div><div class="panel-body"><p><strong>${participantName}</strong> is already at its ${label}. Any further adverse movement fails.</p>${copyFirstBreakpointButton()}</div></section>`;
  }

  const units = shockUnits(breakpoint.kind);
  const threshold = units === 'txn'
    ? `${formatNumber(shock.breakpoint)} txn`
    : `${formatNumber(shock.breakpoint, 4)} units / txn`;
  return `<section class="panel breakpoint-summary" id="first-breakpoint"><div class="panel-heading"><h2 id="first-breakpoint-title" tabindex="-1">First breakpoint</h2><span class="optional">relative adverse movement</span></div><div class="panel-body"><p><strong>Protect ${participantName} first.</strong> A ${label} of <strong>${compactShock(shock, units)}</strong> reaches the boundary at ${threshold}.</p><p class="output-note">This ranks the smallest percentage movement from the current scenario. It is a comparison aid, not a probability forecast.</p>${copyFirstBreakpointButton()}</div></section>`;
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

function participantHasZeroShare(participant) {
  return Number.isFinite(participant.revenueShare) && Math.abs(participant.revenueShare) <= 1e-9;
}

function participantIsFirstZeroShare(participant) {
  const first = state.participants.find((item) => participantHasZeroShare(item));
  return Boolean(first) && first.id === participant.id;
}

function participantIsLastZeroShare(participant) {
  let last = null;
  for (const item of state.participants) {
    if (participantHasZeroShare(item)) last = item;
  }
  return Boolean(last) && last.id === participant.id;
}

function participantOverListedCapacity(result, participant) {
  if (!result) return false;
  const capacity = participant.capacity;
  if (capacity == null || !Number.isFinite(capacity)) return false;
  const volume = result.effectiveVolume;
  if (!Number.isFinite(volume)) return false;
  return volume > capacity + 1e-9;
}

function participantAtHoldNoCapacityBreach(result, participant) {
  if (!result) return false;
  const row = result.participants.find((item) => item.id === participant.id);
  if (!row) return false;
  if (participantOverListedCapacity(result, participant)) return false;
  if (row.headroomToExit === null) return false;
  return row.headroomToExit >= -1e-9;
}

function participantWithoutListedCapacity(participant) {
  const capacity = participant.capacity;
  return capacity == null || !Number.isFinite(capacity);
}

function participantWithSpareCapacity(result, participant) {
  if (!result) return false;
  const capacity = participant.capacity;
  if (capacity == null || !Number.isFinite(capacity)) return false;
  const volume = result.effectiveVolume;
  if (!Number.isFinite(volume)) return false;
  return capacity - volume > 1e-9;
}

function participantAtLeastHeadroom(result, participant) {
  if (!result?.weakestParticipant) return false;
  return result.weakestParticipant.id === participant.id;
}

function participantWithinListedCapacity(result, participant) {
  if (!result) return false;
  const capacity = participant.capacity;
  if (capacity == null || !Number.isFinite(capacity)) return false;
  const volume = result.effectiveVolume;
  if (!Number.isFinite(volume)) return false;
  return volume <= capacity + 1e-9;
}

function participantIsFirstBreakpoint(result, participant) {
  if (!result?.firstBreakpoint?.participant) return false;
  return result.firstBreakpoint.participant.id === participant.id;
}

function participantIsFirstOverCapacity(result, participant) {
  if (!result) return false;
  const first = state.participants.find((item) => participantOverListedCapacity(result, item));
  return Boolean(first) && first.id === participant.id;
}

function participantIsLastOverCapacity(result, participant) {
  if (!result) return false;
  let last = null;
  for (const item of state.participants) {
    if (participantOverListedCapacity(result, item)) last = item;
  }
  return Boolean(last) && last.id === participant.id;
}

function participantIsLastBreakpoint(result, participant) {
  if (!result?.firstBreakpoint?.participant) return false;
  let last = null;
  for (const item of state.participants) {
    if (participantIsFirstBreakpoint(result, item)) last = item;
  }
  return Boolean(last) && last.id === participant.id;
}

function participantIsLastWithinCapacity(result, participant) {
  if (!result) return false;
  let last = null;
  for (const item of state.participants) {
    if (participantWithinListedCapacity(result, item)) last = item;
  }
  return Boolean(last) && last.id === participant.id;
}

function participantIsFirstWithinCapacity(result, participant) {
  if (!result) return false;
  const first = state.participants.find((item) => participantWithinListedCapacity(result, item));
  return Boolean(first) && first.id === participant.id;
}

function participantIsLastSpareCapacity(result, participant) {
  if (!result) return false;
  let last = null;
  for (const item of state.participants) {
    if (participantWithSpareCapacity(result, item)) last = item;
  }
  return Boolean(last) && last.id === participant.id;
}

function participantIsFirstSpareCapacity(result, participant) {
  if (!result) return false;
  const first = state.participants.find((item) => participantWithSpareCapacity(result, item));
  return Boolean(first) && first.id === participant.id;
}

function participantIsLastWithoutCapacity(participant) {
  let last = null;
  for (const item of state.participants) {
    if (participantWithoutListedCapacity(item)) last = item;
  }
  return Boolean(last) && last.id === participant.id;
}

function participantIsFirstWithoutCapacity(participant) {
  const first = state.participants.find((item) => participantWithoutListedCapacity(item));
  return Boolean(first) && first.id === participant.id;
}

function remainingToHoldAmount(result, participant) {
  if (!result) return null;
  const named = result.participants.find((item) => item.id === participant.id);
  const remaining = named?.headroomToExit == null ? null : Math.max(0, -named.headroomToExit);
  if (remaining == null || !Number.isFinite(remaining)) return null;
  return remaining;
}

function participantAtHoldRemainingToHold(result, participant) {
  const remaining = remainingToHoldAmount(result, participant);
  return remaining != null && remaining <= 1e-9;
}

function participantIsLastAtHold(result, participant) {
  if (!result) return false;
  let last = null;
  for (const item of state.participants) {
    if (participantAtHoldRemainingToHold(result, item)) last = item;
  }
  return Boolean(last) && last.id === participant.id;
}

function participantIsFirstAtHold(result, participant) {
  if (!result) return false;
  const first = state.participants.find((item) => participantAtHoldRemainingToHold(result, item));
  return Boolean(first) && first.id === participant.id;
}

function participantHiddenFromRoster(result, participant) {
  if (hideZeroShareParticipants && participantHasZeroShare(participant)) return true;
  if (hideFirstZeroShareParticipant && participantIsFirstZeroShare(participant)) return true;
  if (hideLastZeroShareParticipant && participantIsLastZeroShare(participant)) return true;
  if (hideHoldingParticipants && participantCurrentlyHolds(result, participant.id)) return true;
  if (hideParticipantsOverCapacity && participantOverListedCapacity(result, participant)) return true;
  if (hideParticipantsAtHold && participantAtHoldNoCapacityBreach(result, participant)) return true;
  if (hideParticipantsWithoutCapacity && participantWithoutListedCapacity(participant)) return true;
  if (hideParticipantsWithSpareCapacity && participantWithSpareCapacity(result, participant)) return true;
  if (hideParticipantsAtLeastHeadroom && participantAtLeastHeadroom(result, participant)) return true;
  if (hideParticipantsWithinCapacity && participantWithinListedCapacity(result, participant)) return true;
  if (hideFirstBreakpointParticipant && participantIsFirstBreakpoint(result, participant)) return true;
  if (hideLastBreakpointParticipant && participantIsLastBreakpoint(result, participant)) return true;
  if (hideFirstOverCapacityParticipant && participantIsFirstOverCapacity(result, participant)) return true;
  if (hideLastOverCapacityParticipant && participantIsLastOverCapacity(result, participant)) return true;
  if (hideLastWithinCapacityParticipant && participantIsLastWithinCapacity(result, participant)) return true;
  if (hideFirstWithinCapacityParticipant && participantIsFirstWithinCapacity(result, participant)) return true;
  if (hideLastSpareCapacityParticipant && participantIsLastSpareCapacity(result, participant)) return true;
  if (hideFirstSpareCapacityParticipant && participantIsFirstSpareCapacity(result, participant)) return true;
  if (hideLastParticipantWithoutCapacity && participantIsLastWithoutCapacity(participant)) return true;
  if (hideFirstParticipantWithoutCapacity && participantIsFirstWithoutCapacity(participant)) return true;
  if (hideLastParticipantAtHold && participantIsLastAtHold(result, participant)) return true;
  if (hideFirstParticipantAtHold && participantIsFirstAtHold(result, participant)) return true;
  return false;
}

function inputPanel(result) {
  const firstFailId = result?.participants.find((participant) => !participant.viable)?.id ?? null;
  const hiddenHoldCount = hideHoldingParticipants && result
    ? state.participants.filter((participant) => participantCurrentlyHolds(result, participant.id)).length
    : 0;
  const hiddenZeroCount = hideZeroShareParticipants
    ? state.participants.filter((participant) => participantHasZeroShare(participant)).length
    : 0;
  const hiddenFirstZeroShareCount = hideFirstZeroShareParticipant
    ? state.participants.filter((participant) => participantIsFirstZeroShare(participant)).length
    : 0;
  const hiddenLastZeroShareCount = hideLastZeroShareParticipant
    ? state.participants.filter((participant) => participantIsLastZeroShare(participant)).length
    : 0;
  const hiddenOverCount = hideParticipantsOverCapacity && result
    ? state.participants.filter((participant) => participantOverListedCapacity(result, participant)).length
    : 0;
  const hiddenAtHoldCount = hideParticipantsAtHold && result
    ? state.participants.filter((participant) => participantAtHoldNoCapacityBreach(result, participant)).length
    : 0;
  const hiddenWithoutCapacityCount = hideParticipantsWithoutCapacity
    ? state.participants.filter((participant) => participantWithoutListedCapacity(participant)).length
    : 0;
  const hiddenSpareCapacityCount = hideParticipantsWithSpareCapacity && result
    ? state.participants.filter((participant) => participantWithSpareCapacity(result, participant)).length
    : 0;
  const hiddenLeastHeadroomCount = hideParticipantsAtLeastHeadroom && result
    ? state.participants.filter((participant) => participantAtLeastHeadroom(result, participant)).length
    : 0;
  const hiddenWithinCapacityCount = hideParticipantsWithinCapacity && result
    ? state.participants.filter((participant) => participantWithinListedCapacity(result, participant)).length
    : 0;
  const hiddenFirstBreakpointCount = hideFirstBreakpointParticipant && result
    ? state.participants.filter((participant) => participantIsFirstBreakpoint(result, participant)).length
    : 0;
  const hiddenLastBreakpointCount = hideLastBreakpointParticipant && result
    ? state.participants.filter((participant) => participantIsLastBreakpoint(result, participant)).length
    : 0;
  const hiddenFirstOverCapacityCount = hideFirstOverCapacityParticipant && result
    ? state.participants.filter((participant) => participantIsFirstOverCapacity(result, participant)).length
    : 0;
  const hiddenLastOverCapacityCount = hideLastOverCapacityParticipant && result
    ? state.participants.filter((participant) => participantIsLastOverCapacity(result, participant)).length
    : 0;
  const hiddenLastWithinCapacityCount = hideLastWithinCapacityParticipant && result
    ? state.participants.filter((participant) => participantIsLastWithinCapacity(result, participant)).length
    : 0;
  const hiddenFirstWithinCapacityCount = hideFirstWithinCapacityParticipant && result
    ? state.participants.filter((participant) => participantIsFirstWithinCapacity(result, participant)).length
    : 0;
  const hiddenLastSpareCapacityCount = hideLastSpareCapacityParticipant && result
    ? state.participants.filter((participant) => participantIsLastSpareCapacity(result, participant)).length
    : 0;
  const hiddenFirstSpareCapacityCount = hideFirstSpareCapacityParticipant && result
    ? state.participants.filter((participant) => participantIsFirstSpareCapacity(result, participant)).length
    : 0;
  const hiddenLastWithoutCapacityCount = hideLastParticipantWithoutCapacity
    ? state.participants.filter((participant) => participantIsLastWithoutCapacity(participant)).length
    : 0;
  const hiddenFirstWithoutCapacityCount = hideFirstParticipantWithoutCapacity
    ? state.participants.filter((participant) => participantIsFirstWithoutCapacity(participant)).length
    : 0;
  const hiddenLastAtHoldCount = hideLastParticipantAtHold && result
    ? state.participants.filter((participant) => participantIsLastAtHold(result, participant)).length
    : 0;
  const hiddenFirstAtHoldCount = hideFirstParticipantAtHold && result
    ? state.participants.filter((participant) => participantIsFirstAtHold(result, participant)).length
    : 0;
  const firstVisibleIndex = state.participants.findIndex((participant) => !participantHiddenFromRoster(result, participant));
  const firstOverCapacityId = result
    ? (state.participants.find((participant) => participantOverListedCapacity(result, participant))?.id ?? null)
    : null;
  const participantForms = state.participants.map((participant, index) => {
    if (participantHiddenFromRoster(result, participant)) return '';
    const leastHeadroom = result?.weakestParticipant?.id === participant.id;
    const firstOverCapacity = firstOverCapacityId === participant.id;
    return `
    <section class="participant-form${firstFailId === participant.id ? ' first-fail' : ''}"${leastHeadroom ? ' id="least-headroom-participant" tabindex="-1"' : ''} aria-labelledby="participant-${index}-title">${firstOverCapacity ? '<span id="over-capacity-participant" tabindex="-1"></span>' : ''}
      <div class="participant-toolbar">
        <div class="button-row participant-roster">
          <button type="button" data-action="duplicate-participant" data-index="${index}" ${state.participants.length >= MAX_PARTICIPANTS ? 'disabled title="Participant limit reached"' : ''}>Duplicate</button>
          <button type="button" data-action="move-participant-up" data-index="${index}" ${index === 0 ? 'disabled title="Already first"' : ''}>Move up</button>
          <button type="button" data-action="move-participant-down" data-index="${index}" ${index === state.participants.length - 1 ? 'disabled title="Already last"' : ''}>Move down</button>
          <button type="button" data-action="swap-participant-next" data-index="${index}" ${index === state.participants.length - 1 ? 'disabled title="Already last"' : ''}>Swap with next</button>
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
  const zeroShareFilterNote = hideZeroShareParticipants
    ? `${hiddenZeroCount} participant${hiddenZeroCount === 1 ? '' : 's'} with zero revenue share ${hiddenZeroCount === 1 ? 'is' : 'are'} hidden from this roster display. Expand restores them. Tested-case and model counts are unchanged.`
    : 'Hide participants with zero revenue share to filter this roster display only. Expand restores them. Counts stay the same.';
  const firstZeroShareFilterNote = hideFirstZeroShareParticipant
    ? `${hiddenFirstZeroShareCount} first participant with zero revenue share ${hiddenFirstZeroShareCount === 1 ? 'is' : 'are'} hidden from this roster display. Expand restores ${hiddenFirstZeroShareCount === 1 ? 'it' : 'them'}. Tested-case and model counts are unchanged.`
    : 'Hide the first roster row with zero revenue share to filter this roster display only. Expand restores it. Counts stay the same.';
  const lastZeroShareFilterNote = hideLastZeroShareParticipant
    ? `${hiddenLastZeroShareCount} last participant with zero revenue share ${hiddenLastZeroShareCount === 1 ? 'is' : 'are'} hidden from this roster display. Expand restores ${hiddenLastZeroShareCount === 1 ? 'it' : 'them'}. Tested-case and model counts are unchanged.`
    : 'Hide the last roster row with zero revenue share to filter this roster display only. Expand restores it. Counts stay the same.';
  const overCapacityFilterNote = hideParticipantsOverCapacity
    ? `${hiddenOverCount} participant${hiddenOverCount === 1 ? '' : 's'} whose volume is above listed capacity ${hiddenOverCount === 1 ? 'is' : 'are'} hidden from this roster display. Expand restores them. Tested-case and model counts are unchanged.`
    : 'Hide participants whose volume is above listed capacity to filter this roster display only. Expand restores them. Counts stay the same.';
  const atHoldFilterNote = hideParticipantsAtHold
    ? `${hiddenAtHoldCount} participant${hiddenAtHoldCount === 1 ? '' : 's'} whose volume headroom is at or above a hold with no listed capacity breach ${hiddenAtHoldCount === 1 ? 'is' : 'are'} hidden from this roster display. Expand restores them. Tested-case and model counts are unchanged.`
    : 'Hide participants whose current volume headroom is at or above a hold with no listed capacity breach to filter this roster display only. Expand restores them. Counts stay the same.';
  const withoutCapacityFilterNote = hideParticipantsWithoutCapacity
    ? `${hiddenWithoutCapacityCount} participant${hiddenWithoutCapacityCount === 1 ? '' : 's'} whose capacity is unbounded or omitted ${hiddenWithoutCapacityCount === 1 ? 'is' : 'are'} hidden from this roster display. Expand restores them. Tested-case and model counts are unchanged.`
    : 'Hide participants whose capacity is unbounded or omitted to filter this roster display only. Expand restores them. Counts stay the same.';
  const spareCapacityFilterNote = hideParticipantsWithSpareCapacity
    ? `${hiddenSpareCapacityCount} participant${hiddenSpareCapacityCount === 1 ? '' : 's'} with unused listed capacity ${hiddenSpareCapacityCount === 1 ? 'is' : 'are'} hidden from this roster display. Expand restores them. Tested-case and model counts are unchanged.`
    : 'Hide participants with unused listed capacity to filter this roster display only. Expand restores them. Counts stay the same.';
  const leastHeadroomFilterNote = hideParticipantsAtLeastHeadroom
    ? `${hiddenLeastHeadroomCount} least-headroom participant${hiddenLeastHeadroomCount === 1 ? '' : 's'} ${hiddenLeastHeadroomCount === 1 ? 'is' : 'are'} hidden from this roster display. Expand restores them. Tested-case and model counts are unchanged.`
    : 'Hide the least-headroom roster row to filter this roster display only. Expand restores it. Counts stay the same.';
  const withinCapacityFilterNote = hideParticipantsWithinCapacity
    ? `${hiddenWithinCapacityCount} participant${hiddenWithinCapacityCount === 1 ? '' : 's'} who are within listed capacity ${hiddenWithinCapacityCount === 1 ? 'is' : 'are'} hidden from this roster display. Expand restores them. Tested-case and model counts are unchanged.`
    : 'Hide participants who are within listed capacity to filter this roster display only. Expand restores them. Counts stay the same.';
  const firstBreakpointFilterNote = hideFirstBreakpointParticipant
    ? `${hiddenFirstBreakpointCount} first-breakpoint participant${hiddenFirstBreakpointCount === 1 ? '' : 's'} ${hiddenFirstBreakpointCount === 1 ? 'is' : 'are'} hidden from this roster display. Expand restores ${hiddenFirstBreakpointCount === 1 ? 'it' : 'them'}. Tested-case and model counts are unchanged.`
    : 'Hide the first-breakpoint roster row to filter this roster display only. Expand restores it. Counts stay the same.';
  const lastBreakpointFilterNote = hideLastBreakpointParticipant
    ? `${hiddenLastBreakpointCount} last first-breakpoint participant${hiddenLastBreakpointCount === 1 ? '' : 's'} ${hiddenLastBreakpointCount === 1 ? 'is' : 'are'} hidden from this roster display. Expand restores ${hiddenLastBreakpointCount === 1 ? 'it' : 'them'}. Tested-case and model counts are unchanged.`
    : 'Hide the last first-breakpoint roster row to filter this roster display only. Expand restores it. Counts stay the same.';
  const firstOverCapacityFilterNote = hideFirstOverCapacityParticipant
    ? `${hiddenFirstOverCapacityCount} first over-capacity participant${hiddenFirstOverCapacityCount === 1 ? '' : 's'} ${hiddenFirstOverCapacityCount === 1 ? 'is' : 'are'} hidden from this roster display. Expand restores ${hiddenFirstOverCapacityCount === 1 ? 'it' : 'them'}. Tested-case and model counts are unchanged.`
    : 'Hide the first over-capacity roster row to filter this roster display only. Expand restores it. Counts stay the same.';
  const lastOverCapacityFilterNote = hideLastOverCapacityParticipant
    ? `${hiddenLastOverCapacityCount} last over-capacity participant${hiddenLastOverCapacityCount === 1 ? '' : 's'} ${hiddenLastOverCapacityCount === 1 ? 'is' : 'are'} hidden from this roster display. Expand restores ${hiddenLastOverCapacityCount === 1 ? 'it' : 'them'}. Tested-case and model counts are unchanged.`
    : 'Hide the last over-capacity roster row to filter this roster display only. Expand restores it. Counts stay the same.';
  const lastWithinCapacityFilterNote = hideLastWithinCapacityParticipant
    ? `${hiddenLastWithinCapacityCount} last within-capacity participant${hiddenLastWithinCapacityCount === 1 ? '' : 's'} ${hiddenLastWithinCapacityCount === 1 ? 'is' : 'are'} hidden from this roster display. Expand restores ${hiddenLastWithinCapacityCount === 1 ? 'it' : 'them'}. Tested-case and model counts are unchanged.`
    : 'Hide the last within-capacity roster row to filter this roster display only. Expand restores it. Counts stay the same.';
  const firstWithinCapacityFilterNote = hideFirstWithinCapacityParticipant
    ? `${hiddenFirstWithinCapacityCount} first within-capacity participant${hiddenFirstWithinCapacityCount === 1 ? '' : 's'} ${hiddenFirstWithinCapacityCount === 1 ? 'is' : 'are'} hidden from this roster display. Expand restores ${hiddenFirstWithinCapacityCount === 1 ? 'it' : 'them'}. Tested-case and model counts are unchanged.`
    : 'Hide the first within-capacity roster row to filter this roster display only. Expand restores it. Counts stay the same.';
  const lastSpareCapacityFilterNote = hideLastSpareCapacityParticipant
    ? `${hiddenLastSpareCapacityCount} last spare-capacity participant${hiddenLastSpareCapacityCount === 1 ? '' : 's'} ${hiddenLastSpareCapacityCount === 1 ? 'is' : 'are'} hidden from this roster display. Expand restores ${hiddenLastSpareCapacityCount === 1 ? 'it' : 'them'}. Tested-case and model counts are unchanged.`
    : 'Hide the last spare-capacity roster row to filter this roster display only. Expand restores it. Counts stay the same.';
  const firstSpareCapacityFilterNote = hideFirstSpareCapacityParticipant
    ? `${hiddenFirstSpareCapacityCount} first spare-capacity participant${hiddenFirstSpareCapacityCount === 1 ? '' : 's'} ${hiddenFirstSpareCapacityCount === 1 ? 'is' : 'are'} hidden from this roster display. Expand restores ${hiddenFirstSpareCapacityCount === 1 ? 'it' : 'them'}. Tested-case and model counts are unchanged.`
    : 'Hide the first spare-capacity roster row to filter this roster display only. Expand restores it. Counts stay the same.';
  const lastWithoutCapacityFilterNote = hideLastParticipantWithoutCapacity
    ? `${hiddenLastWithoutCapacityCount} last participant without listed capacity ${hiddenLastWithoutCapacityCount === 1 ? 'is' : 'are'} hidden from this roster display. Expand restores ${hiddenLastWithoutCapacityCount === 1 ? 'it' : 'them'}. Tested-case and model counts are unchanged.`
    : 'Hide the last roster row whose capacity is unbounded or omitted to filter this roster display only. Expand restores it. Counts stay the same.';
  const firstWithoutCapacityFilterNote = hideFirstParticipantWithoutCapacity
    ? `${hiddenFirstWithoutCapacityCount} first participant without listed capacity ${hiddenFirstWithoutCapacityCount === 1 ? 'is' : 'are'} hidden from this roster display. Expand restores ${hiddenFirstWithoutCapacityCount === 1 ? 'it' : 'them'}. Tested-case and model counts are unchanged.`
    : 'Hide the first roster row whose capacity is unbounded or omitted to filter this roster display only. Expand restores it. Counts stay the same.';
  const lastAtHoldFilterNote = hideLastParticipantAtHold
    ? `${hiddenLastAtHoldCount} last participant at hold ${hiddenLastAtHoldCount === 1 ? 'is' : 'are'} hidden from this roster display. Expand restores ${hiddenLastAtHoldCount === 1 ? 'it' : 'them'}. Tested-case and model counts are unchanged.`
    : 'Hide the last roster row currently at hold (remaining-to-hold is 0) to filter this roster display only. Expand restores it. Counts stay the same.';
  const firstAtHoldFilterNote = hideFirstParticipantAtHold
    ? `${hiddenFirstAtHoldCount} first participant at hold ${hiddenFirstAtHoldCount === 1 ? 'is' : 'are'} hidden from this roster display. Expand restores ${hiddenFirstAtHoldCount === 1 ? 'it' : 'them'}. Tested-case and model counts are unchanged.`
    : 'Hide the first roster row currently at hold (remaining-to-hold is 0) to filter this roster display only. Expand restores it. Counts stay the same.';
  const rosterFilterCount = [hideHoldingParticipants, hideZeroShareParticipants, hideFirstZeroShareParticipant, hideLastZeroShareParticipant, hideParticipantsOverCapacity, hideParticipantsAtHold, hideParticipantsWithoutCapacity, hideParticipantsWithSpareCapacity, hideParticipantsAtLeastHeadroom, hideParticipantsWithinCapacity, hideFirstBreakpointParticipant, hideLastBreakpointParticipant, hideFirstOverCapacityParticipant, hideLastOverCapacityParticipant, hideLastWithinCapacityParticipant, hideFirstWithinCapacityParticipant, hideLastSpareCapacityParticipant, hideFirstSpareCapacityParticipant, hideLastParticipantWithoutCapacity, hideFirstParticipantWithoutCapacity, hideLastParticipantAtHold, hideFirstParticipantAtHold].filter(Boolean).length;
  const rosterEmptyNotice = !participantForms && firstVisibleIndex === -1
    ? rosterFilterCount === 1 && hideHoldingParticipants
      ? `<p class="notice"><span id="share-hold-jump" tabindex="-1"></span>Every displayed participant currently holds. Expand to edit the hidden roster cards. Counts are unchanged.</p>`
      : rosterFilterCount === 1 && hideZeroShareParticipants
        ? `<p class="notice"><span id="share-hold-jump" tabindex="-1"></span>Every displayed participant has a zero revenue share. Expand to edit the hidden roster cards. Counts are unchanged.</p>`
        : rosterFilterCount === 1 && hideParticipantsOverCapacity
          ? `<p class="notice"><span id="share-hold-jump" tabindex="-1"></span>Every displayed participant has volume above listed capacity. Expand to edit the hidden roster cards. Counts are unchanged.</p>`
          : rosterFilterCount === 1 && hideParticipantsAtHold
            ? `<p class="notice"><span id="share-hold-jump" tabindex="-1"></span>Every displayed participant has volume headroom at or above a hold with no listed capacity breach. Expand to edit the hidden roster cards. Counts are unchanged.</p>`
            : rosterFilterCount === 1 && hideParticipantsWithoutCapacity
              ? `<p class="notice"><span id="share-hold-jump" tabindex="-1"></span>Every displayed participant has unbounded or omitted capacity. Expand to edit the hidden roster cards. Counts are unchanged.</p>`
              : rosterFilterCount === 1 && hideParticipantsWithSpareCapacity
                ? `<p class="notice"><span id="share-hold-jump" tabindex="-1"></span>Every displayed participant has unused listed capacity. Expand to edit the hidden roster cards. Counts are unchanged.</p>`
                : rosterFilterCount === 1 && hideParticipantsAtLeastHeadroom
                  ? `<p class="notice"><span id="share-hold-jump" tabindex="-1"></span>Every displayed participant is the least-headroom roster row. Expand to edit the hidden roster cards. Counts are unchanged.</p>`
                  : rosterFilterCount === 1 && hideParticipantsWithinCapacity
                    ? `<p class="notice"><span id="share-hold-jump" tabindex="-1"></span>Every displayed participant is within listed capacity. Expand to edit the hidden roster cards. Counts are unchanged.</p>`
                    : rosterFilterCount === 1 && hideFirstBreakpointParticipant
                      ? `<p class="notice"><span id="share-hold-jump" tabindex="-1"></span>Every displayed participant is the first-breakpoint roster row. Expand to edit the hidden roster cards. Counts are unchanged.</p>`
                      : rosterFilterCount === 1 && hideLastBreakpointParticipant
                        ? `<p class="notice"><span id="share-hold-jump" tabindex="-1"></span>Every displayed participant is the last first-breakpoint roster row. Expand to edit the hidden roster cards. Counts are unchanged.</p>`
                        : rosterFilterCount === 1 && hideFirstOverCapacityParticipant
                          ? `<p class="notice"><span id="share-hold-jump" tabindex="-1"></span>Every displayed participant is the first over-capacity roster row. Expand to edit the hidden roster cards. Counts are unchanged.</p>`
                          : rosterFilterCount === 1 && hideLastOverCapacityParticipant
                            ? `<p class="notice"><span id="share-hold-jump" tabindex="-1"></span>Every displayed participant is the last over-capacity roster row. Expand to edit the hidden roster cards. Counts are unchanged.</p>`
                            : rosterFilterCount === 1 && hideLastWithinCapacityParticipant
                              ? `<p class="notice"><span id="share-hold-jump" tabindex="-1"></span>Every displayed participant is the last within-capacity roster row. Expand to edit the hidden roster cards. Counts are unchanged.</p>`
                              : rosterFilterCount === 1 && hideFirstWithinCapacityParticipant
                                ? `<p class="notice"><span id="share-hold-jump" tabindex="-1"></span>Every displayed participant is the first within-capacity roster row. Expand to edit the hidden roster cards. Counts are unchanged.</p>`
                                : rosterFilterCount === 1 && hideLastSpareCapacityParticipant
                                  ? `<p class="notice"><span id="share-hold-jump" tabindex="-1"></span>Every displayed participant is the last spare-capacity roster row. Expand to edit the hidden roster cards. Counts are unchanged.</p>`
                                  : rosterFilterCount === 1 && hideFirstSpareCapacityParticipant
                                    ? `<p class="notice"><span id="share-hold-jump" tabindex="-1"></span>Every displayed participant is the first spare-capacity roster row. Expand to edit the hidden roster cards. Counts are unchanged.</p>`
                                  : rosterFilterCount === 1 && hideLastParticipantWithoutCapacity
                                    ? `<p class="notice"><span id="share-hold-jump" tabindex="-1"></span>Every displayed participant is the last participant without listed capacity. Expand to edit the hidden roster cards. Counts are unchanged.</p>`
                                  : rosterFilterCount === 1 && hideFirstParticipantWithoutCapacity
                                    ? `<p class="notice"><span id="share-hold-jump" tabindex="-1"></span>Every displayed participant is the first participant without listed capacity. Expand to edit the hidden roster cards. Counts are unchanged.</p>`
                                  : rosterFilterCount === 1 && hideLastParticipantAtHold
                                    ? `<p class="notice"><span id="share-hold-jump" tabindex="-1"></span>Every displayed participant is the last participant at hold. Expand to edit the hidden roster cards. Counts are unchanged.</p>`
                                  : rosterFilterCount === 1 && hideFirstParticipantAtHold
                                    ? `<p class="notice"><span id="share-hold-jump" tabindex="-1"></span>Every displayed participant is the first participant at hold. Expand to edit the hidden roster cards. Counts are unchanged.</p>`
                                  : rosterFilterCount === 1 && hideFirstZeroShareParticipant
                                    ? `<p class="notice"><span id="share-hold-jump" tabindex="-1"></span>Every displayed participant is the first participant with zero revenue share. Expand to edit the hidden roster cards. Counts are unchanged.</p>`
                                  : rosterFilterCount === 1 && hideLastZeroShareParticipant
                                    ? `<p class="notice"><span id="share-hold-jump" tabindex="-1"></span>Every displayed participant is the last participant with zero revenue share. Expand to edit the hidden roster cards. Counts are unchanged.</p>`
              : rosterFilterCount > 0
              ? `<p class="notice"><span id="share-hold-jump" tabindex="-1"></span>Every displayed participant is hidden by the current roster filters. Expand to edit the hidden roster cards. Counts are unchanged.</p>`
              : ''
    : '';

  return `
    <aside class="panel inputs" aria-label="Deal inputs">
      <div class="panel-heading"><h1>Deal ledger</h1><span class="optional">editable</span></div>
      <div class="panel-body">
        <section class="input-section" aria-labelledby="deal-inputs-title">
          <h2 id="deal-inputs-title" tabindex="-1">Shared deal</h2>
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
          <div class="button-row"><button type="button" data-action="copy-deal-notes">Copy deal notes</button><button type="button" id="copy-deal-title" data-action="copy-deal-title">Copy deal title and currency</button></div>
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
          <h2 id="participant-inputs-title" tabindex="-1">Participants</h2>
          <p class="notice">Shares must add to exactly 1. Leave capacity blank for no limit; a capacity of zero forbids any volume. Minimum commitment may be left blank; blank and zero are equivalent. Removing a participant reallocates that share across whoever remains. The last two participants cannot be removed.</p>
          ${duplicateNameWarning()}
          <p class="share-balance" aria-live="polite">${shareBalanceText()}</p><div class="button-row"><button type="button" data-action="copy-allocation-balance">Copy allocation balance</button><button type="button" id="equal-split" data-action="equal-shares">Split equally</button><button type="button" id="normalize-shares" data-action="normalize-shares">Normalize current shares</button></div>          <p class="notice">These actions change revenue shares only. Equal split assigns the same share to each participant. Normalize preserves the current proportions. Neither guarantees viability. Copy allocation balance names missing or excess share. It is not a negotiated allocation.</p>
          <div class="button-row"><button type="button" data-action="hide-holding-participants" aria-pressed="${hideHoldingParticipants}" ${result ? '' : 'disabled title="Resolve invalid inputs before filtering the roster"'}>Hide participants who currently hold</button><button type="button" data-action="show-holding-participants" ${hideHoldingParticipants ? '' : 'disabled'}>Show holding participants</button></div>
          <p class="notice">${rosterFilterNote}</p>
          <div class="button-row"><button type="button" data-action="hide-zero-share-participants" aria-pressed="${hideZeroShareParticipants}">Hide participants with zero revenue share</button><button type="button" data-action="show-zero-share-participants" ${hideZeroShareParticipants ? '' : 'disabled'}>Show zero-share participants</button></div>
          <p class="notice">${zeroShareFilterNote}</p>
          <div class="button-row"><button type="button" id="hide-first-zero-share-participant" data-action="hide-first-zero-share-participant" aria-keyshortcuts="ArrowRight" aria-pressed="${hideFirstZeroShareParticipant}">Hide the first participant with zero revenue share</button><button type="button" data-action="show-first-zero-share-participant" ${hideFirstZeroShareParticipant ? '' : 'disabled'}>Show the first participant with zero revenue share</button><button type="button" id="copy-first-zero-share-participant" data-action="copy-first-zero-share-participant" aria-keyshortcuts="F7">Copy first zero-share participant label</button><button type="button" id="copy-first-zero-share-remaining" data-action="copy-first-zero-share-remaining" aria-keyshortcuts="Shift+F10">Copy first zero-share remaining-to-hold</button></div>
          <p class="notice">${firstZeroShareFilterNote}</p>
          <div class="button-row"><button type="button" id="hide-last-zero-share-participant" data-action="hide-last-zero-share-participant" aria-keyshortcuts="Backspace" aria-pressed="${hideLastZeroShareParticipant}">Hide the last participant with zero revenue share</button><button type="button" data-action="show-last-zero-share-participant" ${hideLastZeroShareParticipant ? '' : 'disabled'}>Show the last participant with zero revenue share</button><button type="button" id="copy-last-zero-share-participant" data-action="copy-last-zero-share-participant" aria-keyshortcuts="F3">Copy last zero-share participant label</button><button type="button" id="copy-last-zero-share-remaining" data-action="copy-last-zero-share-remaining" aria-keyshortcuts="F10">Copy last zero-share remaining-to-hold</button></div>
          <p class="notice">${lastZeroShareFilterNote}</p>
          <div class="button-row"><button type="button" data-action="hide-over-capacity-participants" aria-pressed="${hideParticipantsOverCapacity}" ${result ? '' : 'disabled title="Resolve invalid inputs before filtering the roster"'}>Hide participants whose volume is above listed capacity</button><button type="button" data-action="show-over-capacity-participants" ${hideParticipantsOverCapacity ? '' : 'disabled'}>Show over-capacity participants</button><button type="button" id="copy-over-capacity-count" data-action="copy-over-capacity-count" aria-keyshortcuts='"'>Copy over-capacity participant count</button><button type="button" id="copy-first-over-capacity-label" data-action="copy-first-over-capacity-label" aria-keyshortcuts="}">Copy first over-capacity participant label</button><button type="button" id="copy-first-over-capacity-remaining" data-action="copy-first-over-capacity-remaining" aria-keyshortcuts="~">Copy first over-capacity remaining listed capacity</button><button type="button" id="copy-last-over-capacity-label" data-action="copy-last-over-capacity-label" aria-keyshortcuts="(">Copy last over-capacity participant label</button><button type="button" id="copy-last-over-capacity-remaining" data-action="copy-last-over-capacity-remaining" aria-keyshortcuts="*">Copy last over-capacity remaining listed capacity</button></div>
          <p class="notice">${overCapacityFilterNote}</p>
          <div class="button-row"><button type="button" data-action="hide-at-hold-participants" aria-pressed="${hideParticipantsAtHold}" ${result ? '' : 'disabled title="Resolve invalid inputs before filtering the roster"'}>Hide participants at hold with no listed capacity breach</button><button type="button" data-action="show-at-hold-participants" ${hideParticipantsAtHold ? '' : 'disabled'}>Show at-hold participants</button></div>
          <p class="notice">${atHoldFilterNote}</p>
          <div class="button-row"><button type="button" id="hide-last-at-hold-participant" data-action="hide-last-at-hold-participant" aria-keyshortcuts="ArrowUp" aria-pressed="${hideLastParticipantAtHold}" ${result ? '' : 'disabled title="Resolve invalid inputs before filtering the roster"'}>Hide the last participant at hold</button><button type="button" data-action="show-last-at-hold-participant" ${hideLastParticipantAtHold ? '' : 'disabled'}>Show the last participant at hold</button><button type="button" id="copy-last-at-hold-remaining" data-action="copy-last-at-hold-remaining" aria-keyshortcuts="Insert">Copy last at-hold remaining-to-hold</button></div>
          <p class="notice">${lastAtHoldFilterNote}</p>
          <div class="button-row"><button type="button" id="hide-first-at-hold-participant" data-action="hide-first-at-hold-participant" aria-keyshortcuts="ArrowLeft" aria-pressed="${hideFirstParticipantAtHold}" ${result ? '' : 'disabled title="Resolve invalid inputs before filtering the roster"'}>Hide the first participant at hold</button><button type="button" data-action="show-first-at-hold-participant" ${hideFirstParticipantAtHold ? '' : 'disabled'}>Show the first participant at hold</button><button type="button" id="copy-first-at-hold-remaining" data-action="copy-first-at-hold-remaining" aria-keyshortcuts="Delete">Copy first at-hold remaining-to-hold</button></div>
          <p class="notice">${firstAtHoldFilterNote}</p>
          <div class="button-row"><button type="button" data-action="hide-without-capacity-participants" aria-pressed="${hideParticipantsWithoutCapacity}">Hide participants whose capacity is unbounded</button><button type="button" data-action="show-without-capacity-participants" ${hideParticipantsWithoutCapacity ? '' : 'disabled'}>Show participants without listed capacity</button></div>
          <p class="notice">${withoutCapacityFilterNote}</p>
          <div class="button-row"><button type="button" id="hide-last-without-capacity-participant" data-action="hide-last-without-capacity-participant" aria-keyshortcuts="3" aria-pressed="${hideLastParticipantWithoutCapacity}" ${result ? '' : 'disabled title="Resolve invalid inputs before filtering the roster"'}>Hide the last participant without listed capacity</button><button type="button" data-action="show-last-without-capacity-participant" ${hideLastParticipantWithoutCapacity ? '' : 'disabled'}>Show the last participant without listed capacity</button><button type="button" id="copy-last-unbounded-remaining" data-action="copy-last-unbounded-remaining" aria-keyshortcuts="4">Copy last unbounded remaining-to-hold</button></div>
          <p class="notice">${lastWithoutCapacityFilterNote}</p>
          <div class="button-row"><button type="button" id="hide-first-without-capacity-participant" data-action="hide-first-without-capacity-participant" aria-keyshortcuts="End" aria-pressed="${hideFirstParticipantWithoutCapacity}" ${result ? '' : 'disabled title="Resolve invalid inputs before filtering the roster"'}>Hide the first participant without listed capacity</button><button type="button" data-action="show-first-without-capacity-participant" ${hideFirstParticipantWithoutCapacity ? '' : 'disabled'}>Show the first participant without listed capacity</button><button type="button" id="copy-first-unbounded-remaining" data-action="copy-first-unbounded-remaining" aria-keyshortcuts="PageUp">Copy first unbounded remaining-to-hold</button></div>
          <p class="notice">${firstWithoutCapacityFilterNote}</p>
          <div class="button-row"><button type="button" data-action="hide-spare-capacity-participants" aria-pressed="${hideParticipantsWithSpareCapacity}" ${result ? '' : 'disabled title="Resolve invalid inputs before filtering the roster"'}>Hide participants with unused listed capacity</button><button type="button" data-action="show-spare-capacity-participants" ${hideParticipantsWithSpareCapacity ? '' : 'disabled'}>Show participants with spare capacity</button></div>
          <p class="notice">${spareCapacityFilterNote}</p>
          <div class="button-row"><button type="button" id="hide-last-spare-capacity-participant" data-action="hide-last-spare-capacity-participant" aria-keyshortcuts="7" aria-pressed="${hideLastSpareCapacityParticipant}" ${result ? '' : 'disabled title="Resolve invalid inputs before filtering the roster"'}>Hide the last spare-capacity participant</button><button type="button" data-action="show-last-spare-capacity-participant" ${hideLastSpareCapacityParticipant ? '' : 'disabled'}>Show the last spare-capacity participant</button><button type="button" id="copy-last-spare-capacity-remaining" data-action="copy-last-spare-capacity-remaining" aria-keyshortcuts="8">Copy last spare-capacity remaining listed capacity</button></div>
          <p class="notice">${lastSpareCapacityFilterNote}</p>
          <div class="button-row"><button type="button" id="hide-first-spare-capacity-participant" data-action="hide-first-spare-capacity-participant" aria-keyshortcuts="0" aria-pressed="${hideFirstSpareCapacityParticipant}" ${result ? '' : 'disabled title="Resolve invalid inputs before filtering the roster"'}>Hide the first spare-capacity participant</button><button type="button" data-action="show-first-spare-capacity-participant" ${hideFirstSpareCapacityParticipant ? '' : 'disabled'}>Show the first spare-capacity participant</button><button type="button" id="copy-first-spare-capacity-remaining" data-action="copy-first-spare-capacity-remaining" aria-keyshortcuts="1">Copy first spare-capacity remaining listed capacity</button></div>
          <p class="notice">${firstSpareCapacityFilterNote}</p>
          <div class="button-row"><button type="button" data-action="hide-least-headroom-participants" aria-keyshortcuts="=" aria-pressed="${hideParticipantsAtLeastHeadroom}" ${result ? '' : 'disabled title="Resolve invalid inputs before filtering the roster"'}>Hide the least-headroom participant</button><button type="button" data-action="show-least-headroom-participants" ${hideParticipantsAtLeastHeadroom ? '' : 'disabled'}>Show the least-headroom participant</button></div>
          <p class="notice">${leastHeadroomFilterNote}</p>
          <div class="button-row"><button type="button" id="hide-within-capacity-participants" data-action="hide-within-capacity-participants" aria-keyshortcuts="{" aria-pressed="${hideParticipantsWithinCapacity}" ${result ? '' : 'disabled title="Resolve invalid inputs before filtering the roster"'}>Hide participants who are within listed capacity</button><button type="button" data-action="show-within-capacity-participants" ${hideParticipantsWithinCapacity ? '' : 'disabled'}>Show participants within listed capacity</button><button type="button" id="copy-first-within-capacity-remaining" data-action="copy-first-within-capacity-remaining" aria-keyshortcuts="$">Copy first within-capacity remaining listed capacity</button></div>
          <p class="notice">${withinCapacityFilterNote}</p>
          <div class="button-row"><button type="button" id="hide-last-within-capacity-participant" data-action="hide-last-within-capacity-participant" aria-pressed="${hideLastWithinCapacityParticipant}" ${result ? '' : 'disabled title="Resolve invalid inputs before filtering the roster"'}>Hide the last within-capacity participant</button><button type="button" data-action="show-last-within-capacity-participant" ${hideLastWithinCapacityParticipant ? '' : 'disabled'}>Show the last within-capacity participant</button><button type="button" id="copy-last-within-capacity-remaining" data-action="copy-last-within-capacity-remaining" aria-keyshortcuts="5">Copy last within-capacity remaining listed capacity</button></div>
          <p class="notice">${lastWithinCapacityFilterNote}</p>
          <div class="button-row"><button type="button" id="hide-first-within-capacity-participant" data-action="hide-first-within-capacity-participant" aria-keyshortcuts="\`" aria-pressed="${hideFirstWithinCapacityParticipant}" ${result ? '' : 'disabled title="Resolve invalid inputs before filtering the roster"'}>Hide the first within-capacity participant</button><button type="button" data-action="show-first-within-capacity-participant" ${hideFirstWithinCapacityParticipant ? '' : 'disabled'}>Show the first within-capacity participant</button></div>
          <p class="notice">${firstWithinCapacityFilterNote}</p>
          <div class="button-row"><button type="button" id="hide-first-breakpoint-participant" data-action="hide-first-breakpoint-participant" aria-keyshortcuts="|" aria-pressed="${hideFirstBreakpointParticipant}" ${result ? '' : 'disabled title="Resolve invalid inputs before filtering the roster"'}>Hide the first-breakpoint participant</button><button type="button" data-action="show-first-breakpoint-participant" ${hideFirstBreakpointParticipant ? '' : 'disabled'}>Show the first-breakpoint participant</button></div>
          <p class="notice">${firstBreakpointFilterNote}</p>
          <div class="button-row"><button type="button" id="hide-last-breakpoint-participant" data-action="hide-last-breakpoint-participant" aria-pressed="${hideLastBreakpointParticipant}" ${result ? '' : 'disabled title="Resolve invalid inputs before filtering the roster"'}>Hide the last first-breakpoint participant</button><button type="button" data-action="show-last-breakpoint-participant" ${hideLastBreakpointParticipant ? '' : 'disabled'}>Show the last first-breakpoint participant</button><button type="button" id="copy-last-breakpoint-label" data-action="copy-last-breakpoint-label">Copy last first-breakpoint participant label</button></div>
          <p class="notice">${lastBreakpointFilterNote}</p>
          <div class="button-row"><button type="button" id="hide-first-over-capacity-participant" data-action="hide-first-over-capacity-participant" aria-keyshortcuts="@" aria-pressed="${hideFirstOverCapacityParticipant}" ${result ? '' : 'disabled title="Resolve invalid inputs before filtering the roster"'}>Hide the first over-capacity participant</button><button type="button" data-action="show-first-over-capacity-participant" ${hideFirstOverCapacityParticipant ? '' : 'disabled'}>Show the first over-capacity participant</button></div>
          <p class="notice">${firstOverCapacityFilterNote}</p>
          <div class="button-row"><button type="button" id="hide-last-over-capacity-participant" data-action="hide-last-over-capacity-participant" aria-keyshortcuts="#" aria-pressed="${hideLastOverCapacityParticipant}" ${result ? '' : 'disabled title="Resolve invalid inputs before filtering the roster"'}>Hide the last over-capacity participant</button><button type="button" data-action="show-last-over-capacity-participant" ${hideLastOverCapacityParticipant ? '' : 'disabled'}>Show the last over-capacity participant</button></div>
          <p class="notice">${lastOverCapacityFilterNote}</p>
          ${participantForms || rosterEmptyNotice}
          <div class="button-row"><button type="button" id="add-participant" data-action="add-participant" ${state.participants.length >= MAX_PARTICIPANTS ? 'disabled title="Participant limit reached"' : ''}>Add participant</button></div>
          <label class="roster-paste-label" for="roster-paste">Paste participant CSV or TSV</label>
          <textarea id="roster-paste" data-action="roster-paste" rows="6">${escapeAttribute(rosterPasteText)}</textarea>
          <div class="button-row"><button type="button" data-action="import-roster-paste">Import pasted roster</button></div>
          <p class="notice">Pasted CSV or TSV uses the same columns and validation as file import. Deal terms stay unchanged.</p>
        </section>
        <section class="input-section" aria-labelledby="data-title">
          <h2 id="data-title">Data</h2>
          <h2 id="print-one-pager-title" tabindex="-1" class="visually-hidden">Print one-pager</h2>
          ${libraryPanel()}
          <div class="button-row"><button type="button" data-action="undo" ${undoHistory.length ? '' : 'disabled'}>Undo</button><button type="button" data-action="redo" ${redoHistory.length ? '' : 'disabled'}>Redo</button><button type="button" data-action="open-help">Keyboard shortcuts</button><button type="button" data-action="show-coach">Show tour</button></div>
          <p class="notice">Undo retains the last 50 edits in this tab, including resets and imports.</p>
          <p class="notice">Import a JSON case exported by this workbench. Files must be 250 KB or smaller. Empty files, invalid JSON, and failed validation name the parse or field cause. Compare imported JSON shows honest diffs against the current draft without replacing it. Participant CSV replaces the roster only after every row validates; deal terms stay unchanged. Export participant CSV uses those same columns and formula-safe cells.</p>
          <div class="button-row">
            <button type="button" data-action="export">Export JSON</button><button type="button" data-action="export-redacted">Export redacted JSON (names replaced, title cleared)</button><button type="button" id="print-report" data-action="print-report">Print report</button><button type="button" data-action="print-redacted">Print redacted</button><button type="button" data-action="export-report">Export decision report</button><button type="button" data-action="copy-brief">Copy negotiation brief</button><button type="button" data-action="copy-deal-notes">Copy deal notes</button>${standaloneFileMode ? '' : '<button type="button" data-action="copy-share-url">Copy share URL</button>'}<button type="button" data-action="export-csv">Export stress CSV</button><button type="button" data-action="export-visible-csv">Export visible stress CSV</button><button type="button" data-action="copy-visible-csv">Copy visible stress CSV</button><button type="button" data-action="export-participants-csv">Export participant CSV</button>
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
    return `<section class="results" id="results-start">${errorBox(errors)}${importedCompareSection()}${notesCopySection()}${waterfallCopySection()}${viabilityCopySection()}${utilizationCopySection()}${tornadoCopySection()}${operatingCopySection()}${splitCopySection()}${allocationCopySection()}${breakpointSnapshotCopySection()}${titleCopySection()}${breakpointLabelCopySection()}${remainingCopySection()}${volumeCopySection()}${viabilityLabelCopySection()}${overCapacityCountCopySection()}${firstOverCapacityLabelCopySection()}${firstOverCapacityRemainingCopySection()}${lastOverCapacityLabelCopySection()}${lastOverCapacityRemainingCopySection()}${firstWithinCapacityRemainingCopySection()}${lastWithinCapacityRemainingCopySection()}${lastSpareCapacityRemainingCopySection()}${firstSpareCapacityRemainingCopySection()}${lastUnboundedRemainingCopySection()}${firstUnboundedRemainingCopySection()}${lastAtHoldRemainingCopySection()}${firstAtHoldRemainingCopySection()}${lastZeroShareLabelCopySection()}${lastZeroShareRemainingCopySection()}${firstZeroShareRemainingCopySection()}${firstZeroShareLabelCopySection()}${lastBreakpointLabelCopySection()}<section class="panel"><div class="panel-heading"><h2>Model status</h2></div><div class="panel-body"><p class="notice">Calculations return once every required field is valid and shares reconcile to 1.</p></div></section>${methodAndLimits()}</section>`;
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
    <section class="status-card ${statusClass}" id="viability-card" tabindex="-1" aria-labelledby="viability-heading" aria-live="polite">
      <div><h2 class="eyebrow" id="viability-heading" tabindex="-1">Partnership viability</h2><h1>${status}</h1>${identity ? `<p>${identity}</p>` : ''}<p>${statusDetail}</p><div class="button-row"><button type="button" data-action="copy-viability">Copy viability card</button><button type="button" id="copy-viability-label" data-action="copy-viability-label">Copy least-headroom participant label</button></div></div>
      <div class="score"><strong>${result.viable ? 'VIABLE' : 'NOT VIABLE'}</strong><span>at ${formatVolume(result.effectiveVolume)} / month</span></div>
    </section>
    <section class="metric-strip" aria-label="Deal summary">
      <div class="metric"><span>Effective volume</span><strong>${formatVolume(result.effectiveVolume)}</strong></div>
      <div class="metric"><span>Total revenue</span><strong>${formatMoney(result.totalRevenue)}</strong></div>
      <div class="metric"><span>Total participant profit</span><strong>${formatMoney(result.totalProfit)}</strong></div>
      <div class="metric"><span>Capacity ceiling</span><strong>${formatVolume(result.capacityCeiling)}</strong></div>
    </section>
    <section class="print-only print-keep"><h2>Deal title</h2><p>${state.deal.title ? escapeAttribute(state.deal.title) : 'No deal title was entered.'}</p></section>
    <section class="print-only print-keep"><h2>Currency code</h2><p>${currencyPrefix() ? escapeAttribute(currencyPrefix()) : 'No currency code was entered.'}</p></section>
    <section class="print-only print-keep"><h2>Least headroom</h2><p>${escapeAttribute(result.weakestParticipant.name)} has the least volume headroom to its ${escapeAttribute(result.weakestParticipant.bindingConstraint.label)} limit.</p></section>
    <section class="print-only print-keep"><h2>Least-headroom participant</h2><p>${escapeAttribute(leastHeadroomLabelMarkdown(result))}</p></section>
    <section class="print-only print-keep"><h2>First-breakpoint participant</h2><p>${escapeAttribute(firstBreakpointLabelMarkdown(result))}</p></section>
    <section class="print-only print-keep"><h2>First-breakpoint remaining-to-hold</h2><p>${escapeAttribute(firstBreakpointRemainingToHoldMarkdown(result))}</p></section>
    <section class="print-only print-keep"><h2>First-breakpoint volume-to-hold</h2><p>${escapeAttribute(firstBreakpointVolumeToHoldMarkdown(result))}</p></section>
    <section class="print-only print-keep"><h2>Over-capacity participant count</h2><p>${escapeAttribute(overCapacityCountMarkdown(result))}</p></section>
    <section class="print-only print-keep"><h2>First over-capacity participant</h2><p>${escapeAttribute(firstOverCapacityLabelMarkdown(result))}</p></section>
    <section class="print-only print-keep"><h2>First over-capacity remaining listed capacity</h2><p>${escapeAttribute(firstOverCapacityRemainingMarkdown(result))}</p></section>
    <section class="print-only print-keep"><h2>Last over-capacity participant</h2><p>${escapeAttribute(lastOverCapacityLabelMarkdown(result))}</p></section>
    <section class="print-only print-keep"><h2>Last over-capacity remaining listed capacity</h2><p>${escapeAttribute(lastOverCapacityRemainingMarkdown(result))}</p></section>
    <section class="print-only print-keep"><h2>First within-capacity remaining listed capacity</h2><p>${escapeAttribute(firstWithinCapacityRemainingMarkdown(result))}</p></section>
    <section class="print-only print-keep"><h2>Last within-capacity remaining listed capacity</h2><p>${escapeAttribute(lastWithinCapacityRemainingMarkdown(result))}</p></section>
    <section class="print-only print-keep"><h2>Last spare-capacity remaining listed capacity</h2><p>${escapeAttribute(lastSpareCapacityRemainingMarkdown(result))}</p></section>
    <section class="print-only print-keep"><h2>First spare-capacity remaining listed capacity</h2><p>${escapeAttribute(firstSpareCapacityRemainingMarkdown(result))}</p></section>
    <section class="print-only print-keep"><h2>Last unbounded remaining-to-hold</h2><p>${escapeAttribute(lastUnboundedRemainingMarkdown(result))}</p></section>
    <section class="print-only print-keep"><h2>First unbounded remaining-to-hold</h2><p>${escapeAttribute(firstUnboundedRemainingMarkdown(result))}</p></section>
    <section class="print-only print-keep"><h2>Last at-hold remaining-to-hold</h2><p>${escapeAttribute(lastAtHoldRemainingMarkdown(result))}</p></section>
    <section class="print-only print-keep"><h2>First at-hold remaining-to-hold</h2><p>${escapeAttribute(firstAtHoldRemainingMarkdown(result))}</p></section>
    <section class="print-only print-keep"><h2>Last zero-share participant</h2><p>${escapeAttribute(lastZeroShareLabelMarkdown(result))}</p></section>
    <section class="print-only print-keep"><h2>Last zero-share remaining-to-hold</h2><p>${escapeAttribute(lastZeroShareRemainingMarkdown(result))}</p></section>
    <section class="print-only print-keep"><h2>First zero-share participant</h2><p>${escapeAttribute(firstZeroShareLabelMarkdown(result))}</p></section>
    <section class="print-only print-keep"><h2>Allocation balance</h2><p>${escapeAttribute(shareBalanceText())}</p></section>
    <section class="print-only print-keep"><h2>Deal notes</h2>${state.deal.notes ? `<p>${escapeAttribute(state.deal.notes)}</p>` : '<p>No deal notes were entered.</p>'}</section>
    <section class="print-only print-hide"><h2>Case assumptions</h2><p>Reproducible inputs. Deterministic monthly model; money is expressed in consistent currency units.</p><pre>${escapeAttribute(JSON.stringify(state, null, 2))}</pre></section>
    <nav class="results-jump" aria-label="Jump in results" id="results-jump" tabindex="-1">
      <span class="eyebrow">Jump in results</span>
      <a href="#viability-heading">Viability</a>
      <a href="#first-breakpoint">First breakpoint</a>
      <a href="#fee-guidance-title">Fee guide</a>
      <a href="#three-compare-title">Three-snapshot compare</a>
      ${importedCompare ? '<a href="#imported-compare-title">Imported JSON compare</a>' : ''}
      <a href="#charts-title">Charts</a>
      <a href="#tornado-title">Tornado</a>
      <a href="#waterfall-title">Waterfall</a>
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
    ${shareHoldCopySection()}
    ${notesCopySection()}
    ${waterfallCopySection()}
    ${viabilityCopySection()}
    ${utilizationCopySection()}
    ${tornadoCopySection()}
    ${operatingCopySection()}
    ${splitCopySection()}
    ${allocationCopySection()}
    ${breakpointSnapshotCopySection()}
    ${titleCopySection()}
    ${breakpointLabelCopySection()}
    ${remainingCopySection()}
    ${volumeCopySection()}
    ${viabilityLabelCopySection()}
    ${overCapacityCountCopySection()}
    ${firstOverCapacityLabelCopySection()}
    ${firstOverCapacityRemainingCopySection()}
    ${lastOverCapacityLabelCopySection()}
    ${lastOverCapacityRemainingCopySection()}
    ${firstWithinCapacityRemainingCopySection()}
    ${lastWithinCapacityRemainingCopySection()}
    ${lastSpareCapacityRemainingCopySection()}
    ${firstSpareCapacityRemainingCopySection()}
    ${lastUnboundedRemainingCopySection()}
    ${firstUnboundedRemainingCopySection()}
    ${lastAtHoldRemainingCopySection()}
    ${firstAtHoldRemainingCopySection()}
    ${lastZeroShareLabelCopySection()}
    ${lastZeroShareRemainingCopySection()}
    ${firstZeroShareRemainingCopySection()}
    ${firstZeroShareLabelCopySection()}
    ${lastBreakpointLabelCopySection()}
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
  return `<section class="panel compound-panel" aria-labelledby="compound-title"><div class="panel-heading"><h2 id="compound-title" tabindex="-1">Compound stress and negotiation</h2><span class="optional">v1.4.3</span></div>
    <div class="panel-body"><p class="stress-summary" aria-live="polite"><strong>${stress.passCount} of ${stress.caseCount} tested cases hold</strong> under the current shares.</p>
      <p>${statusText}</p><p>Minimum shares across all cases total <strong>${negotiation.requiredShareTotal === null ? 'no finite allocation' : formatPct(negotiation.requiredShareTotal * 100)}</strong>. Available revenue share: 100%. Profit gap means monthly profit less the participant's minimum.</p>
      <div class="button-row"><button type="button" class="primary" data-action="apply-stress-proposal" ${negotiation.proposal ? '' : 'disabled'}>Apply tested revenue split</button><button type="button" data-action="edit-stress-settings">Edit stress settings</button><button type="button" data-action="copy-tested-split">Copy tested split</button><button type="button" data-action="collapse-all-hold-cases" aria-pressed="${collapseAllHoldCases}">Collapse cases every participant holds</button><button type="button" data-action="expand-all-hold-cases" ${collapseAllHoldCases ? '' : 'disabled'}>Show all-hold cases</button><button type="button" data-action="export-csv">Export all cases CSV</button><button type="button" data-action="export-visible-csv">Export visible cases CSV</button><button type="button" data-action="copy-visible-csv">Copy visible cases CSV</button></div>
      <p class="notice">The proposal is conditional on the entered cases, not an agreed contract or an optimal negotiation. Preview the shares below before applying. Hide in table removes a row from this display only; counts and proposals still include that participant. ${collapseNote}</p></div>
    <div class="table-wrap" tabindex="0" role="region" aria-label="Stress participant ledger, scroll horizontally"><table class="stress-table"><caption>Participant stress ledger and proposed shares</caption><thead><tr><th scope="col">Participant</th><th scope="col">Cases held</th><th scope="col">Worst profit gap</th><th scope="col">Operations</th><th scope="col">Current share</th><th scope="col">Minimum share</th><th scope="col">Proposal</th></tr></thead><tbody>${rows}</tbody></table></div>
    ${stressCasePreview(stress)}
    <details class="case-details"><summary id="inspect-cases-title" tabindex="-1">Inspect all ${stress.caseCount} compound cases</summary><div class="table-wrap" tabindex="0" role="region" aria-label="Compound case evidence, scroll horizontally"><table class="stress-table"><caption>Deterministic case evidence, counts are not likelihoods. ${visibleCases.length} of ${stress.caseCount} rows are visible.</caption><thead><tr><th scope="col">Case and simultaneous shocks</th><th scope="col">Effective volume</th><th scope="col">Fee / transaction</th><th scope="col">Total profit</th><th scope="col">Participant tests</th></tr></thead><tbody>${cases || `<tr><td colspan="5">Every displayed case currently holds. ${stress.passCount} of ${stress.caseCount} tested cases hold. Expand to inspect all-hold rows. Counts are unchanged.</td></tr>`}</tbody></table></div></details>
    <p class="output-note">Only these discrete cases are evaluated. No claim is made about untested cases or future participant behavior. Edit Compound stress settings in the Deal ledger.</p></section>`;
}

function participantHoldsEveryCompoundCase(stress, participantId) {
  const row = stress.participants.find((item) => item.id === participantId);
  return Boolean(row && row.passCount === stress.caseCount);
}

function capacityUtilizationLabel(participant) {
  if (participant.capacity == null || participant.capacityUtilization == null) {
    return 'Unbounded';
  }
  if (!Number.isFinite(participant.capacityUtilization)) {
    return 'Exceeds zero capacity';
  }
  const pct = participant.capacityUtilization * 100;
  return `${formatNumber(participant.volume)} / ${formatNumber(participant.capacity)} (${formatPct(pct)} of capacity)`;
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
  const stress = evaluateStressGrid(state);
  const hiddenHoldCount = hideAllCompoundHolders
    ? result.participants.filter((participant) => participantHoldsEveryCompoundCase(stress, participant.id)).length
    : 0;
  const visibleParticipants = hideAllCompoundHolders
    ? result.participants.filter((participant) => !participantHoldsEveryCompoundCase(stress, participant.id))
    : result.participants;
  const rows = visibleParticipants.map((participant) => {
    const index = result.participants.findIndex((item) => item.id === participant.id);
    return `
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
    </tr>`;
  }).join('');
  const emptyRow = hideAllCompoundHolders && !visibleParticipants.length
    ? `<tr><td colspan="14">Every displayed participant holds in every tested compound case. Expand to see the hidden ledger rows. ${stress.passCount} of ${stress.caseCount} tested cases hold. Counts are unchanged.</td></tr>`
    : '';
  const filterNote = hideAllCompoundHolders
    ? `${hiddenHoldCount} participant${hiddenHoldCount === 1 ? '' : 's'} who hold in every tested compound case ${hiddenHoldCount === 1 ? 'is' : 'are'} hidden from this ledger display. Expand restores them. Grid counts are unchanged.`
    : 'Hide participants who hold in every tested compound case to filter this ledger display only. Expand restores them. Counts stay the same.';
  return `<section class="panel print-keep" id="participant-ledger"><div class="panel-heading"><h2 id="participant-ledger-title" tabindex="-1">Participant ledger</h2><span class="optional">display values</span></div><div class="panel-body"><div class="button-row"><button type="button" data-action="copy-utilization">Copy capacity utilization</button><button type="button" data-action="hide-all-hold-ledger" aria-pressed="${hideAllCompoundHolders}">Hide participants who hold in every tested compound case</button><button type="button" data-action="show-all-hold-ledger" ${hideAllCompoundHolders ? '' : 'disabled'}>Show all-hold ledger rows</button></div><p class="notice">${filterNote}</p></div><div class="table-wrap" tabindex="0" role="region" aria-label="Participant ledger, scroll horizontally"><table><caption>Participant ledger</caption><thead><tr><th>Participant</th><th>Revenue</th><th>Variable cost</th><th>Fixed cost</th><th>Risk cost</th><th>Monthly profit</th><th>Margin</th><th>Break-even volume</th><th>Exit volume</th><th>Headroom</th><th>Capacity</th><th>Capacity use</th><th>Binding limit</th><th>Exit test</th></tr></thead><tbody>${rows || emptyRow}</tbody></table></div><p class="output-note">Exit volume is the greater of the profit threshold and minimum commitment. Binding limit identifies the nearest economic or capacity boundary. Capacity use is effective volume divided by capacity, or Unbounded when no capacity is supplied. Hiding all-hold participants is a display filter. Tested-case counts stay unchanged.</p></section>`;
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
  let rows = [];
  for (const participant of result.participants) {
    for (const [kind, label] of kinds) {
      const shock = participant.shocks[kind];
      const bounded = shock.status === 'bounded' && shock.changePct != null && Number.isFinite(shock.changePct);
      rows.push({
        name: participant.name,
        kind,
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
  if (hideUnboundedTornado) {
    rows = rows.filter((row) => row.status !== 'unbounded' && row.display !== 'No bounded shock');
  }
  const finite = rows.map((row) => row.changePct).filter((value) => value != null);
  const maxPct = Math.max(1, ...finite);
  const rowHeight = 22;
  const left = 190;
  const width = 720;
  const height = 28 + Math.max(rows.length, 1) * rowHeight;
  const barMax = width - left - 90;
  const bars = rows.map((row, index) => {
    const y = 8 + index * rowHeight;
    const barWidth = row.changePct == null ? 0 : (row.changePct / maxPct) * barMax;
    return `<text x="8" y="${y + 13}" font-size="11" fill="#1f2328">${escapeAttribute(chartLabel(`${row.name} / ${row.label}`, 28))}</text>
      <rect x="${left}" y="${y}" width="${Math.max(0, barWidth)}" height="14" fill="${row.changePct == null ? '#eae7de' : '#1558d6'}"></rect>
      <text x="${left + Math.max(0, barWidth) + 6}" y="${y + 13}" font-size="11" fill="#1f2328">${escapeAttribute(row.display)}</text>`;
  }).join('');
  const tableRows = rows.length
    ? rows.map((row) => `<tr><th scope="row">${escapeAttribute(row.name)}</th><td>${escapeAttribute(row.label)}</td><td>${escapeAttribute(row.display)}</td></tr>`).join('')
    : '<tr><td colspan="3">Every displayed tornado shock is unbounded or impossible. Expand to show all shocks. Model math is unchanged.</td></tr>';
  return { width, height, bars, tableRows, rows };
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
  const hiddenCount = hideUnboundedTornado
    ? result.participants.length * 4 - chart.rows.length
    : 0;
  const filterNote = hideUnboundedTornado
    ? `${hiddenCount} unbounded or impossible ${hiddenCount === 1 ? 'shock is' : 'shocks are'} hidden from this tornado display. Expand restores them. Model math is unchanged.`
    : 'Hide unbounded or impossible shocks to filter this tornado display only. Expand restores them. Model math is unchanged.';
  return `<section class="panel print-keep"><div class="panel-heading"><h2 id="tornado-title" tabindex="-1">Adverse-shock tornado</h2><span class="optional">percentage movement</span></div><div class="panel-body"><p>Each bar is that participant's smallest bounded adverse percentage shock in one direction. Unbounded and already-failing cases have no bar. This ranks displayed movements; it does not assign probability.</p><div class="button-row"><button type="button" data-action="export-tornado-svg">Download tornado SVG</button><button type="button" data-action="copy-tornado">Copy tornado</button><button type="button" data-action="hide-unbounded-tornado" aria-pressed="${hideUnboundedTornado}">Hide unbounded shocks</button><button type="button" data-action="show-unbounded-tornado" ${hideUnboundedTornado ? '' : 'disabled'}>Show all tornado shocks</button></div><p class="notice">${filterNote}</p><div class="chart-frame">${tornadoSvgMarkup(result)}</div></div><div class="table-wrap" tabindex="0" role="region" aria-label="Tornado values, text equivalent"><table class="tornado-table"><caption>Text equivalent of the tornado chart</caption><thead><tr><th scope="col">Participant</th><th scope="col">Shock</th><th scope="col">Adverse movement</th></tr></thead><tbody>${chart.tableRows}</tbody></table></div></section>`;
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
  return `<section class="panel print-keep" id="contribution-waterfall"><div class="panel-heading"><h2 id="waterfall-title" tabindex="-1">Contribution waterfall</h2><span class="optional">revenue to profit</span></div><div class="panel-body"><p>Each chart steps from fee revenue through variable, fixed, and risk cost to monthly profit. The dashed line is the entered minimum acceptable profit. The participant ledger remains the full numeric record.</p><div class="button-row"><button type="button" data-action="export-waterfall-svg">Download waterfall SVG</button><button type="button" data-action="copy-waterfall">Copy contribution waterfall</button></div>${charts}</div></section>`;
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
  return `<section class="panel"><div class="panel-heading"><h2 id="operating-region-title" tabindex="-1">Operating region</h2><span class="optional">fee and volume sensitivity</span></div><div class="panel-body"><p>Fee and volume combinations where every participant holds, or at least one participant exits. Display only. Model math is unchanged.</p><div class="button-row"><button type="button" data-action="copy-operating-region">Copy operating region</button></div></div><div class="sensitivity-layout"><div><canvas id="sensitivity-canvas" width="560" height="400" role="img" aria-label="Canvas chart of viable and non-viable fee and monthly-volume combinations. The visible table provides the same values.">Canvas chart unavailable. Use the operating region table.</canvas><div class="legend"><span><i class="swatch viable"></i>Every participant holds</span><span><i class="swatch fail"></i>At least one participant exits</span></div></div><div class="table-wrap" tabindex="0" role="region" aria-label="Operating region values, scroll horizontally"><table class="sensitivity-table"><caption>Operating region table. Rows are fee per transaction. Columns are monthly volume.</caption><thead><tr><th>Fee / volume</th>${grid.volumes.map((volume) => `<th>${formatNumber(volume)}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table></div></div></section>`;
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
    if (action === 'close-breakpoint-snapshot-copy') { breakpointSnapshotCopyText = ''; render(); return; }
    if (action === 'close-share-hold-copy') { shareHoldCopyText = ''; render(); return; }
    if (action === 'close-notes-copy') { notesCopyText = ''; render(); return; }
    if (action === 'close-waterfall-copy') { waterfallCopyText = ''; render(); return; }
    if (action === 'close-viability-copy') { viabilityCopyText = ''; render(); return; }
    if (action === 'close-utilization-copy') { utilizationCopyText = ''; render(); return; }
    if (action === 'close-tornado-copy') { tornadoCopyText = ''; render(); return; }
    if (action === 'close-operating-copy') { operatingCopyText = ''; render(); return; }
    if (action === 'close-split-copy') { splitCopyText = ''; render(); return; }
    if (action === 'close-allocation-copy') { allocationCopyText = ''; render(); return; }
    if (action === 'close-title-copy') { titleCopyText = ''; render(); return; }
    if (action === 'close-breakpoint-label-copy') { breakpointLabelCopyText = ''; render(); return; }
    if (action === 'close-remaining-copy') { remainingCopyText = ''; render(); return; }
    if (action === 'close-volume-copy') { volumeCopyText = ''; render(); return; }
    if (action === 'close-viability-label-copy') { viabilityLabelCopyText = ''; render(); return; }
    if (action === 'close-over-capacity-count-copy') { overCapacityCountCopyText = ''; render(); return; }
    if (action === 'close-first-over-capacity-label-copy') { firstOverCapacityLabelCopyText = ''; render(); return; }
    if (action === 'close-first-over-capacity-remaining-copy') { firstOverCapacityRemainingCopyText = ''; render(); return; }
    if (action === 'close-last-over-capacity-label-copy') { lastOverCapacityLabelCopyText = ''; render(); return; }
    if (action === 'close-last-over-capacity-remaining-copy') { lastOverCapacityRemainingCopyText = ''; render(); return; }
    if (action === 'close-first-within-capacity-remaining-copy') { firstWithinCapacityRemainingCopyText = ''; render(); return; }
    if (action === 'close-last-within-capacity-remaining-copy') { lastWithinCapacityRemainingCopyText = ''; render(); return; }
    if (action === 'close-last-spare-capacity-remaining-copy') { lastSpareCapacityRemainingCopyText = ''; render(); return; }
    if (action === 'close-first-spare-capacity-remaining-copy') { firstSpareCapacityRemainingCopyText = ''; render(); return; }
    if (action === 'close-last-unbounded-remaining-copy') { lastUnboundedRemainingCopyText = ''; render(); return; }
    if (action === 'close-first-unbounded-remaining-copy') { firstUnboundedRemainingCopyText = ''; render(); return; }
    if (action === 'close-last-at-hold-remaining-copy') { lastAtHoldRemainingCopyText = ''; render(); return; }
    if (action === 'close-first-at-hold-remaining-copy') { firstAtHoldRemainingCopyText = ''; render(); return; }
    if (action === 'close-last-zero-share-label-copy') { lastZeroShareLabelCopyText = ''; render(); return; }
    if (action === 'close-last-zero-share-remaining-copy') { lastZeroShareRemainingCopyText = ''; render(); return; }
    if (action === 'close-first-zero-share-remaining-copy') { firstZeroShareRemainingCopyText = ''; render(); return; }
    if (action === 'close-first-zero-share-label-copy') { firstZeroShareLabelCopyText = ''; render(); return; }
    if (action === 'close-last-breakpoint-label-copy') { lastBreakpointLabelCopyText = ''; render(); return; }
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
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'expand-all-hold-cases') {
      collapseAllHoldCases = false;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'hide-holding-participants') {
      if (!validateConfiguration(state).valid) {
        setNotice('Resolve invalid inputs before hiding participants who currently hold.');
        return;
      }
      hideHoldingParticipants = true;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'show-holding-participants') {
      hideHoldingParticipants = false;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'hide-zero-share-participants') {
      hideZeroShareParticipants = true;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'show-zero-share-participants') {
      hideZeroShareParticipants = false;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'hide-first-zero-share-participant') {
      hideFirstZeroShareParticipant = true;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'show-first-zero-share-participant') {
      hideFirstZeroShareParticipant = false;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'hide-last-zero-share-participant') {
      hideLastZeroShareParticipant = true;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'show-last-zero-share-participant') {
      hideLastZeroShareParticipant = false;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'hide-over-capacity-participants') {
      if (!validateConfiguration(state).valid) {
        setNotice('Resolve invalid inputs before hiding participants whose volume is above listed capacity.');
        return;
      }
      hideParticipantsOverCapacity = true;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'show-over-capacity-participants') {
      hideParticipantsOverCapacity = false;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'hide-at-hold-participants') {
      if (!validateConfiguration(state).valid) {
        setNotice('Resolve invalid inputs before hiding participants at hold with no listed capacity breach.');
        return;
      }
      hideParticipantsAtHold = true;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'show-at-hold-participants') {
      hideParticipantsAtHold = false;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'hide-without-capacity-participants') {
      hideParticipantsWithoutCapacity = true;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'show-without-capacity-participants') {
      hideParticipantsWithoutCapacity = false;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'hide-spare-capacity-participants') {
      if (!validateConfiguration(state).valid) {
        setNotice('Resolve invalid inputs before hiding participants with unused listed capacity.');
        return;
      }
      hideParticipantsWithSpareCapacity = true;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'show-spare-capacity-participants') {
      hideParticipantsWithSpareCapacity = false;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'hide-least-headroom-participants') {
      if (!validateConfiguration(state).valid) {
        setNotice('Resolve invalid inputs before hiding the least-headroom participant.');
        return;
      }
      hideParticipantsAtLeastHeadroom = true;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'show-least-headroom-participants') {
      hideParticipantsAtLeastHeadroom = false;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'hide-within-capacity-participants') {
      if (!validateConfiguration(state).valid) {
        setNotice('Resolve invalid inputs before hiding participants who are within listed capacity.');
        return;
      }
      hideParticipantsWithinCapacity = true;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'show-within-capacity-participants') {
      hideParticipantsWithinCapacity = false;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'hide-first-breakpoint-participant') {
      if (!validateConfiguration(state).valid) {
        setNotice('Resolve invalid inputs before hiding the first-breakpoint participant.');
        return;
      }
      hideFirstBreakpointParticipant = true;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'show-first-breakpoint-participant') {
      hideFirstBreakpointParticipant = false;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'hide-last-breakpoint-participant') {
      if (!validateConfiguration(state).valid) {
        setNotice('Resolve invalid inputs before hiding the last first-breakpoint participant.');
        return;
      }
      hideLastBreakpointParticipant = true;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'show-last-breakpoint-participant') {
      hideLastBreakpointParticipant = false;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'hide-first-over-capacity-participant') {
      if (!validateConfiguration(state).valid) {
        setNotice('Resolve invalid inputs before hiding the first over-capacity participant.');
        return;
      }
      hideFirstOverCapacityParticipant = true;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'show-first-over-capacity-participant') {
      hideFirstOverCapacityParticipant = false;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'hide-last-over-capacity-participant') {
      if (!validateConfiguration(state).valid) {
        setNotice('Resolve invalid inputs before hiding the last over-capacity participant.');
        return;
      }
      hideLastOverCapacityParticipant = true;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'show-last-over-capacity-participant') {
      hideLastOverCapacityParticipant = false;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'hide-last-within-capacity-participant') {
      if (!validateConfiguration(state).valid) {
        setNotice('Resolve invalid inputs before hiding the last within-capacity participant.');
        return;
      }
      hideLastWithinCapacityParticipant = true;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'show-last-within-capacity-participant') {
      hideLastWithinCapacityParticipant = false;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'hide-first-within-capacity-participant') {
      if (!validateConfiguration(state).valid) {
        setNotice('Resolve invalid inputs before hiding the first within-capacity participant.');
        return;
      }
      hideFirstWithinCapacityParticipant = true;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'show-first-within-capacity-participant') {
      hideFirstWithinCapacityParticipant = false;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'hide-last-spare-capacity-participant') {
      if (!validateConfiguration(state).valid) {
        setNotice('Resolve invalid inputs before hiding the last spare-capacity participant.');
        return;
      }
      hideLastSpareCapacityParticipant = true;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'show-last-spare-capacity-participant') {
      hideLastSpareCapacityParticipant = false;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'hide-first-spare-capacity-participant') {
      if (!validateConfiguration(state).valid) {
        setNotice('Resolve invalid inputs before hiding the first spare-capacity participant.');
        return;
      }
      hideFirstSpareCapacityParticipant = true;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'show-first-spare-capacity-participant') {
      hideFirstSpareCapacityParticipant = false;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'hide-last-without-capacity-participant') {
      if (!validateConfiguration(state).valid) {
        setNotice('Resolve invalid inputs before hiding the last participant without listed capacity.');
        return;
      }
      hideLastParticipantWithoutCapacity = true;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'show-last-without-capacity-participant') {
      hideLastParticipantWithoutCapacity = false;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'hide-first-without-capacity-participant') {
      if (!validateConfiguration(state).valid) {
        setNotice('Resolve invalid inputs before hiding the first participant without listed capacity.');
        return;
      }
      hideFirstParticipantWithoutCapacity = true;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'show-first-without-capacity-participant') {
      hideFirstParticipantWithoutCapacity = false;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'hide-last-at-hold-participant') {
      if (!validateConfiguration(state).valid) {
        setNotice('Resolve invalid inputs before hiding the last participant at hold.');
        return;
      }
      hideLastParticipantAtHold = true;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'show-last-at-hold-participant') {
      hideLastParticipantAtHold = false;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'hide-first-at-hold-participant') {
      if (!validateConfiguration(state).valid) {
        setNotice('Resolve invalid inputs before hiding the first participant at hold.');
        return;
      }
      hideFirstParticipantAtHold = true;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'show-first-at-hold-participant') {
      hideFirstParticipantAtHold = false;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'hide-all-hold-ledger') {
      if (!validateConfiguration(state).valid) {
        setNotice('Resolve invalid inputs before hiding participants who hold in every tested compound case.');
        return;
      }
      hideAllCompoundHolders = true;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'show-all-hold-ledger') {
      hideAllCompoundHolders = false;
      writeCollapsePreference();
      saveState();
      render();
      return;
    }
    if (action === 'hide-unbounded-tornado') {
      if (!validateConfiguration(state).valid) {
        setNotice('Resolve invalid inputs before hiding unbounded tornado shocks.');
        return;
      }
      hideUnboundedTornado = true;
      render();
      return;
    }
    if (action === 'show-unbounded-tornado') {
      hideUnboundedTornado = false;
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
      readCollapsePreference();
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
    if (action === 'swap-participant-next') {
      const next = swapAdjacentParticipants(state.participants, Number(button.dataset.index));
      const unchanged = next.every((item, index) => item.id === state.participants[index].id);
      if (unchanged) return;
      checkpoint();
      state.participants = next;
      activePreset = '';
      refresh('Adjacent participants swapped. Identifiers and shares stayed with each participant.');
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
    if (action === 'copy-first-breakpoint-snapshot') copyFirstBreakpointSnapshot();
    if (action === 'copy-first-breakpoint-label') copyFirstBreakpointLabel();
    if (action === 'copy-first-breakpoint-remaining') copyFirstBreakpointRemainingToHold();
    if (action === 'copy-first-breakpoint-volume') copyFirstBreakpointVolumeToHold();
    if (action === 'copy-over-capacity-count') copyOverCapacityCount();
    if (action === 'copy-first-over-capacity-label') copyFirstOverCapacityLabel();
    if (action === 'copy-first-over-capacity-remaining') copyFirstOverCapacityRemaining();
    if (action === 'copy-last-over-capacity-label') copyLastOverCapacityLabel();
    if (action === 'copy-last-over-capacity-remaining') copyLastOverCapacityRemaining();
    if (action === 'copy-first-within-capacity-remaining') copyFirstWithinCapacityRemaining();
    if (action === 'copy-last-within-capacity-remaining') copyLastWithinCapacityRemaining();
    if (action === 'copy-last-spare-capacity-remaining') copyLastSpareCapacityRemaining();
    if (action === 'copy-first-spare-capacity-remaining') copyFirstSpareCapacityRemaining();
    if (action === 'copy-last-unbounded-remaining') copyLastUnboundedRemaining();
    if (action === 'copy-first-unbounded-remaining') copyFirstUnboundedRemaining();
    if (action === 'copy-last-at-hold-remaining') copyLastAtHoldRemaining();
    if (action === 'copy-first-at-hold-remaining') copyFirstAtHoldRemaining();
    if (action === 'copy-last-zero-share-participant') copyLastZeroShareParticipant();
    if (action === 'copy-last-zero-share-remaining') copyLastZeroShareRemaining();
    if (action === 'copy-first-zero-share-remaining') copyFirstZeroShareRemaining();
    if (action === 'copy-first-zero-share-participant') copyFirstZeroShareParticipant();
    if (action === 'copy-last-breakpoint-label') copyLastBreakpointLabel();
    if (action === 'copy-share-hold') copyShareHoldPreview();
    if (action === 'copy-deal-notes') copyDealNotes();
    if (action === 'copy-waterfall') copyContributionWaterfall();
    if (action === 'copy-viability') copyViabilityCard();
    if (action === 'copy-viability-label') copyLeastHeadroomLabel();
    if (action === 'copy-utilization') copyCapacityUtilization();
    if (action === 'copy-tornado') copyTornadoChart();
    if (action === 'copy-operating-region') copyOperatingRegion();
    if (action === 'copy-tested-split') copyTestedSplit();
    if (action === 'copy-allocation-balance') copyAllocationBalance();
    if (action === 'copy-deal-title') copyDealTitleCurrency();
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
        writeCollapsePreference();
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
      readCollapsePreference();
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
      readCollapsePreference();
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

function handleShortcut(event) {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
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
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (key === '?' || (key === '/' && event.shiftKey)) {
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
  if (key === 'u') { travelHistory('undo'); return; }
  if (key === 'r') { travelHistory('redo'); return; }
  if (key === 'e') exportFile();
  if (key === 'g') {
    const jump = document.querySelector('#results-jump');
    const start = jump ?? document.querySelector('#results-start');
    start?.focus?.({ preventScroll: false });
    start?.scrollIntoView?.({ block: 'start' });
  }
  if (key === 'n') {
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
  if (key === 's') {
    const target = document.querySelector('#share-hold-title') ?? document.querySelector('#share-hold-jump');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (key === 'c') {
    const target = document.querySelector('#imported-compare-title')
      ?? document.querySelector('#comparison-title')
      ?? document.querySelector('#three-compare-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (key === 'p') printOnePager();
  if (key === 'f') {
    const target = document.querySelector('#first-breakpoint-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (key === 'w') {
    const target = document.querySelector('#waterfall-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (key === 'l') {
    const target = document.querySelector('#participant-ledger-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (key === 'b') {
    const target = document.querySelector('#viability-heading');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (key === 't') {
    const target = document.querySelector('#tornado-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (key === 'd') {
    const target = document.querySelector('#deal-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (key === 'k') {
    const target = document.querySelector('#compound-title') ?? document.querySelector('#inspect-cases-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (key === 'h') {
    const target = document.querySelector('#least-headroom-participant') ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (key === 'a') {
    const add = document.querySelector('#add-participant');
    add?.focus?.({ preventScroll: false });
    add?.scrollIntoView?.({ block: 'start' });
  }
  if (key === 'm') {
    const notes = document.querySelector('#field-deal-notes');
    notes?.focus?.({ preventScroll: false });
    notes?.scrollIntoView?.({ block: 'start' });
  }
  if (key === 'v') {
    const target = document.querySelector('#viability-card') ?? document.querySelector('#viability-heading');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (key === 'i') {
    const target = document.querySelector('#inspect-cases-title')
      ?? document.querySelector('#imported-compare-title')
      ?? document.querySelector('#comparison-title')
      ?? document.querySelector('#three-compare-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (key === 'o') {
    const target = document.querySelector('#operating-region-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (key === 'j') copyCapacityUtilization();
  if (key === 'q') {
    const target = document.querySelector('#equal-split') ?? document.querySelector('#normalize-shares');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (key === 'x') {
    const target = document.querySelector('#over-capacity-participant') ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (key === 'y') copyDealNotesLine();
  if (key === 'z') {
    const target = document.querySelector('#copy-deal-title') ?? document.querySelector('#deal-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === ',') copyFirstBreakpointLabel();
  if (event.key === ';') copyLeastHeadroomLabel();
  if (event.key === "'") copyFirstBreakpointRemainingToHold();
  if (event.key === ':') copyFirstBreakpointVolumeToHold();
  if (event.key === '"') copyOverCapacityCount();
  if (event.key === '}') copyFirstOverCapacityLabel();
  if (event.key === '~') copyFirstOverCapacityRemaining();
  if (event.key === '(') copyLastOverCapacityLabel();
  if (event.key === '*') copyLastOverCapacityRemaining();
  if (event.key === '$') copyFirstWithinCapacityRemaining();
  if (event.key === '5') copyLastWithinCapacityRemaining();
  if (event.key === '8') copyLastSpareCapacityRemaining();
  if (event.key === '1') copyFirstSpareCapacityRemaining();
  if (event.key === '4') copyLastUnboundedRemaining();
  if (event.key === 'PageUp') copyFirstUnboundedRemaining();
  if (event.key === 'Insert') copyLastAtHoldRemaining();
  if (event.key === 'Delete') copyFirstAtHoldRemaining();
  if (event.key === 'F3') copyLastZeroShareParticipant();
  if (event.key === 'F7') copyFirstZeroShareParticipant();
  if (event.key === 'F10') copyLastZeroShareRemaining();
  if (event.key === '.') {
    const target = document.querySelector('#copy-first-breakpoint-label') ?? document.querySelector('#first-breakpoint-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === '<') {
    const target = document.querySelector('#copy-first-breakpoint-remaining') ?? document.querySelector('#first-breakpoint-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === '>') {
    const target = document.querySelector('[data-action="hide-spare-capacity-participants"]')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === '-') {
    const target = document.querySelector('#copy-first-breakpoint-volume') ?? document.querySelector('#first-breakpoint-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === '_') {
    const target = document.querySelector('#copy-over-capacity-count') ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === '=') {
    const target = document.querySelector('[data-action="hide-least-headroom-participants"]')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === '{') {
    const target = document.querySelector('#hide-within-capacity-participants')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === '+') {
    const target = document.querySelector('#copy-first-over-capacity-label')
      ?? document.querySelector('#first-breakpoint-title')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === '!') {
    const target = document.querySelector('#copy-first-over-capacity-remaining')
      ?? document.querySelector('#first-breakpoint-title')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === '|') {
    const target = document.querySelector('#hide-first-breakpoint-participant')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === '@') {
    const target = document.querySelector('#hide-first-over-capacity-participant')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === ')') {
    const target = document.querySelector('#copy-last-over-capacity-label')
      ?? document.querySelector('#first-breakpoint-title')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === '#') {
    const target = document.querySelector('#hide-last-over-capacity-participant')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === '&') {
    const target = document.querySelector('#copy-last-over-capacity-remaining')
      ?? document.querySelector('#first-breakpoint-title')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === '^') {
    const target = document.querySelector('#copy-first-within-capacity-remaining')
      ?? document.querySelector('#first-breakpoint-title')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === '`') {
    const target = document.querySelector('#hide-first-within-capacity-participant')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === '6') {
    const target = document.querySelector('#copy-last-within-capacity-remaining')
      ?? document.querySelector('#results-start');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === '7') {
    const target = document.querySelector('#hide-last-spare-capacity-participant')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === '9') {
    const target = document.querySelector('#copy-last-spare-capacity-remaining')
      ?? document.querySelector('#results-start');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === '0') {
    const target = document.querySelector('#hide-first-spare-capacity-participant')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === '2') {
    const target = document.querySelector('#copy-first-spare-capacity-remaining')
      ?? document.querySelector('#results-start');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === '3') {
    const target = document.querySelector('#hide-last-without-capacity-participant')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === 'Home') {
    const target = document.querySelector('#copy-last-unbounded-remaining')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === 'End') {
    const target = document.querySelector('#hide-first-without-capacity-participant')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === 'PageDown') {
    const target = document.querySelector('#copy-first-unbounded-remaining')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === 'ArrowUp') {
    const target = document.querySelector('#hide-last-at-hold-participant')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === 'ArrowDown') {
    const target = document.querySelector('#copy-last-at-hold-remaining')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === 'ArrowLeft') {
    const target = document.querySelector('#hide-first-at-hold-participant')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === 'F2') {
    const target = document.querySelector('#copy-first-at-hold-remaining')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === 'ArrowRight') {
    const target = document.querySelector('#hide-first-zero-share-participant')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === 'F4') {
    const target = document.querySelector('#copy-last-zero-share-participant')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === 'Backspace') {
    const target = document.querySelector('#hide-last-zero-share-participant')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === 'F8') {
    const target = document.querySelector('#copy-first-zero-share-participant')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === 'F9') {
    const target = document.querySelector('#hide-first-zero-share-participant')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === 'F11') {
    const target = document.querySelector('#copy-last-zero-share-remaining')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === 'F12') {
    const target = document.querySelector('#hide-last-zero-share-participant')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === '%') {
    const target = document.querySelector('#hide-last-breakpoint-participant')
      ?? document.querySelector('#participant-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === '[') {
    const target = document.querySelector('#copy-viability-label')
      ?? document.querySelector('#first-breakpoint-title')
      ?? document.querySelector('#results-start');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (event.key === ']') {
    const target = document.querySelector('#print-report') ?? document.querySelector('#print-one-pager-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
  if (key === '/' && !event.shiftKey) {
    const target = document.querySelector('#copy-deal-title') ?? document.querySelector('#deal-inputs-title');
    target?.focus?.({ preventScroll: false });
    target?.scrollIntoView?.({ block: 'start' });
  }
}

window.addEventListener('keydown', handleShortcut);

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
  readCollapsePreference();
  activePreset = '';
  refresh('Shared case loaded.');
});

readCollapsePreference();
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

function firstBreakpointSnapshotMarkdown(result) {
  const breakpoint = result.firstBreakpoint;
  let body;
  if (!breakpoint?.participant) {
    body = 'No bounded adverse shock is available in the current inputs.';
  } else if (breakpoint.status === 'already-failing') {
    body = reportText(breakpoint.participant.name) + ' is already failing an exit criterion.';
  } else {
    const units = shockUnits(breakpoint.kind);
    const magnitude = breakpoint.status === 'at-breakpoint' || !breakpoint.shock
      ? compactShock(breakpoint.shock ?? { status: breakpoint.status, change: null, changePct: null }, units)
      : compactShock(breakpoint.shock, units);
    body = reportText(breakpoint.participant.name) + '; ' + shockLabel(breakpoint.kind) + '; ' + magnitude + '.';
  }
  return 'First-breakpoint snapshot: ' + body + ' Synthetic ranking, not a forecast.';
}

function showBreakpointSnapshotCopyFallback(text, message) {
  breakpointSnapshotCopyText = text;
  render();
  document.querySelector('#breakpoint-snapshot-copy-text')?.focus();
  setNotice(message);
}

function breakpointSnapshotCopySection() {
  if (!breakpointSnapshotCopyText) return '';
  return `<section class="panel" aria-labelledby="breakpoint-snapshot-copy-title"><div class="panel-heading"><h2 id="breakpoint-snapshot-copy-title">First-breakpoint snapshot Markdown</h2><button type="button" data-action="close-breakpoint-snapshot-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This is a synthetic ranking, not a forecast.</p><label class="brief-copy-label" for="breakpoint-snapshot-copy-text">First-breakpoint snapshot Markdown</label><textarea id="breakpoint-snapshot-copy-text" readonly rows="4">${escapeAttribute(breakpointSnapshotCopyText)}</textarea></div></section>`;
}

function copyFirstBreakpointSnapshot() {
  const validation = validateConfiguration(state);
  if (!validation.valid) {
    setNotice('Resolve invalid inputs before copying the first-breakpoint snapshot. ' + summarizeErrors(validation.errors));
    return;
  }
  const text = firstBreakpointSnapshotMarkdown(calculatePartnership(state));
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'First-breakpoint snapshot copied as Markdown. Synthetic ranking, not a forecast.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          breakpointSnapshotCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showBreakpointSnapshotCopyFallback(text, fallbackNote);
        });
        return;
      }
      breakpointSnapshotCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showBreakpointSnapshotCopyFallback(text, fallbackNote);
      return;
    }
  }
  showBreakpointSnapshotCopyFallback(text, fallbackNote);
}

function firstBreakpointLabelMarkdown(result) {
  const breakpoint = result.firstBreakpoint;
  const name = breakpoint?.participant
    ? reportText(breakpoint.participant.name)
    : 'none';
  return 'First-breakpoint participant: ' + name + '. Synthetic ranking, not a forecast.';
}

function showBreakpointLabelCopyFallback(text, message) {
  breakpointLabelCopyText = text;
  render();
  document.querySelector('#breakpoint-label-copy-text')?.focus();
  setNotice(message);
}

function breakpointLabelCopySection() {
  if (!breakpointLabelCopyText) return '';
  return `<section class="panel" aria-labelledby="breakpoint-label-copy-title"><div class="panel-heading"><h2 id="breakpoint-label-copy-title">First-breakpoint participant label Markdown</h2><button type="button" data-action="close-breakpoint-label-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This is a synthetic ranking, not a forecast.</p><label class="brief-copy-label" for="breakpoint-label-copy-text">First-breakpoint participant label Markdown</label><textarea id="breakpoint-label-copy-text" readonly rows="4">${escapeAttribute(breakpointLabelCopyText)}</textarea></div></section>`;
}

function copyFirstBreakpointLabel() {
  const validation = validateConfiguration(state);
  if (!validation.valid) {
    setNotice('Resolve invalid inputs before copying the first-breakpoint participant label. ' + summarizeErrors(validation.errors));
    return;
  }
  const text = firstBreakpointLabelMarkdown(calculatePartnership(state));
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'First-breakpoint participant label copied as Markdown. Synthetic ranking, not a forecast.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          breakpointLabelCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showBreakpointLabelCopyFallback(text, fallbackNote);
        });
        return;
      }
      breakpointLabelCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showBreakpointLabelCopyFallback(text, fallbackNote);
      return;
    }
  }
  showBreakpointLabelCopyFallback(text, fallbackNote);
}

function firstBreakpointRemainingToHoldMarkdown(result) {
  const breakpoint = result?.firstBreakpoint;
  if (!breakpoint?.participant) return 'First-breakpoint remaining-to-hold: none entered.';
  const participant = breakpoint.participant;
  const name = reportText(participant.name);
  const kind = breakpoint.kind;
  if (kind === 'volume' || kind === 'volumeIncrease') {
    const remaining = participant.headroomToExit == null ? null : Math.max(0, -participant.headroomToExit);
    if (remaining == null || !Number.isFinite(remaining)) return 'First-breakpoint remaining-to-hold: none entered.';
    return 'First-breakpoint remaining-to-hold: ' + formatVolume(remaining) + ' for ' + name + '. Synthetic ranking, not a forecast.';
  }
  const volume = result.effectiveVolume;
  const fee = result.deal.feePerTransaction;
  const gross = volume * fee;
  const needs = participant.variableCost + participant.fixedCost + participant.riskCost + participant.minimumAcceptableProfit;
  if (!(gross > 0) || !Number.isFinite(needs)) return 'First-breakpoint remaining-to-hold: none entered.';
  const remainingShare = Math.max(0, needs / gross - participant.revenueShare);
  if (!Number.isFinite(remainingShare)) return 'First-breakpoint remaining-to-hold: none entered.';
  return 'First-breakpoint remaining-to-hold: ' + formatPct(remainingShare * 100) + ' share for ' + name + '. Synthetic ranking, not a forecast.';
}

function showRemainingCopyFallback(text, message) {
  remainingCopyText = text;
  render();
  document.querySelector('#remaining-copy-text')?.focus();
  setNotice(message);
}

function remainingCopySection() {
  if (!remainingCopyText) return '';
  return `<section class="panel" aria-labelledby="remaining-copy-title"><div class="panel-heading"><h2 id="remaining-copy-title">First-breakpoint remaining-to-hold Markdown</h2><button type="button" data-action="close-remaining-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This is the volume or share still needed for the first-breakpoint participant. It is distinct from first-breakpoint label copy and least-headroom copy.</p><label class="brief-copy-label" for="remaining-copy-text">First-breakpoint remaining-to-hold Markdown</label><textarea id="remaining-copy-text" readonly rows="4">${escapeAttribute(remainingCopyText)}</textarea></div></section>`;
}

function copyFirstBreakpointRemainingToHold() {
  const validation = validateConfiguration(state);
  const result = validation.valid ? calculatePartnership(state) : null;
  const text = firstBreakpointRemainingToHoldMarkdown(result);
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'First-breakpoint remaining-to-hold copied as Markdown. Synthetic ranking, not a forecast.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          remainingCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showRemainingCopyFallback(text, fallbackNote);
        });
        return;
      }
      remainingCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showRemainingCopyFallback(text, fallbackNote);
      return;
    }
  }
  showRemainingCopyFallback(text, fallbackNote);
}

function firstBreakpointVolumeToHoldMarkdown(result) {
  const breakpoint = result?.firstBreakpoint;
  if (!breakpoint?.participant) return 'First-breakpoint volume-to-hold: none entered.';
  const participant = breakpoint.participant;
  const name = reportText(participant.name);
  const volume = participant.exitVolume;
  if (volume == null || !Number.isFinite(volume)) return 'First-breakpoint volume-to-hold: none entered.';
  return 'First-breakpoint volume-to-hold: ' + formatVolume(volume) + ' for ' + name + '. Synthetic ranking, not a forecast.';
}

function showVolumeCopyFallback(text, message) {
  volumeCopyText = text;
  render();
  document.querySelector('#volume-copy-text')?.focus();
  setNotice(message);
}

function volumeCopySection() {
  if (!volumeCopyText) return '';
  return `<section class="panel" aria-labelledby="volume-copy-title"><div class="panel-heading"><h2 id="volume-copy-title">First-breakpoint volume-to-hold Markdown</h2><button type="button" data-action="close-volume-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This is the first-breakpoint participant exit volume already in the result. It is distinct from remaining-to-hold copy, least-headroom copy, and first-breakpoint label copy.</p><label class="brief-copy-label" for="volume-copy-text">First-breakpoint volume-to-hold Markdown</label><textarea id="volume-copy-text" readonly rows="4">${escapeAttribute(volumeCopyText)}</textarea></div></section>`;
}

function copyFirstBreakpointVolumeToHold() {
  const validation = validateConfiguration(state);
  const result = validation.valid ? calculatePartnership(state) : null;
  const text = firstBreakpointVolumeToHoldMarkdown(result);
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'First-breakpoint volume-to-hold copied as Markdown. Synthetic ranking, not a forecast.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          volumeCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showVolumeCopyFallback(text, fallbackNote);
        });
        return;
      }
      volumeCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showVolumeCopyFallback(text, fallbackNote);
      return;
    }
  }
  showVolumeCopyFallback(text, fallbackNote);
}

function overCapacityCountMarkdown(result) {
  if (!result) return 'Over-capacity participant count: none entered.';
  const count = state.participants.filter((participant) => participantOverListedCapacity(result, participant)).length;
  return 'Over-capacity participant count: ' + count + '. Count of roster rows currently over listed capacity. Not a forecast.';
}

function showOverCapacityCountCopyFallback(text, message) {
  overCapacityCountCopyText = text;
  render();
  document.querySelector('#over-capacity-count-copy-text')?.focus();
  setNotice(message);
}

function overCapacityCountCopySection() {
  if (!overCapacityCountCopyText) return '';
  return `<section class="panel" aria-labelledby="over-capacity-count-copy-title"><div class="panel-heading"><h2 id="over-capacity-count-copy-title">Over-capacity participant count Markdown</h2><button type="button" data-action="close-over-capacity-count-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This is a count of roster rows currently over listed capacity. It is distinct from volume-to-hold copy, remaining-to-hold copy, and least-headroom copy. It is not a forecast.</p><label class="brief-copy-label" for="over-capacity-count-copy-text">Over-capacity participant count Markdown</label><textarea id="over-capacity-count-copy-text" readonly rows="4">${escapeAttribute(overCapacityCountCopyText)}</textarea></div></section>`;
}

function copyOverCapacityCount() {
  const validation = validateConfiguration(state);
  const result = validation.valid ? calculatePartnership(state) : null;
  const text = overCapacityCountMarkdown(result);
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'Over-capacity participant count copied as Markdown. Count of roster rows currently over listed capacity. It is not a forecast.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          overCapacityCountCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showOverCapacityCountCopyFallback(text, fallbackNote);
        });
        return;
      }
      overCapacityCountCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showOverCapacityCountCopyFallback(text, fallbackNote);
      return;
    }
  }
  showOverCapacityCountCopyFallback(text, fallbackNote);
}

function firstOverCapacityLabelMarkdown(result) {
  if (!result) return 'First over-capacity participant: none entered.';
  const participant = state.participants.find((item) => participantOverListedCapacity(result, item));
  if (!participant) return 'First over-capacity participant: none entered.';
  const named = result.participants.find((item) => item.id === participant.id);
  return 'First over-capacity participant: ' + reportText(named?.name ?? participant.name) + '. Roster row currently over listed capacity. Not a forecast.';
}

function showFirstOverCapacityLabelCopyFallback(text, message) {
  firstOverCapacityLabelCopyText = text;
  render();
  document.querySelector('#first-over-capacity-label-copy-text')?.focus();
  setNotice(message);
}

function firstOverCapacityLabelCopySection() {
  if (!firstOverCapacityLabelCopyText) return '';
  return `<section class="panel" aria-labelledby="first-over-capacity-label-copy-title"><div class="panel-heading"><h2 id="first-over-capacity-label-copy-title">First over-capacity participant label Markdown</h2><button type="button" data-action="close-first-over-capacity-label-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This names the first roster row currently over listed capacity. It is distinct from first-breakpoint label copy, least-headroom copy, and over-capacity count copy. It is not a forecast.</p><label class="brief-copy-label" for="first-over-capacity-label-copy-text">First over-capacity participant label Markdown</label><textarea id="first-over-capacity-label-copy-text" readonly rows="4">${escapeAttribute(firstOverCapacityLabelCopyText)}</textarea></div></section>`;
}

function copyFirstOverCapacityLabel() {
  const validation = validateConfiguration(state);
  const result = validation.valid ? calculatePartnership(state) : null;
  const text = firstOverCapacityLabelMarkdown(result);
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'First over-capacity participant label copied as Markdown. Roster row currently over listed capacity. It is not a forecast.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          firstOverCapacityLabelCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showFirstOverCapacityLabelCopyFallback(text, fallbackNote);
        });
        return;
      }
      firstOverCapacityLabelCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showFirstOverCapacityLabelCopyFallback(text, fallbackNote);
      return;
    }
  }
  showFirstOverCapacityLabelCopyFallback(text, fallbackNote);
}

function firstOverCapacityRemainingMarkdown(result) {
  if (!result) return 'First over-capacity remaining listed capacity: none entered.';
  const participant = state.participants.find((item) => participantOverListedCapacity(result, item));
  if (!participant || participant.capacity == null || !Number.isFinite(participant.capacity) || !Number.isFinite(result.effectiveVolume)) {
    return 'First over-capacity remaining listed capacity: none entered.';
  }
  const overBy = result.effectiveVolume - participant.capacity;
  const named = result.participants.find((item) => item.id === participant.id);
  return 'First over-capacity remaining listed capacity: ' + formatVolume(overBy) + ' over for ' + reportText(named?.name ?? participant.name) + '. How far over listed capacity. Not a forecast.';
}

function showFirstOverCapacityRemainingCopyFallback(text, message) {
  firstOverCapacityRemainingCopyText = text;
  render();
  document.querySelector('#first-over-capacity-remaining-copy-text')?.focus();
  setNotice(message);
}

function firstOverCapacityRemainingCopySection() {
  if (!firstOverCapacityRemainingCopyText) return '';
  return `<section class="panel" aria-labelledby="first-over-capacity-remaining-copy-title"><div class="panel-heading"><h2 id="first-over-capacity-remaining-copy-title">First over-capacity remaining listed capacity Markdown</h2><button type="button" data-action="close-first-over-capacity-remaining-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This is how far over listed capacity the first over-capacity roster row currently is. It is distinct from over-capacity count copy, first over-capacity label copy, volume-to-hold copy, and remaining-to-hold copy. It is not a forecast.</p><label class="brief-copy-label" for="first-over-capacity-remaining-copy-text">First over-capacity remaining listed capacity Markdown</label><textarea id="first-over-capacity-remaining-copy-text" readonly rows="4">${escapeAttribute(firstOverCapacityRemainingCopyText)}</textarea></div></section>`;
}

function copyFirstOverCapacityRemaining() {
  const validation = validateConfiguration(state);
  const result = validation.valid ? calculatePartnership(state) : null;
  const text = firstOverCapacityRemainingMarkdown(result);
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'First over-capacity remaining listed capacity copied as Markdown. How far over listed capacity. It is not a forecast.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          firstOverCapacityRemainingCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showFirstOverCapacityRemainingCopyFallback(text, fallbackNote);
        });
        return;
      }
      firstOverCapacityRemainingCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showFirstOverCapacityRemainingCopyFallback(text, fallbackNote);
      return;
    }
  }
  showFirstOverCapacityRemainingCopyFallback(text, fallbackNote);
}

function lastOverCapacityLabelMarkdown(result) {
  if (!result) return 'Last over-capacity participant: none entered.';
  let participant = null;
  for (const item of state.participants) {
    if (participantOverListedCapacity(result, item)) participant = item;
  }
  if (!participant) return 'Last over-capacity participant: none entered.';
  const named = result.participants.find((item) => item.id === participant.id);
  return 'Last over-capacity participant: ' + reportText(named?.name ?? participant.name) + '. Roster row currently over listed capacity. Not a forecast.';
}

function showLastOverCapacityLabelCopyFallback(text, message) {
  lastOverCapacityLabelCopyText = text;
  render();
  document.querySelector('#last-over-capacity-label-copy-text')?.focus();
  setNotice(message);
}

function lastOverCapacityLabelCopySection() {
  if (!lastOverCapacityLabelCopyText) return '';
  return `<section class="panel" aria-labelledby="last-over-capacity-label-copy-title"><div class="panel-heading"><h2 id="last-over-capacity-label-copy-title">Last over-capacity participant label Markdown</h2><button type="button" data-action="close-last-over-capacity-label-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This names the last roster row currently over listed capacity. It is distinct from first over-capacity label copy and remaining listed capacity copy. It is not a forecast.</p><label class="brief-copy-label" for="last-over-capacity-label-copy-text">Last over-capacity participant label Markdown</label><textarea id="last-over-capacity-label-copy-text" readonly rows="4">${escapeAttribute(lastOverCapacityLabelCopyText)}</textarea></div></section>`;
}

function copyLastOverCapacityLabel() {
  const validation = validateConfiguration(state);
  const result = validation.valid ? calculatePartnership(state) : null;
  const text = lastOverCapacityLabelMarkdown(result);
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'Last over-capacity participant label copied as Markdown. Roster row currently over listed capacity. It is not a forecast.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          lastOverCapacityLabelCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showLastOverCapacityLabelCopyFallback(text, fallbackNote);
        });
        return;
      }
      lastOverCapacityLabelCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showLastOverCapacityLabelCopyFallback(text, fallbackNote);
      return;
    }
  }
  showLastOverCapacityLabelCopyFallback(text, fallbackNote);
}

function lastOverCapacityRemainingMarkdown(result) {
  if (!result) return 'Last over-capacity remaining listed capacity: none entered.';
  let participant = null;
  for (const item of state.participants) {
    if (participantOverListedCapacity(result, item)) participant = item;
  }
  if (!participant || participant.capacity == null || !Number.isFinite(participant.capacity) || !Number.isFinite(result.effectiveVolume)) {
    return 'Last over-capacity remaining listed capacity: none entered.';
  }
  const overBy = result.effectiveVolume - participant.capacity;
  const named = result.participants.find((item) => item.id === participant.id);
  return 'Last over-capacity remaining listed capacity: ' + formatVolume(overBy) + ' over for ' + reportText(named?.name ?? participant.name) + '. How far over listed capacity. Not a forecast.';
}

function showLastOverCapacityRemainingCopyFallback(text, message) {
  lastOverCapacityRemainingCopyText = text;
  render();
  document.querySelector('#last-over-capacity-remaining-copy-text')?.focus();
  setNotice(message);
}

function lastOverCapacityRemainingCopySection() {
  if (!lastOverCapacityRemainingCopyText) return '';
  return `<section class="panel" aria-labelledby="last-over-capacity-remaining-copy-title"><div class="panel-heading"><h2 id="last-over-capacity-remaining-copy-title">Last over-capacity remaining listed capacity Markdown</h2><button type="button" data-action="close-last-over-capacity-remaining-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This is how far over listed capacity the last over-capacity roster row currently is. It is distinct from first over-capacity remaining listed capacity copy and last over-capacity label copy. It is not a forecast.</p><label class="brief-copy-label" for="last-over-capacity-remaining-copy-text">Last over-capacity remaining listed capacity Markdown</label><textarea id="last-over-capacity-remaining-copy-text" readonly rows="4">${escapeAttribute(lastOverCapacityRemainingCopyText)}</textarea></div></section>`;
}

function copyLastOverCapacityRemaining() {
  const validation = validateConfiguration(state);
  const result = validation.valid ? calculatePartnership(state) : null;
  const text = lastOverCapacityRemainingMarkdown(result);
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'Last over-capacity remaining listed capacity copied as Markdown. How far over listed capacity. It is not a forecast.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          lastOverCapacityRemainingCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showLastOverCapacityRemainingCopyFallback(text, fallbackNote);
        });
        return;
      }
      lastOverCapacityRemainingCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showLastOverCapacityRemainingCopyFallback(text, fallbackNote);
      return;
    }
  }
  showLastOverCapacityRemainingCopyFallback(text, fallbackNote);
}

function firstWithinCapacityRemainingMarkdown(result) {
  if (!result) return 'First within-capacity remaining listed capacity: none entered.';
  const participant = state.participants.find((item) => participantWithinListedCapacity(result, item));
  if (!participant || participant.capacity == null || !Number.isFinite(participant.capacity) || !Number.isFinite(result.effectiveVolume)) {
    return 'First within-capacity remaining listed capacity: none entered.';
  }
  const remaining = participant.capacity - result.effectiveVolume;
  const named = result.participants.find((item) => item.id === participant.id);
  return 'First within-capacity remaining listed capacity: ' + formatVolume(remaining) + ' remaining for ' + reportText(named?.name ?? participant.name) + '. Remaining listed capacity. Not a forecast.';
}

function showFirstWithinCapacityRemainingCopyFallback(text, message) {
  firstWithinCapacityRemainingCopyText = text;
  render();
  document.querySelector('#first-within-capacity-remaining-copy-text')?.focus();
  setNotice(message);
}

function firstWithinCapacityRemainingCopySection() {
  if (!firstWithinCapacityRemainingCopyText) return '';
  return `<section class="panel" aria-labelledby="first-within-capacity-remaining-copy-title"><div class="panel-heading"><h2 id="first-within-capacity-remaining-copy-title">First within-capacity remaining listed capacity Markdown</h2><button type="button" data-action="close-first-within-capacity-remaining-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This is remaining listed capacity for the first roster row currently within listed capacity. It is distinct from last over-capacity remaining listed capacity copy and first over-capacity remaining listed capacity copy. It is not a forecast.</p><label class="brief-copy-label" for="first-within-capacity-remaining-copy-text">First within-capacity remaining listed capacity Markdown</label><textarea id="first-within-capacity-remaining-copy-text" readonly rows="4">${escapeAttribute(firstWithinCapacityRemainingCopyText)}</textarea></div></section>`;
}

function copyFirstWithinCapacityRemaining() {
  const validation = validateConfiguration(state);
  const result = validation.valid ? calculatePartnership(state) : null;
  const text = firstWithinCapacityRemainingMarkdown(result);
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'First within-capacity remaining listed capacity copied as Markdown. Remaining listed capacity. It is not a forecast.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          firstWithinCapacityRemainingCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showFirstWithinCapacityRemainingCopyFallback(text, fallbackNote);
        });
        return;
      }
      firstWithinCapacityRemainingCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showFirstWithinCapacityRemainingCopyFallback(text, fallbackNote);
      return;
    }
  }
  showFirstWithinCapacityRemainingCopyFallback(text, fallbackNote);
}

function lastWithinCapacityRemainingMarkdown(result) {
  if (!result) return 'Last within-capacity remaining listed capacity: none entered.';
  let participant = null;
  for (const item of state.participants) {
    if (participantWithinListedCapacity(result, item)) participant = item;
  }
  if (!participant || participant.capacity == null || !Number.isFinite(participant.capacity) || !Number.isFinite(result.effectiveVolume)) {
    return 'Last within-capacity remaining listed capacity: none entered.';
  }
  const remaining = participant.capacity - result.effectiveVolume;
  const named = result.participants.find((item) => item.id === participant.id);
  return 'Last within-capacity remaining listed capacity: ' + formatVolume(remaining) + ' remaining for ' + reportText(named?.name ?? participant.name) + '. Remaining listed capacity. Not a forecast.';
}

function showLastWithinCapacityRemainingCopyFallback(text, message) {
  lastWithinCapacityRemainingCopyText = text;
  render();
  document.querySelector('#last-within-capacity-remaining-copy-text')?.focus();
  setNotice(message);
}

function lastWithinCapacityRemainingCopySection() {
  if (!lastWithinCapacityRemainingCopyText) return '';
  return `<section class="panel" aria-labelledby="last-within-capacity-remaining-copy-title"><div class="panel-heading"><h2 id="last-within-capacity-remaining-copy-title">Last within-capacity remaining listed capacity Markdown</h2><button type="button" data-action="close-last-within-capacity-remaining-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This is remaining listed capacity for the last roster row currently within listed capacity. It is distinct from first within-capacity remaining listed capacity copy and last over-capacity remaining listed capacity copy. It is not a forecast.</p><label class="brief-copy-label" for="last-within-capacity-remaining-copy-text">Last within-capacity remaining listed capacity Markdown</label><textarea id="last-within-capacity-remaining-copy-text" readonly rows="4">${escapeAttribute(lastWithinCapacityRemainingCopyText)}</textarea></div></section>`;
}

function copyLastWithinCapacityRemaining() {
  const validation = validateConfiguration(state);
  const result = validation.valid ? calculatePartnership(state) : null;
  const text = lastWithinCapacityRemainingMarkdown(result);
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'Last within-capacity remaining listed capacity copied as Markdown. Remaining listed capacity. It is not a forecast.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          lastWithinCapacityRemainingCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showLastWithinCapacityRemainingCopyFallback(text, fallbackNote);
        });
        return;
      }
      lastWithinCapacityRemainingCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showLastWithinCapacityRemainingCopyFallback(text, fallbackNote);
      return;
    }
  }
  showLastWithinCapacityRemainingCopyFallback(text, fallbackNote);
}


function lastSpareCapacityRemainingMarkdown(result) {
  if (!result) return 'Last spare-capacity remaining listed capacity: none entered.';
  let participant = null;
  for (const item of state.participants) {
    if (participantWithSpareCapacity(result, item)) participant = item;
  }
  if (!participant || participant.capacity == null || !Number.isFinite(participant.capacity) || !Number.isFinite(result.effectiveVolume)) {
    return 'Last spare-capacity remaining listed capacity: none entered.';
  }
  const remaining = participant.capacity - result.effectiveVolume;
  const named = result.participants.find((item) => item.id === participant.id);
  return 'Last spare-capacity remaining listed capacity: ' + formatVolume(remaining) + ' remaining for ' + reportText(named?.name ?? participant.name) + '. Remaining listed capacity. Not a forecast.';
}

function showLastSpareCapacityRemainingCopyFallback(text, message) {
  lastSpareCapacityRemainingCopyText = text;
  render();
  document.querySelector('#last-spare-capacity-remaining-copy-text')?.focus();
  setNotice(message);
}

function lastSpareCapacityRemainingCopySection() {
  if (!lastSpareCapacityRemainingCopyText) return '';
  return `<section class="panel" aria-labelledby="last-spare-capacity-remaining-copy-title"><div class="panel-heading"><h2 id="last-spare-capacity-remaining-copy-title">Last spare-capacity remaining listed capacity Markdown</h2><button type="button" data-action="close-last-spare-capacity-remaining-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This is remaining listed capacity for the last roster row currently with unused listed capacity. It is distinct from last within-capacity remaining listed capacity copy, first within-capacity remaining listed capacity copy, first spare-capacity remaining listed capacity copy, and last unbounded remaining-to-hold copy. It is not a forecast.</p><label class="brief-copy-label" for="last-spare-capacity-remaining-copy-text">Last spare-capacity remaining listed capacity Markdown</label><textarea id="last-spare-capacity-remaining-copy-text" readonly rows="4">${escapeAttribute(lastSpareCapacityRemainingCopyText)}</textarea></div></section>`;
}

function copyLastSpareCapacityRemaining() {
  const validation = validateConfiguration(state);
  const result = validation.valid ? calculatePartnership(state) : null;
  const text = lastSpareCapacityRemainingMarkdown(result);
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'Last spare-capacity remaining listed capacity copied as Markdown. Remaining listed capacity. It is not a forecast.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          lastSpareCapacityRemainingCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showLastSpareCapacityRemainingCopyFallback(text, fallbackNote);
        });
        return;
      }
      lastSpareCapacityRemainingCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showLastSpareCapacityRemainingCopyFallback(text, fallbackNote);
      return;
    }
  }
  showLastSpareCapacityRemainingCopyFallback(text, fallbackNote);
}

function firstSpareCapacityRemainingMarkdown(result) {
  if (!result) return 'First spare-capacity remaining listed capacity: none entered.';
  const participant = state.participants.find((item) => participantWithSpareCapacity(result, item));
  if (!participant || participant.capacity == null || !Number.isFinite(participant.capacity) || !Number.isFinite(result.effectiveVolume)) {
    return 'First spare-capacity remaining listed capacity: none entered.';
  }
  const remaining = participant.capacity - result.effectiveVolume;
  const named = result.participants.find((item) => item.id === participant.id);
  return 'First spare-capacity remaining listed capacity: ' + formatVolume(remaining) + ' remaining for ' + reportText(named?.name ?? participant.name) + '. Remaining listed capacity. Not a forecast.';
}

function showFirstSpareCapacityRemainingCopyFallback(text, message) {
  firstSpareCapacityRemainingCopyText = text;
  render();
  document.querySelector('#first-spare-capacity-remaining-copy-text')?.focus();
  setNotice(message);
}

function firstSpareCapacityRemainingCopySection() {
  if (!firstSpareCapacityRemainingCopyText) return '';
  return `<section class="panel" aria-labelledby="first-spare-capacity-remaining-copy-title"><div class="panel-heading"><h2 id="first-spare-capacity-remaining-copy-title">First spare-capacity remaining listed capacity Markdown</h2><button type="button" data-action="close-first-spare-capacity-remaining-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This is remaining listed capacity for the first roster row currently with unused listed capacity. It is distinct from last spare-capacity remaining listed capacity copy, first within-capacity remaining listed capacity copy, and last unbounded remaining-to-hold copy. It is not a forecast.</p><label class="brief-copy-label" for="first-spare-capacity-remaining-copy-text">First spare-capacity remaining listed capacity Markdown</label><textarea id="first-spare-capacity-remaining-copy-text" readonly rows="4">${escapeAttribute(firstSpareCapacityRemainingCopyText)}</textarea></div></section>`;
}

function copyFirstSpareCapacityRemaining() {
  const validation = validateConfiguration(state);
  const result = validation.valid ? calculatePartnership(state) : null;
  const text = firstSpareCapacityRemainingMarkdown(result);
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'First spare-capacity remaining listed capacity copied as Markdown. Remaining listed capacity. It is not a forecast.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          firstSpareCapacityRemainingCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showFirstSpareCapacityRemainingCopyFallback(text, fallbackNote);
        });
        return;
      }
      firstSpareCapacityRemainingCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showFirstSpareCapacityRemainingCopyFallback(text, fallbackNote);
      return;
    }
  }
  showFirstSpareCapacityRemainingCopyFallback(text, fallbackNote);
}

function lastUnboundedRemainingMarkdown(result) {
  if (!result) return 'Last unbounded remaining-to-hold: none entered.';
  let last = null;
  for (const item of state.participants) {
    if (participantWithoutListedCapacity(item)) last = item;
  }
  if (!last) return 'Last unbounded remaining-to-hold: none entered.';
  const named = result.participants.find((item) => item.id === last.id);
  const remaining = named?.headroomToExit == null ? null : Math.max(0, -named.headroomToExit);
  if (remaining == null || !Number.isFinite(remaining)) {
    return 'Last unbounded remaining-to-hold: none entered.';
  }
  return 'Last unbounded remaining-to-hold: ' + formatVolume(remaining) + ' remaining for ' + reportText(named?.name ?? last.name) + '. Remaining to hold. Not a forecast.';
}

function showLastUnboundedRemainingCopyFallback(text, message) {
  lastUnboundedRemainingCopyText = text;
  render();
  document.querySelector('#last-unbounded-remaining-copy-text')?.focus();
  setNotice(message);
}

function lastUnboundedRemainingCopySection() {
  if (!lastUnboundedRemainingCopyText) return '';
  return `<section class="panel" aria-labelledby="last-unbounded-remaining-copy-title"><div class="panel-heading"><h2 id="last-unbounded-remaining-copy-title">Last unbounded remaining-to-hold Markdown</h2><button type="button" data-action="close-last-unbounded-remaining-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This is remaining to hold for the last roster row whose capacity is unbounded or omitted. It is distinct from first spare-capacity remaining listed capacity copy and last spare-capacity remaining listed capacity copy. It is not a forecast.</p><label class="brief-copy-label" for="last-unbounded-remaining-copy-text">Last unbounded remaining-to-hold Markdown</label><textarea id="last-unbounded-remaining-copy-text" readonly rows="4">${escapeAttribute(lastUnboundedRemainingCopyText)}</textarea></div></section>`;
}

function copyLastUnboundedRemaining() {
  const validation = validateConfiguration(state);
  const result = validation.valid ? calculatePartnership(state) : null;
  const text = lastUnboundedRemainingMarkdown(result);
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'Last unbounded remaining-to-hold copied as Markdown. Remaining to hold. It is not a forecast.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          lastUnboundedRemainingCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showLastUnboundedRemainingCopyFallback(text, fallbackNote);
        });
        return;
      }
      lastUnboundedRemainingCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showLastUnboundedRemainingCopyFallback(text, fallbackNote);
      return;
    }
  }
  showLastUnboundedRemainingCopyFallback(text, fallbackNote);
}

function firstUnboundedRemainingMarkdown(result) {
  if (!result) return 'First unbounded remaining-to-hold: none entered.';
  const first = state.participants.find((item) => participantWithoutListedCapacity(item));
  if (!first) return 'First unbounded remaining-to-hold: none entered.';
  const named = result.participants.find((item) => item.id === first.id);
  const remaining = named?.headroomToExit == null ? null : Math.max(0, -named.headroomToExit);
  if (remaining == null || !Number.isFinite(remaining)) {
    return 'First unbounded remaining-to-hold: none entered.';
  }
  return 'First unbounded remaining-to-hold: ' + formatVolume(remaining) + ' remaining for ' + reportText(named?.name ?? first.name) + '. Remaining to hold. Not a forecast.';
}

function showFirstUnboundedRemainingCopyFallback(text, message) {
  firstUnboundedRemainingCopyText = text;
  render();
  document.querySelector('#first-unbounded-remaining-copy-text')?.focus();
  setNotice(message);
}

function firstUnboundedRemainingCopySection() {
  if (!firstUnboundedRemainingCopyText) return '';
  return `<section class="panel" aria-labelledby="first-unbounded-remaining-copy-title"><div class="panel-heading"><h2 id="first-unbounded-remaining-copy-title">First unbounded remaining-to-hold Markdown</h2><button type="button" data-action="close-first-unbounded-remaining-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This is remaining to hold for the first roster row whose capacity is unbounded or omitted. It is distinct from last unbounded remaining-to-hold copy, first spare-capacity remaining listed capacity copy, and last spare-capacity remaining listed capacity copy. It is not a forecast.</p><label class="brief-copy-label" for="first-unbounded-remaining-copy-text">First unbounded remaining-to-hold Markdown</label><textarea id="first-unbounded-remaining-copy-text" readonly rows="4">${escapeAttribute(firstUnboundedRemainingCopyText)}</textarea></div></section>`;
}

function copyFirstUnboundedRemaining() {
  const validation = validateConfiguration(state);
  const result = validation.valid ? calculatePartnership(state) : null;
  const text = firstUnboundedRemainingMarkdown(result);
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'First unbounded remaining-to-hold copied as Markdown. Remaining to hold. It is not a forecast.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          firstUnboundedRemainingCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showFirstUnboundedRemainingCopyFallback(text, fallbackNote);
        });
        return;
      }
      firstUnboundedRemainingCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showFirstUnboundedRemainingCopyFallback(text, fallbackNote);
      return;
    }
  }
  showFirstUnboundedRemainingCopyFallback(text, fallbackNote);
}

function lastAtHoldRemainingMarkdown(result) {
  if (!result) return 'Last at-hold remaining-to-hold: none entered.';
  let last = null;
  for (const item of state.participants) {
    if (participantAtHoldRemainingToHold(result, item)) last = item;
  }
  if (!last) return 'Last at-hold remaining-to-hold: none entered.';
  const named = result.participants.find((item) => item.id === last.id);
  const remaining = remainingToHoldAmount(result, last);
  if (remaining == null || !Number.isFinite(remaining)) {
    return 'Last at-hold remaining-to-hold: none entered.';
  }
  return 'Last at-hold remaining-to-hold: ' + formatVolume(remaining) + ' remaining for ' + reportText(named?.name ?? last.name) + '. Remaining to hold. Not a forecast.';
}

function showLastAtHoldRemainingCopyFallback(text, message) {
  lastAtHoldRemainingCopyText = text;
  render();
  document.querySelector('#last-at-hold-remaining-copy-text')?.focus();
  setNotice(message);
}

function lastAtHoldRemainingCopySection() {
  if (!lastAtHoldRemainingCopyText) return '';
  return `<section class="panel" aria-labelledby="last-at-hold-remaining-copy-title"><div class="panel-heading"><h2 id="last-at-hold-remaining-copy-title">Last at-hold remaining-to-hold Markdown</h2><button type="button" data-action="close-last-at-hold-remaining-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This is remaining to hold for the last roster row currently at hold. It is distinct from last unbounded remaining-to-hold copy and first unbounded remaining-to-hold copy. It is not a forecast.</p><label class="brief-copy-label" for="last-at-hold-remaining-copy-text">Last at-hold remaining-to-hold Markdown</label><textarea id="last-at-hold-remaining-copy-text" readonly rows="4">${escapeAttribute(lastAtHoldRemainingCopyText)}</textarea></div></section>`;
}

function copyLastAtHoldRemaining() {
  const validation = validateConfiguration(state);
  const result = validation.valid ? calculatePartnership(state) : null;
  const text = lastAtHoldRemainingMarkdown(result);
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'Last at-hold remaining-to-hold copied as Markdown. Remaining to hold. It is not a forecast.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          lastAtHoldRemainingCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showLastAtHoldRemainingCopyFallback(text, fallbackNote);
        });
        return;
      }
      lastAtHoldRemainingCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showLastAtHoldRemainingCopyFallback(text, fallbackNote);
      return;
    }
  }
  showLastAtHoldRemainingCopyFallback(text, fallbackNote);
}

function firstAtHoldRemainingMarkdown(result) {
  if (!result) return 'First at-hold remaining-to-hold: none entered.';
  const first = state.participants.find((item) => participantAtHoldRemainingToHold(result, item));
  if (!first) return 'First at-hold remaining-to-hold: none entered.';
  const named = result.participants.find((item) => item.id === first.id);
  const remaining = remainingToHoldAmount(result, first);
  if (remaining == null || !Number.isFinite(remaining)) {
    return 'First at-hold remaining-to-hold: none entered.';
  }
  return 'First at-hold remaining-to-hold: ' + formatVolume(remaining) + ' remaining for ' + reportText(named?.name ?? first.name) + '. Remaining to hold. Not a forecast.';
}

function showFirstAtHoldRemainingCopyFallback(text, message) {
  firstAtHoldRemainingCopyText = text;
  render();
  document.querySelector('#first-at-hold-remaining-copy-text')?.focus();
  setNotice(message);
}

function firstAtHoldRemainingCopySection() {
  if (!firstAtHoldRemainingCopyText) return '';
  return `<section class="panel" aria-labelledby="first-at-hold-remaining-copy-title"><div class="panel-heading"><h2 id="first-at-hold-remaining-copy-title">First at-hold remaining-to-hold Markdown</h2><button type="button" data-action="close-first-at-hold-remaining-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This is remaining to hold for the first roster row currently at hold. It is distinct from last at-hold remaining-to-hold copy, last unbounded remaining-to-hold copy, and first unbounded remaining-to-hold copy. It is not a forecast.</p><label class="brief-copy-label" for="first-at-hold-remaining-copy-text">First at-hold remaining-to-hold Markdown</label><textarea id="first-at-hold-remaining-copy-text" readonly rows="4">${escapeAttribute(firstAtHoldRemainingCopyText)}</textarea></div></section>`;
}

function copyFirstAtHoldRemaining() {
  const validation = validateConfiguration(state);
  const result = validation.valid ? calculatePartnership(state) : null;
  const text = firstAtHoldRemainingMarkdown(result);
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'First at-hold remaining-to-hold copied as Markdown. Remaining to hold. It is not a forecast.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          firstAtHoldRemainingCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showFirstAtHoldRemainingCopyFallback(text, fallbackNote);
        });
        return;
      }
      firstAtHoldRemainingCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showFirstAtHoldRemainingCopyFallback(text, fallbackNote);
      return;
    }
  }
  showFirstAtHoldRemainingCopyFallback(text, fallbackNote);
}

function lastZeroShareLabelMarkdown(result) {
  let participant = null;
  for (const item of state.participants) {
    if (participantHasZeroShare(item)) participant = item;
  }
  if (!participant) return 'Last zero-share participant: none entered.';
  const named = result?.participants.find((item) => item.id === participant.id);
  return 'Last zero-share participant: ' + reportText(named?.name ?? participant.name) + '. Last roster row with zero revenue share. Not a forecast.';
}

function showLastZeroShareLabelCopyFallback(text, message) {
  lastZeroShareLabelCopyText = text;
  render();
  document.querySelector('#last-zero-share-label-copy-text')?.focus();
  setNotice(message);
}

function lastZeroShareLabelCopySection() {
  if (!lastZeroShareLabelCopyText) return '';
  return `<section class="panel" aria-labelledby="last-zero-share-label-copy-title"><div class="panel-heading"><h2 id="last-zero-share-label-copy-title">Last zero-share participant label Markdown</h2><button type="button" data-action="close-last-zero-share-label-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This names the last roster row with zero revenue share. It is distinct from first at-hold remaining-to-hold copy, last at-hold remaining-to-hold copy, last unbounded remaining-to-hold copy, and first unbounded remaining-to-hold copy. It is not a forecast.</p><label class="brief-copy-label" for="last-zero-share-label-copy-text">Last zero-share participant label Markdown</label><textarea id="last-zero-share-label-copy-text" readonly rows="4">${escapeAttribute(lastZeroShareLabelCopyText)}</textarea></div></section>`;
}

function copyLastZeroShareParticipant() {
  const validation = validateConfiguration(state);
  const result = validation.valid ? calculatePartnership(state) : null;
  const text = lastZeroShareLabelMarkdown(result);
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'Last zero-share participant label copied as Markdown. Last roster row with zero revenue share. It is not a forecast.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          lastZeroShareLabelCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showLastZeroShareLabelCopyFallback(text, fallbackNote);
        });
        return;
      }
      lastZeroShareLabelCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showLastZeroShareLabelCopyFallback(text, fallbackNote);
      return;
    }
  }
  showLastZeroShareLabelCopyFallback(text, fallbackNote);
}

function lastZeroShareRemainingMarkdown(result) {
  let participant = null;
  for (const item of state.participants) {
    if (participantHasZeroShare(item)) participant = item;
  }
  if (!participant) return 'Last zero-share remaining-to-hold: none entered.';
  const named = result?.participants.find((item) => item.id === participant.id);
  const remaining = remainingToHoldAmount(result, participant);
  if (remaining == null || !Number.isFinite(remaining)) {
    return 'Last zero-share remaining-to-hold: remaining to hold is not a finite amount for ' + reportText(named?.name ?? participant.name) + '. Remaining to hold. Not a forecast.';
  }
  return 'Last zero-share remaining-to-hold: ' + formatVolume(remaining) + ' remaining for ' + reportText(named?.name ?? participant.name) + '. Remaining to hold. Not a forecast.';
}

function showLastZeroShareRemainingCopyFallback(text, message) {
  lastZeroShareRemainingCopyText = text;
  render();
  document.querySelector('#last-zero-share-remaining-copy-text')?.focus();
  setNotice(message);
}

function lastZeroShareRemainingCopySection() {
  if (!lastZeroShareRemainingCopyText) return '';
  return `<section class="panel" aria-labelledby="last-zero-share-remaining-copy-title"><div class="panel-heading"><h2 id="last-zero-share-remaining-copy-title">Last zero-share remaining-to-hold Markdown</h2><button type="button" data-action="close-last-zero-share-remaining-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This is remaining to hold for the last roster row with zero revenue share. It is distinct from first zero-share participant label copy, last zero-share participant label copy, first at-hold remaining-to-hold copy, and last unbounded remaining-to-hold copy. It is organizer or planner copy, not a forecast of who will exit.</p><label class="brief-copy-label" for="last-zero-share-remaining-copy-text">Last zero-share remaining-to-hold Markdown</label><textarea id="last-zero-share-remaining-copy-text" readonly rows="4">${escapeAttribute(lastZeroShareRemainingCopyText)}</textarea></div></section>`;
}

function copyLastZeroShareRemaining() {
  const validation = validateConfiguration(state);
  const result = validation.valid ? calculatePartnership(state) : null;
  const text = lastZeroShareRemainingMarkdown(result);
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'Last zero-share remaining-to-hold copied as Markdown. Remaining to hold. It is organizer or planner copy, not a forecast of who will exit.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          lastZeroShareRemainingCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showLastZeroShareRemainingCopyFallback(text, fallbackNote);
        });
        return;
      }
      lastZeroShareRemainingCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showLastZeroShareRemainingCopyFallback(text, fallbackNote);
      return;
    }
  }
  showLastZeroShareRemainingCopyFallback(text, fallbackNote);
}

function firstZeroShareRemainingMarkdown(result) {
  const participant = state.participants.find((item) => participantHasZeroShare(item));
  if (!participant) return 'First zero-share remaining-to-hold: none entered.';
  const named = result?.participants.find((item) => item.id === participant.id);
  const remaining = remainingToHoldAmount(result, participant);
  if (remaining == null || !Number.isFinite(remaining)) {
    return 'First zero-share remaining-to-hold: remaining to hold is not a finite amount for ' + reportText(named?.name ?? participant.name) + '. Remaining to hold. Not a forecast.';
  }
  return 'First zero-share remaining-to-hold: ' + formatVolume(remaining) + ' remaining for ' + reportText(named?.name ?? participant.name) + '. Remaining to hold. Not a forecast.';
}

function showFirstZeroShareRemainingCopyFallback(text, message) {
  firstZeroShareRemainingCopyText = text;
  render();
  document.querySelector('#first-zero-share-remaining-copy-text')?.focus();
  setNotice(message);
}

function firstZeroShareRemainingCopySection() {
  if (!firstZeroShareRemainingCopyText) return '';
  return `<section class="panel" aria-labelledby="first-zero-share-remaining-copy-title"><div class="panel-heading"><h2 id="first-zero-share-remaining-copy-title">First zero-share remaining-to-hold Markdown</h2><button type="button" data-action="close-first-zero-share-remaining-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This is remaining to hold for the first roster row with zero revenue share. It is distinct from first zero-share participant label copy, last zero-share participant label copy, last zero-share remaining-to-hold copy, first at-hold remaining-to-hold copy, last at-hold remaining-to-hold copy, last unbounded remaining-to-hold copy, and first unbounded remaining-to-hold copy. It is organizer or planner copy, not a forecast of who will exit.</p><label class="brief-copy-label" for="first-zero-share-remaining-copy-text">First zero-share remaining-to-hold Markdown</label><textarea id="first-zero-share-remaining-copy-text" readonly rows="4">${escapeAttribute(firstZeroShareRemainingCopyText)}</textarea></div></section>`;
}

function copyFirstZeroShareRemaining() {
  const validation = validateConfiguration(state);
  const result = validation.valid ? calculatePartnership(state) : null;
  const text = firstZeroShareRemainingMarkdown(result);
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'First zero-share remaining-to-hold copied as Markdown. Remaining to hold. It is organizer or planner copy, not a forecast of who will exit.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          firstZeroShareRemainingCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showFirstZeroShareRemainingCopyFallback(text, fallbackNote);
        });
        return;
      }
      firstZeroShareRemainingCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showFirstZeroShareRemainingCopyFallback(text, fallbackNote);
      return;
    }
  }
  showFirstZeroShareRemainingCopyFallback(text, fallbackNote);
}

function firstZeroShareLabelMarkdown(result) {
  const participant = state.participants.find((item) => participantHasZeroShare(item));
  if (!participant) return 'First zero-share participant: none entered.';
  const named = result?.participants.find((item) => item.id === participant.id);
  return 'First zero-share participant: ' + reportText(named?.name ?? participant.name) + '. First roster row with zero revenue share. Not a forecast.';
}

function showFirstZeroShareLabelCopyFallback(text, message) {
  firstZeroShareLabelCopyText = text;
  render();
  document.querySelector('#first-zero-share-label-copy-text')?.focus();
  setNotice(message);
}

function firstZeroShareLabelCopySection() {
  if (!firstZeroShareLabelCopyText) return '';
  return `<section class="panel" aria-labelledby="first-zero-share-label-copy-title"><div class="panel-heading"><h2 id="first-zero-share-label-copy-title">First zero-share participant label Markdown</h2><button type="button" data-action="close-first-zero-share-label-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This names the first roster row with zero revenue share. It is distinct from last zero-share participant label copy, first at-hold remaining-to-hold copy, last at-hold remaining-to-hold copy, last unbounded remaining-to-hold copy, and first unbounded remaining-to-hold copy. It is not a forecast.</p><label class="brief-copy-label" for="first-zero-share-label-copy-text">First zero-share participant label Markdown</label><textarea id="first-zero-share-label-copy-text" readonly rows="4">${escapeAttribute(firstZeroShareLabelCopyText)}</textarea></div></section>`;
}

function copyFirstZeroShareParticipant() {
  const validation = validateConfiguration(state);
  const result = validation.valid ? calculatePartnership(state) : null;
  const text = firstZeroShareLabelMarkdown(result);
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'First zero-share participant label copied as Markdown. First roster row with zero revenue share. It is not a forecast.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          firstZeroShareLabelCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showFirstZeroShareLabelCopyFallback(text, fallbackNote);
        });
        return;
      }
      firstZeroShareLabelCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showFirstZeroShareLabelCopyFallback(text, fallbackNote);
      return;
    }
  }
  showFirstZeroShareLabelCopyFallback(text, fallbackNote);
}

function lastBreakpointLabelMarkdown(result) {
  if (!result?.firstBreakpoint?.participant) return 'Last first-breakpoint participant: none entered.';
  let participant = null;
  for (const item of state.participants) {
    if (participantIsFirstBreakpoint(result, item)) participant = item;
  }
  if (!participant) return 'Last first-breakpoint participant: none entered.';
  const named = result.participants.find((item) => item.id === participant.id);
  return 'Last first-breakpoint participant: ' + reportText(named?.name ?? participant.name) + '. Last roster row that is the first-breakpoint. Not a forecast.';
}

function showLastBreakpointLabelCopyFallback(text, message) {
  lastBreakpointLabelCopyText = text;
  render();
  document.querySelector('#last-breakpoint-label-copy-text')?.focus();
  setNotice(message);
}

function lastBreakpointLabelCopySection() {
  if (!lastBreakpointLabelCopyText) return '';
  return `<section class="panel" aria-labelledby="last-breakpoint-label-copy-title"><div class="panel-heading"><h2 id="last-breakpoint-label-copy-title">Last first-breakpoint participant label Markdown</h2><button type="button" data-action="close-last-breakpoint-label-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This names the last roster row that is the first-breakpoint. It is distinct from first-breakpoint participant label copy. It is not a forecast.</p><label class="brief-copy-label" for="last-breakpoint-label-copy-text">Last first-breakpoint participant label Markdown</label><textarea id="last-breakpoint-label-copy-text" readonly rows="4">${escapeAttribute(lastBreakpointLabelCopyText)}</textarea></div></section>`;
}

function copyLastBreakpointLabel() {
  const validation = validateConfiguration(state);
  const result = validation.valid ? calculatePartnership(state) : null;
  const text = lastBreakpointLabelMarkdown(result);
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'Last first-breakpoint participant label copied as Markdown. Last roster row that is the first-breakpoint. It is not a forecast.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          lastBreakpointLabelCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showLastBreakpointLabelCopyFallback(text, fallbackNote);
        });
        return;
      }
      lastBreakpointLabelCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showLastBreakpointLabelCopyFallback(text, fallbackNote);
      return;
    }
  }
  showLastBreakpointLabelCopyFallback(text, fallbackNote);
}

function leastHeadroomLabelMarkdown(result) {
  const name = result?.weakestParticipant
    ? reportText(result.weakestParticipant.name)
    : '';
  if (!name) return 'Least-headroom participant: none entered.';
  return 'Least-headroom participant: ' + name + '. Volume-headroom ranking, not a forecast.';
}

function showViabilityLabelCopyFallback(text, message) {
  viabilityLabelCopyText = text;
  render();
  document.querySelector('#viability-label-copy-text')?.focus();
  setNotice(message);
}

function viabilityLabelCopySection() {
  if (!viabilityLabelCopyText) return '';
  return `<section class="panel" aria-labelledby="viability-label-copy-title"><div class="panel-heading"><h2 id="viability-label-copy-title">Least-headroom participant label Markdown</h2><button type="button" data-action="close-viability-label-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This names the viability card participant. It is not a forecast.</p><label class="brief-copy-label" for="viability-label-copy-text">Least-headroom participant label Markdown</label><textarea id="viability-label-copy-text" readonly rows="4">${escapeAttribute(viabilityLabelCopyText)}</textarea></div></section>`;
}

function copyLeastHeadroomLabel() {
  const validation = validateConfiguration(state);
  const result = validation.valid ? calculatePartnership(state) : null;
  const text = leastHeadroomLabelMarkdown(result);
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'Least-headroom participant label copied as Markdown. Volume-headroom ranking, not a forecast.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          viabilityLabelCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showViabilityLabelCopyFallback(text, fallbackNote);
        });
        return;
      }
      viabilityLabelCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showViabilityLabelCopyFallback(text, fallbackNote);
      return;
    }
  }
  showViabilityLabelCopyFallback(text, fallbackNote);
}

function shareHoldPreviewMarkdown(solved) {
  const target = state.participants.find((item) => item.id === solved.participantId);
  const name = reportText(target?.name ?? solved.participantId);
  const lines = ['# Share-to-hold preview', '', 'Participant: ' + name, 'Status: ' + solved.status];
  if (solved.status === 'possible' && solved.proposal) {
    lines.push('Minimum revenue share: ' + formatPct(solved.share * 100));
    lines.push('');
    lines.push('Current versus proposed shares:');
    for (const item of solved.proposal) {
      const current = state.participants.find((participant) => participant.id === item.id);
      const currentText = current ? formatPct(current.revenueShare * 100) : 'n/a';
      lines.push('- ' + reportText(item.name) + ': ' + currentText + ' to ' + formatPct(item.revenueShare * 100));
    }
  }
  lines.push('');
  lines.push(solved.reason);
  lines.push('');
  lines.push('This is a deterministic solvability result, not a probability that the participant will stay.');
  lines.push('');
  return lines.join('\n');
}

function showShareHoldCopyFallback(text, message) {
  shareHoldCopyText = text;
  render();
  document.querySelector('#share-hold-copy-text')?.focus();
  setNotice(message);
}

function shareHoldCopySection() {
  if (!shareHoldCopyText) return '';
  return `<section class="panel" aria-labelledby="share-hold-copy-title"><div class="panel-heading"><h2 id="share-hold-copy-title">Share-to-hold Markdown</h2><button type="button" data-action="close-share-hold-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This is a solvability result, not a probability.</p><label class="brief-copy-label" for="share-hold-copy-text">Share-to-hold preview Markdown</label><textarea id="share-hold-copy-text" readonly rows="12">${escapeAttribute(shareHoldCopyText)}</textarea></div></section>`;
}

function copyShareHoldPreview() {
  if (!shareHoldPreview) {
    setNotice('Open a share-to-hold preview before copying it.');
    return;
  }
  const text = shareHoldPreviewMarkdown(shareHoldPreview);
  const clipboard = globalThis.navigator?.clipboard;
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          shareHoldCopyText = '';
          render();
          setNotice('Share-to-hold preview copied as Markdown. It is a solvability result, not a probability.');
        }).catch(() => {
          showShareHoldCopyFallback(text, 'Clipboard unavailable. Copy the Markdown from the text area.');
        });
        return;
      }
      shareHoldCopyText = '';
      render();
      setNotice('Share-to-hold preview copied as Markdown. It is a solvability result, not a probability.');
      return;
    } catch {
      showShareHoldCopyFallback(text, 'Clipboard unavailable. Copy the Markdown from the text area.');
      return;
    }
  }
  showShareHoldCopyFallback(text, 'Clipboard unavailable. Copy the Markdown from the text area.');
}

function dealNotesMarkdown() {
  const notes = typeof state.deal.notes === 'string' && state.deal.notes.trim()
    ? state.deal.notes
    : 'No deal notes were entered.';
  return ['# Deal notes', '', notes, '', 'These are user-entered notes. They are not a probability or forecast.', ''].join('\n');
}

function dealNotesLineMarkdown() {
  const notes = typeof state.deal.notes === 'string' && state.deal.notes.trim()
    ? reportText(state.deal.notes.trim().replace(/\s+/g, ' '))
    : '';
  if (!notes) return 'Deal notes: none entered.';
  return 'Deal notes: ' + notes;
}

function showNotesCopyFallback(text, message) {
  notesCopyText = text;
  render();
  document.querySelector('#notes-copy-text')?.focus();
  setNotice(message);
}

function notesCopySection() {
  if (!notesCopyText) return '';
  return `<section class="panel" aria-labelledby="notes-copy-title"><div class="panel-heading"><h2 id="notes-copy-title">Deal notes Markdown</h2><button type="button" data-action="close-notes-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. These are user-entered notes, not a forecast.</p><label class="brief-copy-label" for="notes-copy-text">Deal notes Markdown</label><textarea id="notes-copy-text" readonly rows="10">${escapeAttribute(notesCopyText)}</textarea></div></section>`;
}

function copyDealNotes() {
  copyDealNotesText(
    dealNotesMarkdown(),
    'Deal notes copied as Markdown. They are user-entered notes, not a forecast.',
    'Clipboard unavailable. Copy the Markdown from the text area.',
  );
}

function copyDealNotesLine() {
  copyDealNotesText(
    dealNotesLineMarkdown(),
    'Deal notes copied as one-line Markdown. They are user-entered notes, not a forecast.',
    'Clipboard unavailable. Copy the Markdown from the text area.',
  );
}

function copyDealNotesText(text, copiedNote, fallbackNote) {
  const clipboard = globalThis.navigator?.clipboard;
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          notesCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showNotesCopyFallback(text, fallbackNote);
        });
        return;
      }
      notesCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showNotesCopyFallback(text, fallbackNote);
      return;
    }
  }
  showNotesCopyFallback(text, fallbackNote);
}

function contributionWaterfallMarkdown(result) {
  const lines = ['# Contribution waterfall', '', '| Participant | Contribution | Share |', '| --- | --- | --- |'];
  for (const participant of result.participants) {
    const contribution = Number.isFinite(participant.contributionPerTransaction)
      ? `${formatNumber(participant.contributionPerTransaction, 4)} units / txn`
      : 'n/a';
    lines.push('| ' + reportText(participant.name) + ' | ' + contribution + ' | ' + formatPct(participant.revenueShare * 100) + ' |');
  }
  lines.push('');
  lines.push('Contribution is fee times share less variable cost per transaction. This is a comparison aid, not a forecast.');
  lines.push('');
  return lines.join('\n');
}

function showWaterfallCopyFallback(text, message) {
  waterfallCopyText = text;
  render();
  document.querySelector('#waterfall-copy-text')?.focus();
  setNotice(message);
}

function waterfallCopySection() {
  if (!waterfallCopyText) return '';
  return `<section class="panel" aria-labelledby="waterfall-copy-title"><div class="panel-heading"><h2 id="waterfall-copy-title">Contribution waterfall Markdown</h2><button type="button" data-action="close-waterfall-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This lists contribution and share. It is not a forecast.</p><label class="brief-copy-label" for="waterfall-copy-text">Contribution waterfall Markdown</label><textarea id="waterfall-copy-text" readonly rows="12">${escapeAttribute(waterfallCopyText)}</textarea></div></section>`;
}

function copyContributionWaterfall() {
  const validation = validateConfiguration(state);
  if (!validation.valid) {
    setNotice('Resolve invalid inputs before copying the contribution waterfall. ' + summarizeErrors(validation.errors));
    return;
  }
  const text = contributionWaterfallMarkdown(calculatePartnership(state));
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'Contribution waterfall copied as Markdown. It is a comparison aid, not a forecast.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          waterfallCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showWaterfallCopyFallback(text, fallbackNote);
        });
        return;
      }
      waterfallCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showWaterfallCopyFallback(text, fallbackNote);
      return;
    }
  }
  showWaterfallCopyFallback(text, fallbackNote);
}

function viabilityCardMarkdown(result) {
  const weakest = result.weakestParticipant;
  const headroom = weakest.headroomToExit === null ? 'Impossible' : formatVolume(weakest.headroomToExit);
  const lines = [
    '# Viability and binding limit',
    '',
    'Participant: ' + reportText(weakest.name),
    'Headroom: ' + headroom,
    'Binding limit: ' + reportText(weakest.bindingConstraint.label),
    'Partnership: ' + (result.viable ? 'VIABLE' : 'NOT VIABLE'),
    'Effective volume: ' + formatVolume(result.effectiveVolume),
    '',
    'This names the participant with the least volume headroom. Counts are counts. It is not a probability.',
    '',
  ];
  return lines.join('\n');
}

function showViabilityCopyFallback(text, message) {
  viabilityCopyText = text;
  render();
  document.querySelector('#viability-copy-text')?.focus();
  setNotice(message);
}

function viabilityCopySection() {
  if (!viabilityCopyText) return '';
  return `<section class="panel" aria-labelledby="viability-copy-title"><div class="panel-heading"><h2 id="viability-copy-title">Viability card Markdown</h2><button type="button" data-action="close-viability-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. Counts are counts. This is not a probability.</p><label class="brief-copy-label" for="viability-copy-text">Viability card Markdown</label><textarea id="viability-copy-text" readonly rows="12">${escapeAttribute(viabilityCopyText)}</textarea></div></section>`;
}

function copyViabilityCard() {
  const validation = validateConfiguration(state);
  if (!validation.valid) {
    setNotice('Resolve invalid inputs before copying the viability card. ' + summarizeErrors(validation.errors));
    return;
  }
  const text = viabilityCardMarkdown(calculatePartnership(state));
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'Viability card copied as Markdown. Counts are counts. It is not a probability.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          viabilityCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showViabilityCopyFallback(text, fallbackNote);
        });
        return;
      }
      viabilityCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showViabilityCopyFallback(text, fallbackNote);
      return;
    }
  }
  showViabilityCopyFallback(text, fallbackNote);
}

function capacityUtilizationMarkdown(result) {
  const lines = ['# Capacity utilization', '', '| Participant | Capacity use |', '| --- | --- |'];
  for (const participant of result.participants) {
    lines.push('| ' + reportText(participant.name) + ' | ' + capacityUtilizationLabel(participant) + ' |');
  }
  lines.push('');
  lines.push('Capacity use is effective volume divided by capacity, or Unbounded when no capacity is supplied. This is a display, not a probability. It is not a forecast.');
  lines.push('');
  return lines.join('\n');
}

function showUtilizationCopyFallback(text, message) {
  utilizationCopyText = text;
  render();
  document.querySelector('#utilization-copy-text')?.focus();
  setNotice(message);
}

function utilizationCopySection() {
  if (!utilizationCopyText) return '';
  return `<section class="panel" aria-labelledby="utilization-copy-title"><div class="panel-heading"><h2 id="utilization-copy-title">Capacity utilization Markdown</h2><button type="button" data-action="close-utilization-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This is a display of volume over capacity, not a probability.</p><label class="brief-copy-label" for="utilization-copy-text">Capacity utilization Markdown</label><textarea id="utilization-copy-text" readonly rows="12">${escapeAttribute(utilizationCopyText)}</textarea></div></section>`;
}

function copyCapacityUtilization() {
  const validation = validateConfiguration(state);
  if (!validation.valid) {
    setNotice('Resolve invalid inputs before copying capacity utilization. ' + summarizeErrors(validation.errors));
    return;
  }
  const text = capacityUtilizationMarkdown(calculatePartnership(state));
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'Capacity utilization copied as Markdown. It is a display, not a probability. It is not a forecast.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          utilizationCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showUtilizationCopyFallback(text, fallbackNote);
        });
        return;
      }
      utilizationCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showUtilizationCopyFallback(text, fallbackNote);
      return;
    }
  }
  showUtilizationCopyFallback(text, fallbackNote);
}

function tornadoBoundedPercentage(row) {
  if (row.status === 'already-failing') return 'Already failing';
  if (row.status === 'at-breakpoint') return 'At breakpoint';
  if (row.changePct == null) return 'Unbounded';
  return formatPct(row.changePct);
}

function tornadoMarkdown(result) {
  const chart = tornadoChart(result);
  const lines = ['# Adverse-shock tornado', '', '| Participant | Shock axis | Bounded percentage |', '| --- | --- | --- |'];
  if (!chart.rows.length) {
    lines.push('| _none_ | _none_ | Unbounded |');
  } else {
    for (const row of chart.rows) {
      lines.push('| ' + reportText(row.name) + ' | ' + shockLabel(row.kind) + ' | ' + tornadoBoundedPercentage(row) + ' |');
    }
  }
  lines.push('');
  lines.push('Bounded percentage is the displayed adverse movement from the current scenario. Unbounded shocks have no invented number. This is a comparison aid, not a forecast.');
  lines.push('');
  return lines.join('\n');
}

function showTornadoCopyFallback(text, message) {
  tornadoCopyText = text;
  render();
  document.querySelector('#tornado-copy-text')?.focus();
  setNotice(message);
}

function tornadoCopySection() {
  if (!tornadoCopyText) return '';
  return `<section class="panel" aria-labelledby="tornado-copy-title"><div class="panel-heading"><h2 id="tornado-copy-title">Tornado Markdown</h2><button type="button" data-action="close-tornado-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This lists participant, shock axis, and bounded percentage. It is not a forecast.</p><label class="brief-copy-label" for="tornado-copy-text">Tornado Markdown</label><textarea id="tornado-copy-text" readonly rows="12">${escapeAttribute(tornadoCopyText)}</textarea></div></section>`;
}

function copyTornadoChart() {
  const validation = validateConfiguration(state);
  if (!validation.valid) {
    setNotice('Resolve invalid inputs before copying the tornado chart. ' + summarizeErrors(validation.errors));
    return;
  }
  const text = tornadoMarkdown(calculatePartnership(state));
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'Tornado copied as Markdown. It is a comparison aid, not a forecast.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          tornadoCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showTornadoCopyFallback(text, fallbackNote);
        });
        return;
      }
      tornadoCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showTornadoCopyFallback(text, fallbackNote);
      return;
    }
  }
  showTornadoCopyFallback(text, fallbackNote);
}

function operatingRegionMarkdown() {
  const grid = sensitivityGrid();
  const total = grid.fees.length * grid.volumes.length;
  let holdCount = 0;
  for (const row of grid.cells) {
    for (const holds of row) {
      if (holds) holdCount += 1;
    }
  }
  const lines = [
    '# Operating region',
    '',
    'Fee and volume sensitivity. Display only.',
    '',
    'Holds cells: ' + holdCount + ' of ' + total + '. Exit cells: ' + (total - holdCount) + ' of ' + total + '.',
    '',
    '| Fee / volume | ' + grid.volumes.map((volume) => formatNumber(volume)).join(' | ') + ' |',
    '| --- | ' + grid.volumes.map(() => '---').join(' | ') + ' |',
  ];
  for (let row = 0; row < grid.fees.length; row += 1) {
    const cells = grid.cells[row].map((holds) => holds ? 'Holds' : 'Exit');
    lines.push('| ' + formatNumber(grid.fees[row], 3) + ' | ' + cells.join(' | ') + ' |');
  }
  lines.push('');
  lines.push('This table is the displayed fee and volume grid. It is a display, not a forecast.');
  lines.push('');
  return lines.join('\n');
}

function showOperatingCopyFallback(text, message) {
  operatingCopyText = text;
  render();
  document.querySelector('#operating-copy-text')?.focus();
  setNotice(message);
}

function operatingCopySection() {
  if (!operatingCopyText) return '';
  return `<section class="panel" aria-labelledby="operating-copy-title"><div class="panel-heading"><h2 id="operating-copy-title">Operating region Markdown</h2><button type="button" data-action="close-operating-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This is the displayed fee and volume sensitivity grid. Display only.</p><label class="brief-copy-label" for="operating-copy-text">Operating region Markdown</label><textarea id="operating-copy-text" readonly rows="14">${escapeAttribute(operatingCopyText)}</textarea></div></section>`;
}

function copyOperatingRegion() {
  const validation = validateConfiguration(state);
  if (!validation.valid) {
    setNotice('Resolve invalid inputs before copying the operating region. ' + summarizeErrors(validation.errors));
    return;
  }
  const text = operatingRegionMarkdown();
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'Operating region copied as Markdown. Display only.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          operatingCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showOperatingCopyFallback(text, fallbackNote);
        });
        return;
      }
      operatingCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showOperatingCopyFallback(text, fallbackNote);
      return;
    }
  }
  showOperatingCopyFallback(text, fallbackNote);
}

function testedSplitMarkdown(stress) {
  const available = stress.negotiation.proposal ? 'yes' : 'no';
  const lines = [
    '# Tested split',
    '',
    'Cases held: ' + stress.passCount + ' of ' + stress.caseCount,
    'Fixed split available: ' + available,
    '',
    '| Participant | Cases held |',
    '| --- | --- |',
  ];
  for (const participant of stress.participants) {
    lines.push('| ' + reportText(participant.name) + ' | ' + participant.passCount + ' / ' + stress.caseCount + ' |');
  }
  lines.push('');
  lines.push('Counts are counts. This is not a probability.');
  lines.push('');
  return lines.join('\n');
}

function showSplitCopyFallback(text, message) {
  splitCopyText = text;
  render();
  document.querySelector('#split-copy-text')?.focus();
  setNotice(message);
}

function splitCopySection() {
  if (!splitCopyText) return '';
  return `<section class="panel" aria-labelledby="split-copy-title"><div class="panel-heading"><h2 id="split-copy-title">Tested split Markdown</h2><button type="button" data-action="close-split-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. Counts are counts. This is not a probability.</p><label class="brief-copy-label" for="split-copy-text">Tested split Markdown</label><textarea id="split-copy-text" readonly rows="12">${escapeAttribute(splitCopyText)}</textarea></div></section>`;
}

function copyTestedSplit() {
  const validation = validateConfiguration(state);
  if (!validation.valid) {
    setNotice('Resolve invalid inputs before copying the tested split. ' + summarizeErrors(validation.errors));
    return;
  }
  const text = testedSplitMarkdown(evaluateStressGrid(state));
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'Tested split copied as Markdown. Counts are counts. It is not a probability.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          splitCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showSplitCopyFallback(text, fallbackNote);
        });
        return;
      }
      splitCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showSplitCopyFallback(text, fallbackNote);
      return;
    }
  }
  showSplitCopyFallback(text, fallbackNote);
}

function allocationBalanceMarkdown() {
  return [
    '# Allocation balance',
    '',
    shareBalanceText(),
    '',
    'This names missing or excess revenue share. It is not a negotiated allocation.',
    '',
  ].join('\n');
}

function showAllocationCopyFallback(text, message) {
  allocationCopyText = text;
  render();
  document.querySelector('#allocation-copy-text')?.focus();
  setNotice(message);
}

function allocationCopySection() {
  if (!allocationCopyText) return '';
  return `<section class="panel" aria-labelledby="allocation-copy-title"><div class="panel-heading"><h2 id="allocation-copy-title">Allocation balance Markdown</h2><button type="button" data-action="close-allocation-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This names missing or excess share. It is not a negotiated allocation.</p><label class="brief-copy-label" for="allocation-copy-text">Allocation balance Markdown</label><textarea id="allocation-copy-text" readonly rows="10">${escapeAttribute(allocationCopyText)}</textarea></div></section>`;
}

function copyAllocationBalance() {
  const text = allocationBalanceMarkdown();
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'Allocation balance copied as Markdown. It is not a negotiated allocation.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          allocationCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showAllocationCopyFallback(text, fallbackNote);
        });
        return;
      }
      allocationCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showAllocationCopyFallback(text, fallbackNote);
      return;
    }
  }
  showAllocationCopyFallback(text, fallbackNote);
}

function dealTitleCurrencyMarkdown() {
  const title = typeof state.deal.title === 'string' && state.deal.title.trim()
    ? reportText(state.deal.title.trim())
    : '';
  const currency = currencyPrefix();
  if (!title && !currency) return 'Deal title and currency: none entered.';
  return 'Deal title: ' + (title || 'none') + '. Currency: ' + (currency || 'none') + '.';
}

function showTitleCopyFallback(text, message) {
  titleCopyText = text;
  render();
  document.querySelector('#title-copy-text')?.focus();
  setNotice(message);
}

function titleCopySection() {
  if (!titleCopyText) return '';
  return `<section class="panel" aria-labelledby="title-copy-title"><div class="panel-heading"><h2 id="title-copy-title">Deal title and currency Markdown</h2><button type="button" data-action="close-title-copy">Close</button></div><div class="panel-body"><p>Clipboard is unavailable in this browser. Select the Markdown below and copy it. This is user-entered display text, not a forecast.</p><label class="brief-copy-label" for="title-copy-text">Deal title and currency Markdown</label><textarea id="title-copy-text" readonly rows="4">${escapeAttribute(titleCopyText)}</textarea></div></section>`;
}

function copyDealTitleCurrency() {
  const text = dealTitleCurrencyMarkdown();
  const clipboard = globalThis.navigator?.clipboard;
  const copiedNote = 'Deal title and currency copied as Markdown. Display text, not a forecast.';
  const fallbackNote = 'Clipboard unavailable. Copy the Markdown from the text area.';
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      const written = clipboard.writeText(text);
      if (written && typeof written.then === 'function') {
        written.then(() => {
          titleCopyText = '';
          render();
          setNotice(copiedNote);
        }).catch(() => {
          showTitleCopyFallback(text, fallbackNote);
        });
        return;
      }
      titleCopyText = '';
      render();
      setNotice(copiedNote);
      return;
    } catch {
      showTitleCopyFallback(text, fallbackNote);
      return;
    }
  }
  showTitleCopyFallback(text, fallbackNote);
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
    checkpoint(); state = withStress(candidate); readCollapsePreference(); activePreset = '';
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
  const copyButton = '<div class="button-row"><button type="button" data-action="copy-share-hold">Copy share-to-hold preview</button></div>';
  if (solved.status === 'impossible') {
    return `<section class="panel" aria-labelledby="share-hold-title"><div class="panel-heading"><h2 id="share-hold-title" tabindex="-1">Share-to-hold preview</h2><button type="button" data-action="close-share-hold">Close preview</button></div><div class="panel-body"><p>${escapeAttribute(solved.reason)}</p><p class="output-note">This is a deterministic solvability result, not a probability that the participant will stay.</p>${copyButton}</div></section>`;
  }
  const rows = solved.proposal.map((item) => {
    const current = state.participants.find((participant) => participant.id === item.id);
    return `<tr><th scope="row">${escapeAttribute(item.name)}</th><td>${current ? formatPct(current.revenueShare * 100) : 'n/a'}</td><td>${formatPct(item.revenueShare * 100)}</td></tr>`;
  }).join('');
  return `<section class="panel" aria-labelledby="share-hold-title"><div class="panel-heading"><h2 id="share-hold-title" tabindex="-1">Share-to-hold preview</h2><button type="button" data-action="close-share-hold">Close preview</button></div><div class="panel-body"><p><strong>${name}</strong> holds at a minimum revenue share of <strong>${formatPct(solved.share * 100)}</strong>. Remaining participants keep their relative shares of the leftover. Apply is required; the current case is unchanged until then.</p><p>${escapeAttribute(solved.reason)}</p></div><div class="table-wrap" tabindex="0" role="region" aria-label="Proposed hold shares"><table><caption>Current shares versus proposed hold split</caption><thead><tr><th scope="col">Participant</th><th scope="col">Current share</th><th scope="col">Proposed share</th></tr></thead><tbody>${rows}</tbody></table></div><div class="panel-body"><div class="button-row"><button type="button" class="primary" data-action="apply-share-hold">Apply minimum hold share</button><button type="button" data-action="close-share-hold">Keep current shares</button><button type="button" data-action="copy-share-hold">Copy share-to-hold preview</button></div></div></section>`;
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
        <li><kbd>f</kbd> Jump to the First breakpoint heading</li>
        <li><kbd>w</kbd> Jump to the Contribution waterfall heading</li>
        <li><kbd>l</kbd> Jump to the Participant ledger heading</li>
        <li><kbd>b</kbd> Jump to the viability and binding-limit card heading</li>
        <li><kbd>t</kbd> Jump to the tornado chart heading</li>
        <li><kbd>d</kbd> Jump to the Shared deal heading</li>
        <li><kbd>k</kbd> Jump to the Compound stress heading</li>
        <li><kbd>h</kbd> Jump to the least-headroom participant card, or the Participants heading if none</li>
        <li><kbd>a</kbd> Jump to Add participant</li>
        <li><kbd>m</kbd> Jump to deal notes</li>
        <li><kbd>v</kbd> Jump to the viability card</li>
        <li><kbd>i</kbd> Jump to the inspect or compare cases heading</li>
        <li><kbd>o</kbd> Jump to the Operating region heading</li>
        <li><kbd>j</kbd> Copy capacity utilization as Markdown</li>
        <li><kbd>q</kbd> Jump to Equal split or Normalize current shares</li>
        <li><kbd>x</kbd> Jump to the first roster row over listed capacity, or the Participants heading if none</li>
        <li><kbd>y</kbd> Copy deal notes as one-line Markdown</li>
        <li><kbd>z</kbd> Jump to Copy deal title and currency, or the Shared deal heading if missing</li>
        <li><kbd>,</kbd> Copy the first-breakpoint participant label as Markdown</li>
        <li><kbd>.</kbd> Jump to Copy first-breakpoint participant label, or the First breakpoint heading if missing</li>
        <li><kbd>/</kbd> Jump to Copy deal title and currency, or the Shared deal heading if missing</li>
        <li><kbd>;</kbd> Copy the least-headroom participant label as Markdown</li>
        <li><kbd>[</kbd> Jump to Copy least-headroom participant label, or the First breakpoint or results heading if missing</li>
        <li><kbd>]</kbd> Jump to Print one-pager, or the print / one-pager heading if missing</li>
        <li><kbd>'</kbd> Copy first-breakpoint remaining-to-hold as Markdown</li>
        <li><kbd>:</kbd> Copy first-breakpoint volume-to-hold as Markdown</li>
        <li><kbd>"</kbd> Copy over-capacity participant count as Markdown</li>
        <li><kbd>}</kbd> Copy the first over-capacity participant label as Markdown</li>
        <li><kbd>~</kbd> Copy first over-capacity remaining listed capacity as Markdown</li>
        <li><kbd>(</kbd> Copy the last over-capacity participant label as Markdown</li>
        <li><kbd>*</kbd> Copy last over-capacity remaining listed capacity as Markdown</li>
        <li><kbd>$</kbd> Copy first within-capacity remaining listed capacity as Markdown</li>
        <li><kbd>5</kbd> Copy last within-capacity remaining listed capacity as Markdown</li>
        <li><kbd>)</kbd> Jump to Copy last over-capacity participant label, or the First breakpoint or Participants heading if missing</li>
        <li><kbd>&amp;</kbd> Jump to Copy last over-capacity remaining listed capacity, or the First breakpoint or Participants heading if missing</li>
        <li><kbd>^</kbd> Jump to Copy first within-capacity remaining listed capacity, or the First breakpoint or Participants heading if missing</li>
        <li><kbd>6</kbd> Jump to Copy last within-capacity remaining listed capacity, or the results heading if missing</li>
        <li><kbd>#</kbd> Jump to Hide the last over-capacity participant, or the Participants heading if missing</li>
        <li><kbd>%</kbd> Jump to Hide the last first-breakpoint participant, or the Participants heading if missing</li>
        <li><kbd>\`</kbd> Jump to Hide the first within-capacity participant, or the Participants heading if missing</li>
        <li><kbd>7</kbd> Jump to Hide the last spare-capacity participant, or the Participants heading if missing</li>
        <li><kbd>8</kbd> Copy last spare-capacity remaining listed capacity as Markdown</li>
        <li><kbd>9</kbd> Jump to Copy last spare-capacity remaining listed capacity, or the results heading if missing</li>
        <li><kbd>0</kbd> Jump to Hide the first spare-capacity participant, or the Participants heading if missing</li>
        <li><kbd>1</kbd> Copy first spare-capacity remaining listed capacity as Markdown</li>
        <li><kbd>2</kbd> Jump to Copy first spare-capacity remaining listed capacity, or the results heading if missing</li>
        <li><kbd>3</kbd> Jump to Hide the last participant without listed capacity, or the Participants heading if missing</li>
        <li><kbd>4</kbd> Copy last unbounded remaining-to-hold as Markdown</li>
        <li><kbd>PageUp</kbd> Copy first unbounded remaining-to-hold as Markdown</li>
        <li><kbd>Insert</kbd> Copy last at-hold remaining-to-hold as Markdown</li>
        <li><kbd>Delete</kbd> Copy first at-hold remaining-to-hold as Markdown</li>
        <li><kbd>Home</kbd> Jump to Copy last unbounded remaining-to-hold, or the Participants heading if missing</li>
        <li><kbd>PageDown</kbd> Jump to Copy first unbounded remaining-to-hold, or the Participants heading if missing</li>
        <li><kbd>ArrowDown</kbd> Jump to Copy last at-hold remaining-to-hold, or the Participants heading if missing</li>
        <li><kbd>F2</kbd> Jump to Copy first at-hold remaining-to-hold, or the Participants heading if missing</li>
        <li><kbd>End</kbd> Jump to Hide the first participant without listed capacity, or the Participants heading if missing</li>
        <li><kbd>ArrowUp</kbd> Jump to Hide the last participant at hold, or the Participants heading if missing</li>
        <li><kbd>ArrowLeft</kbd> Jump to Hide the first participant at hold, or the Participants heading if missing</li>
        <li><kbd>ArrowRight</kbd> Jump to Hide the first participant with zero revenue share, or the Participants heading if missing</li>
        <li><kbd>F3</kbd> Copy last zero-share participant label as Markdown</li>
        <li><kbd>F4</kbd> Jump to Copy last zero-share participant label, or the Participants heading if missing</li>
        <li><kbd>Backspace</kbd> Jump to Hide the last participant with zero revenue share, or the Participants heading if missing</li>
        <li><kbd>F7</kbd> Copy first zero-share participant label as Markdown</li>
        <li><kbd>F8</kbd> Jump to Copy first zero-share participant label, or the Participants heading if missing</li>
        <li><kbd>F9</kbd> Jump to Hide the first participant with zero revenue share, or the Participants heading if missing</li>
        <li><kbd>F10</kbd> Copy last zero-share remaining-to-hold as Markdown</li>
        <li><kbd>F11</kbd> Jump to Copy last zero-share remaining-to-hold, or the Participants heading if missing</li>
        <li><kbd>F12</kbd> Jump to Hide the last participant with zero revenue share, or the Participants heading if missing</li>
        <li><kbd>+</kbd> Jump to Copy first over-capacity participant label, or the First breakpoint or Participants heading if missing</li>
        <li><kbd>!</kbd> Jump to Copy first over-capacity remaining listed capacity, or the First breakpoint or Participants heading if missing</li>
        <li><kbd>|</kbd> Jump to Hide the first-breakpoint participant, or the Participants heading if missing</li>
        <li><kbd>@</kbd> Jump to Hide the first over-capacity participant, or the Participants heading if missing</li>
        <li><kbd>_</kbd> Jump to Copy over-capacity participant count, or the Participants heading if missing</li>
        <li><kbd>-</kbd> Jump to Copy first-breakpoint volume-to-hold, or the First breakpoint heading if missing</li>
        <li><kbd>=</kbd> Jump to Hide the least-headroom participant, or the Participants heading if missing</li>
        <li><kbd>{</kbd> Jump to Hide participants who are within listed capacity, or the Participants heading if missing</li>
        <li><kbd>&lt;</kbd> Jump to Copy first-breakpoint remaining-to-hold, or the First breakpoint heading if missing</li>
        <li><kbd>&gt;</kbd> Jump to Hide participants with unused listed capacity, or the Participants heading if missing</li>
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
