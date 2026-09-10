import type { ClassificationRequest, ClassificationStatus, ProductCategory } from "../packages/classifier/src/types.js"

/**
 * Root-cause taxonomy for a validation failure, per the P0 validation
 * brief. This is deliberately the same six buckets used to reason about
 * *why* a classification was wrong, not just whether it was wrong:
 *
 *   商品情報不足        INSUFFICIENT_PRODUCT_INFO
 *   質問不足            INSUFFICIENT_QUESTIONS
 *   HSデータ不足        HS_DATA_GAP
 *   Retrieval失敗       RETRIEVAL_FAILURE
 *   分類規則の解釈ミス   RULE_INTERPRETATION_ERROR
 *   AIの推論ミス        AI_REASONING_ERROR
 */
export type FailureReason =
  | "INSUFFICIENT_PRODUCT_INFO"
  | "INSUFFICIENT_QUESTIONS"
  | "HS_DATA_GAP"
  | "RETRIEVAL_FAILURE"
  | "RULE_INTERPRETATION_ERROR"
  | "AI_REASONING_ERROR"

/**
 * How confident we actually are in `expectedHs`, so the eval never
 * pretends an AI guess is ground truth. "HS_NOMENCLATURE_TEXT" means the
 * heading/subheading is definitional (the legal text of the heading
 * itself settles it, e.g. tea is HS 0902 by the heading's own title) —
 * that's not a guess, it's reading the classification law. "RESEARCHED"
 * means a specific, cited external source was found (an official ruling,
 * customs guidance, or WCO explanatory-note summary via web research).
 * "UNKNOWN" means neither applies — the case exists to test behavior, not
 * to grade against a manufactured answer.
 */
export type ConfidenceBasis = "HS_NOMENCLATURE_TEXT" | "RESEARCHED" | "UNKNOWN"

export interface EvalExpectedHs {
  level: "heading" | "subheading" | "unknown"
  /** e.g. "0902" or "0902.10". Omit when level is "unknown". */
  code?: string
  basis: ConfidenceBasis
  /** Citation: nomenclature section, or a real source found via research. Never a fabricated URL. */
  reference: string
}

export type EvalCategory =
  | "tea"
  | "apparel"
  | "footwear"
  | "electronics"
  | "cosmetics"
  | "processed_food"
  | "machinery_parts"

export interface EvalCase {
  id: string
  category: EvalCategory
  productLabel: string
  /** What this specific case is designed to probe. */
  description: string
  initialRequest: ClassificationRequest
  /**
   * Answers to supply, keyed by fact key, if and when the classifier asks
   * for them. Omitting a key it asks for simulates "the user doesn't know
   * this" — used deliberately in some cases to test that the tool stays
   * at NEEDS_INFORMATION rather than guessing.
   */
  followUpAnswers?: Record<string, string>
  expectedStatus: ClassificationStatus
  /**
   * The category a competent classifier should route this product to.
   * Optional: omit when the product genuinely doesn't fit any category
   * this classifier defines yet (the honest answer is "unknown").
   */
  expectedCategory?: ProductCategory
  /** Fact keys a competent classifier should ask about for this product, if any. */
  expectedMissingQuestionKeys?: string[]
  expectedHs: EvalExpectedHs
  /** Author's own reasoning for this case — the "why" trail, written before running the eval. */
  notes: string
}
