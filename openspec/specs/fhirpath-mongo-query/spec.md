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

第一階段 SHALL 支援 `number`、`date`、`string`、`token`、`reference`、`quantity` 與 `uri`。`composite` 與 `special` MUST 被辨識為 unsupported。每種 type、modifier 與 comparator 的可用組合 SHALL 由 capability matrix 宣告；不支援的組合 MUST 被拒絕或停用，不得靜默降級。

#### Scenario: Use a supported search type
- **WHEN** client 使用 capability matrix 宣告支援的 SearchParameter type 與 operator
- **THEN** API SHALL 依該 type 的 FHIR value semantics 建立對應查詢

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

第一階段 SHALL 支援一層 reference chain，且只允許 SearchParameter `chain` 宣告的 target resource 與 target code。Query behavior MUST 能表達 relation target、depth 與成本限制，並預留未來 recursive chain 的 cycle/depth/cost 擴充；不得接受任意字串形成跨 collection lookup。

#### Scenario: Execute an allowed one-level chain
- **WHEN** client 使用 target 與 chain 都被 definition 宣告的 reference search
- **THEN** runtime SHALL 只匹配 reference target 中符合 chained SearchParameter 的資源

#### Scenario: Reject an undeclared chain
- **WHEN** client 使用未被 reference SearchParameter 宣告的 chain 或不符合 target type
- **THEN** API SHALL 回傳標準的無效或 unknown search parameter error

#### Scenario: Block recursive chain in phase one
- **WHEN** client 要求超過一層的 recursive chain
- **THEN** runtime SHALL 拒絕該查詢並保留 relation depth/cost diagnostics，而不執行無界 aggregation

### Requirement: Compiler SHALL produce a typed SearchQueryPlan per lookup resource type

同一 SearchParameter resource 若宣告多個 `base`，compiler SHALL 為每個 `(resourceType, code)` lookup 產生獨立的 `SearchQueryPlan`。Plan 只保留該 resource type 的 expression 分支，並以該 resource 的 Resource type map 標上每個 extraction path 的 FHIR datatype。`SearchQueryPlan` SHALL 以 `extractionPaths`（path + datatype）表達可執行欄位，不得以未標型別的 path 字串清單作為 executor 契約。

#### Scenario: Compile a shared definition for one base
- **WHEN** SearchParameter `base` 包含 Patient 與 Person，且 expression 為 `Patient.address | Person.address`
- **THEN** Patient lookup 的 plan SHALL 只含 Patient 的 `address` extraction path（datatype Address），MUST NOT 含 `Person.address`

#### Scenario: Encode as syntax as a choice element name
- **WHEN** expression 使用 `(Patient.deceased as dateTime)` 或 `Patient.deceased.as(dateTime)`
- **THEN** extraction path SHALL 為 Choice element name `deceasedDateTime`，datatype SHALL 為 Resource type map 上該欄位的型別，MUST NOT 為 `deceaseddateTime`

### Requirement: Executor SHALL apply search-type projection from datatype

Executor SHALL 依 `(search type, FHIR datatype)` 把 extraction path 投影到儲存文件的 leaf 欄位，再組成 Mongo filter。Projection 的 field set 這一階段 SHALL 與既有有效搜尋 API 對齊，不得依參數 code 開特例，也不得把 `parameterHandler` 的 expression 字串切割搬進 compiler。Expression 仍指向 datatype 根。

這一階段的 field set：

- string 於 Address：`line`、`city`、`district`、`state`、`postalCode`、`country`
- string 於 HumanName：`text`、`family`、`given`、`prefix`、`suffix`
- token 於 CodeableConcept：`coding.system`、`coding.code`
- token 於 Identifier 或 ContactPoint：`system`、`value`
- token 於 Coding：`system`、`code`
- token 於 code、boolean、string：該欄位本身
- reference 於 Reference：`reference`
- date 於 Period：`start` 或 `end` 落在查詢區間
- date 於 date、dateTime、instant：該欄位本身
- quantity 於 Quantity：`value`、`system`、`code`
- 其餘 primitive datatype：identity projection，搜尋該 path 本身

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
