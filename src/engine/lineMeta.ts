import type { CaseFacts } from './types';

export interface LineOption {
  value: string;
  label: string;
  delta: string;
}

/** The editable half of a worksheet line: what it cites and how it is changed. */
export type LineMeta =
  | {
      kind: 'number';
      unit: string;
      value: number;
      text: string;
      apply: (raw: string, facts: CaseFacts) => Partial<CaseFacts>;
    }
  | {
      kind: 'choice';
      value: string;
      text: string;
      options: LineOption[];
      apply: (value: string, facts: CaseFacts) => Partial<CaseFacts>;
    };

const digitsOnly = (raw: string) => Number(raw.replace(/[^0-9]/g, '') || 0);

/**
 * Guideline text and edit behaviour for each worksheet line the practitioner
 * can open. Lines absent from this map are computed and not directly editable.
 */
export function lineMeta(facts: CaseFacts): Record<string, LineMeta> {
  return {
    A1: {
      kind: 'choice',
      value: String(facts.statMax),
      text: 'Base offense level: (1) 7, if the defendant was convicted of an offense referenced to this guideline and that offense of conviction has a statutory maximum term of imprisonment of 20 years or more; or (2) 6, otherwise.',
      options: [
        { value: '20', label: 'Statutory maximum 20 years or more', delta: '7' },
        { value: '10', label: 'Statutory maximum under 20 years', delta: '6' },
      ],
      apply: (value) => ({ statMax: Number(value) }),
    },
    A2b: {
      kind: 'number',
      unit: 'LOSS UNDER §2B1.1(b)(1)',
      value: facts.loss,
      text: 'If the loss exceeded $6,500, increase the offense level as follows … (H) More than $550,000, add 14; (I) More than $1,500,000, add 16.',
      apply: (raw) => ({ loss: digitsOnly(raw) }),
    },
    A2c: {
      kind: 'choice',
      value: facts.hardship,
      text: 'If the offense (i) involved 10 or more victims; (ii) was committed through mass-marketing; or (iii) resulted in substantial financial hardship to one or more victims, increase by 2 levels.',
      options: [
        { value: 'none', label: 'No victim-count or hardship finding', delta: '+0' },
        { value: '1', label: '10+ victims, or hardship to 1 or more', delta: '+2' },
        { value: '5', label: 'Substantial hardship to 5 or more victims', delta: '+4' },
        { value: '25', label: 'Substantial hardship to 25 or more victims', delta: '+6' },
      ],
      apply: (value) => ({ hardship: value as CaseFacts['hardship'] }),
    },
    A4: {
      kind: 'choice',
      value: facts.role,
      text: 'If the defendant was an organizer or leader of criminal activity that involved five or more participants or was otherwise extensive, increase by 4 levels.',
      options: [
        { value: 'none', label: 'No role adjustment', delta: '+0' },
        { value: 'org', label: 'Organizer or leader, 5+ participants', delta: '+4' },
        { value: 'mgr', label: 'Manager or supervisor, 5+ participants', delta: '+3' },
        { value: 'sup', label: 'Organizer, leader, manager or supervisor (other)', delta: '+2' },
        { value: 'minor', label: 'Minor participant', delta: '−2' },
        { value: 'minimal', label: 'Minimal participant', delta: '−4' },
      ],
      apply: (value) => ({ role: value as CaseFacts['role'] }),
    },
    A5: {
      kind: 'choice',
      value: facts.obstruction ? 'yes' : 'no',
      text: 'If the defendant willfully obstructed or impeded, or attempted to obstruct or impede, the administration of justice with respect to the investigation, prosecution, or sentencing of the instant offense, increase by 2 levels.',
      options: [
        { value: 'no', label: 'No obstruction finding', delta: '+0' },
        { value: 'yes', label: 'Obstruction of justice', delta: '+2' },
      ],
      apply: (value) => ({ obstruction: value === 'yes' }),
    },
    A8: {
      kind: 'choice',
      value: String(facts.acceptance),
      text: 'If the defendant clearly demonstrates acceptance of responsibility, decrease by 2 levels. If the offense level prior to this subsection is 16 or greater and the defendant timely notified authorities of the intention to plead guilty, decrease by 1 additional level.',
      options: [
        { value: '3', label: 'Acceptance, timely plea, level 16+', delta: '−3' },
        { value: '2', label: 'Acceptance only', delta: '−2' },
        { value: '0', label: 'No acceptance (trial or denial)', delta: '−0' },
      ],
      apply: (value) => ({ acceptance: Number(value) }),
    },
  };
}
