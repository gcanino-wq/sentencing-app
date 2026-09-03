import { describe, expect, it } from 'vitest';
import {
  SENTENCING_TABLE,
  categoryForPoints,
  clampOffenseLevel,
  lookupRange,
  zoneForRange,
} from '../data/sentencing-table';
import { fineRange, lossIncrease, resolveLoss, taxLossLevel, unitIncrease, careerOffenderLevel, offenseClass } from '../data/tables';

describe('Sentencing Table structure', () => {
  it('has 43 rows of 6 categories', () => {
    expect(SENTENCING_TABLE).toHaveLength(43);
    for (const row of SENTENCING_TABLE) expect(row).toHaveLength(6);
  });

  // A transposed or mistyped cell is the most dangerous kind of error here: it
  // produces a plausible number. Monotonicity in both directions catches most of them.
  it('is non-decreasing across criminal history categories within each level', () => {
    SENTENCING_TABLE.forEach((row, i) => {
      for (let c = 1; c < row.length; c += 1) {
        const prev = row[c - 1]!;
        const cur = row[c]!;
        expect(cur.min, `level ${i + 1}, category ${c + 1} minimum`).toBeGreaterThanOrEqual(prev.min);
        if (prev.max !== null && cur.max !== null) {
          expect(cur.max, `level ${i + 1}, category ${c + 1} maximum`).toBeGreaterThanOrEqual(prev.max);
        }
      }
    });
  });

  it('is non-decreasing down offense levels within each category', () => {
    for (let c = 0; c < 6; c += 1) {
      for (let l = 1; l < SENTENCING_TABLE.length; l += 1) {
        const prev = SENTENCING_TABLE[l - 1]![c]!;
        const cur = SENTENCING_TABLE[l]![c]!;
        if (cur.max === null) continue;
        expect(cur.min, `level ${l + 1}, category ${c + 1}`).toBeGreaterThanOrEqual(prev.min);
        expect(cur.max).toBeGreaterThanOrEqual(prev.max ?? 0);
      }
    }
  });

  it('never has a minimum above its maximum', () => {
    SENTENCING_TABLE.forEach((row, i) => {
      row.forEach((cell, c) => {
        if (cell.max !== null) {
          expect(cell.min, `level ${i + 1}, category ${c + 1}`).toBeLessThanOrEqual(cell.max);
        }
      });
    });
  });

  it('places life at the top of the table', () => {
    for (let c = 1; c <= 6; c += 1) {
      expect(lookupRange(43, c as 1).max).toBeNull();
    }
    expect(lookupRange(42, 1).max).toBeNull();
    expect(lookupRange(42, 1).min).toBe(360);
  });

  it('reads known cells correctly', () => {
    expect(lookupRange(1, 1)).toEqual({ min: 0, max: 6 });
    expect(lookupRange(26, 1)).toEqual({ min: 63, max: 78 });
    expect(lookupRange(30, 6)).toEqual({ min: 168, max: 210 });
    expect(lookupRange(12, 3)).toEqual({ min: 15, max: 21 });
  });
});

describe('offense level clamping', () => {
  it('caps at 43 and floors at 1', () => {
    expect(clampOffenseLevel(50)).toBe(43);
    expect(clampOffenseLevel(-4)).toBe(1);
    expect(clampOffenseLevel(0)).toBe(1);
    expect(clampOffenseLevel(20)).toBe(20);
  });
});

describe('zone placement', () => {
  it('derives zones from the range minimum', () => {
    expect(zoneForRange({ min: 0, max: 6 })).toBe('A');
    expect(zoneForRange({ min: 1, max: 7 })).toBe('B');
    expect(zoneForRange({ min: 9, max: 15 })).toBe('B');
    expect(zoneForRange({ min: 10, max: 16 })).toBe('C');
    expect(zoneForRange({ min: 12, max: 18 })).toBe('C');
    expect(zoneForRange({ min: 15, max: 21 })).toBe('D');
    expect(zoneForRange({ min: 360, max: null })).toBe('D');
  });
});

describe('criminal history categories', () => {
  it('maps points to categories at every boundary', () => {
    expect(categoryForPoints(0)).toBe(1);
    expect(categoryForPoints(1)).toBe(1);
    expect(categoryForPoints(2)).toBe(2);
    expect(categoryForPoints(3)).toBe(2);
    expect(categoryForPoints(4)).toBe(3);
    expect(categoryForPoints(6)).toBe(3);
    expect(categoryForPoints(7)).toBe(4);
    expect(categoryForPoints(9)).toBe(4);
    expect(categoryForPoints(10)).toBe(5);
    expect(categoryForPoints(12)).toBe(5);
    expect(categoryForPoints(13)).toBe(6);
    expect(categoryForPoints(30)).toBe(6);
  });
});

