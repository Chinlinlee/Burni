---
status: accepted
---

# MongoDB schema 與 index provisioning

目前 `models/mongodb/connector.js` 將 Mongoose `autoCreate` 與 `autoIndex` 設為
`false`，因此 model registration、MongoDB collection existence 與 index existence
不是同一件事。Resource model 雖宣告 `id` index，SearchParameter registry 也能產生
temporal index manifest，但 application 啟動流程沒有保證這些 collection 或 index
實際存在。

## Decision

- 將 model registration、collection provisioning、index provisioning 與
  index reconciliation 視為分離的生命週期責任。
- 建立共用的 provisioning service，供獨立 deployment command 與明確 opt-in 的
  startup provisioning 使用；正式環境預設不在 application startup 執行 provisioning。
- Provisioning 以 model catalog 建立全部 resource、history 與 static collections，
  再依序建立 baseline indexes、SearchParameter-derived indexes，最後執行 verify。
- Baseline indexes 由 Mongoose schema indexes、static model indexes 與明確的服務
  query indexes 組成。history model 需支援以 `id` 查詢並依
  `meta.versionId` 降冪排序的複合 index。
- 第一階段只支援 built-in artifact 中明確標記為 indexable 的 temporal
  SearchParameter-derived indexes，且只建立在 resource collections。Database
  自訂 SearchParameter 預設不產生 derived index。
- Desired index manifest 必須是可提交至 repository 的 JSON artifact。MongoDB
  另外保存 manifest checksum、版本與 reconcile 結果，讓部署結果可追蹤。
- Reconciliation 先比較 desired 與 actual indexes，預設只新增或修正必要項目；
  extra indexes 只回報，不自動刪除。Collection 或 index provisioning 部分完成時
  不 rollback，後續執行必須能安全重試。
- Provisioning 使用獨立的 `MongoProvisioningLock` 與
  `MongoProvisioningState` 內部 collections。Lock 涵蓋 collection、baseline
  index、temporal index 與 verify 全流程。
- 提供獨立的 provision、verify 與 `id` duplicate audit 操作。Provisioning command
  的失敗回傳非零狀態；application startup 預設不因效能 index 缺失而失敗。
- Resource `id` unique migration 不屬於一般 provisioning。Duplicate audit 發現
  問題時只報告並拒絕 unique migration，不自動刪除資料。

## Considered Options

- 依賴 Mongoose `autoCreate` 與 `autoIndex`：拒絕，無法控制啟動成本，也無法提供
  可審查、可重跑的部署結果。
- 只在 application startup 建立 indexes：拒絕，會把 DDL 成本與服務 readiness 綁在
  每次重啟，且不適合多 instance deployment。
- 直接對所有 SearchParameter extraction path 建 index：拒絕。可執行 query plan
  不代表 extraction path 具備安全的 index contract，尤其是 multikey、choice、
  correlation、BSON type 與 temporal normalized fields。
- 由通用 provisioning 自動把 `id` 改為 unique：拒絕。既有資料可能存在 duplicate，
  需要先進行可審查的 audit 與資料清理。
- 發現 provisioning 部分失敗時 rollback：拒絕。MongoDB DDL rollback 可能影響
  既有資料庫物件，且 additive provisioning 可透過下次 reconcile 繼續完成。

## Consequences

- 部署流程必須在 application 啟動前執行 provisioning command，或明確啟用 startup
  provisioning。
- Application readiness 與 provisioning readiness 是不同狀態；缺少一般效能 index
  不會自動阻止 application 提供服務。
- Custom SearchParameter 可以正常執行，但在第一階段可能使用 COLLSCAN。
- Desired manifest、MongoDB state metadata 與 actual index list 必須保持可診斷，
  以便處理 drift、部分完成與版本不一致。
- 未來新增 token、reference、string、quantity 等 derived index 時，必須先建立
  各 search type 的 index policy 與 compatibility contract，不得直接擴大 allowlist。
