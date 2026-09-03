import { describe, expect, it } from 'vitest';
import {
  baseLevel,
  lossAdjustment,
  roleAdjustment,
  socAdjustment,
  socLabels,
  victimAdjustment,
} from '../guideline2B1_1';

describe('§2B1.1', () => {
  it('sets the base level off the statutory maximum', () => {
    expect(baseLevel(20)).toBe(7);
    expect(baseLevel(30)).toBe(7);
    expect(baseLevel(10)).toBe(6);
  });

  it('applies the loss table on a strictly-more-than basis', () => {
    expect(lossAdjustment(6_500)).toBe(0);
    expect(lossAdjustment(6_501)).toBe(2);
    expect(lossAdjustment(550_000)).toBe(12);
    expect(lossAdjustment(550_001)).toBe(14);
    expect(lossAdjustment(1_200_000)).toBe(14);
    expect(lossAdjustment(1_500_001)).toBe(16);
    expect(lossAdjustment(600_000_000)).toBe(30);
  });

  it('takes only the highest victim or hardship prong', () => {
    expect(victimAdjustment({ hardship: 'none', victims: 3 })).toBe(0);
    expect(victimAdjustment({ hardship: 'none', victims: 12 })).toBe(2);
    expect(victimAdjustment({ hardship: '1', victims: 1 })).toBe(2);
    expect(victimAdjustment({ hardship: '5', victims: 1 })).toBe(4);
    expect(victimAdjustment({ hardship: '25', victims: 1 })).toBe(6);
  });

  it('adds two levels per specific offense characteristic', () => {
    expect(socAdjustment([])).toBe(0);
    expect(socAdjustment(['soph'])).toBe(2);
    expect(socAdjustment(['soph', 'mass', 'charity'])).toBe(6);
    expect(socLabels(['soph', 'charity'])).toEqual([
      'sophisticated means, +2',
      'charitable misrepresentation, +2',
    ]);
  });

  it('scores role in the offense in both directions', () => {
    expect(roleAdjustment('org')).toBe(4);
    expect(roleAdjustment('mgr')).toBe(3);
    expect(roleAdjustment('sup')).toBe(2);
    expect(roleAdjustment('none')).toBe(0);
    expect(roleAdjustment('minor')).toBe(-2);
    expect(roleAdjustment('minimal')).toBe(-4);
  });
});
