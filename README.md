# Federal Sentencing Calculator

Guideline range estimation from the counts of conviction, for federal criminal
defense practice. Enter statutes; the app maps them through Appendix A to the
applicable Chapter 2 guideline and works through Chapters 2, 3, 4, and 5 to an
advisory range, then overlays statutory minima and maxima, then models departures
and variances.

> **Attorney work-product tool.** An estimation aid for licensed counsel. The
> guidelines are advisory (*United States v. Booker*); the court and the Probation
> Office make the actual determination.
>
> **The guidelines data in this build has not been verified against the published
> manual.** See [VERIFICATION.md](VERIFICATION.md) and check it before relying on
> any output in a real case.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # engine test suite
npm run build    # static export to ./out
```

The build is a static export: no server, no API routes, all computation in the
browser. Serve `out/` from anywhere, or open it locally. **Nothing typed into the
app is transmitted or stored** — the inputs are privileged client material and the
architecture reflects that.

## What it does

- **Statute-driven entry.** Search Appendix A by citation or offense name. Entries
  are tiered: a hand-encoded core covering the high-volume docket, and a broader
  tier marked *unverified* that prompts you to confirm the mapping.
- **Chapter 2** with structured specific offense characteristics for § 2B1.1,
  § 2B3.1, § 2C1.1, § 2D1.1, § 2K2.1, § 2K2.4, § 2L1.2, § 2S1.1, § 2T1.1, and
  § 2B1.6. Every other guideline accepts a base level plus cited adjustments, so
  nothing is uncomputable.
- **Converted drug weight** across multiple substances and units, including
  per-pill entry for pharmaceuticals and the methamphetamine actual/mixture split.
- **Loss** as the greater of actual and intended, with a credits worksheet and
  gain as a fallback.
- **Chapter 3** adjustments, **§ 3D grouping** with quantity aggregation under
  § 3D1.3(b), **Chapter 4** criminal history prior-by-prior with career offender,
  ACCA, and zero-point offender, and **Chapter 5** with § 5G1.1 clamping and
  § 5G1.2(d) stacking.
- **Statutory overlay**: mandatory minima, § 851 enhanced tiers, § 924(c)
  consecutive terms presented separately from the grouped-counts range, safety
  valve, and a good-time estimate.
- **Jurisdiction cautions** by district and circuit, defaulting to D.P.R. /
  First Circuit — including Puerto Rico Penal Code predicate warnings.
- **Printable worksheet** mirroring USSC Worksheets A–D, deliberately anonymous.

## Interaction traps it catches

These are suppressed or flagged automatically, always with a stated reason:

| Trap | Rule |
| --- | --- |
| Weapon enhancement on a count grouped with a § 924(c) | § 2K2.4 cmt. n.4 |
| Weapon enhancement while claiming the safety valve | 18 U.S.C. § 3553(f)(2) |
| Acceptance applied alongside obstruction | § 3E1.1 cmt. n.4 |
| Stacking mutually exclusive characteristics | Chapter 2 |
| Career offender and terrorism overriding the category | § 4B1.1(b), § 3A1.4(b) |

## How it stays honest

- **Every step cites itself.** The result view is an audit trail; each level
  movement names the subsection that produced it and links to the official text.
- **It never blocks.** Incomplete input still computes, with the assumption stated
  as a warning rather than buried as a silent default.
- **Uncertainty is marked, not hidden.** Unverified Appendix A entries, unconfirmed
  subsection numbering, and open legal questions are labeled as such.
- **It does not decide legal questions it cannot decide** — categorical-approach
  predicates, ACCA occasions, § 3D1.2(a)–(c) grouping, relevant conduct scope.

## Layout

```
src/engine/          Pure calculation library — no I/O, no DOM
  data/              Every table in an isolated module: a correction is one line
  chapter2.ts        Base level, specific offense characteristics, traps
  chapter3.ts        Adjustments and acceptance
  grouping.ts        § 3D1.2–3D1.5
  chapter4.ts        Criminal history, career offender, ACCA, zero-point
  chapter5.ts        Statutory overlay, § 5G clamping, ladder, BOP estimate
  calculate.ts       Orchestrator
  __tests__/         79 tests
src/components/      UI over the engine
src/app/             Next.js app router, static export
```

## Scope

v1 covers original sentencing. Chapter 7 revocation ranges, § 3582(c)(2)
retroactive relief, restitution computation, and multi-edition § 1B1.11 selection
are out of scope; the engine is structured so revocations can be added without a
refactor.
