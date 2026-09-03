import { describe, expect, it } from 'vitest';
import { calculate } from '../calculate';
import { makeCase, makeCount, makePrior } from './helpers';
import { SAFETY_VALVE_CRITERIA } from '../chapter5';
import { ZERO_POINT_CRITERIA } from '../chapter4';

const ALL_SAFETY_VALVE = Object.fromEntries(SAFETY_VALVE_CRITERIA.map((c) => [c.id, true]));

describe('single fraud count', () => {
  it('runs loss through the table and applies acceptance', () => {
    const result = calculate(
      makeCase({
        offenseDate: '2026-01-10',
        counts: [
          makeCount({
            id: 'c1',
            label: 'Count 1 — wire fraud',
            statuteId: '18:1343',
            socs: [{ id: 'base:a1' }],
            loss: { actualLoss: 600_000 },
          }),
        ],
        acceptance: { granted: true, thirdPointMoved: true },
      }),
    );

    // Base 7 (statutory max 20 years) + 14 (loss over $550,000) = 21, less 3 for acceptance.
    expect(result.combinedOffenseLevel).toBe(21);
    expect(result.totalOffenseLevel).toBe(18);
    expect(result.criminalHistory.category).toBe(1);
    expect(result.guidelineRange).toEqual({ min: 27, max: 33 });
    expect(result.chapter5.zone).toBe('D');
  });

  it('withholds the third acceptance point below level 16', () => {
    const result = calculate(
      makeCase({
        counts: [
          makeCount({ id: 'c1', statuteId: '18:1343', socs: [{ id: 'base:a1' }], loss: { actualLoss: 20_000 } }),
        ],
        acceptance: { granted: true, thirdPointMoved: true },
      }),
    );
    // Base 7 + 4 = 11; the § 3E1.1(b) point needs level 16 or greater.
    expect(result.combinedOffenseLevel).toBe(11);
    expect(result.totalOffenseLevel).toBe(9);
  });

  it('flags intended loss as the driver when it exceeds actual loss', () => {
    const result = calculate(
      makeCase({
        counts: [
          makeCount({
            id: 'c1',
            statuteId: '18:1343',
            socs: [{ id: 'base:a1' }],
            loss: { actualLoss: 20_000, intendedLoss: 900_000 },
          }),
        ],
      }),
    );
    expect(result.flags.some((f) => f.code === 'intended-loss')).toBe(true);
    expect(result.flags.some((f) => f.code === 'loss-commentary-deference')).toBe(true);
  });
});

describe('drug trafficking with a § 924(c) count', () => {
  const build = (extra: Partial<Parameters<typeof makeCase>[0]> = {}) =>
    makeCase({
      offenseDate: '2026-02-01',
      counts: [
        makeCount({
          id: 'c1',
          label: 'Count 1 — conspiracy to distribute',
          statuteId: '21:841(b)(1)(A)',
          socs: [{ id: 'weapon' }],
          drugs: [{ substanceId: 'cocaine', quantity: 10, unit: 'kg' }],
        }),
        makeCount({
          id: 'c2',
          label: 'Count 2 — § 924(c)',
          statuteId: '18:924(c)',
          consecutiveMandatory: {
            months: 60,
            label: 'Possession in furtherance',
            citation: '18 U.S.C. § 924(c)(1)(A)(i)',
          },
        }),
      ],
      ...extra,
    });

  it('suppresses the § 2D1.1(b)(1) weapon enhancement under § 2K2.4 cmt. n.4', () => {
    const result = calculate(build());
    const drugCount = result.counts.find((c) => c.countId === 'c1')!;
    const weaponStep = drugCount.steps.find((s) => s.citation === '§ 2D1.1(b)(1)');

    expect(weaponStep?.suppressed).toBe(true);
    expect(weaponStep?.levels).toBe(0);
    expect(result.flags.some((f) => f.code === 'k24-double-counting')).toBe(true);

    // 10 kg cocaine = 2,000 kg converted = level 30, with no weapon bump.
    expect(result.combinedOffenseLevel).toBe(30);
  });

  it('presents the grouped range, the consecutive term, and the aggregate separately', () => {
    const result = calculate(build());
    expect(result.statutory.consecutiveCounts).toHaveLength(1);
    expect(result.aggregate.consecutiveMonths).toBe(60);
    expect(result.aggregate.totalRange.min).toBe(result.aggregate.groupedCountsRange.min + 60);
    expect(result.aggregate.totalRange.max).toBe(result.aggregate.groupedCountsRange.max! + 60);
  });

  it('raises the guideline minimum to the ten-year mandatory minimum', () => {
    const result = calculate(build());
    // Level 30, Category I is 97-121 months; the mandatory minimum of 120 is inside it.
    expect(result.statutory.minMonths).toBe(120);
    expect(result.guidelineRange.min).toBe(120);
    expect(result.flags.some((f) => f.code === 'g511-min')).toBe(true);
  });

  it('excludes the § 924(c) count from grouping', () => {
    const result = calculate(build());
    const grouped = result.groups.flatMap((g) => g.group.countIds);
    expect(grouped).toContain('c1');
    expect(grouped).not.toContain('c2');
  });
});

