## Why

目前 MongoDB provisioning 只支援 temporal SearchParameter-derived indexes。Registry
雖然已能編譯 token、reference、string、number、quantity 與 uri query plan，但這些
plan 尚沒有經過 SearchParameter-specific index policy、array correlation 與 runtime
semantic compatibility 驗證，因此無法安全地產生 derived index。

本變更將為六種非 temporal search type 建立可審查、可重現且不改變搜尋結果的
derived-index contract，讓既有 provisioning pipeline 能在明確 policy 下改善查詢效能。

## What Changes

- 新增獨立的 non-temporal SearchParameter index policy，將 indexability 視為
  lookup/projection 層能力，而不是 FHIR SearchParameter source 欄位。
- 只納入 built-in、active、compilable 且通過 policy 的 lookup；database custom
  SearchParameter 維持可執行，但預設不產生 derived index。
- 直接對既有 FHIR nested fields 建立 non-unique MongoDB B-tree indexes，不新增
  shadow fields、canonicalization 或新的 write/backfill contract。
- 為 token、reference、string、number、quantity 與 uri 定義 deterministic key
  patterns、array correlation boundary、unsupported modifier diagnostics 與
  deduplication identity。
- 將 non-temporal derived entries 合併至既有 desired manifest，使用 source、
  policy version、完整 index identity 與 readable prefix plus stable hash 命名。
- 修正 number 與 quantity capability matrix，不再宣告 runtime 尚未支援的
  `sa`、`eb`、`ap` comparator。
- 維持 additive-only reconcile、extra index reporting、COLLSCAN fallback、無
  `$hint` 與不改變 query result semantics。
- 新增 deterministic manifest、policy、compatibility、reconcile 與 MongoDB
  integration test contract，以及可提交的 manifest artifact 驗證。

## Capabilities

### New Capabilities

- `mongodb-searchparameter-derived-indexes`: 定義非 temporal SearchParameter-derived
  indexes 的 policy、identity、manifest、compatibility、provisioning 與 verification。

### Modified Capabilities

無。

## Impact

- 影響 SearchParameter compiler capability metadata、projection/index policy adapter、
  desired manifest generator 與 MongoDB provisioning/reconciliation。
- 影響 number/quantity operator capability diagnostics，但不新增
  `sa`、`eb`、`ap` 的 runtime semantics。
- 新增 token、reference、string、number、quantity、uri 的 manifest 與測試 artifact。
- 不改變 FHIR API response、query hit-set、custom SearchParameter execution、
  resource schema、既有 temporal index contract 或 application readiness 預設行為。
