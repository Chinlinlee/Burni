---
status: accepted
---

# 非 temporal SearchParameter-derived index policy

`models/mongodb/provisioning` 第一階段只處理 temporal derived indexes。SearchParameter
registry 已能產生 token、reference、string、number、quantity 與 uri 的 executable
query plan，但 executable 不足以證明 MongoDB index 能安全保留 extraction、
projection、array correlation 與 modifier semantics。

## Decision

- 以獨立的 SearchParameter index policy 判斷 lookup/projection 是否 indexable，不在
  FHIR SearchParameter source resource 新增 `indexable` 欄位。
- 只允許 built-in、active、compilable 且通過 policy 的 lookup；database custom
  SearchParameter 維持可執行，但預設不產生 derived index。
- 直接對既有 FHIR nested fields 建立 non-unique B-tree indexes，不新增 shadow fields、
  write-time dual maintenance、backfill 或新的 normalization contract。
- token 使用 system/code 或 system/value correlation；reference 使用 stored
  `reference`；string 只索引 exact projected leaf；number 使用現有 numeric field；
  quantity 使用 value 與 system/code/value patterns；uri 使用 raw URI field。
- 只接受可證明的單一 array correlation；parallel multikey、positional path 與無法
  維持同一 element 語意的 branch 不進 desired manifest。
- number/quantity capability 不宣告 runtime 尚未實作的 `sa`、`eb`、`ap`；string
  contains 與無對應 storage contract 的 prefix semantics 不宣稱有普通 B-tree index。
- Non-temporal entries 與 temporal entries 共用 desired manifest、checksum、lock、
  reconcile 與 verify；index identity 由完整 projection/key/options/policy identity
  決定，physical name 使用 readable prefix 加 stable hash。
- Derived indexes 維持 additive-only、non-unique、無新增 collation/partial/sparse
  constraint；extra 或 mismatch 只報告，不自動刪除；query runtime 不使用 `$hint`。
- 缺少效能 index 時允許 query 退回 COLLSCAN，且不因一般 derived-index drift 阻止
  application readiness。

## Considered Options

- 直接對所有 executable extraction path 建 index：拒絕。Executable query plan 不代表
  multikey correlation、modifier 或 BSON/storage shape 具備 index contract。
- 在 FHIR SearchParameter source 加入 `indexable`：拒絕。這會把 FHIR definition
  semantics 與 Burni/MongoDB deployment capability 混在一起，也無法表達 branch-level
  safety。
- 新增 shadow/materialized search fields：暫不採用。它需要 write path、既有資料
  backfill、read serialization 與 rollback contract，超出本 policy change。
- 為每個 SearchParameter code 建一個 physical index：拒絕。同一 code 可能有多個
  choice/union/projection branch，且不同 lookup 可能共享相同 canonical key。
- 使用 `$hint` 強制 query index：拒絕。這會把 physical index name 綁進 runtime，
  增加 rename、manifest version 與 rollback 的耦合。
- 將缺少效能 index 視為 query failure：拒絕。Index drift 是效能與 deployment
  observability 問題，不應改變 query correctness 或 application availability。

## Consequences

- Desired manifest 會新增非 temporal source 與 policy identity，部署前可透過
  `verify` 找出 missing、extra、mismatch 與 policy/artifact drift。
- 部分 string、URI hierarchy、number/quantity comparator 仍可能使用 COLLSCAN；這是
  明確的 indexed boundary，不代表 query 不可執行。
- 未來若需要 case-folded string、UCUM conversion、URI canonicalization 或 contains
  acceleration，必須另建 storage/query contract，不得直接放寬本 policy。
- MongoDB collection 的 index 數量可能增加；manifest 必須做 canonical key/options
  deduplication，並以 operational verification 監控實際部署成本。
