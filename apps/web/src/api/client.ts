import type {
  ClassificationFeedback,
  ClassificationRequest,
  ClassificationResult
} from "@hs-trade/classifier"

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787"

export async function requestClassification(
  payload: ClassificationRequest
): Promise<ClassificationResult> {
  const response = await fetch(`${API_BASE}/api/classify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  })
  if (!response.ok) {
    throw new Error(`分類リクエストに失敗しました (HTTP ${response.status})`)
  }
  return response.json() as Promise<ClassificationResult>
}

export async function submitFeedback(payload: ClassificationFeedback): Promise<void> {
  const response = await fetch(`${API_BASE}/api/feedback`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  })
  if (!response.ok) {
    throw new Error(`フィードバックの送信に失敗しました (HTTP ${response.status})`)
  }
}
