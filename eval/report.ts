import type { EvalReport, CaseResult } from "./run-eval.js"
import type { FailureReason } from "./schema.js"

const REASON_LABEL: Record<FailureReason, string> = {
  INSUFFICIENT_PRODUCT_INFO: "商品情報不足 (product facts)",
  INSUFFICIENT_QUESTIONS: "質問不足 (missing-information detection)",
  HS_DATA_GAP: "HSデータ不足 (candidate retrieval)",
  RETRIEVAL_FAILURE: "Retrieval失敗 (candidate retrieval)",
  RULE_INTERPRETATION_ERROR: "分類規則の解釈ミス (classification reasoning)",
  AI_REASONING_ERROR: "AIの推論ミス (classification reasoning)"
}

const BUCKET_OF: Record<FailureReason, "product facts" | "missing-information detection" | "candidate retrieval" | "classification reasoning"> = {
  INSUFFICIENT_PRODUCT_INFO: "product facts",
  INSUFFICIENT_QUESTIONS: "missing-information detection",
  HS_DATA_GAP: "candidate retrieval",
  RETRIEVAL_FAILURE: "candidate retrieval",
  RULE_INTERPRETATION_ERROR: "classification reasoning",
  AI_REASONING_ERROR: "classification reasoning"
}

function renderCase(result: CaseResult): string {
  const { evalCase, rounds, final, checks, failureReasons, critical } = result
  const lines: string[] = []

  lines.push(`### \`${evalCase.id}\` — ${evalCase.productLabel} (${evalCase.category})`)
  lines.push("")
  lines.push(`${evalCase.description}`)
  lines.push("")
  lines.push(`- **Expected:** ${evalCase.expectedStatus}` + (evalCase.expectedHs.code ? `, HS ${evalCase.expectedHs.code} (${evalCase.expectedHs.level}, basis: ${evalCase.expectedHs.basis})` : `, HS: unknown/not graded`))
  lines.push(`- **Source/reference:** ${evalCase.expectedHs.reference}`)
  lines.push(`- **Actual final status:** ${final.status}` + (final.candidates?.length ? `, candidates: ${final.candidates.map((c) => `${c.code} (${Math.round(c.confidence * 100)}%)`).join(", ")}` : ""))
  lines.push(`- **Rounds run:** ${rounds.length}`)
  if (critical) lines.push(`- ⚠️ **CRITICAL: overconfident classification**`)
  lines.push("")
  lines.push("| Check | Result | Detail |")
  lines.push("|---|---|---|")
  for (const check of checks) {
    lines.push(`| ${check.name} | ${check.pass ? "✅ pass" : "❌ fail"} | ${check.detail} |`)
  }
  lines.push("")
  if (failureReasons.length > 0) {
    lines.push(`**Auto-diagnosed failure reasons:** ${failureReasons.map((r) => REASON_LABEL[r]).join("; ")}`)
    lines.push("")
  }
  lines.push(`**Author's notes (written before grading):** ${evalCase.notes}`)
  lines.push("")
  lines.push("<details><summary>Full round-by-round trace</summary>")
  lines.push("")
  rounds.forEach((round, i) => {
    lines.push(`Round ${i + 1}: status=\`${round.status}\`, category=\`${round.category}\``)
    if (round.questions?.length) {
      lines.push(`  questions: ${round.questions.map((q) => q.key).join(", ")}`)
    }
    if (round.candidates?.length) {
      lines.push(`  candidates: ${round.candidates.map((c) => `${c.code}@${Math.round(c.confidence * 100)}%`).join(", ")}`)
    }
    if (round.notes?.length) {
      lines.push(`  notes: ${round.notes.join(" / ")}`)
    }
  })
  lines.push("")
  lines.push("</details>")
  lines.push("")
  return lines.join("\n")
}

export function renderMarkdown(report: EvalReport): string {
  const lines: string[] = []
  lines.push("# HS Classifier P0 — Validation Results")
  lines.push("")
  lines.push(`Generated: ${report.generatedAt}`)
  lines.push("")
  lines.push(
    "This is **not** a pass/fail benchmark of classification accuracy. It's a record of " +
      "running the current classifier against real-ish products — some easy, some " +
      "deliberately ambiguous — and tracing *why* each result was right, wrong, or " +
      "appropriately uncertain. See `eval/README.md` for methodology."
  )
  lines.push("")

  lines.push("## Summary")
  lines.push("")
  lines.push("| Case | Category | Expected | Actual | Critical? | Failure reasons |")
  lines.push("|---|---|---|---|---|---|")
  for (const c of report.cases) {
    lines.push(
      `| \`${c.evalCase.id}\` | ${c.evalCase.category} | ${c.evalCase.expectedStatus} | ${c.final.status} | ${c.critical ? "⚠️ YES" : ""} | ${c.failureReasons.map((r) => REASON_LABEL[r]).join("; ") || "—"} |`
    )
  }
  lines.push("")

  const criticalCount = report.cases.filter((c) => c.critical).length
  lines.push(`**Overconfident classifications (critical failures): ${criticalCount} / ${report.cases.length}**`)
  lines.push("")

  lines.push("## Weakness report (5 dimensions)")
  lines.push("")
  const dims: Record<string, { count: number; cases: string[] }> = {
    "product facts": { count: 0, cases: [] },
    "missing-information detection": { count: 0, cases: [] },
    "candidate retrieval": { count: 0, cases: [] },
    "classification reasoning": { count: 0, cases: [] },
    evidence: { count: 0, cases: [] }
  }
  for (const c of report.cases) {
    for (const reason of c.failureReasons) {
      const bucket = dims[BUCKET_OF[reason]]!
      bucket.count++
      if (!bucket.cases.includes(c.evalCase.id)) bucket.cases.push(c.evalCase.id)
    }
    const evidenceCheck = c.checks.find((chk) => chk.name === "evidence_present")
    if (evidenceCheck && !evidenceCheck.pass) {
      dims.evidence!.count++
      dims.evidence!.cases.push(c.evalCase.id)
    }
  }
  for (const [dim, { count, cases }] of Object.entries(dims)) {
    lines.push(`- **${dim}**: ${count} issue(s)${cases.length ? ` — ${cases.map((id) => `\`${id}\``).join(", ")}` : ""}`)
  }
  lines.push("")

  lines.push("## Per-case detail")
  lines.push("")
  for (const c of report.cases) {
    lines.push(renderCase(c))
  }

  return lines.join("\n")
}
