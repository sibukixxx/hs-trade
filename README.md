# HS Classification Lab

AIによるHSコード分類が、実際の通関・貿易実務でどこまで使えるのかを検証するための、
小さく公開されたOSS実験プロジェクトです。

> **HS Classification Lab is an experimental, public research tool for testing how far
> AI-assisted HS code classification can go in real customs/trade workflows. It is not
> a final customs determination.**

⸻

## このプロジェクトの目的

このプロジェクトは現時点で**有料SaaSを目的としていません**。

目的はただ一つ、

> AIによるHSコード分類が、実際の通関・貿易実務でどこまで使えるのかを公開環境で検証する

ことです。通関業者、通関士、貿易実務担当者、輸出入事業者、越境EC事業者、貿易に詳しい
エンジニアなどに実際に使ってもらい、

- AIの分類は正しいか
- 何が間違っているか
- どんな商品情報が不足するか
- 何があれば信用できるか
- 実務上どの機能が必要か

というフィードバックを集めることがゴールです。**分類精度そのものと同じくらい、
実務者から質の高いフィードバックを得られることをこのP0の成功条件としています。**

## ⚠️ 重要な注意事項

- **この結果は通関上の最終判断ではありません。** 実際の輸出入にあたっては、必ず
  税関・通関士等の専門家にご確認ください。
- 本プロジェクトは**現在実験段階**です。分類精度・データセットの網羅性は保証されません。
- 関税率計算・輸入消費税・VAT・EPA/FTA・原産地判定・輸入/輸出規制・許認可判定・
  Commercial Invoice/Packing Listの生成・通関申告・物流・landed costは、この
  ツールの責務**ではありません**。これらは将来的に別のTradeツールとして切り出す構想
  ですが、このリポジトリでは実装しません。

## 機能境界(スコープ)

このプロジェクトが実装するのは **HS Classifier のみ** です。

```
Trade Tools (将来構想。今回はHS Classifierのみ実装)
├── HS Classifier          ← これだけ実装
├── Product Facts          ← HS Classifier内部の仕組みとしてのみ存在。独立製品にはしない
├── Classification Research
├── Past Cases Search
├── Tariff Lookup
├── Import / Export Requirements
├── Origin / FTA
├── Document Assistant
└── Trade Workflow
```

HS Classifierの責務は、**商品についてユーザーから情報を取得し、必要に応じて不足情報
を質問し、HSコード候補を提示すること**だけです。関税計算・原産地判定・規制判定などは
意図的に混ぜていません。

## Architecture

```
Preact SPA (apps/web)
     │  fetch (JSON)
     ▼
Serverless API (apps/api, Cloudflare Workers)
     │
     ├── POST /api/classify ──► @hs-trade/classifier ──► HS dataset (data/hs/*.json)
     │                                │
     │                                └──► LLM (Anthropic, ANTHROPIC_API_KEY があるときのみ)
     │                                     未設定時は決定的なヒューリスティック評価にフォールバック
     │
     └── POST /api/feedback ──► KV (任意) or console.log
```

```
hs-trade/
├── data/hs/                 静的HSデータセット(chapters/headings/subheadings + version/source)
├── packages/classifier/     Classification Logic 本体。UIからもWorkerからも独立してテスト可能
│   └── src/
│       ├── types.ts         Input JSON / Output JSON の型定義
│       ├── productFacts.ts  正規化 & 情報源の優先解決(推測と事実を混ぜない)
│       ├── categories/      商品カテゴリー別の必須質問定義(textile/food/chemical/machinery)
│       ├── candidates.ts    データセットからの候補検索(キーワードマッチ、埋め込み/DBなし)
│       ├── llm/             LLMインターフェース + ヒューリスティック実装 + Anthropic実装
│       ├── missingFacts.ts  不足情報の判定
│       ├── feedback.ts      Feedbackの型定義(Web/API共有)
│       └── classify.ts      パイプライン全体のオーケストレーション
├── apps/api/                Cloudflare Worker(APIキーはここでのみ保持)
├── apps/web/                Preact + TypeScript + Vite + TanStack Router のSPA
└── tests/cases/             Fixtureベースのテストケース(food/textile/machinery/chemical/ambiguous)
```

**重要な設計方針:** UIコンポーネント内部にClassification Logicは書きません。
`packages/classifier` は

```
Input JSON (ClassificationRequest)
    ↓
Classifier
    ↓
Output JSON (ClassificationResult)
```

という明確な境界を持つ、フレームワーク非依存のTypeScriptです。これにより、将来
バックエンドをGoへ移植する際もロジックの移植対象が明確になります(このリポジトリ
ではGoへの移植自体は行いません)。

LLMは**候補コードを自由生成しません**。まずデータセットからキーワードマッチで候補
を絞り込み、LLM(またはフォールバックのヒューリスティック)はその候補リストの中から
ランク付けと理由説明を行うだけです。候補リストにないコードをLLMが返しても、
`classify()` 内で無視されます。

## Local Development

前提: Node.js 20+、npm。

