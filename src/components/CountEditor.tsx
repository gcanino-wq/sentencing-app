'use client';

import { useMemo, useState } from 'react';
import type { CountInput, CountResult, DrugEntry, SelectedSoc } from '@/engine/types';
import { findStatutes, SECTION_924C_TERMS, STATUTE_BY_ID } from '@/engine/data/statutes';
import { NON_GROUPING_SECTIONS, STRUCTURED_GUIDELINES } from '@/engine/data/guidelines';
import { SUBSTANCES, SUBSTANCE_BY_ID, entryToConvertedKg, nextDrugThreshold, totalConvertedKg } from '@/engine/data/drugs';
import { nextLossThreshold, resolveLoss } from '@/engine/data/tables';
import { guidelineForCount } from '@/engine/chapter2';
import { nextId, formatMoney } from '@/lib/case';
import { Button, Check, Cite, Field, FlagList, MoneyInput, Select, SubHead, TextInput } from './ui';

const RELEVANT_CONDUCT_HINT =
  'Enter the relevant conduct figure under § 1B1.3 — conduct in the offense of conviction plus, in a jointly undertaken activity, acts of others that were within the scope of the agreement and reasonably foreseeable. Not merely the amount charged.';

export function CountEditor({
  count,
  index,
  result,
  onChange,
  onRemove,
  canRemove,
}: {
  count: CountInput;
  index: number;
  result: CountResult | undefined;
  onChange: (next: CountInput) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [statuteQuery, setStatuteQuery] = useState('');
  const patch = (next: Partial<CountInput>) => onChange({ ...count, ...next });

  const { guideline } = guidelineForCount(count);
  const statute = count.statuteId ? STATUTE_BY_ID.get(count.statuteId) : undefined;
  const matches = useMemo(() => findStatutes(statuteQuery).slice(0, 8), [statuteQuery]);

  const isConsecutiveOnly =
    Boolean(count.consecutiveMandatory) || NON_GROUPING_SECTIONS.has(guideline.section);

  const socIds = new Set(count.socs.map((s) => s.id));
  const toggleSoc = (id: string, on: boolean) => {
    const socs = on
      ? [...count.socs, { id }]
      : count.socs.filter((s) => s.id !== id);
    patch({ socs });
  };
  const setBase = (baseId: string) => {
    const socs: SelectedSoc[] = count.socs.filter((s) => !s.id.startsWith('base:'));
    if (baseId) socs.push({ id: `base:${baseId}` });
    patch({ socs });
  };
  const currentBase = count.socs.find((s) => s.id.startsWith('base:'))?.id.slice(5) ?? '';

  return (
    <div className="border border-line rounded bg-raised print-block">
      <div className="flex items-baseline gap-2 px-3 py-2 border-b border-line bg-surface/60">
        <input
          value={count.label ?? ''}
          onChange={(e) => patch({ label: e.target.value })}
          aria-label={`Label for count ${index}`}
          className="font-semibold text-[13px] bg-transparent border-0 p-0 focus:outline-none min-w-0 flex-1"
          placeholder={`Count ${index}`}
        />
        {result ? (
          <span className="text-2xs text-muted tabular-nums shrink-0">
            {result.excludedFromGrouping ? (
              <span className="text-caution">consecutive · not grouped</span>
            ) : (
              <>
                level <span className="font-semibold text-ink">{result.adjustedOffenseLevel}</span>
              </>
            )}
          </span>
        ) : null}
        {canRemove ? (
          <Button variant="danger" onClick={onRemove} className="no-print" aria-label={`Remove count ${index}`}>
            Remove
          </Button>
        ) : null}
      </div>

      <div className="p-3 space-y-3">
        {/* --- Statute of conviction --------------------------------------- */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            {/* Not a <label>: the results list holds buttons, and a button inside
                a label has its clicks forwarded to the labelled control. */}
            <span id={`statute-label-${count.id}`} className="block text-2xs font-medium text-muted mb-0.5">
              Statute of conviction
            </span>
            {statute ? (
              <div className="flex items-center gap-2 border border-line rounded px-2 py-1">
                <span className="flex-1 min-w-0">
                  <span className="font-medium">{statute.citation}</span>
                  <span className="text-muted"> — {statute.title}</span>
                </span>
                {statute.confidence === 'unverified' ? (
                  <span className="text-2xs text-caution shrink-0" title="Appendix A mapping not hand-verified">
                    unverified
                  </span>
                ) : null}
                <Button
                  variant="quiet"
                  onClick={() => {
                    patch({ statuteId: undefined, consecutiveMandatory: undefined });
                    setStatuteQuery('');
                  }}
                  className="no-print"
                >
                  Change
                </Button>
              </div>
            ) : (
              <>
                <TextInput
                  aria-labelledby={`statute-label-${count.id}`}
                  value={statuteQuery}
                  onChange={(e) => setStatuteQuery(e.target.value)}
                  placeholder="Search Appendix A — e.g. 841, wire fraud, 924(c)"
                />
                {matches.length > 0 ? (
                  <ul className="mt-1 border border-line rounded divide-y divide-line max-h-56 overflow-y-auto">
                    {matches.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => {
                            patch({
                              statuteId: s.id,
                              consecutiveMandatory: s.consecutiveMandatory,
                            });
                            setStatuteQuery('');
                          }}
                          className="w-full text-left px-2 py-1.5 hover:bg-surface"
                        >
                          <span className="font-medium">{s.citation}</span>
                          <span className="text-muted"> — {s.title}</span>
                          <span className="block text-2xs text-faint">
                            → § {s.guidelines.join(', § ')}
                            {s.confidence === 'unverified' ? ' · unverified mapping' : ''}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            )}
          </div>

          <Field
            label="Guideline"
            hint={guideline.structured ? undefined : 'Not encoded — enter the base level and characteristics yourself.'}
          >
            <Select
              value={count.guidelineOverride ?? guideline.section}
              onChange={(e) => patch({ guidelineOverride: e.target.value })}
            >
              {statute?.guidelines.map((g) => (
                <option key={g} value={g}>
                  § {g} {statute.guidelines.length > 1 ? '(Appendix A alternative)' : ''}
                </option>
              ))}
              {STRUCTURED_GUIDELINES.filter((g) => !statute?.guidelines.includes(g.section)).map((g) => (
                <option key={g.section} value={g.section}>
                  § {g.section} — {g.title}
                </option>
              ))}
              {count.guidelineOverride && !STRUCTURED_GUIDELINES.some((g) => g.section === count.guidelineOverride) ? (
                <option value={count.guidelineOverride}>§ {count.guidelineOverride}</option>
              ) : null}
            </Select>
          </Field>

          <Field label="Other guideline (not listed)" hint="Type any section, e.g. 2A2.2">
            <TextInput
              value={count.guidelineOverride ?? ''}
              onChange={(e) => patch({ guidelineOverride: e.target.value || undefined })}
              placeholder={guideline.section}
            />
          </Field>
        </div>

        {statute?.note ? (
          <p className="text-2xs text-muted leading-snug border-l-2 border-line pl-2">{statute.note}</p>
        ) : null}

        {/* --- § 924(c) / § 1028A consecutive term -------------------------- */}
        {count.consecutiveMandatory || statute?.consecutiveMandatory ? (
          <div className="border border-caution/40 rounded p-2 space-y-2">
            <SubHead>Mandatory consecutive term</SubHead>
            {count.statuteId === '18:924(c)' ? (
              <Field label="Applicable term">
                <Select
                  value={count.consecutiveMandatory?.citation ?? ''}
                  onChange={(e) => {
                    const term = SECTION_924C_TERMS.find((t) => t.citation === e.target.value);
                    patch({
                      consecutiveMandatory: term
                        ? { months: term.months, label: term.label, citation: term.citation }
                        : undefined,
                    });
                  }}
                >
                  <option value="">Select the applicable term…</option>
                  {SECTION_924C_TERMS.map((t) => (
                    <option key={t.id} value={t.citation}>
                      {t.label} — {t.months / 12} years
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <p className="text-2xs text-muted">
                {count.consecutiveMandatory?.months} months, consecutive.{' '}
                <Cite section={count.consecutiveMandatory?.citation ?? ''} />
              </p>
            )}
            <p className="text-2xs text-muted leading-snug">
              This count does not group and no offense level is computed for it. A weapon enhancement on
              any other count is suppressed. <Cite section="§ 2K2.4 cmt. n.4" />
            </p>
          </div>
        ) : null}

        {/* --- Base offense level ------------------------------------------ */}
        {/* A § 924(c) or § 1028A count takes the statutory term as its guideline
            sentence, so none of the offense-level machinery applies to it. */}
        {isConsecutiveOnly ? null : (
          <>
        {guideline.baseOptions.length > 0 ? (
          <div>
            <SubHead>Base offense level</SubHead>
            <div className="mt-1.5 space-y-1">
              {guideline.baseOptions.map((option) => (
                <label key={option.id} className="flex gap-2 items-start text-[13px]">
                  <input
                    type="radio"
                    name={`base-${count.id}`}
                    checked={currentBase === option.id}
                    onChange={() => setBase(option.id)}
                    className="mt-[3px] shrink-0 accent-[rgb(var(--accent))]"
                  />
                  <span className="leading-snug flex-1">
                    {option.label}
                    {option.level > 0 ? (
                      <span className="text-muted tabular-nums"> — level {option.level}</span>
                    ) : null}
                    <Cite section={option.citation} className="ml-1.5" />
                    {option.note ? (
                      <span className="block text-2xs text-faint leading-snug">{option.note}</span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {!guideline.structured || guideline.baseOptions.length === 0 ? (
          <Field
            label="Base offense level"
            hint={guideline.quantityDriver === 'tax' ? 'Computed from the tax loss below.' : undefined}
          >
            <TextInput
              type="number"
              value={count.manualBaseLevel ?? ''}
              onChange={(e) =>
                patch({ manualBaseLevel: e.target.value === '' ? undefined : Number(e.target.value) })
              }
              min={1}
              max={43}
              disabled={guideline.quantityDriver === 'tax'}
            />
          </Field>
        ) : null}

        {/* --- Quantity drivers -------------------------------------------- */}
        {guideline.quantityDriver === 'drug' ? (
          <DrugPanel entries={count.drugs ?? []} onChange={(drugs) => patch({ drugs })} />
        ) : null}

        {guideline.quantityDriver === 'loss' || guideline.quantityDriver === 'benefit' ? (
          <LossPanel count={count} patch={patch} isBenefit={guideline.quantityDriver === 'benefit'} />
        ) : null}

        {guideline.quantityDriver === 'tax' ? (
          <Field label="Tax loss" hint={RELEVANT_CONDUCT_HINT}>
            <MoneyInput
              value={count.loss?.actualLoss}
              onChange={(v) => patch({ loss: { ...count.loss, actualLoss: v } })}
            />
          </Field>
        ) : null}

        {/* --- Specific offense characteristics ---------------------------- */}
        {guideline.socs.length > 0 ? (
          <div>
            <SubHead>Specific offense characteristics</SubHead>
            <div className="mt-1.5 space-y-1.5">
              {guideline.socs
                .filter((soc) => soc.id !== 'safety-valve-reduction')
                .map((soc) => (
                  <Check
                    key={soc.id}
                    checked={socIds.has(soc.id)}
                    onChange={(on) => toggleSoc(soc.id, on)}
                    label={
                      <>
                        {soc.label}
                        {soc.levels !== 0 ? (
                          <span className="text-muted tabular-nums">
                            {' '}
                            {soc.levels > 0 ? '+' : ''}
                            {soc.levels}
                          </span>
                        ) : null}
                        {soc.confidence === 'unverified' ? (
                          <span className="text-caution text-2xs ml-1">· unverified numbering</span>
                        ) : null}
                      </>
                    }
                    citation={soc.citation}
                    hint={soc.note}
                  />
                ))}
            </div>
          </div>
        ) : null}

        <CustomSocs count={count} patch={patch} />

        {/* --- Chapter 3 ---------------------------------------------------- */}
        <Chapter3Panel count={count} patch={patch} />
          </>
        )}

        {/* --- Statutory overrides ----------------------------------------- */}
        <details className="border-t border-line pt-2">
          <summary className="text-2xs font-semibold uppercase tracking-wider text-faint cursor-pointer">
            Statutory penalties
          </summary>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <Field label="Mandatory minimum (months)" hint="Leave blank to use the statute's default.">
              <TextInput
                type="number"
                value={count.statutoryMinMonths ?? ''}
                onChange={(e) =>
                  patch({ statutoryMinMonths: e.target.value === '' ? undefined : Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Statutory maximum (months)" hint="Leave blank for the default; 0 for life.">
              <TextInput
                type="number"
                value={count.statutoryMaxMonths ?? ''}
                onChange={(e) =>
                  patch({
                    statutoryMaxMonths:
                      e.target.value === '' ? undefined : Number(e.target.value) || null,
                  })
                }
              />
            </Field>
            {statute?.penalty?.enhancedTiers?.length ? (
              <Field
                label="21 U.S.C. § 851 prior-felony information"
                wide
                hint="Raises the statutory minimum and maximum. The information must be filed before trial or plea."
              >
                <Select
                  value={String(count.section851Priors ?? 0)}
                  onChange={(e) =>
                    patch({ section851Priors: Number(e.target.value) as 0 | 1 | 2 })
                  }
                >
                  <option value="0">None filed</option>
                  <option value="1">One prior serious drug or violent felony</option>
                  <option value="2">Two or more priors</option>
                </Select>
              </Field>
            ) : null}
          </div>
        </details>

        {result && result.flags.length > 0 ? (
          <div className="border-t border-line pt-2">
            <FlagList flags={result.flags} dense />
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drug quantity
// ---------------------------------------------------------------------------

function DrugPanel({
  entries,
  onChange,
}: {
  entries: readonly DrugEntry[];
  onChange: (entries: DrugEntry[]) => void;
}) {
  const total = totalConvertedKg(entries);
  const next = nextDrugThreshold(total);

  return (
    <div>
      <SubHead>Drug quantity</SubHead>
      <p className="text-2xs text-faint leading-snug mt-0.5 mb-1.5">{RELEVANT_CONDUCT_HINT}</p>

      <div className="space-y-1.5">
        {entries.map((entry, i) => {
          const substance = SUBSTANCE_BY_ID.get(entry.substanceId);
          const usesStrength = entry.unit === 'pills' || entry.unit === 'units';
          const patchEntry = (next: Partial<DrugEntry>) => {
            const copy = [...entries];
            copy[i] = { ...entry, ...next };
            onChange(copy);
          };
          return (
            <div key={i} className="space-y-1">
              <div className="flex gap-1.5 items-start">
                <Select
                  aria-label="Substance"
                  value={entry.substanceId}
                  onChange={(e) => patchEntry({ substanceId: e.target.value })}
                  className="flex-1 min-w-0"
                >
                  {SUBSTANCES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
                <TextInput
                  aria-label="Quantity"
                  type="number"
                  step="any"
                  value={entry.quantity || ''}
                  onChange={(e) => patchEntry({ quantity: Number(e.target.value) })}
                  className="w-24 text-right"
                />
                <Select
                  aria-label="Unit"
                  value={entry.unit}
                  onChange={(e) => patchEntry({ unit: e.target.value as DrugEntry['unit'] })}
                  className="w-20"
                >
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="mg">mg</option>
                  <option value="lb">lb</option>
                  <option value="oz">oz</option>
                  <option value="pills">pills</option>
                  <option value="plants">plants</option>
                </Select>
                {usesStrength ? (
                  <TextInput
                    aria-label="Milligrams per pill"
                    type="number"
                    step="any"
                    value={entry.mgPerUnit ?? ''}
                    onChange={(e) => patchEntry({ mgPerUnit: Number(e.target.value) })}
                    placeholder="mg ea."
                    className="w-20 text-right"
                  />
                ) : null}
                <Button
                  variant="danger"
                  onClick={() => onChange(entries.filter((_, j) => j !== i))}
                  className="no-print shrink-0"
                  aria-label="Remove substance"
                >
                  ×
                </Button>
              </div>
              <div className="text-2xs text-faint pl-1 tabular-nums">
                = {entryToConvertedKg(entry).toLocaleString(undefined, { maximumFractionDigits: 3 })} kg
                converted
                {substance?.note ? <span className="text-caution"> · {substance.note}</span> : null}
              </div>
            </div>
          );
        })}
      </div>

      <Button
        onClick={() => onChange([...entries, { substanceId: 'cocaine', quantity: 0, unit: 'g' }])}
        className="mt-1.5 no-print"
      >
        + Add substance
      </Button>

      <div className="mt-2 pt-2 border-t border-line text-[12px] tabular-nums">
        <span className="text-muted">Total converted drug weight: </span>
        <span className="font-semibold">
          {total.toLocaleString(undefined, { maximumFractionDigits: 3 })} kg
        </span>
        <Cite section="§ 2D1.1 cmt. n.8(D)" className="ml-1.5" />
        {next ? (
          <span className="block text-2xs text-faint mt-0.5">
            Level {next.level} begins at {next.atKg.toLocaleString()} kg —{' '}
            {(next.atKg - total).toLocaleString(undefined, { maximumFractionDigits: 3 })} kg away.
          </span>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loss
// ---------------------------------------------------------------------------

function LossPanel({
  count,
  patch,
  isBenefit,
}: {
  count: CountInput;
  patch: (next: Partial<CountInput>) => void;
  isBenefit: boolean;
}) {
  const loss = count.loss ?? {};
  const setLoss = (next: Partial<typeof loss>) => patch({ loss: { ...loss, ...next } });
  const resolved = resolveLoss(loss);
  const amount = isBenefit ? Math.max(count.benefitValue ?? 0, resolved.amount) : resolved.amount;
  const next = nextLossThreshold(amount);

  return (
    <div>
      <SubHead>{isBenefit ? 'Value of the benefit' : 'Loss'}</SubHead>
      <p className="text-2xs text-faint leading-snug mt-0.5 mb-1.5">{RELEVANT_CONDUCT_HINT}</p>

      <div className="grid grid-cols-2 gap-3">
        {isBenefit ? (
          <Field
            label="Value of the payment or benefit"
            hint="The greatest of the payment value, the benefit received or to be received, or the loss to the government."
            wide
          >
            <MoneyInput value={count.benefitValue} onChange={(v) => patch({ benefitValue: v })} />
          </Field>
        ) : null}
        <Field label="Actual loss">
          <MoneyInput value={loss.actualLoss} onChange={(v) => setLoss({ actualLoss: v })} />
        </Field>
        <Field label="Intended loss" hint="The greater of the two applies.">
          <MoneyInput value={loss.intendedLoss} onChange={(v) => setLoss({ intendedLoss: v })} />
        </Field>
        <Field
          label="Gain"
          hint="Used only where loss is not reasonably determinable. § 2B1.1 cmt. n.3(B)."
          wide
        >
          <MoneyInput value={loss.gain} onChange={(v) => setLoss({ gain: v })} />
        </Field>
      </div>

      <div className="mt-2">
        <SubHead>Credits against loss</SubHead>
        <div className="space-y-1 mt-1">
          {(loss.credits ?? []).map((credit, i) => (
            <div key={i} className="flex gap-1.5">
              <TextInput
                aria-label="Credit description"
                value={credit.label}
                onChange={(e) => {
                  const credits = [...(loss.credits ?? [])];
                  credits[i] = { ...credit, label: e.target.value };
                  setLoss({ credits });
                }}
                placeholder="Money returned, collateral, services rendered…"
                className="flex-1"
              />
              <MoneyInput
                aria-label="Credit amount"
                value={credit.amount}
                onChange={(v) => {
                  const credits = [...(loss.credits ?? [])];
                  credits[i] = { ...credit, amount: v ?? 0 };
                  setLoss({ credits });
                }}
                className="w-32"
              />
              <Button
                variant="danger"
                onClick={() => setLoss({ credits: (loss.credits ?? []).filter((_, j) => j !== i) })}
                className="no-print"
                aria-label="Remove credit"
              >
                ×
              </Button>
            </div>
          ))}
        </div>
        <Button
          onClick={() => setLoss({ credits: [...(loss.credits ?? []), { label: '', amount: 0 }] })}
          className="mt-1.5 no-print"
        >
          + Add credit
        </Button>
      </div>

      <div className="mt-2 pt-2 border-t border-line text-[12px] tabular-nums">
        <span className="text-muted">Loss used: </span>
        <span className="font-semibold">{formatMoney(amount)}</span>
        {resolved.creditsApplied > 0 ? (
          <span className="text-muted">
            {' '}
            ({formatMoney(resolved.gross)} less {formatMoney(resolved.creditsApplied)} in credits)
          </span>
        ) : null}
        {next ? (
          <span className="block text-2xs text-faint mt-0.5">
            The next bracket (+{next.increase}) begins above {formatMoney(next.atAmount)} —{' '}
            {formatMoney(Math.max(0, next.atAmount - amount))} away.
          </span>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Free-form characteristics
// ---------------------------------------------------------------------------

function CustomSocs({
  count,
  patch,
}: {
  count: CountInput;
  patch: (next: Partial<CountInput>) => void;
}) {
  const custom = count.socs.filter((s) => s.customLevels !== undefined);

  return (
    <div>
      <SubHead>Additional adjustments</SubHead>
      <div className="space-y-1 mt-1">
        {custom.map((soc) => (
          <div key={soc.id} className="flex gap-1.5">
            <TextInput
              aria-label="Adjustment description"
              value={soc.customLabel ?? ''}
              onChange={(e) =>
                patch({
                  socs: count.socs.map((s) =>
                    s.id === soc.id ? { ...s, customLabel: e.target.value } : s,
                  ),
                })
              }
              placeholder="Description"
              className="flex-1"
            />
            <TextInput
              aria-label="Citation"
              value={soc.customCitation ?? ''}
              onChange={(e) =>
                patch({
                  socs: count.socs.map((s) =>
                    s.id === soc.id ? { ...s, customCitation: e.target.value } : s,
                  ),
                })
              }
              placeholder="§ 2X1.1(b)"
              className="w-28 font-mono text-2xs"
            />
            <TextInput
              aria-label="Levels"
              type="number"
              value={soc.customLevels ?? 0}
              onChange={(e) =>
                patch({
                  socs: count.socs.map((s) =>
                    s.id === soc.id ? { ...s, customLevels: Number(e.target.value) } : s,
                  ),
                })
              }
              className="w-16 text-right"
            />
            <Button
              variant="danger"
              onClick={() => patch({ socs: count.socs.filter((s) => s.id !== soc.id) })}
              className="no-print"
              aria-label="Remove adjustment"
            >
              ×
            </Button>
          </div>
        ))}
      </div>
      <Button
        onClick={() =>
          patch({
            socs: [
              ...count.socs,
              { id: nextId('soc'), customLevels: 0, customLabel: '', customCitation: '' },
            ],
          })
        }
        className="mt-1.5 no-print"
      >
        + Add adjustment
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chapter 3
// ---------------------------------------------------------------------------

function Chapter3Panel({
  count,
  patch,
}: {
  count: CountInput;
  patch: (next: Partial<CountInput>) => void;
}) {
  const ch3 = count.chapter3;
  const set = (next: Partial<typeof ch3>) => patch({ chapter3: { ...ch3, ...next } });

  return (
    <div className="border-t border-line pt-2">
      <SubHead>Chapter 3 adjustments</SubHead>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-1.5">
        <div className="space-y-1.5">
          <Check
            checked={Boolean(ch3.hateCrime)}
            onChange={(v) => set({ hateCrime: v })}
            label="Hate crime motivation +3"
            citation="§ 3A1.1(a)"
          />
          <Check
            checked={Boolean(ch3.vulnerableVictim)}
            onChange={(v) => set({ vulnerableVictim: v })}
            label="Vulnerable victim +2"
            citation="§ 3A1.1(b)(1)"
          />
          {ch3.vulnerableVictim ? (
            <div className="pl-5">
              <Check
                checked={Boolean(ch3.vulnerableVictimMany)}
                onChange={(v) => set({ vulnerableVictimMany: v })}
                label="Large number of vulnerable victims +2"
                citation="§ 3A1.1(b)(2)"
              />
            </div>
          ) : null}
          <Check
            checked={Boolean(ch3.restraintOfVictim)}
            onChange={(v) => set({ restraintOfVictim: v })}
            label="Victim physically restrained +2"
            citation="§ 3A1.3"
          />
          <Check
            checked={Boolean(ch3.terrorism)}
            onChange={(v) => set({ terrorism: v })}
            label="Terrorism +12"
            citation="§ 3A1.4"
            hint="Floors the offense level at 32 and sets Criminal History Category VI."
          />
          <Check
            checked={Boolean(ch3.abuseOfTrust)}
            onChange={(v) => set({ abuseOfTrust: v })}
            label="Abuse of position of trust or special skill +2"
            citation="§ 3B1.3"
          />
          <Check
            checked={Boolean(ch3.obstruction)}
            onChange={(v) => set({ obstruction: v })}
            label="Obstruction of justice +2"
            citation="§ 3C1.1"
          />
        </div>

        <div className="space-y-2">
          <Field label="Official victim">
            <Select
              value={ch3.officialVictim ?? 'none'}
              onChange={(e) => set({ officialVictim: e.target.value as typeof ch3.officialVictim })}
            >
              <option value="none">Not applicable</option>
              <option value="standard">Official victim +3 (§ 3A1.2(a)–(b))</option>
              <option value="assaultive">Assaultive conduct toward an officer +6 (§ 3A1.2(c))</option>
            </Select>
          </Field>

          <Field label="Aggravating role">
            <Select
              value={ch3.aggravatingRole ?? 'none'}
              onChange={(e) => set({ aggravatingRole: e.target.value as typeof ch3.aggravatingRole })}
            >
              <option value="none">Not applicable</option>
              <option value="a">Organizer or leader, 5+ participants +4 (§ 3B1.1(a))</option>
              <option value="b">Manager or supervisor, 5+ participants +3 (§ 3B1.1(b))</option>
              <option value="c">Any other organizer or supervisor +2 (§ 3B1.1(c))</option>
            </Select>
          </Field>

          <Field label="Mitigating role">
            <Select
              value={ch3.mitigatingRole ?? 'none'}
              onChange={(e) => set({ mitigatingRole: e.target.value as typeof ch3.mitigatingRole })}
            >
              <option value="none">Not applicable</option>
              <option value="minimal">Minimal participant −4 (§ 3B1.2(a))</option>
              <option value="intermediate">Between minimal and minor −3 (§ 3B1.2)</option>
              <option value="minor">Minor participant −2 (§ 3B1.2(b))</option>
            </Select>
          </Field>

          <Check
            checked={Boolean(ch3.inchoateReduction)}
            onChange={(v) => set({ inchoateReduction: v })}
            label="Attempt, conspiracy, or solicitation −3"
            citation="§ 2X1.1(b)"
            hint="Does not apply where the guideline for the substantive offense expressly covers conspiracy, as § 2D1.1 does for 21 U.S.C. § 846."
          />
          {ch3.inchoateReduction ? (
            <div className="pl-5">
              <Check
                checked={Boolean(ch3.substantiallyCompleted)}
                onChange={(v) => set({ substantiallyCompleted: v })}
                label="The substantive offense was substantially completed"
                hint="Defeats the reduction."
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
