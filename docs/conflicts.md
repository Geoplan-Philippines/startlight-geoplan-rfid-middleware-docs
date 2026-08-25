# Remaining Samooha documentation conflicts

Reviewed 2026-08-25 against `C:\Users\ppp\Documents\ssi_project`, the current documentation, and the middleware implementation.

## Master-data delta call direction

| Source | Current position |
| --- | --- |
| SSI knowledge base | Samooha is the caller for integration exchanges. Geoplan does not call Samooha. |
| Current middleware | Samooha can trigger `POST /master-data-sync/run`; Geoplan then fetches the configured Samooha product endpoint. |

The implemented pull sequence conflicts with the KB call model. The public page labels it as the current backend operation. Do not label it the final agreed contract until the call direction is confirmed.

## Rate-limit enforcement

| Source | Current position |
| --- | --- |
| Final Samooha documentation and KB decision `D-053` | 60 requests per 5 minutes |
| Current middleware | 100 requests per 60 seconds |

The published Samooha value is settled. Middleware enforcement must be changed before deployment matches the contract.

## Resolved in the documentation

- Samooha master data now has its own page.
- Obsolete route redirects were removed.
- Published Samooha pages no longer advertise 100 requests per 60 seconds.
- The product payload is identified as the Samooha integration payload, not an internal database schema.
- All four fixed scan activity IDs are confirmed in staging.

Scan-session implementation gaps and missing UAT examples are tracked in `docs/scan-session-plan/`. They are not source conflicts.
