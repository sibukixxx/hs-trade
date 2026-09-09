import type { Env } from "./env.js"

export function corsHeaders(env: Env): Record<string, string> {
  return {
    "access-control-allow-origin": env.ALLOWED_ORIGIN ?? "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type"
  }
}

export function jsonResponse(body: unknown, env: Env, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders(env)
    }
  })
}
