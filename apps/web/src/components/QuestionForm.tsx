import { useState } from "preact/hooks"
import type { ClassificationQuestion } from "@hs-trade/classifier"
import { FactBadge } from "./FactBadge"

interface Props {
  questions: ClassificationQuestion[]
  onSubmit: (answers: Record<string, string>) => void
  submitting: boolean
}

/**
 * Renders the follow-up questions the classifier decided it needs — never
 * a fixed 20-field form (design doc section 9), just whatever this
 * product's category is still missing.
 */
export function QuestionForm({ questions, onSubmit, submitting }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const canSubmit = questions.every((q) => (answers[q.key] ?? "").trim().length > 0) && !submitting

  return (
    <form
      class="space-y-5 rounded border border-slate-200 bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (canSubmit) onSubmit(answers)
      }}
    >
      <h2 class="text-lg font-semibold">分類に必要な追加情報を教えてください</h2>
      {questions.map((question) => (
        <div key={question.key}>
          <label class="block text-sm font-medium mb-1" for={`q-${question.key}`}>
            {question.question}
          </label>
          <p class="text-xs text-slate-500 mb-1">{question.reason}</p>
          {question.inferredHint && (
            <p class="text-xs text-slate-500 mb-1 flex items-center gap-1">
              参考(未確定): {String(question.inferredHint.value)}{" "}
              <FactBadge source={question.inferredHint.source} />
            </p>
          )}
          <input
            id={`q-${question.key}`}
            class="w-full rounded border border-slate-300 px-3 py-2"
            value={answers[question.key] ?? ""}
            onInput={(e) => setAnswers({ ...answers, [question.key]: e.currentTarget.value })}
          />
        </div>
      ))}
      <button
        type="submit"
        class="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white disabled:opacity-50"
        disabled={!canSubmit}
      >
        {submitting ? "分類中..." : "回答して分類を続ける"}
      </button>
    </form>
  )
}
