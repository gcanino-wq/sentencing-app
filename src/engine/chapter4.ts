import type {
  CriminalHistoryCategory,
  CriminalHistoryInput,
  CriminalHistoryResult,
  Flag,
  PriorConviction,
  Step,
  ZeroPointCriterion,
} from './types';
import { categoryForPoints } from './data/sentencing-table';
import { careerOffenderLevel } from './data/tables';

/** § 4A1.1(a) threshold — a sentence of imprisonment exceeding one year and one month. */
const THREE_POINT_THRESHOLD_MONTHS = 13;
/** § 4A1.1(b) threshold — at least sixty days. */
const TWO_POINT_THRESHOLD_MONTHS = 2;

export const ZERO_POINT_CRITERIA: { id: ZeroPointCriterion; label: string; citation: string }[] = [
  { id: 'noCriminalHistoryPoints', label: 'Did not receive any criminal history points', citation: '§ 4C1.1(a)(1)' },
  { id: 'noTerrorismAdjustment', label: 'Did not receive a § 3A1.4 terrorism adjustment', citation: '§ 4C1.1(a)(2)' },
  { id: 'noViolenceOrThreats', label: 'Did not use violence or credible threats of violence', citation: '§ 4C1.1(a)(3)' },
  { id: 'noDeathOrSeriousInjury', label: 'The offense did not result in death or serious bodily injury', citation: '§ 4C1.1(a)(4)' },
  { id: 'notSexOffense', label: 'The instant offense is not a sex offense', citation: '§ 4C1.1(a)(5)' },
  { id: 'noSubstantialFinancialHardship', label: 'Did not personally cause substantial financial hardship', citation: '§ 4C1.1(a)(6)' },
  { id: 'noFirearmInConnection', label: 'Did not possess, receive, purchase, transport, transfer, sell, or dispose of a firearm or dangerous weapon in connection with the offense, or induce another participant to do so', citation: '§ 4C1.1(a)(7)' },
  { id: 'notCivilRightsOffense', label: 'The instant offense is not covered by § 2H1.1', citation: '§ 4C1.1(a)(8)' },
  { id: 'noHateCrimeOrVulnerableVictim', label: 'Did not receive a § 3A1.1 hate crime or vulnerable victim adjustment, or a § 3A1.5 serious human rights offense adjustment', citation: '§ 4C1.1(a)(9)' },
  { id: 'noAggravatingRole', label: 'Did not receive a § 3B1.1 aggravating role adjustment', citation: '§ 4C1.1(a)(10)' },
  { id: 'notEngagedInCCE', label: 'Was not engaged in a continuing criminal enterprise, as defined in 21 U.S.C. § 848', citation: '§ 4C1.1(a)(11)' },
];

function yearsBetween(fromIso: string | undefined, toIso: string | undefined): number | null {
  if (!fromIso || !toIso) return null;
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) return null;
  return (to - from) / (365.2425 * 24 * 60 * 60 * 1000);
}

/**
 * § 4A1.2(e) applicable time period. Returns whether the prior counts, and why.
 * Where the dates needed to decide are missing, the prior is counted and the
 * caller is told the time limit could not be checked — the app never silently
 * drops a prior.
 */
function withinTimeLimit(
  prior: PriorConviction,
  offenseDate: string | undefined,
): { counts: boolean; reason: string; uncertain: boolean } {
  if (!offenseDate) {
    return {
      counts: true,
      reason: 'Instant offense date not entered — § 4A1.2(e) time limits not checked.',
      uncertain: true,
    };
  }
  const isThreePoint = prior.sentenceImposedMonths > THREE_POINT_THRESHOLD_MONTHS;

  const sinceSentence = yearsBetween(prior.sentenceDate, offenseDate);
  const sinceRelease = yearsBetween(prior.releaseDate, offenseDate);

  if (sinceSentence === null && sinceRelease === null) {
    return {
      counts: true,
      reason: 'No sentence or release date entered — § 4A1.2(e) time limits not checked.',
      uncertain: true,
    };
  }

  if (isThreePoint) {
    // § 4A1.2(e)(1): imposed within 15 years, or incarceration during that period.
    if (sinceSentence !== null && sinceSentence <= 15) {
      return { counts: true, reason: 'Sentence imposed within 15 years. § 4A1.2(e)(1).', uncertain: false };
    }
    if (sinceRelease !== null && sinceRelease <= 15) {
      return {
        counts: true,
        reason: 'Incarceration on this sentence fell within the 15-year period. § 4A1.2(e)(1).',
        uncertain: false,
      };
    }
    return { counts: false, reason: 'Outside the 15-year period. § 4A1.2(e)(3).', uncertain: false };
  }

  // § 4A1.2(e)(2): any other prior sentence, imposed within 10 years.
  if (sinceSentence !== null && sinceSentence <= 10) {
    return { counts: true, reason: 'Sentence imposed within 10 years. § 4A1.2(e)(2).', uncertain: false };
  }
  return { counts: false, reason: 'Outside the 10-year period. § 4A1.2(e)(3).', uncertain: false };
}