describe('§ 2B1.1 loss table', () => {
  it('applies increases at the bracket edges', () => {
    expect(lossIncrease(6_500)).toBe(0);
    expect(lossIncrease(6_501)).toBe(2);
    expect(lossIncrease(15_000)).toBe(2);
    expect(lossIncrease(15_001)).toBe(4);
    expect(lossIncrease(550_000)).toBe(12);
    expect(lossIncrease(550_001)).toBe(14);
    expect(lossIncrease(1_000_000_000)).toBe(30);
  });

  it('is monotonic', () => {
    let previous = -1;
    for (const amount of [0, 6_500, 20_000, 100_000, 300_000, 2_000_000, 10_000_000, 700_000_000]) {
      const increase = lossIncrease(amount);
      expect(increase).toBeGreaterThanOrEqual(previous);
      previous = increase;
    }
  });
});

describe('loss resolution', () => {
  it('takes the greater of actual and intended', () => {
    expect(resolveLoss({ actualLoss: 100_000, intendedLoss: 400_000 })).toMatchObject({
      amount: 400_000,
      basis: 'intended',
    });
    expect(resolveLoss({ actualLoss: 400_000, intendedLoss: 100_000 })).toMatchObject({
      amount: 400_000,
      basis: 'actual',
    });
  });

  it('subtracts credits from the greater figure', () => {
    const result = resolveLoss({
      actualLoss: 300_000,
      credits: [
        { label: 'Funds returned', amount: 50_000 },
        { label: 'Collateral value', amount: 100_000 },
      ],
    });
    expect(result.amount).toBe(150_000);
    expect(result.creditsApplied).toBe(150_000);
    expect(result.gross).toBe(300_000);
    // The credits move the calculation down two brackets, which is the point.
    // Note $150,000 exactly is not "more than $150,000", so it draws +8, not +10.
    expect(lossIncrease(result.amount)).toBe(8);
    expect(lossIncrease(result.gross)).toBe(12);
  });

  it('uses gain only when no loss figure is present', () => {
    expect(resolveLoss({ gain: 80_000 })).toMatchObject({ amount: 80_000, basis: 'gain' });
    expect(resolveLoss({ actualLoss: 10_000, gain: 80_000 })).toMatchObject({
      amount: 10_000,
      basis: 'actual',
    });
  });

  it('never returns a negative loss', () => {
    expect(resolveLoss({ actualLoss: 10_000, credits: [{ label: 'x', amount: 99_000 }] }).amount).toBe(0);
  });
});

describe('§ 2T4.1 tax table', () => {
  it('reads at the bracket edges', () => {
    expect(taxLossLevel(0)).toBe(6);
    expect(taxLossLevel(2_500)).toBe(8);
    expect(taxLossLevel(2_499)).toBe(6);
    expect(taxLossLevel(100_000)).toBe(16);
    expect(taxLossLevel(200_000_000)).toBe(32);
  });
});

describe('§ 3D1.4 unit table', () => {
  it('converts units to a level increase', () => {
    expect(unitIncrease(1)).toBe(0);
    expect(unitIncrease(1.5)).toBe(1);
    expect(unitIncrease(2)).toBe(2);
    expect(unitIncrease(2.5)).toBe(3);
    expect(unitIncrease(3)).toBe(3);
    expect(unitIncrease(3.5)).toBe(4);
    expect(unitIncrease(5)).toBe(4);
    expect(unitIncrease(5.5)).toBe(5);
    expect(unitIncrease(12)).toBe(5);
  });
});

describe('§ 4B1.1(b) career offender table', () => {
  it('maps statutory maxima to offense levels', () => {
    expect(careerOffenderLevel(null)).toBe(37);
    expect(careerOffenderLevel(25 * 12)).toBe(34);
    expect(careerOffenderLevel(20 * 12)).toBe(32);
    expect(careerOffenderLevel(15 * 12)).toBe(29);
    expect(careerOffenderLevel(10 * 12)).toBe(24);
    expect(careerOffenderLevel(5 * 12)).toBe(17);
    expect(careerOffenderLevel(3 * 12)).toBe(12);
  });
});

describe('offense classification (18 U.S.C. § 3559)', () => {
  it('classifies by statutory maximum', () => {
    expect(offenseClass(null)).toBe('A');
    expect(offenseClass(30 * 12)).toBe('B');
    expect(offenseClass(20 * 12)).toBe('C');
    expect(offenseClass(10 * 12)).toBe('C');
    expect(offenseClass(5 * 12)).toBe('D');
    expect(offenseClass(2 * 12)).toBe('E');
    expect(offenseClass(6)).toBe('misdB');
  });
});

describe('§ 5E1.2 fine table', () => {
  it('reads the range for an offense level', () => {
    expect(fineRange(1)).toEqual({ min: 200, max: 9_500 });
    expect(fineRange(20)).toEqual({ min: 15_000, max: 150_000 });
    expect(fineRange(43)).toEqual({ min: 50_000, max: 500_000 });
  });
});
