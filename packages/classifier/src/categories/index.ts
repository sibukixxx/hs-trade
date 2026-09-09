import type { ProductCategory, ProductFacts } from "../types.js"
import type { CategoryDefinition } from "./types.js"
import { textileCategory } from "./textile.js"
import { foodCategory } from "./food.js"
import { chemicalCategory } from "./chemical.js"
import { machineryCategory } from "./machinery.js"

export const categoryDefinitions: CategoryDefinition[] = [
  textileCategory,
  foodCategory,
  chemicalCategory,
  machineryCategory
]

export function getCategoryDefinition(
  category: ProductCategory
): CategoryDefinition | undefined {
  return categoryDefinitions.find((def) => def.id === category)
}

/**
 * Rule-based category detection from free text. Deliberately simple
 * (substring matching, no ML) so behavior is easy to reason about, test,
 * and eventually port to Go. Returns "unknown" when nothing matches
 * clearly, which routes to a clarifying question rather than a guess.
 */
export function detectCategory(productFacts: ProductFacts): ProductCategory {
  const text = [productFacts.name, productFacts.description ?? ""]
    .join(" ")
    .toLowerCase()

  let bestCategory: ProductCategory = "unknown"
  let bestScore = 0

  for (const def of categoryDefinitions) {
    const score = def.matchKeywords.reduce(
      (count, keyword) => (text.includes(keyword.toLowerCase()) ? count + 1 : count),
      0
    )
    if (score > bestScore) {
      bestScore = score
      bestCategory = def.id
    }
  }

  return bestScore > 0 ? bestCategory : "unknown"
}

export {
  textileCategory,
  foodCategory,
  chemicalCategory,
  machineryCategory
}
export type { CategoryDefinition, RequiredFactDefinition } from "./types.js"
