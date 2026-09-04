## MODIFIED Requirements

### Requirement: Reference chain SHALL be controlled and bounded

Runtime SHALL 支援由 client 指定的 dotted reference path，而不是把 dotted path 視為沿資料圖無限遍歷。Relation depth SHALL 等於參數名稱中的點數，最多為 3；單一路徑的 relation cost SHALL 受 24 限制。每一個 reference hop SHALL 只使用 declared target type 與有效的 target SearchParameter lookup；同一個 `(resourceType, code)` 可在有限路徑中重複出現。Open reference target（declared targets 為空、含 `Resource`，或近乎完整列舉 FHIR resource catalog）MUST 使用 type filter，且缺少 type filter 時 MUST 回傳 `missing-type-filter`。

`Bundle.composition` 與 `Bundle.message` SHALL 被視為固定 inline target 的特殊 reference entry point：前者 target 為 `Composition`，後者 target 為 `MessageHeader`。它們 SHALL 可作為 chained path 的第一個 hop，但不得因 embedded resource 而建立無界或跨任意 collection 的查詢。

#### Scenario: Execute an allowed multi-hop chain
- **WHEN** client 使用有效的 `Observation?subject.organization.name=...` 或 `Organization?partof.partof.name=...`
- **THEN** runtime SHALL 依每個 hop 的 effective target lookup 執行有限深度的 chained search，且不得以資料中的 reference cycle 拒絕合法的 client-specified path

#### Scenario: Execute an allowed one-level chain
- **WHEN** client 使用 target 與 chain 都被 definition 支援的一層 reference chain
- **THEN** runtime SHALL 只匹配 reference target 中符合 chained SearchParameter 的資源，並保留既有一層 chain 的行為

#### Scenario: Execute a Bundle inline entry chain
- **WHEN** client 使用 `Bundle?composition.patient=Patient/123` 或 `Bundle?message.focus:Patient.name=Smith`
- **THEN** runtime SHALL 從符合 Bundle 特規條件的第一個 embedded resource 開始查詢，並將後續 target SearchParameter 的語意套用於該 resource

#### Scenario: Reject an undeclared chain
- **WHEN** client 使用未被 reference target 支援的 chain、未宣告的 type filter、disabled lookup 或不存在的 target SearchParameter
- **THEN** API SHALL 回傳標準的 unknown 或 invalid search parameter error，且不得執行替代查詢

#### Scenario: Reject an open hop without a type filter
- **WHEN** client chain 經過 open reference target 且沒有提供 `:ResourceType`
- **THEN** API SHALL 回傳 400 OperationOutcome，並包含 `missing-type-filter` class token

#### Scenario: Reject a path beyond the relation depth limit
- **WHEN** client 指定的 dotted path 包含超過 3 個 relation hops
- **THEN** API SHALL 回傳 400 OperationOutcome，並包含 `relation-depth` class token，且不執行該 path

#### Scenario: Block recursive chain in phase one
- **WHEN** client 指定的 dotted path 是有限且不超過 relation depth/cost limits 的 chained path，即使某個 lookup key 重複
- **THEN** runtime SHALL 依 client-specified path 執行或依具體 unknown/limit 規則拒絕，不得以「recursive chain」文字或資料層 cycle 作為獨立拒絕理由

#### Scenario: Reject a path beyond the relation cost limit
- **WHEN** 一條 chained search path 的 executable branches 估計成本超過 24
- **THEN** API SHALL 回傳 400 OperationOutcome，並包含 `relation-cost` class token，且不得將內部成本錯誤文字暴露給 client

### Requirement: SearchQueryPlan semantics SHALL be consistent across search entry points

Normal search、conditional delete、Bundle GET search validation，以及 controlled reference-chain evaluation SHALL 使用相同的 Registry-derived lookup semantics。Bundle inline special entry point 的直接 identity search 與 chained search SHALL 也使用其固定 target resource 的有效 SearchParameter 定義，不得從 legacy snapshot、舊 field mapping 或參數名稱猜測欄位。

#### Scenario: Apply a plan to normal search
- **WHEN** client 使用有效的 Bundle `composition` 或 `message` search parameter
- **THEN** normal search SHALL 依 Bundle type、第一個 entry 的 resource type、reference value 或 target chain plan 建立一致的 hit-set

