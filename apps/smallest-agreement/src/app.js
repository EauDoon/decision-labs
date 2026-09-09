import {
  MAX_CLAUSES,
  MAX_COMBINATIONS,
  MAX_GROUPS,
  MAX_OPTIONS_PER_CLAUSE,
  canonicalProposal,
  clauseContributions,
  comparePinnedPackages,
  explorePackageGaps,
  evaluatePackage,
  lockPackage,
  clearAllLocks,
  toggleClauseLock,
  duplicateParticipantGroup,
  sortPackageGapRows,
  formatSupportMatrixCsv,
  parseSupportMatrixCsv,
  previewLockedOption,
  leaveOneGroupOut,
  formatDiscussionWorksheet,
  formatDiscussionWorksheetCsv,
  groupContributions,
  stressPackage,
  compareScenarioInputs,
  formatEvidenceCsv,
  findSmallestAgreement,
  formatPercent,
  formatDecisionBrief,
  validateProposal,
} from "./model.js";

const STORAGE_KEY = "smallest-agreement:proposal:v1";
const LIBRARY_KEY = "smallest-agreement:scenarios:v1";
const COACH_KEY = "smallest-agreement:coach:v1";
const MAX_SCENARIOS = 20;
let libraryBlocked = false;
let libraryRaw = null;
let hasUnsavedEdits = false;
const HASH_PREFIX = "#agreement=";
let idNumber = 100;
let initialLoadMessage = "Loaded local draft.";
let importSequence = 0;

const presets = {
  "protected-access": {
    title: "Protected Access: shared workshop",
    threshold: 70,
    maxChangeCost: 3,
    groups: [
      { id: "regular", name: "Regular participants", weight: 9 },
      { id: "new", name: "New participants", weight: 1, minSupport: 60 },
    ],
    clauses: [
      { id: "booking", title: "Workshop booking", options: [
        { id: "booking-original", original: true, label: "Retain recurring reservations", changeCost: 0, support: { regular: 90, new: 10 } },
        { id: "booking-notice", original: false, label: "Publish cancellations each week", changeCost: 1, support: { regular: 95, new: 30 } },
        { id: "booking-open", original: false, label: "Reserve an open booking window", changeCost: 3, support: { regular: 80, new: 90 } },
      ] },
      { id: "training", title: "Safety training", lockedOptionId: "training-original", options: [
        { id: "training-original", original: true, label: "Keep supervised induction", changeCost: 0, support: { regular: 80, new: 50 } },
        { id: "training-weekly", original: false, label: "Add weekly induction sessions", changeCost: 2, support: { regular: 85, new: 90 } },
        { id: "training-pairs", original: false, label: "Offer paired induction appointments", changeCost: 4, support: { regular: 80, new: 95 } },
      ] },
    ],
  },
  neighbourhood: {
    title: "Neighbourhood Plan: the shared green",
    threshold: 68,
    groups: [
      { id: "residents", name: "Residents", weight: 3 },
      { id: "shopkeepers", name: "Shopkeepers", weight: 2 },
      { id: "stewards", name: "Park stewards", weight: 2 },
    ],
    clauses: [
      {
        id: "hours", title: "Park access hours", options: [
          { id: "hours-original", original: true, label: "Close at 20:00 every day", changeCost: 0, support: { residents: 78, shopkeepers: 55, stewards: 88 } },
          { id: "hours-seasonal", original: false, label: "Use seasonal closing times", changeCost: 2, support: { residents: 86, shopkeepers: 74, stewards: 73 } },
          { id: "hours-pilot", original: false, label: "Trial a 21:00 Friday close for three months", changeCost: 3, support: { residents: 84, shopkeepers: 83, stewards: 60 } },
        ],
      },
      {
        id: "market", title: "Weekend market use", options: [
          { id: "market-original", original: true, label: "No regular market use", changeCost: 0, support: { residents: 60, shopkeepers: 52, stewards: 91 } },
          { id: "market-monthly", original: false, label: "Permit one monthly market with clean-up bond", changeCost: 2, support: { residents: 74, shopkeepers: 89, stewards: 72 } },
          { id: "market-seasonal", original: false, label: "Permit a summer market series", changeCost: 5, support: { residents: 68, shopkeepers: 93, stewards: 48 } },
        ],
      },
      {
        id: "path", title: "Path lighting", options: [
          { id: "path-original", original: true, label: "Replace failed lamps as needed", changeCost: 0, support: { residents: 58, shopkeepers: 63, stewards: 80 } },
          { id: "path-warm", original: false, label: "Install warm low-level path lighting", changeCost: 3, support: { residents: 85, shopkeepers: 76, stewards: 67 } },
          { id: "path-motion", original: false, label: "Install motion-activated lighting", changeCost: 4, support: { residents: 78, shopkeepers: 71, stewards: 75 } },
        ],
      },
    ],
  },
  "open-source": {
    title: "Open Source Policy: contributor access",
    threshold: 72,
    groups: [
      { id: "maintainers", name: "Maintainers", weight: 3 },
      { id: "contributors", name: "Contributors", weight: 3 },
      { id: "users", name: "Downstream users", weight: 2 },
    ],
    clauses: [
      {
        id: "review", title: "Pull request review", options: [
          { id: "review-original", original: true, label: "Two maintainer approvals for every merge", changeCost: 0, support: { maintainers: 88, contributors: 48, users: 75 } },
          { id: "review-risk", original: false, label: "One approval for documented low-risk changes", changeCost: 2, support: { maintainers: 73, contributors: 80, users: 78 } },
          { id: "review-rotation", original: false, label: "Weekly rotating review pair", changeCost: 4, support: { maintainers: 69, contributors: 85, users: 72 } },
        ],
      },
      {
        id: "release", title: "Release cadence", options: [
          { id: "release-original", original: true, label: "Quarterly feature releases", changeCost: 0, support: { maintainers: 81, contributors: 51, users: 69 } },
          { id: "release-monthly", original: false, label: "Monthly release train with a freeze week", changeCost: 3, support: { maintainers: 70, contributors: 79, users: 85 } },
          { id: "release-patch", original: false, label: "Keep quarterly features and publish monthly patches", changeCost: 1, support: { maintainers: 80, contributors: 68, users: 82 } },
        ],
      },
      {
        id: "conduct", title: "Contributor conduct process", options: [
          { id: "conduct-original", original: true, label: "Maintainer-led private review", changeCost: 0, support: { maintainers: 74, contributors: 57, users: 72 } },
          { id: "conduct-panel", original: false, label: "Standing three-person review panel", changeCost: 3, support: { maintainers: 68, contributors: 83, users: 77 } },
          { id: "conduct-adviser", original: false, label: "External adviser for escalated cases", changeCost: 5, support: { maintainers: 60, contributors: 86, users: 80 } },
        ],
      },
    ],
  },
  "association-budget": {
    title: "Association Budget: repair and reserve plan",
    threshold: 70,
    groups: [
      { id: "owners", name: "Owners", weight: 4 },
      { id: "tenants", name: "Tenants", weight: 2 },
      { id: "board", name: "Board", weight: 2 },
    ],
    clauses: [
      {
        id: "reserve", title: "Reserve contribution", options: [
          { id: "reserve-original", original: true, label: "Raise annual reserve contribution by 8%", changeCost: 0, support: { owners: 57, tenants: 72, board: 91 } },
          { id: "reserve-staged", original: false, label: "Raise 4% now and review after six months", changeCost: 2, support: { owners: 77, tenants: 76, board: 75 } },
          { id: "reserve-loan", original: false, label: "Fund reserves with a five-year loan", changeCost: 5, support: { owners: 61, tenants: 81, board: 54 } },
        ],
      },
      {
        id: "roof", title: "Roof repair timing", options: [
          { id: "roof-original", original: true, label: "Complete all repairs this financial year", changeCost: 0, support: { owners: 63, tenants: 71, board: 87 } },
          { id: "roof-priority", original: false, label: "Repair critical sections now and inspect the rest", changeCost: 2, support: { owners: 82, tenants: 78, board: 74 } },
          { id: "roof-defer", original: false, label: "Defer repairs for one year", changeCost: 4, support: { owners: 70, tenants: 52, board: 39 } },
        ],
      },
      {
        id: "amenity", title: "Amenity refresh", options: [
          { id: "amenity-original", original: true, label: "Refresh lobby and courtyard this year", changeCost: 0, support: { owners: 55, tenants: 69, board: 77 } },
          { id: "amenity-courtyard", original: false, label: "Refresh courtyard only after roof milestones", changeCost: 2, support: { owners: 76, tenants: 75, board: 71 } },
          { id: "amenity-pause", original: false, label: "Pause amenity works for one year", changeCost: 1, support: { owners: 72, tenants: 49, board: 68 } },
        ],
      },
    ],
  },
  "workplace-hybrid": {
    title: "Workplace Hybrid: office presence policy",
    threshold: 70,
    groups: [
      { id: "onsite", name: "On-site staff", weight: 3 },
      { id: "remote", name: "Remote staff", weight: 3 },
      { id: "managers", name: "Managers", weight: 2 },
    ],
    clauses: [
      {
        id: "presence", title: "Weekly office presence", options: [
          { id: "presence-original", original: true, label: "Require three office days each week", changeCost: 0, support: { onsite: 82, remote: 38, managers: 88 } },
          { id: "presence-overlap", original: false, label: "Require two overlapping team days", changeCost: 2, support: { onsite: 78, remote: 74, managers: 80 } },
          { id: "presence-choice", original: false, label: "Let teams choose presence within a published window", changeCost: 3, support: { onsite: 70, remote: 88, managers: 62 } },
        ],
      },
      {
        id: "hours", title: "Core collaboration hours", options: [
          { id: "hours-original", original: true, label: "Keep 10:00 to 16:00 overlap every weekday", changeCost: 0, support: { onsite: 76, remote: 44, managers: 84 } },
          { id: "hours-four", original: false, label: "Use a four-hour overlap window", changeCost: 1, support: { onsite: 72, remote: 80, managers: 74 } },
          { id: "hours-async", original: false, label: "Drop fixed hours and rely on written updates", changeCost: 4, support: { onsite: 48, remote: 90, managers: 40 } },
        ],
      },
      {
        id: "desks", title: "Desk assignment", options: [
          { id: "desks-original", original: true, label: "Keep assigned desks for every role", changeCost: 0, support: { onsite: 80, remote: 42, managers: 70 } },
          { id: "desks-bookable", original: false, label: "Move to bookable desks with neighbourhood zones", changeCost: 2, support: { onsite: 64, remote: 82, managers: 68 } },
          { id: "desks-hybrid", original: false, label: "Keep assigned desks for on-site roles and bookable desks for others", changeCost: 3, support: { onsite: 74, remote: 76, managers: 72 } },
        ],
      },
    ],
  },
};

const state = { proposal: loadInitialProposal(), saveMessage: initialLoadMessage };
let scenarios = loadScenarios();
let manualSelection = Object.create(null);
let lockPreview = null;
let clauseFilter = "";
let nearMissSort = "approval_gap";
let cachedResultKey;
let cachedResult;
const savedResults = new WeakMap();
const undoStack = [];
const redoStack = [];
let historySnapshot = JSON.stringify(state.proposal);
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
function clone(value) { return JSON.parse(JSON.stringify(value)); }

function firstProposalError(proposal) {
  return validateProposal(proposal).errors[0];
}

