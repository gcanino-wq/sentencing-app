import { LineEditSheet } from '../components/LineEditSheet';
import { TopBar } from '../components/TopBar';
import { EDITION_LABEL } from '../state/defaults';
import type { WorksheetLine } from '../engine/worksheets';
import type { CaseController } from '../state/useCase';

function Line({ line, onOpen }: { line: WorksheetLine; onOpen: () => void }) {
  const body = (
    <>
      <div className="line-num">{line.num}</div>
      <div>
        <div className="line-label">{line.label}</div>
        <div className="line-cite">{line.cite}</div>
        <div className="line-excerpt">{line.excerpt}</div>
        {(line.contested || line.note) && (
          <div className="line-flags">
            {line.contested && <span className="flag">CONTESTED</span>}
            {line.note && <span className="flag-note">{line.note}</span>}
          </div>
        )}
      </div>
      <div className={'line-value' + (line.value === '—' ? ' empty' : '')}>{line.value}</div>
    </>
  );

  const className = 'line' + (line.contested ? ' contested' : '');

  return line.editable ? (
    <button className={className} onClick={onOpen}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function Worksheets({ controller }: { controller: CaseController }) {
  return (
    <div className="screen">
      <TopBar
        back={{ label: 'Interview', onClick: () => controller.goTo('wizard') }}
        forward={{ label: 'Result', onClick: () => controller.goTo('result') }}
      />

      <h1 className="title" style={{ fontSize: 27 }}>
        Worksheets
      </h1>
      <div className="subtitle">
        United States v. Ellery · Count 1, 18 U.S.C. § 1343 · {EDITION_LABEL}
      </div>

      {controller.sheets.map((sheet) => (
        <section key={sheet.letter} className="sheet">
          <div className="sheet-heading">
            <span className="sheet-letter">Worksheet {sheet.letter}</span>
            <span className="sheet-title">{sheet.title}</span>
          </div>
          <div className="lines">
            {sheet.lines.map((line) => (
              <Line key={line.id} line={line} onOpen={() => controller.openLine(line.id)} />
            ))}
          </div>
        </section>
      ))}

      <div className="actions">
        <button className="primary-button" onClick={() => controller.goTo('result')}>
          Compute the range
        </button>
      </div>

      <LineEditSheet controller={controller} />
    </div>
  );
}
