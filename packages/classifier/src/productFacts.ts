import type {
  ClassificationRequest,
  FactSource,
  ProductFact,
  ProductFacts
} from "./types.js"

export function normalizeToProductFacts(
  request: ClassificationRequest
): ProductFacts {
  return {
    name: request.name.trim(),
    description: request.description?.trim() || undefined,
    origin: request.origin?.trim() || undefined,
    destination: request.destination?.trim() || undefined,
    images: request.images,
    facts: request.facts ?? []
  }
}

/**
 * When multiple sources report a value for the same fact key, this decides
 * which one "wins" for classification purposes. A human's own statement
 * always outranks a guess — see design doc section 11 ("推測と事実を混ぜない").
 */
const SOURCE_PRIORITY: Record<FactSource, number> = {
  USER_DECLARED: 3,
  TEXT_INFERRED: 2,
  IMAGE_INFERRED: 1,
  AI_INFERRED: 0
}

export interface ResolvedFact {
  key: string
  value: unknown
  source: FactSource
  /** true if other sources reported a different value for this key. */
  conflicting: boolean
}

/**
 * Collapses possibly-duplicate ProductFact entries (same key, different
 * sources) down to one resolved value per key, preferring higher-priority
 * sources. Also flags keys where sources disagree, so callers can surface
 * that instead of silently picking a winner.
 */
export function resolveFacts(facts: ProductFact[]): Map<string, ResolvedFact> {
  const byKey = new Map<string, ProductFact[]>()
  for (const fact of facts) {
    const existing = byKey.get(fact.key)
    if (existing) {
      existing.push(fact)
    } else {
      byKey.set(fact.key, [fact])
    }
  }

  const resolved = new Map<string, ResolvedFact>()
  for (const [key, entries] of byKey) {
    const winner = [...entries].sort(
      (a, b) => SOURCE_PRIORITY[b.source] - SOURCE_PRIORITY[a.source]
    )[0]
    if (!winner) continue
    const distinctValues = new Set(
      entries.map((entry) => JSON.stringify(entry.value))
    )
    resolved.set(key, {
      key,
      value: winner.value,
      source: winner.source,
      conflicting: distinctValues.size > 1
    })
  }
  return resolved
}

/** True if a value counts as "present" (non-empty) for requirement checks. */
export function hasValue(value: unknown): boolean {
  if (value === undefined || value === null) return false
  if (typeof value === "string") return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

/**
 * Builds the free-text blob used for keyword matching against the HS
 * dataset: product name/description plus every resolved fact value.
 */
export function buildSearchText(productFacts: ProductFacts): string {
  const resolved = resolveFacts(productFacts.facts)
  const factText = [...resolved.values()]
    .map((fact) => `${fact.key} ${String(fact.value)}`)
    .join(" ")
  return [productFacts.name, productFacts.description ?? "", factText]
    .join(" ")
    .toLowerCase()
}
