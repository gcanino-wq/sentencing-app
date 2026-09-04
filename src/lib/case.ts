import type { CaseInput, CountInput, PriorConviction } from '@/engine/types';
import { DEFAULT_DISTRICT_ID } from '@/engine/data/districts';

let counter = 0;
export function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}-${Math.random().toString(36).slice(2, 7)}`;
}

export function emptyCount(index: number): CountInput {
  return {
    id: nextId('count'),
    label: `Count ${index}`,
    socs: [],
    chapter3: {},
  };
}

export function emptyPrior(): PriorConviction {
  return {
    id: nextId('prior'),
    description: '',
    sentenceImposedMonths: 0,
  };
}

export function emptyCase(): CaseInput {
  return {
    districtId: DEFAULT_DISTRICT_ID,
    counts: [emptyCount(1)],
    criminalHistory: { priors: [] },
    acceptance: { granted: false },
    departures: [],
    variance: { entries: [] },
  };
}

export function formatMoney(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

export function formatMonths(months: number): string {
  if (months === 0) return '0 months';
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${months} months`;
  if (rest === 0) return `${months} months (${years} year${years === 1 ? '' : 's'})`;
  return `${months} months (${years}y ${rest}m)`;
}

export const CATEGORY_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const;