describe('safety valve', () => {
  const drugCase = (safetyValve: Record<string, boolean> | undefined) =>
    makeCase({
      offenseDate: '2026-02-01',
      counts: [
        makeCount({
          id: 'c1',
          statuteId: '21:841(b)(1)(A)',
          drugs: [{ substanceId: 'cocaine', quantity: 10, unit: 'kg' }],
        }),
      ],
      safetyValve,
    });

  it('relieves the mandatory minimum and applies the § 2D1.1(b)(18) reduction', () => {
    const withValve = calculate(drugCase(ALL_SAFETY_VALVE));
    const without = calculate(drugCase(undefined));

    expect(without.statutory.minMonths).toBe(120);
    expect(withValve.statutory.minMonths).toBe(0);
    expect(withValve.combinedOffenseLevel).toBe(without.combinedOffenseLevel - 2);
    expect(withValve.flags.some((f) => f.code === 'safety-valve-relief')).toBe(true);
  });

  it('flags the tension between a weapon enhancement and the safety valve', () => {
    const input = drugCase(ALL_SAFETY_VALVE);
    input.counts[0]!.socs = [{ id: 'weapon' }];
    const result = calculate(input);
    expect(result.flags.some((f) => f.code === 'weapon-vs-safety-valve')).toBe(true);
  });

  it('does not relieve the minimum when a criterion is unconfirmed', () => {
    const partial = { ...ALL_SAFETY_VALVE, truthfulDisclosure: false };
    expect(calculate(drugCase(partial)).statutory.minMonths).toBe(120);
  });
});

describe('carjacking with a § 924(c) count', () => {
  it('suppresses the § 2B3.1(b)(2) firearm enhancement on the carjacking', () => {
    const result = calculate(
      makeCase({
        counts: [
          makeCount({
            id: 'c1',
            label: 'Count 1 — carjacking',
            statuteId: '18:2119',
            socs: [{ id: 'firearm-brandished' }, { id: 'carjacking' }, { id: 'bodily-injury' }],
          }),
          makeCount({
            id: 'c2',
            statuteId: '18:924(c)',
            consecutiveMandatory: {
              months: 84,
              label: 'Brandished',
              citation: '18 U.S.C. § 924(c)(1)(A)(ii)',
            },
          }),
        ],
      }),
    );

    const carjacking = result.counts.find((c) => c.countId === 'c1')!;
    const firearm = carjacking.steps.find((s) => s.citation === '§ 2B3.1(b)(2)(C)');
    expect(firearm?.suppressed).toBe(true);

    // Base 20 + 2 (carjacking) + 2 (bodily injury) = 24. No firearm bump.
    expect(carjacking.adjustedOffenseLevel).toBe(24);
    expect(result.aggregate.consecutiveMonths).toBe(84);
  });

  it('proposes separate groups for two carjacking counts', () => {
    const result = calculate(
      makeCase({
        counts: [
          makeCount({ id: 'c1', statuteId: '18:2119', socs: [{ id: 'carjacking' }] }),
          makeCount({ id: 'c2', statuteId: '18:2119', socs: [{ id: 'carjacking' }] }),
        ],
      }),
    );
    expect(result.groups).toHaveLength(2);
    // Two groups at the same level produce 2 units and a 2-level increase.
    expect(result.combinedOffenseLevel).toBe(24);
  });
});

