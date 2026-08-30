## Why

目前測試套件包含約 55 個測試檔與 570 個實際案例，其中多個 suite 重複啟動與停止 MongoDB memory server，並重複進行 model 與 SearchParameter fixture 初始化。這使 temporal integration 測試的案例雖只需數秒，整個 suite 卻可能等待超過 100 秒；現在需要在不降低 FHIR coverage 的前提下建立可預期的快速測試流程。

## What Changes

- 建立快速測試入口，供日常開發執行不需要 MongoDB 的測試。
- 保留獨立完整測試入口，執行所有現有測試與 integration coverage。
- 讓同一個 Mocha process 共用 MongoDB memory server，並在 process 結束時統一清理。
- 修正 targeted test script，使指定 gate 不會被全域 Mocha `spec` glob 擴展成完整測試套件。
- 保留 146 個 FHIR resource 的 CRUD coverage、Patient 專用回歸測試與 temporal 測試。
- 第一階段不刪除測試、不啟用平行化，先處理重複 lifecycle、初始化與 fixture 成本。
- 以實際量測記錄測試基準時間、suite lifecycle 時間與優化後結果。
- CI workflow 保留 `main`，並支援 `next` 與 `dev`；完整測試 gate 在既有 `Specimen` 測試修正完成前不接入。
- 不修改 production model loading；該工作由既有 `optimize-model-loading` change 管理。

## Capabilities

### New Capabilities

- `test-suite-speed`: 定義快速與完整測試入口、MongoDB test lifecycle 重用、coverage 保留、量測與 CI 接入條件。

### Modified Capabilities

無。

## Impact

- 影響 [package.json](../../../package.json)、[.mocharc.js](../../../.mocharc.js) 與新增的 Mocha 測試設定。
- 影響 [test/support/mongo-memory.js](../../../test/support/mongo-memory.js)、[test/support/fhir/crud-test-context.js](../../../test/support/fhir/crud-test-context.js) 與 [test/hook.js](../../../test/hook.js) 的測試 lifecycle。
- 影響 CI workflow 的 branch filter 與完整測試 gate 接入時機。
- 不改變 production API、FHIR resource schema、測試驗證契約或 runtime dependency。
