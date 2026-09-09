import type { FactSource, ProductCategory } from "../types.js"

export interface RequiredFactDefinition {
  key: string
  question: string
  reason: string
  /**
   * Sources that count as "this fact is known" for the purpose of deciding
   * whether we can proceed to classification. Deliberately excludes weak
   * inference sources for facts that materially change the HS code (e.g.
   * fiber composition) — see design doc section 11.
   */
  acceptableSources: FactSource[]
}

export interface CategoryDefinition {
  id: ProductCategory
  /** Substrings (JA/EN, lowercase) used to detect this category from free text. */
  matchKeywords: string[]
  /** HS chapter codes this category's candidates are searched within. */
  chapterCodes: string[]
  requiredFacts: RequiredFactDefinition[]
}
