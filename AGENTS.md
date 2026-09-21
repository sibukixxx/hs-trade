# HS Trade

TypeScript workspace for HS-code/trade classification experiments and a web/API product surface.

## Commands
- `npm run dev:web`
- `npm run dev:api`
- `npm run build:web`
- `npm run test`
- `npm run eval`
- `npm run typecheck`

## Shared rules
- Classification output is decision support, not a substitute for customs authority/legal confirmation; preserve uncertainty and evidence fields.
- Keep classifier logic in the shared package rather than duplicating it in web/API handlers.
- Evaluation fixtures/results are the regression contract for classifier changes; do not tune only to one example.
- Never embed confidential shipment/client data in committed fixtures.

## Change-dependent checks
- Classifier/API: `npm run typecheck && npm run test`.
- Classifier quality/heuristics: also `npm run eval`.
- Web: typecheck + build.

## Done
- Relevant type/tests/eval pass.
- Classification reasoning/evidence remains inspectable.
- Unverified customs conclusions are not presented as authoritative.
