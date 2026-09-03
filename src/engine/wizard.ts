import { money } from './format';
import type { CaseFacts, SocKey } from './types';

export interface WizardOption {
  /** Identifies the option within its step. */
  value: string;
  label: string;
  note: string;
  /** True when this option is currently the answer. */
  selected: boolean;
  /** Facts to merge when the option is picked. Absent for multi-select steps. */
  patch?: Partial<CaseFacts>;
  /** Set for multi-select steps: the characteristic this option toggles. */
  toggles?: SocKey;
}

export interface QuickAmount {
  label: string;
  value: number;
}

export type WizardStep =
  | {
      kind: 'choice';
      cite: string;
      label: string;
      help: string;
      /** Multi-select steps let more than one option stay lit at once. */
      multi: boolean;
      options: WizardOption[];
    }
  | {
      kind: 'number';
      cite: string;
      label: string;
      help: string;
      unit: string;
      value: string;
      quick: QuickAmount[];
    }
  | {
      kind: 'priors';
      cite: string;
      label: string;
      help: string;
    };

/**
 * The interview. Facts a table decides are asked as plain questions; judgment
 * calls are asked as multi-select, and criminal history gets its own step.
 */
export function wizardSteps(facts: CaseFacts): WizardStep[] {
  const one = (
    value: string,
    current: string,
    patch: Partial<CaseFacts>,
    label: string,
    note: string,
  ): WizardOption => ({ value, label, note, selected: value === current, patch });

  const many = (value: SocKey, label: string, note: string): WizardOption => ({
    value,
    label,
    note,
    selected: facts.socs.includes(value),
    toggles: value,
  });

  return [
    {
      kind: 'choice',
      cite: '§2B1.1(a)',
      label: 'What is the statutory maximum for the count of conviction?',
      help: 'Sets the base offense level. Wire fraud carries 20 years, or 30 if it affected a financial institution or related to a declared disaster.',
      multi: false,
      options: [
        one('20', String(facts.statMax), { statMax: 20 }, '20 years or more', 'base offense level 7'),
        one('10', String(facts.statMax), { statMax: 10 }, 'Less than 20 years', 'base offense level 6'),
      ],
    },
    {
      kind: 'number',
      cite: '§2B1.1(b)(1)',
      label: 'What is the loss?',
      unit: 'ACTUAL OR INTENDED LOSS, WHICHEVER IS GREATER',
      help: 'The table decides this one. Loss is the greater of actual or intended loss; credits against loss come later.',
      value: money(facts.loss),
      quick: [
        { label: money(550_001), value: 550_001 },
        { label: money(1_200_000), value: 1_200_000 },
        { label: money(1_500_001), value: 1_500_001 },
      ],
    },
    {
      kind: 'choice',
      cite: '§2B1.1(b)(2)',
      label: 'Victims and financial hardship',
      help: 'Twelve victims triggers the 10-or-more prong. Substantial hardship findings escalate it further, so enter the highest that the record supports.',
      multi: false,
      options: [
        one('none', facts.hardship, { hardship: 'none' }, 'No victim-count or hardship finding', '+0'),
        one('1', facts.hardship, { hardship: '1' }, '10 or more victims, or hardship to 1+', '+2'),
        one('5', facts.hardship, { hardship: '5' }, 'Substantial hardship to 5 or more', '+4'),
        one('25', facts.hardship, { hardship: '25' }, 'Substantial hardship to 25 or more', '+6'),
      ],
    },
    {
      kind: 'choice',
      cite: '§2B1.1(b)(10) · (b)(3)',
      label: 'Which of these does the conduct support?',
      help: 'Judgment calls — pick any that apply. Each adds 2 levels.',
      multi: true,
      options: [
        many('soph', 'Sophisticated means', '§2B1.1(b)(10)(C) · +2'),
        many('mass', 'Mass-marketing', '§2B1.1(b)(2)(A)(ii) · +2'),
        many('charity', 'Misrepresented charitable or government affiliation', '§2B1.1(b)(9)(A) · +2'),
      ],
    },
    {
      kind: 'choice',
      cite: 'Ch. 3, Pts. B & C',
      label: 'Role in the offense',
      help: 'Aggravating role requires five or more participants or otherwise extensive activity.',
      multi: false,
      options: [
        one('none', facts.role, { role: 'none' }, 'No role adjustment', '+0'),
        one('org', facts.role, { role: 'org' }, 'Organizer or leader', '§3B1.1(a) · +4'),
        one('mgr', facts.role, { role: 'mgr' }, 'Manager or supervisor', '§3B1.1(b) · +3'),
        one('minor', facts.role, { role: 'minor' }, 'Minor participant', '§3B1.2(b) · −2'),
      ],
    },
    {
      kind: 'priors',
      cite: 'Ch. 4, Pt. A',
      label: 'Criminal history',
      help: 'Enter each prior and the app scores it, or switch to Direct and enter the point total yourself.',
    },
    {
      kind: 'choice',
      cite: '§3E1.1',
      label: 'Acceptance of responsibility',
      help: 'The third level requires a government motion and a timely plea, and is available only when the level before the reduction is 16 or greater.',
      multi: false,
      options: [
        one('3', String(facts.acceptance), { acceptance: 3 }, 'Acceptance, timely plea, level 16+', '−3'),
        one('2', String(facts.acceptance), { acceptance: 2 }, 'Acceptance only', '−2'),
        one('0', String(facts.acceptance), { acceptance: 0 }, 'Not applicable', '−0'),
      ],
    },
  ];
}
