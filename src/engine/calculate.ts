import type {
  CaseInput,
  CaseResult,
  CountInput,
  CountResult,
  Flag,
  MonthRange,
  Step,
} from './types';
import { EDITION } from './data/edition';
import { getGuideline } from './data/guidelines';
import { cautionsFor, type JurisdictionCaution } from './data/districts';
import { clampOffenseLevel, lookupRange } from './data/sentencing-table';
import { computeCount, guidelineForCount, type Chapter2Context } from './chapter2';
import { applyAcceptance, applyChapter3 } from './chapter3';
import { combinedOffenseLevel, computeGroupLevels, proposeGroups } from './grouping';
import { computeCriminalHistory } from './chapter4';
import {
  applyStatutoryLimits,
  buildLadder,
  computeChapter5,
  computeStatutory,
  estimateTimeToServe,
  penaltyForCount,
  safetyValveSatisfied,
} from './chapter5';

/**
 * Merge the counts in a § 3D1.2(d) group into one synthetic count so the offense
 * level is computed on the aggregated quantity, as § 3D1.3(b) requires. The
 * characteristics come from the count that scored highest on its own — the
 * closest defensible reading when the counts carry different characteristics.
 */
function mergeQuantityGroup(members: readonly CountInput[], driver: CountInput): CountInput {
  const drugs = members.flatMap((c) => c.drugs ?? []);
  const actual = members.reduce((sum, c) => sum + (c.loss?.actualLoss ?? 0), 0);
  const intended = members.reduce((sum, c) => sum + (c.loss?.intendedLoss ?? 0), 0);
  const gain = members.reduce((sum, c) => sum + (c.loss?.gain ?? 0), 0);
  const credits = members.flatMap((c) => c.loss?.credits ?? []);
  const benefit = members.reduce((sum, c) => sum + (c.benefitValue ?? 0), 0);

  return {
    ...driver,
    drugs: drugs.length ? drugs : undefined,
    loss:
      actual || intended || gain || credits.length
        ? {
            actualLoss: actual || undefined,
            intendedLoss: intended || undefined,
            gain: gain || undefined,
            credits: credits.length ? credits : undefined,
          }
        : undefined,
    benefitValue: benefit || undefined,
  };
}