function parseProposalJson(text) {
  let proposal;
  try {
    proposal = JSON.parse(text);
  } catch (error) {
    return { cause: error instanceof SyntaxError ? "the text is not valid JSON." : "it could not be parsed." };
  }
  const cause = firstProposalError(proposal);
  return cause ? { cause } : { proposal: canonicalProposal(proposal) };
}

function makeId(prefix) {
  const used = new Set([
    ...state.proposal.groups.map((group) => group.id),
    ...state.proposal.clauses.flatMap((clause) => [clause.id, ...clause.options.map((option) => option.id)]),
  ]);
  do { idNumber += 1; } while (used.has(`${prefix}-${idNumber}`));
  return `${prefix}-${idNumber}`;
}

function defaultSupport(groups, value = 50) {
  return Object.fromEntries(groups.map((group) => [group.id, value]));
}

function loadInitialProposal() {
  const shared = parseHash();
  if (shared) return shared;
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    initialLoadMessage = "Browser storage is unavailable. Started from the Neighbourhood Plan preset.";
    return clone(presets.neighbourhood);
  }
  if (raw == null || raw === "") return clone(presets.neighbourhood);
  const parsed = parseProposalJson(raw);
  if (parsed.cause) {
    initialLoadMessage = `Local draft ignored: ${parsed.cause}`;
    return clone(presets.neighbourhood);
  }
  initialLoadMessage = "Loaded local draft.";
  return parsed.proposal;
}

function parseHash() {
  if (!location.hash.startsWith(HASH_PREFIX)) return null;
  if (location.hash.length > 60_000) {
    initialLoadMessage = "Share link ignored: it is larger than 60 KB.";
    return null;
  }
  let encoded;
  try {
    encoded = decodeURIComponent(location.hash.slice(HASH_PREFIX.length))
      .replaceAll("-", "+")
      .replaceAll("_", "/");
  } catch {
    initialLoadMessage = "Share link ignored: the URL encoding is invalid.";
    return null;
  }
  const padded = encoded.padEnd(encoded.length + ((4 - (encoded.length % 4)) % 4), "=");
  let binary;
  try {
    binary = atob(padded);
  } catch {
    initialLoadMessage = "Share link ignored: it is not valid base64.";
    return null;
  }
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
  } catch {
    initialLoadMessage = "Share link ignored: it is not valid UTF-8.";
    return null;
  }
  const parsed = parseProposalJson(text);
  if (parsed.cause) {
    initialLoadMessage = `Share link ignored: ${parsed.cause}`;
    return null;
  }
  initialLoadMessage = "Loaded proposal from the share link.";
  return parsed.proposal;
}

function encodeHash(proposal) {
  const bytes = new TextEncoder().encode(JSON.stringify(proposal));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  const encoded = btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
  return `${HASH_PREFIX}${encoded}`;
}

function updateHistoryButtons() {
  $("#undo-button").disabled = undoStack.length === 0;
  $("#redo-button").disabled = redoStack.length === 0;
}

function save(recordHistory = true) {
  hasUnsavedEdits = true;
  const snapshot = JSON.stringify(state.proposal);
  if (recordHistory && snapshot !== historySnapshot) {
    undoStack.push(historySnapshot);
    if (undoStack.length > 50) undoStack.shift();
    redoStack.length = 0;
  }
  historySnapshot = snapshot;
  updateHistoryButtons();
  importSequence += 1;
  const error = firstProposalError(state.proposal);
  if (error) {
    state.saveMessage = `Invalid edits are not saved: ${error}`;
    return;
  }
  if (location.hash.startsWith(HASH_PREFIX)) history.replaceState(null, "", `${location.pathname}${location.search}`);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(canonicalProposal(state.proposal)));
    hasUnsavedEdits = false;
    state.saveMessage = "Saved in this browser.";
  } catch {
    state.saveMessage = "Browser storage is unavailable. Export to keep this draft.";
  }
}

