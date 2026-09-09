import {
  classify,
  hsDataset,
  HeuristicLlm,
  AnthropicLlm,
  type ClassificationRequest,
  type ClassificationFeedback,
  type FeedbackVerdict
} from "@hs-trade/classifier"
import type { Env } from "./env.js"
import { corsHeaders, jsonResponse } from "./cors.js"
import { storeFeedback } from "./feedbackStore.js"

const MAX_BODY_BYTES = 1_000_000 // 1MB — generous for text + a couple of image URLs, not for raw image bytes.

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) })
    }

    if (url.pathname === "/api/health" && request.method === "GET") {
      return jsonResponse({ status: "ok", datasetVersion: hsDataset.version }, env)
    }

    if (url.pathname === "/api/classify" && request.method === "POST") {
      return handleClassify(request, env)
    }

    if (url.pathname === "/api/feedback" && request.method === "POST") {
      return handleFeedback(request, env)
    }

    return jsonResponse({ error: "Not found" }, env, 404)
  }
}

async function readJsonBody(request: Request): Promise<unknown> {
  const contentLength = request.headers.get("content-length")
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    throw new Error("Request body too large")
  }
  const text = await request.text()
  if (text.length > MAX_BODY_BYTES) {
    throw new Error("Request body too large")
  }
  return JSON.parse(text)
}

function isClassificationRequest(body: unknown): body is ClassificationRequest {
  if (typeof body !== "object" || body === null) return false
  const candidate = body as Record<string, unknown>
  return typeof candidate.name === "string" && candidate.name.trim().length > 0
}

async function handleClassify(request: Request, env: Env): Promise<Response> {
  let body: unknown
  try {
    body = await readJsonBody(request)
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, env, 400)
  }

  if (!isClassificationRequest(body)) {
    return jsonResponse({ error: "`name` is required" }, env, 400)
  }

  const llm = env.ANTHROPIC_API_KEY
    ? new AnthropicLlm({ apiKey: env.ANTHROPIC_API_KEY, model: env.ANTHROPIC_MODEL })
    : new HeuristicLlm()

  try {
    const result = await classify(body, { llm })
    return jsonResponse(result, env)
  } catch (error) {
    console.error("classify() failed", error)
    return jsonResponse({ error: "Classification failed" }, env, 502)
  }
}

const VALID_VERDICTS: FeedbackVerdict[] = ["CORRECT", "INCORRECT", "UNSURE"]

function isClassificationFeedback(body: unknown): body is ClassificationFeedback {
  if (typeof body !== "object" || body === null) return false
  const candidate = body as Record<string, unknown>
  return (
    typeof candidate.classificationResult === "object" &&
    candidate.classificationResult !== null &&
    typeof candidate.verdict === "string" &&
    VALID_VERDICTS.includes(candidate.verdict as FeedbackVerdict)
  )
}

async function handleFeedback(request: Request, env: Env): Promise<Response> {
  let body: unknown
  try {
    body = await readJsonBody(request)
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, env, 400)
  }

  if (!isClassificationFeedback(body)) {
    return jsonResponse({ error: "`classificationResult` and a valid `verdict` are required" }, env, 400)
  }

  try {
    await storeFeedback(env, body)
    return jsonResponse({ ok: true }, env)
  } catch (error) {
    console.error("storeFeedback() failed", error)
    return jsonResponse({ error: "Failed to store feedback" }, env, 502)
  }
}
