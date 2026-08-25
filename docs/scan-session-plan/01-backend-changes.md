# Backend changes

## In plain terms

The current API can store EPC reads in a session, but it does not yet implement the complete Samooha transaction flow. Give me the final backend release after the gaps below are closed or formally accepted.

## Current gaps

| Gap | Current backend | Required Samooha behavior |
| --- | --- | --- |
| Transaction intake | No endpoint accepts Goods Receipt, Goods Delivery, Customer Return, or Vendor Return documents | Samooha sends each transaction with `POST` |
| Goods Receipt result | Session completion returns EPC values | Samooha retrieves quantity per SKU, with no EPC values |
| Reader control | `deviceId` is optional text; starting a session does not start or validate a reader | Final reader start, stop, offline, and busy behavior |
| Duplicate documents | `transactionReference` is not unique | Apply the agreed completed-block, open-overwrite, and manual-resend rules |
| Session limits | No timeout or concurrent-session rule | Final timeout, abandoned-session, and per-reader concurrency behavior |
| Rate limiting | 100 requests per 60 seconds | 60 requests per 5 minutes for Samooha |
| Swagger schemas | Live Swagger lists DTO names but omits their fields | Publish complete request and response schemas |

## Provide

- Final commit, pull request, tag, or release number.
- Deployment environment and deployment date.
- Final OpenAPI or the updated live Swagger URL.
- Short release note for any gap intentionally left for a later release.

No manually written field list is needed. I will derive it from the final backend.
