'use client';

import type { CriminalHistoryInput, CriminalHistoryResult, PriorConviction } from '@/engine/types';
import { ZERO_POINT_CRITERIA } from '@/engine/chapter4';
import { emptyPrior, CATEGORY_NUMERALS } from '@/lib/case';
import { Button, Check, Cite, Field, Select, SubHead, TextInput } from './ui';

export function CriminalHistoryEditor({
  value,
  result,
  districtId,
  onChange,
}: {
  value: CriminalHistoryInput;
  result: CriminalHistoryResult | undefined;
  districtId: string;
  onChange: (next: CriminalHistoryInput) => void;
}) {
  const patch = (next: Partial<CriminalHistoryInput>) => onChange({ ...value, ...next });
  const patchPrior = (id: string, next: Partial<PriorConviction>) =>
    patch({ priors: value.priors.map((p) => (p.id === id ? { ...p, ...next } : p)) });

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-2xs text-muted leading-snug flex-1">
          Enter each prior separately. The app scores points under § 4A1.1 and applies the § 4A1.2(e)
          time limits against the instant offense date. Predicate flags are legal conclusions you
          make — the app applies them, it does not decide them.
        </p>
        {result ? (
          <span className="text-2xs tabular-nums shrink-0">
            <span className="text-muted">{result.points} points · Category </span>
            <span className="font-semibold">{CATEGORY_NUMERALS[result.category - 1]}</span>
          </span>
        ) : null}
      </div>

      <div className="space-y-2">
        {value.priors.map((prior, i) => (
          <div key={prior.id} className="border border-line rounded p-2 space-y-2 print-block">
            <div className="flex gap-1.5">
              <TextInput
                aria-label={`Prior ${i + 1} description`}
                value={prior.description}
                onChange={(e) => patchPrior(prior.id, { description: e.target.value })}
                placeholder="Offense description"
                className="flex-1"
              />
              <TextInput
                aria-label={`Prior ${i + 1} statute`}
                value={prior.statute ?? ''}
                onChange={(e) => patchPrior(prior.id, { statute: e.target.value })}
                placeholder="Statute"
                className="w-40"
              />
              <Button
                variant="danger"
                onClick={() => patch({ priors: value.priors.filter((p) => p.id !== prior.id) })}
                className="no-print"
                aria-label={`Remove prior ${i + 1}`}
              >
                ×
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <Field label="Offense date">
                <TextInput
                  type="date"
                  value={prior.offenseDate ?? ''}
                  onChange={(e) => patchPrior(prior.id, { offenseDate: e.target.value || undefined })}
                />
              </Field>
              <Field label="Sentence date">
                <TextInput
                  type="date"
                  value={prior.sentenceDate ?? ''}
                  onChange={(e) => patchPrior(prior.id, { sentenceDate: e.target.value || undefined })}
                />
              </Field>
              <Field label="Sentence imposed (months)" hint="0 for a non-custodial sentence.">
                <TextInput
                  type="number"
                  value={prior.sentenceImposedMonths || ''}
                  onChange={(e) =>
                    patchPrior(prior.id, { sentenceImposedMonths: Number(e.target.value) || 0 })
                  }
                  className="text-right"
                />
              </Field>
              <Field label="Release date" hint="Extends the 15-year window.">
                <TextInput
                  type="date"
                  value={prior.releaseDate ?? ''}
                  onChange={(e) => patchPrior(prior.id, { releaseDate: e.target.value || undefined })}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <Check
                checked={Boolean(prior.juvenile)}
                onChange={(v) => patchPrior(prior.id, { juvenile: v })}
                label="Committed before age 18"
                citation="§ 4A1.2(d)"
              />
              <Field label="Consolidated with">
                <Select
                  value={prior.singleSentenceWith ?? ''}
                  onChange={(e) =>
                    patchPrior(prior.id, { singleSentenceWith: e.target.value || undefined })
                  }
                >
                  <option value="">Scored separately</option>
                  {value.priors
                    .filter((p) => p.id !== prior.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.description || 'Untitled prior'}
                      </option>
                    ))}
                </Select>
              </Field>
            </div>

            <div className="border-t border-line pt-2 space-y-1">
              <SubHead>Predicate flags — categorical questions you decide</SubHead>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <Check
                  checked={Boolean(prior.crimeOfViolence)}
                  onChange={(v) => patchPrior(prior.id, { crimeOfViolence: v })}
                  label="Crime of violence"
                  citation="§ 4B1.2(a)"
                />
                <Check
                  checked={Boolean(prior.controlledSubstanceOffense)}
                  onChange={(v) => patchPrior(prior.id, { controlledSubstanceOffense: v })}
                  label="Controlled substance offense"
                  citation="§ 4B1.2(b)"
                />
                <Check
                  checked={Boolean(prior.accaViolentFelony)}
                  onChange={(v) => patchPrior(prior.id, { accaViolentFelony: v })}
                  label="ACCA violent felony"
                  citation="18 U.S.C. § 924(e)(2)(B)"
                />
                <Check
                  checked={Boolean(prior.accaSeriousDrugOffense)}
                  onChange={(v) => patchPrior(prior.id, { accaSeriousDrugOffense: v })}
                  label="ACCA serious drug offense"
                  citation="18 U.S.C. § 924(e)(2)(A)"
                />
              </div>
            </div>

            <div className="border-t border-line pt-2 grid grid-cols-2 gap-4">
              <Check
                checked={Boolean(prior.puertoRico)}
                onChange={(v) =>
                  patchPrior(prior.id, { puertoRico: v ? { penalCode: '2012' } : undefined })
                }
                label="Puerto Rico conviction"
                hint={
                  districtId === 'pr'
                    ? 'The Penal Code was rewritten in 2004 and 2012; article numbers do not carry across.'
                    : undefined
                }
              />
              {prior.puertoRico ? (
                <Field label="Penal Code in force">
                  <Select
                    value={prior.puertoRico.penalCode}
                    onChange={(e) =>
                      patchPrior(prior.id, {
                        puertoRico: { penalCode: e.target.value as '1974' | '2004' | '2012' },
                      })
                    }
                  >
                    <option value="1974">1974 Penal Code</option>
                    <option value="2004">2004 Penal Code</option>
                    <option value="2012">2012 Penal Code</option>
                  </Select>
                </Field>
              ) : null}
            </div>

            {prior.puertoRico && (prior.crimeOfViolence || prior.accaViolentFelony) ? (
              <p className="text-2xs text-caution leading-snug border-l-2 border-caution pl-2">
                Whether this Puerto Rico conviction qualifies turns on the elements under the{' '}
                {prior.puertoRico.penalCode} Penal Code, not the offense name. First Circuit research
                question — the app does not resolve it.
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <Button onClick={() => patch({ priors: [...value.priors, emptyPrior()] })} className="no-print">
        + Add prior conviction
      </Button>

      <div className="border-t border-line pt-3 space-y-2">
        <Check
          checked={Boolean(value.underCriminalJusticeSentence)}
          onChange={(v) => patch({ underCriminalJusticeSentence: v })}
          label="Committed the instant offense while under a criminal justice sentence"
          citation="§ 4A1.1(e)"
          hint="After Amendment 821 this adds one point, and only where the defendant already has 7 or more points."
        />

        <Field label="Override the Criminal History Category">
          <Select
            value={value.categoryOverride ? String(value.categoryOverride) : ''}
            onChange={(e) =>
              patch({
                categoryOverride: e.target.value
                  ? (Number(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6)
                  : undefined,
              })
            }
          >
            <option value="">Use the computed category</option>
            {CATEGORY_NUMERALS.map((numeral, i) => (
              <option key={numeral} value={i + 1}>
                Category {numeral}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="border-t border-line pt-3 grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <SubHead>Career offender</SubHead>
          <Check
            checked={Boolean(value.careerOffender?.claimed)}
            onChange={(v) =>
              patch({
                careerOffender: {
                  ...value.careerOffender,
                  claimed: v,
                  ageAtLeast18: value.careerOffender?.ageAtLeast18 ?? true,
                  instantOffenseQualifies: value.careerOffender?.instantOffenseQualifies ?? true,
                },
              })
            }
            label="Career offender applies"
            citation="§ 4B1.1(a)"
            hint="Requires two qualifying priors flagged above."
          />
          {value.careerOffender?.claimed ? (
            <div className="pl-5 space-y-1">
              <Check
                checked={value.careerOffender.ageAtLeast18 !== false}
                onChange={(v) =>
                  patch({ careerOffender: { ...value.careerOffender!, ageAtLeast18: v } })
                }
                label="At least 18 at the time of the instant offense"
                citation="§ 4B1.1(a)(1)"
              />
              <Check
                checked={value.careerOffender.instantOffenseQualifies !== false}
                onChange={(v) =>
                  patch({ careerOffender: { ...value.careerOffender!, instantOffenseQualifies: v } })
                }
                label="Instant offense is a felony crime of violence or controlled substance offense"
                citation="§ 4B1.1(a)(2)"
              />
            </div>
          ) : null}

          <SubHead>Armed career criminal</SubHead>
          <Check
            checked={Boolean(value.acca?.claimed)}
            onChange={(v) => patch({ acca: { claimed: v } })}
            label="ACCA applies"
            citation="18 U.S.C. § 924(e)"
            hint="Requires three predicates flagged above, committed on occasions different from one another."
          />
        </div>

        <div className="space-y-1.5">
          <SubHead>
            Zero-point offender <Cite section="§ 4C1.1" />
          </SubHead>
          <p className="text-2xs text-faint leading-snug">
            All ten criteria must be satisfied. Confirm each.
          </p>
          {ZERO_POINT_CRITERIA.map((criterion) => (
            <Check
              key={criterion.id}
              checked={value.zeroPointOffender?.[criterion.id] === true}
              onChange={(v) =>
                patch({ zeroPointOffender: { ...value.zeroPointOffender, [criterion.id]: v } })
              }
              label={criterion.label}
              citation={criterion.citation}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
