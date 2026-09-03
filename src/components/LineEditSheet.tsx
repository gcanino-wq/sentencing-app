import { useEffect } from 'react';
import { money } from '../engine/format';
import { lineMeta } from '../engine/lineMeta';
import { flattenWorksheets } from '../engine/worksheets';
import type { CaseController } from '../state/useCase';
import { Switch } from './Switch';

/**
 * The sheet that opens over a worksheet line: the guideline text it comes from,
 * the control that changes it, a contested flag and a note for the file.
 */
export function LineEditSheet({ controller }: { controller: CaseController }) {
  const { openLineId, openLine, facts, patch, sheets, annotations, setNote, toggleContested } =
    controller;

  useEffect(() => {
    if (!openLineId) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') openLine(null);
    };
    const restore = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', close);
    return () => {
      document.body.style.overflow = restore;
      window.removeEventListener('keydown', close);
    };
  }, [openLineId, openLine]);

  if (!openLineId) return null;

  const meta = lineMeta(facts)[openLineId];
  const line = flattenWorksheets(sheets).find((l) => l.id === openLineId);
  if (!meta || !line) return null;

  const contested = !!annotations.contested[openLineId];

  return (
    <>
      <div className="scrim" onClick={() => openLine(null)} />
      <div className="edit-sheet" role="dialog" aria-modal="true" aria-label={line.label}>
        <div className="grabber" />

        <div style={{ font: '600 12px/1 var(--mono)', color: 'var(--accent)' }}>{line.cite}</div>
        <div style={{ font: '600 19px/1.3 var(--sans)', marginTop: 7 }}>{line.label}</div>
        <p className="guideline-text">{meta.text}</p>

        {meta.kind === 'number' && (
          <div className="amount-field">
            <span className="eyebrow">{meta.unit}</span>
            <input
              className="amount-input"
              inputMode="numeric"
              value={money(meta.value)}
              onChange={(e) => patch(meta.apply(e.target.value, facts))}
              aria-label={line.label}
            />
          </div>
        )}

        {meta.kind === 'choice' && (
          <div className="options single-column" style={{ marginTop: 18 }}>
            {meta.options.map((option) => (
              <button
                key={option.value}
                className={'option' + (option.value === meta.value ? ' selected' : '')}
                aria-pressed={option.value === meta.value}
                onClick={() => patch(meta.apply(option.value, facts))}
                style={{ justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span className="option-label">{option.label}</span>
                <span className="delta">{option.delta}</span>
              </button>
            ))}
          </div>
        )}

        <button
          className="toggle-row"
          style={{ marginTop: 18 }}
          onClick={() => toggleContested(openLineId)}
        >
          <span>
            <span className="option-label" style={{ display: 'block' }}>
              Mark this fact contested
            </span>
            <span className="option-note" style={{ display: 'block' }}>
              Flagged in the assumptions list on the result
            </span>
          </span>
          <Switch on={contested} warn label="Mark this fact contested" />
        </button>

        <div className="note-field">
          <span className="eyebrow" style={{ display: 'block', marginBottom: 7 }}>
            Note for the file
          </span>
          <input
            value={annotations.notes[openLineId] ?? ''}
            onChange={(e) => setNote(openLineId, e.target.value)}
            placeholder="e.g. loss figure per government's spreadsheet; disputed"
            aria-label="Note for the file"
          />
        </div>

        <div className="actions">
          <button className="primary-button" onClick={() => openLine(null)}>
            Done
          </button>
        </div>
      </div>
    </>
  );
}
