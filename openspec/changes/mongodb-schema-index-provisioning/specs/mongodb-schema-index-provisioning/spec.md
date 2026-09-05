## Purpose

定義在關閉 Mongoose 自動 collection 與 index provisioning 時，Burni 如何以可重跑、
可驗證且可追蹤的方式建立 MongoDB collections、baseline indexes 與 temporal
SearchParameter-derived indexes。

## ADDED Requirements

### Requirement: Provision all application collections

Provisioning SHALL 依 application model catalog 建立所有 resource、history 與 static
collections。Collection provisioning SHALL 與 model registration 分開表示，且重複執行
不得因 collection 已存在而失敗。

#### Scenario: Provision the complete model catalog

- **WHEN** provisioning 使用有效的 model catalog 執行
- **THEN** 所有 resource、history 與 static collections SHALL 存在，且 provisioning
  SHALL 回報各 collection 的 created 或 already-existing 狀態

#### Scenario: Re-run collection provisioning

- **WHEN** provisioning 對已存在的 collections 再次執行
- **THEN** 系統 SHALL 保留既有 collections，並將其視為成功，不得刪除資料或建立重複 collection

#### Scenario: Collection provisioning is incomplete

- **WHEN** 任一必要 collection 建立失敗
- **THEN** provisioning SHALL 回報失敗 collection、錯誤原因與已完成項目，並以非零結果結束

### Requirement: Provision baseline indexes

Provisioning SHALL 建立所有 baseline indexes，包括 model/schema 宣告的 indexes、static
model indexes，以及固定服務查詢所需的 indexes。Baseline index 的 desired identity
SHALL 包含 collection、key、options 與穩定名稱。

#### Scenario: Create schema and service indexes

- **WHEN** baseline provisioning 在 collections 已存在的資料庫上執行
- **THEN** resource、history 與 static collections SHALL 擁有其 desired baseline indexes

#### Scenario: Preserve history lookup ordering

- **WHEN** history model 需要依 resource `id` 查詢並依 `meta.versionId` 降冪排序
- **THEN** history collection SHALL 有對應的 compound baseline index

#### Scenario: Existing compatible index

- **WHEN** MongoDB 已有與 desired identity 相容的 index
- **THEN** provisioning SHALL 視該 index 為已完成，不得建立重複 index

### Requirement: Restrict SearchParameter-derived indexes to approved definitions

第一階段 SHALL 只為 built-in、active、compilable 且明確具有 temporal indexable capability
的 SearchParameter lookup 產生 derived index。Database 自訂 SearchParameter 即使可執行，
預設也 SHALL NOT 產生 derived index。Derived indexes SHALL 只建立在 resource collections。

#### Scenario: Generate an approved temporal index

- **WHEN** built-in temporal SearchParameter 通過 extraction path、BSON type、array
  correlation、choice branch 與 multikey compatibility validation
- **THEN** desired manifest SHALL 包含對應 resource collection 的 deterministic temporal index

#### Scenario: Exclude custom SearchParameter indexes

- **WHEN** database 中存在可執行的 custom SearchParameter
- **THEN** registry SHALL 保留其 query execution capability，但 desired derived-index
  manifest SHALL 不包含該 SearchParameter

#### Scenario: Reject unsafe temporal index shape

- **WHEN** temporal extraction path 使用 raw FHIR value、positional array path、平行
  multikey path、錯誤 BSON type 或無法維持 element correlation
- **THEN** 該 index SHALL 不得進入 desired manifest，且系統 SHALL 回報穩定 diagnostic

### Requirement: Persist and verify desired index state

系統 SHALL 產生可提交至 repository 的 desired JSON manifest，並能比較 desired state 與
MongoDB actual indexes。Verify SHALL 回報 missing、extra、mismatch 與 manifest identity
差異；extra indexes 預設 SHALL NOT 被自動刪除。

#### Scenario: Verify matching state

- **WHEN** actual collections and indexes 與 desired manifest 相容
- **THEN** verify SHALL 成功，並回報 manifest version、checksum 與 verified 狀態

#### Scenario: Report index drift

- **WHEN** actual MongoDB indexes 缺少 desired index、options 不一致或包含未宣告 index
- **THEN** verify SHALL 回報對應 drift 類型與 collection/index identity，且 SHALL NOT 靜默忽略 drift

#### Scenario: Persist reconcile state

- **WHEN** provisioning 或 verify 完成
- **THEN** 系統 SHALL 保存 manifest checksum、版本、執行結果與可診斷的 missing/extra/mismatch 摘要

### Requirement: Make provisioning safe to retry

Provisioning SHALL 在多個 application instance 或 deployment process 競爭執行時使用獨立
provisioning lock。Lock SHALL 覆蓋 collection、baseline index、derived index 與 verify
的同一個 provisioning run。部分完成 SHALL 保留已成功的結果，後續執行 SHALL 可繼續完成。

#### Scenario: Serialize concurrent provisioning

- **WHEN** 兩個 process 同時針對同一 database 執行 provisioning
- **THEN** 同一時間 SHALL 只有一個 process 持有 provisioning lock，另一個 process
  SHALL 等待、明確退出或回報 lock conflict，不得並行修改同一 desired state

#### Scenario: Resume after partial failure

- **WHEN** provisioning 在部分 collections 或 indexes 完成後失敗
- **THEN** 下一次 provisioning SHALL 保留已完成項目並只補足缺少或不一致項目，不得刪除既有資料

#### Scenario: Lock lease expires

- **WHEN** 持有 lock 的 process 在 lease 到期前未完成或失去連線
- **THEN** 後續 provisioning SHALL 能辨識 expired lock 並安全取得新的 lock

### Requirement: Separate provisioning from resource identity migration

一般 provisioning SHALL NOT 自動將 resource `id` 或 history `id` index 變更為 unique。Unique
migration 前 SHALL 提供 duplicate audit；只要 audit 發現 duplicate，unique migration
SHALL 拒絕執行且不得自動刪除資料。

#### Scenario: Audit duplicate resource ids

- **WHEN** duplicate audit 掃描 resource 或 history collection
- **THEN** 系統 SHALL 按 collection 與 id 回報 duplicate documents 及其數量

#### Scenario: Block unique migration on duplicates

- **WHEN** duplicate audit 發現任何會違反 unique constraint 的資料
- **THEN** unique migration SHALL 以失敗結果結束，且 SHALL NOT 建立 unique index 或刪除任一 document

#### Scenario: Allow unique migration after clean audit

- **WHEN** duplicate audit 成功且沒有違規資料
- **THEN** 專用 unique migration 才可建立其明確宣告的 unique index
