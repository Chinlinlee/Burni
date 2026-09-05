## Context

目前 connector 會註冊完整的 resource、history 與 static model，但因
`autoCreate=false` 與 `autoIndex=false`，model registration 不會保證 MongoDB
collection 或 index 已存在。SearchParameter registry 已有 compiled plan 與 temporal
index manifest 的描述及驗證能力，但尚未有統一的 collection/index provisioning service。

本設計延續既有同步 model map、connector singleton、SearchParameter registry snapshot、
temporal index compatibility validator 與 server readiness gate。行為契約見本 change
下的兩份 spec。

## Goals / Non-Goals

**Goals:**

- 以同一套 desired-state 流程支援獨立 deployment command 與 opt-in startup provisioning。
- 讓 collection、baseline index、temporal derived index 的 identity 可 deterministic
  產生、比較與驗證。
- 讓 provisioning additive、idempotent、可在部分完成後重試，並可由多 instance 安全執行。
- 保留 custom SearchParameter 的 query execution，同時避免未驗證的 derived indexes。
- 將 provisioning readiness 與 application readiness 分離。

**Non-Goals:**

- 不恢復 Mongoose `autoCreate` 或 `autoIndex`。
- 不在第一階段為 token、reference、string、number、quantity 或 uri SearchParameter
  建立 derived indexes。
- 不自動刪除 extra indexes、不自動 rollback DDL，也不自動刪除 duplicate documents。
- 不在本 change 內把 resource 或 history 的 `id` 改成 unique。
- 不改變 SearchParameter query 的 filter semantics 或 FHIR API response contract。

## Decisions

### 1. 使用 model catalog 與 desired manifest 的兩層來源

Model catalog 負責列出需要 provisioning 的 resource、history 與 static model，以及
其 collection name。每個 model 的 schema index metadata 由已註冊 model 取得；固定服務
query index 另以明確 metadata 宣告。

兩者合併成 canonical desired manifest：

- collection identity：collection name 與 model kind。
- index identity：collection、key pattern、normalized options 與 deterministic name。
- source：schema、service、temporal。
- manifest version 與 canonical checksum。

不直接把 Mongoose schema object 序列化成 manifest，避免 function、runtime option 或
順序差異造成不穩定 checksum。

### 2. 以原生 MongoDB collection operation 執行 provisioning

Provisioning 先依 catalog 確認 collection existence，再以 desired manifest 建立 indexes。
已存在且 identity 相容的 collection/index 視為成功；不相容的 index 產生 mismatch，
由 reconcile policy 決定是否可更新，預設不刪除既有 index。

Collection 與 index operation 不放回 connector 的同步 model registration。Connector
只在 opt-in startup mode 透過 provisioning readiness 接入同一個 service；預設啟動路徑
仍維持 `autoCreate=false`、`autoIndex=false` 與既有 readiness contract。

### 3. 固定 provisioning pipeline 與 failure boundary

Provisioning run 依固定順序執行：

1. 建立或確認 control-plane lock/state collections。
2. 取得 database-scoped provisioning lock。
3. 建立或確認所有 application collections。
4. 建立或確認 baseline indexes。
5. 從 built-in compiled registry snapshot 產生 temporal derived indexes。
6. 建立或確認 temporal indexes。
7. 讀取 actual index list，執行 verify。
8. 保存 manifest checksum、結果與 drift 摘要，釋放 lock。

每一步保存可診斷結果。失敗時不 rollback 已完成的 collection/index；下一次 run 依
desired/actual diff 繼續。Lock lease 以 owner、取得時間、到期時間與 heartbeat 或
延長機制避免 process crash 後永久阻塞。

### 4. 將 control-plane state 與 migration checkpoint 分離

使用專用的 `MongoProvisioningLock` 與 `MongoProvisioningState` collections。Lock
使用 database-scoped unique identity 與 lease metadata；state 以 run、manifest checksum、
phase、結果與 drift summary 保存最後一次 provisioning/verify outcome。