export function calculate(input: CaseInput): CaseResult {
  const flags: Flag[] = [];
  const finalSteps: Step[] = [];

  // --- § 1B1.11 ex post facto check ---------------------------------------
  if (input.offenseDate && input.offenseDate < EDITION.effectiveDate) {
    flags.push({
      severity: 'warning',
      code: 'ex-post-facto',
      message: `The offense date precedes the effective date of the ${EDITION.name} (${EDITION.effectiveDate}). Under § 1B1.11(b)(1) the court uses the manual in effect at sentencing unless doing so would violate the Ex Post Facto Clause, in which case the offense-date manual applies. This build encodes only one edition — check the comparison by hand.`,
      citation: '§ 1B1.11',
    });
  }

  const svSatisfied = safetyValveSatisfied(input);
  const hasWeaponConsecutiveCount = input.counts.some(
    (c) => getGuideline(c.guidelineOverride ?? '').section === '2K2.4' || isSection924c(c),
  );

  // --- Chapter 2 and per-count Chapter 3 ----------------------------------
  const countResults: CountResult[] = [];
  let terrorismApplied = false;
  let obstructionApplied = false;

  for (const count of input.counts) {
    const ctx: Chapter2Context = {
      hasConsecutiveWeaponCount: hasWeaponConsecutiveCount,
      safetyValveSatisfied: svSatisfied,
      mitigatingRole: Boolean(
        count.chapter3.mitigatingRole && count.chapter3.mitigatingRole !== 'none',
      ),
      mitigatingRoleMinimal: count.chapter3.mitigatingRole === 'minimal',
    };
    const chapter2 = computeCount(count, ctx);

    if (chapter2.excludedFromGrouping) {
      countResults.push(chapter2);
      continue;
    }

    const chapter3 = applyChapter3(chapter2.adjustedOffenseLevel, count.chapter3);
    terrorismApplied ||= chapter3.terrorismApplied;
    obstructionApplied ||= Boolean(count.chapter3.obstruction);

    // The § 2D1.1(b)(1) weapon enhancement is in tension with the safety valve.
    if (svSatisfied && count.socs.some((s) => s.id === 'weapon')) {
      chapter3.flags.push({
        severity: 'warning',
        code: 'weapon-vs-safety-valve',
        message:
          'A § 2D1.1(b)(1) weapon enhancement is applied while the safety valve is claimed. 18 U.S.C. § 3553(f)(2) requires that the defendant did not possess a firearm in connection with the offense — the two are difficult to reconcile.',
        citation: '§ 2D1.1(b)(1); 18 U.S.C. § 3553(f)(2)',
      });
    }

    countResults.push({
      ...chapter2,
      steps: [...chapter2.steps, ...chapter3.steps],
      adjustedOffenseLevel: chapter3.level,
      flags: [...chapter2.flags, ...chapter3.flags],
    });
  }

  // --- § 3D grouping -------------------------------------------------------
  const groupingProposed = !input.groups || input.groups.length === 0;
  const groups = groupingProposed ? proposeGroups(input.counts, countResults) : input.groups!;

  // § 3D1.3(b): recompute quantity groups on the aggregate.
  const aggregatedLevels = new Map<string, number>();
  const countById = new Map(input.counts.map((c) => [c.id, c]));
  const resultById = new Map(countResults.map((r) => [r.countId, r]));

  for (const group of groups) {
    if (group.countIds.length < 2) continue;
    const members = group.countIds
      .map((id) => countById.get(id))
      .filter((c): c is CountInput => c !== undefined);
    if (members.length < 2) continue;

    const guideline = getGuideline(resultById.get(members[0]!.id)?.guideline ?? '');
    if (!guideline.groupsByQuantity || guideline.quantityDriver === 'none') continue;

    const driver = members.reduce((best, c) =>
      (resultById.get(c.id)?.adjustedOffenseLevel ?? 0) >
      (resultById.get(best.id)?.adjustedOffenseLevel ?? 0)
        ? c
        : best,
    );
    const merged = mergeQuantityGroup(members, driver);
    const chapter2 = computeCount(merged, {
      hasConsecutiveWeaponCount: hasWeaponConsecutiveCount,
      safetyValveSatisfied: svSatisfied,
      mitigatingRole: Boolean(driver.chapter3.mitigatingRole && driver.chapter3.mitigatingRole !== 'none'),
      mitigatingRoleMinimal: driver.chapter3.mitigatingRole === 'minimal',
    });
    const chapter3 = applyChapter3(chapter2.adjustedOffenseLevel, driver.chapter3);
    aggregatedLevels.set(group.id, chapter3.level);

    flags.push({
      severity: 'info',
      code: 'aggregated-group',
      message: `Counts in this group were aggregated under § 3D1.3(b): the group's offense level of ${chapter3.level} is computed on the combined quantity, not on any single count.`,
      citation: '§ 3D1.3(b)',
    });
  }

  const { groupResults, steps: groupingSteps, flags: groupingFlags } = computeGroupLevels(
    groups,
    countResults,
    aggregatedLevels,
  );
  flags.push(...groupingFlags);

  const combined = combinedOffenseLevel(groupResults);

  // --- Chapter 4 -----------------------------------------------------------
  const groupedCounts = input.counts.filter((c) => !c.consecutiveMandatory);
  const instantMax = groupedCounts.reduce<number | null>((best, c) => {
    const p = penaltyForCount(c);
    if (p.maxMonths === null) return null;
    return best === null ? null : Math.max(best, p.maxMonths);
  }, 0);

  const criminalHistory = computeCriminalHistory(input.criminalHistory, {
    offenseDate: input.offenseDate,
    instantStatutoryMaxMonths: instantMax,
    offenseLevelBeforeChapter4: combined,
    terrorismApplied,
  });

  let level = combined;

  if (criminalHistory.offenseLevelFloor !== null && criminalHistory.offenseLevelFloor > level) {
    finalSteps.push({
      kind: 'chapter4',
      label: `Chapter Four offense level of ${criminalHistory.offenseLevelFloor} exceeds the otherwise applicable level of ${level}`,
      citation: criminalHistory.floorCitation ?? '§ 4B1.1(b)',
      levels: criminalHistory.offenseLevelFloor - level,
    });
    level = criminalHistory.offenseLevelFloor;
  }

  if (criminalHistory.zeroPointApplies) {
    finalSteps.push({
      kind: 'chapter4',
      label: 'Zero-point offender reduction',
      citation: '§ 4C1.1',
      levels: -2,
    });
    level -= 2;
  }

  // --- § 3E1.1 acceptance ---------------------------------------------------
  const acceptance = applyAcceptance(clampOffenseLevel(level), input.acceptance, obstructionApplied);
  finalSteps.push(...acceptance.steps);
  flags.push(...acceptance.flags);
  const totalOffenseLevel = acceptance.level;

  // --- Sentencing Table -----------------------------------------------------
  const tableRange = lookupRange(totalOffenseLevel, criminalHistory.category);

  // --- Statutory overlay ----------------------------------------------------
  const statutory = computeStatutory(input.counts, svSatisfied);
  flags.push(...statutory.flags);

  const clamped = applyStatutoryLimits(tableRange, statutory);
  flags.push(...clamped.flags);
  const guidelineRange = clamped.range;

  // --- Chapter 5 ------------------------------------------------------------
  const chapter5 = computeChapter5(totalOffenseLevel, guidelineRange, statutory, groupedCounts);

  // --- Ladder ---------------------------------------------------------------
  const ladder = buildLadder(
    guidelineRange,
    resolveDepartures(input, guidelineRange, criminalHistory.category),
    input.variance?.targetMonths,
  );

  // --- Grouped counts, consecutive terms, aggregate -------------------------
  const consecutiveMonths = statutory.consecutiveTotalMonths;
  const aggregate = {
    groupedCountsRange: guidelineRange,
    consecutiveMonths,
    totalRange: {
      min: guidelineRange.min + consecutiveMonths,
      max: guidelineRange.max === null ? null : guidelineRange.max + consecutiveMonths,
    } satisfies MonthRange,
  };

  // --- BOP estimate ---------------------------------------------------------
  const bopEstimate = input.bopCredits
    ? estimateTimeToServe(aggregate.totalRange, Boolean(input.bopCredits.firstStepActEligible))
    : undefined;

  // --- Plea comparison ------------------------------------------------------
  let plea: CaseResult['plea'];
  if (input.plea?.stipulatedOffenseLevel !== undefined) {
    const stipLevel = clampOffenseLevel(input.plea.stipulatedOffenseLevel);
    const stipCategory = input.plea.stipulatedCategory ?? criminalHistory.category;
    const stipulatedRange = lookupRange(stipLevel, stipCategory);
    plea = {
      stipulatedRange,
      stipulatedLevel: stipLevel,
      stipulatedCategory: stipCategory,
      gapMonths: {
        min: guidelineRange.min - stipulatedRange.min,
        max:
          guidelineRange.max === null || stipulatedRange.max === null
            ? null
            : guidelineRange.max - stipulatedRange.max,
      },
    };
  }

  // --- Jurisdiction cautions ------------------------------------------------
  const concerns: JurisdictionCaution['appliesWhen'][] = ['always'];
  const usesSection2B11LossTable = input.counts.some((c) => {
    if (!c.loss && c.benefitValue === undefined) return false;
    const g = getGuideline(c.guidelineOverride ?? guidelineForCount(c).guideline.section);
    return (g.quantityDriver === 'loss' || g.quantityDriver === 'benefit') && !g.ownLossTable;
  });
  if (usesSection2B11LossTable) concerns.push('loss');
  if (criminalHistory.careerOffenderApplies) concerns.push('careerOffender');
  if (criminalHistory.accaApplies) concerns.push('acca');
  if (input.departures?.some((d) => d.citation.includes('5K3.1'))) concerns.push('fastTrack');

  for (const caution of cautionsFor(input.districtId, concerns)) {
    flags.push({
      severity: 'caution',
      code: caution.code,
      message: caution.message,
      citation: caution.citation,
    });
  }

  return {
    edition: EDITION.name,
    computedAt: new Date().toISOString(),
    counts: countResults,
    groups: groupResults,
    groupingProposed,
    combinedOffenseLevel: combined,
    groupingSteps,
    totalOffenseLevel,
    finalSteps,
    criminalHistory,
    tableRange,
    guidelineRange,
    statutory,
    chapter5,
    ladder,
    aggregate,
    bopEstimate,
    plea,
    flags: dedupeFlags([
      ...flags,
      ...criminalHistory.flags,
      ...countResults.flatMap((c) => c.flags),
    ]),
  };
}

