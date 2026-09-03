'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CaseInput, Departure } from '@/engine/types';
import { calculate } from '@/engine/calculate';
import { SAFETY_VALVE_CRITERIA } from '@/engine/chapter5';
import { DISTRICTS, DISTRICT_BY_ID } from '@/engine/data/districts';
import { EDITION } from '@/engine/data/edition';
import { emptyCase, emptyCount, nextId } from '@/lib/case';
import { decodeCase, encodeCase } from '@/lib/share';
import { CountEditor } from '@/components/CountEditor';
import { CriminalHistoryEditor } from '@/components/CriminalHistory';
import { ResultsRail } from '@/components/Results';
import { Worksheet } from '@/components/Worksheet';
import { Button, Check, Cite, Field, Section, Select, SubHead, TextInput } from '@/components/ui';

const SECTION_3553A_FACTORS = [
  'Nature and circumstances of the offense',
  'History and characteristics of the defendant',
  'Seriousness, respect for law, just punishment',
  'Adequate deterrence',
  'Protection of the public',
  'Educational, vocational, medical, or correctional treatment',
  'Kinds of sentences available',
  'Unwarranted sentencing disparities',
  'Restitution to victims',
];

const DEPARTURE_GROUNDS = [
  { citation: '§ 5K1.1', label: 'Substantial assistance to authorities' },
  { citation: '§ 5K3.1', label: 'Early disposition (fast-track) program' },
  { citation: '§ 5K2.0', label: 'Aggravating or mitigating circumstances not adequately considered' },
  { citation: '§ 5K2.10', label: 'Victim conduct' },
  { citation: '§ 5K2.11', label: 'Lesser harm' },
  { citation: '§ 5K2.12', label: 'Coercion and duress' },
  { citation: '§ 5K2.13', label: 'Diminished capacity' },
  { citation: '§ 5K2.20', label: 'Aberrant behavior' },
  { citation: '§ 5K2.8', label: 'Extreme conduct' },
  { citation: '§ 4A1.3', label: 'Criminal history over- or under-representation' },
];