describe('§ 3D grouping', () => {
  it('aggregates quantity across counts under the same guideline', () => {
    const result = calculate(
      makeCase({
        counts: [
          makeCount({
            id: 'c1',
            statuteId: '18:1343',
            socs: [{ id: 'base:a1' }],
            loss: { actualLoss: 300_000 },
          }),
          makeCount({
            id: 'c2',
            statuteId: '18:1343',
            socs: [{ id: 'base:a1' }],
            loss: { actualLoss: 300_000 },
          }),
        ],
      }),
    );

    expect(result.groups).toHaveLength(1);
    // Aggregated to $600,000 -> +14, not two separate $300,000 counts at +12.
    expect(result.combinedOffenseLevel).toBe(21);
    expect(result.flags.some((f) => f.code === 'aggregated-group')).toBe(true);
  });

  it('disregards a group nine or more levels below the highest', () => {
    const result = calculate(
      makeCase({
        counts: [
          makeCount({ id: 'c1', statuteId: '18:2119', socs: [{ id: 'firearm-discharged' }] }),
          makeCount({ id: 'c2', statuteId: '18:1001', guidelineOverride: '2B1.1', manualBaseLevel: 6 }),
        ],
      }),
    );
    expect(result.flags.some((f) => f.code === 'groups-disregarded')).toBe(true);
    // Base 20 + 7 = 27; the level-6 group is disregarded, so no unit increase.
    expect(result.combinedOffenseLevel).toBe(27);
  });
});

describe('§ 5G1.1 statutory clamping', () => {
  it('caps the guideline sentence at the statutory maximum', () => {
    const result = calculate(
      makeCase({
        counts: [
          makeCount({
            id: 'c1',
            statuteId: '18:1001', // 5-year maximum
            guidelineOverride: '2B1.1',
            manualBaseLevel: 30,
          }),
        ],
      }),
    );
    // Level 30, Category I is 97-121 months, above the 60-month statutory maximum.
    expect(result.tableRange).toEqual({ min: 97, max: 121 });
    expect(result.guidelineRange).toEqual({ min: 60, max: 60 });
    expect(result.flags.some((f) => f.code === 'g511a')).toBe(true);
  });

  it('raises the guideline sentence to a mandatory minimum above the range', () => {
    const result = calculate(
      makeCase({
        counts: [
          makeCount({
            id: 'c1',
            statuteId: '21:841(b)(1)(A)',
            drugs: [{ substanceId: 'cocaine', quantity: 1, unit: 'kg' }],
          }),
        ],
      }),
    );
    // 1 kg cocaine = 200 kg converted = level 24; Category I is 51-63 months,
    // entirely below the 120-month mandatory minimum.
    expect(result.combinedOffenseLevel).toBe(24);
    expect(result.guidelineRange).toEqual({ min: 120, max: 120 });
    expect(result.flags.some((f) => f.code === 'g511b')).toBe(true);
  });
});

describe('career offender', () => {
  it('replaces the offense level and forces Category VI', () => {
    const result = calculate(
      makeCase({
        offenseDate: '2026-01-01',
        counts: [
          makeCount({
            id: 'c1',
            statuteId: '21:841(b)(1)(A)',
            drugs: [{ substanceId: 'cocaine', quantity: 1, unit: 'kg' }],
          }),
        ],
        criminalHistory: {
          priors: [
            makePrior({
              id: 'p1',
              sentenceImposedMonths: 36,
              sentenceDate: '2018-01-01',
              crimeOfViolence: true,
            }),
            makePrior({
              id: 'p2',
              sentenceImposedMonths: 24,
              sentenceDate: '2019-01-01',
              controlledSubstanceOffense: true,
            }),
          ],
          careerOffender: { claimed: true, ageAtLeast18: true, instantOffenseQualifies: true },
        },
        acceptance: { granted: true, thirdPointMoved: true },
      }),
    );

    // Statutory maximum is life, so the § 4B1.1(b) table gives 37, over the
    // otherwise applicable 24. Acceptance then takes 3 off.
    expect(result.criminalHistory.careerOffenderApplies).toBe(true);
    expect(result.criminalHistory.category).toBe(6);
    expect(result.totalOffenseLevel).toBe(34);
    expect(result.guidelineRange.min).toBe(262);
  });
});

