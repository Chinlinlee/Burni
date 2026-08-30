## 1. Temporal contract and normalization

- [x] 1.1 建立 date、dateTime、instant 的 canonical object contract 與 validation rules，包含 precision、fractionDigits、normalized boundaries 與 Decimal128 epoch representation。
- [x] 1.2 建立集中式 temporal normalizer，將 public FHIR scalar 轉換為 type-specific canonical object，並固定無 timezone dateTime 使用 UTC。
- [x] 1.3 建立 temporal serializer，將 canonical object unwrap 為 FHIR scalar，保留原始 offset、fractional trailing zeros 與 lexical precision。
- [x] 1.4 為 invalid temporal value、非法 precision、缺少 instant timezone 與 persistence-shaped public input 建立錯誤處理。

## 2. Generator and schemas

- [ ] 2.1 更新 `PrimitiveGenerator.js`，使 date、dateTime、instant 產生新的 canonical schema definition。
- [ ] 2.2 更新所有 nested datatype、choice、resource 與 history schema 的 temporal field mapping。
- [ ] 2.3 執行 generator，檢查所有 generated output，並確認非 temporal diff 沒有非預期變更。
- [ ] 2.4 在每次後續 generator 或 schema 修改後重新執行 generator，驗證 source 與 generated output 保持一致。

## 3. FHIR write and response integration

- [ ] 3.1 將 temporal normalization 接入 create、update、Bundle write 與其他 public resource write path。
- [ ] 3.2 將 temporal serializer 接入 read、search response、history、include、revinclude 與 contained resource。
- [ ] 3.3 確認 primitive extension metadata 不會被 temporal object normalization 或 serialization 誤處理。
- [ ] 3.4 更新 direct `$set`、history snapshot 與 resource round-trip 流程，使其只接受並保存 canonical temporal object。

## 4. Migration

- [ ] 4.1 建立 read-only migration preflight，掃描 resource catalog、nested、choice、contained、history 與 temporal array。
- [ ] 4.2 實作合法 legacy string 的 precision 推導與 normalized value 建立。
- [ ] 4.3 實作 absolute-time field 的 legacy BSON Date UTC conversion，並保留 canonical response value。
- [ ] 4.4 實作 `date` field legacy BSON Date 的 ambiguity detection；無法無歧義轉換時回報 path/value 並 fail-fast。
- [ ] 4.5 讓 migration 可重跑且不重複包裝 canonical object，並加入批次記錄、preflight gate 與 backup/restore 操作說明。

## 5. Temporal query parsing and comparators

- [ ] 5.1 更新 date query parser，支援 year、month、day、minute、second、fraction 等 FHIR search precision。
- [ ] 5.2 建立 date 與 dateTime 的 `[start, end)` query range normalization，修正 partial precision 的 ordered comparator boundaries。
- [ ] 5.3 依 FHIR R4 semantics 實作 `eq`、`ne`、`lt`、`gt`、`ge`、`le`、`sa`、`eb` 與 deterministic `ap`。
- [ ] 5.4 建立獨立 instant query builder，使用 Decimal128 `epochSeconds` 支援高精度 point comparison。
- [ ] 5.5 確認 query parser 不對 raw FHIR string 做 lexical timezone comparison，且不依賴作業系統 local timezone。

## 6. Search projection and execution

- [ ] 6.1 更新 search-type projection，將 date、dateTime、instant extraction path 投影到 canonical normalized fields。
- [ ] 6.2 更新 Period projection 為完整 interval semantics，支援缺少 start/end 的無限邊界。
- [ ] 6.3 更新 temporal array filter 使用 `$elemMatch` 或等價的 element-correlated semantics。
- [ ] 6.4 更新 temporal `:missing` 判斷，只有完整 canonical temporal object 才算可搜尋 value。
- [ ] 6.5 讓 `.find()` 與 aggregate/chained execution 共用相同的 typed temporal filter、BSON types 與 boundaries。
- [ ] 6.6 更新 choice element、nested path、history 與 contained resource 的 temporal extraction coverage。

## 7. Indexes and operational rollout

- [ ] 7.1 根據有效 SearchParameter extraction paths 產生 date calendar boundary、dateTime Decimal128 boundary 與 instant epoch indexes。
- [ ] 7.2 驗證 Period、array 與 choice path 的 MongoDB index compatibility 與 query explain 結果。
- [ ] 7.3 建立 migration、index creation、schema cutover 與 legacy fallback removal 的部署順序。
- [ ] 7.4 在 cutover 前確認 migration 完成、preflight 無 unresolved invalid data，並保留可恢復的 backup/snapshot。

## 8. Verification and acceptance

- [ ] 8.1 增加 date year/month/day precision 與所有 declared comparator 的 unit tests。
- [ ] 8.2 增加 dateTime minute/second/fraction、timezone offset、UTC normalization 與 Decimal128 precision tests。
- [ ] 8.3 增加 instant object、epoch fraction、high-precision ordering 與 instant-specific query tests。
- [ ] 8.4 增加 Period、temporal array、choice、`:missing`、history、contained 與 primitive extension tests。
- [ ] 8.5 增加 `.find()` 與 aggregate 等價 hit-set tests，包含 BSON type mismatch regression cases。
- [ ] 8.6 增加 FHIR response lexical round-trip tests，確認 offset、尾端零與 precision 不遺失。
- [ ] 8.7 執行 generator、migration preflight、migration tests、targeted temporal tests 與完整 test suite，確認 acceptance matrix 全部通過。
