# fhirpath-mongo-query Specification

## Purpose

將 FHIR SearchParameter expression 的可支援子集轉換成可驗證、可診斷且安全的 Mongo 搜尋行為，同時保留 FHIR R4 的多值、比較、modifier 與 reference chain 語意。

## Requirements

### Requirement: Compiler SHALL accept only an allowlisted FHIRPath subset

Compiler SHALL 將 expression 解析為受限語法；第一階段允許 property navigation、collection flatten、union、`where(resolve() is Type)` reference type guard、choice `as` type selection、existence，以及 allowlisted 的固定欄位 literal predicate。`ofType`、任意 literal `where` 比較、target dereference、terminology evaluation、任意函數、arithmetic 或其他未列入 capability matrix 的語法 MUST NOT 被靜默解讀。

#### Scenario: Compile a supported path expression
- **WHEN** SearchParameter expression 只包含允許的 path navigation 與 collection semantics
- **THEN** compiler SHALL 產生可執行的搜尋定義，並保留 expression 與其 resource base/type context

#### Scenario: Compile a supported typed predicate
- **WHEN** expression 使用 `where(resolve() is Type)` 或 `(path as Type)` / `.as(Type)` choice syntax
- **THEN** compiler SHALL 將 predicate 與型別條件納入搜尋行為，而不是只取出 predicate 前的欄位 path

#### Scenario: Reject unsupported expression
- **WHEN** expression 使用 target dereference、`ofType`、非 allowlisted 的 literal `where` 比較、terminology、未允許函數或其他 unsupported syntax
- **THEN** 該 SearchParameter MUST 被停用並產生 diagnostics，不得以部分 path 代替原始語意

#### Scenario: Preserve a bounded reference type guard
- **WHEN** expression 使用 `Account.subject.where(resolve() is Patient)`
- **THEN** compiler SHALL 保留 Patient target type guard 與 `subject` 的 Reference projection，且 MUST NOT 執行目標 Patient 資源 dereference

#### Scenario: Support both choice type selection forms
- **WHEN** expression 使用 `(Observation.value as Quantity)` 或 `Observation.value.as(Quantity)`
- **THEN** compiler SHALL 將兩者視為 choice type selection，並產生相同的 typed extraction semantics

#### Scenario: Reject unsupported choice function
- **WHEN** expression 使用 `Observation.value.ofType(Quantity)`
- **THEN** 該 SearchParameter MUST 被停用並產生 unsupported diagnostics

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

### Requirement: Reference type guards SHALL be bounded and deterministic

`where(resolve() is Type)` SHALL 只限制 Reference target type，不得解析或查詢目標 resource。Reference target type SHALL 由 `Reference.reference` 的 relative 或 absolute URL path 判定；若同一 Reference 存在 `Reference.type`，其值 MUST 與 path type 一致。versioned reference、`#contained` 與 `Reference.identifier` MUST NOT 被支援。

#### Scenario: Match a relative reference target
- **WHEN** stored reference 為 `Patient/123` 且 expression 為 `subject.where(resolve() is Patient)`
- **THEN** query SHALL 匹配該 Patient reference，且 MUST 對 reference leaf 建立 target type guard

#### Scenario: Match an absolute reference target
- **WHEN** stored reference 為 `https://example.org/fhir/Patient/123`
- **THEN** compiler/runtime SHALL 從 URL path 判定 Patient target type，不執行遠端 dereference；client 傳完整 absolute URL 時 SHALL 保留完整 URL 精確比對

#### Scenario: Reject inconsistent reference metadata
- **WHEN** `Reference.reference` 指向 `Patient/123` 但 `Reference.type` 為 `Practitioner`
- **THEN** `resolve() is Patient` MUST NOT 命中該 Reference

#### Scenario: Reject unsupported reference value forms
- **WHEN** client 傳入 versioned reference、`#contained` 或 logical identifier
- **THEN** API SHALL 回傳標準 invalid search parameter/value error，不得降級為 regex 或 legacy handler

### Requirement: Search execution SHALL preserve FHIR multi-value semantics

Runtime SHALL 依有效 SearchParameter 的 `multipleOr` 與 `multipleAnd` 處理逗號分隔值與重複參數，並依 type capability matrix 處理 comparator 與 modifier。choice union branches SHALL 以 OR 組合；重複參數 SHALL 以 AND 組合。缺省行為 SHALL 依 FHIR R4 規則，且同一查詢不得因 compiler 路徑而改變既有有效 API 的語意。

#### Scenario: Apply multiple OR values
- **WHEN** client 在允許 `multipleOr` 的 parameter 傳入多個逗號分隔值
- **THEN** resource 只要有任一值符合即可匹配