/** Cluster priors treated as a single sentence under § 4A1.2(a)(2). */
function clusterPriors(priors: readonly PriorConviction[]): PriorConviction[][] {
  const byId = new Map(priors.map((p) => [p.id, p]));
  const clusterOf = new Map<string, string>();

  const root = (id: string): string => {
    let current = id;
    const seen = new Set<string>();
    while (true) {
      const parent = byId.get(current)?.singleSentenceWith;
      if (!parent || !byId.has(parent) || seen.has(parent)) return current;
      seen.add(parent);
      current = parent;
    }
  };

  for (const prior of priors) clusterOf.set(prior.id, root(prior.id));

  const clusters = new Map<string, PriorConviction[]>();
  for (const prior of priors) {
    const key = clusterOf.get(prior.id)!;
    const bucket = clusters.get(key) ?? [];
    bucket.push(prior);
    clusters.set(key, bucket);
  }
  return [...clusters.values()];
}

export interface Chapter4Options {
  offenseDate?: string;
  /** Statutory maximum for the instant offense, driving the § 4B1.1(b) table. */
  instantStatutoryMaxMonths: number | null;
  /** Level before any Chapter 4 floor. */
  offenseLevelBeforeChapter4: number;
  /** § 3A1.4 was applied, which forces Category VI. */
  terrorismApplied: boolean;
}

