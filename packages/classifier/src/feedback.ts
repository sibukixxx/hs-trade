import type { ClassificationResult } from "./types.js"

/**
 * The Feedback contract, shared between the Preact SPA and the Worker API.
 * This is the second half of the P0 value loop — see design doc section 17
 * ("Feedback"). It is intentionally separate from ClassificationResult:
 * feedback is data *about* a result, not part of the classification logic.
 */
export type FeedbackVerdict = "CORRECT" | "INCORRECT" | "UNSURE"

export type PractitionerRole =
  | "CUSTOMS_BROKERAGE"
  | "LICENSED_CUSTOMS_SPECIALIST"
  | "TRADE_OPERATIONS"
  | "IMPORTER_EXPORTER"
  | "CROSS_BORDER_EC"
  | "OTHER"

export interface ClassificationFeedback {
  classificationResult: ClassificationResult
  verdict: FeedbackVerdict
  /** Only meaningful when verdict is INCORRECT. */
  correctedCode?: string
  correctedReason?: string
  missingInformation?: string
  practitionerRole?: PractitionerRole
  /** Lead-gen opt-in — never required to submit feedback. See design doc section 19. */
  wantsToParticipateInInterview?: boolean
  contactEmail?: string
  submittedAt?: string
}