#### Scenario: Apply multiple AND parameters
- **WHEN** client 在允許 `multipleAnd` 的 parameter 重複傳入同名參數
- **THEN** resource MUST 同時符合每一個參數條件

#### Scenario: Reject disallowed repetition
- **WHEN** client 使用不允許的 multipleOr 或 multipleAnd 形式
- **THEN** API SHALL 回傳標準的無效搜尋參數錯誤，不得默默改成另一種 conjunction

#### Scenario: Combine choice branches and multiple values
- **WHEN** expression 包含多個可投影 choice branches，且 client 傳入多個允許的 OR values
- **THEN** runtime SHALL 對 choice branches 與 values 建立等價的 OR filter，不得只使用第一個 branch

#### Scenario: Combine repeated parameters with choice branches
- **WHEN** client 重複傳入允許 `multipleAnd` 的 choice SearchParameter
- **THEN** 每個重複參數 SHALL 各自保留 choice branches 的 OR semantics，重複參數之間 SHALL 以 AND 合併

### Requirement: Compiler and executor SHALL enforce Mongo query safety

SearchParameter expression 與 query value MUST 透過 parser、allowlist 與型別驗證處理。Runtime MUST NOT 使用 expression eval、任意 JavaScript、Mongo `$where` 或未限制的 operator/path；regex、aggregation depth 與估計成本 SHALL 受限制。

#### Scenario: Handle an untrusted database expression
- **WHEN** DB SearchParameter 提供包含未允許 operator 或 path 的 expression
- **THEN** registry SHALL 停用該 definition 並提供 diagnostics，不執行該 expression

#### Scenario: Escape a string search value
- **WHEN** client 提供含 regex metacharacters 的 string value
- **THEN** query SHALL 依 FHIR string semantics 處理該值，且不得讓輸入擴大為任意 regex

#### Scenario: Reject unsupported reference query value
- **WHEN** client 提供 versioned、contained 或 logical identifier reference value
- **THEN** query validation SHALL 回傳標準 invalid search parameter/value error，MUST NOT 將其當作一般字串 regex

### Requirement: Runtime SHALL separate SearchParameter queries from control parameters

`_id` 與 `_lastUpdated` SHALL 可由同一 SearchParameter compiler/runtime contract 處理；`_include`、`_revinclude`、`_sort`、分頁與 summary control parameters MUST 維持獨立處理，不得被當作一般 value extractor。

#### Scenario: Search by registry-backed system parameter
- **WHEN** client 使用 `_id` 或 `_lastUpdated`
- **THEN** runtime SHALL 使用其有效 SearchParameter definition 與 R4 comparator/date semantics

#### Scenario: Process a control parameter
- **WHEN** client 使用 `_include`、`_revinclude`、`_sort`、`_count` 或 summary control
- **THEN** runtime SHALL 走 control-parameter behavior，且不要求它具有一般 SearchParameter expression

### Requirement: Reference chain SHALL be controlled and bounded

Chained search SHALL 是 client 指定的 dotted path，由 relation hop 組成並以 filter parameter 結尾；它 MUST NOT 被當成沿 resource graph 走訪直到 cycle 或 budget 才停下的搜尋。產品 MUST NOT 使用 recursive chain 作為此行為的名稱。Relation depth SHALL 等於參數名稱中的點數，且 MUST NOT 超過 3。系統 MUST NOT 設定 relation cycle limit；同一個 lookup key MAY 在同一條 path 重複。不得接受任意字串形成跨 collection lookup。

沒有 type filter 的封閉 hop SHALL 只繼續宣告的 reference target types 之中、對下一個 code 有 effective lookup 的型別。每個 reference target type SHALL 使用自己的 compiled plan；MUST NOT 只套用最後一個 plan。若沒有任何宣告的 reference target type 對下一個 code 具有 effective lookup，API SHALL 回傳標準 unknown search parameter error，MUST NOT 當成 empty hit-set。

Open reference target（declared reference target types 為空、包含 `Resource`、或列舉 FHIR resource catalog／官方 145 型列表）在該 hop MUST 有 type filter。缺少 type filter 時，runtime SHALL 在套用 relation cost 之前拒絕，並回傳 HTTP 400 OperationOutcome，且 MUST 標明 limit class；MUST NOT 當成 unknown search parameter。Contained Resource extraction paths MUST NOT 被 chain；它們不是 collections，也不是 open reference targets。

