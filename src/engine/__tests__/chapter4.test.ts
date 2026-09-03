import { describe, expect, it } from 'vitest';
import { computeCriminalHistory } from '../chapter4';
import { makePrior } from './helpers';
import { ZERO_POINT_CRITERIA } from '../chapter4';

const OPTIONS = {
  offenseDate: '2025-01-15',
  instantStatutoryMaxMonths: 240,
  offenseLevelBeforeChapter4: 20,
  terrorismApplied: false,
};

describe('§ 4A1.1 point scoring', () => {
  it('awards 3 points for a sentence exceeding thirteen months', () => {
    const result = computeCriminalHistory(
      {
        priors: [
          makePrior({ id: 'p1', sentenceImposedMonths: 24, sentenceDate: '2020-01-01' }),
        ],
      },
      OPTIONS,
    );
    expect(result.points).toBe(3);
    expect(result.category).toBe(2);
  });

  it('awards 2 points at sixty days and 3 only above thirteen months', () => {
    const two = computeCriminalHistory(
      { priors: [makePrior({ id: 'p1', sentenceImposedMonths: 13, sentenceDate: '2020-01-01' })] },
      OPTIONS,
    );
    expect(two.points).toBe(2);

    const three = computeCriminalHistory(
      { priors: [makePrior({ id: 'p1', sentenceImposedMonths: 14, sentenceDate: '2020-01-01' })] },
      OPTIONS,
    );
    expect(three.points).toBe(3);
  });

  it('caps 1-point sentences at four points', () => {
    const priors = Array.from({ length: 7 }, (_, i) =>
      makePrior({ id: `p${i}`, sentenceImposedMonths: 0, sentenceDate: '2020-01-01' }),
    );
    const result = computeCriminalHistory({ priors }, OPTIONS);
    expect(result.points).toBe(4);
    expect(result.steps.filter((s) => s.suppressed)).toHaveLength(3);
  });
});

describe('§ 4A1.2(e) time limits', () => {
  it('excludes a short sentence imposed more than ten years before the offense', () => {
    const result = computeCriminalHistory(
      {
        priors: [makePrior({ id: 'p1', sentenceImposedMonths: 6, sentenceDate: '2010-01-01' })],
      },
      OPTIONS,
    );
    expect(result.points).toBe(0);
    expect(result.steps[0]?.suppressed).toBe(true);
  });

  it('counts a long sentence imposed within fifteen years', () => {
    const result = computeCriminalHistory(
      {
        priors: [makePrior({ id: 'p1', sentenceImposedMonths: 60, sentenceDate: '2012-01-01' })],
      },
      OPTIONS,
    );
    expect(result.points).toBe(3);
  });

  it('counts a long sentence where incarceration fell inside the fifteen-year window', () => {
    const result = computeCriminalHistory(
      {
        priors: [
          makePrior({
            id: 'p1',
            sentenceImposedMonths: 120,
            sentenceDate: '2004-01-01',
            releaseDate: '2013-06-01',
          }),
        ],
      },
      OPTIONS,
    );
    expect(result.points).toBe(3);
  });

  it('counts the prior and flags the gap when the offense date is missing', () => {
    const result = computeCriminalHistory(
      { priors: [makePrior({ id: 'p1', sentenceImposedMonths: 24, sentenceDate: '1990-01-01' })] },
      { ...OPTIONS, offenseDate: undefined },
    );
    expect(result.points).toBe(3);
    expect(result.flags.some((f) => f.code === 'time-limit-unchecked')).toBe(true);
  });
});

describe('§ 4A1.2(a)(2) single sentence rule', () => {
  it('scores a consolidated pair once, on the longest term', () => {
    const result = computeCriminalHistory(
      {
        priors: [
          makePrior({ id: 'p1', sentenceImposedMonths: 36, sentenceDate: '2020-01-01' }),
          makePrior({
            id: 'p2',
            sentenceImposedMonths: 12,
            sentenceDate: '2020-01-01',
            singleSentenceWith: 'p1',
          }),
        ],
      },
      OPTIONS,
    );
    expect(result.points).toBe(3);
  });

  it('adds a § 4A1.1(d) point for a crime of violence absorbed into a single sentence', () => {
    const result = computeCriminalHistory(
      {
        priors: [
          makePrior({ id: 'p1', sentenceImposedMonths: 36, sentenceDate: '2020-01-01' }),
          makePrior({
            id: 'p2',
            sentenceImposedMonths: 12,
            sentenceDate: '2020-01-01',
            singleSentenceWith: 'p1',
            crimeOfViolence: true,
          }),
        ],
      },
      OPTIONS,
    );
    expect(result.points).toBe(4);
  });
});

