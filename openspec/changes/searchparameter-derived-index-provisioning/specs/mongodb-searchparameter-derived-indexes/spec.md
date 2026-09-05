## Purpose

定義非 temporal SearchParameter-derived indexes 的準入、key identity、語意邊界與
MongoDB desired-state 行為，讓索引只能改善查詢效能而不改變 FHIR 搜尋結果。

## ADDED Requirements

### Requirement: Restrict derived indexes to approved built-in lookups

Derived indexes SHALL 只由 built-in、active、compilable 且通過對應 search type
index policy 的 lookup 產生。Database custom SearchParameter 即使可執行，預設也
SHALL NOT 產生 derived index。Derived indexes SHALL 只建立在 resource collections。

#### Scenario: Include an approved built-in lookup

- **WHEN** built-in lookup 為 active、compilable，且其 extraction、projection、
  datatype 與 array shape 通過 index policy
- **THEN** desired manifest SHALL 包含該 lookup 的一個或多個 deterministic derived indexes

#### Scenario: Exclude executable custom SearchParameter

- **WHEN** database custom SearchParameter 可以產生 executable query plan
- **THEN** query execution SHALL 保留，但 desired derived-index manifest SHALL 不包含該 lookup

#### Scenario: Exclude disabled or unsupported lookup

- **WHEN** lookup disabled、無 executable plan，或 policy 回報 unsafe/unsupported diagnostic
- **THEN** 該 lookup SHALL 不得進入 desired derived-index manifest，且 diagnostic SHALL
  可重現地說明排除原因

### Requirement: Define type-specific derived index key patterns

Derived index identity SHALL 以 resource type、extraction branch、projected field set、
search type、key pattern、options 與 policy version 決定，不得只以 SearchParameter code
決定。完全相同的 canonical key pattern 與 options SHALL deterministic deduplicate。

Token index SHALL 支援 CodeableConcept/Coding 的 system-code correlation，以及
Identifier/ContactPoint 的 system-value correlation；並可為 code/value-only lookup
建立 single-field index。Reference index SHALL 以 stored `reference` field 為主。
String index SHALL 只支援 exact projected leaf。Number index SHALL 使用現有 numeric
field。Quantity SHALL 支援 value single-field pattern 與 system-code-value compound
pattern。URI SHALL 使用 raw URI single-field pattern。

#### Scenario: Generate token correlation indexes

- **WHEN** token lookup 投影至 Coding、CodeableConcept、Identifier 或 ContactPoint
- **THEN** manifest SHALL 產生與 system/code 或 system/value correlation 相容的 key
  pattern，並在需要時產生 code/value-only key pattern

#### Scenario: Generate reference index

- **WHEN** reference lookup 通過 extraction 與 target policy
- **THEN** manifest SHALL 以 stored `reference` path 產生 non-unique index，且不得以
  `Reference.type` index 取代 runtime target guard

#### Scenario: Generate exact string indexes

- **WHEN** string lookup 使用 exact modifier 且 projected leaf 通過 policy
- **THEN** manifest SHALL 對每個 projected leaf 產生 equality index，Address 或
  HumanName 的多個 leaf SHALL 分別產生 index

#### Scenario: Generate numeric and quantity indexes

- **WHEN** number 或 quantity lookup 使用現有 BSON numeric storage 且通過 policy
- **THEN** number SHALL 產生 numeric path index；quantity SHALL 可產生 value-only
  index 與完整 system-code-value compound index

#### Scenario: Generate raw URI index

- **WHEN** uri lookup 通過 policy
- **THEN** manifest SHALL 對 raw URI path 產生 single-field index，且 exact、above、
  below SHALL 共用該 raw key identity

### Requirement: Preserve query semantics and reject unsupported index modes

Derived-index provisioning SHALL 改善效能但不得改變 query hit-set、FHIR response 或
stored value semantics。Policy SHALL 不得宣稱普通 B-tree 支援任意 case-insensitive
contains/prefix semantics。Number 與 quantity 的 `sa`、`eb`、`ap` comparator 在 runtime
尚未支援前 SHALL 不屬於 approved capability；string `contains` 與未具備對應 storage
contract 的 prefix mode SHALL 不產生 derived index。

#### Scenario: Exclude unsupported string contains index

