## Context

目前 146 個 production resource 都有對應的 MongoDB model，generic create/read service 透過已註冊的 model registry 工作；測試 support 則只有 Patient-specific adapter。詳見 `proposal.md` 與 `specs/fhir-resource-crud-coverage/spec.md`。

測試必須同時處理 model registration、fixture provenance、Mongo lifecycle、server-managed metadata，以及遠端 Validator 可能造成的不穩定性。現有 fixture archive 已定義 active fixture 與 companion fixture 的不同角色。

## Goals / Non-Goals

**Goals:**

- 讓 resource catalog 的 146 個 resource 各自擁有具名 create/read integration case。
- 使用 archive provenance 選取穩定且可重現的 active fixture。
- 以泛用 test support 降低重複設定，同時讓 assertion 留在測試案例中。
- 讓 schema、model registration、fixture identity 與 persistence regression 直接失敗。

**Non-Goals:**

- 不新增或改變 HTTP route contract。
- 不在本次變更驗證 remote profile validation、SearchParameter、update 或 delete。
- 不把 companion fixture 當成主要 create payload。
- 不以最小 payload 或 skip 掩蓋 active fixture 的 schema 問題。

## Decisions

### 使用 catalog 驅動的單一泛用 integration suite

新增一般 FHIR service integration test，從 `fhir.resourceList.json` 讀取 resource types，對每個 resource 建立一個具名 test。保留現有 Patient-specific CRUD test，作為既有行為的 regression。

選擇 catalog-driven suite 而非 146 個測試檔，是因為 resource 邊界已有單一來源；選擇具名案例而非單一 aggregate assertion，是為了讓失敗能直接定位 resource。

### 直接測試 service boundary

測試直接呼叫既有 create/read service，搭配 fake request/response；不引入 HTTP client。這符合目前 service integration test 的邊界，也避免把 routing、authentication 或 response transport 混入本次 CRUD persistence contract。

### 依 provenance 解析 active fixture

測試 support 讀取 fixture archive 的 provenance，並依既有規則選取 payload：指定 synthetic 時使用 synthetic，否則有 derived 時使用 derived，最後使用 official。companion 僅保留為輔助 fixture。

不直接以檔名排序或固定選擇 official，因為那會忽略 archive 對 synthetic 與 derived 的語意，也可能讓 fixture 選擇隨檔案變動而改變。

### 以 create response 作為 read identity

測試不依賴 fixture 原始 ID。create response 必須提供 server-generated ID，read 使用該 ID；比較時保留 resource type、ID 與非 server-managed 內容，允許 version、timestamp 等 metadata 差異。

### 隔離 Validator 與 collection

suite 在 lifecycle 中暫時將 `ENABLE_VALIDATOR` 設為 `false`，suite 結束後恢復原值；每個 resource case 清理自己的 collection，共用一次 MongoDB memory server。這使測試專注於 local structure validation 與 persistence，而不會把外部服務可用性誤判成 CRUD 缺陷。

### Production code 採 failure-driven 修正

先以現有 generic service 與所有 model 執行 contract。只有測試證明存在 service 或 model 缺陷時才修改 production code；泛用 adapter 可放在 test support，但不得把 assertion 放入 support module。

## Risks / Trade-offs

- [Risk] 某些 resource 的 fixture 會觸發特殊 schema 或 reference side effect → [Mitigation] 保留每個 resource 的獨立具名 failure，並讓 suite 在 collection 層級隔離。
- [Risk] 暫時修改 `ENABLE_VALIDATOR` 可能影響同一 process 的其他測試 → [Mitigation] 在 suite lifecycle 保存並恢復原值，並將此 suite 的責任限定為 local structure validation。
- [Risk] server-managed metadata 造成 create/read 直接比較不穩定 → [Mitigation] 比較穩定 resource content，對 version 與 timestamp 使用明確 normalization。
- [Risk] catalog 增加 resource 後 fixture archive 尚未同步 → [Mitigation] fixture 載入或 provenance 缺失直接使對應測試失敗，不提供 silent fallback。

## Migration Plan

1. 建立泛用 resource test support，載入 catalog、model 與 active fixture。
2. 新增 146 個具名 create/read cases，保留 Patient regression。
3. 執行 targeted integration suite，再執行完整測試與 lint。
4. 若失敗，修正經測試證明的 production model/service 問題或補齊 fixture archive。
5. 將 suite 納入一般 Mocha discovery；移除或回滾時刪除新增 support、suite 與相關文件，不需資料庫 migration。

## Open Questions

無。
