import { describe, expect, it } from "vitest"
import { classify, HeuristicLlm } from "../packages/classifier/src/index.js"
import type { ClassificationRequest, ClassificationStatus } from "../packages/classifier/src/types.js"

interface Fixture {
  description: string
  request: ClassificationRequest
  expect: {
    status: ClassificationStatus
    topCodePrefix?: string
    candidateCountAtLeast?: number
    missingFactKeys?: string[]
    notesInclude?: string
  }
}

// Every JSON fixture under tests/cases/** is a self-contained
// request/expectation pair. Adding a new scenario means adding a file here
// — no test code changes required.
const fixtureModules = import.meta.glob<{ default: Fixture }>("./cases/**/*.json", {
  eager: true
})

describe("HS Classifier fixtures", () => {
  const entries = Object.entries(fixtureModules)
  it("loaded at least one fixture per required scenario", () => {
    expect(entries.length).toBeGreaterThanOrEqual(6)
  })

  for (const [path, mod] of entries) {
    const fixture = mod.default

    it(`${path} — ${fixture.description}`, async () => {
      const result = await classify(fixture.request, { llm: new HeuristicLlm() })

      expect(result.status).toBe(fixture.expect.status)

      if (fixture.expect.topCodePrefix) {
        expect(result.candidates?.[0]?.code).toBe(fixture.expect.topCodePrefix)
      }

      if (fixture.expect.candidateCountAtLeast !== undefined) {
        expect(result.candidates?.length ?? 0).toBeGreaterThanOrEqual(
          fixture.expect.candidateCountAtLeast
        )
      }

      if (fixture.expect.missingFactKeys) {
        const keys = result.questions?.map((question) => question.key) ?? []
        for (const key of fixture.expect.missingFactKeys) {
          expect(keys).toContain(key)
        }
      }

      if (fixture.expect.notesInclude) {
        const notesText = (result.notes ?? []).join(" ")
        expect(notesText).toContain(fixture.expect.notesInclude)
      }
    })
  }
})