describe('§ 4C1.1 zero-point offender', () => {
  it('takes two levels off before acceptance', () => {
    const criteria = Object.fromEntries(ZERO_POINT_CRITERIA.map((c) => [c.id, true]));
    const base = makeCase({
      counts: [
        makeCount({
          id: 'c1',
          statuteId: '18:1343',
          socs: [{ id: 'base:a1' }],
          loss: { actualLoss: 600_000 },
        }),
      ],
      acceptance: { granted: true, thirdPointMoved: true },
    });

    const without = calculate(base);
    const withReduction = calculate({
      ...base,
      criminalHistory: { priors: [], zeroPointOffender: criteria },
    });

    expect(withReduction.totalOffenseLevel).toBe(without.totalOffenseLevel - 2);
  });
});

describe('honesty and provenance', () => {
  it('warns when no statute or guideline is selected', () => {
    const result = calculate(makeCase({ counts: [makeCount({ id: 'c1' })] }));
    expect(result.counts[0]!.flags.some((f) => f.code === 'no-guideline')).toBe(true);
  });

  it('flags an unverified Appendix A mapping', () => {
    const result = calculate(
      makeCase({ counts: [makeCount({ id: 'c1', statuteId: '18:1030', manualBaseLevel: 6 })] }),
    );
    expect(result.counts[0]!.flags.some((f) => f.code === 'unverified-appendix-a')).toBe(true);
  });

  it('warns when the offense predates the encoded manual edition', () => {
    const result = calculate(
      makeCase({ offenseDate: '2024-06-01', counts: [makeCount({ id: 'c1', statuteId: '18:1343' })] }),
    );
    expect(result.flags.some((f) => f.code === 'ex-post-facto')).toBe(true);
  });

  it('still computes with no drug quantity, and says the level is a floor', () => {
    const result = calculate(
      makeCase({ counts: [makeCount({ id: 'c1', statuteId: '21:841(b)(1)(C)' })] }),
    );
    expect(result.combinedOffenseLevel).toBe(6);
    expect(result.counts[0]!.flags.some((f) => f.code === 'no-drug-quantity')).toBe(true);
  });

  it('surfaces the Puerto Rico predicate caution in D.P.R. career offender cases', () => {
    const result = calculate(
      makeCase({
        districtId: 'pr',
        counts: [makeCount({ id: 'c1', statuteId: '18:922(g)', socs: [{ id: 'base:a6' }] })],
        criminalHistory: {
          priors: [
            makePrior({ id: 'p1', crimeOfViolence: true, sentenceImposedMonths: 36, sentenceDate: '2020-01-01', puertoRico: { penalCode: '2012' } }),
            makePrior({ id: 'p2', controlledSubstanceOffense: true, sentenceImposedMonths: 24, sentenceDate: '2021-01-01', puertoRico: { penalCode: '2012' } }),
          ],
          careerOffender: { claimed: true, ageAtLeast18: true, instantOffenseQualifies: true },
        },
      }),
    );
    expect(result.flags.some((f) => f.code === 'pr-predicate')).toBe(true);
  });
});

describe('mutually exclusive characteristics', () => {
  it('applies only the greatest characteristic in an exclusive set', () => {
    const result = calculate(
      makeCase({
        counts: [
          makeCount({
            id: 'c1',
            statuteId: '18:2119',
            socs: [{ id: 'firearm-brandished' }, { id: 'weapon-brandished' }, { id: 'threat-of-death' }],
          }),
        ],
      }),
    );
    // Only § 2B3.1(b)(2)(C) at +5 applies; base 20 -> 25.
    expect(result.counts[0]!.adjustedOffenseLevel).toBe(25);
    const suppressed = result.counts[0]!.steps.filter((s) => s.suppressed);
    expect(suppressed).toHaveLength(2);
  });
});

describe('§ 3E1.1 with obstruction', () => {
  it('applies both but flags the extraordinary-case requirement', () => {
    const result = calculate(
      makeCase({
        counts: [
          makeCount({
            id: 'c1',
            statuteId: '18:1343',
            socs: [{ id: 'base:a1' }],
            loss: { actualLoss: 600_000 },
            chapter3: { obstruction: true },
          }),
        ],
        acceptance: { granted: true },
      }),
    );
    expect(result.flags.some((f) => f.code === 'acceptance-with-obstruction')).toBe(true);
  });
});

describe('plea comparison', () => {
  it('shows the stipulated range alongside the computed one', () => {
    const result = calculate(
      makeCase({
        counts: [
          makeCount({
            id: 'c1',
            statuteId: '18:1343',
            socs: [{ id: 'base:a1' }],
            loss: { actualLoss: 600_000 },
          }),
        ],
        acceptance: { granted: true, thirdPointMoved: true },
        plea: { stipulatedOffenseLevel: 14 },
      }),
    );
    expect(result.totalOffenseLevel).toBe(18);
    expect(result.plea?.stipulatedRange).toEqual({ min: 15, max: 21 });
    expect(result.plea?.gapMonths).toEqual({ min: 12, max: 12 });
  });
});

