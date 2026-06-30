# Agent brief — Geoplan RFID middleware docs

Context for the next agent. Read before editing docs.

## #1 rule — no fabrication

Document only what exists in the real codebase `../ssi-rfid-middleware`. Never invent
hosts, paths, endpoints, params, or fields. Unknowns are marked **"to confirm"**, not guessed.
Verify against `src/modules/**` + `prisma/schema.prisma` before writing. If unsure, ask.

## What this is

Integration docs (Astro Starlight) for **ETP POS** (POS) and **Samooha** (WMS) engineers.
Write for engineers; jargon ok; concise; tables/examples over prose; no intro/filler.

## The integration (real)

- Geoplan = RFID middleware. Reads provider product master, links each `sku` to `epc`/`tid`.
- Providers are the master-data **source**. Geoplan **syncs** from a source URL
  (`MASTER_DATA_SYNC_URL`), nightly ~00:00 Asia/Manila, full first then delta.
- **Source today = the mock** `mock-master-data.geoplanph.com/api/v1/products`. The
  `/api/v1/products` path + its rich shape belong to the MOCK, not a provider contract.
  Real provider endpoints/auth are **to confirm**.

## Real master-data-sync API (this is what the doc documents)

Geoplan's own endpoints. Global prefix `api`, version `v1`. All behind `x-api-key`. Base URL
`https://rfid-middleware.geoplanph.com/api/v1` — **not yet provisioned** (show it, flag it).

| method | path | query |
| --- | --- | --- |
| GET | `/api/v1/master-data-sync` | `page`(≥1,def 1), `limit`(1–50,def 10), `sku`, `gtin`, `productName` (ci contains) |
| GET | `/api/v1/master-data-sync/delta` | `since`(ISO), `limit`(1–1000,def 1000) |
| GET | `/api/v1/master-data-sync/status` | `historyLimit`(1–50,def 10) |
| POST | `/api/v1/master-data-sync/run` | `lastSyncAt`(ISO), `full`(bool) → 200 |

- `MasterDataSync` row (`schema.prisma`): `id, sku(unique), gtin, productName, epc?, tid?, createdAt, updatedAt`.
- Success envelope (`ResponseInterceptor`): `{ statusCode, message:"Success", data }` (+ `meta` on paginated).
- Error envelope (`HttpExceptionFilter`): `{ statusCode, message, error, path, timestamp }`.
- Rate limit (`ThrottlerModule`): 100 req / 60s. Auth: `ApiKeyAuthGuard` global; keys never expire.
- `run` pulls from source (mock today), upsert by `sku`, deletes→tombstone; checkpoint = source
  `meta.syncTimestamp`, stored on success; source non-2xx → `503`, checkpoint not advanced.

## Other modules (exist, NOT yet documented)

`api-keys`, `epc-assignment`, `epc-scan-processing`, `rfid-readers`, `exception-handling`.
Out of current doc scope. Don't reference until asked.

## Docs structure (shared ref + thin pages)

- `authentication.mdx` — general `x-api-key` scheme (issued by Geoplan, never expires).
- `master-data-sync.mdx` — the 4 real endpoints above (canonical reference).
- `etp-pos/index.mdx`, `samooha/index.mdx` — thin; link to the two pages + provider specifics (to confirm).
- `index.mdx` — minimal landing (cards + diagram), no intro.
- `astro.config.mjs` — sidebar; redirects `/contract/*` → `/master-data-sync`.

## Resolved

- Doc content = **Geoplan's real master-data-sync endpoints** (not a provider feed contract).
- Base URL: show `rfid-middleware.geoplanph.com`, marked **not live**.
- Sync TZ ~00:00 Asia/Manila; keys never expire; mock currently open (key enforcement later).

## Open / to-confirm

- Per-provider real source endpoint/access + auth (ETP, Samooha).
- Per-provider field mapping → `sku, gtin, productName`.
- When `rfid-middleware.geoplanph.com` goes live.
