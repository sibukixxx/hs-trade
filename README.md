# HS Classification Lab

An OSS experiment in AI-assisted HS (Harmonized System) code classification —
a small, single-purpose tool, not a trade platform.

> **AI classification results are not an official customs determination.** They
> are a research/reference tool. For anything that matters, confirm with a
> customs broker or your local customs authority.

## What is this?

This project exists for three reasons, in this order of priority:

1. **Self-use** — the author personally imports/exports between Japan, the US,
   China and the EU, and wants a tool to understand and research HS
   classification for that.
2. **OSS** — publishing it so individuals, importers/exporters, and customs
   brokers can try it for free, with zero setup friction.
3. **B2B opportunity** — if a company is interested in using this in a real
   workflow, there's a small, static pointer to consult TechVit about it.
   Nothing more (see "Business inquiries" below).

It is **not** a SaaS product today, and it deliberately does not try to be a
full trade platform. It classifies one thing: given product information, what
HS code(s) might apply, and why.

```
商品情報を入力
      ↓
分類に必要な情報を整理
      ↓
情報不足なら追加質問
      ↓
HSコード候補を提示
      ↓
なぜその候補なのか説明
      ↓
ユーザーが確認 (正しい / 違うと思う / 分からない)
```

### Out of scope (on purpose)

Tariff rates, import/consumption tax, VAT, FTA/EPA, rules of origin, import
and export regulations, licensing, Commercial Invoice / Packing List
generation, customs declarations, shipping/logistics, landed cost, product
management, authentication, billing, workspaces, CRM, and CSV bulk
processing are **not** part of this tool. If any of these become useful
later, they'll be built as separate Trade Tools, not folded into this one:

```
Trade Tools
├── HS Classifier        ← this repo
├── Tariff Lookup        ← future, separate tool
├── Classification Cases ← future, separate tool
├── Regulation Check     ← future, separate tool
├── Origin / FTA         ← future, separate tool
└── Documents            ← future, separate tool
```

## Demo

No account, no credit card, no API key, and no GitHub login are required to
use this tool — "open the site → describe a product → try it" is the whole
interaction.