Chain allowlist 為空或未宣告時 SHALL 允許任何 effective next-hop code；非空時 SHALL 只允許列出的 codes。未知 hop、未宣告的 reference target type、或 disabled lookup SHALL 仍回傳標準 unknown search parameter error。

Relation cost SHALL 以每條 chained search path 計算，MUST NOT 與非 chain 查詢的 query cost cap 共用。每個 hop SHALL 加總固定 lookup overhead 與各可執行 target plan 的 estimated cost，再乘該 hop 的 fan-out width。Relation cost MUST NOT 超過 24。超過 depth 或 cost 時，API SHALL 回傳 HTTP 400 OperationOutcome 並 MUST 標明 limit class，MUST NOT 執行無界 aggregation，且 MUST NOT 洩漏內部 reason string。

上述 chained search 規則 SHALL 同時套用在 normal search、Bundle GET search validation 與 conditional delete。

`Bundle.composition` 與 `Bundle.message` SHALL 被視為固定 inline target 的特殊 reference entry point：前者 target 為 `Composition`，後者 target 為 `MessageHeader`。它們 SHALL 可作為 chained path 的第一個 hop，但不得因 embedded resource 而建立無界或跨任意 collection 的查詢。

#### Scenario: Execute an allowed one-level chain

- **WHEN** client 使用一層 chained search，且每個 hop 都有 effective lookup
- **THEN** runtime SHALL 只匹配 reference target 中符合 chained SearchParameter 的資源

#### Scenario: Execute a Bundle inline entry chain

- **WHEN** client 使用 `Bundle?composition.patient=Patient/123` 或 `Bundle?message.focus:Patient.name=Smith`
- **THEN** runtime SHALL 從符合 Bundle 特規條件的第一個 embedded resource 開始查詢，並將後續 target SearchParameter 的語意套用於該 resource

#### Scenario: Execute an allowed multi-hop chain

- **WHEN** client 使用 relation depth 為 2 且符合 depth、cost 與 type-filter 規則的 chained search（例如 `Observation?subject.organization.name=`）
- **THEN** runtime SHALL 依序套用各 relation hop 並只匹配最終 filter 命中的資源，MUST NOT 因第二個點而拒絕

#### Scenario: Execute a repeated lookup-key hierarchy

- **WHEN** client 使用重複同一個 lookup key 的階層 chained search（例如 `Organization?partof.partof.name=`）
- **THEN** runtime SHALL 執行該 path，MUST NOT 因同一個 lookup key 重複而當成 cycle 拒絕

#### Scenario: Honor a type filter at an intermediate hop

- **WHEN** client 在中間 hop 指定 type filter（例如 `Observation?subject:Patient.organization.name=`）
- **THEN** runtime SHALL 只繼續該 type filter 指定的 reference target type，MUST NOT 對其他宣告型別 fan-out

#### Scenario: Fan out closed reference target types with per-type plans

- **WHEN** 某 hop 沒有 type filter，且其宣告的 reference target types 為封閉集合，且各型別對下一個 code 都有 effective lookup
- **THEN** runtime SHALL 對每個可執行的 reference target type 使用該型別自己的 plan 繼續搜尋，MUST NOT 只套用最後一個型別的 plan

#### Scenario: Reject an undeclared chain

- **WHEN** client 使用未被 chain allowlist 允許的 next-hop code，或不符合宣告的 reference target type
- **THEN** API SHALL 回傳標準的無效或 unknown search parameter error

#### Scenario: Reject an unknown or undeclared hop

- **WHEN** client 使用未知 hop、未宣告的 reference target type、disabled lookup，或封閉 hop 在沒有 type filter 時對下一個 code 沒有任何可執行的 reference target type
- **THEN** API SHALL 回傳標準 unknown search parameter error，MUST NOT 回傳 empty hit-set，也 MUST NOT 使用具名 limit class

#### Scenario: Block recursive chain in phase one

- **WHEN** client 使用 relation depth 為 2 或 3、且符合 cost 與 type-filter 規則的 chained search
- **THEN** runtime SHALL 執行該 path，MUST NOT 再以 recursive chain 為由拒絕，也 MUST NOT 執行無界 aggregation

#### Scenario: Reject an open reference target without a type filter

- **WHEN** client 在 open reference target hop（declared targets 為空、含 `Resource`、或列舉 FHIR resource catalog）未提供 type filter
- **THEN** API SHALL 在套用 relation cost 之前回傳 HTTP 400 OperationOutcome，且 MUST 標明該 limit class；MUST NOT 當成 unknown search parameter，MUST NOT 執行無界 aggregation

#### Scenario: Execute an open reference target with a type filter