#### Scenario: Apply the same semantics to conditional delete
- **WHEN** conditional delete 使用有效的直接 Bundle special search parameter
- **THEN** delete filter SHALL 與 normal search 使用相同的 embedded identity、Bundle gating、value parsing 與 target plan semantics

#### Scenario: Apply a plan to conditional delete
- **WHEN** conditional delete 使用有效的 Registry-derived lookup
- **THEN** delete filter SHALL 使用與 normal search 相同的 typed plan 與 value semantics；若查詢是 chained search，驗證通過後仍維持 chained delete 的既有執行限制

#### Scenario: Validate Bundle GET search parameters
- **WHEN** Bundle operation 的 GET entry 使用 `composition`、`message` 或其 chained form
- **THEN** validation SHALL 使用相同的 special entry point 與 relation rules，並拒絕 disabled、unsupported、unknown 或超出限制的查詢

#### Scenario: Reject a legacy-only Bundle search
- **WHEN** query 只符合 legacy handler 的所有-entry field mapping，而不符合 canonical Bundle special SearchParameter semantics
- **THEN** request SHALL 不得使用 legacy fallback，也不得將 `entry[1]` 或其他 entry 當成 `entry[0]` special resource

#### Scenario: Reject a legacy-only lookup
- **WHEN** a search entry receives a code that exists only in the removed legacy snapshot
- **THEN** request SHALL 回傳 standard unknown or unsupported error，且不得從 legacy snapshot 建立 filter

### Requirement: Controlled reference operations SHALL preserve correlated and bounded semantics

Reference extraction used by normal search、`_include`、`_revinclude`、conditional delete、Bundle inline special entry point 與 chained search SHALL 保留 Registry plan 的 typed target metadata、same-array-element correlation 與 relation bounds。`Bundle.composition` 與 `Bundle.message` SHALL 只讀取 `entry[0].resource`，不得把 contained Resource 或其他 entry 當成相同的 relation。

#### Scenario: Match a document Bundle composition entry
- **WHEN** Bundle 的 type 為 `document` 且 `entry[0].resource.resourceType` 為 `Composition`
- **THEN** `composition` direct 或 chained search SHALL 只在該 embedded Composition 上評估條件

#### Scenario: Match a message Bundle message entry
- **WHEN** Bundle 的 type 為 `message` 且 `entry[0].resource.resourceType` 為 `MessageHeader`
- **THEN** `message` direct 或 chained search SHALL 只在該 embedded MessageHeader 上評估條件

#### Scenario: Include a declared reference target
- **WHEN** `_include` requests a reference whose source and target are declared by Registry metadata
- **THEN** operation SHALL 只解析 Registry 宣告的 reference path 與 target resource type，且不受 Bundle inline special exception 擴大

#### Scenario: Reverse include by declared reference metadata
- **WHEN** `_revinclude` requests a declared target relationship
- **THEN** operation SHALL 使用 Registry reference metadata，並拒絕未宣告的 relationship

#### Scenario: Correlate a reference array element
- **WHEN** a reference array element contains both a reference value and a target-type guard
- **THEN** matching SHALL 要求兩個條件位於同一個 array element，且不得從不同 element 組合條件

#### Scenario: Ignore a non-special first entry
- **WHEN** `entry[0]` 不符合對應的 Bundle type/resource type，即使 `entry[1]` 含有符合的 Composition 或 MessageHeader
- **THEN** special search SHALL 不命中，且不得查詢 `entry[1]` 或其他 entry

#### Scenario: Preserve declared reference target behavior
- **WHEN** chained search 從 Composition 或 MessageHeader 的 Reference 欄位繼續進入另一個 resource
- **THEN** runtime SHALL 只使用 declared/effective target type 與該型別自己的 plan，並維持 reference value validation、type filter 與 relation depth/cost bounds

#### Scenario: Reject an unbounded relation
- **WHEN** client requests an undeclared chain、unsupported reference form 或超出 relation depth/cost limits 的 relation
- **THEN** API SHALL 回傳標準 invalid、unknown 或具名 relation-limit error，且不得執行無界 aggregation

## ADDED Requirements

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
