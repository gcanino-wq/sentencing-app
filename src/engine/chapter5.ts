import type {
  CaseInput,
  Chapter5Result,
  CountInput,
  Departure,
  Flag,
  MonthRange,
  SafetyValveCriterion,
  SentenceLadderRung,
  StatutoryResult,
} from './types';
import { STATUTE_BY_ID } from './data/statutes';
import { fineRange, offenseClass, supervisedReleaseRange } from './data/tables';
import { formatRange, zoneForRange } from './data/sentencing-table';

export const SAFETY_VALVE_CRITERIA: { id: SafetyValveCriterion; label: string; citation: string }[] = [
  {
    id: 'noMoreThan4CriminalHistoryPoints',
    label: 'Does not have more than 4 criminal history points, excluding 1-point offenses',
    citation: '18 U.S.C. § 3553(f)(1)(A)',
  },
  {
    id: 'noPrior3PointOffense',
    label: 'Does not have a prior 3-point offense',
    citation: '18 U.S.C. § 3553(f)(1)(B)',
  },
  {
    id: 'noPrior2PointViolentOffense',
    label: 'Does not have a prior 2-point violent offense',
    citation: '18 U.S.C. § 3553(f)(1)(C)',
  },
  {
    id: 'noViolenceOrFirearm',
    label: 'Did not use violence or credible threats, and did not possess a firearm in connection with the offense',
    citation: '18 U.S.C. § 3553(f)(2)',
  },
  {
    id: 'noDeathOrSeriousBodilyInjury',
    label: 'The offense did not result in death or serious bodily injury',
    citation: '18 U.S.C. § 3553(f)(3)',
  },
  {
    id: 'notOrganizerOrCCE',
    label: 'Was not an organizer, leader, manager, or supervisor, and not engaged in a continuing criminal enterprise',
    citation: '18 U.S.C. § 3553(f)(4)',
  },
  {
    id: 'truthfulDisclosure',
    label: 'Truthfully provided the government all information and evidence concerning the offense',
    citation: '18 U.S.C. § 3553(f)(5)',
  },
];

export function safetyValveSatisfied(input: CaseInput): boolean {
  const sel = input.safetyValve ?? {};
  return SAFETY_VALVE_CRITERIA.every((c) => sel[c.id] === true);
}

/**
 * § 5C1.2 relieves the mandatory minimum only for the offenses it names:
 * 21 U.S.C. §§ 841, 844, 846, 960, 963 and 46 U.S.C. §§ 70503, 70506.
 * A mandatory minimum on any other count survives the safety valve.
 */
const SAFETY_VALVE_STATUTE_SECTIONS = new Set([
  '21:841', '21:844', '21:846', '21:960', '21:963', '46:70503', '46:70506',
]);

export function safetyValveCoversCount(count: CountInput): boolean {
  if (!count.statuteId) return false;
  const m = /^(\d+):(\d+)/.exec(count.statuteId);
  return m ? SAFETY_VALVE_STATUTE_SECTIONS.has(`${m[1]}:${m[2]}`) : false;
}

/** Statutory minimum and maximum for a count, accounting for a filed § 851 information. */
export function penaltyForCount(count: CountInput): {
  minMonths: number;
  maxMonths: number | null;
  supervisedReleaseMinMonths?: number;
  citation?: string;
  note?: string;
} {
  if (count.statutoryMaxMonths !== undefined || count.statutoryMinMonths !== undefined) {
    return {
      minMonths: count.statutoryMinMonths ?? 0,
      maxMonths: count.statutoryMaxMonths ?? null,
      citation: 'entered manually',
    };
  }
  const statute = count.statuteId ? STATUTE_BY_ID.get(count.statuteId) : undefined;
  const penalty = statute?.penalty;
  if (!penalty) return { minMonths: 0, maxMonths: null };

  const priors = count.section851Priors ?? 0;
  if (priors > 0 && penalty.enhancedTiers?.length) {
    const tier =
      penalty.enhancedTiers.find((t) => t.priors === priors) ??
      penalty.enhancedTiers[penalty.enhancedTiers.length - 1]!;
    return {
      minMonths: tier.minMonths,
      maxMonths: tier.maxMonths,
      supervisedReleaseMinMonths: tier.supervisedReleaseMinMonths,
      citation: tier.citation,
      note: penalty.note,
    };
  }
  return {
    minMonths: penalty.minMonths,
    maxMonths: penalty.maxMonths,
    supervisedReleaseMinMonths: penalty.supervisedReleaseMinMonths,
    citation: statute?.citation,
    note: penalty.note,
  };
}

