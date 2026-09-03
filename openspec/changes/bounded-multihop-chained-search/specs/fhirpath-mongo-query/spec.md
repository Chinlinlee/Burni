## MODIFIED Requirements

### Requirement: Reference chain SHALL be controlled and bounded

Chained search SHALL 是 client 指定的 dotted path，由 relation hop 組成並以 filter parameter 結尾；它 MUST NOT 被當成沿 resource graph 走訪直到 cycle 或 budget 才停下的搜尋。產品 MUST NOT 使用 recursive chain 作為此行為的名稱。Relation depth SHALL 等於參數名稱中的點數，且 MUST NOT 超過 3。系統 MUST NOT 設定 relation cycle limit；同一個 lookup key MAY 在同一條 path 重複。不得接受任意字串形成跨 collection lookup。

沒有 type filter 的封閉 hop SHALL 只繼續宣告的 reference target types 之中、對下一個 code 有 effective lookup 的型別。每個 reference target type SHALL 使用自己的 compiled plan；MUST NOT 只套用最後一個 plan。若沒有任何宣告的 reference target type 對下一個 code 具有 effective lookup，API SHALL 回傳標準 unknown search parameter error，MUST NOT 當成 empty hit-set。

Open reference target（declared reference target types 為空、包含 `Resource`、或列舉 FHIR resource catalog／官方 145 型列表）在該 hop MUST 有 type filter。缺少 type filter 時，runtime SHALL 在套用 relation cost 之前拒絕，並回傳 HTTP 400 OperationOutcome，且 MUST 標明 limit class；MUST NOT 當成 unknown search parameter。Contained Resource extraction paths MUST NOT 被 chain；它們不是 collections，也不是 open reference targets。

Chain allowlist 為空或未宣告時 SHALL 允許任何 effective next-hop code；非空時 SHALL 只允許列出的 codes。未知 hop、未宣告的 reference target type、或 disabled lookup SHALL 仍回傳標準 unknown search parameter error。

Relation cost SHALL 以每條 chained search path 計算，MUST NOT 與非 chain 查詢的 query cost cap 共用。每個 hop SHALL 加總固定 lookup overhead 與各可執行 target plan 的 estimated cost，再乘該 hop 的 fan-out width。Relation cost MUST NOT 超過 24。超過 depth 或 cost 時，API SHALL 回傳 HTTP 400 OperationOutcome 並 MUST 標明 limit class，MUST NOT 執行無界 aggregation，且 MUST NOT 洩漏內部 reason string。

上述 chained search 規則 SHALL 同時套用在 normal search、Bundle GET search validation 與 conditional delete。

#### Scenario: Execute an allowed one-level chain
- **WHEN** client 使用一層 chained search，且每個 hop 都有 effective lookup
- **THEN** runtime SHALL 只匹配 reference target 中符合 chained SearchParameter 的資源

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

### Requirement: Controlled reference operations SHALL preserve correlated and bounded semantics

Normal search、`_include`、`_revinclude`、conditional delete 與 bounded chained search 所使用的 Reference extraction SHALL 保留 Registry plan 定義的 typed target metadata 與同一 array element 關聯。Runtime MUST 拒絕未宣告的 reference target、不支援的 reference value、未知 hop，以及違反 chained search depth／cost／open-reference type-filter 限制的請求。未知 hop、未宣告的 reference target type 與 disabled lookup SHALL 回傳標準 unknown search parameter error。Relation depth 超過 3、relation cost 超過 24，以及 open reference target 缺少 type filter SHALL 回傳 HTTP 400 OperationOutcome 並 MUST 標明 limit class；MUST NOT 一律視為 unknown search parameter。`_include` 與 `_revinclude` SHALL 維持既有的宣告關係解析，MUST NOT 被當成 chained search path。

#### Scenario: Include a declared reference target
- **WHEN** `_include` 請求的 reference 其 source 與 target 皆由 Registry metadata 宣告
- **THEN** 該操作 SHALL 只解析已宣告的 reference path 與 reference target type

#### Scenario: Reverse include by declared reference metadata
- **WHEN** `_revinclude` 請求已宣告的 target relationship
- **THEN** 該操作 SHALL 使用 Registry reference metadata，且 SHALL 拒絕未宣告的 relationship

#### Scenario: Correlate a reference array element
- **WHEN** 一個 reference array element 同時包含 reference value 與 target-type guard
- **THEN** matching SHALL 要求兩個條件都在同一個 array element 上成立，MUST NOT 組合不同 element 的值

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
