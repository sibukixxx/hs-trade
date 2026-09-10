# HS Classifier P0 — Validation Results

Generated: 2026-09-09T06:37:09.178Z

This is **not** a pass/fail benchmark of classification accuracy. It's a record of running the current classifier against real-ish products — some easy, some deliberately ambiguous — and tracing *why* each result was right, wrong, or appropriately uncertain. See `eval/README.md` for methodology.

## Summary

| Case | Category | Expected | Actual | Critical? | Failure reasons |
|---|---|---|---|---|---|
| `apparel-cotton-tshirt` | apparel | CLASSIFIED | CLASSIFIED |  | — |
| `apparel-poly-cotton-blend-shirt` | apparel | CLASSIFIED | CLASSIFIED |  | 分類規則の解釈ミス (classification reasoning) |
| `cosmetics-lip-balm` | cosmetics | CLASSIFIED | NEEDS_INFORMATION |  | HSデータ不足 (candidate retrieval) |
| `cosmetics-shampoo` | cosmetics | NEEDS_INFORMATION | NEEDS_INFORMATION |  | 分類規則の解釈ミス (classification reasoning); HSデータ不足 (candidate retrieval) |
| `electronics-usb-cable` | electronics | CLASSIFIED | NEEDS_INFORMATION |  | HSデータ不足 (candidate retrieval) |
| `electronics-usb-charger` | electronics | CLASSIFIED | NEEDS_INFORMATION |  | HSデータ不足 (candidate retrieval) |
| `footwear-canvas-sneakers` | footwear | CLASSIFIED | NEEDS_INFORMATION |  | 質問不足 (missing-information detection); HSデータ不足 (candidate retrieval) |
| `footwear-leather-ankle-boots` | footwear | CLASSIFIED | NEEDS_INFORMATION |  | 質問不足 (missing-information detection); HSデータ不足 (candidate retrieval) |
| `machinery-parts-ball-bearing` | machinery_parts | CLASSIFIED | NEEDS_REVIEW |  | HSデータ不足 (candidate retrieval) |
| `machinery-parts-motor-brush` | machinery_parts | NEEDS_REVIEW | NEEDS_REVIEW |  | — |
| `processed-food-chocolate-bar` | processed_food | CLASSIFIED | NEEDS_INFORMATION |  | 分類規則の解釈ミス (classification reasoning); 質問不足 (missing-information detection); HSデータ不足 (candidate retrieval) |
| `processed-food-instant-noodles` | processed_food | CLASSIFIED | NEEDS_INFORMATION |  | 分類規則の解釈ミス (classification reasoning); 質問不足 (missing-information detection); HSデータ不足 (candidate retrieval) |
| `tea-green-tea-leaf` | tea | CLASSIFIED | CLASSIFIED |  | — |
| `tea-instant-extract` | tea | CLASSIFIED | CLASSIFIED |  | — |
| `tea-matcha-powder` | tea | CLASSIFIED | CLASSIFIED |  | — |

**Overconfident classifications (critical failures): 0 / 15**

## Weakness report (5 dimensions)

- **product facts**: 0 issue(s)
- **missing-information detection**: 4 issue(s) — `footwear-canvas-sneakers`, `footwear-leather-ankle-boots`, `processed-food-chocolate-bar`, `processed-food-instant-noodles`
- **candidate retrieval**: 9 issue(s) — `cosmetics-lip-balm`, `cosmetics-shampoo`, `electronics-usb-cable`, `electronics-usb-charger`, `footwear-canvas-sneakers`, `footwear-leather-ankle-boots`, `machinery-parts-ball-bearing`, `processed-food-chocolate-bar`, `processed-food-instant-noodles`
- **classification reasoning**: 4 issue(s) — `apparel-poly-cotton-blend-shirt`, `cosmetics-shampoo`, `processed-food-chocolate-bar`, `processed-food-instant-noodles`
- **evidence**: 0 issue(s)

## Per-case detail

### `apparel-cotton-tshirt` — 綿100%の半袖Tシャツ (apparel)

Baseline easy apparel case, mirroring the definitional-nomenclature confidence of the tea control case.

- **Expected:** CLASSIFIED, HS 6109.10 (subheading, basis: HS_NOMENCLATURE_TEXT)
- **Source/reference:** HS heading 6109 ('T-shirts, singlets and other vests, knitted or crocheted'); subheading 6109.10 ('of cotton') — direct nomenclature text, not a case-specific ruling.
- **Actual final status:** CLASSIFIED, candidates: 6109.10 (55%), 6205.20 (55%), 6109.90 (40%)
- **Rounds run:** 2