```bash
npm install

# 1) API (Cloudflare Workers、Miniflareでローカル実行。APIキー無しでも動作)
npm run dev:api      # http://localhost:8787

# 2) Web (別ターミナルで)
cp apps/web/.env.example apps/web/.env
npm run dev:web      # http://localhost:5173
```

実際のLLMで分類したい場合は、`apps/api` で以下を設定してください(任意)。

```bash
cd apps/api
npx wrangler secret put ANTHROPIC_API_KEY
```

未設定の場合は、決定的なキーワードベースのヒューリスティック評価にフォールバック
するため、**APIキーが無くてもアプリ全体を試せます**(テストが常にこのモードで
動いているのはこのためです)。

Feedbackを永続化したい場合は、Cloudflare KV Namespaceを作成し
`apps/api/wrangler.toml` のコメントを外してください。未設定時はWorkerの
コンソールログに出力されるだけです。

### テストの実行

```bash
npm test
npm run typecheck
```

## Classification Flow

```
商品情報入力(商品名・商品説明は必須。画像/輸出入国は任意)
     ↓
商品情報の正規化(ProductFacts)
     ↓
商品カテゴリーの判定(textile / food / chemical / machinery / unknown)
     ↓
カテゴリーに必要な情報が揃っているか判定
 ┌───────────┴───────────┐
 不足あり                  揃っている
 │(NEEDS_INFORMATION)      │
 追加質問を提示              HSデータセットから候補を検索
 │                          │
 └───────┬──────────────────┘
         ↓
   LLM(またはヒューリスティック)が候補をランク付け・説明
         ↓
CLASSIFIED / NEEDS_REVIEW / NEEDS_INFORMATION を提示
         ↓
ユーザーが「正しい / 間違っている / 分からない」を回答
         ↓
(間違っている場合)正しいHSコード・理由・不足情報を入力
         ↓
Feedback保存
         ↓
(任意)ヒアリング参加のためのEmail登録
```

固定20項目フォームは使いません。商品カテゴリーによって聞かれる質問は変わります
(例: Textileなら素材構成比、Foodなら原材料と加工方法、Chemicalなら化学名とCAS番号、
Machineryなら機能と完成品/部品の別)。

### 推測と事実を混ぜない

画像やAIの推定だけでは確定できない情報(例: 繊維製品の素材構成、食品の原材料、
化学品の化学名)は、必ず `USER_DECLARED`(ユーザー申告)の情報源がない限り
「不足情報」として扱われます。画像推定・AI推定・ユーザー申告が競合する場合は、
ユーザー申告を優先し、その旨をResultの `notes` に記録します。詳細は
`packages/classifier/src/productFacts.ts` と `missingFacts.ts` を参照してください。

## Feedback / Contribution

結果画面の下部に、以下のフィードバックUIがあります。

- この分類についてどう思いますか?(正しい / 間違っている / 判断できない)
- 「間違っている」の場合: 正しいと思うHSコード・理由・不足していた商品情報
- 任意: あなたの立場(通関業務 / 通関士 / 貿易実務 / 輸出入事業者 / 越境EC / その他)
- 任意: ヒアリング参加のためのEmail登録(フィードバック送信**後**にのみ表示され、
  分類の利用条件にはなりません)

ログインは一切要求しません。

コントリビューションを歓迎します。特に、

- 実務者としての利用フィードバック(Issueで歓迎します)
- `data/hs/*.json` の拡充(HS品目・キーワードの追加)
- `tests/cases/**` への新しいテストケースの追加

は大きな価値があります。プルリクエストを送る前に `npm test` を通してください。

**このP0が完成したら、新しいTrade Toolの実装は行いません。** まずは実務者からの
フィードバックを集めることを優先してください。

## Dataset source

`data/hs/*.json` は、WCO Harmonized System 2022 Editionを参考に**手作業で作成した
デモ用の限定サブセット**です(`data/hs/meta.json` に `version` / `source` を記載)。
Textile(61/62類の一部)、Food(09/21類の一部)、Chemical(29類の一部)、
Machinery(85類の一部)のみをカバーしています。

**実務・商用利用のための完全なHSデータではありません。** 正確な分類には、
公式の関税率表・WCO資料・各国税関の公式情報を必ず参照してください。

## Limitations

- データセットはごく一部の章・品目のみをカバーしています(網羅性なし)。
- 画像URLの入力は可能ですが、画像に対する自動AI解析(IMAGE_INFERRED factの自動生成)
  は本P0では実装していません。型としては用意されていますが、実際に画像を解析して
  factを生成するのは将来の課題です。
- LLMの評価はデータセットから取得した候補の中からのランク付けに限定されますが、
  データセット自体が小さいため、実務で使えるレベルの候補網羅性はありません。
- Feedbackの永続化はCloudflare KVを設定した場合のみで、デフォルトはログ出力のみです。
- 関税率・輸入消費税・VAT・EPA/FTA・原産地判定・輸入/輸出規制・許認可・貿易書類生成・
  物流・landed costは意図的にスコープ外です。
- 認証・ワークスペース・課金・CSV一括分類などの機能はありません(意図的な制約です)。
