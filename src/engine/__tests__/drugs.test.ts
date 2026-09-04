import { describe, expect, it } from 'vitest';
import {
  SUBSTANCE_BY_ID,
  drugQuantityLevel,
  entryToConvertedKg,
  entryToGrams,
  nextDrugThreshold,
  totalConvertedKg,
} from '../data/drugs';

describe('unit conversion', () => {
  it('converts weight units to grams', () => {
    expect(entryToGrams({ substanceId: 'heroin', quantity: 1, unit: 'kg' })).toBe(1000);
    expect(entryToGrams({ substanceId: 'heroin', quantity: 500, unit: 'mg' })).toBe(0.5);
    expect(entryToGrams({ substanceId: 'heroin', quantity: 1, unit: 'lb' })).toBeCloseTo(453.59237);
    expect(entryToGrams({ substanceId: 'heroin', quantity: 1, unit: 'oz' })).toBeCloseTo(28.349523125);
  });

  it('converts pills using the mg strength of the active ingredient', () => {
    // 1,000 oxycodone 30 mg tablets = 30,000 mg = 30 g of oxycodone (actual).
    const grams = entryToGrams({
      substanceId: 'oxycodone',
      quantity: 1000,
      unit: 'pills',
      mgPerUnit: 30,
    });
    expect(grams).toBe(30);
  });

  it('treats marihuana plants per-plant rather than by weight', () => {
    // 100 plants x 100 g converted = 10 kg converted.
    expect(entryToConvertedKg({ substanceId: 'marihuana-plants', quantity: 100, unit: 'plants' })).toBe(10);
  });
});

describe('converted drug weight', () => {
  it('anchors heroin at 1 g = 1 kg converted', () => {
    expect(entryToConvertedKg({ substanceId: 'heroin', quantity: 1, unit: 'g' })).toBe(1);
  });

  it('separates methamphetamine actual from mixture by a factor of ten', () => {
    const mixture = entryToConvertedKg({ substanceId: 'meth-mixture', quantity: 100, unit: 'g' });
    const actual = entryToConvertedKg({ substanceId: 'meth-actual', quantity: 100, unit: 'g' });
    expect(mixture).toBe(200);
    expect(actual).toBe(2000);
    expect(actual / mixture).toBe(10);
  });

  it('sums multiple substances into one converted weight', () => {
    const total = totalConvertedKg([
      { substanceId: 'cocaine', quantity: 5, unit: 'kg' }, // 5000 g x 200 g = 1000 kg
      { substanceId: 'heroin', quantity: 100, unit: 'g' }, // 100 kg
    ]);
    expect(total).toBe(1100);
  });

  it('ignores unknown substances rather than throwing', () => {
    expect(entryToConvertedKg({ substanceId: 'nonexistent', quantity: 5, unit: 'kg' })).toBe(0);
  });
});

describe('§ 2D1.1(c) Drug Quantity Table', () => {
  it('reads at the bracket edges', () => {
    expect(drugQuantityLevel(0)).toBe(6);
    expect(drugQuantityLevel(0.99)).toBe(6);
    expect(drugQuantityLevel(1)).toBe(8);
    expect(drugQuantityLevel(400)).toBe(26);
    expect(drugQuantityLevel(399.9)).toBe(24);
    expect(drugQuantityLevel(90_000)).toBe(38);
    expect(drugQuantityLevel(1_000_000)).toBe(38);
  });

  it('reproduces the heroin thresholds the table is built from', () => {
    // 1 g heroin = 1 kg converted, so heroin grams read straight off the table.
    const heroinGrams = (g: number) =>
      drugQuantityLevel(totalConvertedKg([{ substanceId: 'heroin', quantity: g, unit: 'g' }]));
    expect(heroinGrams(90_000)).toBe(38); // 90 kg
    expect(heroinGrams(1_000)).toBe(30); // 1 kg
    expect(heroinGrams(100)).toBe(24);
    expect(heroinGrams(0.5)).toBe(6);
  });

  it('is monotonic in quantity', () => {
    let previous = 0;
    for (const kg of [0, 1, 5, 20, 100, 700, 3_000, 30_000, 90_000]) {
      const level = drugQuantityLevel(kg);
      expect(level).toBeGreaterThanOrEqual(previous);
      previous = level;
    }
  });

  it('reports the next threshold up so proximity to a bracket is visible', () => {
    expect(nextDrugThreshold(399)).toEqual({ level: 26, atKg: 400 });
    expect(nextDrugThreshold(200_000)).toBeNull();
  });
});

describe('substance table integrity', () => {
  it('has unique ids and positive ratios', () => {
    const ids = new Set<string>();
    for (const [id, substance] of SUBSTANCE_BY_ID) {
      expect(ids.has(id)).toBe(false);
      ids.add(id);
      expect(substance.gramsConvertedPerGram).toBeGreaterThan(0);
    }
  });
});
