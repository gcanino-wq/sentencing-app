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
