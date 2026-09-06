import { describe, expect, it } from 'vitest';
import { calculate } from '../calculate';
import { chapterTwoTotal, type OffenseCharacteristic } from '../guideline';
import { GUIDELINES, guidelineFor, isImplemented } from '../guidelines';
import { DEFAULT_FACTS } from '../../state/defaults';

const soc = (id: string, levels: number): OffenseCharacteristic => ({
  id,
  num: '2(x)',
  label: id,
  cite: '§',
  excerpt: '',
  levels,
});

describe('guideline registry', () => {
  it('knows §2B1.1 computes and the rest do not yet', () => {
    expect(isImplemented('2B1.1')).toBe(true);
    for (const id of ['2K2.1', '2D1.1', '2D2.1'] as const) {
      expect(isImplemented(id), id).toBe(false);
    }
  });

  it('gives every entry a citation and a title', () => {
    for (const [id, guideline] of Object.entries(GUIDELINES)) {
      expect(guideline.id, id).toBe(id);
      expect(guideline.cite, id).toMatch(/^§\d/);
      expect(guideline.title.length, id).toBeGreaterThan(0);
    }
  });

  it('falls back to §2B1.1 when no guideline is named', () => {
    expect(guidelineFor().id).toBe('2B1.1');
    expect(guidelineFor(undefined).id).toBe('2B1.1');
  });

  it('refuses to invent an offense level for a guideline it cannot compute', () => {
    expect(() => calculate({ ...DEFAULT_FACTS, guideline: '2K2.1' })).toThrow(/not implemented/);
    expect(() => calculate({ ...DEFAULT_FACTS, guideline: '2D1.1' })).toThrow(/§2D1.1/);
  });

  it('sums characteristics onto the base, and applies a cap when one binds', () => {
    expect(chapterTwoTotal(20, [soc('a', 2), soc('b', 4)])).toEqual({ total: 26 });

    const cap = { levels: 29, cite: '§2K2.1(b)' };
    expect(chapterTwoTotal(20, [soc('a', 6), soc('b', 6)], cap)).toEqual({ total: 29, cap });
    // A cap that does not bind leaves the total alone and reports no cap.
    expect(chapterTwoTotal(20, [soc('a', 2)], cap)).toEqual({ total: 22 });
  });
});

describe('§2B1.1 through the registry', () => {
  it('produces the same offense level as before the guideline was made pluggable', () => {
    const calc = calculate(DEFAULT_FACTS);
    expect(calc.base).toBe(7);
    expect(calc.ch2).toBe(25);
    expect(calc.total).toBe(22);
    expect(calc.range.text).toBe('46–57');
  });

  it('reports its characteristics with stable worksheet ids', () => {
    const { characteristics } = calculate(DEFAULT_FACTS).ch2Result;
    expect(characteristics.map((c) => c.id)).toEqual(['A2b', 'A2c', 'A2d']);
    expect(characteristics.map((c) => c.levels)).toEqual([14, 2, 2]);
  });
});
