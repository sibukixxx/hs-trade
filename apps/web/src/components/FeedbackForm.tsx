import { useState } from "preact/hooks"
import type {
  ClassificationResult,
  FeedbackVerdict,
  PractitionerRole
} from "@hs-trade/classifier"
import { submitFeedback } from "../api/client"
import { LeadGenPanel } from "./LeadGenPanel"

const ROLE_OPTIONS: { value: PractitionerRole; label: string }[] = [
  { value: "CUSTOMS_BROKERAGE", label: "通関業務" },
  { value: "LICENSED_CUSTOMS_SPECIALIST", label: "通関士" },
  { value: "TRADE_OPERATIONS", label: "貿易実務" },
  { value: "IMPORTER_EXPORTER", label: "輸出入事業者" },
  { value: "CROSS_BORDER_EC", label: "越境EC" },
  { value: "OTHER", label: "その他" }
]

export function FeedbackForm({ result }: { result: ClassificationResult }) {
  const [verdict, setVerdict] = useState<FeedbackVerdict | null>(null)
  const [correctedCode, setCorrectedCode] = useState("")
  const [correctedReason, setCorrectedReason] = useState("")
  const [missingInformation, setMissingInformation] = useState("")
  const [role, setRole] = useState<PractitionerRole | undefined>(undefined)
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">("idle")

  if (state === "done" && verdict) {
    return (
      <div class="space-y-4 rounded border border-slate-200 bg-white p-5">
        <p class="text-sm text-green-700">フィードバックを送信しました。ありがとうございます。</p>
        <LeadGenPanel result={result} verdict={verdict} />
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
            ["INCORRECT", "間違っている"],
            ["UNSURE", "判断できない"]
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
            <label class="block text-sm font-medium mb-1">正しいと思うHSコード</label>
            <input
              class="w-full rounded border border-slate-300 px-3 py-2"
              value={correctedCode}
              onInput={(e) => setCorrectedCode(e.currentTarget.value)}
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">理由</label>
            <textarea
              class="w-full rounded border border-slate-300 px-3 py-2"
              rows={2}
              value={correctedReason}
              onInput={(e) => setCorrectedReason(e.currentTarget.value)}
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">不足している商品情報</label>
            <textarea
              class="w-full rounded border border-slate-300 px-3 py-2"
              rows={2}
              value={missingInformation}
              onInput={(e) => setMissingInformation(e.currentTarget.value)}
            />
          </div>
        </div>
      )}

      {verdict && (
        <div>
          <p class="text-sm font-medium mb-1">あなたの立場(任意)</p>
          <div class="flex flex-wrap gap-2">
            {ROLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                class={`rounded border px-2 py-1 text-xs ${
                  role === option.value
                    ? "border-blue-600 bg-blue-50 text-blue-800"
                    : "border-slate-300 text-slate-600"
                }`}
                onClick={() => setRole(role === option.value ? undefined : option.value)}
              >
                {option.label}
              </button>
            ))}
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
                missingInformation: verdict === "INCORRECT" ? missingInformation || undefined : undefined,
                practitionerRole: role
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
