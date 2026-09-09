import type { HsDataset, HsSubheading, ProductCategory, ProductFacts } from "./types.js"
import { buildSearchText } from "./productFacts.js"
import { getCategoryDefinition } from "./categories/index.js"

export interface CandidateMatch {
  code: string
  descriptionJa: string
  descriptionEn: string
  headingCode: string
  score: number
  matchedKeywords: string[]
}

const MAX_CANDIDATES = 3

/**
 * Finds plausible HS subheadings for a product by scoring keyword overlap
 * between the product's text/facts and each subheading's (and its parent
 * heading's) keyword list — all drawn from the static dataset.
 *
 * Deliberately NOT an LLM call: this is the "retrieve real candidates from
 * the dataset first" half of the pipeline described in the design doc,
 * so the LLM only ever ranks/explains codes that actually exist.
 */
export function findCandidates(
  dataset: HsDataset,
  productFacts: ProductFacts,
  category: ProductCategory
): CandidateMatch[] {
  const categoryDef = getCategoryDefinition(category)
  if (!categoryDef) return []

  const text = buildSearchText(productFacts)
  const headingByCode = new Map(dataset.headings.map((h) => [h.code, h]))
  const relevantSubheadings = dataset.subheadings.filter((sub) => {
    const heading = headingByCode.get(sub.headingCode)
    return heading !== undefined && categoryDef.chapterCodes.includes(heading.chapterCode)
  })

  const scored = relevantSubheadings
    .map((sub) => scoreSubheading(sub, headingByCode.get(sub.headingCode)?.keywords ?? [], text))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, MAX_CANDIDATES)
}

function scoreSubheading(
  sub: HsSubheading,
  headingKeywords: string[],
  text: string
): CandidateMatch {
  const matchedKeywords: string[] = []

  for (const keyword of sub.keywords) {
    if (text.includes(keyword.toLowerCase())) matchedKeywords.push(keyword)
  }
  // Heading-level keywords count too, but at lower weight, so a specific
  // subheading match always outranks a generic heading-only match.
  let headingScore = 0
  for (const keyword of headingKeywords) {
    if (text.includes(keyword.toLowerCase())) headingScore += 1
  }

  return {
    code: sub.code,
    descriptionJa: sub.descriptionJa,
    descriptionEn: sub.descriptionEn,
    headingCode: sub.headingCode,
    score: matchedKeywords.length * 2 + headingScore * 0.5,
    matchedKeywords
  }
}