function currentResult() {
  const key = JSON.stringify(state.proposal);
  if (key !== cachedResultKey) {
    cachedResult = findSmallestAgreement(state.proposal, { maxCombinations: MAX_COMBINATIONS, alternativesLimit: 5 });
    cachedResultKey = key;
  }
  return cachedResult;
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatMargin(value) {
  const rounded = Number(value.toFixed(1));
  return [rounded > 0 ? "+" : "", rounded.toFixed(1), " points"].join("");
}

function render() {
  const proposal = state.proposal;
  $("[data-action=\"add-group\"]").disabled = proposal.groups.length >= MAX_GROUPS;
  $("[data-action=\"add-clause\"]").disabled = proposal.clauses.length >= MAX_CLAUSES;
  $("#clear-locks").disabled = !proposal.clauses.some((clause) => clause.lockedOptionId !== undefined);
  $("#proposal-title").value = proposal.title;
  $("#threshold").value = proposal.threshold;
  $("#threshold-number").value = Number.isFinite(proposal.threshold) ? proposal.threshold : "";
  $("#threshold-output").textContent = `${proposal.threshold}%`;
  $("#max-change-cost").value = proposal.maxChangeCost ?? "";
  $("#proposal-heading").textContent = proposal.title;
  $("#autosave-status").textContent = state.saveMessage;
  updateHistoryButtons();
  renderScenarios();
  renderGroups();
  $("#clause-filter").value = clauseFilter;
  renderClauses();
  renderBallot();
  renderResults(currentResult());
}

function renderGroups() {
  $("#groups-editor").innerHTML = state.proposal.groups.map((group) => `
    <div class="group-row">
      <label><span class="visually-hidden">Group name</span><input data-field="group-name" data-group-id="${escapeHtml(group.id)}" value="${escapeHtml(group.name)}" maxlength="80" aria-label="Group name"></label>
      <label><span class="visually-hidden">Weight</span><input data-field="group-weight" data-group-id="${escapeHtml(group.id)}" type="number" min="0" max="1000000" step="any" required value="${group.weight}" aria-label="${escapeHtml(group.name)} weight"></label>
      <button class="text-button" type="button" data-action="duplicate-group" data-group-id="${escapeHtml(group.id)}" ${state.proposal.groups.length >= MAX_GROUPS ? "disabled" : ""}>Duplicate group</button>
      <button class="text-button danger" type="button" data-action="remove-group" data-group-id="${escapeHtml(group.id)}" ${state.proposal.groups.length <= 1 ? "disabled" : ""}>Remove</button>
      <label class="group-floor">Minimum support (%)<input data-field="group-floor" data-group-id="${escapeHtml(group.id)}" type="number" min="0" max="100" step="any" value="${group.minSupport ?? ""}" placeholder="No floor" aria-label="${escapeHtml(group.name)} minimum support" aria-describedby="floor-note"></label>
      <label class="group-veto"><input data-field="group-veto" data-group-id="${escapeHtml(group.id)}" type="checkbox" ${group.veto === true ? "checked" : ""} aria-describedby="veto-note" aria-label="${escapeHtml(group.name)} veto"> Veto group (average support must meet the threshold)</label>
    </div>`).join("");
  const total = state.proposal.groups.reduce((sum, group) => sum + (Number.isFinite(group.weight) && group.weight > 0 ? group.weight : 0), 0);
  if (!(total > 0)) {
    $("#weight-shares").innerHTML = '<p class="field-note">Weight shares need positive finite weights.</p>';
    return;
  }
  $("#weight-shares").innerHTML = `<p class="field-note">Each share is that group's weight divided by the total (${total}). Shares are mixing weights in the approval formula, not voting rights.</p><div class="options-table-wrap"><table class="coalition-table"><thead><tr><th scope="col">Group</th><th scope="col">Weight</th><th scope="col">Share of total</th></tr></thead><tbody>${state.proposal.groups.map((group) => `<tr><th scope="row">${escapeHtml(group.name)}</th><td>${group.weight}</td><td>${Number.isFinite(group.weight) && group.weight > 0 ? `${((group.weight / total) * 100).toFixed(1)}%` : "Invalid"}</td></tr>`).join("")}</tbody></table></div>`;
}

function clauseMatchesFilter(clause, query) {
  if (query === "") return true;
  if (clause.title.toLowerCase().includes(query)) return true;
  return clause.options.some((option) => option.label.toLowerCase().includes(query));
}

function renderClauses() {
  const { groups } = state.proposal;
  const query = clauseFilter.trim().toLowerCase();
  const visible = state.proposal.clauses.filter((clause) => clauseMatchesFilter(clause, query));
  const status = $("#clause-filter-status");
  if (!visible.length) {
    const message = "No clauses match this filter. Clear the search to see every clause. Hidden cards still count in the model.";
    if (status) status.textContent = message;
    $("#clauses-editor").innerHTML = `<p class="empty-state">${message}</p>`;
    return;
  }
  if (status) status.textContent = query === "" ? "" : `Showing ${visible.length} of ${state.proposal.clauses.length} clauses. Hidden cards still count in the model.`;
  $("#clauses-editor").innerHTML = visible.map((clause, clauseIndex) => `
    <article class="clause-card" aria-label="${escapeHtml(clause.title)}">
      <div class="clause-top">
        <label><span class="visually-hidden">Clause title</span><input class="clause-title-input" data-field="clause-title" data-clause-id="${escapeHtml(clause.id)}" value="${escapeHtml(clause.title)}" maxlength="120" aria-label="Clause ${clauseIndex + 1} title"></label>
        <div class="clause-tools">
          <button class="text-button" type="button" data-action="move-clause" data-direction="up" data-clause-id="${escapeHtml(clause.id)}" ${state.proposal.clauses[0].id === clause.id ? "disabled" : ""}>Move up</button>
          <button class="text-button" type="button" data-action="move-clause" data-direction="down" data-clause-id="${escapeHtml(clause.id)}" ${state.proposal.clauses.at(-1).id === clause.id ? "disabled" : ""}>Move down</button>
          <button class="text-button" type="button" data-action="duplicate-clause" data-clause-id="${escapeHtml(clause.id)}" ${state.proposal.clauses.length >= MAX_CLAUSES ? "disabled" : ""}>Duplicate clause</button>
          <button class="text-button danger" type="button" data-action="remove-clause" data-clause-id="${escapeHtml(clause.id)}" ${state.proposal.clauses.length <= 1 ? "disabled" : ""}>Remove clause</button>
        </div>
      </div>
      <p class="clause-annotation">Cost is an explicit human estimate of disruption, scope expansion, or process burden. It is not a measure of merit.</p>
      <label class="clause-lock">Lock clause to an option
        <select data-field="clause-lock" data-clause-id="${escapeHtml(clause.id)}" aria-label="${escapeHtml(clause.title)} locked option">
          <option value="">No lock, search all options</option>
          ${clause.options.map((option) => `<option value="${escapeHtml(option.id)}" ${clause.lockedOptionId === option.id ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
        </select>
      </label>
      <label class="clause-note">Facilitator note (optional)
        <input data-field="clause-note" data-clause-id="${escapeHtml(clause.id)}" type="text" maxlength="240" value="${escapeHtml(clause.note ?? "")}" placeholder="Not used by the solver" aria-label="${escapeHtml(clause.title)} facilitator note">
      </label>
      <div class="options-table-wrap"><table class="options-table">
        <thead><tr><th scope="col">Option</th><th scope="col">Change cost</th>${groups.map((group) => `<th scope="col">${escapeHtml(group.name)}<br>support</th>`).join("")}<th scope="col"><span class="visually-hidden">Actions</span></th></tr></thead>
        <tbody>${clause.options.map((option) => `
          <tr>
            <td><input class="option-label-input" data-field="option-label" data-clause-id="${escapeHtml(clause.id)}" data-option-id="${escapeHtml(option.id)}" value="${escapeHtml(option.label)}" maxlength="240" aria-label="${escapeHtml(clause.title)}, ${escapeHtml(option.label)} label"><br>${option.original ? '<span class="original-marker">Original option</span>' : ""}</td>
            <td>${option.original ? '<span class="original-marker">0</span>' : `<input data-field="option-cost" data-clause-id="${escapeHtml(clause.id)}" data-option-id="${escapeHtml(option.id)}" type="number" min="0" max="1000000000" step="any" required value="${option.changeCost}" aria-label="${escapeHtml(option.label)} change cost">`}</td>
            ${groups.map((group) => `<td><input data-field="option-support" data-clause-id="${escapeHtml(clause.id)}" data-option-id="${escapeHtml(option.id)}" data-group-id="${escapeHtml(group.id)}" type="number" min="0" max="100" step="any" required value="${option.support[group.id]}" aria-label="${escapeHtml(option.label)}, ${escapeHtml(group.name)} support"></td>`).join("")}
            <td><div class="option-tools">${option.original ? "" : `<button class="text-button" type="button" data-action="try-option" data-clause-id="${escapeHtml(clause.id)}" data-option-id="${escapeHtml(option.id)}">Try this option</button>`}<button class="text-button" type="button" data-action="toggle-clause-lock" data-clause-id="${escapeHtml(clause.id)}" data-option-id="${escapeHtml(option.id)}">${clause.lockedOptionId === option.id ? "Unlock option" : "Lock this option"}</button>${option.original ? "" : `<button class="text-button" type="button" data-action="duplicate-option" data-clause-id="${escapeHtml(clause.id)}" data-option-id="${escapeHtml(option.id)}" ${clause.options.length >= MAX_OPTIONS_PER_CLAUSE ? "disabled" : ""}>Duplicate option</button>`}${option.original ? "" : `<button class="text-button danger" type="button" data-action="remove-option" data-clause-id="${escapeHtml(clause.id)}" data-option-id="${escapeHtml(option.id)}" ${clause.options.length <= 3 || clause.lockedOptionId === option.id ? "disabled" : ""}>Remove</button>`}${clause.lockedOptionId === option.id ? '<span class="original-marker">Locked</span>' : ""}</div></td>
          </tr>`).join("")}</tbody>
      </table></div>
      <button class="text-button add-alternative" type="button" data-action="add-option" data-clause-id="${escapeHtml(clause.id)}" ${clause.options.length >= MAX_OPTIONS_PER_CLAUSE ? "disabled" : ""}>Add alternative</button>
    </article>`).join("");
}

function renderBallot() {
  const proposal = state.proposal;
  $("#ballot-body").innerHTML = `<p><strong>${escapeHtml(proposal.title || "Untitled proposal")}</strong>. Threshold ${Number.isFinite(proposal.threshold) ? `${proposal.threshold}%` : "invalid"}.</p>${proposal.clauses.map((clause) => `<section class="ballot-clause"><h3>${escapeHtml(clause.title)}</h3>${clause.note ? `<p>Facilitator note: ${escapeHtml(clause.note)}</p>` : ""}<ul>${clause.options.map((option) => `<li><span class="ballot-box" aria-hidden="true"></span>${escapeHtml(option.label)}${option.original ? " (original)" : ""}${option.changeCost ? ` · cost ${option.changeCost}` : ""}</li>`).join("")}</ul></section>`).join("")}`;
}

function renderResults(result) {
  const { proposal } = state;
  renderAlternatives(result);
  renderManualPackage(result);
  renderStressTest(result);
  renderScenarioComparison(result);
  const alert = $("#result-alert");
  const meta = $("#search-meta");
  $("#export-button").disabled = result.status === "invalid";
  $("#csv-button").disabled = result.status === "invalid";
  $("#matrix-export-button").disabled = result.status === "invalid";
  $("#worksheet-button").disabled = result.status === "invalid";
  $("#worksheet-csv-button").disabled = result.status === "invalid";
  $("#share-button").disabled = result.status === "invalid";
  $("#constraint-checks").textContent = "Constraints have not been evaluated.";
  if (result.status === "too_large") {
    alert.textContent = `Search paused: more than ${MAX_COMBINATIONS.toLocaleString()} combinations. Reduce alternatives or clauses to evaluate every combination.`;
    meta.textContent = `More than ${MAX_COMBINATIONS.toLocaleString()} combinations`;
    $("#result-summary").innerHTML = emptyResults();
    $("#changed-clauses").innerHTML = '<p class="empty-state">No recommendation was evaluated.</p>';
    $("#support-shifts").innerHTML = "";
    $("#near-misses-list").innerHTML = '<p class="empty-state">Near misses are unavailable when the full search is over the safety bound.</p>';
    $("#clause-contribution").innerHTML = '<p class="empty-state">Clause contribution is unavailable when the full search is over the safety bound.</p>';
    $("#lock-preview").innerHTML = '<p class="empty-state">Option previews are unavailable when the full search is over the safety bound.</p>';
    $("#leave-one-out").innerHTML = '<p class="empty-state">Leave-one-group-out is unavailable when the full search is over the safety bound.</p>';
    $("#group-contribution").innerHTML = '<p class="empty-state">Group contribution is unavailable when the full search is over the safety bound.</p>';
    $("#side-by-side").innerHTML = '<p class="empty-state">Side-by-side comparison is unavailable when the full search is over the safety bound.</p>';
    drawCoalition(null, null);
    $("#coalition-table").innerHTML = '<p class="empty-state">No coalition values were evaluated.</p>';
    return;
  }
  if (result.status === "invalid") {
    alert.textContent = `Fix the proposal before searching: ${result.errors[0]}`;
    meta.textContent = "Waiting for valid inputs";
    $("#result-summary").innerHTML = emptyResults();
    $("#changed-clauses").innerHTML = '<p class="empty-state">No recommendation was evaluated.</p>';
    $("#support-shifts").innerHTML = "";
    $("#near-misses-list").innerHTML = '<p class="empty-state">Near misses are unavailable for invalid inputs.</p>';
    $("#clause-contribution").innerHTML = '<p class="empty-state">Clause contribution is unavailable for invalid inputs.</p>';
    $("#lock-preview").innerHTML = '<p class="empty-state">Option previews are unavailable for invalid inputs.</p>';
    $("#leave-one-out").innerHTML = '<p class="empty-state">Leave-one-group-out is unavailable for invalid inputs.</p>';
    $("#group-contribution").innerHTML = '<p class="empty-state">Group contribution is unavailable for invalid inputs.</p>';
    $("#side-by-side").innerHTML = '<p class="empty-state">Side-by-side comparison is unavailable for invalid inputs.</p>';
    drawCoalition(null, null);
    $("#coalition-table").innerHTML = '<p class="empty-state">No coalition values were evaluated.</p>';
    return;
  }
  meta.textContent = `${result.checkedCombinations.toLocaleString()} checked, ${result.possibleCombinations.toLocaleString()} lock-permitted combinations`;
  const agreement = result.agreement;
  const current = result.baseline;
  if (result.status === "already_passing") alert.textContent = "The original proposal crosses the threshold and meets every constraint. No clause change is recommended.";
  else if (result.status === "infeasible") alert.textContent = "No permitted combination meets both the threshold and every configured constraint. Review the constraint checks and near misses.";
  else alert.textContent = "A lowest-cost passing combination was found. It meets every configured constraint.";

  const closestMiss = result.nearMisses[0];
  const closestGap = closestMiss ? proposal.threshold - closestMiss.approval : null;
  const leftover = proposal.maxChangeCost === undefined || !agreement ? null : proposal.maxChangeCost - agreement.changeCost;
  $("#result-summary").innerHTML = agreement ? `
    <div class="metric"><span class="metric-label">Current approval</span><strong>${formatPercent(current.approval)}</strong></div>
    <div class="metric"><span class="metric-label">Recommended approval</span><strong>${formatPercent(agreement.approval)}</strong></div>
    <div class="metric"><span class="metric-label">Threshold margin</span><strong class="positive">${formatMargin(agreement.approval - proposal.threshold)}</strong></div>
    <div class="metric cost"><span class="metric-label">Total change cost</span><strong>${agreement.changeCost.toFixed(1)}</strong></div>
    ${leftover === null ? "" : `<div class="metric"><span class="metric-label">Budget remaining</span><strong class="${leftover + 1e-9 >= 0 ? "positive" : "negative"}">${leftover.toFixed(1)}</strong></div>`}` : `
    <div class="metric"><span class="metric-label">Current approval</span><strong>${formatPercent(current.approval)}</strong></div>
    <div class="metric cost"><span class="metric-label">Threshold</span><strong>${proposal.threshold}%</strong></div>
    <div class="metric cost"><span class="metric-label">Closest gap</span><strong>${closestGap === null ? "Not found" : closestGap.toFixed(1) + " points"}</strong></div>
    <div class="metric cost"><span class="metric-label">Best result</span><strong>Not found</strong></div>`;
  renderChanges(agreement, current);
  renderConstraints(result);
  renderNearMissExplorer(result);
  renderClauseContribution(result);
  renderLockPreview();
  renderLeaveOneOut(result);
  renderGroupContribution(result);
  renderSideBySide(result);
  drawCoalition(current, agreement);
  renderCoalitionTable(current, agreement);
}

function renderScenarioComparison(result) {
  const selected = $("#comparison-select").value;
  const row = selected === "" ? null : scenarios[Number(selected)];
  if (!row || result.status === "invalid") {
    $("#scenario-comparison").textContent = result.status === "invalid" ? "Fix the draft before comparing snapshots." : "Save a snapshot, then select it here to compare with the working draft.";
    return;
  }
  if (!savedResults.has(row.proposal)) savedResults.set(row.proposal, findSmallestAgreement(row.proposal));
  const previous = savedResults.get(row.proposal);
  const changes = compareScenarioInputs(row.proposal, state.proposal);
  const metric = (label, get) => '<tr><th scope="row">' + label + '</th><td>' + get(row.proposal, previous) + '</td><td>' + get(state.proposal, result) + '</td></tr>';
  const value = (input) => input === undefined ? 'Not set / absent' : escapeHtml(input);
  $("#scenario-comparison").innerHTML = '<p>Comparing <strong>' + escapeHtml(row.name) + '</strong> with the working draft. Changes to groups, weights, or clauses change what approval measures; review the assumptions before interpreting differences.</p><div class="options-table-wrap"><table class="coalition-table"><thead><tr><th scope="col">Metric</th><th scope="col">Saved snapshot</th><th scope="col">Working draft</th></tr></thead><tbody>' +
    metric('Search status', (_, evaluated) => escapeHtml(evaluated.status.replaceAll('_', ' '))) +
    metric('Threshold', (proposal) => formatPercent(proposal.threshold)) +
    metric('Recommended approval', (_, evaluated) => evaluated.agreement ? formatPercent(evaluated.agreement.approval) : 'No recommendation') +
    metric('Change cost', (_, evaluated) => evaluated.agreement ? evaluated.agreement.changeCost.toFixed(1) : 'No recommendation') +
    metric('Changed clauses', (_, evaluated) => evaluated.agreement ? evaluated.agreement.changedClauseCount : 'No recommendation') +
    '</tbody></table></div><details><summary>' + changes.length + ' changed input fields</summary>' + (changes.length ? '<ul>' + changes.slice(0, 100).map((change) => '<li><strong>' + escapeHtml(change.field) + '</strong>: ' + value(change.before) + ' → ' + value(change.after) + '</li>').join('') + '</ul>' + (changes.length > 100 ? '<p>Showing the first 100 changes. Export each scenario as JSON for the complete inputs.</p>' : '') : '<p>The saved and working assumptions match.</p>') + '</details>';
}
$("#comparison-select").addEventListener("change", () => renderScenarioComparison(currentResult()));

function renderStressTest(result) {
  const input = $("#support-drop");
  const slider = $("#support-drop-range");
  const drop = input.value === "" ? NaN : Number(input.value);
  if (Number.isFinite(drop)) {
    slider.value = Math.min(100, Math.max(0, drop));
    $("#support-drop-output").textContent = `${drop} points`;
  } else {
    $("#support-drop-output").textContent = "Invalid drop";
  }
  if (!result.agreement) {
    $("#stress-result").textContent = "A passing recommendation is needed before testing its resilience.";
    return;
  }
  const stressed = stressPackage(state.proposal, result.agreement.options.map((option) => option.id), drop);
  if (stressed.status === "invalid") {
    $("#stress-result").textContent = stressed.errors[0];
    return;
  }
  const summary = stressed.summary;
  const original = stressed.original;
  $("#stress-result").innerHTML = `<div class="result-summary"><div class="metric"><span class="metric-label">Entered approval</span><strong>${formatPercent(original.approval)}</strong></div><div class="metric"><span class="metric-label">Downside approval</span><strong>${formatPercent(summary.approval)}</strong></div><div class="metric"><span class="metric-label">Downside margin</span><strong class="${summary.approval + 1e-9 >= state.proposal.threshold ? "positive" : "negative"}">${formatMargin(summary.approval - state.proposal.threshold)}</strong></div><div class="metric cost"><span class="metric-label">Drop applied</span><strong>${drop} points</strong></div></div><p><strong>${stressed.status === "passing" ? "The same recommendation still passes this downside scenario." : "The recommendation fails this downside scenario."}</strong> Every score was reduced by ${drop} points and stopped at zero. This is not a probability of consent.</p><div class="options-table-wrap"><table class="coalition-table"><thead><tr><th scope="col">Group</th><th scope="col">Entered support</th><th scope="col">Downside support</th><th scope="col">Floor</th></tr></thead><tbody>${summary.byGroup.map((group, index) => {
    const floor = summary.constraints.floors.find((row) => row.id === group.id);
    return `<tr><th scope="row">${escapeHtml(group.name)}</th><td>${formatPercent(original.byGroup[index].approval)}</td><td>${formatPercent(group.approval)}</td><td>${floor ? `${floor.minimum}%: ${floor.met ? "met" : "not met"}` : "None"}</td></tr>`;
  }).join("")}</tbody></table></div>`;
}
$("#support-drop").addEventListener("input", () => renderStressTest(currentResult()));
$("#support-drop-range").addEventListener("input", (event) => {
  $("#support-drop").value = event.target.value;
  renderStressTest(currentResult());
});

function renderManualPackage(result) {
  const valid = result.status !== "invalid";
  $("#use-recommendation").disabled = !result.agreement;
  if (!valid) {
    $("#manual-options").innerHTML = "";
    $("#manual-result").textContent = "Fix the draft before comparing a custom package.";
    return;
  }
  for (const clause of state.proposal.clauses) {
    if (!clause.options.some((option) => option.id === manualSelection[clause.id])) manualSelection[clause.id] = clause.options.find((option) => option.original).id;
  }
  $("#manual-options").innerHTML = state.proposal.clauses.map((clause) => '<label>' + escapeHtml(clause.title) + '<select data-field="manual-option" data-clause-id="' + escapeHtml(clause.id) + '">' + clause.options.map((option) => '<option value="' + escapeHtml(option.id) + '" ' + (manualSelection[clause.id] === option.id ? 'selected' : '') + '>' + escapeHtml(option.label) + '</option>').join('') + '</select></label>').join('');
  const evaluated = evaluatePackage(state.proposal, state.proposal.clauses.map((clause) => manualSelection[clause.id]));
  const summary = evaluated.summary;
  const failures = [];
  if (summary.approval + 1e-9 < state.proposal.threshold) failures.push('Below the overall threshold');
  if (summary.constraints.budget && !summary.constraints.budget.met) failures.push('Over the cost budget');
  for (const floor of summary.constraints.floors) if (!floor.met) failures.push(escapeHtml(floor.name) + ' below its support floor');
  for (const veto of summary.constraints.vetoes ?? []) if (!veto.met) failures.push(escapeHtml(veto.name) + ' below its veto threshold');
  for (const lock of summary.constraints.locks) if (!lock.met) failures.push(escapeHtml(lock.clauseTitle) + ' does not use its locked option');
  $("#manual-result").innerHTML = '<p><strong>' + (evaluated.status === 'passing' ? 'Passes all configured requirements.' : 'Does not pass: ' + failures.join('; ') + '.') + '</strong></p><p>Approval ' + formatPercent(summary.approval) + '. Change cost ' + summary.changeCost.toFixed(1) + '. ' + summary.changedClauseCount + ' changed clauses.' + (result.agreement ? ' Cost difference from the recommendation: ' + (summary.changeCost - result.agreement.changeCost).toFixed(1) + '.' : '') + '</p><div class="options-table-wrap"><table class="coalition-table"><thead><tr><th scope="col">Group</th><th scope="col">Custom support</th><th scope="col">Change from original</th></tr></thead><tbody>' + summary.groupDeltas.map((group) => '<tr><th scope="row">' + escapeHtml(group.name) + '</th><td>' + formatPercent(group.after) + '</td><td>' + formatMargin(group.delta) + '</td></tr>').join('') + '</tbody></table></div>';
}

$("#use-recommendation").addEventListener("click", () => {
  const result = currentResult();
  if (!result.agreement) return;
  manualSelection = Object.fromEntries(state.proposal.clauses.map((clause, index) => [clause.id, result.agreement.options[index].id]));
  renderManualPackage(result);
  renderSideBySide(result);
});

function renderAlternatives(result) {
  const candidates = result.alternatives ?? [];
  if (!candidates.length) {
    $("#passing-alternatives").innerHTML = '<p class="empty-state">No passing packages available to compare. Review the inputs and constraints.</p>';
    return;
  }
  const rows = candidates.map((candidate, index) => {
    const packageLines = candidate.options.map((option, i) => {
      const clause = state.proposal.clauses[i];
      return `${escapeHtml(clause.title)}: ${escapeHtml(option.label)} <button class="text-button" type="button" data-action="try-option" data-clause-id="${escapeHtml(clause.id)}" data-option-id="${escapeHtml(option.id)}">Try this option</button>`;
    }).join("<br>");
    return `<tr><th scope="row">${index + 1}. ${packageLines}</th><td>${candidate.changeCost.toFixed(1)}</td><td>${formatPercent(candidate.approval)}</td><td>${formatPercent(Math.min(...candidate.byGroup.map((group) => group.approval)))}</td><td>${candidate.supportersLost.map((group) => escapeHtml(group.name)).join(", ") || "None"}</td></tr>`;
  }).join("");
  $("#passing-alternatives").innerHTML = `<p>${result.passingCombinations} passing combinations. Showing the first ${candidates.length} by lowest cost, fewest changes, higher approval, then option IDs. These are ranked choices, not a fairness ranking. Try this option locks one choice and re-solves the rest.</p><div class="options-table-wrap"><table class="coalition-table"><thead><tr><th scope="col">Rank and package</th><th scope="col">Cost</th><th scope="col">Approval</th><th scope="col">Lowest group support</th><th scope="col">Groups losing support</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderLockPreview() {
  const target = $("#lock-preview");
  if (!lockPreview) {
    target.innerHTML = '<p class="empty-state">Choose Try this option on an alternative to preview a lock. The draft does not change until you apply it.</p>';
    return;
  }
  if (lockPreview.status !== "preview") {
    target.innerHTML = `<p>Preview failed: ${escapeHtml(lockPreview.errors?.[0] ?? "the option could not be locked.")}</p>`;
    return;
  }
  const previewResult = lockPreview.result;
  const agreement = previewResult.agreement;
  const packageText = agreement
    ? agreement.options.map((option, index) => `${escapeHtml(lockPreview.proposal.clauses[index].title)}: ${escapeHtml(option.label)}`).join("; ")
    : "No passing package was found with this lock.";
  const statusText = previewResult.status === "found" || previewResult.status === "already_passing"
    ? `Preview status: ${previewResult.status.replaceAll("_", " ")}. Approval ${formatPercent(agreement.approval)}. Cost ${agreement.changeCost.toFixed(1)}.`
    : `Preview status: ${previewResult.status.replaceAll("_", " ")}.`;
  target.innerHTML = `<p>Lock <strong>${escapeHtml(lockPreview.clauseTitle)}</strong> to <strong>${escapeHtml(lockPreview.optionLabel)}</strong> and keep every other current lock.</p><p>${statusText}</p><p>${packageText}</p><p>This is a preview of the solver under that lock. It is not a decision.</p><div class="scenario-actions"><button class="button button-brick" type="button" data-action="apply-lock-preview">Apply lock</button> <button class="button button-secondary" type="button" data-action="dismiss-lock-preview">Dismiss preview</button></div>`;
}

function renderLeaveOneOut(result) {
  const packageOptions = result.agreement?.options ?? result.baseline?.options;
  if (!packageOptions) {
    $("#leave-one-out").innerHTML = '<p class="empty-state">Leave-one-group-out needs a valid package to inspect.</p>';
    return;
  }
  const table = leaveOneGroupOut(state.proposal, packageOptions);
  if (table.status !== "ok") {
    $("#leave-one-out").innerHTML = `<p class="empty-state">${escapeHtml(table.errors[0])}</p>`;
    return;
  }
  const source = result.agreement ? "recommended package" : "original package";
  $("#leave-one-out").innerHTML = `<p>Inspecting the ${source}. Full weighted approval ${formatPercent(table.fullApproval)}.</p><div class="options-table-wrap"><table class="coalition-table"><thead><tr><th scope="col">Omitted group</th><th scope="col">Weight</th><th scope="col">Approval without the group</th><th scope="col">Change from full approval</th></tr></thead><tbody>${table.rows.map((row) => `<tr><th scope="row">${escapeHtml(row.name)}</th><td>${row.weight}</td><td>${row.approval == null ? "Not defined with one group" : formatPercent(row.approval)}</td><td class="${row.delta > 0.0001 ? "positive" : row.delta < -0.0001 ? "negative" : ""}">${row.delta == null ? "Not defined" : formatMargin(row.delta)}</td></tr>`).join("")}</tbody></table></div>`;
}

function renderGroupContribution(result) {
  const packageOptions = result.agreement?.options ?? result.baseline?.options;
  if (!packageOptions) {
    $("#group-contribution").innerHTML = '<p class="empty-state">Group contribution needs a valid package to inspect.</p>';
    return;
  }
  const analysis = groupContributions(state.proposal, packageOptions);
  if (analysis.status !== "ok") {
    $("#group-contribution").innerHTML = `<p class="empty-state">${escapeHtml(analysis.errors[0])}</p>`;
    return;
  }
  const source = result.agreement ? "recommended package" : "original package";
  $("#group-contribution").innerHTML = `<p>Inspecting the ${source}. Overall approval ${formatPercent(analysis.overallApproval)}. Original ${formatPercent(analysis.originalApproval)}. Method: weight share times group average. Pulls sum to the change in overall approval.</p><div class="options-table-wrap"><table class="coalition-table"><thead><tr><th scope="col">Group</th><th scope="col">Weight share</th><th scope="col">Selected support</th><th scope="col">Original support</th><th scope="col">Contribution</th><th scope="col">Pull on overall approval</th></tr></thead><tbody>${analysis.rows.map((row) => `<tr><th scope="row">${escapeHtml(row.name)}</th><td>${(row.share * 100).toFixed(1)}%</td><td>${formatPercent(row.selectedApproval)}</td><td>${formatPercent(row.originalApproval)}</td><td>${formatPercent(row.contribution)}</td><td class="${row.overallPull > 0.0001 ? "positive" : row.overallPull < -0.0001 ? "negative" : ""}">${formatMargin(row.overallPull)}</td></tr>`).join("")}</tbody></table></div>`;
}

function customOptionIds() {
  return state.proposal.clauses.map((clause) => {
    if (clause.options.some((option) => option.id === manualSelection[clause.id])) return manualSelection[clause.id];
    return clause.options.find((option) => option.original)?.id;
  });
}

function choiceCell(choice, note = "") {
  if (!choice) return "Not set";
  return `${escapeHtml(choice.label)}<br><small>Cost ${choice.changeCost.toFixed(1)}${note}</small>`;
}

function renderSideBySide(result) {
  const current = result.baseline;
  if (!current) {
    $("#side-by-side").innerHTML = '<p class="empty-state">Side-by-side comparison needs a valid original package.</p>';
    return;
  }
  const recommendedIds = result.agreement ? result.agreement.options.map((option) => option.id) : null;
  const comparison = comparePinnedPackages(state.proposal, recommendedIds, customOptionIds());
  if (comparison.status !== "ok") {
    $("#side-by-side").innerHTML = `<p class="empty-state">${escapeHtml(comparison.errors[0])}</p>`;
    return;
  }
  const clauseRows = comparison.clauses.map((row) => {
    const changed = row.recommended && row.recommended.optionId !== row.original.optionId;
    const customNote = row.custom && row.custom.optionId !== row.original.optionId ? " (custom)" : "";
    return `<tr><th scope="row">${escapeHtml(row.clauseTitle)}</th><td>${choiceCell(row.original)}</td><td>${row.recommended ? choiceCell(row.recommended, changed ? " (changed)" : "") : "No recommendation"}</td><td>${choiceCell(row.custom, customNote)}</td></tr>`;
  }).join("");
  const groupRows = comparison.groups.map((group) => `<tr><th scope="row">${escapeHtml(group.name)}</th><td>${formatPercent(group.original)}</td><td>${group.recommended == null ? "No recommendation" : formatPercent(group.recommended)}</td><td>${formatPercent(group.custom)}</td></tr>`).join("");
  const recommendedLock = recommendedIds ? `<p>${lockPackageButton(recommendedIds, "Lock recommended package")} Applying locks is one draft edit, so undo restores the previous locks. Locked search still reports a deliberation aid, not a decision.</p>` : "";
  $("#side-by-side").innerHTML = `<p>Original overall approval ${formatPercent(comparison.originalApproval)}. Recommended ${comparison.recommendedApproval == null ? "not found" : formatPercent(comparison.recommendedApproval)}. Custom ${formatPercent(comparison.customApproval)}. Original cost ${comparison.originalCost.toFixed(1)}. Recommended cost ${comparison.recommendedCost == null ? "not found" : comparison.recommendedCost.toFixed(1)}. Custom cost ${comparison.customCost.toFixed(1)}.</p>${recommendedLock}<div class="options-table-wrap"><table class="coalition-table"><thead><tr><th scope="col">Clause</th><th scope="col">Current original</th><th scope="col">Solver recommendation</th><th scope="col">Custom package</th></tr></thead><tbody>${clauseRows}</tbody></table></div><div class="options-table-wrap"><table class="coalition-table"><thead><tr><th scope="col">Group</th><th scope="col">Current approval</th><th scope="col">Recommended approval</th><th scope="col">Custom approval</th></tr></thead><tbody>${groupRows}</tbody></table></div>`;
}

function renderConstraints(result) {
  const checks = result.agreement?.constraints ?? result.baseline.constraints;
  const rows = [];
  const mark = (met) => met ? "Met" : "Not met";
  if (checks.budget) rows.push(`<tr><th scope="row">Total change cost</th><td>At most ${checks.budget.maximum}</td><td>${checks.budget.actual}</td><td>${mark(checks.budget.met)}</td></tr>`);
  for (const floor of checks.floors) rows.push(`<tr><th scope="row">${escapeHtml(floor.name)} support</th><td>At least ${floor.minimum}%</td><td>${formatPercent(floor.actual)}</td><td>${mark(floor.met)}</td></tr>`);
  for (const veto of checks.vetoes ?? []) rows.push(`<tr><th scope="row">${escapeHtml(veto.name)} veto</th><td>At least ${veto.required}%</td><td>${formatPercent(veto.actual)}</td><td>${mark(veto.met)}</td></tr>`);
  for (const lock of checks.locks) rows.push(`<tr><th scope="row">${escapeHtml(lock.clauseTitle)}</th><td>${escapeHtml(lock.label)}</td><td>Locked option</td><td>${mark(lock.met)}</td></tr>`);
  const inspected = result.agreement ? "Recommended combination" : "Original proposal, no recommendation found";
  const counts = result.checkedCombinations === 1 && result.status === "already_passing" ? "The original proposal meets every requirement with zero changes. No further enumeration is needed." : `${result.eligibleCombinations.toLocaleString()} combinations meet all constraints. ${result.rejected.anyConstraint.toLocaleString()} rejected: ${result.rejected.budget.toLocaleString()} over budget, ${result.rejected.floors.toLocaleString()} below a group floor, and ${result.rejected.vetoes.toLocaleString()} below a veto. These counts can overlap. Locks exclude other options before enumeration.`;
  $("#constraint-checks").innerHTML = `<p>${counts}</p>${rows.length ? `<p>${inspected}</p><div class="options-table-wrap"><table class="coalition-table"><thead><tr><th scope="col">Constraint</th><th scope="col">Required</th><th scope="col">Actual</th><th scope="col">Status</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>` : '<p>No group floors, vetoes, budget, or clause locks set.</p>'}`;
}

function emptyResults() {
  return '<div class="metric"><span class="metric-label">Current approval</span><strong>Not evaluated</strong></div><div class="metric"><span class="metric-label">Recommended approval</span><strong>Not evaluated</strong></div><div class="metric cost"><span class="metric-label">Total change cost</span><strong>Not evaluated</strong></div>';
}

function renderChanges(agreement, current) {
  const changes = $("#changed-clauses");
  const shifts = $("#support-shifts");
  if (!agreement) {
    changes.innerHTML = '<p class="empty-state">No passing combination was found.</p>';
    shifts.innerHTML = "";
    return;
  }
  changes.innerHTML = agreement.changes.length ? agreement.changes.map((change) => `<div class="change-item"><strong>${escapeHtml(change.clauseTitle)}</strong><span>${escapeHtml(change.from)} to ${escapeHtml(change.to)}. Cost ${change.changeCost.toFixed(1)}.</span></div>`).join("") : '<p class="empty-state">Keep every original option.</p>';
  const deltas = agreement.groupDeltas.filter((group) => Math.abs(group.delta) > 0.0001);
  shifts.innerHTML = deltas.length ? deltas.map((group) => `<div class="shift-item"><strong>${escapeHtml(group.name)}</strong> <span class="${group.delta > 0 ? "positive" : "negative"}">${group.delta > 0 ? "+" : ""}${group.delta.toFixed(1)} points</span><br><span>${formatPercent(group.before)} to ${formatPercent(group.after)}</span></div>`).join("") : '<p class="empty-state">No group support changes.</p>';
}

function lockPackageButton(optionIds, label) {
  if (!Array.isArray(optionIds) || !optionIds.length) return "";
  return ` <button class="text-button" type="button" data-action="lock-package" data-option-ids="${escapeHtml(optionIds.join("|"))}">${escapeHtml(label)}</button>`;
}

function packageGapRow(row, kind) {
  const gap = row.approvalGap;
  const approvalNote = row.meetsThreshold
    ? `Over the threshold by ${(-gap).toFixed(1)} points.`
    : `Short of the threshold by ${gap.toFixed(1)} points.`;
  const costNote = row.costVsRecommended == null
    ? `Cost ${row.changeCost.toFixed(1)}.`
    : row.costVsRecommended === 0
      ? `Same cost as the recommendation (${row.changeCost.toFixed(1)}).`
      : row.costVsRecommended < 0
        ? `Costs ${(-row.costVsRecommended).toFixed(1)} less than the recommendation (cost ${row.changeCost.toFixed(1)}).`
        : `Costs ${row.costVsRecommended.toFixed(1)} more than the recommendation (cost ${row.changeCost.toFixed(1)}).`;
  return `<div class="miss-item"><span class="miss-score">${formatPercent(row.approval)}</span><span>${escapeHtml(row.labels)}<br><small>${escapeHtml(kind)} ${approvalNote} ${costNote}</small>${lockPackageButton(row.optionIds, "Lock this package")}</span></div>`;
}

function orderedGapRows(rows) {
  const sorted = sortPackageGapRows(rows, nearMissSort);
  return sorted.status === "ok" ? sorted.rows : rows;
}

function renderNearMissExplorer(result) {
  const gaps = explorePackageGaps(state.proposal, result);
  if (gaps.status !== "ok") {
    $("#near-misses-list").innerHTML = '<p class="empty-state">Near-miss comparison is unavailable for this search result.</p>';
    return;
  }
  const cheaperMisses = orderedGapRows(gaps.cheaperMisses);
  const closestMisses = orderedGapRows(gaps.closestMisses);
  const parts = [];
  if (cheaperMisses.length) {
    parts.push("<h4>Cheaper packages that miss the threshold</h4>");
    parts.push("<p>These combinations cost less than the recommended package and remain below the threshold. They are not adoptable under the current rules.</p>");
    parts.push(cheaperMisses.map((row) => packageGapRow(row, "Cheaper miss.")).join(""));
  } else {
    parts.push('<p class="empty-state">No cheaper constraint-compliant package in the near-miss list falls below the threshold.</p>');
  }
  if (closestMisses.length) {
    parts.push("<h4>Closest misses</h4>");
    parts.push("<p>Ranked by the selected sort among constraint-compliant combinations that miss the threshold. Sorting changes display order only; the solver still keeps the closest misses.</p>");
    parts.push(closestMisses.map((row) => packageGapRow(row, "Closest miss.")).join(""));
  }
  if (gaps.nextOverThreshold.length) {
    parts.push("<h4>Next packages over the threshold</h4>");
    parts.push("<p>These passing combinations come after the lowest-cost recommendation. Extra cost buys a different package, not a fairer one.</p>");
    parts.push(gaps.nextOverThreshold.map((row) => packageGapRow(row, "Next passing package.")).join(""));
  } else {
    parts.push('<p class="empty-state">No later passing package is available to compare.</p>');
  }
  $("#near-misses-list").innerHTML = parts.join("");
}

function contributionBarSvg(rows) {
  const width = 420;
  const rowHeight = 32;
  const height = Math.max(rowHeight * rows.length + 8, 40);
  const mid = 285;
  const maxAbs = Math.max(5, ...rows.map((row) => Math.abs(row.overallPull)));
  const scale = 120 / maxAbs;
  const bars = rows.map((row, index) => {
    const y = 10 + index * rowHeight;
    const pull = row.overallPull;
    const barWidth = Math.abs(pull) * scale;
    const x = pull >= 0 ? mid : mid - barWidth;
    const fill = Math.abs(pull) < 1e-9 ? "#9c907d" : pull > 0 ? "#286842" : "#a64431";
    return `<text x="8" y="${y + 12}" fill="#19352d" font-size="11">${escapeHtml(row.clauseTitle.slice(0, 24))}</text><rect x="${x.toFixed(1)}" y="${y}" width="${Math.max(barWidth, 1).toFixed(1)}" height="14" fill="${fill}"></rect>`;
  }).join("");
  return `<svg class="contribution-chart" viewBox="0 0 ${width} ${height}" width="100%" height="${height}" role="img" aria-label="Clause contribution to overall approval versus the original options">${bars}<line x1="${mid}" y1="0" x2="${mid}" y2="${height}" stroke="#9c907d" stroke-width="1"></line></svg>`;
}

function renderClauseContribution(result) {
  const packageOptions = result.agreement?.options ?? result.baseline?.options;
  if (!packageOptions) {
    $("#clause-contribution").innerHTML = '<p class="empty-state">Clause contribution needs a valid package to inspect.</p>';
    return;
  }
  const analysis = clauseContributions(state.proposal, packageOptions);
  if (analysis.status !== "ok") {
    $("#clause-contribution").innerHTML = `<p class="empty-state">${escapeHtml(analysis.errors[0])}</p>`;
    return;
  }
  const source = result.agreement ? "recommended package" : "original package";
  $("#clause-contribution").innerHTML = `<p>Inspecting the ${source}. Overall approval ${formatPercent(analysis.overallApproval)}. Original ${formatPercent(analysis.originalApproval)}. Green bars raise overall approval versus the original options; brick bars lower it. The zero line is no change from the original wording.</p>${contributionBarSvg(analysis.rows)}<div class="options-table-wrap"><table class="coalition-table"><thead><tr><th scope="col">Clause</th><th scope="col">Selected option</th><th scope="col">Clause support</th><th scope="col">Original support</th><th scope="col">Pull on overall approval</th></tr></thead><tbody>${analysis.rows.map((row) => `<tr><th scope="row">${escapeHtml(row.clauseTitle)}</th><td>${escapeHtml(row.optionLabel)}</td><td>${formatPercent(row.selectedSupport)}</td><td>${formatPercent(row.originalSupport)}</td><td class="${row.overallPull > 0.0001 ? "positive" : row.overallPull < -0.0001 ? "negative" : ""}">${formatMargin(row.overallPull)}</td></tr>`).join("")}</tbody></table></div>`;
}

function drawCoalition(current, agreement) {
  const canvas = $("#coalition-canvas");
  const context = canvas.getContext("2d");
  if (!context) return;
  const width = Math.max(280, Math.floor(canvas.clientWidth));
  const rows = current?.byGroup ?? [];
  const height = Math.max(190, 24 + rows.length * 34);
  const ratio = window.devicePixelRatio || 1;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#fffdf7";
  context.fillRect(0, 0, width, height);
  if (!current) return;

  const labelWidth = Math.min(130, width * .34);
  const barStart = labelWidth + 8;
  const barWidth = Math.max(55, width - barStart - 35);
  const rowHeight = Math.max(30, Math.min(42, (height - 16) / rows.length));
  context.font = "12px Georgia";
  context.textBaseline = "middle";
  rows.forEach((group, index) => {
    const y = 12 + index * rowHeight;
    context.fillStyle = "#19352d";
    context.fillText(group.name.slice(0, 18), 8, y + 10);
    context.fillStyle = "#e8dfd0";
    context.fillRect(barStart, y, barWidth, 8);
    context.fillStyle = "#3778a6";
    context.fillRect(barStart, y, barWidth * (group.approval / 100), 8);
    if (agreement) {
      const next = agreement.byGroup[index].approval;
      context.fillStyle = "#a64431";
      context.fillRect(barStart, y + 11, barWidth * (next / 100), 8);
      context.fillStyle = "#466054";
      context.fillText(`${group.approval.toFixed(0)} / ${next.toFixed(0)}`, barStart + barWidth + 5, y + 10);
    } else {
      context.fillStyle = "#466054";
      context.fillText(`${group.approval.toFixed(0)}`, barStart + barWidth + 5, y + 5);
    }
  });
}

function renderCoalitionTable(current, agreement) {
  if (!current) return;
  $("#coalition-table").innerHTML = `<table class="coalition-table"><thead><tr><th scope="col">Group</th><th scope="col">Weight</th><th scope="col">Current</th><th scope="col">Recommended</th></tr></thead><tbody>${current.byGroup.map((group, index) => `<tr><th scope="row">${escapeHtml(group.name)}</th><td>${group.weight}</td><td>${formatPercent(group.approval)}</td><td>${agreement ? formatPercent(agreement.byGroup[index].approval) : "Not found"}</td></tr>`).join("")}</tbody></table>`;
}

function groupById(id) { return state.proposal.groups.find((group) => group.id === id); }
function clauseById(id) { return state.proposal.clauses.find((clause) => clause.id === id); }
function optionById(clause, id) { return clause?.options.find((option) => option.id === id); }

function changeAndRender(mutator) {
  const active = document.activeElement;
  const context = active?.dataset;
  mutator();
  save();
  render();
  if (!context?.action) return;
  let selector;
  if (context.action === "add-group") selector = '[data-field="group-name"][data-group-id="' + state.proposal.groups.at(-1).id + '"]';
  if (context.action === "add-clause") selector = '[data-field="clause-title"][data-clause-id="' + state.proposal.clauses.at(-1).id + '"]';
  if (context.action === "add-option" || context.action === "duplicate-option") selector = '[data-field="option-label"][data-clause-id="' + context.clauseId + '"][data-option-id="' + clauseById(context.clauseId).options.at(-1).id + '"]';
  if (context.action === "remove-group") selector = '[data-action="add-group"]';
  if (context.action === "duplicate-group") {
    const sourceIndex = state.proposal.groups.findIndex((group) => group.id === context.groupId);
    const copy = state.proposal.groups[sourceIndex + 1];
    if (copy) selector = '[data-field="group-name"][data-group-id="' + copy.id + '"]';
  }
  if (context.action === "remove-clause") selector = '[data-action="add-clause"]';
  if (context.action === "duplicate-clause") {
    const sourceIndex = state.proposal.clauses.findIndex((clause) => clause.id === context.clauseId);
    const copy = state.proposal.clauses[sourceIndex + 1];
    if (copy) selector = '[data-field="clause-title"][data-clause-id="' + copy.id + '"]';
  }
  if (context.action === "move-clause") selector = '[data-field="clause-title"][data-clause-id="' + context.clauseId + '"]';
  if (context.action === "remove-option") selector = '[data-action="add-option"][data-clause-id="' + context.clauseId + '"]';
  if (selector) $(selector)?.focus();
}

document.addEventListener("input", (event) => {
  const target = event.target;
  const field = target.dataset.field;
  if (!field) return;
  if (field === "clause-lock" || field === "manual-option" || field === "group-veto") return;
  if (field === "group-floor") {
    const group = groupById(target.dataset.groupId);
    if (target.value === "" && !target.validity.badInput) delete group.minSupport;
    else group.minSupport = target.valueAsNumber;
  }
  if (field === "group-name") groupById(target.dataset.groupId).name = target.value;
  if (field === "group-weight") groupById(target.dataset.groupId).weight = target.valueAsNumber;
  if (field === "clause-title") clauseById(target.dataset.clauseId).title = target.value;
  if (field === "clause-note") {
    const clause = clauseById(target.dataset.clauseId);
    if (target.value === "") delete clause.note;
    else clause.note = target.value;
  }
  if (field === "option-label") optionById(clauseById(target.dataset.clauseId), target.dataset.optionId).label = target.value;
  if (field === "option-label") {
    const select = [...document.querySelectorAll('[data-field="clause-lock"]')].find((element) => element.dataset.clauseId === target.dataset.clauseId);
    const choice = [...select.options].find((element) => element.value === target.dataset.optionId);
    choice.textContent = target.value || "Untitled option";
  }
  if (field === "option-cost") optionById(clauseById(target.dataset.clauseId), target.dataset.optionId).changeCost = target.valueAsNumber;
  if (field === "option-support") optionById(clauseById(target.dataset.clauseId), target.dataset.optionId).support[target.dataset.groupId] = target.valueAsNumber;
  target.setAttribute?.("aria-invalid", String(!target.validity.valid));
  save();
  $("#proposal-heading").textContent = state.proposal.title;
  $("#autosave-status").textContent = state.saveMessage;
  renderBallot();
  renderResults(currentResult());
});

$("#clause-filter").addEventListener("input", (event) => {
  clauseFilter = event.target.value;
  renderClauses();
});
$("#near-miss-sort").addEventListener("change", (event) => {
  nearMissSort = event.target.value === "change_cost" ? "change_cost" : "approval_gap";
  renderNearMissExplorer(currentResult());
});

$("#proposal-title").addEventListener("input", (event) => {
  state.proposal.title = event.target.value;
  save();
  $("#proposal-heading").textContent = state.proposal.title;
  $("#autosave-status").textContent = state.saveMessage;
  renderResults(currentResult());
});
$("#threshold").addEventListener("input", (event) => {
  state.proposal.threshold = Math.min(100, Math.max(0, number(event.target.value)));
  save();
  $("#threshold-output").textContent = `${state.proposal.threshold}%`;
  $("#threshold-number").value = state.proposal.threshold;
  $("#autosave-status").textContent = state.saveMessage;
  renderResults(currentResult());
});
$("#threshold-number").addEventListener("input", (event) => {
  state.proposal.threshold = event.target.valueAsNumber;
  save();
  $("#threshold").value = Number.isFinite(state.proposal.threshold) ? state.proposal.threshold : 0;
  $("#threshold-output").textContent = Number.isFinite(state.proposal.threshold) ? state.proposal.threshold + '%' : 'Invalid';
  $("#autosave-status").textContent = state.saveMessage;
  renderResults(currentResult());
});
$("#max-change-cost").addEventListener("input", (event) => {
  const target = event.target;
  if (target.value === "" && !target.validity.badInput) delete state.proposal.maxChangeCost;
  else state.proposal.maxChangeCost = target.valueAsNumber;
  save();
  $("#autosave-status").textContent = state.saveMessage;
  renderResults(currentResult());
});
document.addEventListener("change", (event) => {
  const target = event.target;
  if (target.dataset.field === "group-veto") {
    const group = groupById(target.dataset.groupId);
    if (target.checked) group.veto = true;
    else delete group.veto;
    save();
    $("#autosave-status").textContent = state.saveMessage;
    renderResults(currentResult());
    return;
  }
  if (target.dataset.field === "manual-option") {
    manualSelection[target.dataset.clauseId] = target.value;
    const result = currentResult();
    renderManualPackage(result);
    renderSideBySide(result);
    [...document.querySelectorAll('[data-field="manual-option"]')].find((element) => element.dataset.clauseId === target.dataset.clauseId)?.focus();
    return;
  }
  if (target.dataset.field !== "clause-lock") return;
  changeAndRender(() => {
    const clause = clauseById(target.dataset.clauseId);
    if (target.value === "") delete clause.lockedOptionId;
    else clause.lockedOptionId = target.value;
  });
  const restored = [...document.querySelectorAll('[data-field="clause-lock"]')].find((element) => element.dataset.clauseId === target.dataset.clauseId);
  restored?.focus();
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button || button.disabled) return;
  const action = button.dataset.action;
  if (action === "try-option") {
    lockPreview = previewLockedOption(state.proposal, button.dataset.clauseId, button.dataset.optionId, { maxCombinations: MAX_COMBINATIONS, alternativesLimit: 5 });
    renderLockPreview();
    $("#lock-preview-heading").focus?.();
    return;
  }
  if (action === "lock-package") {
    const optionIds = typeof button.dataset.optionIds === "string" && button.dataset.optionIds
      ? button.dataset.optionIds.split("|")
      : [];
    const locked = lockPackage(state.proposal, optionIds);
    if (locked.status !== "ok") {
      notifyDraft(`Could not lock that package: ${locked.errors[0]}`);
      return;
    }
    changeAndRender(() => { state.proposal = locked.proposal; });
    notifyDraft("Locked every clause to that package. Undo restores the previous draft.");
    return;
  }
  if (action === "clear-locks") {
    const cleared = clearAllLocks(state.proposal);
    if (cleared.status !== "ok") {
      notifyDraft(`Could not clear locks: ${cleared.errors[0]}`);
      return;
    }
    if (cleared.cleared === 0) {
      notifyDraft("No clause locks were set.");
      return;
    }
    changeAndRender(() => { state.proposal = cleared.proposal; });
    notifyDraft("Cleared every clause lock. Undo restores the previous draft.");
    return;
  }
  if (action === "toggle-clause-lock") {
    const toggled = toggleClauseLock(state.proposal, button.dataset.clauseId, button.dataset.optionId);
    if (toggled.status !== "ok") {
      notifyDraft(`Could not toggle that lock: ${toggled.errors[0]}`);
      return;
    }
    changeAndRender(() => { state.proposal = toggled.proposal; });
    notifyDraft(toggled.locked
      ? "Locked that clause to the selected option. Undo restores the previous draft."
      : "Unlocked that clause. Undo restores the previous draft.");
    return;
  }
  if (action === "dismiss-lock-preview") {
    lockPreview = null;
    renderLockPreview();
    return;
  }
  if (action === "apply-lock-preview") {
    if (!lockPreview || lockPreview.status !== "preview") return;
    const clauseId = lockPreview.clauseId;
    const optionId = lockPreview.optionId;
    lockPreview = null;
    changeAndRender(() => {
      const clause = clauseById(clauseId);
      if (clause) clause.lockedOptionId = optionId;
    });
    notifyDraft("Locked " + clauseById(clauseId).title + ". Undo restores the previous draft.");
    return;
  }
  if (action === "add-group") changeAndRender(() => {
    const group = { id: makeId("group"), name: "New group", weight: 1 };
    state.proposal.groups.push(group);
    state.proposal.clauses.forEach((clause) => clause.options.forEach((option) => { option.support[group.id] = 50; }));
  });
  if (action === "remove-group") changeAndRender(() => {
    const id = button.dataset.groupId;
    state.proposal.groups = state.proposal.groups.filter((group) => group.id !== id);
    state.proposal.clauses.forEach((clause) => clause.options.forEach((option) => { delete option.support[id]; }));
  });
  if (action === "duplicate-group") changeAndRender(() => {
    const duplicated = duplicateParticipantGroup(state.proposal, button.dataset.groupId);
    if (duplicated.status === "ok") state.proposal = duplicated.proposal;
  });
  if (action === "add-clause") changeAndRender(() => {
    const support = defaultSupport(state.proposal.groups);
    state.proposal.clauses.push({ id: makeId("clause"), title: "New clause", options: [
      { id: makeId("original"), original: true, label: "Keep the current wording", changeCost: 0, support: { ...support } },
      { id: makeId("alternative"), original: false, label: "Add a first structured alternative", changeCost: 1, support: { ...support } },
      { id: makeId("alternative"), original: false, label: "Add a second structured alternative", changeCost: 2, support: { ...support } },
    ] });
  });
  if (action === "remove-clause") changeAndRender(() => { state.proposal.clauses = state.proposal.clauses.filter((clause) => clause.id !== button.dataset.clauseId); });
  if (action === "move-clause") changeAndRender(() => {
    const index = state.proposal.clauses.findIndex((clause) => clause.id === button.dataset.clauseId);
    const offset = button.dataset.direction === "up" ? -1 : 1;
    const target = index + offset;
    if (index < 0 || target < 0 || target >= state.proposal.clauses.length) return;
    const [row] = state.proposal.clauses.splice(index, 1);
    state.proposal.clauses.splice(target, 0, row);
  });
  if (action === "duplicate-clause") changeAndRender(() => {
    if (state.proposal.clauses.length >= MAX_CLAUSES) return;
    const source = clauseById(button.dataset.clauseId);
    if (!source) return;
    const copy = {
      id: makeId("clause"),
      title: source.title.length + 7 > 120 ? `${source.title.slice(0, 113)} (copy)` : `${source.title} (copy)`,
      ...(source.note ? { note: source.note } : {}),
      options: source.options.map((option) => ({
        id: makeId(option.original ? "original" : "alternative"),
        label: option.label,
        original: option.original === true,
        changeCost: option.changeCost,
        support: { ...option.support },
      })),
    };
    if (source.lockedOptionId) {
      const lockedIndex = source.options.findIndex((option) => option.id === source.lockedOptionId);
      if (lockedIndex >= 0) copy.lockedOptionId = copy.options[lockedIndex].id;
    }
    const sourceIndex = state.proposal.clauses.findIndex((clause) => clause.id === source.id);
    state.proposal.clauses.splice(sourceIndex + 1, 0, copy);
  });
  if (action === "add-option") changeAndRender(() => {
    const clause = clauseById(button.dataset.clauseId);
    clause.options.push({ id: makeId("alternative"), original: false, label: "New alternative", changeCost: 1, support: { ...defaultSupport(state.proposal.groups) } });
  });
  if (action === "duplicate-option") changeAndRender(() => {
    const clause = clauseById(button.dataset.clauseId);
    if (!clause || clause.options.length >= MAX_OPTIONS_PER_CLAUSE) return;
    const source = optionById(clause, button.dataset.optionId);
    if (!source || source.original === true) return;
    clause.options.push({
      id: makeId("alternative"),
      original: false,
      label: source.label.length + 7 > 240 ? `${source.label.slice(0, 233)} (copy)` : `${source.label} (copy)`,
      changeCost: source.changeCost,
      support: { ...source.support },
    });
  });
  if (action === "remove-option") changeAndRender(() => {
    const clause = clauseById(button.dataset.clauseId);
    if (clause.lockedOptionId === button.dataset.optionId) return;
    clause.options = clause.options.filter((option) => option.id !== button.dataset.optionId);
  });
});

function loadScenarios() {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    libraryRaw = raw;
    if (raw === null) return [];
    if (raw.length > 5_000_000) throw new Error("Library exceeds its storage bound.");
    const rows = JSON.parse(raw);
    if (!Array.isArray(rows) || rows.length > MAX_SCENARIOS) throw new Error("Invalid library.");
    return rows.map((row) => {
      if (!row || typeof row.name !== "string" || !row.name.trim() || row.name.length > 120) throw new Error("Invalid scenario name.");
      return { name: row.name, proposal: canonicalProposal(row.proposal) };
    });
  } catch {
    libraryBlocked = true;
    return [];
  }
}

function notifyDraft(message) {
  state.saveMessage = message;
  $("#autosave-status").textContent = message;
}

function renderScenarios() {
  const select = $("#scenario-select");
  const selected = select.value;
  select.innerHTML = '<option value="">Choose a saved scenario</option>' + scenarios.map((row, index) => '<option value="' + index + '">' + escapeHtml(row.name) + '</option>').join("");
  if (selected !== "" && scenarios[Number(selected)]) select.value = selected;
  const comparison = $("#comparison-select");
  const previousComparison = comparison.value;
  comparison.innerHTML = '<option value="">Choose a snapshot to compare</option>' + scenarios.map((row, index) => '<option value="' + index + '">' + escapeHtml(row.name) + '</option>').join("");
  if (previousComparison !== "" && scenarios[Number(previousComparison)]) comparison.value = previousComparison;
  $("#scenario-count").textContent = libraryBlocked ? "Scenario storage is unavailable or invalid. Existing stored bytes are preserved. Export JSON to keep your work." : scenarios.length + " of " + MAX_SCENARIOS + " snapshots saved in this browser. Loading can be undone.";
  $("#save-scenario").disabled = libraryBlocked || scenarios.length >= MAX_SCENARIOS;
  $("#load-scenario").disabled = !scenarios.length;
  $("#delete-scenario").disabled = !scenarios.length;
}

function persistScenarios(next) {
  try {
    if (localStorage.getItem(LIBRARY_KEY) !== libraryRaw) {
      notifyDraft("The scenario library changed in another tab. Export this draft, then reload before saving a snapshot.");
      return false;
    }
    const serialized = JSON.stringify(next);
    localStorage.setItem(LIBRARY_KEY, serialized);
    libraryRaw = serialized;
    scenarios = next;
    renderScenarios();
    return true;
  } catch {
    notifyDraft("Scenario could not be saved. Export JSON to keep this draft.");
    return false;
  }
}

$("#save-scenario").addEventListener("click", () => {
  if (libraryBlocked || scenarios.length >= MAX_SCENARIOS) return;
  const cause = firstProposalError(state.proposal);
  if (cause) return notifyDraft("Fix the draft before saving a scenario: " + cause);
  const name = $("#scenario-name").value.trim() || state.proposal.title;
  if (name.length > 120) return notifyDraft("Scenario names must be 120 characters or fewer.");
  if (persistScenarios([...scenarios, { name, proposal: canonicalProposal(state.proposal) }])) {
    $("#scenario-select").value = String(scenarios.length - 1);
    notifyDraft("Scenario saved as an independent snapshot: " + name);
  }
});
$("#load-scenario").addEventListener("click", () => {
  const value = $("#scenario-select").value;
  const row = value === "" ? null : scenarios[Number(value)];
  if (!row) return notifyDraft("Choose a saved scenario first.");
  changeAndRender(() => { state.proposal = clone(row.proposal); });
  notifyDraft("Loaded scenario: " + row.name + ". Undo restores the previous draft.");
});
$("#delete-scenario").addEventListener("click", () => {
  const value = $("#scenario-select").value;
  const row = value === "" ? null : scenarios[Number(value)];
  if (!row) return notifyDraft("Choose a saved scenario first.");
  if (!window.confirm("Delete saved scenario: " + row.name + "? The current draft is retained.")) return;
  if (persistScenarios(scenarios.filter((_, index) => index !== Number(value)))) notifyDraft("Saved scenario deleted. The current draft is retained.");
});

function restoreHistory(from, to) {
  if (!from.length) return;
  to.push(JSON.stringify(state.proposal));
  state.proposal = JSON.parse(from.pop());
  save(false);
  render();
}
$("#undo-button").addEventListener("click", () => restoreHistory(undoStack, redoStack));
$("#redo-button").addEventListener("click", () => restoreHistory(redoStack, undoStack));

$("#load-preset").addEventListener("click", () => {
  changeAndRender(() => { state.proposal = clone(presets[$("#preset-select").value]); state.saveMessage = "Preset loaded and saved locally."; });
});
function downloadText(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

$("#export-button").addEventListener("click", () => {
  if (!validateProposal(state.proposal).valid) {
    $("#autosave-status").textContent = "Correct invalid inputs before exporting JSON.";
    return;
  }
  downloadText("smallest-agreement.json", JSON.stringify(canonicalProposal(state.proposal), null, 2), "application/json");
});
$("#print-button").addEventListener("click", () => window.print());
$("#worksheet-button").addEventListener("click", () => {
  const worksheet = formatDiscussionWorksheet(state.proposal);
  if (worksheet.status !== "ok") return notifyDraft("Fix the draft before exporting the discussion worksheet.");
  downloadText("smallest-agreement-worksheet.txt", worksheet.text, "text/plain");
  notifyDraft("Discussion worksheet downloaded. It is a conversation aid, not a recorded vote.");
});
$("#worksheet-csv-button").addEventListener("click", () => {
  const worksheet = formatDiscussionWorksheetCsv(state.proposal);
  if (worksheet.status !== "ok") return notifyDraft("Fix the draft before exporting the discussion worksheet CSV.");
  downloadText("smallest-agreement-worksheet.csv", "\uFEFF" + worksheet.csv, "text/csv;charset=utf-8");
  notifyDraft("Discussion worksheet CSV downloaded. Groups, weights, options, and notes are text. It is a conversation aid, not a recorded vote.");
});
window.addEventListener("beforeunload", (event) => {
  if (!hasUnsavedEdits) return;
  event.preventDefault();
  event.returnValue = "";
});

$("#csv-button").addEventListener("click", () => {
  if (!validateProposal(state.proposal).valid) return notifyDraft("Fix the draft before exporting CSV.");
  downloadText("smallest-agreement-evidence.csv", "\uFEFF" + formatEvidenceCsv(state.proposal, currentResult()), "text/csv;charset=utf-8");
  notifyDraft("CSV downloaded with every option, group, constraint, support score, and recommendation marker.");
});
$("#matrix-export-button").addEventListener("click", () => {
  if (!validateProposal(state.proposal).valid) return notifyDraft("Fix the draft before exporting the support matrix.");
  downloadText("smallest-agreement-support.csv", "\uFEFF" + formatSupportMatrixCsv(state.proposal), "text/csv;charset=utf-8");
  notifyDraft("Support matrix CSV downloaded. Import it to replace group scores without changing labels or costs.");
});
$("#matrix-import-button").addEventListener("click", () => $("#matrix-import-file").click());
$("#matrix-import-file").addEventListener("change", async (event) => {
  const sequence = ++importSequence;
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (file.size > 250_000) return notifyDraft("Support CSV import failed: files must be 250 KB or smaller.");
  let text;
  try {
    text = await file.text();
  } catch {
    if (sequence !== importSequence) return;
    return notifyDraft("Support CSV import failed: the file could not be read.");
  }
  if (sequence !== importSequence) return;
  const parsed = parseSupportMatrixCsv(text, state.proposal);
  if (parsed.status !== "ok") {
    const first = parsed.errors[0];
    return notifyDraft(`Support CSV import failed (${first.code}): ${first.message}`);
  }
  state.proposal = parsed.proposal;
  state.saveMessage = `Imported ${parsed.updatedCells} support scores from CSV.`;
  save();
  render();
});
$("#brief-button").addEventListener("click", () => {
  downloadText("smallest-agreement-brief.md", formatDecisionBrief(state.proposal, currentResult()), "text/markdown");
  state.saveMessage = "Decision brief downloaded.";
  $("#autosave-status").textContent = state.saveMessage;
});
$("#import-button").addEventListener("click", () => $("#import-file").click());
$("#import-file").addEventListener("change", async (event) => {
  const sequence = ++importSequence;
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (file.size > 250_000) {
    state.saveMessage = "Import failed: files must be 250 KB or smaller.";
    $("#autosave-status").textContent = state.saveMessage;
    return;
  }
  let text;
  try {
    text = await file.text();
  } catch {
    if (sequence !== importSequence) return;
    state.saveMessage = "Import failed: the file could not be read.";
    $("#autosave-status").textContent = state.saveMessage;
    return;
  }
  if (sequence !== importSequence) return;
  const parsed = parseProposalJson(text);
  if (parsed.cause) {
    state.saveMessage = `Import failed: ${parsed.cause}`;
    $("#autosave-status").textContent = state.saveMessage;
    return;
  }
  state.proposal = parsed.proposal;
  state.saveMessage = "Imported and saved locally.";
  save();
  render();
});
$("#share-button").addEventListener("click", async () => {
  if (!validateProposal(state.proposal).valid) {
    $("#autosave-status").textContent = "Correct invalid inputs before sharing.";
    return;
  }
  if (location.protocol === "file:") {
    state.saveMessage = "Share links are not portable from a local file. Export JSON to share this draft.";
    $("#autosave-status").textContent = state.saveMessage;
    return;
  }
  const encoded = encodeHash(state.proposal);
  if (encoded.length > 60_000) {
    state.saveMessage = "This draft is too large for a share link. Export JSON instead.";
    $("#autosave-status").textContent = state.saveMessage;
    return;
  }
  location.hash = encoded;
  const link = location.href;
  try { await navigator.clipboard.writeText(link); state.saveMessage = "Share link copied. It contains this draft in the URL."; }
  catch { state.saveMessage = "Share link is now in the address bar. Copy it to share this draft."; }
  $("#autosave-status").textContent = state.saveMessage;
});
$("#reset-button").addEventListener("click", () => {
  if (!window.confirm("Reset this local draft to the Neighbourhood Plan preset?")) return;
  state.proposal = clone(presets.neighbourhood);
  location.hash = "";
  state.saveMessage = "Draft reset and saved locally.";
  save();
  render();
});
window.addEventListener("resize", () => {
  const result = currentResult();
  if (result.baseline) drawCoalition(result.baseline, result.agreement);
});

const coachSteps = [
  { title: "Set the approval threshold", copy: "The solver looks for the lowest-cost package that reaches this number and every constraint. The threshold is a working rule you chose, not a recorded vote.", highlight: "#threshold-setup" },
  { title: "Lock clauses that are not open", copy: "A lock keeps that option in every searched combination. Unlock an option before removing it. Locks shrink the search; they do not grant authority.", highlight: "#clauses-heading" },
  { title: "Optionally cap total change cost", copy: "Leave the budget blank for no limit. Zero is a real limit that only allows zero-cost changes.", highlight: "#max-change-cost" },
  { title: "Review the recommendation", copy: "Search runs as you edit. Read the constraint checks, near misses, and contribution table before taking the package to a human discussion.", highlight: "#results-heading" },
];
let coachIndex = 0;
let coachOpen = false;

function setCoachHighlight(selector) {
  for (const id of ["#threshold-setup", "#clauses-heading", "#max-change-cost", "#results-heading"]) {
    const node = $(id);
    if (!node || !node.classList) continue;
    node.classList.toggle("coach-highlight", selector === id);
  }
}

function dismissCoach() {
  coachOpen = false;
  const overlay = $("#coach-overlay");
  if (overlay) overlay.hidden = true;
  setCoachHighlight("");
  try { localStorage.setItem(COACH_KEY, "dismissed"); } catch { /* storage may be unavailable */ }
}

function showCoachStep() {
  const step = coachSteps[coachIndex];
  $("#coach-title").textContent = step.title;
  $("#coach-copy").textContent = step.copy;
  $("#coach-step").textContent = `Step ${coachIndex + 1} of ${coachSteps.length}`;
  $("#coach-next").textContent = coachIndex === coachSteps.length - 1 ? "Done" : "Next";
  setCoachHighlight(step.highlight);
  const overlay = $("#coach-overlay");
  overlay.hidden = false;
  coachOpen = true;
  $("#coach-skip")?.focus?.();
}

function startCoachIfNeeded() {
  const overlay = $("#coach-overlay");
  if (overlay) overlay.hidden = true;
  if (initialLoadMessage === "Loaded proposal from the share link.") return;
  try {
    if (localStorage.getItem(COACH_KEY) === "dismissed") return;
  } catch {
    return;
  }
  coachIndex = 0;
  showCoachStep();
}

$("#coach-skip").addEventListener("click", dismissCoach);
$("#coach-again").addEventListener("click", () => {
  coachIndex = 0;
  showCoachStep();
});
$("#coach-next").addEventListener("click", () => {
  if (coachIndex >= coachSteps.length - 1) dismissCoach();
  else {
    coachIndex += 1;
    showCoachStep();
  }
});

let shortcutOpen = false;
function typingInField(target) {
  const tag = target?.tagName;
  return tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || target?.isContentEditable === true;
}
function setShortcutOpen(open) {
  shortcutOpen = open;
  const overlay = $("#shortcut-overlay");
  if (overlay) overlay.hidden = !open;
  if (open) $("#shortcut-close")?.focus?.();
}
function findAgreement() {
  $("#results-heading")?.focus?.();
  notifyDraft("Search already runs as you edit. Review the recommendation below.");
}
$("#find-agreement").addEventListener("click", findAgreement);
$("#shortcut-help-button").addEventListener("click", () => setShortcutOpen(true));
$("#shortcut-close").addEventListener("click", () => setShortcutOpen(false));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (coachOpen) {
      event.preventDefault();
      dismissCoach();
      return;
    }
    if (shortcutOpen) {
      event.preventDefault();
      setShortcutOpen(false);
    }
    return;
  }
  if (typingInField(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key === "?") {
    event.preventDefault();
    setShortcutOpen(true);
    return;
  }
  if (shortcutOpen) return;
  if (event.key === "u" || event.key === "U") {
    event.preventDefault();
    if (!$("#undo-button").disabled) $("#undo-button").click();
  } else if (event.key === "r" || event.key === "R") {
    event.preventDefault();
    if (!$("#redo-button").disabled) $("#redo-button").click();
  } else if (event.key === "e" || event.key === "E") {
    event.preventDefault();
    $("#export-button").click();
  } else if (event.key === "s" || event.key === "S") {
    event.preventDefault();
    findAgreement();
  } else if (event.key === "f" || event.key === "F") {
    event.preventDefault();
    $("#clause-filter")?.focus?.();
  } else if (event.key === "n" || event.key === "N") {
    event.preventDefault();
    $("#add-group")?.focus?.();
  }
});

render();
startCoachIfNeeded();
