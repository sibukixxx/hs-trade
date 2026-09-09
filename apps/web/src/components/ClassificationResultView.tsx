import type { ComponentChildren } from "preact"
import type { ClassificationResult } from "@hs-trade/classifier"
import { FactBadge } from "./FactBadge"

/**
 * Deliberately not a single "here's your HS code" answer box. Every
 * section here exists so the result can be checked, not just trusted —
 * see design doc: "AIの回答を盲目的に信用させるUIにはしないでください。"
 */
export function ClassificationResultView({ result }: { result: ClassificationResult }) {
  const [top, ...rest] = result.candidates ?? []
  const inferredFacts = result.productFacts.facts.filter((fact) => fact.source !== "USER_DECLARED")
  const hasUncertainty = (result.notes?.length ?? 0) > 0 || inferredFacts.length > 0

  return (
    <div class="space-y-6 rounded border border-slate-200 bg-white p-5">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">HS Classifier Result</h2>
        <StatusBadge status={result.status} />
      </div>

      <Section title="RESULT" subtitle="HS候補">
        {top ? (
          <>
            <p class="text-sm text-slate-500">Recommended</p>
            <p class="text-2xl font-bold tracking-wide">{top.code}</p>
            {top.headingDescription && <p class="text-sm text-slate-600">{top.headingDescription}</p>}
            <p class="text-sm text-slate-500 mt-1">信頼度の目安: {Math.round(top.confidence * 100)}%</p>

            {rest.length > 0 && (
              <div class="mt-3">
                <p class="text-sm font-medium text-slate-700 mb-1">Other candidates</p>
                <ul class="space-y-1">
                  {rest.map((candidate) => (
                    <li key={candidate.code} class="text-sm text-slate-700">
                      <span class="font-mono">{candidate.code}</span>
                      {candidate.headingDescription ? ` — ${candidate.headingDescription}` : ""}
                      <span class="text-slate-400"> ({Math.round(candidate.confidence * 100)}%)</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <p class="text-sm text-slate-500">
            候補を提示できませんでした。UNCERTAINTYの内容をご確認ください。
          </p>
        )}
      </Section>

      {result.candidates && result.candidates.length > 0 && (
        <Section title="WHY" subtitle="分類理由">
          <ul class="space-y-1 list-disc list-inside text-sm text-slate-700">
            {result.candidates.map((candidate) => (
              <li key={candidate.code}>
                <span class="font-mono">{candidate.code}</span>: {candidate.reason}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="PRODUCT FACTS" subtitle="分類に利用した商品情報">
        <p class="text-sm text-slate-600 mb-2">
          {result.productFacts.name}
          {result.productFacts.description ? ` — ${result.productFacts.description}` : ""}
        </p>
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
      </Section>

      <Section title="UNCERTAINTY" subtitle="不明・推定情報">
        {hasUncertainty ? (
          <ul class="space-y-1 list-disc list-inside text-sm text-amber-700">
            {result.notes?.map((note, index) => <li key={`note-${index}`}>{note}</li>)}
            {inferredFacts.map((fact, index) => (
              <li key={`inferred-${index}`}>
                {fact.key}({String(fact.value)})はユーザーが確定申告した情報ではなく、
                <FactBadge source={fact.source} />による推定です。分類に確信が持てない場合はご自身で確認してください。
              </li>
            ))}
          </ul>
        ) : (
          <p class="text-sm text-slate-500">
            すべての判断材料はユーザー申告の情報に基づいています。とはいえAIの判断であることに変わりはなく、
            最終確認は専門家にご相談ください。
          </p>
        )}
      </Section>

      <Section title="SOURCE" subtitle="利用したデータ・根拠">
        <p class="text-xs text-slate-500">Dataset version: {result.datasetVersion}</p>
        <p class="text-xs text-slate-500">{result.datasetSource}</p>
        <p class="text-xs text-slate-400 mt-1">
          LLMはこのデータセットから抽出した候補をランク付け・説明するだけで、候補にないHSコードを生成することはありません。
        </p>
      </Section>
    </div>
  )
}

function Section({
  title,
  subtitle,
  children
}: {
  title: string
  subtitle: string
  children: ComponentChildren
}) {
  return (
    <section>
      <h3 class="text-xs font-semibold tracking-wide text-slate-400 uppercase">
        {title} <span class="normal-case font-normal text-slate-400">/ {subtitle}</span>
      </h3>
      <div class="mt-1">{children}</div>
    </section>
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
