import { TopBar } from '../components/TopBar';
import { calculate } from '../engine/calculate';
import { CATS } from '../engine/sentencingTable';
import type { CaseController, ScenarioId } from '../state/useCase';

export function Compare({ controller }: { controller: CaseController }) {
  const { calc, facts, scenario, chooseScenario, goTo } = controller;

  const scenarios: Array<{
    id: ScenarioId;
    name: string;
    detail: string;
    acceptance: number;
    calc: ReturnType<typeof calculate>;
  }> = [
    {
      id: 'plea3',
      name: 'Timely plea, full acceptance',
      detail: 'Notice before the government prepares for trial; §3E1.1(b) motion filed.',
      acceptance: 3,
      calc: calculate({ ...facts, acceptance: 3 }),
    },
    {
      id: 'plea2',
      name: 'Late plea, two levels only',
      detail: 'Acceptance found but no government motion for the third level.',
      acceptance: 2,
      calc: calculate({ ...facts, acceptance: 2 }),
    },
    {
      id: 'trial',
      name: 'Trial and conviction',
      detail:
        'No acceptance reduction. Enhancements unchanged unless the record grows at trial.',
      acceptance: 0,
      calc: calculate(facts, { noAcceptance: true }),
    },
  ];

  /** How far this scenario's floor sits from the working calculation's. */
  const deltaFor = (min: number) => {
    if (min === calc.range.min) return 'current';
    const sign = min > calc.range.min ? '+' : '−';
    return sign + Math.abs(min - calc.range.min) + ' mo at the floor';
  };

  return (
    <div className="screen">
      <TopBar back={{ label: 'Result', onClick: () => goTo('result') }} />

      <h1 className="title" style={{ fontSize: 27 }}>
        Scenarios
      </h1>
      <div className="subtitle">
        Same facts, different postures. Pick one to make it the working calculation.
      </div>

      <div className="stack section-heading">
        {scenarios.map((option) => (
          <button
            key={option.id}
            className={'card scenario' + (scenario === option.id ? ' selected' : '')}
            aria-pressed={scenario === option.id}
            onClick={() => chooseScenario(option.id, option.acceptance)}
          >
            <div className="row-between">
              <div style={{ font: '600 15px/1.3 var(--sans)' }}>{option.name}</div>
              <div className="scenario-range">{option.calc.range.text}</div>
            </div>
            <div className="detail">{option.detail}</div>
            <div className="scenario-chips">
              <span className="chip">OL {option.calc.total}</span>
              <span className="chip">CHC {CATS[option.calc.ci]}</span>
              <span className="chip">Zone {option.calc.zone}</span>
              <span className="chip delta">{deltaFor(option.calc.range.min)}</span>
            </div>
          </button>
        ))}
      </div>

      <p className="disclaimer">
        Safety valve is unavailable on a §2B1.1 count — §5C1.2 reaches only the drug and related
        offenses listed in §5C1.2(a). It appears here when the count of conviction qualifies.
      </p>
    </div>
  );
}
