import { useState } from "preact/hooks"
import type { ClassificationResult, FeedbackVerdict } from "@hs-trade/classifier"
import { submitFeedback } from "../api/client"

/**
 * This is deliberately small: a verdict, and an optional correction when
 * the verdict is INCORRECT. No practitioner segmentation, no email
 * capture — this feedback exists purely to improve the OSS classifier.
 * Business inquiries are a separate, static referral (see BusinessInquiryNote).
 */
export function FeedbackForm({ result }: { result: ClassificationResult }) {
  const [verdict, setVerdict] = useState<FeedbackVerdict | null>(null)
  const [correctedCode, setCorrectedCode] = useState("")
  const [correctedReason, setCorrectedReason] = useState("")
  const [missingInformation, setMissingInformation] = useState("")
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">("idle")

  if (state === "done") {
    return (
      <div class="rounded border border-slate-200 bg-white p-5">
        <p class="text-sm text-green-700">フィードバックを送信しました。ありがとうございます。</p>
      </div>
    )
  }

  return (
    <div class="space-y-4 rounded border border-slate-200 bg-white p-5">
      <h2 class="text-lg font-semibold">この分類についてどう思いますか?</h2>

      <div class="flex gap-2">
        {(
          [
            ["CORRECT", "正しい"],
            ["INCORRECT", "違うと思う"],
            ["UNSURE", "分からない"]
          ] as [FeedbackVerdict, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            class={`rounded border px-3 py-2 text-sm font-medium ${
              verdict === value
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-300 bg-white text-slate-700"
            }`}
            onClick={() => setVerdict(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {verdict === "INCORRECT" && (
        <div class="space-y-3 rounded border border-slate-200 bg-slate-50 p-4">
          <div>
            <label class="block text-sm font-medium mb-1">正しいと思うHSコード(任意)</label>
            <input
              class="w-full rounded border border-slate-300 px-3 py-2"
              value={correctedCode}
              onInput={(e) => setCorrectedCode(e.currentTarget.value)}
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">理由(任意)</label>
            <textarea
              class="w-full rounded border border-slate-300 px-3 py-2"
              rows={2}
              value={correctedReason}
              onInput={(e) => setCorrectedReason(e.currentTarget.value)}
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">不足している情報(任意)</label>
            <textarea
              class="w-full rounded border border-slate-300 px-3 py-2"
              rows={2}
              value={missingInformation}
              onInput={(e) => setMissingInformation(e.currentTarget.value)}
            />
          </div>
        </div>
      )}

      {state === "error" && (
        <p class="text-sm text-red-600">送信に失敗しました。もう一度お試しください。</p>
      )}

      {verdict && (
        <button
          type="button"
          class="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={state === "submitting"}
          onClick={async () => {
            setState("submitting")
            try {
              await submitFeedback({
                classificationResult: result,
                verdict,
                correctedCode: verdict === "INCORRECT" ? correctedCode || undefined : undefined,
                correctedReason: verdict === "INCORRECT" ? correctedReason || undefined : undefined,
                missingInformation: verdict === "INCORRECT" ? missingInformation || undefined : undefined
              })
              setState("done")
            } catch {
              setState("error")
            }
          }}
        >
          {state === "submitting" ? "送信中..." : "フィードバックを送信"}
        </button>
      )}
    </div>
  )
}
