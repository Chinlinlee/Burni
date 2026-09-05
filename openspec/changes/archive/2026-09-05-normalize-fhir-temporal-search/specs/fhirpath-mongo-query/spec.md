## MODIFIED Requirements

### Requirement: Compiler SHALL implement the declared FHIR search type matrix

第一階段 SHALL 支援 `number`、`date`、`string`、`token`、`reference`、`quantity` 與 `uri`。`composite` 與 `special` MUST 被辨識為 unsupported。每種 type、modifier 與 comparator 的可用組合 SHALL 由 capability matrix 宣告；不支援的組合 MUST 被拒絕或停用，不得靜默降級。`date` search SHALL 支援 FHIR R4 date parameter 可用的 precision 與 `eq`、`ne`、`lt`、`gt`、`ge`、`le`、`sa`、`eb`、`ap` comparator。

#### Scenario: Use a supported search type

- **WHEN** client 使用 capability matrix 宣告支援的 SearchParameter type 與 operator
- **THEN** API SHALL 依該 type 的 FHIR value semantics 建立對應查詢

#### Scenario: Search a partial date with its precision

- **WHEN** client 使用 `eq1995`、`eq1995-06` 或 `eq1995-06-15`
- **THEN** query SHALL 分別使用 year、month 或 day 的完整 `[start, end)` interval，而不得將所有輸入當成 day precision

#### Scenario: Search a partial dateTime with its precision

- **WHEN** client 使用 `ge2015-02-07T13:28`
- **THEN** query SHALL 以 minute precision 建立從該分鐘起點開始的 FHIR date range，且不得補成單一 second 或整日

#### Scenario: Use every declared date comparator

- **WHEN** client 使用 `eq`、`ne`、`lt`、`gt`、`ge`、`le`、`sa`、`eb` 或 `ap` date comparator
- **THEN** runtime SHALL 依 FHIR R4 range semantics 執行該 comparator，不得在 runtime 因缺少 comparator implementation 而 throw

#### Scenario: Request an unsupported type or operator

- **WHEN** SearchParameter type 為 `composite`/`special`，或 query 使用未宣告的 modifier/comparator
- **THEN** registry 或 query validation SHALL 明確回報 unsupported，且不得產生較寬鬆的替代查詢

### Requirement: Executor SHALL apply search-type projection from datatype

Executor SHALL 依 `(search type, FHIR datatype)` 把 extraction path 投影到儲存文件的 temporal normalized leaf 或其他既有 stored field，再組成 Mongo filter。Projection 的 field set 這一階段 SHALL 與既有有效搜尋 API 對齊，不得依參數 code 開特例，也不得把 `parameterHandler` 的 expression 字串切割搬進 compiler。Expression 仍指向 datatype 根。

這一階段的 field set：

- string 於 Address：`line`、`city`、`district`、`state`、`postalCode`、`country`
- string 於 HumanName：`text`、`family`、`given`、`prefix`、`suffix`
- token 於 CodeableConcept：`coding.system`、`coding.code`
- token 於 Identifier 或 ContactPoint：`system`、`value`
- token 於 Coding：`system`、`code`
- token 於 code、boolean、string：該欄位本身
- reference 於 Reference：`reference`
- date 於 Period：`start` 或 `end` 的 temporal interval
- date 於 date：`normalizedStart`、`normalizedEnd`
- date 於 dateTime：Decimal128 `normalizedStart`、`normalizedEnd`
- date 於 instant：Decimal128 `epochSeconds`
- quantity 於 Quantity：`value`、`system`、`code`
- 其餘 primitive datatype：identity projection，搜尋該 path 本身

Temporal projection SHALL 使用 canonical normalized fields，而不得直接對 raw FHIR `value` 做 range comparison。對 temporal array，相關條件 SHALL 綁定在同一個 array element。

#### Scenario: Project a date search on a date field

- **WHEN** client 以 date SearchParameter 查詢保存 canonical date object 的欄位
- **THEN** filter SHALL 使用該 object 的 `normalizedStart` 與 `normalizedEnd`，不得對 object 或 raw `value` 做 BSON string/date mixed-type range comparison

#### Scenario: Project a date search on a dateTime field

- **WHEN** client 以 date SearchParameter 查詢保存 canonical dateTime object 的欄位
- **THEN** filter SHALL 使用 Decimal128 normalized interval，且 partial dateTime 與完整 dateTime SHALL 使用相同 BSON type

#### Scenario: Project a date search on an instant field

- **WHEN** client 以 date SearchParameter 查詢 instant extraction path
- **THEN** filter SHALL 使用 instant-specific Decimal128 `epochSeconds` semantics，MUST NOT 將 instant 投影成 calendar date string

#### Scenario: Project string search on Address

- **WHEN** client 以 string SearchParameter 查 Patient `address`
- **THEN** filter SHALL 對 Address 的 string leaf 做既有 string 語意匹配，MUST NOT 對 `address` 物件本身做 regex