- **WHEN** client 在 open reference target hop 提供 type filter，且該型別對下一個 code 有 effective lookup
- **THEN** runtime SHALL 只以該 type filter 指定的 reference target type 繼續 chained search

#### Scenario: Reject relation depth greater than 3

- **WHEN** client 使用參數名稱中點數大於 3 的 chained search
- **THEN** API SHALL 回傳 HTTP 400 OperationOutcome 並 MUST 標明 depth limit class，MUST NOT 執行無界 aggregation，MUST NOT 當成 unknown search parameter

#### Scenario: Reject relation cost greater than 24

- **WHEN** 一條 chained search path 的 relation cost 超過 24（含 fan-out width）
- **THEN** API SHALL 回傳 HTTP 400 OperationOutcome 並 MUST 標明 cost limit class，MUST NOT 執行無界 aggregation，MUST NOT 洩漏內部 reason string，MUST NOT 當成 unknown search parameter

#### Scenario: Allow any effective next hop when the chain allowlist is empty

- **WHEN** reference SearchParameter 的 chain allowlist 為空或未宣告，且下一個 hop 的 code 有 effective lookup
- **THEN** runtime SHALL 允許該 next hop

#### Scenario: Reject an undeclared next-hop code when the chain allowlist is non-empty

- **WHEN** reference SearchParameter 的 chain allowlist 非空，且 client 使用未列出的 next-hop code
- **THEN** API SHALL 回傳標準 unknown search parameter error

#### Scenario: Apply the same chained-search rules on Bundle GET and conditional delete

- **WHEN** Bundle GET search validation 或 conditional delete 使用 chained search
- **THEN** 系統 SHALL 套用與 normal search 相同的 depth、cost、type filter、chain allowlist 與錯誤契約

### Requirement: Compiler SHALL produce a typed SearchQueryPlan per lookup resource type

同一 SearchParameter resource 若宣告多個 `base`，compiler SHALL 為每個 `(resourceType, code)` lookup 產生獨立的 `SearchQueryPlan`。Plan 只保留該 resource type 的 expression 分支，並以該 resource 的 Resource type map 標上每個 extraction path 的 FHIR datatype。`SearchQueryPlan` SHALL 以 `extractionPaths`（path + datatype）表達可執行欄位，不得以未標型別的 path 字串清單作為 executor 契約。

#### Scenario: Compile a shared definition for one base
- **WHEN** SearchParameter `base` 包含 Patient 與 Person，且 expression 為 `Patient.address | Person.address`
- **THEN** Patient lookup 的 plan SHALL 只含 Patient 的 `address` extraction path（datatype Address），MUST NOT 含 `Person.address`

#### Scenario: Encode as syntax as a choice element name
- **WHEN** expression 使用 `(Patient.deceased as dateTime)` 或 `Patient.deceased.as(dateTime)`
- **THEN** extraction path SHALL 為 Choice element name `deceasedDateTime`，datatype SHALL 為 Resource type map 上該欄位的型別，MUST NOT 為 `deceaseddateTime`

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

### Requirement: Compiler SHALL omit incompatible search-type and datatype branches

若某 union 分支的 leaf datatype 對該 SearchParameter type 沒有 search-type projection，該分支 SHALL 被視為 Incompatible branch：從該 lookup 的 plan 省略，並產生 diagnostic。MUST NOT 為該分支產生無法匹配儲存資料的 filter。同一 lookup 若仍有可投影分支，definition SHALL 保持有效。若省略後零分支可執行，該 `(resourceType, code)` lookup MUST 被停用。不相容不得升級為停用整個 canonical SearchParameter（其他 `base` 仍可有有效 plan）。

#### Scenario: Omit SampledData from a quantity search
- **WHEN** Observation `value-quantity` expression 包含 `Observation.value as Quantity | Observation.value as SampledData`
- **THEN** 該 lookup 的 plan SHALL 只保留 Quantity 分支（`valueQuantity`），SHALL 為 SampledData 分支留下 diagnostic，MUST NOT 對 `valueSampledData` 套用 Quantity 的 `system`/`value` 投影

#### Scenario: Keep a quantity parameter enabled after omitting SampledData
- **WHEN** quantity SearchParameter 在省略 SampledData 後仍有 Quantity extraction path
- **THEN** 該 `(resourceType, code)` SHALL 仍為有效搜尋參數，client 對 Quantity 值的查詢 MUST 仍可執行

#### Scenario: Disable a lookup with no remaining extraction path
- **WHEN** 某 `(resourceType, code)` 的所有 union 分支皆為 Incompatible branch 或皆不屬於該 resource type
- **THEN** 該 lookup MUST 被停用並產生 diagnostics，MUST NOT 產生空 filter 當作匹配全部文件