| Check | Result | Detail |
|---|---|---|
| status_as_expected | ✅ pass | expected CLASSIFIED, got CLASSIFIED |
| no_overconfident_classification | ✅ pass | ok |
| category_as_expected | ✅ pass | routed to textile as expected |
| expected_questions_asked | ✅ pass | asked all of: fiber_composition, knit_or_woven, garment_type |
| expected_candidate_found | ✅ pass | found 6109.10 among candidates: 6109.10, 6205.20, 6109.90 |
| top_candidate_matches_expected | ✅ pass | Recommended candidate (6109.10) matches expected 6109.10 |
| facts_roundtrip | ✅ pass | all declared answers appear as USER_DECLARED facts in the final result |
| evidence_present | ✅ pass | all candidates/questions carry reasons; dataset version+source present |

**Author's notes (written before grading):** Control case. Expected to pass cleanly, same role as tea-green-tea-leaf.

<details><summary>Full round-by-round trace</summary>

Round 1: status=`NEEDS_INFORMATION`, category=`textile`
  questions: fiber_composition, knit_or_woven, garment_type
Round 2: status=`CLASSIFIED`, category=`textile`
  candidates: 6109.10@55%, 6205.20@55%, 6109.90@40%

</details>

### `apparel-poly-cotton-blend-shirt` — ポリエステル65%・綿35%混紡のワイシャツ (apparel)

Tests the real HS 'chief weight' rule for fiber blends (Section XI, Note 2: a mixture of textile materials is classified as if wholly of the material that predominates by weight). Here polyester (65%) predominates, so the correct answer is the man-made-fibre subheading, not the cotton one — even though the fabric contains cotton too. The classifier only accepts a fiber_composition ANSWER as 'present', with no parsing of percentages at all, so it has no way to actually apply this rule.

- **Expected:** CLASSIFIED, HS 6205.30 (subheading, basis: HS_NOMENCLATURE_TEXT)
- **Source/reference:** HS Section XI, Note 2(A) (General Interpretive Rule for mixed textile materials): classify as consisting wholly of the textile material which predominates by weight. Polyester at 65% predominates, so this is 'of man-made fibres' — heading 6205, subheading 6205.30 — not 6205.20 (of cotton).
- **Actual final status:** CLASSIFIED, candidates: 6205.20 (55%), 6205.30 (55%), 6109.10 (55%)
- **Rounds run:** 2

| Check | Result | Detail |
|---|---|---|
| status_as_expected | ✅ pass | expected CLASSIFIED, got CLASSIFIED |
| no_overconfident_classification | ✅ pass | ok |
| category_as_expected | ✅ pass | routed to textile as expected |
| expected_questions_asked | ✅ pass | asked all of: fiber_composition, knit_or_woven, garment_type |
| expected_candidate_found | ✅ pass | found 6205.30 among candidates: 6205.20, 6205.30, 6109.10 |
| top_candidate_matches_expected | ❌ fail | expected 6205.30 was retrieved but Recommended candidate was 6205.20 instead — right answer present, wrong one surfaced as primary |
| facts_roundtrip | ✅ pass | all declared answers appear as USER_DECLARED facts in the final result |
| evidence_present | ✅ pass | all candidates/questions carry reasons; dataset version+source present |

**Auto-diagnosed failure reasons:** 分類規則の解釈ミス (classification reasoning)

**Author's notes (written before grading):** Prediction before running: our candidate scorer just counts whether the literal words '綿' and 'ポリエステル' appear in the text — both do, once each, regardless of the attached percentages. So 6205.20 and 6205.30 will very likely score identically, and whichever wins will be an accident of dataset file ordering (6205.20 is listed first in subheadings.json), not an application of the chief-weight rule. If the tool's Recommended candidate is 6205.20 here, that's not a coincidence that happens to be safe — it would be equally wrong (and equally confident) if I'd written 'cotton 65% / polyester 35%' instead, since the code never actually reads the percentages. That is the finding, independent of which single subheading happens to come out on top this run.

<details><summary>Full round-by-round trace</summary>

Round 1: status=`NEEDS_INFORMATION`, category=`textile`
  questions: fiber_composition, knit_or_woven, garment_type
Round 2: status=`CLASSIFIED`, category=`textile`
  candidates: 6205.20@55%, 6205.30@55%, 6109.10@55%

</details>

### `cosmetics-lip-balm` — 無香料リップクリーム(非医薬品) (cosmetics)

Cosmetics has no category definition. Deliberately phrased with no medicinal claims, since a medicated lip balm would push classification a different way (HS 3306) — testing plain cosmetic-use lip balm.

- **Expected:** CLASSIFIED, HS 3304.10 (subheading, basis: RESEARCHED)
- **Source/reference:** US CBP guidance ('Beauty and Skin Care Products of Heading 3304') and multiple classification guides confirm non-medicated cosmetic lip balm is classified under 3304.10 (lip make-up preparations), the same subheading as lipstick — medicated lip balm with SPF/therapeutic claims would instead fall under 3306.20.
- **Actual final status:** NEEDS_INFORMATION
- **Rounds run:** 1