#### Scenario: Project token search on CodeableConcept

- **WHEN** client 以 token SearchParameter 查 Observation `code` 且未使用 `:text`
- **THEN** filter SHALL 匹配 `coding.system` / `coding.code`，MUST NOT 匹配 `code.text`

#### Scenario: Project reference search

- **WHEN** client 以 reference SearchParameter 查 `subject=Patient/example`
- **THEN** filter SHALL 匹配 `subject.reference`，MUST NOT 匹配 `subject` 物件本身

#### Scenario: Execute every compatible union branch

- **WHEN** Observation `combo-code` expression 為 `Observation.code | Observation.component.code` 且兩支皆可投影
- **THEN** filter SHALL `$or` 兩支投影結果，MUST NOT 只執行 `extractionPaths[0]`

## ADDED Requirements

### Requirement: Date queries SHALL use FHIR range semantics

所有 date、dateTime 與 instant query value SHALL 先依輸入 precision 轉換為 `[queryStart, queryEnd)`。比較 SHALL 依 FHIR R4 對 target temporal range 的定義執行；不得使用單純 lexical equality 或固定加一天的 comparator shortcut。

#### Scenario: Match a year precision equality

- **WHEN** query 為 `eq1995`
- **THEN** query range SHALL 涵蓋 1995-01-01 起至 1996-01-01 前，並命中該年度內的 compatible date、dateTime 或 instant value

#### Scenario: Compare a month precision value

- **WHEN** query 為 `gt1995-06`
- **THEN** query SHALL 依 1995-07-01 作為 month range 上界，MUST NOT 只增加一天

#### Scenario: Preserve full dateTime offset semantics

- **WHEN** query 帶有 timezone offset
- **THEN** query SHALL 先轉換為 UTC normalized Decimal128 range，且不得以原始 offset string 的字典序比較

#### Scenario: Apply approximately semantics

- **WHEN** query 使用 `ap`
- **THEN** runtime SHALL 使用明確且 deterministic 的 approximation window；預設 SHALL 採用 FHIR R4 建議的 10% 時間差距規則

### Requirement: Period temporal searches SHALL compare complete intervals

Period search SHALL 將 Period 的 start 與 end 視為一個完整 temporal interval。缺少 start SHALL 表示負無限，缺少 end SHALL 表示正無限；runtime MUST NOT 只對 start 或 end 分別建立無關聯的 `$or` filter。

#### Scenario: Match a Period containing the query

- **WHEN** Period 為 2010-01-01 至 2020-01-01，query 為 2015
- **THEN** query SHALL 命中該 Period，因為 Period interval 覆蓋 query range

#### Scenario: Match an open-ended Period

- **WHEN** Period 缺少 end 且其 start 早於 query range
- **THEN** range comparator SHALL 將缺少 end 視為正無限並依 FHIR semantics 判定

### Requirement: Temporal array searches SHALL preserve element correlation

對包含多個 temporal object 的 array，runtime SHALL 使用等價於 `$elemMatch` 的 element-correlated semantics，使 start、end、precision 與 comparator 條件都套用在同一個 array element。

#### Scenario: Do not combine separate temporal elements

- **WHEN** 第一個 array element 只符合 query start、第二個 array element 只符合 query end
- **THEN** resource MUST NOT 因跨 element 組合條件而命中

### Requirement: Temporal missing searches SHALL inspect canonical values

Temporal `:missing` SHALL 依 extraction path 是否存在完整且有效的 canonical temporal value 判定。只有 raw value、缺少 normalized boundary 或 malformed object MUST 被視為不可搜尋 value。

#### Scenario: Treat an incomplete temporal object as missing

- **WHEN** temporal field 只有 `value` 而缺少必要 precision 或 normalized fields
- **THEN** `:missing=true` SHALL 視該 field 為 missing，` :missing=false` SHALL 不因 raw value 存在而命中

#### Scenario: Detect an available temporal value

- **WHEN** temporal field 包含符合 datatype contract 的完整 canonical object
- **THEN** `:missing=false` SHALL 命中該 resource

### Requirement: Temporal query behavior SHALL be identical across query execution modes

Temporal filters SHALL 在一般查詢與 aggregation 查詢中使用相同的 normalized fields、BSON types、interval boundaries 與 comparator semantics。任何 execution mode MUST NOT 依賴另一個 mode 才會提供的 implicit casting。

#### Scenario: Execute a temporal find query

- **WHEN** temporal SearchParameter 透過一般 resource search 執行
- **THEN** query SHALL 直接使用 canonical normalized representation 並回傳正確 hit-set

#### Scenario: Execute an equivalent temporal aggregate query

- **WHEN** 相同 temporal SearchParameter 透過 aggregation 或 chained execution 執行
- **THEN** runtime SHALL 使用與一般查詢等價的 temporal filter 與 hit-set