This repository is structured to be deployed as a public, zero-auth demo
(a static Preact SPA + a small serverless API). It doesn't ship with a
hosted URL by default — see [Local development](#local-development) to run
it yourself, or deploy `apps/web` as a static site and `apps/api` as a
Cloudflare Worker.

## How it works

```
Preact SPA (apps/web)
     │  fetch (JSON)
     ▼
Serverless API (apps/api, Cloudflare Workers)
     │
     ├── POST /api/classify ──► @hs-trade/classifier ──► HS dataset (data/hs/*.json)
     │                                │
     │                                └──► LLM (Anthropic, only if ANTHROPIC_API_KEY is set)
     │                                     otherwise falls back to a deterministic heuristic ranker
     │
     └── POST /api/feedback ──► KV (optional) or console.log
```

```
hs-trade/
├── data/hs/                 Static HS dataset (chapters/headings/subheadings + version/source)
├── packages/classifier/     Classification logic. Independent of any UI framework, fully unit-testable.
│   └── src/
│       ├── types.ts         ClassificationRequest / ClassificationResult — the JSON boundary
│       ├── productFacts.ts  Normalization + source-priority resolution ("don't mix inference with fact")
│       ├── categories/      Per-category required-fact questions (textile/food/chemical/machinery)
│       ├── candidates.ts    Keyword-based candidate retrieval from the dataset (no DB/vector store)
│       ├── llm/             LLM interface + heuristic fallback + Anthropic implementation
│       ├── missingFacts.ts  Decides what's still missing before a code can be suggested
│       ├── feedback.ts      Feedback type shared by the web app and the API
│       └── classify.ts      Orchestrates the whole pipeline
├── apps/api/                Cloudflare Worker — the only place the LLM API key lives
├── apps/web/                Preact + TypeScript + Vite + TanStack Router SPA
└── tests/cases/             Fixture-based test cases (food/textile/machinery/chemical/ambiguous)
```

**Design rule:** classification logic never lives inside a UI component. The
boundary is:

```
ClassificationRequest
        ↓
Classifier   (packages/classifier — plain TypeScript, no framework)
        ↓
ClassificationResult
```

This is what would let a future, stable subset of this logic be ported to a
Go "Trade Engine" without dragging the UI along — that port is **not** done
in this repository, just kept possible.

The LLM never invents HS codes. Candidates are retrieved from the static
dataset by keyword match first; the LLM (or, without an API key, a
deterministic heuristic ranker) only ranks and explains the candidates it
was given. Any code an LLM returns that isn't in that candidate list is
discarded by `classify()`.

### Classification flow in detail

商品情報入力(商品名・商品説明は必須。画像/輸出元国/輸入先国は任意)
→ ProductFactsへ正規化 → カテゴリー判定(textile/food/chemical/machinery/unknown)
→ 必要な情報が揃っているか判定 → 不足があれば `NEEDS_INFORMATION` として追加質問を返す
→ 揃っていればデータセットから候補を検索 → LLM(またはヒューリスティック)が候補をランク付け
→ `CLASSIFIED` / `NEEDS_REVIEW` / `NEEDS_INFORMATION` のいずれかを返す。

固定20項目フォームは使いません。商品カテゴリーに応じて聞かれる質問が変わります
(例: Textileなら素材構成比・ニット/織物の別、Foodなら原材料と加工方法、Chemicalなら
化学名とCAS番号、Machineryなら機能と完成品/部品の別)。情報が不足していても、無理に
コードを返すことはしません — `NEEDS_INFORMATION` は正常な結果として扱われます。

**推測と事実を混ぜない:** 商品情報には常に情報源(`USER_DECLARED` / `IMAGE_INFERRED` /
`TEXT_INFERRED` / `AI_INFERRED`)を持たせます。分類に決定的な情報(繊維の素材構成、
食品の原材料、化学品の化学名など)は、ユーザー自身の申告がない限り「不足情報」として
扱われ、AIやImage推定だけで確定させることはありません。ユーザー申告とAI/画像推定が
競合する場合はユーザー申告を優先し、結果のUNCERTAINTYセクションにその旨を記録します。

結果画面は以下の構造で、AIの回答を鵜呑みにさせない設計にしています。

- **RESULT** — HS候補(Recommended + Other candidates)
- **WHY** — なぜその候補なのかの理由
- **PRODUCT FACTS** — 分類に利用した商品情報とその情報源
- **UNCERTAINTY** — 不明・推定に基づく情報、情報源間の矛盾
- **SOURCE** — 利用したデータセットのバージョンと出典

## Local development

Requirements: Node.js 20+, npm.

```bash
npm install

# 1) API (Cloudflare Workers, run locally via Miniflare — no API key required)
npm run dev:api      # http://localhost:8787

# 2) Web (in another terminal)
cp apps/web/.env.example apps/web/.env
npm run dev:web      # http://localhost:5173
```

To use a real LLM instead of the built-in heuristic fallback (optional):

```bash
cd apps/api
npx wrangler secret put ANTHROPIC_API_KEY
```

Without a key, `classify()` uses a deterministic keyword-overlap ranker
instead — this is also what the test suite runs against, so the app and its
tests work with zero external dependencies.

To persist feedback instead of just logging it, create a Cloudflare KV
namespace and uncomment the binding in `apps/api/wrangler.toml`.

### Tests

```bash
npm test
npm run typecheck
```

## Data sources

`data/hs/*.json` is a small, **hand-curated demo subset** referencing the
WCO Harmonized System 2022 Edition (`data/hs/meta.json` records `version`
and `source`). It currently covers a handful of headings/subheadings under
Textile (chapters 61/62), Food (09/21), Chemical (29), and Machinery (85) —
just enough to exercise every part of the classification pipeline.

**This is not a complete or authoritative HS dataset.** For real
classification decisions, always check the official tariff schedule, WCO
publications, and your national customs authority.

## Limitations

- The dataset covers only a handful of chapters/headings — no claim of
  completeness.
- Image URLs can be attached, but automatic AI image analysis (generating
  `IMAGE_INFERRED` facts) is not implemented in this P0. The type exists;
  the inference pipeline doesn't yet.
- The LLM only ranks candidates already retrieved from the dataset, so
  classification breadth is limited by dataset breadth, not just model
  quality.
- Feedback is only persisted if a Cloudflare KV namespace is configured;
  otherwise it's logged and discarded.
- Tariffs, taxes, FTA/origin, import/export regulations, licensing, trade
  document generation, logistics, and landed cost are intentionally out of
  scope — see "Out of scope" above.
- No authentication, billing, workspaces, or CRM — also intentional.

## Contributing

Contributions are welcome, especially:

- Real-world usage feedback (please open an Issue)
- Expanding `data/hs/*.json` with more headings/subheadings and keywords
- New test cases under `tests/cases/**`
- New product cases under `eval/cases/**` — see [`eval/README.md`](eval/README.md)

Run `npm test` before opening a pull request.

**Once this P0's flow works end-to-end in the browser, no new features are
being added.** The priority right now is real feedback on this one tool,
not scope expansion.

## Validation

Passing tests confirms the *code* does what it's supposed to. It says nothing
about whether the *classification* is actually any good. [`eval/`](eval/)
is a separate, growable set of real-ish product cases — some easy, some
deliberately ambiguous — graded against classification that's either
definitional (the HS nomenclature's own legal text) or backed by a specific
researched source, never against the AI's own guess. Run it with
`npm run eval`; results (including where the current classifier is
confidently right, quietly wrong, or honestly out of its depth) live in
[`eval/RESULTS.md`](eval/RESULTS.md) and the write-up in
[`eval/README.md`](eval/README.md).

## Feedback

Every result ends with:

```
この分類についてどう思いますか？
[ 正しい ]  [ 違うと思う ]  [ 分からない ]
```

Choosing "違うと思う" (incorrect) optionally lets you add the HS code you
believe is correct, why, and what information was missing — all optional,
all used purely to improve the classifier as an OSS project. No account,
practitioner profile, or contact info is required to leave feedback.

## Business inquiries

This project does not build out B2B features (no CRM, no sales pipeline, no
company accounts/workspaces). If a business wants to explore integrating
this into an internal system, connecting it to a product master, or other
AI-assisted trade-ops work, there's a small, static note in the app's
footer pointing to **TechVit** — not a lead-capture form, just a pointer.