| Check | Result | Detail |
|---|---|---|
| status_as_expected | ❌ fail | expected CLASSIFIED, got NEEDS_INFORMATION |
| no_overconfident_classification | ✅ pass | ok |
| expected_questions_asked | ✅ pass | n/a — no expected questions declared |
| expected_candidate_found | ❌ fail | expected 3304.10, candidates were: (none) |
| facts_roundtrip | ✅ pass | all declared answers appear as USER_DECLARED facts in the final result |
| evidence_present | ✅ pass | all candidates/questions carry reasons; dataset version+source present |

**Auto-diagnosed failure reasons:** HSデータ不足 (candidate retrieval)

**Author's notes (written before grading):** Prediction before running: none of chemical/textile/food/machinery matchKeywords fire on this description, so category='unknown' and the generic clarifying question is asked instead of anything cosmetics-relevant. Chapter 33 is entirely absent from data/hs/*.json, so even a correct category label wouldn't help without dataset expansion.

<details><summary>Full round-by-round trace</summary>

Round 1: status=`NEEDS_INFORMATION`, category=`chemical`
  questions: chemical_name, is_mixture

</details>

### `cosmetics-shampoo` — アミノ酸系シャンプー (cosmetics)

This case was written with completely ordinary marketing Japanese ('アミノ酸系' = 'amino-acid-based', a routine way to describe a mild shampoo) — not to trick the tool. It exposes a real bug: the chemical category's match keyword list includes the single character '酸' ('acid'), which is a substring of '酸' anywhere, including inside 'アミノ酸' ('amino acid'). That mis-routes an ordinary cosmetic product into the chemical category and triggers nonsensical questions (chemical name / CAS number) for a shampoo bottle.

- **Expected:** NEEDS_INFORMATION, HS 3305.10 (subheading, basis: RESEARCHED)
- **Source/reference:** HS heading 3305 ('Preparations for use on the hair'), subheading 3305.10 ('Shampoos') — confirmed by taricsupport.com nomenclature and multiple classification guides as the standard code for hair shampoo, including amino-acid-based formulations.
- **Actual final status:** NEEDS_INFORMATION
- **Rounds run:** 1

| Check | Result | Detail |
|---|---|---|
| status_as_expected | ✅ pass | expected NEEDS_INFORMATION, got NEEDS_INFORMATION |
| no_overconfident_classification | ✅ pass | ok |
| category_as_expected | ❌ fail | expected category unknown, routed to chemical instead |
| expected_questions_asked | ✅ pass | n/a — no expected questions declared |
| expected_candidate_found | ❌ fail | expected 3305.10, candidates were: (none) |
| facts_roundtrip | ✅ pass | all declared answers appear as USER_DECLARED facts in the final result |
| evidence_present | ✅ pass | all candidates/questions carry reasons; dataset version+source present |

**Auto-diagnosed failure reasons:** 分類規則の解釈ミス (classification reasoning); HSデータ不足 (candidate retrieval)

**Author's notes (written before grading):** Prediction before running: since 'cosmetics' isn't a real category in this classifier (expectedCategory here states what SHOULD happen, not what the code can currently produce), the actual outcome is expected to be worse than a plain 'unknown' case — the single-character keyword '酸' in the chemical category's matchKeywords list will match inside '酸' as a substring of the word 'アミノ酸' ('amino acid'), silently routing a shampoo into the chemical-product question flow ('化学名を教えてください' / CAS number). That's a materially worse failure mode than 'doesn't know this product' — it's confidently asking the wrong questions for the wrong reason. This is the most important single finding to fix before adding more coverage: keyword-substring category detection needs word-boundary or multi-character-minimum matching, not raw substring checks on 1-character strings.

<details><summary>Full round-by-round trace</summary>

Round 1: status=`NEEDS_INFORMATION`, category=`chemical`
  questions: chemical_name, is_mixture

</details>

### `electronics-usb-cable` — USB-C to USB-A 充電・データ転送ケーブル (electronics)

Electronics has no category definition either. This case checks whether a very common, fully-specified consumer item at least gets engaged with sensibly.

- **Expected:** CLASSIFIED, HS 8544.42 (subheading, basis: RESEARCHED)
- **Source/reference:** HS heading 8544 covers insulated electric conductors/cables, whether or not fitted with connectors; multiple trade-compliance guides (freightamigo, brokergenius, ramcorpwire) converge on 8544.42 specifically for cables ≤1,000V fitted with connectors (USB, Ethernet, power cords) — the presence of terminated connectors is the key classification factor cited across sources.
- **Actual final status:** NEEDS_INFORMATION
- **Rounds run:** 1

