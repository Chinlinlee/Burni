## 1. 建立泛用測試基礎

- [x] 1.1 建立可載入 146 個 resource catalog 項目的泛用 test support。
- [x] 1.2 建立依 fixture provenance 選取 active fixture 的載入流程，並驗證 fixture `resourceType`。
- [x] 1.3 建立泛用 create/read service adapter，確認所有 resource model 已註冊並提供可診斷錯誤。
- [x] 1.4 加入 MongoDB memory server lifecycle、collection isolation 與 `ENABLE_VALIDATOR` 環境值保存／還原。

## 2. 實作全資源 CRUD coverage

- [x] 2.1 新增一般 FHIR service integration test，從 resource catalog 動態建立具名測試案例。
- [x] 2.2 對每個 resource 使用 active fixture 執行 create，並確認 server-generated ID 可用且不同於 fixture 原始 ID。
- [x] 2.3 使用 create response 的 ID 執行 read，驗證 resource type、identity 與非 server-managed 內容等價。
- [x] 2.4 讓 fixture 載入失敗、create/read 失敗、catalog 不一致與 round-trip 差異直接使對應測試失敗。
- [x] 2.5 保留並確認現有 Patient-specific CRUD regression test。

## 3. Production 缺陷處理

- [x] 3.1 執行全資源 coverage，區分測試 support 問題、fixture 問題與 production model/service 缺陷。
- [x] 3.2 僅修正由失敗測試證明的 production CRUD 缺陷，不改變既有 HTTP、ID、SearchParameter 或 update/delete contract。
- [x] 3.3 若 fixture archive 缺少必要 provenance 或 active fixture，補齊對應 fixture 並保留來源語意。

## 4. 驗證與文件

- [x] 4.1 執行 targeted all-resource CRUD integration suite，確認 146 個具名案例均被執行。
- [x] 4.2 執行完整 Mocha 測試與 ESLint。
- [x] 4.3 確認新增 resource 後 catalog coverage、fixture 載入與 failure diagnostics 仍會自動涵蓋該 resource。
