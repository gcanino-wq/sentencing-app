import { TopBar } from '../components/TopBar';
import { SEARCH_QUERY, SEARCH_RESULTS } from '../state/defaults';
import type { CaseController } from '../state/useCase';

export function StatuteSearch({ controller }: { controller: CaseController }) {
  return (
    <div className="screen">
      <TopBar back={{ label: 'Matters', onClick: () => controller.goTo('matters') }} />

      <h1 className="title" style={{ fontSize: 27 }}>
        Count of conviction
      </h1>
      <div className="subtitle">Enter the statute. Guideline mapping follows Appendix A.</div>

      <input className="search-field" defaultValue={SEARCH_QUERY} aria-label="Statute" />

      <div className="eyebrow" style={{ marginTop: 22, display: 'block' }}>
        Appendix A match
      </div>

      <div className="stack" style={{ marginTop: 10 }}>
        {SEARCH_RESULTS.map((result) => (
          <button key={result.title} className="card" onClick={() => controller.goTo('wizard')}>
            <div className="row-between">
              <div style={{ font: '500 15px/1.3 var(--sans)' }}>{result.title}</div>
              <div style={{ font: '600 13px/1 var(--mono)', color: 'var(--accent)' }}>
                {result.guideline}
              </div>
            </div>
            <div className="detail">{result.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
