import type { Calculation } from './calculate';
import { money, sgn } from './format';
import { socLabels } from './guideline2B1_1';
import { lineMeta } from './lineMeta';
import { CATS } from './sentencingTable';
import type { CaseFacts } from './types';

export interface WorksheetLine {
  id: string;
  /** Official line number, e.g. "2(b)". */
  num: string;
  label: string;
  cite: string;
  /** One line of why this line reads the way it does. */
  excerpt: string;
  /** What the line contributes, as printed. "—" when it does not apply. */
  value: string;
  contested: boolean;
  note: string;
  /** True when the practitioner can open this line and change it. */
  editable: boolean;
}

export interface Worksheet {
  letter: 'A' | 'B' | 'C' | 'D';
  title: string;
  lines: WorksheetLine[];
}

export interface Annotations {
  contested: Record<string, boolean>;
  notes: Record<string, string>;
}

/**
 * Builds Worksheets A–D from the facts and the calculation, keeping the
 * official line numbering and language of the USSC worksheets.
 */
export function buildWorksheets(
  facts: CaseFacts,
  calc: Calculation,
  annotations: Annotations,
): Worksheet[] {
  const editable = lineMeta(facts);

  const line = (
    id: string,
    num: string,
    label: string,
    cite: string,
    excerpt: string,
    value: string,
  ): WorksheetLine => ({
    id,
    num,
    label,
    cite,
    excerpt,
    value,
    contested: !!annotations.contested[id],
    note: annotations.notes[id] || '',
    editable: id in editable,
  });

  const a: WorksheetLine[] = [
    line('A1', '1.', 'Base Offense Level', '§2B1.1(a)(1)', '20-year statutory maximum under § 1343', String(calc.base)),
    line('A2b', '2(b)', 'Specific Offense Characteristic — loss', '§2B1.1(b)(1)(H)', money(facts.loss) + ' loss · more than $550,000', sgn(calc.loss)),
    line('A2c', '2(c)', 'Specific Offense Characteristic — victims', '§2B1.1(b)(2)(A)', facts.victims + ' victims · 10 or more', sgn(calc.vic)),
    line('A2d', '2(d)', 'Specific Offense Characteristic — conduct', '§2B1.1(b)(10)(C)', socLabels(facts.socs).join(' · ') || 'none applied', sgn(calc.soc)),
    line('A3', '3.', 'Victim-Related Adjustment', 'Ch. 3, Pt. A', 'no vulnerable-victim or official-victim finding', '+0'),
    line('A4', '4.', 'Adjustment for Role in the Offense', 'Ch. 3, Pt. B', facts.role === 'none' ? 'no aggravating or mitigating role' : 'role adjustment applied', sgn(calc.role)),
    line('A5', '5.', 'Adjustment for Obstruction of Justice', 'Ch. 3, Pt. C', facts.obstruction ? 'obstruction found' : 'no obstruction finding', sgn(calc.obs)),
    line('A6', '6.', 'Adjusted Offense Level (Subtotal)', 'sum of lines 1–5', 'before grouping and acceptance', String(calc.adjusted)),
    line('A7', '7.', 'Multiple-Count Adjustment', 'Ch. 3, Pt. D', 'single count of conviction — see Worksheet B', '—'),
    line('A8', '8.', 'Adjustment for Acceptance of Responsibility', '§3E1.1(a)–(b)', facts.acceptance === 3 ? 'timely plea, level 16 or greater' : facts.acceptance === 2 ? 'acceptance only' : 'not applied', sgn(calc.acc)),
    line('A9', '9.', 'Total Offense Level', 'line 6 plus line 8', 'carried to Worksheet D, line 1', String(calc.total)),
  ];

  const b: WorksheetLine[] = [
    line('B1', '1.', 'Adjusted Offense Level for each Group', '§3D1.2', 'Group 1 — Count 1, § 1343', String(calc.adjusted)),
    line('B2', '2.', 'Number of Units', '§3D1.4', 'one group · 1 unit', '1'),
    line('B3', '3.', 'Increase in Offense Level', '§3D1.4 table', '1 unit — no increase', '+0'),
    line('B4', '4.', 'Combined Adjusted Offense Level', '§3D1.4', 'equals the single group', String(calc.adjusted)),
  ];

  const c: WorksheetLine[] = facts.priors
    .map((prior, i) =>
      line('C' + (i + 1), String(i + 1) + '.', 'Prior Sentence — ' + prior.desc, '§4A1.1(b)', prior.meta + ' · at least 60 days', sgn(prior.pts)),
    )
    .concat([
      line('Cst', '5.', 'Status Points', '§4A1.1(e)', 'applies only at 7 or more points — ' + calc.pts + ' here', '+0'),
      line('Czp', '6.', 'Zero-Point Offender Reduction', '§4C1.1', calc.pts === 0 ? 'eligible — verify all ten criteria' : 'not eligible · ' + calc.pts + ' points', calc.pts === 0 ? '−2' : '—'),
      line('Ctot', '7.', 'Total Criminal History Points', 'sum of lines 1–6', 'yields Category ' + CATS[calc.ci], String(calc.pts)),
    ]);

  const d: WorksheetLine[] = [
    line('D1', '1.', 'Combined Adjusted Offense Level', 'Worksheet A line 6 / B line 4', 'before Chapter 4 overrides', String(calc.adjusted)),
    line('D2', '2.', 'Career Offender / Armed Career Criminal', '§4B1.1 · §4B1.4', 'no qualifying predicates entered', '—'),
    line('D3', '3.', 'Acceptance of Responsibility', '§3E1.1', 'carried from Worksheet A line 8', sgn(calc.acc)),
    line('D4', '4.', 'Total Offense Level', 'lines 1–3', 'final offense level', String(calc.total)),
    line('D5', '5.', 'Criminal History Category', 'Worksheet C line 7', calc.pts + ' points', CATS[calc.ci]),
    line('D6', '6.', 'Guideline Range from Sentencing Table', 'Ch. 5, Pt. A', 'level ' + calc.total + ', Category ' + CATS[calc.ci], calc.range.text),
    line('D7', '7.', 'Supervised Release Range', '§5D1.2(a)(2)', 'Class B or C felony', '1–3 yrs'),
    line('D8', '8.', 'Probation', '§5B1.1 · §5C1.1', 'Zone ' + calc.zone, calc.zone === 'D' ? 'Not auth.' : 'Available'),
    line('D9', '9.', 'Restitution', '18 U.S.C. § 3663A', 'mandatory for this offense', money(facts.loss)),
  ];

  return [
    { letter: 'A', title: 'Offense Level · Count 1', lines: a },
    { letter: 'B', title: 'Multiple Counts', lines: b },
    { letter: 'C', title: 'Criminal History', lines: c },
    { letter: 'D', title: 'Range', lines: d },
  ];
}

/** Every line across all four worksheets, in order. */
export function flattenWorksheets(sheets: Worksheet[]): WorksheetLine[] {
  return sheets.flatMap((sheet) => sheet.lines);
}