export function computeStatutory(
  counts: readonly CountInput[],
  safetyValveApplies: boolean,
): StatutoryResult {
  const flags: Flag[] = [];
  const grouped = counts.filter((c) => !c.consecutiveMandatory);
  const consecutive = counts.filter((c) => c.consecutiveMandatory);

  let maxMonths: number | null = 0;
  let minMonths = 0;
  let aggregateMax: number | null = 0;
  let sawLife = false;
  let mandatoryMinCount: CountInput | undefined;

  for (const count of grouped) {
    const p = penaltyForCount(count);
    if (p.maxMonths === null) {
      sawLife = true;
    } else {
      maxMonths = maxMonths === null ? null : Math.max(maxMonths, p.maxMonths);
      aggregateMax = aggregateMax === null ? null : aggregateMax + p.maxMonths;
    }
    if (p.minMonths > minMonths) {
      minMonths = p.minMonths;
      mandatoryMinCount = count;
    }
    if (p.minMonths > 0 && safetyValveApplies && !safetyValveCoversCount(count)) {
      flags.push({
        severity: 'warning',
        code: 'safety-valve-scope',
        message: `The safety valve does not reach ${count.label ?? 'this count'} — § 5C1.2 applies only to offenses under 21 U.S.C. §§ 841, 844, 846, 960, 963 and 46 U.S.C. §§ 70503, 70506. Its mandatory minimum still applies.`,
        citation: '§ 5C1.2',
      });
    }
    if ((count.section851Priors ?? 0) > 0) {
      flags.push({
        severity: 'warning',
        code: 'section-851',
        message: `A 21 U.S.C. § 851 information with ${count.section851Priors} prior(s) raises this count's penalties to ${p.minMonths / 12} years to ${p.maxMonths === null ? 'life' : `${p.maxMonths / 12} years`}. Confirm the information was filed before trial or plea.`,
        citation: p.citation,
      });
    }
  }

  if (sawLife) {
    maxMonths = null;
    aggregateMax = null;
  }

  const valveReachesController =
    mandatoryMinCount !== undefined && safetyValveCoversCount(mandatoryMinCount);

  if (minMonths > 0 && safetyValveApplies && valveReachesController) {
    flags.push({
      severity: 'info',
      code: 'safety-valve-relief',
      message: `The safety valve relieves the ${minMonths / 12}-year mandatory minimum on ${mandatoryMinCount?.label ?? 'the controlling count'}; the court may impose a sentence without regard to it.`,
      citation: '18 U.S.C. § 3553(f); § 5C1.2',
    });
    minMonths = 0;
  }

  const consecutiveCounts = consecutive.map((c) => ({
    countId: c.id,
    label: c.consecutiveMandatory!.label,
    months: c.consecutiveMandatory!.months,
    citation: c.consecutiveMandatory!.citation,
  }));

  if (consecutiveCounts.length > 1) {
    flags.push({
      severity: 'warning',
      code: 'multiple-consecutive',
      message: `${consecutiveCounts.length} counts carry mandatory consecutive terms. Confirm whether the second-or-subsequent provision of 18 U.S.C. § 924(c)(1)(C) applies — the First Step Act limited stacking to convictions that became final before the instant offense.`,
      citation: '18 U.S.C. § 924(c)(1)(C)',
    });
  }

  return {
    maxMonths,
    minMonths,
    aggregateMaxMonths: aggregateMax,
    consecutiveCounts,
    consecutiveTotalMonths: consecutiveCounts.reduce((sum, c) => sum + c.months, 0),
    flags,
  };
}

/**
 * § 5G1.1 clamping and § 5G1.2(d) stacking.
 *
 * (a) Where the statutory maximum is below the guideline minimum, the statutory
 *     maximum is the guideline sentence.
 * (b) Where a mandatory minimum is above the guideline maximum, the mandatory
 *     minimum is the guideline sentence.
 * (d) Where the total punishment exceeds the highest single count's maximum,
 *     counts run consecutively to the extent necessary to reach it.
 */
