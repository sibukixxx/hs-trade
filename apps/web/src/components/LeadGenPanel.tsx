import { useState } from "preact/hooks"
import type { ClassificationResult, FeedbackVerdict } from "@hs-trade/classifier"
import { submitFeedback } from "../api/client"

interface Props {
  result: ClassificationResult
  verdict: FeedbackVerdict
}

/**
 * Shown only after feedback has been submitted — never a precondition for
 * using the classifier. See design doc section 19: "価値提供 → Feedback →
 * Contact の順番を守ります。"
 */
export function LeadGenPanel({ result, verdict }: Props) {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "submitting" | "done">("idle")

  if (state === "done") {
    return <p class="text-sm text-green-700">ご協力ありがとうございます。改めてご連絡させていただきます。</p>
  }

  return (
    <div class="rounded border border-slate-200 bg-slate-50 p-4 space-y-2">
      <p class="text-sm font-medium">
        AIによるHS分類・貿易実務へのAI活用を検証しています。
      </p>
      <p class="text-sm text-slate-600">
        実務上の課題や改善点についてヒアリングに協力いただける方を募集しています(任意)。
      </p>
      <div class="flex gap-2">
        <input
          type="email"
          class="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
          placeholder="Email"
          value={email}
          onInput={(e) => setEmail(e.currentTarget.value)}
        />
        <button
          type="button"
          class="rounded bg-slate-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={email.trim().length === 0 || state === "submitting"}
          onClick={async () => {
            setState("submitting")
            try {
              await submitFeedback({
                classificationResult: result,
                verdict,
                contactEmail: email.trim(),
                wantsToParticipateInInterview: true
              })
              setState("done")
            } catch {
              setState("idle")
            }
          }}
        >
          検証に参加する
        </button>
      </div>
    </div>
  )
}
