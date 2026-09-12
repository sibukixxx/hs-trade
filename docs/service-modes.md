# Two deployment targets: Public Demo and API service (SaaS-able)

This documents the design for running the existing HS Classifier as **two
things from one codebase**, decided per the priority order in the main
README (Self-use → OSS → B2B):

1. **Public Demo** — what already exists today: open the site, describe a
   product, no login. This document changes nothing about it except adding
   abuse protection.
2. **API service** — the same `classify()` pipeline, exposed to external
   developers with their own API key, structured so it *could* become a paid
   SaaS later without a rewrite — but with no billing, dashboard, or account
   system built now.

Nothing here touches `packages/classifier` (the `ClassificationRequest →
Classifier → ClassificationResult` boundary stays exactly as it is) or the
Preact SPA's contract with `/api/classify`. This is purely additive work in
`apps/api` — one Worker, two authenticated paths through the same endpoint.

## Decisions this design assumes (confirmed 2026-09-12)

- **Auth scope for Phase 1: API key only.** No login page, no dashboard, no
  password/session anything. Key issuance and usage lookup are themselves
  just JSON endpoints — a developer can `curl` their way to a working
  integration without ever seeing a UI.
- **No billing yet.** The data model has the fields billing will need
  (`plan`, `dailyLimit`) so Stripe can be bolted on later by changing values
  in existing records, not by re-architecting.
- **Hosting stays Cloudflare Pages (apps/web) + Workers (apps/api)** — no new
  infrastructure class introduced. The only new pieces are two small KV
  namespaces.

## Why one Worker, not two

`/api/classify` already does the only expensive/valuable thing in this
system: normalize input, ask for missing facts, retrieve candidates, and
have an LLM (or the heuristic fallback) rank them. A demo visitor and a paid
API integrator are asking it to do the *same* thing. Splitting them into two
deployments would mean maintaining two copies of the auth-adjacent
scaffolding (CORS, error shapes, rate limiting) for no real benefit at this
scale. So: **one Worker, one `/api/classify` route, branching only on
whether a valid `x-api-key` header is present.**

```
                         POST /api/classify
                                │
                    ┌───────────┴───────────┐
                    │                        │
            no x-api-key header      x-api-key header present
            (or demo origin)                 │
                    │                 look up in API_KEYS KV
                    ▼                        │
          DEMO PATH                  ┌───────┴───────┐
          - IP-based rate limit      │ invalid/revoked│  valid
            (generous, cheap)        │       │        │
          - no per-key usage         ▼        │        ▼
            tracking                401       │   API PATH
                                              │   - per-key rate limit
                                              │     (plan.dailyLimit)
                                              │   - increment USAGE KV
                                              │   - x-ratelimit-* headers
                                              ▼
                                    classify() — identical call either way
```

Both paths call the exact same `classify()` with the exact same
`ClassificationRequest` shape. The SPA never sends an `x-api-key`, so it
transparently keeps hitting the demo path — **zero change to the existing
Public Demo contract.**

## New KV namespaces

Reusing the existing pattern from `FEEDBACK_KV` (optional binding, Worker
still runs without it — see `apps/api/wrangler.toml`).

### `API_KEYS`

Key: SHA-256 hash of the API key (never store the plaintext key — same
practice as Stripe/GitHub personal access tokens: show it once at issuance,
verify by re-hashing on every request).

```ts
interface ApiKeyRecord {
  email: string
  createdAt: string        // ISO timestamp
  plan: "free"              // only value that exists in Phase 1
  dailyLimit: number         // e.g. 50 — read at request time, not hardcoded
  disabled: boolean          // manual kill switch, no UI needed — a wrangler
                              // kv:key put is enough at this scale
}
```

### `USAGE`

Key: `${hashedKey}:${yyyy-mm-dd}` (UTC date). Value: a plain integer count,
as a string. Written with a short TTL (~2 days) so old counters clean
themselves up — no cron/cleanup job needed.

## New endpoints (all in `apps/api`, alongside the existing two)

### `POST /api/keys` — self-serve key issuance

```
Request:  { "email": "you@example.com" }
Response: { "apiKey": "hsc_live_<32 hex chars>", "dailyLimit": 50 }
```

- No email verification in Phase 1 (consistent with "no accounts, no CRM").
  This is trust-based; abuse is handled by disabling a key manually, which
  is proportionate at this stage.
- Rate-limit key *creation* itself by requesting IP (e.g. 3/day) using the
  same KV-counter mechanism as request rate limiting, to stop trivial spam.
- The email is stored only to have a contact point if a key needs to be
  disabled or upgraded later — never surfaced, never used for marketing.

### `GET /api/usage` — self-check, replaces a dashboard

```
Request:  header x-api-key: hsc_live_...
Response: { "date": "2026-09-12", "used": 12, "limit": 50, "plan": "free" }
```

This is the entire "account management surface." A developer curls it to
see where they stand. No UI needed because there's nothing to configure yet
— when billing exists, this is the endpoint that would grow a `plan` value
worth showing on a real page, not before.

### `/api/classify` (existing route, extended)

- Reads `x-api-key` if present.
  - **Missing** → demo path: enforce a per-IP rate limit (e.g. 20
    requests / 10 minutes, tuned to protect the shared LLM budget behind the
    demo, not to annoy real visitors — one classification run rarely needs
    more than 2-3 calls per session).
  - **Present, invalid or disabled** → `401 { "error": "invalid API key" }`.
  - **Present, valid** → look up `plan.dailyLimit`, check/increment
    `USAGE`. Over limit → `429` with `Retry-After`. Otherwise proceed, and
    return `x-ratelimit-limit` / `x-ratelimit-remaining` response headers.
- The call into `classify()` itself is untouched.

### `/api/feedback` (existing route)

Unchanged. Feedback stays anonymous-friendly and outside the key/usage
system on purpose — the point of feedback is to lower friction, not gate it.

## What Phase 1 explicitly does not build

Per the existing P0 scope rules (nothing new here, just re-affirmed for this
piece of work):

- No login, session, or password anything
- No billing/Stripe integration (schema is ready for it; the integration
  isn't)
- No dashboard UI — `GET /api/usage` is the entire "account view"
- No company accounts, workspaces, teams, or CRM
- No changes to `packages/classifier` or the Preact SPA's existing calls

## Rollout

1. **This document.**
2. Implement in `apps/api` only: `src/auth.ts` (hash/generate/lookup),
   `src/rateLimit.ts` (KV sliding-window-ish counter), the two new routes,
   and the branching logic in the existing `/api/classify` handler. Add the
   two KV bindings to `wrangler.toml` (mirroring how `FEEDBACK_KV` is
   already documented as an optional, commented-out binding).
3. Add a short "Using the API" section to the main README (request/response
   shapes, how to get a key, rate limits) — this is the entire "developer
   docs" for Phase 1, no separate docs site.
4. Deploy: same Cloudflare Pages + Worker targets as today, just with the
   new KV namespaces created via `wrangler kv:namespace create`.
5. **Only once real usage shows up:** add Stripe Checkout + a webhook route
   that updates a key's `plan`/`dailyLimit` in `API_KEYS` on successful
   payment. No other code changes needed — the rate-limit check already
   reads `dailyLimit` from the record, not a constant.
6. **Only if usage/analytics needs grow past what KV can answer:** introduce
   D1 for queryable history and, if genuinely warranted, a minimal
   self-serve dashboard. Not before there's a real reason.
