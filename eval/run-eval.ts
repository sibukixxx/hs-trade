import { classify, HeuristicLlm } from "../packages/classifier/src/index.js"
import type { ClassificationResult, ProductFact } from "../packages/classifier/src/index.js"
import type { EvalCase, FailureReason } from "./schema.js"
import { datasetContainsCode } from "./datasetCoverage.js"

const MAX_ROUNDS = 3

export interface CheckResult {
  name: string
  pass: boolean
  detail: string
}

export interface CaseResult {
  evalCase: EvalCase
  rounds: ClassificationResult[]
  final: ClassificationResult
  checks: CheckResult[]
  failureReasons: FailureReason[]
  critical: boolean
}

export interface EvalReport {
  generatedAt: string
  cases: CaseResult[]
}

/**
 * Simulates one user conversation: submit the case's deliberately partial
 * input, and — if asked — answer with whatever followUpAnswers the case
 * declares (leaving anything not declared unanswered, on purpose, for
 * cases probing "does it stay honest about not knowing?").
 */
async function driveCase(evalCase: EvalCase): Promise<ClassificationResult[]> {
  const rounds: ClassificationResult[] = []
  const llm = new HeuristicLlm()
  let facts: ProductFact[] = evalCase.initialRequest.facts ?? []

  let result = await classify({ ...evalCase.initialRequest, facts }, { llm })
  rounds.push(result)

  let round = 1
  while (result.status === "NEEDS_INFORMATION" && evalCase.followUpAnswers && round < MAX_ROUNDS) {
    const answerable = (result.questions ?? []).filter(
      (q) => evalCase.followUpAnswers?.[q.key] !== undefined
    )
    if (answerable.length === 0) break // nothing more we're willing/able to answer

    facts = [
      ...facts,
      ...answerable.map((q) => ({
        key: q.key,
        value: evalCase.followUpAnswers![q.key],
        source: "USER_DECLARED" as const
      }))
    ]
    result = await classify({ ...evalCase.initialRequest, facts }, { llm })
    rounds.push(result)
    round++
  }

  return rounds
}