#### Scenario: Omit a path missing from the Resource type map
- **WHEN** expression 的某分支在該 resource 的 Resource type map 中找不到對應欄位，或 leaf 為沒有 search-type projection 的 BackboneElement
- **THEN** 該分支 SHALL 被視為 Incompatible branch 並省略，MUST NOT 對未知 path 做 identity projection

### Requirement: Compiler SHALL resolve Patient nested paths generically

Compiler SHALL 透過通用遞迴 datatype/path resolver，從 Patient resource type map 的 datatype root 解析 nested extraction path；resolver MUST NOT 依 Patient SearchParameter code 建立專用 alias 或 compiler branch。解析後的 path SHALL 保留 leaf FHIR datatype，並交由既有 `(search type, datatype)` projection contract。

#### Scenario: Compile Patient address leaf parameters
- **WHEN** Patient SearchParameter expression 使用 `Patient.address.city`、`Patient.address.country`、`Patient.address.postalCode`、`Patient.address.state` 或 `Patient.address.use`
- **THEN** Patient lookup plan SHALL 產生對應 nested extraction path 與 leaf datatype，且 SHALL 分別使用 string 或 token 的既有 projection，不得對 Address object root 產生 filter

#### Scenario: Compile Patient name leaf parameters
- **WHEN** Patient SearchParameter expression 使用 `Patient.name.family` 或 `Patient.name.given`
- **THEN** Patient lookup plan SHALL 產生 `name.family` 或 `name.given` extraction path，datatype SHALL 為其 leaf datatype，且 MUST NOT 依 `family` 或 `given` code 寫入專用 compiler 規則

#### Scenario: Reject unresolved nested paths
- **WHEN** nested path 無法由 resource type map 或 datatype map 解析
- **THEN** 該 branch MUST 成為 Incompatible branch 並留下 diagnostic；MUST NOT 以 datatype root 或未知 path 取代它

### Requirement: Patient predicates SHALL preserve bounded source semantics

Compiler SHALL 將 Patient 的必要 predicate 保留在 SearchQueryPlan，而非只擷取 predicate 前的 path。Allowlist SHALL 僅包含 `exists()`、`and`/`or`、`!= false`，以及 `ContactPoint.system` 等於固定 literal `email` 或 `phone`；其他 literal where comparison MUST 被拒絕。

#### Scenario: Search deceased across the choice element
- **WHEN** client 使用 Patient `deceased=true`
- **THEN** executor SHALL 命中有值的 `deceasedBoolean=true` 或 `deceasedDateTime`，MUST NOT 只查其中一個 choice field

#### Scenario: Search explicit not-deceased state
- **WHEN** client 使用 Patient `deceased=false`
- **THEN** executor SHALL 只命中明確 `deceasedBoolean=false`；缺少 `deceased` element MUST NOT 被當成 explicit false

#### Scenario: Keep death-date separate from deceased
- **WHEN** client 使用 Patient `death-date` 搭配 date comparator
- **THEN** executor SHALL 只對 `deceasedDateTime` 執行 date semantics，MUST NOT 將 `deceasedBoolean` 當成 date

#### Scenario: Correlate email and phone within one ContactPoint
- **WHEN** client 使用 Patient `email` 或 `phone`
- **THEN** executor SHALL 在同一個 ContactPoint element 內同時匹配固定 `system` 與 query value；MUST NOT 用互相獨立的 system/value predicates 造成跨 array element false positive

#### Scenario: Reject an unbounded literal predicate
- **WHEN** expression 使用除固定 `system='email'` 或 `system='phone'` 外的 literal `where` predicate
- **THEN** compiler MUST 停用該 definition 並產生 unsupported diagnostics

### Requirement: Patient search SHALL support the complete declared value contract

上述 23 個 Patient SearchParameter code 的 query SHALL 依其 FHIR SearchParameter resource 與 type capability matrix 驗證 comparator、modifier、multipleOr、multipleAnd；缺少 resource-level multiplicity declaration時 SHALL 使用 FHIR R4 default semantics。不支援的組合 MUST 回傳 invalid search parameter/value error，不得 fallback。

對全部 23 個 code，通用 `:missing` SHALL 可區分「沒有可搜尋的 indexed/projection value」與「至少存在一個可搜尋 value」；`deceased:missing` SHALL 依 deceased choice 的實際有值狀態判定，`email:missing` 與 `phone:missing` SHALL 依固定 system 的 ContactPoint 判定。

