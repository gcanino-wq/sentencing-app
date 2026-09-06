# Guideline — Sentencing Guideline Calculator

A federal sentencing guideline worksheet for practitioners. Enter the facts of a
count of conviction and the app runs Worksheets A–D against the real tables:
loss under §2B1.1(b)(1), victims and financial hardship, specific offense
characteristics, role, obstruction, acceptance, criminal history points, and
finally the Chapter 5, Part A sentencing table for the range and zone.

The arithmetic is live. Change the loss figure or drop acceptance and every
downstream line, the category, the range and the zone recompute.

## Running it

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # engine tests
npm run build      # typecheck + production build
```

## How it fits together

The guideline math lives in `src/engine/` and knows nothing about React, so it
can be tested directly and reused:

| Module | What it holds |
| --- | --- |
| `sentencingTable.ts` | Chapter 5, Part A minimums for levels 1–42 across the six categories; range lookup and §5C1.1 zones |
| `guideline2B1_1.ts` | Base offense level, the §2B1.1(b)(1) loss table, victim and hardship prongs, specific offense characteristics, role |
| `criminalHistory.ts` | Point totals in guided or direct mode, the §4A1.1(e) status point, and the point-to-category mapping |
| `calculate.ts` | Runs the whole worksheet, base offense level through zone |
| `lineMeta.ts` | Guideline text, options and edit behaviour for each editable worksheet line |
| `worksheets.ts` | Builds Worksheets A–D with official line numbers and language |
| `wizard.ts` | The seven interview questions |

The UI is a thin layer over that. `src/state/useCase.ts` owns the case state and
derives the worksheets from it; each screen in `src/screens/` renders one step of
the flow:

```
Matters → StatuteSearch → Wizard → Worksheets → Result → Compare
```

Any worksheet line backed by an entry in `lineMeta.ts` opens an edit sheet
showing the guideline language it comes from, the control that changes it, a
contested flag and a note for the file. Contested lines are collected on the
result screen with what each one is worth.

## Try it

Open a matter → search a statute → answer the wizard → tap Worksheet A line 2(b)
and change the loss to $400,000. The loss adjustment drops from +14 to +12 and
the range moves from 46–57 to 37–46 months.

## Scope

`§2B1.1` is implemented in depth. The rest is deliberately partial:

- Other Chapter 2 guidelines resolve from the statute search but do not compute.
- Worksheet B grouping is scaffolded for a second count; the §3D1.4 unit math is
  not yet wired.
- Career offender (§4B1.1) and ACCA (§4B1.4) appear as flags on Worksheet D, not
  as override math.
- The §4C1.1 zero-point reduction is reported as eligible or not, but is not
  applied to the total.
- The sentencing table stops at level 42; levels above it clamp there rather than
  reporting life at 43.
- Export saves nothing yet — the button only marks the worksheet as saved.

## Verification

`VERIFICATION.md` records what has been checked against the Guidelines Manual,
what was corrected, and what is still unverified. Read it before relying on a
figure this app produces.

## Disclaimer

The Guidelines are advisory. This produces an estimate from the facts entered
under the Guidelines Manual, Nov. 2024. It is not legal advice and does not
predict what a court will do under 18 U.S.C. § 3553(a).
