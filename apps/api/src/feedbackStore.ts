import type { ClassificationFeedback } from "@hs-trade/classifier"
import type { Env } from "./env.js"

/**
 * Persists feedback if a KV namespace is bound, otherwise just logs it.
 * Feedback is P0's most important success signal (see README), but P0
 * deliberately avoids standing up a database for it — see design doc
 * section 14 ("P0ではインフラを増やしすぎないでください").
 */
export async function storeFeedback(env: Env, feedback: ClassificationFeedback): Promise<void> {
  const record = { ...feedback, submittedAt: feedback.submittedAt ?? new Date().toISOString() }

  if (env.FEEDBACK_KV) {
    const key = `feedback:${record.submittedAt}:${crypto.randomUUID()}`
    await env.FEEDBACK_KV.put(key, JSON.stringify(record))
    return
  }

  // No KV bound (e.g. local dev without `wrangler kv:namespace create`):
  // still succeed, but make it obvious in the logs that nothing persisted.
  console.log("[feedback] FEEDBACK_KV not configured, logging only:", record)
}
