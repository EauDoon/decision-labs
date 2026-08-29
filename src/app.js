import {
  MAX_CLAUSES,
  MAX_COMBINATIONS,
  MAX_GROUPS,
  MAX_OPTIONS_PER_CLAUSE,
  canonicalProposal,
  findSmallestAgreement,
  formatPercent,
  formatDecisionBrief,
  validateProposal,
} from "./model.js";

const STORAGE_KEY = "smallest-agreement:proposal:v1";
const HASH_PREFIX = "#agreement=";
let idNumber = 100;
let initialLoadMessage = "Loaded local draft.";

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
};

const state = { proposal: loadInitialProposal(), saveMessage: initialLoadMessage };
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
function clone(value) { return JSON.parse(JSON.stringify(value)); }

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
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (validateProposal(saved).valid) return canonicalProposal(saved);
  } catch { /* Invalid browser storage is ignored. */ }
  return clone(presets.neighbourhood);
}

function parseHash() {
  if (!location.hash.startsWith(HASH_PREFIX)) return null;
  if (location.hash.length > 60_000) {
    initialLoadMessage = "Share link ignored: it is larger than 60 KB.";
    return null;
  }
  try {
    const encoded = decodeURIComponent(location.hash.slice(HASH_PREFIX.length))
      .replaceAll("-", "+")
      .replaceAll("_", "/");
    const padded = encoded.padEnd(encoded.length + ((4 - (encoded.length % 4)) % 4), "=");
    const text = new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(atob(padded), (character) => character.charCodeAt(0)));
    const proposal = JSON.parse(text);
    if (!validateProposal(proposal).valid) {
      initialLoadMessage = "Share link ignored: its proposal is invalid.";
      return null;
    }
    initialLoadMessage = "Loaded proposal from the share link.";
    return canonicalProposal(proposal);
  } catch {
    initialLoadMessage = "Share link ignored: it could not be decoded.";
    return null;
  }
}

function encodeHash(proposal) {
  const bytes = new TextEncoder().encode(JSON.stringify(proposal));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  const encoded = btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
  return `${HASH_PREFIX}${encoded}`;
}

function save() {
  if (!validateProposal(state.proposal).valid) {
    state.saveMessage = "Invalid edits are not saved. Correct them to resume autosave.";
    return;
  }
  if (location.hash.startsWith(HASH_PREFIX)) history.replaceState(null, "", `${location.pathname}${location.search}`);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(canonicalProposal(state.proposal)));
    state.saveMessage = "Saved in this browser.";
  } catch {
    state.saveMessage = "Browser storage is unavailable. Export to keep this draft.";
  }
}

function currentResult() {
  return findSmallestAgreement(state.proposal, { maxCombinations: MAX_COMBINATIONS });
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
  $("#proposal-title").value = proposal.title;
  $("#threshold").value = proposal.threshold;
  $("#threshold-output").textContent = `${proposal.threshold}%`;
  $("#max-change-cost").value = proposal.maxChangeCost ?? "";
  $("#proposal-heading").textContent = proposal.title;
  $("#autosave-status").textContent = state.saveMessage;
  renderGroups();
  renderClauses();
  renderResults(currentResult());
}

function renderGroups() {
  $("#groups-editor").innerHTML = state.proposal.groups.map((group) => `
    <div class="group-row">
      <label><span class="visually-hidden">Group name</span><input data-field="group-name" data-group-id="${escapeHtml(group.id)}" value="${escapeHtml(group.name)}" maxlength="80" aria-label="Group name"></label>
      <label><span class="visually-hidden">Weight</span><input data-field="group-weight" data-group-id="${escapeHtml(group.id)}" type="number" min="0.1" step="0.1" value="${group.weight}" aria-label="${escapeHtml(group.name)} weight"></label>
      <button class="text-button danger" type="button" data-action="remove-group" data-group-id="${escapeHtml(group.id)}" ${state.proposal.groups.length <= 1 ? "disabled" : ""}>Remove</button>
      <label class="group-floor">Minimum support (%)<input data-field="group-floor" data-group-id="${escapeHtml(group.id)}" type="number" min="0" max="100" step="any" value="${group.minSupport ?? ""}" placeholder="No floor" aria-label="${escapeHtml(group.name)} minimum support" aria-describedby="floor-note"></label>
    </div>`).join("");
}