| Check | Result | Detail |
|---|---|---|
| status_as_expected | ❌ fail | expected CLASSIFIED, got NEEDS_INFORMATION |
| no_overconfident_classification | ✅ pass | ok |
| expected_questions_asked | ✅ pass | n/a — no expected questions declared |
| expected_candidate_found | ❌ fail | expected 8544.42, candidates were: (none) |
| facts_roundtrip | ✅ pass | all declared answers appear as USER_DECLARED facts in the final result |
| evidence_present | ✅ pass | all candidates/questions carry reasons; dataset version+source present |

**Auto-diagnosed failure reasons:** HSデータ不足 (candidate retrieval)

**Author's notes (written before grading):** Prediction before running: 'machinery' is the only category with any electronics-adjacent keywords ('機器','電動','モーター'), none of which appear in a USB cable description, so this falls to category='unknown'. Even if it were somehow routed to machinery, chapter 85 in our dataset only models heading 8509 (domestic appliances), not 8544 — so this is a clean HS_DATA_GAP either way, not just a category-detection problem.

<details><summary>Full round-by-round trace</summary>

Round 1: status=`NEEDS_INFORMATION`, category=`unknown`
  questions: product_category_hint

</details>

### `electronics-usb-charger` — USB-C急速充電器(ACアダプター) (electronics)

A second electronics data point in a genuinely different heading (8504, not 8544) from the cable case, to see whether the classifier can even distinguish 'a cable' from 'a power adapter' when it can't reach either heading anyway.

- **Expected:** CLASSIFIED, HS 8504.40 (subheading, basis: RESEARCHED)
- **Source/reference:** HTS/HS heading 8504 ('Electrical static converters'), subheading 8504.40 — confirmed by multiple sources (dutiable.io 'USB-C Wall Charger / GaN Charger: 8504.40.20', freightamigo AC/DC adapter guides) as the standard classification for USB wall chargers and AC/DC power adapters.
- **Actual final status:** NEEDS_INFORMATION
- **Rounds run:** 1

| Check | Result | Detail |
|---|---|---|
| status_as_expected | ❌ fail | expected CLASSIFIED, got NEEDS_INFORMATION |
| no_overconfident_classification | ✅ pass | ok |
| expected_questions_asked | ✅ pass | n/a — no expected questions declared |
| expected_candidate_found | ❌ fail | expected 8504.40, candidates were: (none) |
| facts_roundtrip | ✅ pass | all declared answers appear as USER_DECLARED facts in the final result |
| evidence_present | ✅ pass | all candidates/questions carry reasons; dataset version+source present |

**Auto-diagnosed failure reasons:** HSデータ不足 (candidate retrieval)

**Author's notes (written before grading):** Prediction before running: same outcome as the cable case for the same structural reason — no electronics category, and chapter 85 in our dataset only covers heading 8509. This and the cable case together show the gap is at the chapter/heading level (85 is 'covered' in name only, via one narrow heading), not just a missing top-level category label.

<details><summary>Full round-by-round trace</summary>

Round 1: status=`NEEDS_INFORMATION`, category=`unknown`
  questions: product_category_hint

</details>

### `footwear-canvas-sneakers` — 帆布(キャンバス)アッパーのスニーカー (footwear)

Second footwear data point with a different chapter-64 outcome (textile upper instead of leather), to confirm the gap found in the boots case is systematic rather than a one-off.

- **Expected:** CLASSIFIED, HS 6404 (heading, basis: HS_NOMENCLATURE_TEXT)
- **Source/reference:** HS heading 6404 text: 'Footwear with outer soles of rubber, plastics, leather or composition leather and uppers of textile materials' — textile (canvas) upper + rubber outer sole matches this heading directly.
- **Actual final status:** NEEDS_INFORMATION
- **Rounds run:** 1

| Check | Result | Detail |
|---|---|---|
| status_as_expected | ❌ fail | expected CLASSIFIED, got NEEDS_INFORMATION |
| no_overconfident_classification | ✅ pass | ok |
| expected_questions_asked | ❌ fail | did not ask: upper_material, covers_ankle, primary_use |
| expected_candidate_found | ❌ fail | expected 6404, candidates were: (none) |
| facts_roundtrip | ✅ pass | all declared answers appear as USER_DECLARED facts in the final result |
| evidence_present | ✅ pass | all candidates/questions carry reasons; dataset version+source present |

**Auto-diagnosed failure reasons:** 質問不足 (missing-information detection); HSデータ不足 (candidate retrieval)