/**
 * Per-count flags have to reach the top-level list or a warning is invisible
 * outside the count that produced it. Identical warnings raised on several counts
 * collapse to one so the results rail stays readable.
 */
function dedupeFlags(all: readonly Flag[]): Flag[] {
  const seen = new Set<string>();
  const out: Flag[] = [];
  for (const flag of all) {
    const key = `${flag.code}|${flag.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(flag);
  }
  return out;
}

/**
 * A level departure has to be resolved against the Sentencing Table, not
 * subtracted from months. This converts each into the equivalent months so the
 * ladder can present one consistent arithmetic.
 */
function resolveDepartures(
  input: CaseInput,
  range: MonthRange,
  category: CaseResult['criminalHistory']['category'],
) {
  const departures = input.departures ?? [];
  return departures.map((d) => {
    if (d.kind !== 'levels') return d;
    // Resolved by the caller against the table; express the drop in months.
    const from = range.min;
    const to = lookupRange(
      clampOffenseLevel(levelForRange(range, category) - d.amount),
      category,
    ).min;
    return { ...d, kind: 'months' as const, amount: Math.max(0, from - to) };
  });
}

/** Recover the offense level that produced a range, for level-based departures. */
function levelForRange(range: MonthRange, category: CaseResult['criminalHistory']['category']): number {
  for (let level = 1; level <= 43; level += 1) {
    const candidate = lookupRange(level, category);
    if (candidate.min === range.min && candidate.max === range.max) return level;
  }
  return 43;
}

function isSection924c(count: CountInput): boolean {
  return count.statuteId === '18:924(c)';
}