export default function Page() {
  const [input, setInput] = useState<CaseInput>(emptyCase);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareConfirmed, setShareConfirmed] = useState(false);

  // Load a shared calculation from the URL hash on first render.
  useEffect(() => {
    const hash = window.location.hash.replace(/^#c=/, '');
    if (!hash || hash === window.location.hash) return;
    const decoded = decodeCase(hash);
    if (decoded) setInput(decoded);
  }, []);

  const result = useMemo(() => {
    try {
      return calculate(input);
    } catch (error) {
      console.error('Calculation failed', error);
      return null;
    }
  }, [input]);

  const patch = (next: Partial<CaseInput>) => setInput((prev) => ({ ...prev, ...next }));
  const district = DISTRICT_BY_ID.get(input.districtId);

  return (
    <div className="min-h-screen">
      <Banner />

      <div className="max-w-[1400px] mx-auto px-4 py-4">
        <header className="mb-4 flex items-baseline justify-between gap-4 flex-wrap no-print">
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight">
              Federal Sentencing Calculator
            </h1>
            <p className="text-2xs text-muted">
              {EDITION.name} · encoded {EDITION.encodedOn}, unverified
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Button onClick={() => window.print()}>Print worksheet</Button>
            <Button
              onClick={() => {
                setInput(emptyCase());
                setShareUrl(null);
                setShareConfirmed(false);
              }}
            >
              Clear
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
          {/* ------------------------------------------------------------- */}
          {/* Form                                                           */}
          {/* ------------------------------------------------------------- */}
          <main className="space-y-3 no-print">
            <Section title="Case" defaultOpen>
              <div className="grid grid-cols-3 gap-3">
                <Field
                  label="District"
                  hint={district ? `${district.circuit} Circuit` : undefined}
                >
                  <Select
                    value={input.districtId}
                    onChange={(e) => patch({ districtId: e.target.value })}
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="Instant offense date"
                  hint="Drives the § 4A1.2(e) time limits and the § 1B1.11 check."
                >
                  <TextInput
                    type="date"
                    value={input.offenseDate ?? ''}
                    onChange={(e) => patch({ offenseDate: e.target.value || undefined })}
                  />
                </Field>
              </div>
            </Section>

            <Section
              title="Counts of conviction"
              aside={
                <Button
                  onClick={() =>
                    patch({ counts: [...input.counts, emptyCount(input.counts.length + 1)] })
                  }
                  className="no-print"
                >
                  + Add count
                </Button>
              }
            >
              <div className="space-y-3">
                {input.counts.map((count, i) => (
                  <CountEditor
                    key={count.id}
                    count={count}
                    index={i + 1}
                    result={result?.counts.find((c) => c.countId === count.id)}
                    canRemove={input.counts.length > 1}
                    onChange={(next) =>
                      patch({ counts: input.counts.map((c) => (c.id === count.id ? next : c)) })
                    }
                    onRemove={() =>
                      patch({ counts: input.counts.filter((c) => c.id !== count.id) })
                    }
                  />
                ))}
              </div>
            </Section>

            {result && result.groups.length > 1 ? (
              <Section title="Grouping" citation="§ 3D1.2">
                <p className="text-2xs text-muted leading-snug">
                  Proposed from the guidelines applied. Grouping under § 3D1.2(a)–(c) turns on whether
                  counts share a victim and a transaction — facts the app cannot see.
                </p>
                <ul className="space-y-1.5 mt-2">
                  {result.groups.map((g) => (
                    <li key={g.group.id} className="text-[12px] leading-snug">
                      <span className="font-medium tabular-nums">Level {g.offenseLevel}</span>
                      <span className="text-muted">
                        {' '}
                        —{' '}
                        {g.group.countIds
                          .map((id) => input.counts.find((c) => c.id === id)?.label ?? id)
                          .join(', ')}{' '}
                        · {g.units} unit{g.units === 1 ? '' : 's'}
                      </span>
                      <span className="block text-2xs text-faint">
                        {g.group.rationale} <Cite section={g.group.citation} />
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            <Section title="Acceptance of responsibility" citation="§ 3E1.1">
              <div className="space-y-1.5">
                <Check
                  checked={Boolean(input.acceptance?.granted)}
                  onChange={(v) =>
                    patch({ acceptance: { ...input.acceptance, granted: v } })
                  }
                  label="Clearly demonstrated acceptance of responsibility −2"
                  citation="§ 3E1.1(a)"
                />
                {input.acceptance?.granted ? (
                  <div className="pl-5">
                    <Check
                      checked={Boolean(input.acceptance.thirdPointMoved)}
                      onChange={(v) =>
                        patch({ acceptance: { ...input.acceptance!, thirdPointMoved: v } })
                      }
                      label="Government moved for the third point −1"
                      citation="§ 3E1.1(b)"
                      hint="Available only where the offense level before acceptance is 16 or greater."
                    />
                  </div>
                ) : null}
              </div>
            </Section>

            <Section title="Criminal history" citation="Ch. 4, Pt. A">
              <CriminalHistoryEditor
                value={input.criminalHistory}
                result={result?.criminalHistory}
                districtId={input.districtId}
                onChange={(criminalHistory) => patch({ criminalHistory })}
              />
            </Section>

            <Section title="Safety valve" citation="18 U.S.C. § 3553(f)" defaultOpen={false}>
              <p className="text-2xs text-muted leading-snug">
                All criteria must be satisfied. When they are, the mandatory minimum is relieved and
                the § 2D1.1(b)(18) two-level reduction applies automatically.
              </p>
              <div className="space-y-1.5 mt-2">
                {SAFETY_VALVE_CRITERIA.map((criterion) => (
                  <Check
                    key={criterion.id}
                    checked={input.safetyValve?.[criterion.id] === true}
                    onChange={(v) =>
                      patch({ safetyValve: { ...input.safetyValve, [criterion.id]: v } })
                    }
                    label={criterion.label}
                    citation={criterion.citation}
                  />
                ))}
              </div>
            </Section>

            <Section title="Departures" citation="Ch. 5, Pt. K" defaultOpen={false}>
              <DeparturesEditor
                departures={input.departures ?? []}
                onChange={(departures) => patch({ departures })}
              />
            </Section>

            <Section title="Variance — 18 U.S.C. § 3553(a)" defaultOpen={false}>
              <div className="space-y-2">
                <Field
                  label="Sentence requested (months)"
                  hint="Appears as the last rung of the sentence ladder."
                >
                  <TextInput
                    type="number"
                    value={input.variance?.targetMonths ?? ''}
                    onChange={(e) =>
                      patch({
                        variance: {
                          entries: input.variance?.entries ?? [],
                          targetMonths: e.target.value === '' ? undefined : Number(e.target.value),
                        },
                      })
                    }
                    className="w-32 text-right"
                  />
                </Field>
                <div className="space-y-2">
                  {SECTION_3553A_FACTORS.map((factor) => {
                    const entry = input.variance?.entries.find((e) => e.factor === factor);
                    return (
                      <Field key={factor} label={factor}>
                        <textarea
                          value={entry?.argument ?? ''}
                          onChange={(e) => {
                            const entries = (input.variance?.entries ?? []).filter(
                              (x) => x.factor !== factor,
                            );
                            if (e.target.value) entries.push({ factor, argument: e.target.value });
                            patch({
                              variance: { entries, targetMonths: input.variance?.targetMonths },
                            });
                          }}
                          rows={2}
                          className="w-full bg-raised border border-line rounded px-2 py-1 text-[13px] focus:border-accent resize-y"
                        />
                      </Field>
                    );
                  })}
                </div>
              </div>
            </Section>

            <Section title="Plea agreement" defaultOpen={false}>
              <div className="grid grid-cols-3 gap-3">
                <Field
                  label="Stipulated total offense level"
                  hint="Shown against your own calculation."
                >
                  <TextInput
                    type="number"
                    value={input.plea?.stipulatedOffenseLevel ?? ''}
                    onChange={(e) =>
                      patch({
                        plea: {
                          ...input.plea,
                          stipulatedOffenseLevel:
                            e.target.value === '' ? undefined : Number(e.target.value),
                        },
                      })
                    }
                    className="text-right"
                  />
                </Field>
                <Field label="Rule 11(c)(1)(C) agreed sentence (months)">
                  <TextInput
                    type="number"
                    value={input.plea?.agreedSentenceMonths ?? ''}
                    onChange={(e) =>
                      patch({
                        plea: {
                          ...input.plea,
                          agreedSentenceMonths:
                            e.target.value === '' ? undefined : Number(e.target.value),
                        },
                      })
                    }
                    className="text-right"
                  />
                </Field>
              </div>
            </Section>

            <Section title="Time to serve" defaultOpen={false}>
              <Check
                checked={input.bopCredits !== undefined}
                onChange={(v) => patch({ bopCredits: v ? { firstStepActEligible: false } : undefined })}
                label="Estimate time to serve"
                hint="Good conduct time under 18 U.S.C. § 3624(b). An estimate BOP is not bound by."
              />
              {input.bopCredits ? (
                <div className="pl-5 mt-1.5">
                  <Check
                    checked={Boolean(input.bopCredits.firstStepActEligible)}
                    onChange={(v) => patch({ bopCredits: { firstStepActEligible: v } })}
                    label="Eligible for First Step Act earned time credits"
                    hint="Eligibility turns on the offense of conviction and risk classification."
                  />
                </div>
              ) : null}
            </Section>

            <Section title="Share this calculation" defaultOpen={false}>
              <p className="text-2xs text-muted leading-snug">
                A share link encodes everything entered above into the URL. It will travel through
                browser history, mail servers, and logs. Use it for hypotheticals, not for case facts.
              </p>
              <div className="mt-2">
                <Check
                  checked={shareConfirmed}
                  onChange={setShareConfirmed}
                  label="I confirm this scenario contains no client-identifying detail"
                />
              </div>
              <Button
                disabled={!shareConfirmed}
                onClick={() => {
                  const url = `${window.location.origin}${window.location.pathname}#c=${encodeCase(input)}`;
                  setShareUrl(url);
                  void navigator.clipboard?.writeText(url);
                }}
                className="mt-2 disabled:opacity-40"
              >
                Generate link
              </Button>
              {shareUrl ? (
                <p className="text-2xs text-faint mt-1.5 break-all">
                  Copied to the clipboard. {shareUrl.length} characters.
                </p>
              ) : null}
            </Section>
          </main>

          {/* ------------------------------------------------------------- */}
          {/* Results rail                                                   */}
          {/* ------------------------------------------------------------- */}
          <aside className="lg:sticky lg:top-4 no-print" aria-label="Calculation results">
            <div aria-live="polite" aria-atomic="false">
              {result ? (
                <ResultsRail result={result} />
              ) : (
                <p className="text-muted text-[13px]">
                  The calculation could not be completed. Check the inputs above.
                </p>
              )}
            </div>
          </aside>
        </div>

        {result ? <Worksheet input={input} result={result} /> : null}
      </div>
    </div>
  );
}

function Banner() {
  return (
    <div className="border-b border-line bg-raised px-4 py-2 no-print">
      <p className="max-w-[1400px] mx-auto text-2xs text-muted leading-snug">
        <span className="font-semibold text-ink">Attorney work-product tool.</span> An estimation aid
        for licensed counsel. The guidelines are advisory (<em>United States v. Booker</em>); the
        court and the Probation Office make the actual determination. The guidelines data in this
        build was encoded from memory and{' '}
        <span className="font-medium text-caution">has not been verified</span> against the published
        manual — see VERIFICATION.md. Verify every figure before relying on it. Nothing entered here
        leaves this browser.
      </p>
    </div>
  );
}

function DeparturesEditor({
  departures,
  onChange,
}: {
  departures: readonly Departure[];
  onChange: (next: Departure[]) => void;
}) {
  return (
    <div className="space-y-2">
      {departures.map((departure) => (
        <div key={departure.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-1.5 items-end">
          <Field label="Ground">
            <Select
              value={departure.citation}
              onChange={(e) => {
                const ground = DEPARTURE_GROUNDS.find((g) => g.citation === e.target.value);
                onChange(
                  departures.map((d) =>
                    d.id === departure.id
                      ? { ...d, citation: e.target.value, label: ground?.label ?? d.label }
                      : d,
                  ),
                );
              }}
            >
              {DEPARTURE_GROUNDS.map((g) => (
                <option key={g.citation} value={g.citation}>
                  {g.citation} — {g.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Measure">
            <Select
              value={departure.kind}
              onChange={(e) =>
                onChange(
                  departures.map((d) =>
                    d.id === departure.id ? { ...d, kind: e.target.value as Departure['kind'] } : d,
                  ),
                )
              }
            >
              <option value="levels">Levels</option>
              <option value="percent">% off the bottom</option>
              <option value="months">Months</option>
            </Select>
          </Field>
          <Field label="Amount">
            <TextInput
              type="number"
              value={departure.amount || ''}
              onChange={(e) =>
                onChange(
                  departures.map((d) =>
                    d.id === departure.id ? { ...d, amount: Number(e.target.value) } : d,
                  ),
                )
              }
              className="w-20 text-right"
            />
          </Field>
          <Button
            variant="danger"
            onClick={() => onChange(departures.filter((d) => d.id !== departure.id))}
            className="mb-1"
            aria-label="Remove departure"
          >
            ×
          </Button>
        </div>
      ))}
      <Button
        onClick={() =>
          onChange([
            ...departures,
            {
              id: nextId('dep'),
              kind: 'levels',
              citation: '§ 5K1.1',
              label: 'Substantial assistance to authorities',
              amount: 0,
            },
          ])
        }
      >
        + Add departure
      </Button>
      <p className="text-2xs text-faint leading-snug">
        A level departure is resolved against the Sentencing Table, not subtracted from months. Each
        rung appears in the sentence ladder.
      </p>
    </div>
  );
}
