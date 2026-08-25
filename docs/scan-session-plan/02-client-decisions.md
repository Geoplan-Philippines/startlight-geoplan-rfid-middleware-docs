# Client decisions

## In plain terms

These are the remaining business choices. The KB and current backend do not settle them.

## Provide

1. For Goods Delivery, Customer Returns, and Vendor Returns, name the exact Samooha action that calls Geoplan: **Confirm** or **Post**.
2. For Goods Receipt, state where `Scanning in Progress` starts in the GR workflow and who can unlock a session that never completes.
3. For each flow, state which reader type is used and whether the operator or Samooha chooses the reader.
4. State what Samooha should do when a reader is offline or already in use.
5. Confirm that only Credit Notes and Debit Notes **with inventory movement** are sent to Geoplan.
6. Define the final unknown SKU or EPC behavior. Until confirmed, UAT data must contain only mapped values.
7. For the three Goods Receipt retries, provide the delay or backoff and the failures that qualify. State whether the other three flows use the same retry rule.

Short answers are enough. Screenshots are not needed for these decisions.
