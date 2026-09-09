import { useState } from "preact/hooks"
import type { ClassificationResult, ProductFact } from "@hs-trade/classifier"
import { requestClassification } from "../api/client"
import { ProductInputForm, type ProductInputValues } from "../components/ProductInputForm"
import { QuestionForm } from "../components/QuestionForm"
import { ClassificationResultView } from "../components/ClassificationResultView"
import { FeedbackForm } from "../components/FeedbackForm"

type Phase = "input" | "loading" | "result" | "error"

export function ClassifyPage() {
  const [phase, setPhase] = useState<Phase>("input")
  const [baseInput, setBaseInput] = useState<ProductInputValues | null>(null)
  const [facts, setFacts] = useState<ProductFact[]>([])
  const [result, setResult] = useState<ClassificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function runClassification(input: ProductInputValues, currentFacts: ProductFact[]) {
    setPhase("loading")
    setError(null)
    try {
      const nextResult = await requestClassification({
        name: input.name,
        description: input.description || undefined,
        origin: input.origin || undefined,
        destination: input.destination || undefined,
        images: input.imageUrl ? [{ url: input.imageUrl }] : undefined,
        facts: currentFacts
      })
      setResult(nextResult)
      setPhase("result")
    } catch (err) {
      setError(err instanceof Error ? err.message : "不明なエラーが発生しました。")
      setPhase("error")
    }
  }

  function handleInitialSubmit(values: ProductInputValues) {
    setBaseInput(values)
    setFacts([])
    void runClassification(values, [])
  }

  function handleAnswers(answers: Record<string, string>) {
    if (!baseInput) return
    const newFacts: ProductFact[] = [
      ...facts,
      ...Object.entries(answers).map(([key, value]) => ({
        key,
        value,
        source: "USER_DECLARED" as const
      }))
    ]
    setFacts(newFacts)
    void runClassification(baseInput, newFacts)
  }

  return (
    <main class="mx-auto max-w-2xl px-4 py-10 space-y-6">
      <header class="space-y-1">
        <h1 class="text-2xl font-bold">HS Classification Lab</h1>
        <p class="text-sm text-slate-600">
          商品情報からAIがHSコード候補を提案する実験です。ログインは不要です。
        </p>
      </header>

      {phase === "input" && <ProductInputForm onSubmit={handleInitialSubmit} submitting={false} />}

      {phase === "loading" && <p class="text-slate-600">分類しています...</p>}

      {phase === "error" && (
        <div class="space-y-3">
          <p class="text-sm text-red-600">{error}</p>
          <button
            type="button"
            class="text-sm text-blue-700 underline"
            onClick={() => setPhase("input")}
          >
            最初からやり直す
          </button>
        </div>
      )}

      {phase === "result" && result?.status === "NEEDS_INFORMATION" && result.questions && (
        <QuestionForm
          questions={result.questions}
          submitting={false}
          onSubmit={handleAnswers}
        />
      )}

      {phase === "result" && result && result.status !== "NEEDS_INFORMATION" && (
        <>
          <ClassificationResultView result={result} />
          <FeedbackForm result={result} />
        </>
      )}
    </main>
  )
}