**Author's notes (written before grading):** Same prediction as the leather boots case: category='unknown', generic clarifying question only, chapter 64 absent from the dataset. Keeping both footwear cases lets the final report say 'footwear is a structural gap' instead of relying on a single example.

<details><summary>Full round-by-round trace</summary>

Round 1: status=`NEEDS_INFORMATION`, category=`unknown`
  questions: product_category_hint

</details>

### `footwear-leather-ankle-boots` — 本革製レディースアンクルブーツ (footwear)

Footwear has no category definition at all in this classifier yet. This case gives fully decisive information up front (upper material, sole material, ankle coverage) to see whether the gap is 'needs one more question' or 'cannot engage with this product family at all'.

- **Expected:** CLASSIFIED, HS 6403 (heading, basis: HS_NOMENCLATURE_TEXT)
- **Source/reference:** HS Chapter 64 structure (confirmed via CBP 'What Every Member of the Trade Community Should Know About: Footwear'): footwear is classified first by the material comprising the greatest external surface area of the upper, then by outer sole material. Leather upper + rubber/plastics/leather outer sole = heading 6403.
- **Actual final status:** NEEDS_INFORMATION
- **Rounds run:** 1

| Check | Result | Detail |
|---|---|---|
| status_as_expected | ❌ fail | expected CLASSIFIED, got NEEDS_INFORMATION |
| no_overconfident_classification | ✅ pass | ok |
| expected_questions_asked | ❌ fail | did not ask: upper_material, covers_ankle, primary_use |
| expected_candidate_found | ❌ fail | expected 6403, candidates were: (none) |
| facts_roundtrip | ✅ pass | all declared answers appear as USER_DECLARED facts in the final result |
| evidence_present | ✅ pass | all candidates/questions carry reasons; dataset version+source present |

**Auto-diagnosed failure reasons:** 質問不足 (missing-information detection); HSデータ不足 (candidate retrieval)

