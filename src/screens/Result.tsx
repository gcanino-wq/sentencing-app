import { TopBar } from '../components/TopBar';
import { calculate } from '../engine/calculate';
import { CATS, zoneCopy } from '../engine/sentencingTable';
import { flattenWorksheets } from '../engine/worksheets';
import { EDITION_LABEL } from '../state/defaults';
import type { CaseController } from '../state/useCase';

export function Result({ controller }: { controller: CaseController }) {
  const { calc, facts, sheets, goTo, openLine, exported, markExported } = controller;

  const contested = flattenWorksheets(sheets).filter((line) => line.contested);

  /** What a contested line is worth, phrased for the practitioner. */
  const swingFor = (id: string) =>
    id === 'A2b'
      ? 'below $550,000 the range drops to ' +
        calculate({ ...facts, loss: 500_000 }).range.text
      : 'affects the total offense level';

  const statLines = [
    { label: 'Statutory maximum', value: facts.statMax * 12 + ' months' },
    { label: 'Mandatory minimum', value: 'None' },
    { label: 'Guideline range', value: calc.range.text + ' months' },
  ];

  const statNote =
    calc.range.max > facts.statMax * 12
      ? 'The range exceeds the statutory maximum, so the maximum becomes the top of the range under §5G1.1(a).'
      : 'The range falls entirely within the statutory maximum and no mandatory minimum displaces it, so §5G1.1 does not operate.';

  return (
    <div className="screen">
      <TopBar
        back={{ label: 'Worksheets', onClick: () => goTo('worksheet') }}
        forward={{ label: 'Compare', onClick: () => goTo('compare') }}
      />

      <div className="range-card">
        <span className="eyebrow">Guideline range</span>
        <div className="range-value">
          <span className="range-months">{calc.range.text}</span>
          <span className="range-unit">months</span>
        </div>
        <div className="range-stats">
          <div>
            <span className="eyebrow">Total offense level</span>
            <div className="range-stat-value">{calc.total}</div>
          </div>
          <div>
            <span className="eyebrow">Criminal history</span>
            <div className="range-stat-value">{CATS[calc.ci]}</div>
          </div>
          <div>
            <span className="eyebrow">Zone</span>
            <div className="range-stat-value">{calc.zone}</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <span className="eyebrow">Zone {calc.zone} · §5C1.1</span>
        <p className="panel-body" style={{ margin: 0 }}>
          {zoneCopy(calc.zone)}
        </p>
      </div>

      <div className="panel">
        <span className="eyebrow">Statutory limits · 18 U.S.C. § 1343</span>
        <div>
          {statLines.map((stat) => (
            <div key={stat.label} className="stat-line">
              <span>{stat.label}</span>
              <span>{stat.value}</span>
            </div>
          ))}
        </div>
        <p className="stat-note">{statNote}</p>
      </div>

      {contested.length > 0 && (
        <div className="panel">
          <span className="eyebrow">Assumptions flagged contested</span>
          <div>
            {contested.map((line) => (
              <button
                key={line.id}
                className="contested-item"
                onClick={() => {
                  goTo('worksheet');
                  openLine(line.id);
                }}
              >
                <div className="row-between">
                  <span className="contested-label">{line.label}</span>
                  <span className="delta">{line.value}</span>
                </div>
                <div className="contested-meta">
                  {line.cite} · {swingFor(line.id)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="actions">
        <button className="primary-button" onClick={markExported}>
          {exported ? 'Worksheet saved' : 'Export worksheet'}
        </button>
        <button className="secondary-button" onClick={() => goTo('worksheet')}>
          Edit worksheets
        </button>
      </div>

      <p className="disclaimer">
        The Guidelines are advisory. This is an estimate produced from the facts you entered under
        the {EDITION_LABEL}; it is not legal advice and does not predict what a court will do under
        18 U.S.C. § 3553(a).
      </p>
    </div>
  );
}
