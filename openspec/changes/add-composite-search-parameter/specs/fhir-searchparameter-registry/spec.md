## ADDED Requirements

### Requirement: Composite SearchParameter SHALL resolve executable components

有效的 composite SearchParameter MUST 依每個 component 的 `definition` canonical 解析既有 SearchParameter，並以該 definition 的搜尋型別、可用 operator 與 component expression 驗證查詢。component canonical 找不到、指向 `composite` 或 `special`、使用 chain、缺少必要 expression，或無法在 composite 根 expression 的 scope 中建立有效搜尋條件時，整個 `(base, code)` lookup SHALL disabled，且 diagnostics MUST 包含 composite identity、component identity 與穩定失敗原因。

#### Scenario: Compile a supported composite definition
- **WHEN** composite definition 的所有 components 都能解析為受支援的非 chained SearchParameter，且每個 component expression 都能在共同 root scope 中建立搜尋條件
- **THEN** registry SHALL 將該 `(base, code)` lookup 標記為 effective active，並保留可執行的 composite definition

#### Scenario: Disable a composite with an unresolved component
- **WHEN** 任一 component 的 canonical 找不到或其 expression 無法安全編譯
- **THEN** 該 composite lookup SHALL disabled，搜尋 API SHALL 不得以部分 components 或 legacy handler 執行查詢，diagnostics SHALL 指出失敗的 component

#### Scenario: Reject unsupported component composition
- **WHEN** component 指向 `composite`、`special` 或使用 chained search
- **THEN** 整個 composite lookup SHALL disabled，且 SHALL NOT 靜默展開為獨立欄位條件

### Requirement: Composite search values SHALL follow FHIR R4 escaping and multiplicity

