# Samooha Scan Sessions finalization plan

A draft now exists at `src/content/docs/samooha/scan-sessions.mdx`. Keep it marked as a draft until the remaining inputs are complete.

## Already verified

Do not send these again:

- Current Swagger and backend source.
- Session endpoints, fields, response envelope, and `OPEN`, `COMPLETED`, `CANCELLED` states.
- One API key using `x-api-key`.
- The four fixed activity IDs are present in staging after deployment.
- Purchase Invoice, Sales Order, Credit Note, and Debit Note reference rules.
- Goods Receipt returns SKU and quantity. Other flows have no scan-result return leg.
- Three automatic retries followed by manual retry for Goods Receipt transmission failure.
- Duplicate-document rule from `D-073`.
- Existing `src/assets/session-lifecycle.png`, which matches the current three-state backend model.
- Staging base URL, API key management page, and access rules.
- Samooha rate limit: 60 requests per 5 minutes.
- No Scan Sessions UI asset. Samooha consumes the API directly.

## Still needed before final publication

| File | What to provide | Required |
| --- | --- | --- |
| `01-backend-changes.md` | Final backend release that closes or accepts the known contract gaps | Yes |
| `02-client-decisions.md` | Remaining workflow decisions not settled in the KB | Yes |
| `04-uat-examples.md` | Safe examples for the four flows | Yes |

Once these inputs are ready, replace the placeholders with captured staging requests and responses, then remove the draft limitations.
