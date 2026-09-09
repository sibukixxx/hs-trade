import type { ClassificationQuestion, ProductFacts } from "./types.js"
import type { CategoryDefinition } from "./categories/types.js"
import { hasValue, resolveFacts } from "./productFacts.js"

/**
 * Checks a category's required facts against what's known, returning one
 * ClassificationQuestion per still-missing fact. A fact only "counts" if
 * it was reported by one of the sources the category definition accepts
 * for that key (see design doc section 11 — an AI guess never silently
 * satisfies a requirement that needs a human's word).
 */
export function findMissingFacts(
  category: CategoryDefinition,
  productFacts: ProductFacts
): ClassificationQuestion[] {
  const resolved = resolveFacts(productFacts.facts)

  const missing: ClassificationQuestion[] = []
  for (const required of category.requiredFacts) {
    const winner = resolved.get(required.key)
    const satisfied =
      winner !== undefined &&
      hasValue(winner.value) &&
      required.acceptableSources.includes(winner.source)

    if (satisfied) continue

    // Surface the best available (but not-yet-acceptable) inference as a hint.
    const inferredCandidate = productFacts.facts.find(
      (fact) => fact.key === required.key && hasValue(fact.value)
    )

    missing.push({
      key: required.key,
      question: required.question,
      reason: required.reason,
      inferredHint: inferredCandidate
        ? { value: inferredCandidate.value, source: inferredCandidate.source }
        : undefined
    })
  }

  return missing
}