#### Scenario: Apply declared multiplicity to every Patient code
- **WHEN** client 對任一 23-code Patient parameter 使用逗號分隔值或重複參數
- **THEN** runtime SHALL 依該 definition 與 capability matrix 的 `multipleOr`/`multipleAnd` 決定 OR/AND 或拒絕，MUST NOT 因 nested path、choice 或 fixed predicate 而改變 conjunction

#### Scenario: Search missing Patient values
- **WHEN** client 使用任一 23-code Patient parameter 的 `:missing=true` 或 `:missing=false`
- **THEN** `true` SHALL 只命中沒有該 parameter 可搜尋 value 的 Patient，`false` SHALL 只命中至少有一個可搜尋 value 的 Patient；projection 邊界（包含 Address.text 不納入）MUST 影響 value existence 判定

#### Scenario: Reject unsupported Patient operators
- **WHEN** client 使用超出該 Patient SearchParameter type capability 的 comparator、modifier 或 multiplicity
- **THEN** API SHALL 回傳標準 invalid search parameter/value error，MUST NOT 靜默改用 legacy handler 或較寬鬆的 filter

### Requirement: Every SearchParameter lookup SHALL have an explicit compiler outcome

For every `(resourceType, code)` lookup derived from the canonical SearchParameter source, the compiler SHALL produce exactly one outcome: an executable typed `SearchQueryPlan`, an explicitly supported unsupported classification, or a diagnostic-backed disabled outcome. A missing fixture, parser ambiguity, or unclassified capability failure MUST NOT be treated as success and MUST NOT trigger legacy behavior.

#### Scenario: Record a compiled lookup
- **WHEN** an expression is valid for a resource type and all required search-type projections are available
- **THEN** the compiler SHALL produce an independent typed plan for that lookup with its extraction paths, predicates, operators, and multiplicity semantics

#### Scenario: Record an unsupported lookup
- **WHEN** a lookup uses an explicitly unsupported SearchParameter type or expression feature
- **THEN** the compiler SHALL record a stable unsupported reason and SHALL produce no executable filter for that lookup

#### Scenario: Reject an unclassified compiler failure
- **WHEN** a lookup cannot be parsed, validated, typed, or projected and the failure is not covered by the unsupported policy
- **THEN** compilation verification SHALL fail with the resource, code, expression, and failure reason

### Requirement: SearchQueryPlan semantics SHALL be consistent across search entry points

Normal search、conditional delete、Bundle GET search validation，以及 controlled reference-chain evaluation SHALL 使用相同的 Registry-derived lookup semantics。Bundle inline special entry point 的直接 identity search 與 chained search SHALL 也使用其固定 target resource 的有效 SearchParameter 定義，不得從 legacy snapshot、舊 field mapping 或參數名稱猜測欄位。

#### Scenario: Apply a plan to normal search

- **WHEN** client 使用有效的 Bundle `composition` 或 `message` search parameter
- **THEN** normal search SHALL 依 Bundle type、第一個 entry 的 resource type、reference value 或 target chain plan 建立一致的 hit-set

#### Scenario: Apply a typed plan to normal resource search

- **WHEN** a client searches a resource using an effective lookup
- **THEN** the executor SHALL apply that lookup's typed plan and declared FHIR value semantics

#### Scenario: Apply a plan to conditional delete

- **WHEN** conditional delete 使用有效的直接 Bundle special search parameter
- **THEN** delete filter SHALL 與 normal search 使用相同的 embedded identity、Bundle gating、value parsing 與 target plan semantics

#### Scenario: Apply a typed plan to conditional delete

- **WHEN** a conditional delete uses an effective SearchParameter lookup
- **THEN** the delete filter SHALL be produced from the same typed plan and SHALL have the same matching semantics as normal search

#### Scenario: Validate Bundle GET search parameters

- **WHEN** Bundle operation 的 GET entry 使用 `composition`、`message` 或其 chained form
- **THEN** validation SHALL 使用相同的 special entry point 與 relation rules，並拒絕 disabled、unsupported、unknown 或超出限制的查詢

#### Scenario: Reject a legacy-only Bundle search

- **WHEN** query 只符合 legacy handler 的所有-entry field mapping，而不符合 canonical Bundle special SearchParameter semantics
- **THEN** request SHALL 不得使用 legacy fallback，也不得將 `entry[1]` 或其他 entry 當成 `entry[0]` special resource

#### Scenario: Reject a legacy-only lookup
- **WHEN** a search entry point receives a code that exists only in the removed legacy snapshot
- **THEN** the request SHALL return the standard unknown or unsupported error and SHALL NOT construct a filter from the legacy snapshot