function renderClauses() {
  const { groups } = state.proposal;
  $("#clauses-editor").innerHTML = state.proposal.clauses.map((clause, clauseIndex) => `
    <article class="clause-card">
      <div class="clause-top">
        <label><span class="visually-hidden">Clause title</span><input class="clause-title-input" data-field="clause-title" data-clause-id="${escapeHtml(clause.id)}" value="${escapeHtml(clause.title)}" maxlength="120" aria-label="Clause ${clauseIndex + 1} title"></label>
        <button class="text-button danger" type="button" data-action="remove-clause" data-clause-id="${escapeHtml(clause.id)}" ${state.proposal.clauses.length <= 1 ? "disabled" : ""}>Remove clause</button>
      </div>
      <p class="clause-annotation">Cost is an explicit human estimate of disruption, scope expansion, or process burden. It is not a measure of merit.</p>
      <label class="clause-lock">Lock clause to an option
        <select data-field="clause-lock" data-clause-id="${escapeHtml(clause.id)}" aria-label="${escapeHtml(clause.title)} locked option">
          <option value="">No lock, search all options</option>
          ${clause.options.map((option) => `<option value="${escapeHtml(option.id)}" ${clause.lockedOptionId === option.id ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
        </select>
      </label>
      <div class="options-table-wrap"><table class="options-table">
        <thead><tr><th scope="col">Option</th><th scope="col">Change cost</th>${groups.map((group) => `<th scope="col">${escapeHtml(group.name)}<br>support</th>`).join("")}<th scope="col"><span class="visually-hidden">Actions</span></th></tr></thead>
        <tbody>${clause.options.map((option) => `
          <tr>
            <td><input class="option-label-input" data-field="option-label" data-clause-id="${escapeHtml(clause.id)}" data-option-id="${escapeHtml(option.id)}" value="${escapeHtml(option.label)}" maxlength="240" aria-label="Option label"><br>${option.original ? '<span class="original-marker">Original option</span>' : ""}</td>
            <td>${option.original ? '<span class="original-marker">0</span>' : `<input data-field="option-cost" data-clause-id="${escapeHtml(clause.id)}" data-option-id="${escapeHtml(option.id)}" type="number" min="0" step="0.1" value="${option.changeCost}" aria-label="${escapeHtml(option.label)} change cost">`}</td>
            ${groups.map((group) => `<td><input data-field="option-support" data-clause-id="${escapeHtml(clause.id)}" data-option-id="${escapeHtml(option.id)}" data-group-id="${escapeHtml(group.id)}" type="number" min="0" max="100" step="1" value="${option.support[group.id]}" aria-label="${escapeHtml(option.label)}, ${escapeHtml(group.name)} support"></td>`).join("")}
            <td><div class="option-tools">${option.original ? "" : `<button class="text-button danger" type="button" data-action="remove-option" data-clause-id="${escapeHtml(clause.id)}" data-option-id="${escapeHtml(option.id)}" ${clause.options.length <= 3 || clause.lockedOptionId === option.id ? "disabled" : ""}>Remove</button>`}${clause.lockedOptionId === option.id ? '<span class="original-marker">Locked</span>' : ""}</div></td>
          </tr>`).join("")}</tbody>
      </table></div>
      <button class="text-button add-alternative" type="button" data-action="add-option" data-clause-id="${escapeHtml(clause.id)}" ${clause.options.length >= MAX_OPTIONS_PER_CLAUSE ? "disabled" : ""}>Add alternative</button>
    </article>`).join("");
}

function renderResults(result) {
  const { proposal } = state;
  const alert = $("#result-alert");
  const meta = $("#search-meta");
  $("#export-button").disabled = result.status === "invalid";
  $("#share-button").disabled = result.status === "invalid";
  $("#constraint-checks").textContent = "Constraints have not been evaluated.";
  if (result.status === "too_large") {
    alert.textContent = `Search paused: more than ${MAX_COMBINATIONS.toLocaleString()} combinations. Reduce alternatives or clauses to evaluate every combination.`;
    meta.textContent = `More than ${MAX_COMBINATIONS.toLocaleString()} combinations`;
    $("#result-summary").innerHTML = emptyResults();
    $("#changed-clauses").innerHTML = '<p class="empty-state">No recommendation was evaluated.</p>';
    $("#support-shifts").innerHTML = "";
    $("#near-misses-list").innerHTML = '<p class="empty-state">Near misses are unavailable when the full search is over the safety bound.</p>';
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
  $("#result-summary").innerHTML = agreement ? `
    <div class="metric"><span class="metric-label">Current approval</span><strong>${formatPercent(current.approval)}</strong></div>
    <div class="metric"><span class="metric-label">Recommended approval</span><strong>${formatPercent(agreement.approval)}</strong></div>
    <div class="metric"><span class="metric-label">Threshold margin</span><strong class="positive">${formatMargin(agreement.approval - proposal.threshold)}</strong></div>
    <div class="metric cost"><span class="metric-label">Total change cost</span><strong>${agreement.changeCost.toFixed(1)}</strong></div>` : `
    <div class="metric"><span class="metric-label">Current approval</span><strong>${formatPercent(current.approval)}</strong></div>
    <div class="metric cost"><span class="metric-label">Threshold</span><strong>${proposal.threshold}%</strong></div>
    <div class="metric cost"><span class="metric-label">Closest gap</span><strong>${closestGap === null ? "Not found" : closestGap.toFixed(1) + " points"}</strong></div>
    <div class="metric cost"><span class="metric-label">Best result</span><strong>Not found</strong></div>`;
  renderChanges(agreement, current);
  renderConstraints(result);
  renderNearMisses(result.nearMisses);
  drawCoalition(current, agreement);
  renderCoalitionTable(current, agreement);
}

function renderConstraints(result) {
  const checks = result.agreement?.constraints ?? result.baseline.constraints;
  const rows = [];
  const mark = (met) => met ? "Met" : "Not met";
  if (checks.budget) rows.push(`<tr><th scope="row">Total change cost</th><td>At most ${checks.budget.maximum}</td><td>${checks.budget.actual}</td><td>${mark(checks.budget.met)}</td></tr>`);
  for (const floor of checks.floors) rows.push(`<tr><th scope="row">${escapeHtml(floor.name)} support</th><td>At least ${floor.minimum}%</td><td>${formatPercent(floor.actual)}</td><td>${mark(floor.met)}</td></tr>`);
  for (const lock of checks.locks) rows.push(`<tr><th scope="row">${escapeHtml(lock.clauseTitle)}</th><td>${escapeHtml(lock.label)}</td><td>Locked option</td><td>${mark(lock.met)}</td></tr>`);
  const inspected = result.agreement ? "Recommended combination" : "Original proposal, no recommendation found";
  const counts = result.status === "already_passing" ? "The original proposal meets every requirement with zero changes. No further enumeration is needed." : `${result.eligibleCombinations.toLocaleString()} combinations meet all constraints. ${result.rejected.anyConstraint.toLocaleString()} rejected: ${result.rejected.budget.toLocaleString()} over budget and ${result.rejected.floors.toLocaleString()} below a group floor. These counts can overlap. Locks exclude other options before enumeration.`;
  $("#constraint-checks").innerHTML = `<p>${counts}</p>${rows.length ? `<p>${inspected}</p><div class="options-table-wrap"><table class="coalition-table"><thead><tr><th scope="col">Constraint</th><th scope="col">Required</th><th scope="col">Actual</th><th scope="col">Status</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>` : '<p>No group floors, budget, or clause locks set.</p>'}`;
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

function renderNearMisses(nearMisses) {
  $("#near-misses-list").innerHTML = nearMisses.length ? nearMisses.map((miss) => {
    const labels = miss.changes.length ? miss.changes.map((change) => `${change.clauseTitle}: ${change.to}`).join("; ") : "Keep every original option";
    return `<div class="miss-item"><span class="miss-score">${formatPercent(miss.approval)}</span><span>${escapeHtml(labels)}<br><small>Short by ${(state.proposal.threshold - miss.approval).toFixed(1)} points. Cost ${miss.changeCost.toFixed(1)}.</small></span></div>`;
  }).join("") : '<p class="empty-state">No constraint-compliant near misses to show.</p>';
}

function drawCoalition(current, agreement) {
  const canvas = $("#coalition-canvas");
  const context = canvas.getContext("2d");
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
  mutator();
  save();
  render();
}

document.addEventListener("input", (event) => {
  const target = event.target;
  const field = target.dataset.field;
  if (!field) return;
  if (field === "clause-lock") return;
  if (field === "group-floor") {
    const group = groupById(target.dataset.groupId);
    if (target.value === "" && !target.validity.badInput) delete group.minSupport;
    else group.minSupport = target.valueAsNumber;
  }
  if (field === "group-name") groupById(target.dataset.groupId).name = target.value || "Unnamed group";
  if (field === "group-weight") groupById(target.dataset.groupId).weight = Math.max(.1, number(target.value, 1));
  if (field === "clause-title") clauseById(target.dataset.clauseId).title = target.value || "Untitled clause";
  if (field === "option-label") optionById(clauseById(target.dataset.clauseId), target.dataset.optionId).label = target.value || "Untitled option";
  if (field === "option-label") {
    const select = [...document.querySelectorAll('[data-field="clause-lock"]')].find((element) => element.dataset.clauseId === target.dataset.clauseId);
    const choice = [...select.options].find((element) => element.value === target.dataset.optionId);
    choice.textContent = target.value || "Untitled option";
  }
  if (field === "option-cost") optionById(clauseById(target.dataset.clauseId), target.dataset.optionId).changeCost = Math.max(0, number(target.value));
  if (field === "option-support") optionById(clauseById(target.dataset.clauseId), target.dataset.optionId).support[target.dataset.groupId] = Math.min(100, Math.max(0, number(target.value)));
  save();
  $("#proposal-heading").textContent = state.proposal.title;
  $("#autosave-status").textContent = state.saveMessage;
  renderResults(currentResult());
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
  if (action === "add-clause") changeAndRender(() => {
    const support = defaultSupport(state.proposal.groups);
    state.proposal.clauses.push({ id: makeId("clause"), title: "New clause", options: [
      { id: makeId("original"), original: true, label: "Keep the current wording", changeCost: 0, support: { ...support } },
      { id: makeId("alternative"), original: false, label: "Add a first structured alternative", changeCost: 1, support: { ...support } },
      { id: makeId("alternative"), original: false, label: "Add a second structured alternative", changeCost: 2, support: { ...support } },
    ] });
  });
  if (action === "remove-clause") changeAndRender(() => { state.proposal.clauses = state.proposal.clauses.filter((clause) => clause.id !== button.dataset.clauseId); });
  if (action === "add-option") changeAndRender(() => {
    const clause = clauseById(button.dataset.clauseId);
    clause.options.push({ id: makeId("alternative"), original: false, label: "New alternative", changeCost: 1, support: { ...defaultSupport(state.proposal.groups) } });
  });
  if (action === "remove-option") changeAndRender(() => {
    const clause = clauseById(button.dataset.clauseId);
    if (clause.lockedOptionId === button.dataset.optionId) return;
    clause.options = clause.options.filter((option) => option.id !== button.dataset.optionId);
  });
});

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
$("#brief-button").addEventListener("click", () => {
  downloadText("smallest-agreement-brief.md", formatDecisionBrief(state.proposal, currentResult()), "text/markdown");
  state.saveMessage = "Decision brief downloaded.";
  $("#autosave-status").textContent = state.saveMessage;
});
$("#import-button").addEventListener("click", () => $("#import-file").click());
$("#import-file").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (file.size > 250_000) {
    state.saveMessage = "Import failed: files must be 250 KB or smaller.";
    $("#autosave-status").textContent = state.saveMessage;
    event.target.value = "";
    return;
  }
  try {
    const proposal = JSON.parse(await file.text());
    const validation = validateProposal(proposal);
    if (!validation.valid) throw new Error(validation.errors[0]);
    state.proposal = canonicalProposal(proposal);
    state.saveMessage = "Imported and saved locally.";
    save();
    render();
  } catch (error) {
    state.saveMessage = `Import failed: ${error.message || "invalid JSON"}`;
    $("#autosave-status").textContent = state.saveMessage;
  }
  event.target.value = "";
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

render();