export function applyStatutoryLimits(
  tableRange: MonthRange,
  statutory: StatutoryResult,
): { range: MonthRange; flags: Flag[] } {
  const flags: Flag[] = [];
  let { min, max } = tableRange;

  const statMax = statutory.maxMonths;
  const statMin = statutory.minMonths;

  if (statMax !== null && statMax < min) {
    flags.push({
      severity: 'warning',
      code: 'g511a',
      message: `The statutory maximum of ${statMax} months falls below the guideline minimum of ${min} months, so the statutory maximum becomes the guideline sentence.`,
      citation: '§ 5G1.1(a)',
    });

    if (statutory.aggregateMaxMonths !== null && statutory.aggregateMaxMonths > statMax && min > statMax) {
      const stacked = Math.min(min, statutory.aggregateMaxMonths);
      flags.push({
        severity: 'warning',
        code: 'g512d',
        message: `Total punishment of ${min} months exceeds the highest single count's maximum of ${statMax} months. Counts run consecutively to the extent necessary to produce the total punishment, up to the aggregate maximum of ${statutory.aggregateMaxMonths} months.`,
        citation: '§ 5G1.2(d)',
      });
      return { range: { min: stacked, max: stacked }, flags };
    }
    return { range: { min: statMax, max: statMax }, flags };
  }

  if (statMax !== null && max !== null && statMax < max) {
    flags.push({
      severity: 'info',
      code: 'g511-max',
      message: `The guideline maximum is capped at the statutory maximum of ${statMax} months.`,
      citation: '§ 5G1.1(c)(1)',
    });
    max = statMax;
  }

  if (statMin > 0) {
    if (max !== null && statMin > max) {
      flags.push({
        severity: 'warning',
        code: 'g511b',
        message: `The mandatory minimum of ${statMin} months exceeds the guideline maximum of ${max} months, so the mandatory minimum becomes the guideline sentence.`,
        citation: '§ 5G1.1(b)',
      });
      return { range: { min: statMin, max: statMin }, flags };
    }
    if (statMin > min) {
      flags.push({
        severity: 'warning',
        code: 'g511-min',
        message: `The guideline minimum is raised to the mandatory minimum of ${statMin} months.`,
        citation: '§ 5G1.1(c)(2)',
      });
      min = statMin;
    }
  }

  return { range: { min, max }, flags };
}

export function computeChapter5(
  offenseLevel: number,
  range: MonthRange,
  statutory: StatutoryResult,
  counts: readonly CountInput[],
): Chapter5Result {
  const cls = offenseClass(statutory.maxMonths);
  const sr = supervisedReleaseRange(cls);

  const statutorySrMin = counts.reduce((best, c) => {
    const p = penaltyForCount(c);
    return Math.max(best, p.supervisedReleaseMinMonths ?? 0);
  }, 0);

  const supervisedRelease = {
    min: Math.max(sr.min, statutorySrMin),
    max: statutorySrMin > 0 && (sr.max === null || statutorySrMin >= sr.max) ? null : sr.max,
    citation: sr.citation,
    note:
      statutorySrMin > 0
        ? `A statutory minimum term of ${statutorySrMin / 12} years applies. § 5D1.2(a) otherwise supplies only a maximum, with the length set by an individualized assessment.`
        : 'The guideline supplies a maximum only; the court sets the length by individualized assessment. § 5D1.2(a).',
  };

  const zone = zoneForRange(range);
  const zoneNotes: Record<string, string> = {
    A: 'Zone A: a sentence of imprisonment is not required unless the applicable Chapter Two guideline expressly requires one. § 5C1.1(b).',
    B: 'Zone B: the minimum term may be satisfied by imprisonment, by imprisonment of at least one month plus a substitute of community confinement or home detention, or by probation with substitute conditions. § 5C1.1(c).',
    C: 'Zone C: at least one-half of the minimum term must be satisfied by imprisonment; the remainder may be served in community confinement or home detention. § 5C1.1(d).',
    D: 'Zone D: the minimum term must be satisfied by a sentence of imprisonment. § 5C1.1(f).',
  };

  // § 5B1.1(b): probation is barred outright for a Class A or B felony, whatever
  // the zone, and by any mandatory minimum term.
  const classBarsProbation = cls === 'A' || cls === 'B';
  const probationAvailable =
    (zone === 'A' || zone === 'B') && !classBarsProbation && statutory.minMonths === 0;

  let probationNote: string;
  if (classBarsProbation) {
    probationNote = `Probation is not available — the offense of conviction is a Class ${cls} felony. § 5B1.1(b)(1); 18 U.S.C. § 3561(a)(1).`;
  } else if (statutory.minMonths > 0) {
    probationNote = `Probation is not available — a mandatory minimum term of ${statutory.minMonths} months applies. § 5B1.1(b)(2).`;
  } else if (zone === 'A') {
    probationNote = `Probation is authorized. § 5B1.1(a)(1). ${zoneNotes.A}`;
  } else if (zone === 'B') {
    probationNote = `Probation is authorized with a condition requiring intermittent confinement, community confinement, or home detention. § 5B1.1(a)(2). ${zoneNotes.B}`;
  } else {
    probationNote = zoneNotes[zone] ?? '';
  }

  return {
    supervisedRelease,
    fine: { ...fineRange(offenseLevel), citation: '§ 5E1.2(c)(3)' },
    probationAvailable,
    probationNote,
    zone,
    zoneNote: zoneNotes[zone] ?? '',
  };
}

