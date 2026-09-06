import { describe, expect, it } from 'vitest';
import { CATS, MINS, rangeFor, zoneCopy, zoneFor } from '../sentencingTable';

describe('sentencing table', () => {
  it('covers levels 1 through 42 with six categories each', () => {
    for (let level = 1; level <= 42; level++) {
      expect(MINS[level], 'level ' + level).toHaveLength(CATS.length);
    }
  });

  it('never decreases as the level or the category rises', () => {
    for (let level = 2; level <= 42; level++) {
      for (let ci = 0; ci < CATS.length; ci++) {
        expect(MINS[level][ci]).toBeGreaterThanOrEqual(MINS[level - 1][ci]);
      }
      for (let ci = 1; ci < CATS.length; ci++) {
        expect(MINS[level][ci]).toBeGreaterThanOrEqual(MINS[level][ci - 1]);
      }
    }
  });

  it('reproduces published ranges', () => {
    expect(rangeFor(26, 0).text).toBe('63–78');
    expect(rangeFor(20, 0).text).toBe('33–41');
    expect(rangeFor(12, 0).text).toBe('10–16');
    expect(rangeFor(30, 5).text).toBe('168–210');
    expect(rangeFor(1, 0).text).toBe('0–6');
    expect(rangeFor(21, 5).text).toBe('77–96');
    expect(rangeFor(22, 4).text).toBe('77–96');
    expect(rangeFor(24, 3).text).toBe('77–96');
  });

  it('runs categories IV, V and VI through one shared sequence in the middle', () => {
    // Categories IV, V and VI climb the same run of minimums — 63, 70, 77, 84,
    // 92, 100, 110 — each reaching it two levels earlier than the one before,
    // and only part company above 110, where IV coarsens to 121, 135 while V
    // and VI keep the finer 120, 130, 140. Two cells were transcribed as 78
    // rather than 77, which this pins.
    const shared = [63, 70, 77, 84, 92, 100, 110];
    shared.forEach((months, step) => {
      expect(MINS[22 + step][3], 'cat IV, level ' + (22 + step)).toBe(months);
      expect(MINS[20 + step][4], 'cat V, level ' + (20 + step)).toBe(months);
      expect(MINS[19 + step][5], 'cat VI, level ' + (19 + step)).toBe(months);
    });
  });

  it('keeps category V two levels behind IV and VI one behind V where they agree', () => {
    for (let level = 7; level <= 26; level++) {
      expect(MINS[level][4], 'cat V at level ' + level).toBe(MINS[level + 2][3]);
    }
    for (let level = 4; level <= 41; level++) {
      expect(MINS[level][5], 'cat VI at level ' + level).toBe(MINS[level + 1][4]);
    }
  });

  it('prints 360 or more as 360–life', () => {
    expect(rangeFor(42, 0).text).toBe('360–life');
    expect(rangeFor(38, 4).text).toBe('360–life');
  });

  it('clamps levels outside the table', () => {
    expect(rangeFor(0, 0)).toEqual(rangeFor(1, 0));
    expect(rangeFor(99, 3)).toEqual(rangeFor(42, 3));
  });

  it('assigns zones from the top of the range', () => {
    expect(zoneFor(rangeFor(6, 0))).toBe('A');
    expect(zoneFor(rangeFor(9, 0))).toBe('B');
    expect(zoneFor(rangeFor(12, 0))).toBe('C');
    expect(zoneFor(rangeFor(26, 0))).toBe('D');
  });

  it('has copy for every zone', () => {
    for (const zone of ['A', 'B', 'C', 'D'] as const) {
      expect(zoneCopy(zone).length).toBeGreaterThan(0);
    }
  });
});
