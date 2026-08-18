# Docs ↔ knowledge-base conflicts

Findings only — nothing here has been changed in the docs. Scope: **Samooha master data**. Other pages look inconsistent too; not investigated (see the last section).

Compared: this repo's `src/content/docs/` against the knowledge base at `C:\Users\ppp\Documents\ssi_project` (`ai/knowledge/integrations/master-data-sync.md`, `ai/knowledge/integrations/samooha-geoplan.md`, `ai/knowledge/07-data-and-identifiers.md`, `ai/registers/decisions.md`, `ai/registers/open-questions.md`), plus the middleware repo `C:\Users\ppp\Documents\Geoplan\ssi-rfid-middleware` for what is actually built.

Reviewed 2026-08-17.

---

## 1. No master-data documentation exists, and the old page contradicted the agreed design

**Docs:** `src/content/docs/master-data-sync.mdx` was deleted in `7bc5519`; `astro.config.mjs:8` still redirects `/master-data-sync` → `/`. Nothing documents master data today.

**The deleted page** described Geoplan **pulling** a catalogue from a configured source (`MASTER_DATA_SYNC_URL`, mock host `mock-master-data.geoplanph.com`) and published `GET /master-data-sync`, `/master-data-sync/delta`, `/master-data-sync/status`, `POST /master-data-sync/run`.

**KB:** direction is **Samooha → Geoplan**, initial load by **CSV**, deltas by **API** (`D-069`, 2026-08-14).

**Code has also moved on:** the list and delta endpoints now live at `GET /products` and `GET /products/delta`; source configuration is `/master-data-sources` (probe → create → activate); `master-data-sync` retains only `GET /status` and `POST /run`. So the old page was stale against both the KB and the code.

**Impact:** the new page (`samooha/master-data.mdx`) documents the agreed design only and states no endpoints — because none are agreed for master data. If an endpoint-level contract is wanted, decide item 2 first.

---

## 2. Push vs pull — unresolved, and the built product picks a side

**Built:** Geoplan fetches from a source URL the client configures. Samooha would have to **expose** a paginated product endpoint with an `updatedAfter` filter and `isDeleted` tombstones.

**KB:** master-data direction is recorded as a Samooha → Geoplan **push**, but the caller is explicitly unconfirmed → `OQ-065`. Separately, `D-057` makes **Samooha the caller for every transaction exchange**, since Geoplan exposes no public webhooks — the opposite arrangement.

**Impact:** the two integrations would call in opposite directions. The new page deliberately names no caller. This is the single most load-bearing open item for master data.

---

## 3. CSV initial load has no implementation

**KB:** `D-069` — initial master-data load is a **CSV file**.

**Code:** no CSV path anywhere in the middleware. `master-data-sync` and `master-data-sources` are URL-fetch only.

**Also open:** `OQ-105` — manual CSV upload into the RFID platform (which datasets, which users, what permissions) was raised at Day 01 and never scoped.

**Impact:** an agreed mechanism with no build behind it. Either the CSV path gets built, or the initial load rides the same API channel and `D-069` needs restating.

---

## 4. Rate limit published in the docs ≠ the limit agreed with Samooha

**Docs:** `100 requests / 60s` — `scan-activities.mdx:16,58`, `epc-scan-processing.mdx:16,200`, `rfid-readers.mdx:14,70`, `exceptions.mdx:118`.

**KB:** `D-053` — Geoplan applies **60 requests / 5 minutes** as custom anti-loop protection for the Samooha integration; no other third-party limit; to be re-assessed at test deployment.

**Impact:** different number *and* different window. A nightly master-data sync of ~100k articles is exactly the traffic shape this decides. One of the two is wrong — the new page states no rate limit rather than pick.

---

## 5. The published product-master schema is Geoplan-shaped, not Samooha-shaped

**Docs:** `qlik.mdx:24` — `master_data_sync` holds `sku`, `gtin`, `productName`, `epc`/`tid`. The deleted master-data page published the same field names as the contract.

**KB:** Samooha's identifiers are **SKU / item code**, **EAN carried in the product-master Barcode field** (`D-058`), and the **VPM code**. Whether the vendor product mapping carries GTIN/EAN at all is still unconfirmed → `OQ-122`. Field-level schemas are unagreed → `OQ-060`.

**Impact:** not necessarily wrong internally — Geoplan owns adaptation — but publishing `gtin` as the field a partner supplies prescribes a Geoplan-owned source schema, which the repo writing rules say to avoid, and it presumes `OQ-122`.

---

## 6. `UNKNOWN_EPC` states a behaviour that isn't agreed

**Docs:** `samooha/index.mdx:102`, `etp-pos/index.mdx:100`, `exceptions.mdx:26` — "a scanned EPC has no matching master data", presented as a resolved exception type.

**KB:** `OQ-056` — behaviour when a scanned EPC/SKU is **not** in the synced master is open. `D-076` names the warehouse exception categories (no-reads, duplicates, unknown EPCs, API failures) but not the handling rule.

**Impact:** low for the exception label itself; the gap is that nothing tells Samooha what happens to the document line when the SKU is missing. Sharpened by `D-059` (payloads carry SKU only) and `OQ-063` (a same-day SKU won't be in last night's sync).

---

## 7. The overview page files master data under dashboard setup

**Docs:** `index.mdx:12` — "setup is already done in the Geoplan dashboard: EPC assignment, master data sync, your API key…", i.e. out of scope for the reference.

**KB:** for Samooha, master data is a **nightly interface from Samooha**, not a dashboard task, and `D-059` makes it a hard dependency of every transaction.

**Impact:** hides the dependency from the audience most affected by it.

---

## Adjacent — spotted, not investigated

Out of scope for this pass; listed so they aren't lost.

- **Scan activities on the Samooha page** (`samooha/index.mdx:8,13,45-47`) list `GOODS_RECEIPT`, `STOCK_TRANSFER`, `CYCLE_COUNT`. KB scope is four flows — Goods Receipt, Goods Delivery, Customer Returns, Vendor Returns (`D-042` `D-045` `D-046` `D-051`). Cycle counting, put-away, picking and packing are explicitly **out of scope for RFID** (`D-043`); WH → Store stock transfer is out of scope (`D-015`).
- **`transactionReference` example** `GRN-004521` (`samooha/index.mdx:59`). `D-070` sets the unique document identifier per flow: Goods Receipt = **Purchase Invoice**, Goods Delivery = **Sales Order**, Customer Returns = **Credit Note**, Vendor Returns = **Debit Note** — chosen precisely because a GRN can be deleted and recreated.
- **No documentation of the pre-scan document push** (Samooha → Geoplan, at document creation for GR, at confirmation/posting for the other three, `D-061`), nor of the goods-receipt return leg (`D-042`) and its "Scanning in Progress" lock.
- **`sap.mdx`** publishes a `GET /rfid/documents` pull and a SAP-hosted posting contract. `D-021` — SAP is not in the RMK phase. Fine as a separate track, but it is the reverse call direction from everything else on the site.