/** Advisory range → each departure → each variance, as an arithmetic ladder. */
export function buildLadder(
  guidelineRange: MonthRange,
  departures: readonly Departure[],
  varianceTargetMonths: number | undefined,
): SentenceLadderRung[] {
  const rungs: SentenceLadderRung[] = [
    { label: 'Advisory guideline range', range: guidelineRange, citation: 'Ch. 5, Pt. A' },
  ];

  let current = guidelineRange;
  for (const departure of departures) {
    let next: MonthRange;
    if (departure.kind === 'percent') {
      const factor = Math.max(0, 1 - departure.amount / 100);
      next = {
        min: Math.round(current.min * factor),
        max: current.max === null ? null : Math.round(current.max * factor),
      };
    } else if (departure.kind === 'months') {
      next = {
        min: Math.max(0, current.min - departure.amount),
        max: current.max === null ? null : Math.max(0, current.max - departure.amount),
      };
    } else {
      // Level departures are resolved against the table by the caller; here the
      // range is already supplied via `amount` interpreted as months off.
      next = {
        min: Math.max(0, current.min - departure.amount),
        max: current.max === null ? null : Math.max(0, current.max - departure.amount),
      };
    }
    rungs.push({
      label: departure.label,
      citation: departure.citation,
      range: next,
      detail:
        departure.kind === 'percent'
          ? `${departure.amount}% below the range`
          : departure.kind === 'levels'
            ? `${departure.amount} levels off, resolved against the Sentencing Table`
            : `${departure.amount} months off`,
    });
    current = next;
  }

  if (varianceTargetMonths !== undefined) {
    rungs.push({
      label: 'Sentence requested under § 3553(a)',
      citation: '18 U.S.C. § 3553(a)',
      range: { min: varianceTargetMonths, max: varianceTargetMonths },
      detail: `${formatRange(current)} after departures; the variance request is ${varianceTargetMonths} months.`,
    });
  }

  return rungs;
}

/**
 * Estimated time to serve. 18 U.S.C. § 3624(b) allows up to 54 days per year of
 * the sentence imposed — roughly 15%. First Step Act earned time credits can
 * reduce time in custody further for eligible prisoners. BOP is not bound by
 * this arithmetic and eligibility turns on the offense of conviction.
 */
export function estimateTimeToServe(
  range: MonthRange,
  firstStepActEligible: boolean,
): { goodTimeMonths: number; firstStepActMonths: number; estimatedServeRange: MonthRange; note: string } {
  const applyGoodTime = (months: number) => months * (1 - 54 / 365);
  const fsaFactor = firstStepActEligible ? 0.85 : 1;

  const min = Math.round(applyGoodTime(range.min) * fsaFactor);
  const max = range.max === null ? null : Math.round(applyGoodTime(range.max) * fsaFactor);

  return {
    goodTimeMonths: Math.round(range.min - applyGoodTime(range.min)),
    firstStepActMonths: firstStepActEligible ? Math.round(applyGoodTime(range.min) * 0.15) : 0,
    estimatedServeRange: { min, max },
    note:
      'Estimate only. Good conduct time under 18 U.S.C. § 3624(b) is up to 54 days per year of the sentence imposed and is not guaranteed. First Step Act earned time credits depend on the offense of conviction, risk classification, and programming. BOP is not bound by this calculation.',
  };
}