composite query value MUST 由 component values 以未跳脫的 `$` 組成單一 Pair。未跳脫的 `,` MUST 將同一 query parameter 中的多組 Pair 分隔為 OR；重複同名 query parameter MUST 將各組 Pair 以 AND 組合。`$`、`,`、`|` 與 `\` 出現在 literal value 中時 MUST 依 R4 規則使用反斜線 escaping；composite parameter SHALL NOT 接受 modifier。

#### Scenario: Match one composite Pair
- **WHEN** client 以正確 component 順序提交 `component-a$component-b`
- **THEN** resource SHALL 只有在同一 composite scope 同時符合兩個 component values 時命中

#### Scenario: Match OR-ed composite Pairs
- **WHEN** client 提交 `pair-a,pair-b`
- **THEN** resource SHALL 在符合 pair-a 或 pair-b 任一完整 Pair 時命中，且每個 Pair 內的 components MUST 共同符合

#### Scenario: Match repeated composite parameters as AND
- **WHEN** client 重複提交 composite parameter，例如 `pair-a&pair-b`
- **THEN** resource SHALL 只有在同時符合 pair-a 與 pair-b 時命中

#### Scenario: Preserve escaped separators
- **WHEN** component literal contains `\$`、`\,`、`\|` 或 `\\`
- **THEN** parser SHALL 將 escaped sequence 還原為 literal `$`、`,`、`|` 或 `\`，不得將其視為 composite、OR 或 token separator

#### Scenario: Reject malformed composite values
- **WHEN** value 缺少 `$`、component 數量不符、包含空 component、結尾有未完成 escape，或使用 composite modifier
- **THEN** API SHALL 回傳既有 HTTP 400 invalid-search-value contract，且不得執行部分匹配

### Requirement: Composite component conditions SHALL preserve correlation

composite components MUST 在 composite SearchParameter 根 expression 所產生的同一 scope 中評估。當 root scope 是陣列元素時，所有 component conditions MUST 對同一陣列元素成立；不同元素分別符合不同 component 不得形成命中。

#### Scenario: Match components on the same array element
- **WHEN**同一個陣列元素同時包含 composite Pair 所要求的 component values
- **THEN** resource SHALL 命中

#### Scenario: Do not cross-match different array elements
- **WHEN**一個陣列元素只符合第一 component，另一個陣列元素只符合第二 component
- **THEN** resource SHALL 不命中該 composite Pair

#### Scenario: Preserve correlation across union branches
- **WHEN** composite root expression 包含多個合法 root branches
- **THEN** 每個 branch SHALL individually 保持 component correlation，resource 只有在任一 branch 完整符合時命中

### Requirement: Composite query errors SHALL be explicit and non-broadening

composite query 的 syntax、component type、operator、modifier 或 multiplicity 錯誤 MUST 透過既有 invalid search value error contract 回報。系統 MUST NOT 將 composite 查詢降級為獨立 component 的 `$and`、未關聯欄位比對或 legacy fallback。

#### Scenario: Reject an unsupported component operator
- **WHEN** component value 使用其 SearchParameter 未宣告或未支援的 comparator/modifier
- **THEN** API SHALL 回傳 HTTP 400，且 SHALL NOT 回傳可能由較寬鬆比對產生的結果

#### Scenario: Keep disabled composite behavior deterministic
- **WHEN** registry diagnostics 已將 composite lookup 標記為 disabled
- **THEN** runtime SHALL 使用既有 unknown/unsupported search parameter error flow，且 SHALL NOT 呼叫 generated legacy handler

## MODIFIED Requirements

### Requirement: Registry SHALL apply activation policy without mutating source resources

Registry SHALL 將原始 resource metadata 與 Burni effective activation 狀態分開。受信任官方 R4 Bundle 中可編譯的 draft（包含 components 可解析且可建立 correlated composite plan 的 composite definition）可以透過 activation overlay 視為 effective active；資料庫中的 draft、unknown、retired 與未明確允許的 experimental definition MUST NOT 啟用。

#### Scenario: Promote a compilable official draft
- **WHEN** 受信任官方 R4 Bundle 的 SearchParameter `status` 為 `draft` 且 compiler 可處理其一般或 composite semantics
- **THEN** registry SHALL 將它標記為 effective active，但原始 resource 的 `status` SHALL 仍為 `draft`

#### Scenario: Keep database draft disabled
- **WHEN** 資料庫中的 SearchParameter `status` 為 `draft`
- **THEN** 該定義 MUST NOT 出現在有效搜尋參數或可用 capability 中

#### Scenario: Disable retired or unknown definition
- **WHEN** SearchParameter 的 `status` 為 `retired` 或 `unknown`
- **THEN** 該定義 MUST NOT 被搜尋 API 使用

#### Scenario: Activate a valid builtin composite
- **WHEN** 官方 composite SearchParameter 為可啟用狀態，且所有 components 都通過 canonical、expression、type 與 correlation validation
- **THEN** registry SHALL 將該 composite lookup 標記為 effective active，並保留原始 component metadata

#### Scenario: Keep an invalid builtin composite disabled
- **WHEN** 官方 composite SearchParameter 的 component resolution 或 correlated plan validation 失敗
- **THEN** registry SHALL 將該 composite lookup 標記為 disabled，並保留可追蹤的 component diagnostics

### Requirement: Registry SHALL enable every production resource without legacy fallback

Every resource type listed in the production resource catalog SHALL have a final Registry outcome. A resource with no SearchParameter lookup SHALL pass a structural Registry gate. A resource with SearchParameter lookups SHALL enable only after every lookup is either compiled and gated or explicitly classified as unsupported with a stable diagnostic; composite lookup SHALL be compiled and gated when its components are executable, and SHALL be explicitly classified as unsupported only when its component contract cannot be satisfied. Missing fixture data alone MUST NOT create an implicit skip or fallback.

#### Scenario: Enable a resource with compiled lookups
- **WHEN** every applicable lookup for a resource has a valid per-lookup plan and passes its golden and document hit-set gates
- **THEN** that resource SHALL be enabled for Registry-first search

#### Scenario: Enable a resource with no SearchParameters
- **WHEN** a production resource has no effective or unsupported SearchParameter lookup
- **THEN** it SHALL pass a structural Registry gate and SHALL not require a search hit-set

#### Scenario: Reject incomplete resource enablement
- **WHEN** a resource has an unclassified compiler failure, missing lookup outcome, unresolved conflict, or untracked fixture gap
- **THEN** the resource MUST NOT be enabled and the diagnostics SHALL identify the blocking lookup and reason

#### Scenario: Keep unsupported lookups explicit
- **WHEN** a lookup is `special`, expressionless, outside the approved compiler capability, or a composite lookup has an unresolved component, unsupported component type, invalid scope, or other approved compiler failure
- **THEN** Registry SHALL record a stable unsupported diagnostic, expose no executable plan for that lookup, and MUST NOT use legacy fallback

#### Scenario: Enable executable composite lookups
- **WHEN** a composite lookup has resolved components, valid R4 value semantics, correlated extraction paths, and passing golden/document hit-set gates
- **THEN** the lookup SHALL be effective in the resource Registry snapshot and SHALL execute through its compiled plan
