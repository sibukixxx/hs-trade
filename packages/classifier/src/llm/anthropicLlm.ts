import type { ClassifierLlm, LlmEvaluation } from "./types.js"

export interface AnthropicLlmOptions {
  apiKey: string
  model?: string
  /** Overridable for tests; defaults to the real Anthropic Messages API. */
  fetchImpl?: typeof fetch
}

const DEFAULT_MODEL = "claude-sonnet-5"
const API_URL = "https://api.anthropic.com/v1/messages"

/**
 * Real LLM backend, used by the Worker API when ANTHROPIC_API_KEY is set.
 * The model is only ever asked to rank and justify a fixed candidate list
 * — it is explicitly told not to invent codes, and any code it returns
 * that isn't in the input list is dropped by classify() regardless.
 */
export class AnthropicLlm implements ClassifierLlm {
  constructor(private readonly options: AnthropicLlmOptions) {}

  async evaluate(params: Parameters<ClassifierLlm["evaluate"]>[0]): Promise<LlmEvaluation[]> {
    const doFetch = this.options.fetchImpl ?? fetch
    const prompt = buildPrompt(params)

    const response = await doFetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.options.apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: this.options.model ?? DEFAULT_MODEL,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }]
      })
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${await response.text()}`)
    }

    const data = (await response.json()) as {
      content: { type: string; text?: string }[]
    }
    const text = data.content.find((block) => block.type === "text")?.text ?? "[]"
    const parsed = parseEvaluations(text)

    const validCodes = new Set(params.candidates.map((c) => c.code))
    return parsed.filter((evaluation) => validCodes.has(evaluation.code))
  }
}

function buildPrompt(params: Parameters<ClassifierLlm["evaluate"]>[0]): string {
  const factLines = params.productFacts.facts
    .map((f) => `- ${f.key}: ${JSON.stringify(f.value)} (source: ${f.source})`)
    .join("\n")
  const candidateLines = params.candidates
    .map((c) => `- ${c.code}: ${c.descriptionJa} / ${c.descriptionEn}`)
    .join("\n")

  return `あなたはHSコード分類の補助を行うアシスタントです。
以下の商品情報と、事前にデータセットから絞り込まれたHSコード候補のみを使って、
各候補の妥当性を評価してください。

重要: 候補リストにないHSコードを新たに生成してはいけません。
必ず候補リストの中からランク付けし、理由を日本語で簡潔に説明してください。

商品名: ${params.productFacts.name}
商品説明: ${params.productFacts.description ?? "(なし)"}
カテゴリー: ${params.category}
既知の情報:
${factLines || "(なし)"}

候補:
${candidateLines}

次のJSON配列だけを出力してください(説明文やコードブロックは不要):
[{"code": "候補のコード", "rank": 1, "confidence": 0.0から1.0, "reason": "日本語の理由"}]`
}

function parseEvaluations(text: string): LlmEvaluation[] {
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    const raw = JSON.parse(jsonMatch ? jsonMatch[0] : text) as unknown[]
    return raw
      .filter(
        (item): item is Record<string, unknown> =>
          typeof item === "object" && item !== null
      )
      .map((item, index) => ({
        code: String(item.code ?? ""),
        rank: typeof item.rank === "number" ? item.rank : index + 1,
        confidence: typeof item.confidence === "number" ? item.confidence : 0.5,
        reason: typeof item.reason === "string" ? item.reason : ""
      }))
      .filter((evaluation) => evaluation.code.length > 0)
  } catch {
    return []
  }
}