- **WHEN** string lookup 使用 contains，或其 prefix semantics 無法由現有 raw storage
  的普通 B-tree 安全支援
- **THEN** query SHALL 保留既有執行語意，但該 lookup SHALL 不進入 derived-index manifest

#### Scenario: Exclude unsupported numeric comparator

- **WHEN** number 或 quantity lookup 使用 runtime 尚未實作的 `sa`、`eb` 或 `ap`
- **THEN** capability validation SHALL 回報 unsupported，且不得以該 comparator 宣稱
  derived-index support

#### Scenario: Preserve raw value semantics

- **WHEN** token、reference、string、number、quantity 或 uri lookup 產生 derived index
- **THEN** system SHALL 不新增大小寫、URI、UCUM/unit 或 reference representation
  normalization，且 index SHALL 不改變既有 query result

### Requirement: Enforce array correlation safety

Index policy SHALL 保留同一 array element 的 correlation semantics。單一 array
correlation scope 可產生 derived index；平行 array ancestors、positional path 或
無法證明 element correlation 的 shape SHALL 被拒絕。Choice 或 union branches SHALL
各自產生 identity，不得以不相關 branch 合併成一個 key。

#### Scenario: Accept a correlated array branch

- **WHEN** extraction branch 只有可驗證的單一 array scope，且 query predicates 可綁定
  到同一 element
- **THEN** 該 branch SHALL 可進入 manifest，並保存足以驗證 correlation 的 metadata

#### Scenario: Reject parallel multikey branch

- **WHEN** extraction branch 經過平行 array ancestors，或 system/value predicates
  可能來自不同 array elements
- **THEN** branch SHALL 不得產生 derived index，且 SHALL 回報穩定 unsafe-shape diagnostic

#### Scenario: Separate choice branches

- **WHEN** lookup 包含多個 choice 或 union branches
- **THEN** 每個通過 policy 的 branch SHALL 有獨立 deterministic identity，任何 unsafe
  branch SHALL 不使其他安全 branch 被錯誤合併

### Requirement: Persist deterministic manifest identity

Non-temporal derived entries SHALL 合併至既有 desired manifest，並保存 source、
resource type、SearchParameter identity、search type、extraction/projection metadata、
policy version、完整 key identity、options 與 deterministic physical index name。
Physical name SHALL 使用 readable prefix 加 stable identity hash；manifest SHALL 保存
完整 identity，不得依賴截短名稱恢復 identity。

#### Scenario: Generate deterministic derived manifest

- **WHEN** 相同 built-in registry snapshot、resource type map 與 policy version 重複產生
  manifest
- **THEN** entries、ordering、physical names 與 manifest checksum SHALL 完全一致

#### Scenario: Deduplicate equivalent keys

- **WHEN** 不同 lookup 產生完全相同的 canonical key pattern 與 options
- **THEN** desired manifest SHALL 只保存一個 physical index identity，並保留可追蹤的
  provenance references

#### Scenario: Detect policy identity drift

- **WHEN** policy version、source artifact identity 或完整 key identity 與已保存 manifest
  不一致
- **THEN** verify SHALL 回報 manifest identity drift，不得靜默視為相容

### Requirement: Reconcile indexes additively without runtime hints

Derived indexes SHALL 是 non-unique、無新增 collation、partial filter 或 sparse
constraint 的 performance indexes。Provisioning SHALL 沿用 additive-only reconciliation：
missing indexes 可建立，compatible indexes 視為完成，extra 或 mismatch indexes 只回報
而不自動刪除。Query runtime SHALL 不依賴 physical index name 或強制 `$hint`。

#### Scenario: Create a missing derived index

- **WHEN** desired manifest 包含 resource collection 尚不存在的 derived index
- **THEN** provision SHALL 建立該 non-unique index，並在結果中保存其 identity 與成功狀態

#### Scenario: Report derived index drift

- **WHEN** actual index 缺少 desired index、key/options 不一致，或存在未宣告 extra index
- **THEN** verify SHALL 回報 missing、mismatch 或 extra drift，且 SHALL NOT 自動刪除
  actual index

#### Scenario: Serve without a performance index

- **WHEN** derived index 缺失但 query plan 與資料語意仍有效
- **THEN** application SHALL 可繼續執行查詢並允許 COLLSCAN，provisioning/verify
  diagnostics SHALL 明確標示效能索引缺失
