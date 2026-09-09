import type { ClassifierLlm, LlmEvaluation } from "./types.js"
import { buildSearchText } from "../productFacts.js"

/**
 * Deterministic, dependency-free fallback "LLM": scores each candidate by
 * how much of the product's text overlaps with the candidate's own
 * description text. Used in tests (so they don't need network access or
 * an API key) and as the runtime fallback when no real LLM is configured.
 *
 * It is deliberately conservative — it only ever ranks candidates already
 * retrieved from the dataset, exactly like a real LLM would be constrained
 * to in this pipeline.
 */
export class HeuristicLlm implements ClassifierLlm {
  async evaluate(params: Parameters<ClassifierLlm["evaluate"]>[0]): Promise<LlmEvaluation[]> {
    const text = buildSearchText(params.productFacts)

    const scored = params.candidates.map((candidate) => {
      const candidateTokens =
        candidate.matchedKeywords && candidate.matchedKeywords.length > 0
          ? candidate.matchedKeywords.map((k) => k.toLowerCase())
          : tokenize(`${candidate.descriptionJa} ${candidate.descriptionEn}`)
      // Substring containment rather than exact token equality: Japanese
      // text has no spaces, so "緑茶" needs to match inside "緑茶ティーバッグ".
      const overlap = candidateTokens.filter((token) => text.includes(token))
      const confidence = Math.min(0.95, 0.4 + overlap.length * 0.15)
      return { candidate, overlap, confidence }
    })

    scored.sort((a, b) => b.confidence - a.confidence)

    return scored.map((entry, index) => ({
      code: entry.candidate.code,
      rank: index + 1,
      confidence: entry.confidence,
      reason:
        entry.overlap.length > 0
          ? `製品情報中の「${entry.overlap.slice(0, 3).join("、")}」が${entry.candidate.code}(${entry.candidate.descriptionJa})の分類基準と一致すると判断しました。`
          : `他の候補と比べて${entry.candidate.code}(${entry.candidate.descriptionJa})が最も近いと判断しました。`
    }))
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s、,。()（）・/]+/)
    .filter((token) => token.length > 1)
}
