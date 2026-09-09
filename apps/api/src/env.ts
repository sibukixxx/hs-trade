/** Minimal shape we need from a KV namespace — avoids depending on @cloudflare/workers-types for such a small surface. */
export interface KvLike {
  put(key: string, value: string): Promise<void>
  list(options?: { prefix?: string; limit?: number }): Promise<{ keys: { name: string }[] }>
}

export interface Env {
  ANTHROPIC_API_KEY?: string
  ANTHROPIC_MODEL?: string
  ALLOWED_ORIGIN?: string
  FEEDBACK_KV?: KvLike
}