不重用 `TemporalMigrationCheckpoint`，因為 migration checkpoint 的 key、生命週期與
恢復語意是資料搬遷專用，與 provisioning concurrency control 不同。

### 5. Temporal index policy 只接受已驗證的 built-in plan

Temporal manifest generator 與 compatibility validator 作為 temporal policy 的基礎。
Provisioning adapter 只採用同時符合以下條件的 lookup：

- definition source 是 built-in artifact；
- effective status 是 active；
- lookup plan 可執行；
- search type 是目前 temporal policy 支援的範圍；
- extraction path、BSON type、choice branch、array correlation 與 multikey validation
  全部通過。

Custom database definitions 不進入第一階段 derived-index manifest。這不是禁止 custom
SearchParameter 執行，而是把 query correctness 與 performance provisioning 分開。

### 6. Additive-only reconciliation 與明確的 operation 分工

提供三個操作：

- `mongodb:provision`：建立 collections 與缺少的 indexes，完成 verify。
- `mongodb:verify`：只讀取 actual state 並回報 drift。
- `mongodb:audit-id`：掃描 duplicate ids，供未來 unique migration 使用。

`provision` 可建立缺少項目，但 extra index、unique option 變更或 destructive rename
只產生 mismatch。`verify` 與 `audit-id` 不執行 DDL，也不修改資料。

### 7. Application readiness 只在明確 opt-in 時等待 provisioning

預設 startup 不執行 provisioning。當外部 provisioning 尚未完成時，application 仍依既有
model registry、database 與 SearchParameter registry readiness 啟動；缺少 performance
index 只透過安全 log 或 diagnostics 呈現。

明確啟用 startup provisioning 時，server bootstrap 在 application ready 前等待完整
provisioning run。該 run 失敗則不宣告 ready、不開始 listen，並由 server bootstrap
回傳非零啟動結果。兩種模式都使用相同 desired manifest、lock 與 failure semantics。

## Risks / Trade-offs

- [Risk] 由 schema metadata 推導的 index 可能與既有資料庫 index options 不完全相同。→
  [Mitigation] 使用 canonical index identity 與 verify drift report，不直接刪除既有 index。
- [Risk] 295 個 collections 的首次建立可能增加部署時間。→ [Mitigation] 將 provisioning
  移出預設 startup，提供 phase timing 與可重跑結果，部署流程可獨立監控。
- [Risk] Temporal index manifest 可能包含 array 或 choice path 的不安全形狀。→
  [Mitigation] 重用既有 temporal compatibility validator，任何 diagnostic 都阻止該
  index 進入 desired manifest。
- [Risk] process crash 可能留下未完成 lock。→ [Mitigation] lease expiry、owner identity
  與可回收 expired lock；state 保存最後完成 phase。
- [Risk] Application 在缺少 performance index 時使用 COLLSCAN。→ [Mitigation] verify
  command 與 provisioning deployment gate 明確回報 drift；不把效能缺失誤判為 query
  correctness failure。
- [Risk] Desired manifest 與 compiled artifact 不一致。→ [Mitigation] manifest 保存
  artifact identity/checksum，CI 與 verify 在 mismatch 時失敗。

## Migration Plan

1. 建立 model catalog、baseline index metadata、control-plane model 與 canonical
   desired manifest generator。
2. 實作 collection provisioning、index reconcile、verify、state persistence 與 lock
   lease。
3. 接入既有 temporal manifest/compatibility pipeline，只納入 approved built-in
   temporal definitions。
4. 新增 `mongodb:provision`、`mongodb:verify` 與 `mongodb:audit-id`，預設不改變
   application startup。
5. 在測試資料庫執行 provision，確認所有 collections、baseline indexes、temporal
   indexes 與 drift report。
6. 需要時以明確 configuration 啟用 startup provisioning，觀察 readiness 與失敗行為。
7. Rollback 時停止 startup opt-in 並回復 application code；不自動刪除已建立的
   collections/indexes，既有 indexes 由後續 verify/report 管理。
