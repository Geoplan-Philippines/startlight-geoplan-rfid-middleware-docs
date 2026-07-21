# SSI RFID Implementation — Agent Context Brief

**Project:** RFID Implementation for Stores Specialists, Inc. (SSI)
**Brands:** ON and Lacoste
**Go Live Target:** October 1, 2026
**Technical Lead / Backend Owner:** Ace (SSI IT Developer)

---

## What This Project Is

SSI is deploying UHF RFID across its retail ecosystem — warehouses and 100+ stores — to replace manual barcode-driven inventory processes with automated, near-real-time tracking. The implementation covers inbound, outbound, internal movement, sales, and return scenarios. RFID events are captured by hardware readers, aggregated into business-level events by middleware, and posted to downstream enterprise systems.

## The System Landscape

Five parties, each owning a distinct layer:

| System | Owner | Role |
|--------|-------|------|
| GeoPlan Middleware | GeoPlan (vendor) | RFID event capture, tag management, read aggregation. Translates raw EPC reads into logical business events. |
| SSI Middleware | SSI IT (Ace's team) | Custom NestJS/TypeScript integration layer on GCP. Sits between GeoPlan and all partner systems. Handles ETL, master data sync, sale confirmation relay, tag deactivation orchestration, exception routing, and RFID transaction logging. |
| ETP POS | ETP Group (vendor, contact: Sandeep) | Point-of-sale system across all stores. Resolves EPCs locally during checkout. |
| SAP ERP | SSI (PwC as SAP/EWM consultant) | Source of truth for inventory, master data, goods movements. |
| Samooha ERP | SSI | Secondary ERP for specific warehouse/transaction flows. |
| Qlik BI | SSI | Reporting and dashboards. |

**Core architectural principle:** SSI Middleware is a translation layer. Raw RFID reads enter, standard business transactions exit. Partner systems (ETP, Samooha, SAP) never handle RFID internals — EPC-to-SKU translation is invisible to them.

## The Architecture (Finalized)

### Store-Side: Bridge Agent (No Mini PCs)

The original GeoPlan proposal called for Mini PCs in every store. SSI eliminated this to avoid hardware cost across 100+ locations. Instead, a **lightweight NodeJS bridge agent** runs as an independent OS service on each existing ETP POS terminal.

The bridge agent contains 10 internal components: Reader Connector, Read Processor, Local EPC Cache (embedded Redis), Write-Ahead Buffer (SQLite), Localhost API Server (127.0.0.1:8883), Cloud Sync Client (mTLS/MQTTS), Cache Sync Service, Tag Command Handler, Telemetry Reporter, and Watchdog.

### Cloud Tier (GCP)

Pub/Sub for ingestion, GeoPlan for RFID processing, SSI Middleware for partner integration, Cloud SQL for persistence, Device Manager for bridge fleet management, Cloud Monitoring for observability.

### The Checkout Hot Path (Sacred Constraint)

The checkout flow must complete within **3,000ms** (per Q044). The hot path has **zero GeoPlan latency dependency**:

1. Cashier places items on iData A500 flatbed scanner (USB/LAN connected to POS terminal)
2. Scanner reads EPC tags
3. ETP POS resolves EPCs against the bridge agent's **local Redis cache** (sub-5ms)
4. ETP adds items to the bill using its existing POS process
5. **Post-sale only:** ETP sends Sale Confirmation → SSI Middleware → GeoPlan for tag deactivation

EPC is treated as a new lookup attribute in ETP's local product master — not a trigger for real-time middleware validation calls during checkout.

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
SAP (likely source, not yet finalized) → SSI Middleware (ETL, upsert-by-SKU) → Bridge Agent local Redis cache → ETP product master (EPC as lookup attribute)

### Sale Flow
ETP POS → Sale Confirmation → SSI Middleware → GeoPlan (tag deactivation command) → Bridge Agent (execute deactivation on scanner)

### Inventory Events (Warehouse & Store)
GeoPlan captures RFID business events (Goods Receipt, Goods Issue, Stock Transfer, Cycle Count, etc.) → SSI Middleware translates → SAP/Samooha posts inventory movements. Posting rules are aggregated (per shipment/delivery), not per-tag.

## What's Built So Far

- **ICD v1.1** — Interface Control Document covering all GeoPlan APIs, iData scanner APIs, checkout sequence, master data sync flow, error codes, performance targets, logging requirements, open items, and RfidAsset entity model
- **MasterDataSyncModule** — NestJS module for ETL sync; upsert-by-SKU, per-item error isolation, retry logic; `RfidAsset` entity with RFID-specific fields
- **EpcScanProcessingModule** — Deduplication of RFID EPC reads; batched validation queries, pure extractable dedup logic, `// ASSUMPTION` comments marking pending ETP API contract details

## Open Items & Risks

| ID | Item | Impact |
|----|------|--------|
| Q067 | Whether ETP POS calls GCP or the local bridge agent during scanning — architecture gate, unresolved | Blocks final architecture sign-off |
| Q038 | Real-time inventory updates — still open | Affects sync strategy |
| Q039 | Stock mismatch reconciliation between RFID and POS — still open | Affects exception handling design |
| Q045 | How many tags POS reads simultaneously — still open | Affects scanner config |
| WBS gap | ETP Integration Module was entirely absent from the WBS — proposed as module 1.8 with nine subtasks | Schedule risk if not added |
| Master data source | Likely SAP, not formally confirmed | Affects MasterDataSyncModule source connector |
| ETP API contracts | Pending — code carries `// ASSUMPTION` stubs | Blocks EpcScanProcessingModule finalization |
| Architecture diagram | Clean, accurate diagram reflecting full topology remains outstanding | Needed for stakeholder alignment |

## Key People

| Person | Role |
|--------|------|
| Margie Anne Gomez | SSI PM, manages baseline timeline |
| Ralph (Adrian Mallari) | SSI Infrastructure lead |
| Chester, Neil, Patricia, Jai | Core SSI project team |
| Sandeep (Verma) | ETP contact |
| Tristan Marshboe De Jesus | Operations SOP owner |
| Vic Valdon | GeoPlan technical contact |
| Roxzyn Malabanan | PwC EWM consultant |

## Working Conventions

- **Discovery tracker Q-numbers** (Q001–Q078+) are the authoritative reference system across meetings and documents
- **SSI Middleware must appear explicitly** in all shared architecture diagrams — GeoPlan's diagrams have historically omitted it
- **Assumption documentation over premature resolution** — `// ASSUMPTION` comments in code where ETP contracts are pending
- **Checkout hot path is sacred** — any architecture change that routes EPC resolution through cloud during active checkout is rejected
- **Tech stack:** NestJS/TypeScript, TypeORM, Redis, SQLite, GCP (Pub/Sub, Cloud SQL, Device Manager, Cloud Monitoring), mTLS/MQTTS
