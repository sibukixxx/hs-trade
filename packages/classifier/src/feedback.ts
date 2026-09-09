import type { ClassificationResult } from "./types.js"

/**
 * The Feedback contract, shared between the Preact SPA and the Worker API.
 * This is how the OSS project improves — a simple, low-friction verdict
 * plus an optional correction. It is intentionally separate from
 * ClassificationResult: feedback is data *about* a result, not part of
 * the classification logic. It also intentionally carries no lead-gen or
 * CRM fields — business inquiries are a static referral link in the UI,
 * not a form that writes into this record.
 */
export type FeedbackVerdict = "CORRECT" | "INCORRECT" | "UNSURE"

export interface ClassificationFeedback {
  classificationResult: ClassificationResult
  verdict: FeedbackVerdict
  /** Only meaningful when verdict is INCORRECT, and always optional. */
  correctedCode?: string
  correctedReason?: string
  missingInformation?: string
  submittedAt?: string
}
