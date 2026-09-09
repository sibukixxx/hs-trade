import type {
  ClassificationCandidate,
  ClassificationRequest,
  ClassificationResult,
  HsDataset,
  ProductFacts
} from "./types.js"
import { normalizeToProductFacts, resolveFacts } from "./productFacts.js"
import { detectCategory, getCategoryDefinition } from "./categories/index.js"
import { findMissingFacts } from "./missingFacts.js"
import { findCandidates } from "./candidates.js"
import type { ClassifierLlm } from "./llm/types.js"
import { HeuristicLlm } from "./llm/heuristicLlm.js"
import { hsDataset as defaultDataset } from "./dataset.js"

export interface ClassifyDeps {
  dataset?: HsDataset
  llm?: ClassifierLlm
}

/** Below this, we tell the user the result needs a human's review instead of presenting it as settled. */
const CONFIDENCE_THRESHOLD = 0.3

/**
 * The whole HS Classifier pipeline, from raw request to Output JSON:
 *
 *   1. Normalize input -> ProductFacts
 *   2. Detect product category (rule-based)
 *   3. Check required facts for that category; ask questions if missing
 *   4. Retrieve real HS candidates from the static dataset
 *   5. Have an LLM rank/explain those candidates (never invent new codes)
 *   6. Return CLASSIFIED / NEEDS_INFORMATION / NEEDS_REVIEW
 */
export async function classify(
  request: ClassificationRequest,
  deps: ClassifyDeps = {}
): Promise<ClassificationResult> {
  const dataset = deps.dataset ?? defaultDataset
  const llm = deps.llm ?? new HeuristicLlm()

  const productFacts = normalizeToProductFacts(request)
  const category = detectCategory(productFacts)

  if (category === "unknown") {
    return {
      status: "NEEDS_INFORMATION",
      category,
      productFacts,
      questions: [
        {
          key: "product_category_hint",
          question:
            "商品の主な材質・原材料・用途のいずれかを教えてください(例: 布製の衣類、食品、化学薬品、機械など)。",
          reason: "商品のカテゴリーが判断できず、分類に必要な質問を決められませんでした。"
        }
      ],
      datasetVersion: dataset.version
    }
  }

  const categoryDef = getCategoryDefinition(category)
  if (!categoryDef) {
    return {
      status: "NEEDS_REVIEW",
      category,
      productFacts,
      notes: [`Category "${category}" has no definition configured.`],
      datasetVersion: dataset.version
    }
  }

  const missingQuestions = findMissingFacts(categoryDef, productFacts)
  if (missingQuestions.length > 0) {
    return {
      status: "NEEDS_INFORMATION",
      category,
      productFacts,
      questions: missingQuestions,
      datasetVersion: dataset.version
    }
  }

  const notes = collectConflictNotes(productFacts)

  const candidateMatches = findCandidates(dataset, productFacts, category)
  if (candidateMatches.length === 0) {
    return {
      status: "NEEDS_REVIEW",
      category,
      productFacts,
      notes: [...notes, "データセット内に一致するHS候補が見つかりませんでした。"],
      datasetVersion: dataset.version
    }
  }

  const evaluations = await llm.evaluate({
    productFacts,
    category,
    candidates: candidateMatches.map((match) => ({
      code: match.code,
      descriptionJa: match.descriptionJa,
      descriptionEn: match.descriptionEn,
      matchedKeywords: match.matchedKeywords
    }))
  })

  const validCodes = new Set(candidateMatches.map((match) => match.code))
  const descriptionByCode = new Map(
    candidateMatches.map((match) => [match.code, match.descriptionJa])
  )
  const validEvaluations = evaluations
    .filter((evaluation) => validCodes.has(evaluation.code))
    .sort((a, b) => a.rank - b.rank)

  if (validEvaluations.length === 0) {
    return {
      status: "NEEDS_REVIEW",
      category,
      productFacts,
      notes: [...notes, "LLMの評価結果が候補データセットと一致しませんでした。"],
      datasetVersion: dataset.version
    }
  }

  const candidates: ClassificationCandidate[] = validEvaluations.map((evaluation, index) => ({
    code: evaluation.code,
    rank: index + 1,
    reason: evaluation.reason,
    confidence: evaluation.confidence,
    headingDescription: descriptionByCode.get(evaluation.code)
  }))

  const topConfidence = candidates[0]?.confidence ?? 0
  if (topConfidence < CONFIDENCE_THRESHOLD) {
    return {
      status: "NEEDS_REVIEW",
      category,
      productFacts,
      candidates,
      notes: [...notes, "分類結果の信頼度が低いため、専門家によるレビューを推奨します。"],
      datasetVersion: dataset.version
    }
  }

  return {
    status: "CLASSIFIED",
    category,
    productFacts,
    candidates,
    notes: notes.length > 0 ? notes : undefined,
    datasetVersion: dataset.version
  }
}

function collectConflictNotes(productFacts: ProductFacts): string[] {
  const resolved = resolveFacts(productFacts.facts)
  const notes: string[] = []
  for (const fact of resolved.values()) {
    if (fact.conflicting) {
      notes.push(
        `「${fact.key}」について情報源間で内容が一致していません。ユーザー申告の値を優先して分類しています。`
      )
    }
  }
  return notes
}
