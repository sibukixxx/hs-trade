/**
 * Core domain types for the HS Classifier.
 *
 * These types are the JSON boundary described in the project's design docs:
 *
 *   Input JSON -> Classifier -> Output JSON
 *
 * Nothing in this file (or the rest of this package) may import from a UI
 * framework. This is what lets the same logic run in the browser (for
 * local experiments), a Cloudflare Worker, or — eventually — be ported to
 * Go without dragging any presentation concerns along with it.
 */

/** Where a single piece of product information came from. */
export type FactSource =
  | "USER_DECLARED"
  | "IMAGE_INFERRED"
  | "TEXT_INFERRED"
  | "AI_INFERRED"

export interface ProductImage {
  /** URL or data: URI. The classifier never assumes persistence guarantees. */
  url: string
  alt?: string
}

/** One normalized fact about a product, tagged with its provenance. */
export interface ProductFact {
  key: string
  value: unknown
  source: FactSource
  /** 0-1, only meaningful for inferred facts. */
  confidence?: number
}

/**
 * The normalized representation of "everything we currently know about this
 * product". This is intentionally the only shape Classification logic reads
 * from — raw form input gets normalized into this before anything else
 * happens (see normalizeToProductFacts).
 */
export interface ProductFacts {
  name: string
  description?: string
  origin?: string
  destination?: string
  images?: ProductImage[]
  facts: ProductFact[]
}

export type ProductCategory =
  | "textile"
  | "food"
  | "chemical"
  | "machinery"
  | "unknown"

export interface ClassificationQuestion {
  key: string
  question: string
  reason: string
  /**
   * If an AI/image/text inference already produced a candidate value for
   * this key, surface it as a hint — but never as a substitute for asking.
   * See "推測と事実を混ぜない" in the project design doc.
   */
  inferredHint?: {
    value: unknown
    source: FactSource
  }
}

export interface ClassificationCandidate {
  code: string
  rank: number
  reason: string
  /** 0-1 */
  confidence: number
  headingDescription?: string
}

export type ClassificationStatus =
  | "CLASSIFIED"
  | "NEEDS_INFORMATION"
  | "NEEDS_REVIEW"

export interface ClassificationResult {
  status: ClassificationStatus
  category: ProductCategory
  productFacts: ProductFacts
  candidates?: ClassificationCandidate[]
  questions?: ClassificationQuestion[]
  /** Human-readable notes, e.g. conflicting fact sources, dataset gaps. */
  notes?: string[]
  datasetVersion: string
}

/** Raw input coming from the UI (or any client) for one classification turn. */
export interface ClassificationRequest {
  name: string
  description?: string
  origin?: string
  destination?: string
  images?: ProductImage[]
  /** Answers to prior questions, plus any inferred facts, accumulate here. */
  facts?: ProductFact[]
}

// --- Static HS dataset -------------------------------------------------

export interface HsChapter {
  code: string
  descriptionJa: string
  descriptionEn: string
}

export interface HsHeading {
  code: string
  chapterCode: string
  descriptionJa: string
  descriptionEn: string
  keywords: string[]
}

export interface HsSubheading {
  code: string
  headingCode: string
  descriptionJa: string
  descriptionEn: string
  keywords: string[]
}

export interface HsDataset {
  version: string
  source: string
  chapters: HsChapter[]
  headings: HsHeading[]
  subheadings: HsSubheading[]
}
