import { describe, expect, it } from "vitest"
import { writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { runEval } from "./run-eval.js"
import { renderMarkdown } from "./report.js"
import type { EvalCase } from "./schema.js"

// Every JSON fixture under eval/cases/** is one real-ish product to
// validate against. Add a new file there to grow the eval set — no code
// changes needed here.
const caseModules = import.meta.glob<{ default: EvalCase }>("./cases/**/*.json", { eager: true })
const cases = Object.values(caseModules).map((mod) => mod.default)
const __dirname = dirname(fileURLToPath(import.meta.url))

describe("HS Classifier P0 validation", () => {
  it("loaded the expected number of cases across all required categories", () => {
    expect(cases.length).toBeGreaterThanOrEqual(10)
    const categories = new Set(cases.map((c) => c.category))
    for (const required of [
      "tea",
      "apparel",
      "footwear",
      "electronics",
      "cosmetics",
      "processed_food",
      "machinery_parts"
    ]) {
      expect(categories.has(required as EvalCase["category"])).toBe(true)
    }
  })

  it("runs the full validation suite and writes eval/RESULTS.md + eval/results.json", async () => {
    const report = await runEval(cases)
    writeFileSync(join(__dirname, "results.json"), JSON.stringify(report, null, 2))
    writeFileSync(join(__dirname, "RESULTS.md"), renderMarkdown(report))
    expect(report.cases.length).toBe(cases.length)
  })

  it("never returns CLASSIFIED when a case declares information was insufficient (the one hard rule)", async () => {
    const report = await runEval(cases)
    const overconfident = report.cases.filter((c) => c.critical)
    const detail = overconfident
      .map((c) => `${c.evalCase.id}: expected ${c.evalCase.expectedStatus}, got CLASSIFIED`)
      .join("\n")
    expect(overconfident.length, `Overconfident classifications found:\n${detail}`).toBe(0)
  })
})
