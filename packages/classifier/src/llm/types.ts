import type { ProductCategory, ProductFacts } from "../types.js"

export interface LlmCandidateInput {
  code: string
  descriptionJa: string
  descriptionEn: string
  /** Dataset keywords that already matched this candidate's text, if known. */
  matchedKeywords?: string[]
}

export interface LlmEvaluation {
  code: string
  rank: number
  reason: string
  /** 0-1 */
  confidence: number
}

/**
 * The only thing an LLM is ever allowed to do in this pipeline: rank and
 * explain a fixed list of candidate codes retrieved from the HS dataset.
 * It must never invent codes that aren't in `candidates` — classify()
 * enforces this by discarding any returned code not in the input list.
 */
export interface ClassifierLlm {
  evaluate(params: {
    productFacts: ProductFacts
    category: ProductCategory
    candidates: LlmCandidateInput[]
  }): Promise<LlmEvaluation[]>
}
