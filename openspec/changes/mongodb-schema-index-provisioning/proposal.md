## Why

目前 `autoCreate=false` 與 `autoIndex=false` 只關閉 Mongoose 的自動 provisioning，
但 application 仍缺少明確的 collection、baseline index 與 SearchParameter-derived
index 初始化契約。Schema 中宣告的 index 不代表實際 MongoDB 已建立，導致新資料庫、
既有資料庫 drift 與部署後搜尋效能都無法由服務可靠驗證。

## What Changes

- 新增可重跑的 MongoDB provisioning capability，建立所有 resource、history 與
  static collections。
- 建立 baseline indexes，包含 schema/static indexes 與 history query 所需的服務索引。
- 新增 built-in temporal SearchParameter-derived index 的 manifest、建立與驗證流程。
- 將 desired manifest 以可提交的 JSON artifact 保存，並記錄 MongoDB reconcile state。
- 提供 provision、verify 與 `id` duplicate audit 操作。
- 使用獨立 provisioning lock，處理多 instance 執行與部分完成後重試。
- 保持自訂 database SearchParameter 可執行，但第一階段不為其建立 derived index。
- 保持 application startup 預設不執行 provisioning；明確 opt-in 時才在 ready 前完成。
- 保持 index reconciliation additive-only；extra index 只報告，不自動刪除。
- 將 `id` unique migration 與 duplicate cleanup 排除在一般 provisioning 外。

## Capabilities

### New Capabilities

- `mongodb-schema-index-provisioning`: 定義 MongoDB collection、baseline index、
  temporal SearchParameter index 的 desired state、provisioning、reconciliation、
  verification 與 operational controls。

### Modified Capabilities

- `mongodb-model-lifecycle`: 補充 model registration、collection/index provisioning
  與 application readiness 之間的邊界及 opt-in startup 行為。

## Impact

- 影響 `models/mongodb` connector、model catalog、static models 與 SearchParameter
  registry/index manifest。
- 新增 MongoDB provisioning command、desired manifest 與 state/lock collections。
- 新增 MongoDB integration、manifest drift、duplicate audit 與 lifecycle tests。
- 新增部署 runbook 與 provisioning/verification 文件。
- 不改變 FHIR resource API、既有同步 model map、SearchParameter query result semantics
  或既有 `autoCreate=false`、`autoIndex=false` 預設。
