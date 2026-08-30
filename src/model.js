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

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const RESERVED_IDS = new Set(["constructor", "prototype", "__proto__"]);

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function uniqueIds(items, path, errors) {
  const seen = new Set();
  items.forEach((item, index) => {
    if (!isPlainObject(item) || typeof item.id !== "string" || !ID_PATTERN.test(item.id) || RESERVED_IDS.has(item.id)) {
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
  if (typeof proposal.title !== "string" || !proposal.title.trim() || proposal.title.length > 120) errors.push("title must be a non-empty string no longer than 120 characters.");
  if (!isFiniteNumber(proposal.threshold) || proposal.threshold < 0 || proposal.threshold > 100) {
    errors.push("threshold must be a number from 0 to 100.");
  }
  if (Object.hasOwn(proposal, "maxChangeCost") && (!isFiniteNumber(proposal.maxChangeCost) || proposal.maxChangeCost < 0 || proposal.maxChangeCost > MAX_CHANGE_COST * MAX_CLAUSES)) {
    errors.push(`maxChangeCost must be from 0 through ${MAX_CHANGE_COST * MAX_CLAUSES}, or omitted.`);
  }
  if (!Array.isArray(proposal.groups) || proposal.groups.length < 1 || proposal.groups.length > MAX_GROUPS) {
    errors.push(`Between 1 and ${MAX_GROUPS} participant groups are required.`);
  } else {
    uniqueIds(proposal.groups, "groups", errors);
    proposal.groups.forEach((group, index) => {
      if (!isPlainObject(group) || typeof group.name !== "string" || !group.name.trim() || group.name.length > 80) {
        errors.push(`groups[${index}].name must be a non-empty string no longer than 80 characters.`);
      }
      if (!isFiniteNumber(group?.weight) || group.weight <= 0 || group.weight > MAX_WEIGHT) {
        errors.push(`groups[${index}].weight must be greater than 0 and no more than ${MAX_WEIGHT}.`);
      }
      if (isPlainObject(group) && Object.hasOwn(group, "minSupport") && (!isFiniteNumber(group.minSupport) || group.minSupport < 0 || group.minSupport > 100)) {
        errors.push(`groups[${index}].minSupport must be from 0 to 100, or omitted.`);
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
      if (!isPlainObject(clause) || typeof clause.title !== "string" || !clause.title.trim() || clause.title.length > 120) {
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
        if (!isPlainObject(option) || typeof option.label !== "string" || !option.label.trim() || option.label.length > 240) {
          errors.push(`${path}.label must be a non-empty string no longer than 240 characters.`);
        }
        if (isPlainObject(option) && Object.hasOwn(option, "original") && typeof option.original !== "boolean") {
          errors.push(`${path}.original must be a boolean, or omitted for an alternative.`);
        }
        if (isPlainObject(option) && Object.hasOwn(option, "original") && option.original === true) originals += 1;
        if (!isFiniteNumber(option?.changeCost) || option.changeCost < 0 || option.changeCost > MAX_CHANGE_COST) {
          errors.push(`${path}.changeCost must be from 0 through ${MAX_CHANGE_COST}.`);
        }
        if (!isPlainObject(option?.support)) {
          errors.push(`${path}.support must be an object.`);
        } else {
          groupIds.forEach((groupId) => {
            const score = Object.hasOwn(option.support, groupId) ? option.support[groupId] : undefined;
            if (!isFiniteNumber(score) || score < 0 || score > 100) {
              errors.push(`${path}.support.${groupId} must be a number from 0 to 100.`);
            }
          });
          if (Object.keys(option.support).some((key) => !groupIds.has(key))) {
            errors.push(`${path}.support may only contain the declared group ids.`);
          }
        }
      });
      if (originals !== 1) errors.push(`clauses[${clauseIndex}] must have exactly one original option.`);
      const original = clause.options.find((option) => isPlainObject(option) && Object.hasOwn(option, "original") && option.original === true);
      if (original && original.changeCost !== 0) errors.push(`clauses[${clauseIndex}] original option must have zero change cost.`);
      if (isPlainObject(clause) && Object.hasOwn(clause, "lockedOptionId") && (typeof clause.lockedOptionId !== "string" || !clause.options.some((option) => option?.id === clause.lockedOptionId))) {
        errors.push(`clauses[${clauseIndex}].lockedOptionId must identify an option in that clause, or be omitted.`);
      }
    });
  }
  return { valid: errors.length === 0, errors };
}

/** Return only the validated fields that the application understands. */
export function canonicalProposal(proposal) {
  const validation = validateProposal(proposal);
  if (!validation.valid) throw new TypeError(validation.errors[0]);
  const groupIds = proposal.groups.map(({ id }) => id);
  return {
    title: proposal.title,
    threshold: proposal.threshold,
    ...(Object.hasOwn(proposal, "maxChangeCost") ? { maxChangeCost: proposal.maxChangeCost } : {}),
    groups: proposal.groups.map((group) => ({
      id: group.id,
      name: group.name,
      weight: group.weight,
      ...(Object.hasOwn(group, "minSupport") ? { minSupport: group.minSupport } : {}),
    })),
    clauses: proposal.clauses.map((clause) => ({
      id: clause.id,
      title: clause.title,
      ...(Object.hasOwn(clause, "lockedOptionId") ? { lockedOptionId: clause.lockedOptionId } : {}),
      options: clause.options.map((option) => ({
        id: option.id,
        label: option.label,
        original: Object.hasOwn(option, "original") && option.original === true,
        changeCost: option.changeCost,
        support: Object.fromEntries(groupIds.map((groupId) => [groupId, option.support[groupId]])),
      })),
    })),
  };
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
  const byGroup = approvalByGroup(proposal.groups, options);
  const changeCost = changes.reduce((sum, change) => sum + change.changeCost, 0);
  const floors = proposal.groups.filter((group) => group.minSupport !== undefined).map((group) => {
    const actual = byGroup.find((row) => row.id === group.id).approval;
    return { id: group.id, name: group.name, minimum: group.minSupport, actual, met: actual + EPSILON >= group.minSupport };
  });
  const locks = proposal.clauses.flatMap((clause, index) => clause.lockedOptionId === undefined ? [] : [{
    clauseId: clause.id, clauseTitle: clause.title, optionId: clause.lockedOptionId,
    label: clause.options.find((option) => option.id === clause.lockedOptionId).label,
    met: options[index].id === clause.lockedOptionId,
  }]);
  const budget = proposal.maxChangeCost === undefined ? null : { maximum: proposal.maxChangeCost, actual: changeCost, met: changeCost <= proposal.maxChangeCost + EPSILON };
  return {
    options,
    approval: approvalForOptions(proposal.groups, options),
    byGroup,
    changes,
    changeCost,
    constraints: { floors, locks, budget, met: floors.every((floor) => floor.met) && locks.every((lock) => lock.met) && (!budget || budget.met) },
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
    const choices = clause.lockedOptionId === undefined ? clause.options.length : 1;
    if (choices === 0 || count > Math.floor(cap / choices)) return cap + 1;
    count *= choices;
  }
  return count;
}

/**
 * Deterministically evaluates every option combination if it is within the cap.
 * It intentionally returns too_large instead of silently sampling candidates.
 */
export function findSmallestAgreement(proposal, options = {}) {
  const validation = validateProposal(proposal);
  if (!validation.valid) return { status: "invalid", errors: validation.errors };
  if (!isPlainObject(options)) {
    return { status: "invalid", errors: ["Search options must be a plain object."] };
  }
  const unknown = Object.keys(options).filter((key) => key !== "maxCombinations" && key !== "nearMissLimit");
  if (unknown.length > 0) {
    return { status: "invalid", errors: [`Unknown search option: ${unknown.join(", ")}.`] };
  }
  const maxCombinations = Object.hasOwn(options, "maxCombinations") ? options.maxCombinations : MAX_COMBINATIONS;
  const nearMissLimit = Object.hasOwn(options, "nearMissLimit") ? options.nearMissLimit : MAX_NEAR_MISSES;
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
  if (baseline.approval + EPSILON >= proposal.threshold && baseline.constraints.met) {
    return { status: "already_passing", possibleCombinations, checkedCombinations: 1, baseline, agreement: baseline, nearMisses: [], rejected: { budget: 0, floors: 0, anyConstraint: 0 }, eligibleCombinations: 1 };
  }

  let best = null;
  const nearMisses = [];
  const rejected = { budget: 0, floors: 0, anyConstraint: 0 };
  let eligibleCombinations = 0;
  const selected = [];
  const visit = (clauseIndex) => {
    if (clauseIndex === proposal.clauses.length) {
      const summary = selectionSummary(proposal, [...selected]);
      if (!summary.constraints.met) {
        rejected.anyConstraint += 1;
        if (summary.constraints.budget && !summary.constraints.budget.met) rejected.budget += 1;
        if (summary.constraints.floors.some((floor) => !floor.met)) rejected.floors += 1;
        return;
      }
      eligibleCombinations += 1;
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
      if (proposal.clauses[clauseIndex].lockedOptionId !== undefined && option.id !== proposal.clauses[clauseIndex].lockedOptionId) continue;
      selected.push(option);
      visit(clauseIndex + 1);
      selected.pop();
    }
  };
  visit(0);
  const result = {
    status: best ? "found" : "infeasible",
    possibleCombinations,
    checkedCombinations: possibleCombinations,
    eligibleCombinations,
    rejected,
    baseline,
    agreement: best,
    nearMisses,
  };
  return result;
}

export function formatPercent(value) {
  return `${Number(value).toFixed(1)}%`;
}

function briefText(value) {
  return String(value ?? "")
    .replace(/[\r\n|]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replace(/([\\`*_{}\[\]()#+.!])/gu, "\\$1") || "(unnamed)";
}

function briefOption(value) {
  return `\"${briefText(value)}\"`;
}

/**
 * Produce a deterministic Markdown handoff for a result that people can review outside the GUI.
 * The brief reports the model output and inputs, but never claims legitimacy or authority.
 */
export function formatDecisionBrief(proposal, result) {
  const title = briefText(proposal?.title) || "Untitled proposal";
  const threshold = Number.isFinite(proposal?.threshold) ? formatPercent(proposal.threshold) : "unknown";
  const lines = [
    "# The Smallest Agreement",
    "",
    `Proposal: ${title}`,
    `Approval threshold: ${threshold}`,
    "",
  ];

  if (!result || result.status === "invalid") {
    lines.push("## Result", "", "The draft is not valid enough to evaluate.", "");
    for (const error of result?.errors ?? ["No result was available."]) lines.push(`- ${briefText(error)}`);
    lines.push("");
    return `${lines.join("\n")}Scores, weights, and costs remain human inputs.\n`;
  }

  lines.push("## Search constraints", "", `Maximum total change cost: ${proposal.maxChangeCost === undefined ? "unlimited" : proposal.maxChangeCost}`, "");
  const protectedGroups = proposal.groups.filter((group) => group.minSupport !== undefined);
  if (!protectedGroups.length) lines.push("No group support floors set.");
  for (const group of protectedGroups) lines.push(`- ${briefText(group.name)}: average support must be at least ${group.minSupport}%.`);
  const lockedClauses = proposal.clauses.filter((clause) => clause.lockedOptionId !== undefined);
  if (!lockedClauses.length) lines.push("No clause options locked.");
  for (const clause of lockedClauses) lines.push(`- Lock ${briefText(clause.title)} to ${briefOption(clause.options.find((option) => option.id === clause.lockedOptionId).label)}.`);
  lines.push("");

  if (result.status === "too_large") {
    lines.push("## Result", "", `The exhaustive search stopped above ${Number(result.maxCombinations).toLocaleString("en-US")} combinations.`, "", "Reduce alternatives or clauses before relying on a recommendation.", "");
    return `${lines.join("\n")}Scores, weights, and costs remain human inputs.\n`;
  }

  const current = result.baseline;
  const agreement = result.agreement;
  lines.push("## Result", "");
  if (result.status === "already_passing") lines.push("The original proposal crosses the threshold and meets every constraint. No change is needed.", "");
  else if (result.status === "found") lines.push("A lowest-cost passing combination was found.", "Every configured constraint is met.", "");
  else lines.push("No permitted combination meets both the threshold and every configured constraint.", "");
  lines.push(`Search combinations checked: ${Number(result.checkedCombinations).toLocaleString("en-US")}`, `Lock-permitted search space: ${Number(result.possibleCombinations).toLocaleString("en-US")}`);
  if (result.status !== "already_passing") lines.push(`Constraint-compliant combinations: ${result.eligibleCombinations}`, `Rejected by budget: ${result.rejected.budget}; by group floors: ${result.rejected.floors}. Rejection counts may overlap.`);
  lines.push(`Current approval: ${formatPercent(current.approval)}`, `Original proposal meets constraints: ${current.constraints.met ? "yes" : "no"}`);

  if (agreement) {
    lines.push(`Recommended approval: ${formatPercent(agreement.approval)}`, `Total change cost: ${agreement.changeCost.toFixed(1)}`, `Changed clauses: ${agreement.changedClauseCount}`, "");
    lines.push("## Recommendation", "");
    if (agreement.changes.length) {
      for (const change of agreement.changes) {
        lines.push(`- ${briefText(change.clauseTitle)}: ${briefOption(change.from)} => ${briefOption(change.to)} (cost ${change.changeCost.toFixed(1)})`);
      }
    } else {
      lines.push("- Keep every original option.");
    }
    lines.push("");
  } else {
    lines.push("", "## Recommendation", "", "No passing combination was found.", "");
  }

  lines.push("## Group view", "", "| Group | Weight | Current | Recommended | Change |", "| --- | ---: | ---: | ---: | ---: |");
  for (const group of current.byGroup) {
    const after = agreement?.byGroup.find((candidate) => candidate.id === group.id)?.approval;
    const recommended = Number.isFinite(after) ? formatPercent(after) : "not found";
    const delta = Number.isFinite(after) ? `${after - group.approval >= 0 ? "+" : ""}${(after - group.approval).toFixed(1)} points` : "not found";
    lines.push(`| ${briefText(group.name)} | ${group.weight} | ${formatPercent(group.approval)} | ${recommended} | ${delta} |`);
  }
  lines.push("");

  if (agreement && protectedGroups.length) {
    lines.push("## Protected-group checks", "");
    for (const floor of agreement.constraints.floors) lines.push(`- ${briefText(floor.name)}: ${formatPercent(floor.actual)} against minimum ${floor.minimum}%, ${floor.met ? "met" : "not met"}.`);
    lines.push("");
  }

  if (result.nearMisses?.length) {
    lines.push("## Near misses", "", "These meet every configured constraint but fall below the overall threshold.", "");
    for (const miss of result.nearMisses) {
      const labels = miss.changes.length ? miss.changes.map((change) => `${briefText(change.clauseTitle)}: ${briefText(change.to)}`).join("; ") : "Keep every original option";
      lines.push(`- ${formatPercent(miss.approval)}, short by ${(proposal.threshold - miss.approval).toFixed(1)} points, cost ${miss.changeCost.toFixed(1)}: ${labels}`);
    }
    lines.push("");
  }
  lines.push("Scores, weights, and costs remain human inputs. This brief is a deliberation aid, not a decision or a claim of legitimacy.");
  return `${lines.join("\n")}\n`;
}
