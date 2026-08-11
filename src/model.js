/**
 * Pure, deterministic agreement calculations.
 * The model treats labels as data. It never infers their meaning.
 */

export const MAX_COMBINATIONS = 50000;
export const MAX_GROUPS = 24;
export const MAX_CLAUSES = 20;
export const MAX_OPTIONS_PER_CLAUSE = 24;
export const MAX_NEAR_MISSES = 5;
export const MAX_WEIGHT = 1_000_000;
export const MAX_CHANGE_COST = 1_000_000_000;

const EPSILON = 1e-9;

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function uniqueIds(items, path, errors) {
  const seen = new Set();
  items.forEach((item, index) => {
    if (!isPlainObject(item) || typeof item.id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(item.id)) {
      errors.push(`${path}[${index}].id must be 1 to 64 safe identifier characters.`);
      return;
    }
    if (seen.has(item.id)) errors.push(`${path}[${index}].id must be unique.`);
    seen.add(item.id);
  });
}

/** Return structured validation errors without mutating the proposal. */
export function validateProposal(proposal) {
  const errors = [];
  if (!isPlainObject(proposal)) return { valid: false, errors: ["Proposal must be an object."] };
  if (typeof proposal.title !== "string" || !proposal.title.trim() || proposal.title.trim().length > 120) errors.push("title must be a non-empty string no longer than 120 characters.");
  if (!isFiniteNumber(proposal.threshold) || proposal.threshold < 0 || proposal.threshold > 100) {
    errors.push("threshold must be a number from 0 to 100.");
  }
  if (!Array.isArray(proposal.groups) || proposal.groups.length < 1 || proposal.groups.length > MAX_GROUPS) {
    errors.push(`Between 1 and ${MAX_GROUPS} participant groups are required.`);
  } else {
    uniqueIds(proposal.groups, "groups", errors);
    proposal.groups.forEach((group, index) => {
      if (!isPlainObject(group) || typeof group.name !== "string" || !group.name.trim() || group.name.trim().length > 80) {
        errors.push(`groups[${index}].name must be a non-empty string no longer than 80 characters.`);
      }
      if (!isFiniteNumber(group?.weight) || group.weight <= 0 || group.weight > MAX_WEIGHT) {
        errors.push(`groups[${index}].weight must be greater than 0 and no more than ${MAX_WEIGHT}.`);
      }
    });
  }
  if (!Array.isArray(proposal.clauses) || proposal.clauses.length < 1 || proposal.clauses.length > MAX_CLAUSES) {
    errors.push(`Between 1 and ${MAX_CLAUSES} clauses are required.`);
  } else {
    uniqueIds(proposal.clauses, "clauses", errors);
    const groupIds = new Set(Array.isArray(proposal.groups)
      ? proposal.groups.filter(isPlainObject).map((group) => group.id).filter((id) => typeof id === "string")
      : []);
    proposal.clauses.forEach((clause, clauseIndex) => {
      if (!isPlainObject(clause) || typeof clause.title !== "string" || !clause.title.trim() || clause.title.trim().length > 120) {
        errors.push(`clauses[${clauseIndex}].title must be a non-empty string no longer than 120 characters.`);
      }
      if (!Array.isArray(clause?.options) || clause.options.length < 3 || clause.options.length > MAX_OPTIONS_PER_CLAUSE) {
        errors.push(`clauses[${clauseIndex}] needs 3 to ${MAX_OPTIONS_PER_CLAUSE} options, including one original.`);
        return;
      }
      uniqueIds(clause.options, `clauses[${clauseIndex}].options`, errors);
      let originals = 0;
      clause.options.forEach((option, optionIndex) => {
        const path = `clauses[${clauseIndex}].options[${optionIndex}]`;
        if (!isPlainObject(option) || typeof option.label !== "string" || !option.label.trim() || option.label.trim().length > 240) {
          errors.push(`${path}.label must be a non-empty string no longer than 240 characters.`);
        }
        if (option?.original === true) originals += 1;
        if (!isFiniteNumber(option?.changeCost) || option.changeCost < 0 || option.changeCost > MAX_CHANGE_COST) {
          errors.push(`${path}.changeCost must be from 0 through ${MAX_CHANGE_COST}.`);
        }
        if (!isPlainObject(option?.support)) {
          errors.push(`${path}.support must be an object.`);
        } else {
          groupIds.forEach((groupId) => {
            const score = option.support[groupId];
            if (!isFiniteNumber(score) || score < 0 || score > 100) {
              errors.push(`${path}.support.${groupId} must be a number from 0 to 100.`);
            }
          });
        }
      });
      if (originals !== 1) errors.push(`clauses[${clauseIndex}] must have exactly one original option.`);
      const original = clause.options.find((option) => option?.original === true);
      if (original && original.changeCost !== 0) errors.push(`clauses[${clauseIndex}] original option must have zero change cost.`);
    });
  }
  return { valid: errors.length === 0, errors };
}

export function getOriginalOptions(proposal) {
  return proposal.clauses.map((clause) => clause.options.find((option) => option.original === true));
}

export function approvalForOptions(groups, options) {
  const totalWeight = groups.reduce((sum, group) => sum + group.weight, 0);
  const totalSupport = groups.reduce(
    (sum, group) => sum + group.weight * options.reduce((optionSum, option) => optionSum + option.support[group.id], 0),
    0,
  );
  const maximum = totalWeight * options.length * 100;
  return maximum === 0 ? 0 : (totalSupport / maximum) * 100;
}

