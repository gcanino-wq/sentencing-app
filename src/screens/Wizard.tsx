import { Switch } from '../components/Switch';
import { TopBar } from '../components/TopBar';
import { sgn } from '../engine/format';
import type { WizardOption } from '../engine/wizard';
import type { CaseController } from '../state/useCase';

function OptionButton({
  option,
  multi,
  onPick,
}: {
  option: WizardOption;
  multi: boolean;
  onPick: () => void;
}) {
  return (
    <button
      className={'option' + (option.selected ? ' selected' : '')}
      aria-pressed={option.selected}
      onClick={onPick}
    >
      <span className={'mark ' + (multi ? 'square' : 'round')} aria-hidden="true">
        {option.selected ? '✓' : ''}
      </span>
      <span>
        <span className="option-label" style={{ display: 'block' }}>
          {option.label}
        </span>
        <span className="option-note" style={{ display: 'block' }}>
          {option.note}
        </span>
      </span>
    </button>
  );
}

function Priors({ controller }: { controller: CaseController }) {
  const { facts, patch, addPrior } = controller;

  return (
    <>
      <div className="segmented" role="tablist" aria-label="Criminal history entry mode">
        {(
          [
            ['guided', 'Guided'],
            ['direct', 'Direct entry'],
          ] as const
        ).map(([mode, label]) => (
          <button
            key={mode}
            role="tab"
            aria-selected={facts.chMode === mode}
            className={facts.chMode === mode ? 'on' : ''}
            onClick={() => patch({ chMode: mode })}
          >
            {label}
          </button>
        ))}
      </div>

      {facts.chMode === 'guided' ? (
        <div className="stack" style={{ marginTop: 16 }}>
          {facts.priors.map((prior, i) => (
            <div key={i} className="card prior">
              <div>
                <div style={{ font: '500 14.5px/1.35 var(--sans)' }}>{prior.desc}</div>
                <div className="option-note">{prior.meta} · §4A1.1(b)</div>
              </div>
              <div className="prior-points">{sgn(prior.pts)}</div>
            </div>
          ))}
          <button className="ghost-button" onClick={() => addPrior()}>
            + Add a prior sentence
          </button>
        </div>
      ) : (
        <div className="amount-field">
          <span className="eyebrow">Total criminal history points</span>
          <input
            className="amount-input"
            inputMode="numeric"
            value={String(facts.directPoints ?? 0)}
            onChange={(e) => patch({ directPoints: Number(e.target.value.replace(/[^0-9]/g, '') || 0) })}
          />
        </div>
      )}

      <button
        className="toggle-row"
        style={{ marginTop: 16 }}
        onClick={() => patch({ statusPoints: !facts.statusPoints })}
      >
        <span>
          <span className="option-label" style={{ display: 'block' }}>
            Committed while under a criminal justice sentence
          </span>
          <span className="option-note" style={{ display: 'block' }}>
            §4A1.1(e) · +1 only if 7 or more points
          </span>
        </span>
        <Switch on={facts.statusPoints} label="Committed while under a criminal justice sentence" />
      </button>
    </>
  );
}

export function Wizard({ controller }: { controller: CaseController }) {
  const { step, steps, stepIndex, patch, toggleSoc, nextStep, previousStep } = controller;
  const last = stepIndex >= steps.length - 1;

  return (
    <div className="screen">
      <TopBar back={{ label: 'Back', onClick: previousStep }} />

      <div className="eyebrow" style={{ marginBottom: 10 }}>
        Question {stepIndex + 1} of {steps.length}
      </div>

      <div className="dots" aria-hidden="true">
        {steps.map((_, i) => (
          <span key={i} className={'dot' + (i <= stepIndex ? ' on' : '')} />
        ))}
      </div>

      <div style={{ font: '600 12px/1 var(--mono)', color: 'var(--accent)' }}>{step.cite}</div>
      <h1 className="question">{step.label}</h1>
      <p className="help" style={{ margin: 0 }}>
        {step.help}
      </p>

      {step.kind === 'number' && (
        <>
          <div className="amount-field">
            <span className="eyebrow">{step.unit}</span>
            <input
              className="amount-input"
              inputMode="numeric"
              value={step.value}
              onChange={(e) => patch({ loss: Number(e.target.value.replace(/[^0-9]/g, '') || 0) })}
              aria-label={step.label}
            />
          </div>
          <div className="quick">
            {step.quick.map((amount) => (
              <button key={amount.value} onClick={() => patch({ loss: amount.value })}>
                {amount.label}
              </button>
            ))}
          </div>
        </>
      )}

      {step.kind === 'choice' && (
        <div className={'options' + (step.options.length < 3 ? ' single-column' : '')}>
          {step.options.map((option) => (
            <OptionButton
              key={option.value}
              option={option}
              multi={step.multi}
              onPick={() =>
                option.toggles ? toggleSoc(option.toggles) : patch(option.patch ?? {})
              }
            />
          ))}
        </div>
      )}

      {step.kind === 'priors' && <Priors controller={controller} />}

      <div className="actions">
        <button className="primary-button" onClick={nextStep}>
          {last ? 'Build the worksheets' : 'Next'}
        </button>
      </div>
    </div>
  );
}