**Author's notes (written before grading):** Prediction before running: detectCategory() has no footwear keywords in any category's matchKeywords list, so this will fall through to category='unknown' and get the single generic clarifying question ('product_category_hint') instead of footwear-specific questions — even though the description already contains everything needed to classify. Expect a hard fail on expected_questions_asked and expected_candidate_found (chapter 64 isn't in data/hs/*.json at all), but NOT an overconfidence failure — the tool should at least not invent an answer.

<details><summary>Full round-by-round trace</summary>

Round 1: status=`NEEDS_INFORMATION`, category=`unknown`
  questions: product_category_hint

</details>

### `machinery-parts-ball-bearing` — 汎用ボールベアリング(深溝玉軸受) (machinery_parts)

A general-use part explicitly NOT dedicated to one machine. Unlike the footwear/electronics/cosmetics cases, this one DOES contain a machinery-category trigger word ('機械'), so category detection should actually work — but the category's chapter scope (only chapter 85) is wrong for this product (bearings are chapter 84), which should surface a different kind of gap.

- **Expected:** CLASSIFIED, HS 8482.10 (subheading, basis: RESEARCHED)
- **Source/reference:** HS heading 8482 ('Ball or roller bearings, and parts thereof'); subheading 8482.10 ('Ball bearings') — confirmed across multiple classification guides (flexport, dripcapital, freightamigo) as the standard code, independent of which machine the bearing eventually goes into (general-use parts like standard bearings are classified in their own heading rather than with the host machine).
- **Actual final status:** NEEDS_REVIEW
- **Rounds run:** 2

| Check | Result | Detail |
|---|---|---|
| status_as_expected | ❌ fail | expected CLASSIFIED, got NEEDS_REVIEW |
| no_overconfident_classification | ✅ pass | ok |
| category_as_expected | ✅ pass | routed to machinery as expected |
| expected_questions_asked | ✅ pass | asked all of: function, complete_or_part |
| expected_candidate_found | ❌ fail | expected 8482.10, candidates were: (none) |
| facts_roundtrip | ✅ pass | all declared answers appear as USER_DECLARED facts in the final result |
| evidence_present | ✅ pass | all candidates/questions carry reasons; dataset version+source present |

**Auto-diagnosed failure reasons:** HSデータ不足 (candidate retrieval)

**Author's notes (written before grading):** Prediction before running: category detection should correctly land on 'machinery' (the word '機械' appears three times) — a useful contrast to the footwear/electronics/cosmetics cases. But the machinery category's chapterCodes is hardcoded to ['85'] only, modeling exactly one heading (8509, domestic appliances). Bearings are chapter 84, which the classifier's machinery category doesn't search at all. Expect correct category + correct questions, but zero candidates (HS_DATA_GAP) — a cleaner, more isolated finding than the other gap cases, and evidence that 'machinery' as currently scoped really means 'one specific type of small appliance', not machinery/parts broadly.

<details><summary>Full round-by-round trace</summary>

Round 1: status=`NEEDS_INFORMATION`, category=`machinery`
  questions: function, complete_or_part
Round 2: status=`NEEDS_REVIEW`, category=`machinery`
  notes: データセット内に一致するHS候補が見つかりませんでした。

</details>

### `machinery-parts-motor-brush` — 電動モーター用カーボンブラシ(専用部品) (machinery_parts)

The opposite of the bearing case: a part explicitly DEDICATED to one machine type, echoing the original design brief's own example question ('専用部品ですか？'). This case intentionally does not claim a confident expected HS code — dedicated-part classification depends on rules (which heading the host machine falls under) that weren't verified against a specific citation here, so it's marked UNKNOWN rather than guessed. The point of this case is to check the question-asking behavior, not to grade a fabricated answer.

- **Expected:** NEEDS_REVIEW, HS: unknown/not graded
- **Source/reference:** Not verified against an official source in this validation round. Real HS practice treats dedicated parts differently from general-use parts (per Section XVI notes), sometimes classifying them with the host machine's heading rather than a standalone parts heading — but pinning the exact code needs a specific ruling or Explanatory Note lookup this round didn't do. Left UNKNOWN deliberately rather than guessed, per the validation brief's own instruction.
- **Actual final status:** NEEDS_REVIEW
- **Rounds run:** 2

| Check | Result | Detail |
|---|---|---|
| status_as_expected | ✅ pass | expected NEEDS_REVIEW, got NEEDS_REVIEW |
| no_overconfident_classification | ✅ pass | ok |
| category_as_expected | ✅ pass | routed to machinery as expected |
| expected_questions_asked | ✅ pass | asked all of: function, complete_or_part |
| expected_candidate_found | ✅ pass | n/a — expectedHs basis is UNKNOWN, not graded |
| facts_roundtrip | ✅ pass | all declared answers appear as USER_DECLARED facts in the final result |
| evidence_present | ✅ pass | all candidates/questions carry reasons; dataset version+source present |

**Author's notes (written before grading):** Prediction before running: category should correctly resolve to 'machinery' ('モーター' and '電動' both appear), and it should ask exactly the two questions the original design brief itself proposed for this scenario (function, complete/part) — this is expected to be one of the cleaner successes in the set, since machinery's required-fact questions map well onto genuinely dedicated-part products. Candidate search will still fail (chapter 85 in the dataset only models 8509 domestic appliances, not any parts heading), which is graded as NEEDS_REVIEW here, not as a wrong-HS failure, since no expected code is claimed.

<details><summary>Full round-by-round trace</summary>

Round 1: status=`NEEDS_INFORMATION`, category=`machinery`
  questions: function, complete_or_part
Round 2: status=`NEEDS_REVIEW`, category=`machinery`
  notes: データセット内に一致するHS候補が見つかりませんでした。

</details>

### `processed-food-chocolate-bar` — ミルクチョコレートバー(カカオ分40%) (processed_food)

Second processed-food data point in a different chapter (18, not 19), to see if the food-category gap found with instant noodles is systematic. Cocoa content is exactly the kind of ratio the classifier should ask about, per the original design brief's own food-category example.

- **Expected:** CLASSIFIED, HS 1806.32 (subheading, basis: RESEARCHED)
- **Source/reference:** HS heading 1806 ('Chocolate and other food preparations containing cocoa'); subheading 1806.32 covers chocolate in blocks/slabs/bars, not filled — confirmed by multiple classification guides (credlix, freightamigo, datamyne) as the standard code for a plain (unfilled) chocolate bar.
- **Actual final status:** NEEDS_INFORMATION
- **Rounds run:** 1

| Check | Result | Detail |
|---|---|---|
| status_as_expected | ❌ fail | expected CLASSIFIED, got NEEDS_INFORMATION |
| no_overconfident_classification | ✅ pass | ok |
| category_as_expected | ❌ fail | expected category food, routed to unknown instead |
| expected_questions_asked | ❌ fail | did not ask: ingredients, processing_method |
| expected_candidate_found | ❌ fail | expected 1806.32, candidates were: (none) |
| facts_roundtrip | ✅ pass | all declared answers appear as USER_DECLARED facts in the final result |
| evidence_present | ✅ pass | all candidates/questions carry reasons; dataset version+source present |

**Auto-diagnosed failure reasons:** 分類規則の解釈ミス (classification reasoning); 質問不足 (missing-information detection); HSデータ不足 (candidate retrieval)

**Author's notes (written before grading):** Prediction before running: same structural gap as instant noodles — 'チョコレート'/'お菓子' don't match any food matchKeyword, so category likely resolves to 'unknown', and chapter 18 doesn't exist in the dataset regardless. Keeping this alongside the noodle case turns one example into a pattern: the food category, as currently defined, effectively only recognizes tea/coffee-adjacent products, not food broadly.

<details><summary>Full round-by-round trace</summary>

Round 1: status=`NEEDS_INFORMATION`, category=`unknown`
  questions: product_category_hint

</details>

### `processed-food-instant-noodles` — 即席カップ麺 (processed_food)

Tests whether the 'food' category actually covers common processed food, and whether ingredient-ratio questions get asked, using natural product description language (not the word '食品' itself).

- **Expected:** CLASSIFIED, HS 1902.30 (subheading, basis: RESEARCHED)
- **Source/reference:** HS heading 1902 ('Pasta...'); subheading 1902.30 ('Other pasta') is the standard classification for instant/cup noodles per US CBP ruling NY 803646 ('tariff classification of instant noodle preparations from Thailand') and multiple trade guides — pre-cooked noodles with a seasoning packet still fall here.
- **Actual final status:** NEEDS_INFORMATION
- **Rounds run:** 1

| Check | Result | Detail |
|---|---|---|
| status_as_expected | ❌ fail | expected CLASSIFIED, got NEEDS_INFORMATION |
| no_overconfident_classification | ✅ pass | ok |
| category_as_expected | ❌ fail | expected category food, routed to unknown instead |
| expected_questions_asked | ❌ fail | did not ask: ingredients, processing_method |
| expected_candidate_found | ❌ fail | expected 1902.30, candidates were: (none) |
| facts_roundtrip | ✅ pass | all declared answers appear as USER_DECLARED facts in the final result |
| evidence_present | ✅ pass | all candidates/questions carry reasons; dataset version+source present |

**Auto-diagnosed failure reasons:** 分類規則の解釈ミス (classification reasoning); 質問不足 (missing-information detection); HSデータ不足 (candidate retrieval)

**Author's notes (written before grading):** Prediction before running: this is expected to fail even category detection. The 'food' category's matchKeywords are tea/beverage-centric (['茶','お茶','緑茶','紅茶','食品','食料品','飲料','エキス',...]) and none of them appear in ordinary instant-noodle phrasing — '食べられる' contains '食' but not the literal 2-character token '食品'. So this likely falls to category='unknown', on top of heading 1902 not existing in the dataset at all (chapters 09/21 only). Two independent gaps compounding on an extremely common, everyday food product is a meaningful finding about how narrow the current 'food' category really is.

<details><summary>Full round-by-round trace</summary>

Round 1: status=`NEEDS_INFORMATION`, category=`unknown`
  questions: product_category_hint

</details>

### `tea-green-tea-leaf` — 緑茶葉(リーフ、未加工) (tea)

Baseline easy case: plain green tea leaf with all decisive facts declared up front. Sanity-checks that the classifier doesn't over-ask when it already has enough.

- **Expected:** CLASSIFIED, HS 0902.10 (subheading, basis: HS_NOMENCLATURE_TEXT)
- **Source/reference:** HS heading 0902 ('Tea, whether or not flavoured'); subheading 0902.10 covers green tea (not fermented) in immediate packings of a content not exceeding 3 kg — this is the literal text of the WCO nomenclature, not a case-specific ruling.
- **Actual final status:** CLASSIFIED, candidates: 0902.10 (85%), 0902.20 (70%), 0902.30 (70%)
- **Rounds run:** 1

| Check | Result | Detail |
|---|---|---|
| status_as_expected | ✅ pass | expected CLASSIFIED, got CLASSIFIED |
| no_overconfident_classification | ✅ pass | ok |
| expected_questions_asked | ✅ pass | n/a — no expected questions declared |
| expected_candidate_found | ✅ pass | found 0902.10 among candidates: 0902.10, 0902.20, 0902.30 |
| top_candidate_matches_expected | ✅ pass | Recommended candidate (0902.10) matches expected 0902.10 |
| facts_roundtrip | ✅ pass | all declared answers appear as USER_DECLARED facts in the final result |
| evidence_present | ✅ pass | all candidates/questions carry reasons; dataset version+source present |

**Author's notes (written before grading):** This is the easy control case. If this fails, something regressed in the basic pipeline, not in a genuinely hard classification judgment.

<details><summary>Full round-by-round trace</summary>

Round 1: status=`CLASSIFIED`, category=`food`
  candidates: 0902.10@85%, 0902.20@70%, 0902.30@70%

</details>

### `tea-instant-extract` — インスタントティー(紅茶抽出物の粉末) (tea)

The mirror-image case of matcha: an actual tea EXTRACT reduced to powder, which the HS treats completely differently (heading 2101, not 0902) even though both are 'tea, as a powder'. Tests whether the tool can tell leaf/powder tea apart from extract/instant tea when the user's own words include the giveaway vocabulary.

- **Expected:** CLASSIFIED, HS 2101.20 (subheading, basis: RESEARCHED)
- **Source/reference:** US CBP ruling NY E87596 ('The tariff classification of Instant Tea from India') and HTS/HS heading 2101 text ('Extracts, essences and concentrates of coffee, tea or maté...') both confirm instant/soluble tea powder is 2101.20, not 0902.
- **Actual final status:** CLASSIFIED, candidates: 2101.20 (70%), 0902.30 (55%), 0902.40 (55%)
- **Rounds run:** 2

| Check | Result | Detail |
|---|---|---|
| status_as_expected | ✅ pass | expected CLASSIFIED, got CLASSIFIED |
| no_overconfident_classification | ✅ pass | ok |
| category_as_expected | ✅ pass | routed to food as expected |
| expected_questions_asked | ✅ pass | asked all of: ingredients, processing_method |
| expected_candidate_found | ✅ pass | found 2101.20 among candidates: 2101.20, 0902.30, 0902.40 |
| top_candidate_matches_expected | ✅ pass | Recommended candidate (2101.20) matches expected 2101.20 |
| facts_roundtrip | ✅ pass | all declared answers appear as USER_DECLARED facts in the final result |
| evidence_present | ✅ pass | all candidates/questions carry reasons; dataset version+source present |

**Author's notes (written before grading):** Prediction before running: unlike matcha, this description naturally contains '紅茶', '茶エキス' and 'インスタント' — all of which are literally in our dataset's 2101.20/heading-2101 keyword lists. Expect this one to actually work, in contrast to the matcha case. If it does, that's a useful positive data point showing the retrieval failure on matcha is about vocabulary coverage, not a fundamental inability to separate leaf tea from extract.

<details><summary>Full round-by-round trace</summary>

Round 1: status=`NEEDS_INFORMATION`, category=`food`
  questions: ingredients, processing_method
Round 2: status=`CLASSIFIED`, category=`food`
  candidates: 2101.20@70%, 0902.30@55%, 0902.40@55%

</details>

### `tea-matcha-powder` — 抹茶パウダー(碾茶を石臼で挽いたもの) (tea)

Probes whether processing state changes the answer, using natural (not keyword-stuffed) Japanese a real seller would write. Matcha is ground tea leaf, not an extract, so it should stay in HS 0902 like plain green tea — but the description never says '緑茶' or '不発酵' verbatim.

- **Expected:** CLASSIFIED, HS 0902.10 (subheading, basis: RESEARCHED)
- **Source/reference:** Matcha is ground green tea leaf, not a tea extract/essence/concentrate — multiple import-tariff references (e.g. tariffs.wove.com HTS 0902.10.10.15 'Certified Organic Matcha Green Tea Powder') classify matcha under 0902.10, explicitly distinguishing it from heading 2101 (tea extracts), which applies only to actual soluble/instant tea extracts.
- **Actual final status:** CLASSIFIED, candidates: 0902.10 (55%), 0902.30 (55%), 0902.20 (40%)
- **Rounds run:** 2

| Check | Result | Detail |
|---|---|---|
| status_as_expected | ✅ pass | expected CLASSIFIED, got CLASSIFIED |
| no_overconfident_classification | ✅ pass | ok |
| category_as_expected | ✅ pass | routed to food as expected |
| expected_questions_asked | ✅ pass | asked all of: ingredients, processing_method |
| expected_candidate_found | ✅ pass | found 0902.10 among candidates: 0902.10, 0902.30, 0902.20 |
| top_candidate_matches_expected | ✅ pass | Recommended candidate (0902.10) matches expected 0902.10 |
| facts_roundtrip | ✅ pass | all declared answers appear as USER_DECLARED facts in the final result |
| evidence_present | ✅ pass | all candidates/questions carry reasons; dataset version+source present |

**Author's notes (written before grading):** Prediction before running: category detection should work (plain '茶' keyword is common to 抹茶/碾茶). The real risk is candidate retrieval — our dataset's subheading keywords for 0902.10 are literally ['緑茶','不発酵','3kg以下','green tea','unfermented'], none of which appear in natural matcha phrasing (which says '抹茶'/'碾茶', not '緑茶'; and describes powder-making, not fermentation state). If retrieval comes back empty, that's a real, honest weakness — the demo dataset's keyword list only recognizes the exact vocabulary of its own descriptions, not domain synonyms a real user would actually type.

<details><summary>Full round-by-round trace</summary>

Round 1: status=`NEEDS_INFORMATION`, category=`food`
  questions: ingredients, processing_method
Round 2: status=`CLASSIFIED`, category=`food`
  candidates: 0902.10@55%, 0902.30@55%, 0902.20@40%

</details>