describe('§ 4A1.1(e) status point after Amendment 821', () => {
  it('withholds the status point below seven points', () => {
    const result = computeCriminalHistory(
      {
        priors: [makePrior({ id: 'p1', sentenceImposedMonths: 24, sentenceDate: '2020-01-01' })],
        underCriminalJusticeSentence: true,
      },
      OPTIONS,
    );
    expect(result.points).toBe(3);
    const suppressed = result.steps.find((s) => s.citation === '§ 4A1.1(e)');
    expect(suppressed?.suppressed).toBe(true);
  });

  it('adds the status point at seven points or more', () => {
    const priors = Array.from({ length: 3 }, (_, i) =>
      makePrior({ id: `p${i}`, sentenceImposedMonths: 24, sentenceDate: '2020-01-01' }),
    );
    const result = computeCriminalHistory(
      { priors, underCriminalJusticeSentence: true },
      OPTIONS,
    );
    expect(result.points).toBe(10);
    expect(result.category).toBe(5);
  });
});

describe('§ 4B1.1 career offender', () => {
  const priors = [
    makePrior({ id: 'p1', sentenceImposedMonths: 36, sentenceDate: '2018-01-01', crimeOfViolence: true }),
    makePrior({
      id: 'p2',
      sentenceImposedMonths: 24,
      sentenceDate: '2019-01-01',
      controlledSubstanceOffense: true,
    }),
  ];

  it('forces Category VI and sets the offense level from the statutory maximum', () => {
    const result = computeCriminalHistory(
      {
        priors,
        careerOffender: { claimed: true, ageAtLeast18: true, instantOffenseQualifies: true },
      },
      { ...OPTIONS, instantStatutoryMaxMonths: null },
    );
    expect(result.careerOffenderApplies).toBe(true);
    expect(result.category).toBe(6);
    expect(result.offenseLevelFloor).toBe(37);
    expect(result.categoryOverriddenBy).toBe('§ 4B1.1(b)');
  });

  it('does not apply with only one qualifying prior, and says why', () => {
    const result = computeCriminalHistory(
      {
        priors: [priors[0]!],
        careerOffender: { claimed: true, ageAtLeast18: true, instantOffenseQualifies: true },
      },
      OPTIONS,
    );
    expect(result.careerOffenderApplies).toBe(false);
    expect(result.flags.some((f) => f.code === 'career-offender-incomplete')).toBe(true);
  });

  it('warns that the predicate question is categorical and not decided here', () => {
    const result = computeCriminalHistory(
      {
        priors,
        careerOffender: { claimed: true, ageAtLeast18: true, instantOffenseQualifies: true },
      },
      OPTIONS,
    );
    expect(result.flags.some((f) => f.code === 'career-offender-categorical')).toBe(true);
  });
});

describe('§ 4B1.4 / 18 U.S.C. § 924(e) armed career criminal', () => {
  it('floors the offense level at 33 and the category at IV', () => {
    const priors = Array.from({ length: 3 }, (_, i) =>
      makePrior({
        id: `p${i}`,
        sentenceImposedMonths: 0,
        sentenceDate: '2020-01-01',
        accaViolentFelony: true,
      }),
    );
    const result = computeCriminalHistory({ priors, acca: { claimed: true } }, OPTIONS);
    expect(result.accaApplies).toBe(true);
    expect(result.offenseLevelFloor).toBe(33);
    expect(result.category).toBeGreaterThanOrEqual(4);
    expect(result.flags.some((f) => f.code === 'acca-occasions')).toBe(true);
  });

  it('does not apply with fewer than three predicates', () => {
    const result = computeCriminalHistory(
      {
        priors: [makePrior({ id: 'p1', accaViolentFelony: true, sentenceImposedMonths: 0 })],
        acca: { claimed: true },
      },
      OPTIONS,
    );
    expect(result.accaApplies).toBe(false);
    expect(result.flags.some((f) => f.code === 'acca-incomplete')).toBe(true);
  });
});

describe('§ 4C1.1 zero-point offender', () => {
  const allCriteria = Object.fromEntries(ZERO_POINT_CRITERIA.map((c) => [c.id, true]));

  it('applies when every criterion is confirmed and there are no points', () => {
    const result = computeCriminalHistory({ priors: [], zeroPointOffender: allCriteria }, OPTIONS);
    expect(result.zeroPointApplies).toBe(true);
  });

  it('does not apply when a criterion is unconfirmed, and names which', () => {
    const partial = { ...allCriteria, noFirearmInConnection: false };
    const result = computeCriminalHistory({ priors: [], zeroPointOffender: partial }, OPTIONS);
    expect(result.zeroPointApplies).toBe(false);
    expect(result.flags.some((f) => f.code === 'zero-point-incomplete')).toBe(true);
  });

  it('does not apply where the defendant has criminal history points', () => {
    const result = computeCriminalHistory(
      {
        priors: [makePrior({ id: 'p1', sentenceImposedMonths: 24, sentenceDate: '2020-01-01' })],
        zeroPointOffender: allCriteria,
      },
      OPTIONS,
    );
    expect(result.zeroPointApplies).toBe(false);
  });
});

describe('§ 3A1.4 terrorism', () => {
  it('forces Category VI regardless of points', () => {
    const result = computeCriminalHistory({ priors: [] }, { ...OPTIONS, terrorismApplied: true });
    expect(result.category).toBe(6);
    expect(result.categoryOverriddenBy).toBe('§ 3A1.4(b)');
  });
});