describe('every step carries a citation', () => {
  it('holds across a full calculation', () => {
    const result = calculate(
      makeCase({
        offenseDate: '2026-01-01',
        counts: [
          makeCount({
            id: 'c1',
            statuteId: '21:841(b)(1)(A)',
            socs: [{ id: 'premises' }],
            drugs: [{ substanceId: 'meth-actual', quantity: 500, unit: 'g' }],
            chapter3: { aggravatingRole: 'a' },
          }),
          makeCount({
            id: 'c2',
            statuteId: '18:924(c)',
            consecutiveMandatory: { months: 60, label: 'Possession', citation: '18 U.S.C. § 924(c)(1)(A)(i)' },
          }),
        ],
        criminalHistory: {
          priors: [makePrior({ id: 'p1', sentenceImposedMonths: 24, sentenceDate: '2020-01-01' })],
        },
        acceptance: { granted: true, thirdPointMoved: true },
      }),
    );

    const allSteps = [
      ...result.counts.flatMap((c) => c.steps),
      ...result.groupingSteps,
      ...result.finalSteps,
      ...result.criminalHistory.steps,
    ];
    expect(allSteps.length).toBeGreaterThan(5);
    for (const step of allSteps) {
      expect(step.citation, `step "${step.label}" has no citation`).toBeTruthy();
      expect(step.label).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// Verified against the 2025 Guidelines Manual, 2026-09-03.
// ---------------------------------------------------------------------------

describe('§ 2B3.1 as verified against the manual', () => {
  it('caps the combined weapon and injury increases at 11 levels', () => {
    const result = calculate(
      makeCase({
        counts: [
          makeCount({
            id: 'c1',
            statuteId: '18:2113',
            // 7 + 6 = 13 between them, which the guideline limits to 11.
            socs: [{ id: 'firearm-discharged' }, { id: 'permanent-injury' }],
          }),
        ],
      }),
    );
    expect(result.counts[0]!.adjustedOffenseLevel).toBe(20 + 11);
    expect(result.flags.some((f) => f.code === 'soc-group-cap')).toBe(true);
  });

  it('leaves the weapon and injury increases alone below the cap', () => {
    const result = calculate(
      makeCase({
        counts: [
          makeCount({
            id: 'c1',
            statuteId: '18:2113',
            socs: [{ id: 'firearm-brandished' }, { id: 'bodily-injury' }],
          }),
        ],
      }),
    );
    expect(result.counts[0]!.adjustedOffenseLevel).toBe(20 + 5 + 2);
    expect(result.flags.some((f) => f.code === 'soc-group-cap')).toBe(false);
  });

  it('uses its own loss table, not the § 2B1.1 table', () => {
    const result = calculate(
      makeCase({
        counts: [
          makeCount({ id: 'c1', statuteId: '18:2113', loss: { actualLoss: 600_000 } }),
        ],
      }),
    );
    // § 2B3.1(b)(7)(D) adds 3 for loss over $500,000. The § 2B1.1 table would add 14.
    const step = result.counts[0]!.steps.find((s) => s.citation === '§ 2B3.1(b)(7)');
    expect(step?.levels).toBe(3);
    expect(result.counts[0]!.adjustedOffenseLevel).toBe(23);
  });

  it('recognises the intermediate degrees of injury', () => {
    const result = calculate(
      makeCase({
        counts: [makeCount({ id: 'c1', statuteId: '18:2113', socs: [{ id: 'injury-between-b-c' }] })],
      }),
    );
    expect(result.counts[0]!.adjustedOffenseLevel).toBe(25);
  });
});

describe('§ 2K2.1 as verified against the manual', () => {
  it('places use in connection with another felony at (b)(7)(B)', () => {
    const result = calculate(
      makeCase({
        counts: [
          makeCount({
            id: 'c1',
            statuteId: '18:922(g)',
            socs: [{ id: 'base:a6' }, { id: 'another-felony' }],
          }),
        ],
      }),
    );
    const step = result.counts[0]!.steps.find((s) => s.label.includes('another felony offense'));
    expect(step?.citation).toBe('§ 2K2.1(b)(7)(B)');
    // 14 + 4 = 18, which is also the floor the subsection imposes.
    expect(result.counts[0]!.adjustedOffenseLevel).toBe(18);
  });

  it('scores machinegun conversion devices', () => {
    const result = calculate(
      makeCase({
        counts: [
          makeCount({
            id: 'c1',
            statuteId: '18:922(g)',
            socs: [{ id: 'base:a6' }, { id: 'mcd-30' }],
          }),
        ],
      }),
    );
    expect(result.counts[0]!.adjustedOffenseLevel).toBe(18);
    expect(
      result.counts[0]!.steps.some((s) => s.citation === '§ 2K2.1(b)(5)(B)'),
    ).toBe(true);
  });

  it('caps the level reached through (b)(1)–(b)(5) at 29', () => {
    const result = calculate(
      makeCase({
        counts: [
          makeCount({
            id: 'c1',
            statuteId: '18:922(g)',
            // 26 + 10 firearms + 4 serial = 40, limited to 29.
            socs: [{ id: 'base:a1' }, { id: 'firearms-200' }, { id: 'altered-serial' }],
          }),
        ],
      }),
    );
    expect(result.counts[0]!.adjustedOffenseLevel).toBe(29);
  });

  it('lifts the cap where the portable-rocket provision applies', () => {
    const result = calculate(
      makeCase({
        counts: [
          makeCount({
            id: 'c1',
            statuteId: '18:922(g)',
            socs: [{ id: 'base:a1' }, { id: 'firearms-200' }, { id: 'destructive-device-rocket' }],
          }),
        ],
      }),
    );
    // 26 + 10 + 15 = 51, clamped to 43 by the table ceiling, not by the 29 cap.
    expect(result.counts[0]!.adjustedOffenseLevel).toBe(43);
  });
});

describe('§ 2D1.1(a)(5) mitigating role, as verified against the manual', () => {
  // 3 kg cocaine = 600 kg converted = level 30; 12 kg = 2,400 kg = level 30.
  // These quantities are chosen to land the Drug Quantity Table on 32, 34 and 36.
  const drugCase = (kg: number, role: 'none' | 'minor' | 'minimal') =>
    makeCase({
      counts: [
        makeCount({
          id: 'c1',
          statuteId: '21:841(b)(1)(A)',
          drugs: [{ substanceId: 'heroin', quantity: kg, unit: 'kg' }],
          chapter3: { mitigatingRole: role },
        }),
      ],
    });

  it('leaves the level alone with no mitigating role', () => {
    // 5,000 kg converted -> level 32.
    expect(calculate(drugCase(5, 'none')).combinedOffenseLevel).toBe(32);
    // 15,000 kg -> level 34.
    expect(calculate(drugCase(15, 'none')).combinedOffenseLevel).toBe(34);
    // 50,000 kg -> level 36.
    expect(calculate(drugCase(50, 'none')).combinedOffenseLevel).toBe(36);
  });

  it('drops level 32 by two', () => {
    // 32 -> 30 under (a)(5), then -2 for the minor role adjustment itself.
    const result = calculate(drugCase(5, 'minor'));
    expect(result.counts[0]!.steps.some((s) => s.citation === '§ 2D1.1(a)(5)')).toBe(true);
    expect(result.combinedOffenseLevel).toBe(28);
  });

  it('drops level 34 by three, not to 32', () => {
    // The old flat cap produced 32 here; the manual gives 31, then -2 for the role.
    expect(calculate(drugCase(15, 'minor')).combinedOffenseLevel).toBe(29);
  });

  it('drops anything above 34 to level 32', () => {
    expect(calculate(drugCase(50, 'minor')).combinedOffenseLevel).toBe(30);
  });

  it('lands a minimal participant at 30 before the role reduction', () => {
    // Above 34 -> 32, then the second sentence of (a)(5) takes it to 30,
    // then § 3B1.2(a) takes its own 4 levels.
    expect(calculate(drugCase(50, 'minimal')).combinedOffenseLevel).toBe(26);
  });

  it('does nothing below level 32', () => {
    // 600 kg converted -> level 26; (a)(5) does not reach it.
    const result = calculate(drugCase(0.6, 'minor'));
    expect(result.counts[0]!.steps.some((s) => s.citation === '§ 2D1.1(a)(5)')).toBe(false);
    expect(result.combinedOffenseLevel).toBe(24);
  });
});

describe('Chapter 3 as verified against the manual', () => {
  const withCh3 = (chapter3: Record<string, unknown>) =>
    calculate(
      makeCase({
        counts: [
          makeCount({
            id: 'c1',
            statuteId: '18:1343',
            socs: [{ id: 'base:a1' }],
            chapter3: chapter3 as never,
          }),
        ],
      }),
    );

  it('applies the three § 3A1.2 routes at their own values', () => {
    expect(withCh3({ officialVictim: 'standard' }).combinedOffenseLevel).toBe(7 + 3);
    expect(withCh3({ officialVictim: 'chapterTwoPartA' }).combinedOffenseLevel).toBe(7 + 6);
    expect(withCh3({ officialVictim: 'assaultive' }).combinedOffenseLevel).toBe(7 + 6);
  });

  it('applies § 3A1.5 and its level-37 floor on death', () => {
    expect(withCh3({ humanRights: 'genocide1091c' }).combinedOffenseLevel).toBe(7 + 2);
    expect(withCh3({ humanRights: 'other' }).combinedOffenseLevel).toBe(7 + 4);
    expect(
      withCh3({ humanRights: 'other', humanRightsDeathResulted: true }).combinedOffenseLevel,
    ).toBe(37);
  });

  it('notes the § 2H1.1(b)(1) exception on hate crime motivation', () => {
    expect(withCh3({ hateCrime: true }).flags.some((f) => f.code === 'hate-crime-2h11')).toBe(true);
  });

  it('stacks the vulnerable victim adjustments as the guideline does', () => {
    expect(withCh3({ vulnerableVictim: true }).combinedOffenseLevel).toBe(7 + 2);
    expect(
      withCh3({ vulnerableVictim: true, vulnerableVictimMany: true }).combinedOffenseLevel,
    ).toBe(7 + 4);
  });
});

describe('§ 5D1.2 as verified against the manual', () => {
  it('supplies a maximum only, with no guideline minimum', () => {
    const result = calculate(
      makeCase({
        counts: [makeCount({ id: 'c1', statuteId: '18:1343', socs: [{ id: 'base:a1' }] })],
      }),
    );
    // 18 U.S.C. § 1343 carries a 20-year maximum, a Class C felony.
    expect(result.chapter5.supervisedRelease.max).toBe(36);
    expect(result.chapter5.supervisedRelease.min).toBe(0);
  });

  it('still respects a statutory minimum term where one applies', () => {
    const result = calculate(
      makeCase({
        counts: [
          makeCount({
            id: 'c1',
            statuteId: '21:841(b)(1)(A)',
            drugs: [{ substanceId: 'cocaine', quantity: 10, unit: 'kg' }],
          }),
        ],
      }),
    );
    // § 841(b)(1)(A) requires at least five years of supervised release.
    expect(result.chapter5.supervisedRelease.min).toBe(60);
  });
});

describe('statutory penalties as verified', () => {
  const drugCase = (safetyValve?: Record<string, boolean>) =>
    calculate(
      makeCase({
        counts: [
          makeCount({
            id: 'c1',
            statuteId: '21:841(b)(1)(A)',
            drugs: [{ substanceId: 'cocaine', quantity: 10, unit: 'kg' }],
            section851Priors: 1,
          }),
        ],
        safetyValve,
      }),
    );

  it('applies the § 851 one-prior tier: 15 years, and 10 years supervised release', () => {
    const result = drugCase();
    expect(result.statutory.minMonths).toBe(180);
    expect(result.chapter5.supervisedRelease.min).toBe(120);
    expect(result.flags.some((f) => f.code === 'section-851')).toBe(true);
  });

  it('does not extend the safety valve past the offenses § 5C1.2 names', () => {
    const result = calculate(
      makeCase({
        counts: [
          makeCount({
            id: 'c1',
            statuteId: '18:924(e)', // ACCA — a 15-year minimum the safety valve cannot reach
          }),
        ],
        safetyValve: ALL_SAFETY_VALVE,
      }),
    );
    expect(result.statutory.minMonths).toBe(180);
    expect(result.flags.some((f) => f.code === 'safety-valve-scope')).toBe(true);
  });

  it('still relieves a § 841 minimum, which § 5C1.2 does name', () => {
    expect(drugCase(ALL_SAFETY_VALVE).statutory.minMonths).toBe(0);
  });
});
