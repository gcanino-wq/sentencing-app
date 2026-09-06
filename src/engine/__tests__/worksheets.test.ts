import { describe, expect, it } from 'vitest';
import { calculate } from '../calculate';
import { lineMeta } from '../lineMeta';
import { buildWorksheets, flattenWorksheets } from '../worksheets';
import { DEFAULT_ANNOTATIONS, DEFAULT_FACTS } from '../../state/defaults';

const build = (facts = DEFAULT_FACTS, annotations = DEFAULT_ANNOTATIONS) =>
  buildWorksheets(facts, calculate(facts), annotations);

describe('worksheets', () => {
  it('produces all four sheets with unique line ids', () => {
    const sheets = build();
    expect(sheets.map((s) => s.letter)).toEqual(['A', 'B', 'C', 'D']);
    const ids = flattenWorksheets(sheets).map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('carries the calculation onto the numbered lines', () => {
    const lines = flattenWorksheets(build());
    const at = (id: string) => lines.find((l) => l.id === id)!;
    expect(at('A1').value).toBe('7');
    expect(at('A2b').value).toBe('+14');
    expect(at('A6').value).toBe('25');
    expect(at('A8').value).toBe('-3');
    expect(at('A9').value).toBe('22');
    expect(at('D5').value).toBe('II');
    expect(at('D6').value).toBe('46–57');
    expect(at('D8').value).toBe('Not auth.');
  });

  it('marks exactly the lines that can be opened as editable', () => {
    const editable = flattenWorksheets(build())
      .filter((l) => l.editable)
      .map((l) => l.id);
    expect(editable.sort()).toEqual(Object.keys(lineMeta(DEFAULT_FACTS)).sort());
  });

  it('surfaces contested flags and notes from the annotations', () => {
    const lines = flattenWorksheets(build());
    const loss = lines.find((l) => l.id === 'A2b')!;
    expect(loss.contested).toBe(true);
    expect(loss.note).toContain("gov't spreadsheet");
    expect(lines.find((l) => l.id === 'A1')!.contested).toBe(false);
  });

  it('shows the status point on its own line when it is scored', () => {
    const facts = {
      ...DEFAULT_FACTS,
      statusPoints: true,
      priors: [{ desc: 'One', meta: '2019', pts: 7 }],
    };
    const lines = flattenWorksheets(build(facts));
    const status = lines.find((l) => l.id === 'Cst')!;
    expect(status.value).toBe('+1');
    expect(status.cite).toBe('§4A1.1(e)');
    // Worksheet C has to foot: priors plus the status point.
    expect(lines.find((l) => l.id === 'Ctot')!.value).toBe('8');
  });

  it('shows no status point when the subtotal is under seven', () => {
    const facts = {
      ...DEFAULT_FACTS,
      statusPoints: true,
      priors: [{ desc: 'One', meta: '2019', pts: 6 }],
    };
    const lines = flattenWorksheets(build(facts));
    expect(lines.find((l) => l.id === 'Cst')!.value).toBe('0');
    expect(lines.find((l) => l.id === 'Ctot')!.value).toBe('6');
  });

  it('cites the loss and victim lines from the facts rather than the demo', () => {
    const lines = flattenWorksheets(
      build({ ...DEFAULT_FACTS, loss: 50_000, victims: 2, hardship: 'none', socs: [] }),
    );
    const at = (id: string) => lines.find((l) => l.id === id)!;
    expect(at('A2b').cite).toBe('§2B1.1(b)(1)(D)');
    expect(at('A2b').excerpt).toContain('more than $40,000');
    expect(at('A2b').value).toBe('+6');
    expect(at('A2c').cite).toBe('§2B1.1(b)(2)');
    expect(at('A2c').excerpt).toContain('fewer than 10');
    expect(at('A2c').value).toBe('0');
  });

  it('scores mass-marketing on line 2(c) and not again on 2(d)', () => {
    const lines = flattenWorksheets(
      build({ ...DEFAULT_FACTS, victims: 2, hardship: 'none', socs: ['mass'] }),
    );
    const at = (id: string) => lines.find((l) => l.id === id)!;
    expect(at('A2c').cite).toBe('§2B1.1(b)(2)(A)');
    expect(at('A2c').value).toBe('+2');
    expect(at('A2d').value).toBe('0');
  });

  it('gives Worksheet C one line per prior plus the three standing lines', () => {
    const facts = {
      ...DEFAULT_FACTS,
      priors: [
        { desc: 'One', meta: '2019', pts: 2 },
        { desc: 'Two', meta: '2021', pts: 1 },
      ],
    };
    const c = build(facts).find((s) => s.letter === 'C')!;
    expect(c.lines).toHaveLength(5);
    expect(c.lines[0].label).toBe('Prior Sentence — One');
    expect(c.lines.at(-1)!.value).toBe('3');
  });
});

describe('line metadata', () => {
  it('applies an edit to the facts it governs', () => {
    const meta = lineMeta(DEFAULT_FACTS);
    const loss = meta.A2b;
    expect(loss.kind).toBe('number');
    expect(loss.apply('$600,000', DEFAULT_FACTS)).toEqual({ loss: 600_000 });

    const role = meta.A4;
    expect(role.apply('mgr', DEFAULT_FACTS)).toEqual({ role: 'mgr' });
    expect(meta.A5.apply('yes', DEFAULT_FACTS)).toEqual({ obstruction: true });
  });

  it('reflects the current answer as the selected option value', () => {
    const meta = lineMeta({ ...DEFAULT_FACTS, role: 'org', acceptance: 2 });
    expect(meta.A4.value).toBe('org');
    expect(meta.A8.value).toBe('2');
  });
});
