# Backend gaps — epc-scan-processing (docs assume these are done)

The published docs (`/epc-scan-processing/`, `/scan-activities/`, `/rfid-readers/`) describe the **target contract**. Current code in `ssi-rfid-middleware/` does not yet implement the items below — and that code is **subject to change**, so treat this doc (not the current code) as the spec. Implement so behavior matches the docs.

Envelope/auth/conventions already correct — don't change: `{ statusCode, message, data(+meta) }`, `x-api-key` guard, 100 req/60s, Prisma models in `prisma/schema.prisma`.

---

## GAP 1 — `deviceId` required + validated against a registered reader (HIGH)

**Docs say:** `POST /sessions.deviceId` is **required** and is the **`id` (UUID)** of an **active** registered `RFIDReader`. Unknown reader → `404`; non-active reader → `400`.

**Now:** `StartEpcScanSessionDTO.deviceId` is `@IsOptional() @IsString()`, free text, never validated. `EpcScanSession.deviceId` is `String?`.

**Do:**
- DTO: make `deviceId` required and a UUID (`@IsUUID()`).
- `startSession`: look up `RFIDReader` by **`id` = deviceId** (not `serialNumber`). Not found → `NotFoundException` (`404`). Reject non-`ACTIVE` readers (`INACTIVE`/`MAINTENANCE`) → `400` — mirror the archived-activity behavior (`getSelectableScanActivity` throws `400`); add a matching `getSelectableReader` guard.
- Persist the link (keep the `deviceId` column holding the reader UUID, or add a `readerId` FK to `RFIDReader` — either is fine; FK is cleaner).

_Resolved: match by reader `id` (UUID), not `serialNumber`; inactive reader → `400`._

---

## GAP 2 — Session lifecycle actually drives the reader over HTTPS (HIGH, core)

**Docs say:** `POST /sessions` turns the reader **on** and it scans continuously; `/complete` and `/cancel` turn it **off**.

**Now:** `startSession`/`completeSession`/`cancelSession` only read/write DB rows. No command is ever sent to any reader. The "reader turns on" behavior does not exist.

**Do:**
- Transport is **HTTPS**. On `startSession`, after the reader is resolved, send a **start-scan** HTTPS request to that reader/its agent (use `RFIDReader.ipAddress` / a stored control URL).
- On `completeSession` / `cancelSession`, send **stop-scan** over HTTPS to the same reader.
- **Synchronous:** the start command is awaited. If the reader fails physically (unreachable, error response, timeout), **return that error to the caller** (e.g. `502`/`503` with the reader's message) and do **not** leave a phantom `OPEN` session — roll back / don't create the session. Same idea for stop on complete/cancel: surface the failure.
- The reader/agent then feeds reads back via `POST /sessions/:id/reads`.

_Resolved: HTTPS, synchronous, physical failure returned as an error message._

---

## GAP 3 — Concurrent sessions per reader: ALLOWED (no work, just don't block)

**Resolved:** a second `POST /sessions` on a reader that already has an `OPEN` session is **accepted**. Do **not** add a uniqueness constraint / `409` on `(deviceId, status=OPEN)`. Reads route by `sessionId`, so overlapping open sessions on one reader are permitted. No change required beyond *not* introducing a block.

---

## GAP 4 — Device/bridge key separation: NOT NOW

**Resolved:** `POST /sessions/:id/reads` stays behind the same `x-api-key` guard as integrator endpoints for go-live. No separate device/bridge credentials today. Revisit later.

---

## Verify (docs assume correct; re-check under load)

- `completeSession` / `cancelSession`: `updateMany(status=OPEN)` then re-fetch — confirm the not-open path returns `409` (via `ensureSessionIsOpen`); keep it.
- `appendReads` upsert increments `readCount` and never duplicates `epcs` — matches docs; keep dedup + `normalizeEpc` (trim + upper).
- List endpoint hides `epcs` (only `uniqueCount`) — matches docs; keep.
- `scan-activities`: create normalizes `code` (upper, spaces→`_`), unique → `409`; DELETE is soft-archive (`isActive=false`); archived activity can't start a session (`400`). Matches docs; keep.
- `rfid-readers`: full CRUD already present and matches the RFID Readers doc (GET list `?status`, GET one, POST 201, PATCH, DELETE 204; `serialNumber` unique → `409`). Keep. **One consideration:** `remove()` is a hard `prisma.delete`. Once `deviceId` references a reader, a hard delete orphans session history — docs tell integrators to prefer `status: INACTIVE`. Either enforce soft-retire (block/deny delete when the reader has sessions, or switch delete to set `INACTIVE`), or leave delete hard and rely on the docs' guidance. Decide.

---

## SAP posting — prerequisites for the proposed `/sap/` contract (FUTURE)

The docs page `/sap/` proposes the RFID → SAP goods-movement contract (Geoplan **calls** SAP-hosted endpoints; core-4 movements). Greenfield — no posting code exists. Before that contract can be fulfilled, the RFID side must be able to produce the payload:

1. **`warehouseCode`** — **missing entirely** (no `warehouse`/`plant`/`location` field anywhere in the schema). Add it: either a field on `EpcScanSession`, or a `location`/`plant` field on `RFIDReader` derived onto the session at start. **Primary gap.**
2. **Quantity per SKU** — resolve a completed session's `epcs` → SKU (reuse `epc-assignment` `resolve` / `master-data-sync`) and aggregate a count per SKU. Needs a new aggregation step; EPC→SKU data already exists.
3. **`movementType` + `documentRef`** — map `scanActivity` → `movementType` (enum: `GOODS_RECEIPT`/`GOODS_ISSUE`/`STOCK_TRANSFER`/`INVENTORY_ADJUSTMENT`); carry `transactionReference` as `documentRef` (+ optional `documentType`).
4. **Posting module** — a new outbound client that builds the envelope, calls SAP, and handles response `status` (`POSTED`/`FAILED`/`PARTIAL`), retries with an idempotency key (use `scanSessionId`), and routes failures to `exception-handling` (`POSTING_FAILED` already exists in `ExceptionType`).

Contract details still open (see the page's "To confirm with SAP"): SAP auth + base URL, idempotency, partial-post semantics, batch/serial fields, plant vs storage-location granularity, push-vs-pull for source documents.
