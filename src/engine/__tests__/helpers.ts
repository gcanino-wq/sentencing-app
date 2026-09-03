import type { CaseInput, CountInput, PriorConviction } from '../types';

export function makeCount(partial: Partial<CountInput> & { id: string }): CountInput {
  return {
    socs: [],
    chapter3: {},
    ...partial,
  };
}

export function makePrior(partial: Partial<PriorConviction> & { id: string }): PriorConviction {
  return {
    description: partial.description ?? `Prior ${partial.id}`,
    sentenceImposedMonths: 0,
    ...partial,
  };
}

export function makeCase(partial: Partial<CaseInput> = {}): CaseInput {
  return {
    districtId: 'pr',
    counts: [],
    criminalHistory: { priors: [] },
    ...partial,
  };
}
