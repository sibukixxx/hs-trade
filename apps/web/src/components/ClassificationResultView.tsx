import type { ClassificationResult } from "@hs-trade/classifier"
import { FactBadge } from "./FactBadge"

export function ClassificationResultView({ result }: { result: ClassificationResult }) {
  const [top, ...rest] = result.candidates ?? []

  return (
    <div class="space-y-5 rounded border border-slate-200 bg-white p-5">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">AI Classification</h2>
        <StatusBadge status={result.status} />
      </div>

      {top && (
        <div>
          <p class="text-sm text-slate-500">Recommended</p>
          <p class="text-2xl font-bold tracking-wide">{top.code}</p>
          {top.headingDescription && <p class="text-sm text-slate-600">{top.headingDescription}</p>}
          <p class="text-sm text-slate-500 mt-1">信頼度の目安: {Math.round(top.confidence * 100)}%</p>
        </div>
      )}

      {rest.length > 0 && (
        <div>
          <p class="text-sm font-medium text-slate-700 mb-1">Other candidates</p>
          <ul class="space-y-1">
            {rest.map((candidate) => (
              <li key={candidate.code} class="text-sm text-slate-700">
                <span class="font-mono">{candidate.code}</span>
                {candidate.headingDescription ? ` — ${candidate.headingDescription}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.candidates && result.candidates.length > 0 && (
        <div>
          <p class="text-sm font-medium text-slate-700 mb-1">Why?</p>
          <ul class="space-y-1 list-disc list-inside text-sm text-slate-700">
            {result.candidates.map((candidate) => (
              <li key={candidate.code}>
                <span class="font-mono">{candidate.code}</span>: {candidate.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p class="text-sm font-medium text-slate-700 mb-1">Product Facts</p>
        {result.productFacts.facts.length === 0 ? (
          <p class="text-sm text-slate-500">申告された追加情報はありません。</p>
        ) : (
          <ul class="space-y-1">
            {result.productFacts.facts.map((fact, index) => (
              <li key={`${fact.key}-${index}`} class="flex items-center gap-2 text-sm">
                <span class="text-slate-600">{fact.key}:</span>
                <span>{String(fact.value)}</span>
                <FactBadge source={fact.source} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {result.notes && result.notes.length > 0 && (
        <div>
          <p class="text-sm font-medium text-slate-700 mb-1">Missing / uncertain facts</p>
          <ul class="space-y-1 list-disc list-inside text-sm text-amber-700">
            {result.notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      <p class="text-xs text-slate-400">
        Dataset: {result.datasetVersion} (デモ用の限定データセットです。網羅性・正確性は保証されません。)
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: ClassificationResult["status"] }) {
  const styles: Record<ClassificationResult["status"], string> = {
    CLASSIFIED: "bg-green-100 text-green-800 border-green-300",
    NEEDS_REVIEW: "bg-amber-100 text-amber-800 border-amber-300",
    NEEDS_INFORMATION: "bg-blue-100 text-blue-800 border-blue-300"
  }
  const labels: Record<ClassificationResult["status"], string> = {
    CLASSIFIED: "分類済み",
    NEEDS_REVIEW: "要レビュー",
    NEEDS_INFORMATION: "情報不足"
  }
  return (
    <span class={`rounded border px-2 py-1 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
