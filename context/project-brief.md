# SSI RFID Implementation — Agent Context Brief

**Project:** RFID Implementation for Stores Specialists, Inc. (SSI)
**Brands:** ON and Lacoste
**Go Live Target:** October 1, 2026
**Technical Lead / Backend Owner:** Ace (SSI IT Developer)

---

## What This Project Is

SSI is deploying UHF RFID across its retail ecosystem — warehouses and 100+ stores — to replace manual barcode-driven inventory processes with automated, near-real-time tracking. The implementation covers inbound, outbound, internal movement, sales, and return scenarios. RFID events are captured by hardware readers, aggregated into business-level events by middleware, and posted to downstream enterprise systems.

## The System Landscape

Four parties, each owning a distinct layer:

| System | Owner | Role |
|--------|-------|------|
| Geoplan RFID Middleware (= "SSI Middleware") | SSI IT (Ace's team), NestJS/TypeScript on GCP | One system, two names — external-facing docs/API brand it "Geoplan"; internally called "SSI Middleware." Not two separate layers. RFID event capture, tag/read aggregation, ETL, master data sync, exception routing, RFID transaction logging. Partner systems (ETP, Samooha) call its REST API directly (`x-api-key`, base `rfid-middleware.geoplanph.com/api/v1`) — see `rfid-middleware-docs` repo for the live contract. |
| ETP POS | ETP Group (vendor, contact: Sandeep) | Point-of-sale system across all stores. Opens/polls/completes a scan session against the middleware live during checkout (see Checkout Hot Path below — updated). |
| SAP ERP | SSI (PwC as SAP/EWM consultant) | Source of truth for inventory, master data. Also the target for a proposed (not live) goods-movement posting API — SAP hosts, middleware is the client. |
| Samooha ERP | SSI | Secondary ERP for specific warehouse/transaction flows. Same middleware API as ETP, different scan activities. |
| Qlik BI | SSI | Read-only DB access to the middleware (no REST API) — its own queries/dashboards over the schema. |

**Core architectural principle:** the middleware is a translation layer. Raw RFID reads enter, standard business transactions exit. Partner systems (ETP, Samooha, SAP) never handle RFID internals — EPC-to-SKU translation is invisible to them.

## The Architecture (Finalized)

### Store-Side: Bridge Agent (No Mini PCs)

The original Geoplan proposal called for Mini PCs in every store. SSI eliminated this to avoid hardware cost across 100+ locations. Instead, a **lightweight NodeJS bridge agent** runs as an independent OS service on each existing ETP POS terminal.

The bridge agent contains 10 internal components: Reader Connector, Read Processor, Local EPC Cache (embedded Redis), Write-Ahead Buffer (SQLite), Localhost API Server (127.0.0.1:8883), Cloud Sync Client (mTLS/MQTTS), Cache Sync Service, Tag Command Handler, Telemetry Reporter, and Watchdog.

### Cloud Tier (GCP)

Pub/Sub for ingestion, Geoplan RFID Middleware (RFID processing + partner integration, one system), Cloud SQL for persistence, Device Manager for bridge fleet management, Cloud Monitoring for observability.

### The Checkout Hot Path (updated — supersedes earlier "zero latency" design)

Earlier design assumed local-only EPC resolution (bridge Redis cache, no live middleware call during checkout). **Confirmed superseded** — current flow (per `rfid-middleware-docs`, `epc-scan-processing.mdx`) makes live middleware calls during checkout:

1. Cashier taps **Start** → `POST /epc-scan-processing/sessions` (scan activity + reader `deviceId`) → session `OPEN`, reader turns on
2. Reader streams EPC reads; bridge agent appends them to the session server-side
3. POS polls `GET /sessions/:id` for live deduped EPC count/list while scanning
4. Cashier taps **Stop** → `POST .../complete` → session `COMPLETED`, final EPC list returned, reader off
5. POS resolves the returned EPCs → SKUs, bills
6. Abandoned order → `POST .../cancel` instead of complete

**3,000ms budget (Q044) — status unclear now the flow includes live round trips; reconfirm whether it still holds.** iData A500 flatbed scanner still USB/LAN into POS terminal; bridge agent still relays reads, just not purely local-cache-only anymore.

## Hardware

- **POS readers:** iData A500 flatbed scanners, 0–50cm read range, USB/LAN connection, EPC Gen2
- **Handheld readers:** For cycle counts, stock checks, picking, exception handling
- **Fixed readers:** Docks, gates, packing stations (warehouse)
- **Frequency:** UHF 860–960 MHz (no changes needed per Q004)

## Key Business Rules

- RFID and barcode scanning work **in parallel** (not a full replacement)
- Tags are **one-time use** (reusable tags are a future plan)
- Sales returns do **not** require RFID — barcode/SKU is sufficient
- Cashier visual validation is required before final billing
- Average basket size: ~2 items (Lacoste peak days)
- Mixed baskets (RFID + non-RFID items) are supported
- Deduplication is handled by middleware before database persistence (deduplicate on EPC)
- RFID events are logged for audit (five log categories: Tag Read, Transaction Session, POS Integration, Exception Handling, Fallback)

## Integration Contracts

### Master Data Flow
SAP (likely source, not yet finalized) → middleware (ETL, upsert-by-SKU) → Bridge Agent local Redis cache → ETP product master (EPC as lookup attribute)

### Sale Flow
ETP POS → Sale Confirmation → middleware → tag deactivation command → Bridge Agent (execute deactivation on scanner)

### Inventory Events (Warehouse & Store)
Middleware captures RFID business events (Goods Receipt, Goods Issue, Stock Transfer, Cycle Count, etc.), translates, SAP/Samooha posts inventory movements. Posting rules are aggregated (per shipment/delivery), not per-tag.

### RFID Middleware API (ETP/Samooha-facing — now fully specified)
Source of truth: `rfid-middleware-docs` repo. Base `https://rfid-middleware.geoplanph.com/api/v1` (not yet provisioned/live), auth `x-api-key` (`rfid_` prefix, issued by Geoplan/SSI), rate limit 100 req/60s.

- **Scan sessions** (`epc-scan-processing`) — state machine `OPEN` → `/complete` → `COMPLETED`, or `OPEN` → `/cancel` → `CANCELLED`. Both terminal, `409` if already terminal. `POST /sessions` (scanActivityId + deviceId + optional transactionReference), `GET /sessions/:id` (poll), `GET /sessions` (list), `POST /sessions/:id/complete`, `POST /sessions/:id/cancel`. Reads (`POST /sessions/:id/reads`) are reader/bridge-only, partners don't call it.
- **Scan activities** (`scan-activities`) — GET-only for partners. Dashboard-managed (create/edit/archive), not via API. e.g. `POS_SALE`, `GOODS_RECEIPT`, `STOCK_TRANSFER`, `CYCLE_COUNT`.
- **RFID readers** (`rfid-readers`) — GET-only for partners. SSI registers/maintains devices in the dashboard.
- **Exceptions** (`exceptions`) — 4 types: `UNKNOWN_EPC`, `STOCK_MISMATCH`, `POSTING_FAILED`, `DEACTIVATION_FAILED`. Middleware raises them internally; partners only `GET` list/detail and `POST /:id/resolve`.

### SAP Goods-Movement Posting (proposed, draft — not live)
Direction reversed from the rest of this contract: **SAP hosts, middleware is the client.** `POST /rfid/goods-receipts|goods-issues|stock-transfers|inventory-adjustments`, one shared envelope (`movementType`, `documentRef`, `warehouseCode`, `scanSessionId`, `lines[]` with sku/gtin/quantity/epcs). Auth scheme TBD (not `x-api-key`). See `sap.mdx` "To confirm with SAP" for the open questions (idempotency, partial-post handling, warehouseCode granularity).

## What's Built So Far

- **ICD v1.1** — Interface Control Document covering all Geoplan APIs, iData scanner APIs, checkout sequence, master data sync flow, error codes, performance targets, logging requirements, open items, and RfidAsset entity model
- **MasterDataSyncModule** — NestJS module for ETL sync; upsert-by-SKU, per-item error isolation, retry logic; `RfidAsset` entity with RFID-specific fields
- **EpcScanProcessingModule** — Deduplication of RFID EPC reads; batched validation queries, pure extractable dedup logic. `// ASSUMPTION` stubs may now be resolvable — ETP-facing contract is fully specified in `rfid-middleware-docs` (see API section above); confirm module code matches
- **rfid-middleware-docs** — Astro/Starlight docs site, full partner-facing API reference (sessions, activities, readers, exceptions, auth) + ETP/Samooha integration walkthroughs

## Open Items & Risks

| ID | Item | Impact |
|----|------|--------|
| Q067 | Resolved this pass: ETP POS calls the middleware live (session open/poll/complete), not local-bridge-only | Reconfirm 3,000ms budget still holds w/ live calls |
| Q038 | Real-time inventory updates — still open | Affects sync strategy |
| Q039 | Stock mismatch reconciliation between RFID and POS — still open. `STOCK_MISMATCH` exception type exists in the API but reconciliation logic/ownership still undefined | Affects exception handling design |
| Q045 | How many tags POS reads simultaneously — still open | Affects scanner config |
| WBS gap | ETP Integration Module was entirely absent from the WBS — proposed as module 1.8 with nine subtasks | Schedule risk if not added |
| Master data source | Likely SAP, not formally confirmed | Affects MasterDataSyncModule source connector |
| ETP API contracts | Mostly resolved: partner-facing contract fully specified in `rfid-middleware-docs` (base URL flagged not-yet-provisioned). Confirm `EpcScanProcessingModule` code matches | Was blocking finalization |
| Architecture diagram | `architecture-diagram.png` (in `rfid-middleware-docs`) labels the whole system "Geoplan RFID MW" only, doesn't surface "SSI Middleware" anywhere. Same system per this session, but naming could confuse readers who know it as SSI Middleware | Low, cosmetic/naming only |

## Key People

| Person | Role |
|--------|------|
| Margie Anne Gomez | SSI PM, manages baseline timeline |
| Ralph (Adrian Mallari) | SSI Infrastructure lead |
| Chester, Neil, Patricia, Jai | Core SSI project team |
| Sandeep (Verma) | ETP contact |
| Tristan Marshboe De Jesus | Operations SOP owner |
| Vic Valdon | Geoplan technical contact |
| Roxzyn Malabanan | PwC EWM consultant |

## Working Conventions

- **Discovery tracker Q-numbers** (Q001–Q078+) are the authoritative reference system across meetings and documents
- **SSI Middleware must appear explicitly** in all shared architecture diagrams — Geoplan's diagrams have historically omitted it
- **Assumption documentation over premature resolution** — `// ASSUMPTION` comments in code where ETP contracts are pending
- **Checkout hot path is sacred** — any architecture change that routes EPC resolution through cloud during active checkout is rejected. **Conflict, unresolved:** this rule contradicts the now-confirmed-current checkout flow above (live session open/poll/complete calls). Either this rule is stale or the live-call flow needs reconciling with it — flag to Ace, don't assume either way
- **Tech stack:** NestJS/TypeScript, TypeORM, Redis, SQLite, GCP (Pub/Sub, Cloud SQL, Device Manager, Cloud Monitoring), mTLS/MQTTS
