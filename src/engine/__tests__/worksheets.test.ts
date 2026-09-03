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
