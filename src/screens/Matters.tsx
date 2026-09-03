import { EDITION_LABEL, MATTERS } from '../state/defaults';
import type { CaseController } from '../state/useCase';

export function Matters({ controller }: { controller: CaseController }) {
  return (
    <div className="screen">
      <h1 className="title">Guideline</h1>
      <div className="subtitle">{EDITION_LABEL}</div>

      <div className="stack section-heading">
        {MATTERS.map((matter) => (
          <button key={matter.id} className="card" onClick={() => controller.goTo(matter.opens)}>
            <div className="row-between">
              <div style={{ font: '600 16px/1.3 var(--sans)' }}>{matter.name}</div>
              <div className="when">{matter.when}</div>
            </div>
            <div className="detail">{matter.detail}</div>
            <div className="tags">
              {matter.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </button>
        ))}

        <button className="ghost-button" onClick={() => controller.goTo('search')}>
          + New matter
        </button>
      </div>
    </div>
  );
}