### Requirement: Controlled reference operations SHALL preserve correlated and bounded semantics

Normal search、`_include`、`_revinclude`、conditional delete、Bundle inline special entry point 與 bounded chained search 所使用的 Reference extraction SHALL 保留 Registry plan 定義的 typed target metadata、同一 array element 關聯與 relation bounds。Runtime MUST 拒絕未宣告的 reference target、不支援的 reference value、未知 hop，以及違反 chained search depth／cost／open-reference type-filter 限制的請求。未知 hop、未宣告的 reference target type 與 disabled lookup SHALL 回傳標準 unknown search parameter error。Relation depth 超過 3、relation cost 超過 24，以及 open reference target 缺少 type filter SHALL 回傳 HTTP 400 OperationOutcome 並 MUST 標明 limit class；MUST NOT 一律視為 unknown search parameter。`Bundle.composition` 與 `Bundle.message` SHALL 只讀取 `entry[0].resource`，不得把 contained Resource 或其他 entry 當成相同的 relation。`_include` 與 `_revinclude` SHALL 維持既有的宣告關係解析，MUST NOT 被當成 chained search path。

#### Scenario: Match a document Bundle composition entry

- **WHEN** Bundle 的 type 為 `document` 且 `entry[0].resource.resourceType` 為 `Composition`
- **THEN** `composition` direct 或 chained search SHALL 只在該 embedded Composition 上評估條件

#### Scenario: Match a message Bundle message entry

- **WHEN** Bundle 的 type 為 `message` 且 `entry[0].resource.resourceType` 為 `MessageHeader`
- **THEN** `message` direct 或 chained search SHALL 只在該 embedded MessageHeader 上評估條件

#### Scenario: Include a declared reference target

- **WHEN** `_include` 請求的 reference 其 source 與 target 皆由 Registry metadata 宣告
- **THEN** 該操作 SHALL 只解析已宣告的 reference path 與 reference target type

#### Scenario: Reverse include by declared reference metadata

- **WHEN** `_revinclude` 請求已宣告的 target relationship
- **THEN** 該操作 SHALL 使用 Registry reference metadata，且 SHALL 拒絕未宣告的 relationship

#### Scenario: Correlate a reference array element

- **WHEN** 一個 reference array element 同時包含 reference value 與 target-type guard
- **THEN** matching SHALL 要求兩個條件都在同一個 array element 上成立，MUST NOT 組合不同 element 的值

#### Scenario: Ignore a non-special first entry

- **WHEN** `entry[0]` 不符合對應的 Bundle type/resource type，即使 `entry[1]` 含有符合的 Composition 或 MessageHeader
- **THEN** special search SHALL 不命中，且不得查詢 `entry[1]` 或其他 entry

#### Scenario: Preserve declared reference target behavior

- **WHEN** chained search 從 Composition 或 MessageHeader 的 Reference 欄位繼續進入另一個 resource
- **THEN** runtime SHALL 只使用 declared/effective target type 與該型別自己的 plan，並維持 reference value validation、type filter 與 relation depth/cost bounds

#### Scenario: Reject an unknown or undeclared relation

- **WHEN** client 請求未宣告的 chain hop、未知 next-hop code、disabled lookup 或未宣告的 reference target type
- **THEN** API SHALL 回傳標準 unknown search parameter error，且 SHALL NOT 執行無界 aggregation

#### Scenario: Reject an unbounded relation

- **WHEN** client 請求未宣告的 chain、超過 relation depth 3、超過 relation cost 24、在 open reference target 上省略 type filter，或不支援的 reference form
- **THEN** API SHALL 回傳標準 invalid、unknown 或具名 limit-class 的 400 錯誤，且 SHALL NOT 執行無界 aggregation

#### Scenario: Reject a chained-search bound with a named diagnostic

- **WHEN** client 的 chained search 超過 relation depth 3、超過 relation cost 24，或在 open reference target 上省略 type filter
- **THEN** API SHALL 回傳 HTTP 400 OperationOutcome 並 MUST 標明 limit class，MUST NOT 回傳 unknown search parameter，且 SHALL NOT 執行無界 aggregation

#### Scenario: Reject an unsupported reference form

- **WHEN** client 請求 versioned、contained 或 logical-identifier 形式的 reference value
- **THEN** API SHALL 回傳標準 invalid search parameter/value error

### Requirement: Search type contracts SHALL be verified for every compiled lookup

Each compiled lookup SHALL be verified against its declared search type, available modifiers, comparators, `multipleOr`, `multipleAnd`, and missing-value semantics. Query combinations outside the capability matrix MUST fail explicitly rather than silently changing conjunction or projection behavior.

