# HS Classifier P0 Validation

This is **not** part of the product. It's the "actually use it to try to break it"
phase that comes after a feature is built: a small, growable set of real-ish
products run through the current classifier, graded against classification
that's either definitional (the literal text of the HS nomenclature) or backed
by a specific researched source — never against the AI's own guess.

The question this answers is not "what's the accuracy percentage?" — it's:

> When the tool doesn't actually know, does it correctly say so? And when it's
> wrong, *why* — missing product info, a question it should have asked, a gap
> in the demo dataset, a retrieval miss, a misapplied classification rule, or
> a bad AI judgment call?

## Running it

```bash
npm run eval
```

This drives every fixture in `cases/*.json` through `classify()` (using the
same deterministic `HeuristicLlm` the unit tests use — no API key, no network
calls), simulates the follow-up-question round trip, checks the result
against each fixture's declared expectations, and writes:

- `eval/RESULTS.md` — human-readable report: a summary table, then full
  per-case detail (checks, auto-diagnosed failure reasons, the author's own
  prediction written *before* the case was run, and the full round-by-round
  trace).
- `eval/results.json` — the same data as structured JSON, for anyone who
  wants to slice it differently.

Both files are regenerated on every run and are committed to the repo so the
validation history is visible in git, not just on someone's machine.

`npm test` also runs this suite (it's fast — no network I/O). The **one**
assertion that actually fails the build is: no case may return `CLASSIFIED`
when the fixture declares information was insufficient. Everything else is
reported, not gated — a dataset gap is a known, expected outcome at this
stage, not a regression.

## Adding a case

Drop a new JSON file under `cases/`, matching the `EvalCase` shape in
`schema.ts`. No code changes needed. The one rule that matters more than the
schema: **don't invent the expected HS code.** Set `expectedHs.basis` to:

- `"HS_NOMENCLATURE_TEXT"` — the heading/subheading's own legal text settles
  it (e.g. tea is heading 0902 because that heading is literally titled
  "Tea..."). This is reading the law, not guessing.
- `"RESEARCHED"` — a specific, cited external source (an official ruling, a
  customs classification guide, WCO Explanatory Notes) backs it up. Name the
  source in `reference`.
- `"UNKNOWN"` — neither applies. This is fine and expected for genuinely
  contested cases. Set `expectedHs.level: "unknown"` and skip `code`; the
  harness won't grade candidate-retrieval for that case, but every other
  check (did it ask sensible questions, did it stay appropriately uncertain,
  did it avoid inventing an answer) still runs.

Write `notes` as a **prediction**, before you look at the output — what do
you expect to happen and why? That's what makes the eventual report an actual
"予想 → 分類 → 確認 → 一致/不一致 → なぜ" trail instead of just a pass/fail
table.

## What the checks mean

| Check | What it catches |
|---|---|
| `status_as_expected` | Final status differs from what a competent classifier should return. |
| `no_overconfident_classification` | **Critical.** `CLASSIFIED` when the case says info was insufficient. |
| `category_as_expected` | Routed to the wrong internal category — catches "right status, wrong reasoning" (e.g. asking chemical questions about a shampoo). |
| `expected_questions_asked` | Didn't ask something a competent classifier should have asked. |
| `expected_candidate_found` | The correct code never showed up among the candidates at all. |
| `top_candidate_matches_expected` | The correct code was retrieved, but something else was ranked #1 — the thing most users will actually read as "the answer." |
| `facts_roundtrip` | A user-supplied answer didn't survive into the final `ProductFacts` as `USER_DECLARED` — a product-facts plumbing bug. |
| `evidence_present` | Candidates/questions missing a `reason`, or dataset provenance missing. |

Failed checks are auto-mapped into the six root-cause buckets from the
validation brief (`schema.ts` has the full mapping), which the summary table
then rolls up into five dimensions: product facts, missing-information
detection, candidate retrieval, classification reasoning, and evidence.

## Findings from this validation round (15 cases, 7 categories)

Full detail is in `RESULTS.md`. The headline numbers as of the last run:
**0 / 15 overconfident classifications** (the one thing that must never
happen didn't happen), but **11 / 15 cases had at least one other issue**.
By dimension: candidate retrieval (9 cases), classification reasoning
(4 cases), missing-information detection (4 cases), product facts (0),
evidence (0).

**1. Category coverage is much narrower than the category *names* suggest.**
Footwear, electronics, and cosmetics have no category definitions at all —
every case in those three fell to the generic "please clarify" question
instead of anything domain-relevant, even when the description already had
every fact needed to classify. This isn't a subtle miss; it's the largest
single source of failures in this round (6 of 15 cases). "Machinery" is
narrower than it sounds, too: it correctly detects motor/appliance language,
but its candidate search only ever looks at chapter 85 heading 8509
(domestic appliances) — a generic ball bearing (chapter 84) gets the right
category and the right questions, then zero candidates.

**2. "Food" and "textile" are legitimately good at what they cover, but that
coverage is narrower than the demo suggests.** Plain green tea, matcha, and
instant tea extract all worked (see the interesting result below); instant
noodles and a chocolate bar didn't even get detected as "food" at all,
because the food category's keyword list is tea/beverage-shaped, not
food-shaped. Apparel correctly asks the right three questions every time.

**3. A one-character keyword caused a real, silent miscategorization.** The
chemical category's match list includes the single character `酸` ("acid").
"アミノ酸系シャンプー" ("amino-acid-based shampoo") — completely ordinary
product copy — contains that character as a substring of "アミノ酸" and gets
silently routed into the chemical-product question flow (asking for a
chemical name / CAS number, for a bottle of shampoo). This is worse than "the
tool doesn't know this product": it's *confidently* asking the wrong
questions. Of everything found this round, this is the one worth fixing
first — category detection needs multi-character/word-boundary matching, not
raw substring checks, especially for single-character keywords.

**4. The classifier has no concept of "which fact wins" beyond source
priority — it doesn't parse the *content* of an answer, even when a real HS
rule depends on it.** A shirt declared as "65% polyester / 35% cotton" should
classify as man-made-fibre by the actual HS chief-weight rule (Section XI,
Note 2), but the scorer just checks whether the words "cotton" and
"polyester" both appear — it would score identically regardless of which
percentage was higher. Whichever subheading happened to load first from the
dataset file won. This is a real gap, not a hypothetical one: it means a
"CLASSIFIED, 55% confidence" result can be a coin flip dressed up as a
number.

**5. The most interesting result was a partial success for a subtly wrong
reason.** The matcha-powder case was predicted (in the fixture's own
pre-registered notes) to fail retrieval, since its natural-language
description never uses the literal words "緑茶" or "不発酵" that the
green-tea subheading's keywords require. It actually got classified
correctly (0902.10) — but tracing why revealed that *every* subheading under
heading 0902 got a nonzero score purely from the heading-level keyword "茶"
("tea"), which matches any tea product regardless of fermentation or
processing state. In other words: it landed on the right answer via the same
mechanism (a same-heading, keyword-tie, file-order coin flip) that produced
the *wrong* answer in the fiber-blend case above. Getting the right answer
here was luck, not evidence the retrieval logic understands the
leaf-vs-extract distinction — the instant-tea-extract case worked for the
right reason (its own subheading's keywords — "茶エキス", "インスタント" —
actually matched), which is the useful contrast.

None of this needs to be fixed to call the P0 loop "done" — the loop itself
(input → ask → classify → show evidence → feedback) works, per the earlier
Definition of Done. What this round says is where the *next* real work is:
not a new Trade Tool, but making the existing one's category/dataset
coverage and candidate-ranking honest about its own limits before it's
trusted with more product categories.
