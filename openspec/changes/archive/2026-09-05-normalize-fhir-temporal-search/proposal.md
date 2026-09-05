## Why

目前 `date`／`dateTime` 的部分 precision 查詢會把界線錯誤地當成日級值處理，導致 `lt`、`gt`、`ge`、`le` 與 `eq` 的結果不一致。同時，部分 temporal 欄位保存為 BSON Date、部分保存為 string；MongoDB 不會在不同 BSON type 之間提供可靠的 range semantics，造成 date search 回傳遺漏結果。

這次大版本變更需要建立可保留 FHIR 原始 lexical value、precision、timezone offset 與 fractional trailing zero 的 temporal storage model，並讓 migration、query、serialization、history 與 generated schema 使用同一套規則。

## What Changes

- **BREAKING** 將 FHIR `date`、`dateTime` 與 `instant` 的內部儲存改為 canonical temporal object；public FHIR API 仍維持 scalar string。
- **BREAKING** `date` 保存原始 `value`、`precision` 與 calendar interval 的 `normalizedStart`／`normalizedEnd`。
- **BREAKING** `dateTime` 保存原始 `value`、`precision`、可選的 `fractionDigits`，以及以 UTC epoch seconds 表示的 Decimal128 normalized interval。
- **BREAKING** `instant` 使用獨立的 object 與 instant query semantics，以 Decimal128 `epochSeconds` 支援高精度排序與比較。
- 讓 query parser 接受 FHIR date search grammar 的合法 precision，並將每個 query value 正規化為 `[start, end)`。
- 依 FHIR R4 semantics 修正 `eq`、`ne`、`lt`、`gt`、`ge`、`le`、`sa`、`eb` 與 `ap`。
- 修正 `Period`、choice element、temporal array、`:missing`、history、contained resource，以及 `.find()`／aggregate query 的 temporal behavior。
- 建立 migration 將 legacy string／BSON Date 轉換為新模型；無法無歧義轉換的資料 SHALL fail-fast。
- FHIR response SHALL 從原始 `value` 還原 scalar，保留 offset、fractional trailing zero 與原始 precision。
- 修改 `PrimitiveGenerator.js` 作為 temporal schema 的 source of truth，並在每次變更後重新執行 generator。
- 依 SearchParameter extraction path 建立 normalized temporal indexes。
- 增加完整 temporal precision、comparator、migration、round-trip 與 query execution acceptance coverage。

## Capabilities

### New Capabilities

- `fhir-temporal-storage`: 定義 date、dateTime、instant 的 canonical object、precision、原始 lexical value、normalized value 與 migration behavior。

### Modified Capabilities

- `fhirpath-mongo-query`: 修改 temporal search projection、FHIR date comparator、Period、choice、array、missing 與 Mongo query execution requirements。

## Impact

- 影響 `models/mongodb/FHIRDataTypesSchema`、resource／datatype schema、`PrimitiveGenerator.js`、history model 與 contained resource serialization。
- 影響 FHIR create、update、Bundle write、read、search、history、include、revinclude 與 migration pipeline。
- 影響 `queryPrimitives.js`、search type projection、Period query、query value parser、aggregate query 與 missing filter。
- 需要建立 Decimal128 temporal fields 與對應 MongoDB indexes。
- 需要執行 legacy data migration；migration 前後的部署與資料驗證流程需要更新。