function checkCase(evalCase: EvalCase, rounds: ClassificationResult[]): CaseResult {
  const first = rounds[0]!
  const final = rounds[rounds.length - 1]!
  const checks: CheckResult[] = []
  const failureReasons = new Set<FailureReason>()

  // 1. Did the final status match what we expect?
  const statusMatch = final.status === evalCase.expectedStatus
  checks.push({
    name: "status_as_expected",
    pass: statusMatch,
    detail: `expected ${evalCase.expectedStatus}, got ${final.status}`
  })

  // 2. CRITICAL: never CLASSIFIED when the case says information was insufficient.
  const overconfident = evalCase.expectedStatus !== "CLASSIFIED" && final.status === "CLASSIFIED"
  checks.push({
    name: "no_overconfident_classification",
    pass: !overconfident,
    detail: overconfident
      ? "classifier returned CLASSIFIED despite the case declaring insufficient information"
      : "ok"
  })
  if (overconfident) failureReasons.add("RULE_INTERPRETATION_ERROR")

  // 2b. Did it route to the right category at all? A "right status, wrong
  // reasoning" case (e.g. asking chemical questions about a shampoo) would
  // otherwise slip through the status check undetected.
  if (evalCase.expectedCategory) {
    const categoryMatch = first.category === evalCase.expectedCategory
    checks.push({
      name: "category_as_expected",
      pass: categoryMatch,
      detail: categoryMatch
        ? `routed to ${first.category} as expected`
        : `expected category ${evalCase.expectedCategory}, routed to ${first.category} instead`
    })
    if (!categoryMatch) failureReasons.add("RULE_INTERPRETATION_ERROR")
  }

  // 3. Did it ask what a competent classifier should ask?
  const expectedQuestions = evalCase.expectedMissingQuestionKeys ?? []
  const askedKeys = new Set((first.questions ?? []).map((q) => q.key))
  const missedQuestions = expectedQuestions.filter((k) => !askedKeys.has(k))
  const questionsOk = expectedQuestions.length === 0 || missedQuestions.length === 0
  checks.push({
    name: "expected_questions_asked",
    pass: questionsOk,
    detail:
      expectedQuestions.length === 0
        ? "n/a — no expected questions declared"
        : missedQuestions.length === 0
          ? `asked all of: ${expectedQuestions.join(", ")}`
          : `did not ask: ${missedQuestions.join(", ")}`
  })
  if (!questionsOk) failureReasons.add("INSUFFICIENT_QUESTIONS")

  // 4. If we have a known expected code, did it show up among the candidates?
  const expectCode = evalCase.expectedHs.basis !== "UNKNOWN" ? evalCase.expectedHs.code : undefined
  let candidateFound: boolean | undefined
  if (expectCode) {
    const codes = (final.candidates ?? []).map((c) => c.code)
    candidateFound =
      evalCase.expectedHs.level === "heading"
        ? codes.some((c) => c.startsWith(expectCode))
        : codes.includes(expectCode)
    checks.push({
      name: "expected_candidate_found",
      pass: candidateFound,
      detail: candidateFound
        ? `found ${expectCode} among candidates: ${codes.join(", ") || "(none)"}`
        : `expected ${expectCode}, candidates were: ${codes.join(", ") || "(none)"}`
    })
    if (!candidateFound) {
      failureReasons.add(datasetContainsCode(expectCode) ? "RETRIEVAL_FAILURE" : "HS_DATA_GAP")
    } else {
      // Found somewhere in the list isn't the same as being the actual
      // Recommended pick — a user mostly sees and trusts candidates[0].
      const topCode = codes[0]
      const topMatches =
        evalCase.expectedHs.level === "heading" ? topCode?.startsWith(expectCode) : topCode === expectCode
      checks.push({
        name: "top_candidate_matches_expected",
        pass: Boolean(topMatches),
        detail: topMatches
          ? `Recommended candidate (${topCode}) matches expected ${expectCode}`
          : `expected ${expectCode} was retrieved but Recommended candidate was ${topCode} instead — right answer present, wrong one surfaced as primary`
      })
      if (!topMatches) failureReasons.add("RULE_INTERPRETATION_ERROR")
    }
  } else {
    checks.push({
      name: "expected_candidate_found",
      pass: true,
      detail: "n/a — expectedHs basis is UNKNOWN, not graded"
    })
  }

  // 5. Do our declared answers actually round-trip into the final ProductFacts?
  const declaredAnswers = evalCase.followUpAnswers ?? {}
  const finalFactByKey = new Map(final.productFacts.facts.map((f) => [f.key, f]))
  const brokenRoundtrip = Object.entries(declaredAnswers).filter(([key, value]) => {
    const fact = finalFactByKey.get(key)
    return !fact || fact.source !== "USER_DECLARED" || String(fact.value) !== value
  })
  const roundtripOk = brokenRoundtrip.length === 0
  checks.push({
    name: "facts_roundtrip",
    pass: roundtripOk,
    detail: roundtripOk
      ? "all declared answers appear as USER_DECLARED facts in the final result"
      : `lost/altered on the way through: ${brokenRoundtrip.map(([k]) => k).join(", ")}`
  })
  if (!roundtripOk) failureReasons.add("INSUFFICIENT_PRODUCT_INFO")

  // 6. Evidence: every candidate/question should carry a non-empty reason, and source metadata should be present.
  const candidatesMissingReason = (final.candidates ?? []).filter((c) => !c.reason?.trim())
  const questionsMissingReason = (final.questions ?? []).filter((q) => !q.reason?.trim())
  const evidenceOk =
    candidatesMissingReason.length === 0 &&
    questionsMissingReason.length === 0 &&
    Boolean(final.datasetVersion) &&
    Boolean(final.datasetSource)
  checks.push({
    name: "evidence_present",
    pass: evidenceOk,
    detail: evidenceOk
      ? "all candidates/questions carry reasons; dataset version+source present"
      : `missing reasons on ${candidatesMissingReason.length} candidate(s), ${questionsMissingReason.length} question(s)`
  })

  // Generic catch-all: status mismatch not otherwise explained above.
  if (!statusMatch && !overconfident && (candidateFound ?? true)) {
    failureReasons.add("AI_REASONING_ERROR")
  }

  return {
    evalCase,
    rounds,
    final,
    checks,
    failureReasons: [...failureReasons],
    critical: overconfident
  }
}

export async function runEval(cases: EvalCase[]): Promise<EvalReport> {
  const results: CaseResult[] = []
  for (const evalCase of cases) {
    const rounds = await driveCase(evalCase)
    results.push(checkCase(evalCase, rounds))
  }
  return { generatedAt: new Date().toISOString(), cases: results }
}