export function approvalByGroup(groups, options) {
  return groups.map((group) => ({
    id: group.id,
    name: group.name,
    weight: group.weight,
    approval: options.reduce((sum, option) => sum + option.support[group.id], 0) / options.length,
  }));
}

export function selectionSummary(proposal, options, baselineOptions = getOriginalOptions(proposal)) {
  const changes = options
    .map((option, index) => ({ clause: proposal.clauses[index], option, baseline: baselineOptions[index] }))
    .filter(({ option, baseline }) => option.id !== baseline.id)
    .map(({ clause, option, baseline }) => ({
      clauseId: clause.id,
      clauseTitle: clause.title,
      from: baseline.label,
      to: option.label,
      changeCost: option.changeCost,
    }));
  const groupDeltas = proposal.groups.map((group) => {
    const before = baselineOptions.reduce((sum, option) => sum + option.support[group.id], 0) / baselineOptions.length;
    const after = options.reduce((sum, option) => sum + option.support[group.id], 0) / options.length;
    return { id: group.id, name: group.name, weight: group.weight, before, after, delta: after - before };
  });
  return {
    options,
    approval: approvalForOptions(proposal.groups, options),
    byGroup: approvalByGroup(proposal.groups, options),
    changes,
    changeCost: changes.reduce((sum, change) => sum + change.changeCost, 0),
    changedClauseCount: changes.length,
    groupDeltas,
    supportersGained: groupDeltas.filter((group) => group.delta > EPSILON),
    supportersLost: groupDeltas.filter((group) => group.delta < -EPSILON),
  };
}

function compareText(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Best-first ordering for passing candidates:
 * lower cost, fewer changed clauses, higher approval, then option ids by clause order.
 */
export function compareAgreements(a, b) {
  if (Math.abs(a.changeCost - b.changeCost) > EPSILON) return a.changeCost - b.changeCost;
  if (a.changedClauseCount !== b.changedClauseCount) return a.changedClauseCount - b.changedClauseCount;
  if (Math.abs(a.approval - b.approval) > EPSILON) return b.approval - a.approval;
  for (let index = 0; index < a.options.length; index += 1) {
    const comparison = compareText(a.options[index].id, b.options[index].id);
    if (comparison !== 0) return comparison;
  }
  return 0;
}

/** Near misses prioritize closest approval gap, then the same deterministic agreement order. */
export function compareNearMisses(threshold, a, b) {
  const gapA = threshold - a.approval;
  const gapB = threshold - b.approval;
  if (Math.abs(gapA - gapB) > EPSILON) return gapA - gapB;
  return compareAgreements(a, b);
}

export function combinationCount(clauses, cap = Number.MAX_SAFE_INTEGER) {
  let count = 1;
  for (const clause of clauses) {
    const choices = clause.options.length;
    if (choices === 0 || count > Math.floor(cap / choices)) return cap + 1;
    count *= choices;
  }
  return count;
}

/**
 * Deterministically evaluates every option combination if it is within the cap.
 * It intentionally returns too_large instead of silently sampling candidates.
 */
export function findSmallestAgreement(proposal, { maxCombinations = MAX_COMBINATIONS, nearMissLimit = MAX_NEAR_MISSES } = {}) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (!Number.isSafeInteger(maxCombinations) || maxCombinations < 1 || maxCombinations > MAX_COMBINATIONS) {
    return { status: "invalid", errors: [`maxCombinations must be an integer from 1 through ${MAX_COMBINATIONS}.`] };
  }
  if (!Number.isSafeInteger(nearMissLimit) || nearMissLimit < 0 || nearMissLimit > MAX_NEAR_MISSES) {
    return { status: "invalid", errors: [`nearMissLimit must be an integer from 0 through ${MAX_NEAR_MISSES}.`] };
  }
  const possibleCombinations = combinationCount(proposal.clauses, maxCombinations);
  if (possibleCombinations > maxCombinations) {
    return { status: "too_large", possibleCombinations, maxCombinations, nearMisses: [] };
  }

  const baseline = selectionSummary(proposal, getOriginalOptions(proposal));
  if (baseline.approval + EPSILON >= proposal.threshold) {
    return { status: "already_passing", possibleCombinations, baseline, agreement: baseline, nearMisses: [] };
  }

  let best = null;
  const nearMisses = [];
  const selected = [];
  const visit = (clauseIndex) => {
    if (clauseIndex === proposal.clauses.length) {
      const summary = selectionSummary(proposal, [...selected]);
      if (summary.approval + EPSILON >= proposal.threshold) {
        if (!best || compareAgreements(summary, best) < 0) best = summary;
      } else if (nearMissLimit > 0) {
        nearMisses.push(summary);
        nearMisses.sort((a, b) => compareNearMisses(proposal.threshold, a, b));
        if (nearMisses.length > nearMissLimit) nearMisses.pop();
      }
      return;
    }
    for (const option of proposal.clauses[clauseIndex].options) {
      selected.push(option);
      visit(clauseIndex + 1);
      selected.pop();
    }
  };
  visit(0);
  const result = {
    status: best ? "found" : "infeasible",
    possibleCombinations,
    baseline,
    agreement: best,
    nearMisses,
  };
  return result;
}

export function formatPercent(value) {
  return `${Number(value).toFixed(1)}%`;
}
