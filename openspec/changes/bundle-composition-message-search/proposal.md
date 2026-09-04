## Why

FHIR R4 將 `Bundle.composition` 與 `Bundle.message` 定義為可進入 Bundle 第一個特殊 resource 的 reference search parameter。Burni 目前雖已編譯這兩個 SearchParameter，但將 `Resource` extraction path 當成 contained resource 跳過，導致 document/message Bundle 無法依 Composition 或 MessageHeader 內容搜尋。

## What Changes

- 支援 `Bundle.composition` 與 `Bundle.message` 的 inline resource search：
  - `composition` 僅匹配 `type=document` 且第一筆 resource 為 `Composition`。
  - `message` 僅匹配 `type=message` 且第一筆 resource 為 `MessageHeader`。
- 支援直接 identity search 與 chained search；直接 reference 可依嵌套 resource identity 或 `entry[0].fullUrl` 查詢。
- 將第一個特殊 resource 以 inline relation 處理，不對已嵌套的 Composition 或 MessageHeader 建立 MongoDB collection `$lookup`。
- 後續 chained hop SHALL 使用目標 resource 的有效 Registry SearchParameter plan；reference target 先解析同一 Bundle 的後續 entry，無相符 entry 時再使用既有 bounded relation composer 的外部 collection `$lookup`。
- `Composition::patient` 依 `Patient|Group` 的封閉 targets 處理；`Composition::subject` 與 `MessageHeader::focus` 的 open targets 缺少 type filter 時回 `missing-type-filter`。
- 第一個 inline hop SHALL 納入 relation depth 與 relation cost；既有 depth `3`、path cost `24` 與三種 limit class 契約維持有效。
- 對不符合 Bundle invariant 的已儲存資料回報不命中，不將資料錯誤轉成查詢參數錯誤。
- 更新 normal search、Bundle GET validation、conditional delete 的驗證與錯誤對應。
- 更新 Bundle 搜尋文件與測試，移除依賴所有 `entry` 尋找第一個特殊 resource 或 legacy handler 的舊語意；後續 reference target 可依 identity 解析後續 entry。

## Capabilities

### New Capabilities

無。

### Modified Capabilities

- `fhirpath-mongo-query`: 修改 Bundle inline special reference entry point、嵌套 resource chained search、Bundle type/first-entry gating，以及與 bounded relation search 的整合契約。

## Impact

- 主要影響 `models/FHIR/searchParameter/compiler`、`models/FHIR/searchParameter/executor/relationPlan.js`、`runtime/registrySearchHandler.js`、`runtime/bundleSearchValidation.js` 與 `api/FHIRApiService` 的搜尋及 conditional delete 入口。
- 影響 Bundle、Composition、MessageHeader 的 Registry plan 組合與 Mongo aggregation。
- 需要新增 document/message Bundle fixture、正負向 hit-set、直接 identity、inline chain、open target type filter 與三入口錯誤測試。
- 不修改 `_include`、`_revinclude`、`_has` 的行為，不恢復 legacy SearchParameter handler。
