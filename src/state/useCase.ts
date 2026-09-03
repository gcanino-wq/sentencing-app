import { useCallback, useMemo, useState } from 'react';
import { calculate, type Calculation } from '../engine/calculate';
import type { Annotations } from '../engine/worksheets';
import { buildWorksheets, flattenWorksheets, type Worksheet } from '../engine/worksheets';
import { wizardSteps, type WizardStep } from '../engine/wizard';
import type { CaseFacts, PriorSentence, SocKey } from '../engine/types';
import { DEFAULT_ANNOTATIONS, DEFAULT_FACTS } from './defaults';

export type Screen = 'matters' | 'search' | 'wizard' | 'worksheet' | 'result' | 'compare';

export type ScenarioId = 'plea3' | 'plea2' | 'trial';

export interface CaseController {
  screen: Screen;
  goTo: (screen: Screen) => void;

  facts: CaseFacts;
  patch: (changes: Partial<CaseFacts>) => void;
  toggleSoc: (soc: SocKey) => void;
  addPrior: (prior?: PriorSentence) => void;

  calc: Calculation;
  sheets: Worksheet[];
  annotations: Annotations;
  setNote: (id: string, note: string) => void;
  toggleContested: (id: string) => void;

  steps: WizardStep[];
  stepIndex: number;
  step: WizardStep;
  nextStep: () => void;
  previousStep: () => void;

  /** Worksheet line currently open in the edit sheet, if any. */
  openLineId: string | null;
  openLine: (id: string | null) => void;

  exported: boolean;
  markExported: () => void;

  scenario: ScenarioId;
  chooseScenario: (id: ScenarioId, acceptance: number) => void;
}

/** Owns every piece of case state and derives the worksheets from it. */
export function useCase(): CaseController {
  const [screen, setScreen] = useState<Screen>('matters');
  const [facts, setFacts] = useState<CaseFacts>(DEFAULT_FACTS);
  const [annotations, setAnnotations] = useState<Annotations>(DEFAULT_ANNOTATIONS);
  const [stepIndex, setStepIndex] = useState(0);
  const [openLineId, setOpenLineId] = useState<string | null>(null);
  const [exported, setExported] = useState(false);
  const [scenario, setScenario] = useState<ScenarioId>('plea3');

  const goTo = useCallback((next: Screen) => {
    setScreen(next);
    setOpenLineId(null);
  }, []);

  const patch = useCallback((changes: Partial<CaseFacts>) => {
    setFacts((current) => ({ ...current, ...changes }));
  }, []);

  const toggleSoc = useCallback((soc: SocKey) => {
    setFacts((current) => ({
      ...current,
      socs: current.socs.includes(soc)
        ? current.socs.filter((s) => s !== soc)
        : [...current.socs, soc],
    }));
  }, []);

  const addPrior = useCallback((prior?: PriorSentence) => {
    setFacts((current) => ({
      ...current,
      priors: [
        ...current.priors,
        prior ?? { desc: 'New prior sentence', meta: 'date · sentence imposed', pts: 1 },
      ],
    }));
  }, []);

  const setNote = useCallback((id: string, note: string) => {
    setAnnotations((current) => ({ ...current, notes: { ...current.notes, [id]: note } }));
  }, []);

  const toggleContested = useCallback((id: string) => {
    setAnnotations((current) => ({
      ...current,
      contested: { ...current.contested, [id]: !current.contested[id] },
    }));
  }, []);

  const calc = useMemo(() => calculate(facts), [facts]);
  const sheets = useMemo(
    () => buildWorksheets(facts, calc, annotations),
    [facts, calc, annotations],
  );
  const steps = useMemo(() => wizardSteps(facts), [facts]);
  const boundedIndex = Math.min(stepIndex, steps.length - 1);

  const nextStep = useCallback(() => {
    setStepIndex((current) => {
      if (current >= steps.length - 1) {
        goTo('worksheet');
        return current;
      }
      return current + 1;
    });
  }, [goTo, steps.length]);

  const previousStep = useCallback(() => {
    setStepIndex((current) => {
      if (current === 0) {
        goTo('search');
        return current;
      }
      return current - 1;
    });
  }, [goTo]);

  const chooseScenario = useCallback(
    (id: ScenarioId, acceptance: number) => {
      setScenario(id);
      patch({ acceptance });
    },
    [patch],
  );

  const openLine = useCallback(
    (id: string | null) => {
      if (id === null) {
        setOpenLineId(null);
        return;
      }
      const line = flattenWorksheets(sheets).find((l) => l.id === id);
      setOpenLineId(line?.editable ? id : null);
    },
    [sheets],
  );

  return {
    screen,
    goTo,
    facts,
    patch,
    toggleSoc,
    addPrior,
    calc,
    sheets,
    annotations,
    setNote,
    toggleContested,
    steps,
    stepIndex: boundedIndex,
    step: steps[boundedIndex],
    nextStep,
    previousStep,
    openLineId,
    openLine,
    exported,
    markExported: () => setExported(true),
    scenario,
    chooseScenario,
  };
}
