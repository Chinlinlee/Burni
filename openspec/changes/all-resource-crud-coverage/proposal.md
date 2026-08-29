## Why

Burni 的 FHIR resource catalog 包含 146 個 resources，雖然每個 resource 都已有對應的 MongoDB model 與泛用 create/read service，但目前只有 Patient 有 service-level CRUD integration test。需要建立完整且可持續的 create/read contract，避免新增或修改 resource model 時產生未被發現的 persistence regression。

## What Changes

- 新增涵蓋 catalog 中全部 146 個 resources 的 all-resource CRUD integration coverage。
- 每個 resource 以 active fixture 執行 create/read round-trip，並驗證 resource type、server-returned ID 與儲存內容。
- 將 fixture provenance 的 active fixture 選擇規則納入測試 contract；companion fixture 不作主要 create payload。
- 將 fixture resourceType 不一致、create 失敗或 read round-trip 不一致視為測試失敗，不自動修正或 skip。
- 保留現有 Patient 專用 CRUD regression test，另外建立泛用的 FHIR service integration test。
- 測試停用遠端 profile validation，避免 CRUD coverage 依賴外部 Validator。

## Capabilities

### New Capabilities

- `fhir-resource-crud-coverage`: 為 resource catalog 中每個 FHIR resource 定義 create/read round-trip 的 integration contract。

### Modified Capabilities

無。

## Impact

- 受影響的 production boundary：`CreateService`、`ReadService` 與其已註冊的 146 個 resource models。
- 受影響的測試：一般 FHIR service integration test、MongoDB memory lifecycle 與泛用 test support。
- 受影響的 fixture：`test/fixtures/archive` 中依 provenance 選出的 active fixtures。
- 不改變 HTTP API、FHIR resource ID 產生規則、SearchParameter 行為或 update/delete contract。
