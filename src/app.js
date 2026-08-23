import {
  PRESETS,
  ValidationError,
  calculatePartnership,
  clonePreset,
  makeParticipant,
  validateConfiguration,
} from './model.js';

const STORAGE_KEY = 'partnership-breakpoint.v1';
const MAX_HASH_LENGTH = 60_000;
const app = document.querySelector('#workbench');
const standaloneFileMode = window.location.protocol === 'file:';
let participantSequence = 1;
let activePreset = 'balanced';
let state = loadInitialState();
let eventsBound = false;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function decodeHash(hash) {
  if (!hash.startsWith('#deal=')) return null;
  if (hash.length > MAX_HASH_LENGTH) return null;
  try {
    const encoded = hash.slice(6).replace(/-/g, '+').replace(/_/g, '/');
    const padded = encoded + '='.repeat((4 - encoded.length % 4) % 4);
    const parsed = JSON.parse(decodeURIComponent(Array.from(atob(padded), (character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')));
    return validateConfiguration(parsed).valid ? parsed : null;
  } catch {
    return null;
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
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return validateConfiguration(parsed).valid ? parsed : null;
  } catch {
    return null;
  }
}

function loadInitialState() {
  const fromHash = decodeHash(window.location.hash);
  if (fromHash) return fromHash;
  const fromStorage = loadStoredState();
  return fromStorage ?? clonePreset('balanced');
}

function saveState() {
  const validation = validateConfiguration(state);
  if (!validation.valid) return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Storage is optional. */ }
  if (standaloneFileMode) return;
  const hash = encodeHash(state);
  history.replaceState(null, '', hash.length <= MAX_HASH_LENGTH
    ? `${window.location.pathname}${window.location.search}${hash}`
    : `${window.location.pathname}${window.location.search}`);
}

function numberFromInput(value, optional = false) {
  if (optional && value.trim() === '') return null;
  if (value.trim() === '') return Number.NaN;
  return Number(value);
}

function inputValue(value) {
  return value === null || value === undefined || Number.isNaN(value) ? '' : String(value);
}

function field({ label, path, value, optional = false, min = 0, step = 'any', wide = false, type = 'number' }) {
  const optionalText = optional ? '<span class="optional">optional</span>' : '';
  const input = type === 'text'
    ? `<input type="text" data-path="${path}" data-type="text" value="${escapeAttribute(value)}" maxlength="80" required />`
    : `<input type="number" data-path="${path}" ${optional ? 'data-optional="true"' : ''} min="${min}" step="${step}" value="${inputValue(value)}" ${optional ? '' : 'required'} />`;
  return `<div class="field ${wide ? 'wide' : ''}"><label>${label} ${optionalText}${input}</label></div>`;
}

function escapeAttribute(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatNumber(value, digits = 0) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'Impossible';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
}

function formatMoney(value) {
  if (!Number.isFinite(value)) return 'Impossible';
  return `${formatNumber(value, 2)} units`;
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
  return { volume: 'volume decrease', fee: 'fee decrease', variableCost: 'variable cost increase' }[kind] ?? kind;
}

function shockUnits(kind) {
  return kind === 'volume' ? 'txn' : 'units / txn';
}

function breakpointSection(result) {
  const breakpoint = result.firstBreakpoint;
  if (!breakpoint?.participant) {
    return `<section class="panel breakpoint-summary"><div class="panel-heading"><h2>First breakpoint</h2><span class="optional">relative adverse movement</span></div><div class="panel-body"><p>No bounded adverse shock is available in the current inputs. The displayed participant thresholds remain unbounded.</p></div></section>`;
  }

  const participantName = escapeAttribute(breakpoint.participant.name);
  const label = shockLabel(breakpoint.kind);
  const shock = breakpoint.shock;
  if (breakpoint.status === 'already-failing') {
    return `<section class="panel breakpoint-summary alarm"><div class="panel-heading"><h2>First breakpoint</h2><span class="optional">action now</span></div><div class="panel-body"><p><strong>${participantName}</strong> is already failing an exit criterion. Resolve the input before relying on a shock threshold.</p></div></section>`;
  }
  if (breakpoint.status === 'at-breakpoint') {
    return `<section class="panel breakpoint-summary alarm"><div class="panel-heading"><h2>First breakpoint</h2><span class="optional">action now</span></div><div class="panel-body"><p><strong>${participantName}</strong> is already at its ${label}. Any further adverse movement fails.</p></div></section>`;
  }

  const units = shockUnits(breakpoint.kind);
  const threshold = breakpoint.kind === 'volume'
    ? `${formatNumber(shock.breakpoint)} txn`
    : `${formatNumber(shock.breakpoint, 4)} units / txn`;
  return `<section class="panel breakpoint-summary"><div class="panel-heading"><h2>First breakpoint</h2><span class="optional">relative adverse movement</span></div><div class="panel-body"><p><strong>Protect ${participantName} first.</strong> A ${label} of <strong>${compactShock(shock, units)}</strong> reaches the boundary at ${threshold}.</p><p class="output-note">This ranks the smallest percentage movement from the current scenario. It is a comparison aid, not a probability forecast.</p></div></section>`;
}

function inputPanel() {
  const participantForms = state.participants.map((participant, index) => `
    <section class="participant-form" aria-labelledby="participant-${index}-title">
      <div class="participant-header">
        <strong id="participant-${index}-title">Participant ${index + 1}</strong>
        <button type="button" class="danger" data-action="remove-participant" data-index="${index}" ${state.participants.length <= 2 ? 'disabled title="At least two participants are required"' : ''}>Remove</button>
      </div>
      <div class="field-grid">
        ${field({ label: 'Name', path: `participants.${index}.name`, value: participant.name, wide: true, type: 'text' })}
        ${field({ label: 'Revenue share', path: `participants.${index}.revenueShare`, value: participant.revenueShare, min: 0, step: '0.0001' })}
        ${field({ label: 'Variable cost / txn', path: `participants.${index}.variableCostPerTransaction`, value: participant.variableCostPerTransaction, step: '0.0001' })}
        ${field({ label: 'Fixed monthly cost', path: `participants.${index}.fixedMonthlyCost`, value: participant.fixedMonthlyCost, step: '0.01' })}
        ${field({ label: 'Minimum monthly profit', path: `participants.${index}.minimumAcceptableProfit`, value: participant.minimumAcceptableProfit, step: '0.01' })}
        ${field({ label: 'Capacity / month', path: `participants.${index}.capacity`, value: participant.capacity, optional: true, step: '1' })}
        ${field({ label: 'Minimum commitment', path: `participants.${index}.minimumCommitment`, value: participant.minimumCommitment, optional: true, step: '1' })}
        ${field({ label: 'Risk cost / month', path: `participants.${index}.riskCost`, value: participant.riskCost, step: '0.01', wide: true })}
      </div>
    </section>`).join('');

  return `
    <aside class="panel inputs" aria-label="Deal inputs">
      <div class="panel-heading"><h1>Deal ledger</h1><span class="optional">editable</span></div>
      <div class="panel-body">
        <section class="input-section" aria-labelledby="deal-inputs-title">
          <h2 id="deal-inputs-title">Shared deal</h2>
          <div class="field-grid">
            ${field({ label: 'Monthly volume', path: 'deal.monthlyVolume', value: state.deal.monthlyVolume, step: '1' })}
            ${field({ label: 'Fee / transaction', path: 'deal.feePerTransaction', value: state.deal.feePerTransaction, step: '0.0001' })}
            ${field({ label: 'Addressable volume', path: 'deal.addressableVolume', value: state.deal.addressableVolume, step: '1' })}
            ${field({ label: 'Volume shock %', path: 'deal.volumeShockPct', value: state.deal.volumeShockPct ?? 0, min: 0, step: '0.1' })}
          </div>
        </section>
        <section class="input-section" aria-labelledby="presets-title">
          <h2 id="presets-title">Starting points</h2>
          <div class="preset-row">
            ${Object.entries(PRESETS).map(([key, preset]) => `<button type="button" data-action="preset" data-preset="${key}" aria-pressed="${activePreset === key}">${preset.name}</button>`).join('')}
          </div>
        </section>
        <section class="input-section" aria-labelledby="participant-inputs-title">
          <h2 id="participant-inputs-title">Participants</h2>
          <p class="notice">Shares must add to exactly 1. Capacity and commitment may be left blank.</p>
          ${participantForms}
          <div class="button-row"><button type="button" data-action="add-participant">Add participant</button></div>
        </section>
        <section class="input-section" aria-labelledby="data-title">
          <h2 id="data-title">Data</h2>
          <div class="button-row">
            <button type="button" data-action="export">Export JSON</button>
            <label class="file-button">Import JSON<input type="file" data-action="import" accept="application/json,.json" /></label>
            <button type="button" data-action="reset">Reset</button>
          </div>
          <p id="notice" class="notice" aria-live="polite">${standaloneFileMode ? 'Standalone file mode: export JSON to transfer a case. File URLs are not portable.' : ''}</p>
        </section>
      </div>
    </aside>`;
}

function errorBox(errors) {
  return `<section class="error-box" role="alert"><h2>Resolve these inputs</h2><ul>${errors.map((error) => `<li>${escapeAttribute(error)}</li>`).join('')}</ul></section>`;
}

function resultsPanel(result) {
  if (!result) {
    const errors = validateConfiguration(state).errors;
    return `<section class="results">${errorBox(errors)}<section class="panel"><div class="panel-heading"><h2>Model status</h2></div><div class="panel-body"><p class="notice">Calculations return once every required field is valid and shares reconcile to 1.</p></div></section>${methodAndLimits()}</section>`;
  }
  const statusClass = result.viable ? 'viable' : 'fragile';
  const status = result.viable ? 'Operating region holds' : 'A participant exits';
  const statusDetail = escapeAttribute(result.viable
    ? `${result.weakestParticipant.name} has the least volume headroom to an economic or capacity limit.`
    : `${result.participants.filter((participant) => !participant.viable).map((participant) => participant.name).join(', ')} fails at least one exit criterion.`);
  return `<section class="results">
    <section class="status-card ${statusClass}" aria-live="polite">
      <div><span class="eyebrow">Partnership viability</span><h1>${status}</h1><p>${statusDetail}</p></div>
      <div class="score"><strong>${result.viable ? 'VIABLE' : 'NOT VIABLE'}</strong><span>at ${formatVolume(result.effectiveVolume)} / month</span></div>
    </section>
    <section class="metric-strip" aria-label="Deal summary">
      <div class="metric"><span>Effective volume</span><strong>${formatVolume(result.effectiveVolume)}</strong></div>
      <div class="metric"><span>Total revenue</span><strong>${formatMoney(result.totalRevenue)}</strong></div>
      <div class="metric"><span>Total participant profit</span><strong>${formatMoney(result.totalProfit)}</strong></div>
      <div class="metric"><span>Capacity ceiling</span><strong>${formatVolume(result.capacityCeiling)}</strong></div>
    </section>
    ${breakpointSection(result)}
    ${result.volumeCappedByAddressableDemand ? '<p class="error-box">Addressable demand limits realized volume below the post-shock monthly-volume input.</p>' : ''}
    ${participantTable(result)}
    ${shockSection(result)}
    ${sensitivitySection(result)}
    ${methodAndLimits()}
  </section>`;
}

function participantTable(result) {
  const rows = result.participants.map((participant) => `
    <tr>
      <td><strong>${escapeAttribute(participant.name)}</strong></td>
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
      <td class="${participant.viable ? 'pass-text' : 'failure-text'}">${participant.viable ? 'Holds' : escapeAttribute(participant.failureReasons.join('; '))}</td>
    </tr>`).join('');
  return `<section class="panel"><div class="table-wrap"><table><caption>Participant ledger</caption><thead><tr><th>Participant</th><th>Revenue</th><th>Variable cost</th><th>Fixed cost</th><th>Risk cost</th><th>Monthly profit</th><th>Margin</th><th>Break-even volume</th><th>Exit volume</th><th>Headroom</th><th>Capacity</th><th>Exit test</th></tr></thead><tbody>${rows}</tbody></table></div><p class="output-note">Exit volume is the greater of the profit threshold and minimum commitment. Capacity is tested separately.</p></section>`;
}

function shockCard(label, shock, units) {
  const alert = shock.status === 'already-failing' ? 'alarm' : shock.status === 'unbounded' ? 'safe' : '';
  const threshold = shock.breakpoint === null ? '' : `<p>Threshold: ${formatNumber(shock.breakpoint, units === 'txn' ? 0 : 4)} ${units}. Any additional adverse movement fails.</p>`;
  return `<article class="shock-card ${alert}"><h3>${label}</h3><strong>${compactShock(shock, units)}</strong><p>${escapeAttribute(shock.reason)}</p>${threshold}</article>`;
}

function shockSection(result) {
  return `<section class="panel"><div class="panel-heading"><h2>Smallest adverse shock by participant</h2><span class="optional">threshold is not a forecast</span></div><div class="panel-body">${result.participants.map((participant) => `<section class="input-section"><h2>${escapeAttribute(participant.name)}</h2><div class="shock-grid">${shockCard('Volume decrease', participant.shocks.volume, 'txn')}${shockCard('Fee decrease', participant.shocks.fee, 'units / txn')}${shockCard('Variable cost increase', participant.shocks.variableCost, 'units / txn')}</div></section>`).join('')}</div></section>`;
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
  return `<section class="panel"><div class="panel-heading"><h2>Operating region</h2><span class="optional">fee and volume sensitivity</span></div><div class="sensitivity-layout"><div><canvas id="sensitivity-canvas" width="560" height="400" role="img" aria-label="Canvas chart of viable and non-viable fee and monthly-volume combinations. The visible table provides the same values.">Canvas chart unavailable. Use the operating region table.</canvas><div class="legend"><span><i class="swatch viable"></i>Every participant holds</span><span><i class="swatch fail"></i>At least one participant exits</span></div></div><div class="table-wrap"><table class="sensitivity-table"><caption>Operating region table. Rows are fee per transaction. Columns are monthly volume.</caption><thead><tr><th>Fee / volume</th>${grid.volumes.map((volume) => `<th>${formatNumber(volume)}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table></div></div></section>`;
}

function methodAndLimits() {
  return `<section class="disclosure-grid"><section class="panel"><div class="panel-heading"><h2>Method</h2></div><div class="panel-body"><p>Revenue equals effective monthly volume times fee per transaction times revenue share. Monthly profit equals revenue less variable cost, fixed monthly cost, and risk cost. Effective volume is post-shock monthly volume capped by addressable volume.</p><p>A participant holds only when monthly profit meets its minimum acceptable profit, volume meets any minimum commitment, and volume does not exceed capacity.</p></div></section><section class="panel"><div class="panel-heading"><h2>Limits</h2></div><div class="panel-body"><p>This is a deterministic monthly contribution model, not a forecast or valuation. It does not prove legal enforceability, participant behavior, credit performance, demand response, tax treatment, timing of cash flows, or the completeness of cost inputs.</p><p>Shock thresholds show the boundary under unchanged inputs. They do not assign probability or cause.</p></div></section></section>`;
}

function render() {
  let result = null;
  try { result = calculatePartnership(state); } catch (error) {
    if (!(error instanceof ValidationError)) throw error;
  }
  app.innerHTML = `<div class="app-grid">${inputPanel()}${resultsPanel(result)}</div>`;
  attachEvents();
  if (result) drawSensitivityChart(sensitivityGrid());
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
  saveState();
  render();
  const notice = document.querySelector('#notice');
  if (notice) notice.textContent = message;
}

function attachEvents() {
  if (eventsBound) return;
  eventsBound = true;
  app.addEventListener('change', (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    if (input.dataset.path) {
      setPath(input.dataset.path, input.dataset.type === 'text' ? input.value : numberFromInput(input.value, input.dataset.optional === 'true'));
      activePreset = '';
      refresh(standaloneFileMode ? 'Saved locally. Export JSON to transfer this standalone case.' : 'Saved locally and updated the shareable URL.');
      return;
    }
    if (input.dataset.action === 'import' && input.files?.[0]) importFile(input.files[0]);
  });
  app.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'preset') {
      activePreset = button.dataset.preset;
      state = clonePreset(activePreset);
      refresh(`${PRESETS[activePreset].name} loaded.`);
    }
    if (action === 'add-participant') {
      participantSequence += 1;
      state.participants.push(makeParticipant(nextParticipantId()));
      activePreset = '';
      refresh('Participant added. Set shares to reconcile to 1.');
    }
    if (action === 'remove-participant' && state.participants.length > 2) {
      state.participants.splice(Number(button.dataset.index), 1);
      activePreset = '';
      refresh('Participant removed.');
    }
    if (action === 'export') exportFile();
    if (action === 'reset') {
      activePreset = 'balanced';
      state = clonePreset('balanced');
      refresh('Reset to Balanced.');
    }
  });
}

function exportFile() {
  const validation = validateConfiguration(state);
  if (!validation.valid) {
    const notice = document.querySelector('#notice');
    if (notice) notice.textContent = 'Resolve invalid inputs before exporting.';
    return;
  }
  const blob = new Blob([`${JSON.stringify(state, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'partnership-breakpoint.json';
  link.click();
  URL.revokeObjectURL(url);
  const notice = document.querySelector('#notice');
  if (notice) notice.textContent = 'JSON exported.';
}

function importFile(file) {
  if (file.size > 250_000) {
    const notice = document.querySelector('#notice');
    if (notice) notice.textContent = 'Import rejected: files must be 250 KB or smaller.';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const candidate = JSON.parse(String(reader.result));
      const validation = validateConfiguration(candidate);
      if (!validation.valid) throw new ValidationError(validation.errors);
      state = candidate;
      activePreset = '';
      refresh('JSON imported.');
    } catch (error) {
      const notice = document.querySelector('#notice');
      if (notice) notice.textContent = error instanceof ValidationError ? `Import rejected: ${error.errors[0]}` : 'Import rejected: valid JSON is required.';
    }
  };
  reader.readAsText(file);
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

window.addEventListener('resize', () => {
  if (validateConfiguration(state).valid) drawSensitivityChart(sensitivityGrid());
});

render();
