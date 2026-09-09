import type { FactSource } from "@hs-trade/classifier"

const STYLES: Record<FactSource, { label: string; symbol: string; class: string }> = {
  USER_DECLARED: { label: "申告", symbol: "✓", class: "bg-green-100 text-green-800 border-green-300" },
  TEXT_INFERRED: { label: "文章推定", symbol: "○", class: "bg-blue-100 text-blue-800 border-blue-300" },
  IMAGE_INFERRED: { label: "画像推定", symbol: "○", class: "bg-blue-100 text-blue-800 border-blue-300" },
  AI_INFERRED: { label: "AI推定", symbol: "?", class: "bg-slate-100 text-slate-700 border-slate-300" }
}

export function FactBadge({ source }: { source: FactSource }) {
  const style = STYLES[source]
  return (
    <span class={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs ${style.class}`}>
      {style.symbol} {style.label}
    </span>
  )
}