export function computeCriminalHistory(
  input: CriminalHistoryInput,
  options: Chapter4Options,
): CriminalHistoryResult & { offenseLevelFloor: number | null; floorCitation?: string } {
  const steps: Step[] = [];
  const flags: Flag[] = [];
  let points = 0;
  let capped1Point = 0;
  let violentSingleSentencePoints = 0;

  const clusters = clusterPriors(input.priors.filter((p) => !p.excludeFromScoring));

  for (const cluster of clusters) {
    // § 4A1.2(a)(2): a single sentence is scored once, using the longest term.
    const scored = cluster.reduce((longest, p) =>
      p.sentenceImposedMonths > longest.sentenceImposedMonths ? p : longest,
    );
    const limit = withinTimeLimit(scored, options.offenseDate);

    if (!limit.counts) {
      steps.push({
        kind: 'chapter4',
        label: `${scored.description} — not counted`,
        citation: '§ 4A1.2(e)',
        levels: 0,
        suppressed: true,
        detail: limit.reason,
      });
      continue;
    }

    if (limit.uncertain) {
      flags.push({
        severity: 'caution',
        code: 'time-limit-unchecked',
        message: `${scored.description}: ${limit.reason}`,
        citation: '§ 4A1.2(e)',
      });
    }

    let awarded: number;
    let citation: string;
    if (scored.juvenile) {
      // § 4A1.2(d) — juvenile offenses use a shorter window and lower points.
      const sinceRelease = yearsBetween(scored.releaseDate ?? scored.sentenceDate, options.offenseDate);
      if (scored.sentenceImposedMonths > THREE_POINT_THRESHOLD_MONTHS) {
        awarded = 3;
        citation = '§ 4A1.2(d)(1)';
      } else if (scored.sentenceImposedMonths >= TWO_POINT_THRESHOLD_MONTHS) {
        awarded = sinceRelease !== null && sinceRelease > 5 ? 0 : 2;
        citation = '§ 4A1.2(d)(2)(A)';
      } else {
        awarded = sinceRelease !== null && sinceRelease > 5 ? 0 : 1;
        citation = '§ 4A1.2(d)(2)(B)';
      }
      if (awarded === 0) {
        steps.push({
          kind: 'chapter4',
          label: `${scored.description} — juvenile sentence outside the 5-year window`,
          citation: '§ 4A1.2(d)(2)',
          levels: 0,
          suppressed: true,
        });
        continue;
      }
    } else if (scored.sentenceImposedMonths > THREE_POINT_THRESHOLD_MONTHS) {
      awarded = 3;
      citation = '§ 4A1.1(a)';
    } else if (scored.sentenceImposedMonths >= TWO_POINT_THRESHOLD_MONTHS) {
      awarded = 2;
      citation = '§ 4A1.1(b)';
    } else {
      awarded = 1;
      citation = '§ 4A1.1(c)';
      if (capped1Point >= 4) {
        steps.push({
          kind: 'chapter4',
          label: `${scored.description} — 1-point cap reached`,
          citation: '§ 4A1.1(c)',
          levels: 0,
          suppressed: true,
          detail: 'No more than 4 points total may be added under § 4A1.1(c).',
        });
        continue;
      }
      capped1Point += 1;
    }

    points += awarded;
    steps.push({
      kind: 'chapter4',
      label: `${scored.description} — ${scored.sentenceImposedMonths} month sentence`,
      citation,
      levels: awarded,
      detail:
        cluster.length > 1
          ? `Treated as a single sentence with ${cluster.length - 1} other prior(s) under § 4A1.2(a)(2); scored on the longest term.`
          : limit.reason,
    });

    // § 4A1.1(d): 1 point for each crime of violence in the cluster that got no
    // points because of the single-sentence rule, up to 3.
    for (const member of cluster) {
      if (member.id === scored.id) continue;
      if (!member.crimeOfViolence) continue;
      if (violentSingleSentencePoints >= 3) break;
      violentSingleSentencePoints += 1;
      points += 1;
      steps.push({
        kind: 'chapter4',
        label: `${member.description} — crime of violence within a single sentence`,
        citation: '§ 4A1.1(d)',
        levels: 1,
      });
    }
  }

  // § 4A1.1(e): status point, post-Amendment 821 — only at 7 or more points.
  if (input.underCriminalJusticeSentence) {
    if (points >= 7) {
      points += 1;
      steps.push({
        kind: 'chapter4',
        label: 'Committed the instant offense while under a criminal justice sentence',
        citation: '§ 4A1.1(e)',
        levels: 1,
      });
    } else {
      steps.push({
        kind: 'chapter4',
        label: 'Status point',
        citation: '§ 4A1.1(e)',
        levels: 0,
        suppressed: true,
        detail: `Not applied — § 4A1.1(e) requires 7 or more points under subsections (a) through (d); the total is ${points}. (Amendment 821.)`,
      });
    }
  }

  let category: CriminalHistoryCategory = categoryForPoints(points);
  let categoryOverriddenBy: string | undefined;
  let offenseLevelFloor: number | null = null;
  let floorCitation: string | undefined;

  // --- § 4B1.1 career offender ---------------------------------------------
  const qualifyingPriors = input.priors.filter(
    (p) => p.crimeOfViolence || p.controlledSubstanceOffense,
  );
  const careerOffenderApplies = Boolean(
    input.careerOffender?.claimed &&
      input.careerOffender.ageAtLeast18 !== false &&
      input.careerOffender.instantOffenseQualifies !== false &&
      qualifyingPriors.length >= 2,
  );

  if (input.careerOffender?.claimed && !careerOffenderApplies) {
    flags.push({
      severity: 'caution',
      code: 'career-offender-incomplete',
      message: `Career offender is claimed but the § 4B1.1(a) criteria are not all satisfied — ${qualifyingPriors.length} qualifying prior(s) flagged, and two are required.`,
      citation: '§ 4B1.1(a)',
    });
  }

  if (careerOffenderApplies) {
    const tableLevel = careerOffenderLevel(options.instantStatutoryMaxMonths);
    offenseLevelFloor = tableLevel;
    floorCitation = '§ 4B1.1(b)';
    category = 6;
    categoryOverriddenBy = '§ 4B1.1(b)';
    steps.push({
      kind: 'chapter4',
      label: 'Career offender — Criminal History Category set at VI',
      citation: '§ 4B1.1(b)',
      levels: 0,
      detail: `Offense level from the § 4B1.1(b) table is ${tableLevel}, applied if greater than the otherwise applicable level.`,
    });
    flags.push({
      severity: 'warning',
      code: 'career-offender-categorical',
      message:
        'Whether each prior qualifies as a crime of violence or controlled substance offense is a categorical question decided by the elements of the prior offense. This app applies the flags you set; it does not decide them.',
      citation: '§ 4B1.2',
    });
  }

  // --- § 4B1.4 / 18 U.S.C. § 924(e) armed career criminal ------------------
  const accaPriors = input.priors.filter((p) => p.accaViolentFelony || p.accaSeriousDrugOffense);
  const accaApplies = Boolean(input.acca?.claimed && accaPriors.length >= 3);

  if (input.acca?.claimed && !accaApplies) {
    flags.push({
      severity: 'caution',
      code: 'acca-incomplete',
      message: `ACCA is claimed but only ${accaPriors.length} qualifying predicate(s) are flagged; § 924(e) requires three.`,
      citation: '18 U.S.C. § 924(e)',
    });
  }

  if (accaApplies) {
    offenseLevelFloor = Math.max(offenseLevelFloor ?? 0, 33);
    floorCitation = '§ 4B1.4(b)(3)(B)';
    if (category < 4) {
      category = 4;
      categoryOverriddenBy = '§ 4B1.4(c)(3)';
    }
    steps.push({
      kind: 'chapter4',
      label: 'Armed career criminal — offense level floor of 33, Criminal History Category floor of IV',
      citation: '§ 4B1.4',
      levels: 0,
      detail:
        'Level 34 and Category VI apply instead where the firearm was used or possessed in connection with a crime of violence or controlled substance offense. § 4B1.4(b)(3)(A), (c)(2).',
    });
    flags.push({
      severity: 'warning',
      code: 'acca-occasions',
      message:
        'ACCA requires that the three predicates were committed on occasions different from one another — a jury question after Erlinger. Confirm how it was charged and found.',
      citation: '18 U.S.C. § 924(e)',
    });
  }

  // --- § 3A1.4 terrorism ----------------------------------------------------
  if (options.terrorismApplied && category !== 6) {
    category = 6;
    categoryOverriddenBy = '§ 3A1.4(b)';
    steps.push({
      kind: 'chapter4',
      label: 'Terrorism adjustment — Criminal History Category set at VI',
      citation: '§ 3A1.4(b)',
      levels: 0,
    });
  }

  // --- § 4C1.1 zero-point offender -----------------------------------------
  const selections = input.zeroPointOffender ?? {};
  const allCriteriaMet =
    points === 0 && ZERO_POINT_CRITERIA.every((c) => selections[c.id] === true);
  const anySelected = Object.values(selections).some(Boolean);

  if (allCriteriaMet && !careerOffenderApplies && !accaApplies) {
    steps.push({
      kind: 'chapter4',
      label: 'Zero-point offender — all § 4C1.1(a) criteria satisfied',
      citation: '§ 4C1.1',
      levels: -2,
    });
  } else if (anySelected && points === 0) {
    const missing = ZERO_POINT_CRITERIA.filter((c) => selections[c.id] !== true);
    flags.push({
      severity: 'info',
      code: 'zero-point-incomplete',
      message: `The § 4C1.1 reduction is not applied — ${missing.length} criteri${missing.length === 1 ? 'on is' : 'a are'} unconfirmed: ${missing.map((m) => m.citation).join(', ')}.`,
      citation: '§ 4C1.1(a)',
    });
  }

  // --- Explicit override ----------------------------------------------------
  if (input.categoryOverride) {
    steps.push({
      kind: 'chapter4',
      label: `Criminal History Category set manually to ${'I II III IV V VI'.split(' ')[input.categoryOverride - 1]}`,
      citation: '§ 4A1.1',
      levels: 0,
      detail: `Overrides the computed category of ${'I II III IV V VI'.split(' ')[category - 1]} (${points} points).`,
    });
    category = input.categoryOverride;
    categoryOverriddenBy = 'manual entry';
  }

  return {
    points,
    category,
    steps,
    flags,
    careerOffenderApplies,
    accaApplies,
    zeroPointApplies: allCriteriaMet && !careerOffenderApplies && !accaApplies,
    categoryOverriddenBy,
    offenseLevelFloor,
    floorCitation,
  };
}