#### Scenario: Verify positive and companion negative hit-sets
- **WHEN** a compiled lookup is included in the migration manifest
- **THEN** verification SHALL assert at least one expected hit and one companion document that does not match

#### Scenario: Verify missing-value semantics
- **WHEN** a compiled lookup supports the `:missing` modifier
- **THEN** verification SHALL distinguish the absence of a searchable projected value from the presence of at least one such value

#### Scenario: Verify declared operators and multiplicity
- **WHEN** a test exercises a compiled lookup
- **THEN** verification SHALL cover the declared comparator/modifier and applicable `multipleOr`/`multipleAnd` behavior, or record why the capability is not applicable

#### Scenario: Reject an undeclared query combination
- **WHEN** a client uses an undeclared modifier, comparator, or multiplicity form
- **THEN** query validation SHALL return the standard invalid search parameter/value error and SHALL NOT silently downgrade the request

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
- **THEN** `:missing=true` SHALL 視該 field 為 missing，`:missing=false` SHALL 不因 raw value 存在而命中

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

### Requirement: Bundle special reference entry points SHALL preserve R4 semantics

`Bundle.composition` SHALL 提供對 `document` Bundle 第一個 `Composition` resource 的 reference search access；`Bundle.message` SHALL 提供對 `message` Bundle 第一個 `MessageHeader` resource 的 reference search access。兩者 SHALL 支援直接 identity value 與進入 target resource SearchParameter 的 chained path。直接 identity query SHALL 支援 relative `ResourceType/id`、符合固定 target type 的 bare id，以及可與 `entry[0].fullUrl` 比對的 absolute URL；versioned、contained 與 logical identifier reference MUST 被拒絕。

#### Scenario: Search a Composition by relative identity

- **WHEN** client 使用 `Bundle?composition=Composition/comp-1`
- **THEN** request SHALL 命中第一個 embedded Composition 的 resource identity 為 `comp-1` 的 Bundle

#### Scenario: Search a MessageHeader by absolute entry URL

- **WHEN** client 使用 `Bundle?message=https://example.org/fhir/MessageHeader/msg-1`
- **THEN** request SHALL 命中第一個 MessageHeader 的 `entry[0].fullUrl` 為該 URL 的 Bundle

#### Scenario: Normalize a bare fixed-target id

- **WHEN** client 使用 `Bundle?composition=comp-1` 或 `Bundle?message=msg-1`
- **THEN** runtime SHALL 分別依 `Composition` 或 `MessageHeader` 解析該 bare id

#### Scenario: Reject an identity with the wrong target type

- **WHEN** client 使用 `composition=MessageHeader/msg-1` 或 `message=Composition/comp-1`
- **THEN** request SHALL 回傳 invalid reference value error，且不得命中任何 Bundle

#### Scenario: Reject an invalid reference form

- **WHEN** client 使用 versioned、contained 或 logical identifier value 查詢 `composition` 或 `message`
- **THEN** API SHALL 回傳標準 invalid search parameter/value error，不得降級為字串比對

#### Scenario: Apply a chained target plan

- **WHEN** client 使用 `composition.patient=Patient/123` 或 `message.focus:Patient.name=Smith`
- **THEN** runtime SHALL 將 value parsing 與 multiple-value semantics 交由 chained target SearchParameter，並只在固定 inline target 內評估該條件

#### Scenario: Resolve a Composition subject from the same document Bundle

- **WHEN** client 使用 `composition.subject:Patient.name=Eve Everywoman` 或 `composition.subject:Patient.phone=555-555-2003`，且 `entry[0].resource.subject` 指向同一 Bundle 後續 entry 的 Patient
- **THEN** runtime SHALL 以 target type 與 reference identity 在同一 Bundle 的 entry resource 中評估 Patient terminal filter；同一 Bundle 沒有相符 Patient 時 SHALL 保留外部 Patient collection fallback

#### Scenario: Require a type filter for an open MessageHeader focus

- **WHEN** client 使用 `message.focus.name=Smith`，而 `MessageHeader.focus` 的 targets 為 open
- **THEN** API SHALL 回傳 400 OperationOutcome，並包含 `missing-type-filter`

#### Scenario: Treat invalid stored Bundle content as a non-match

- **WHEN** stored Bundle 缺少第一個 entry、第一個 resource type 錯誤，或 Bundle type 與 special resource 不一致
- **THEN** special search SHALL 回傳不命中，不得將資料內容錯誤轉成 query parameter error
