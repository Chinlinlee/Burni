## Context

目前 `SearchParameter` registry 以每個 `(resourceType, code)` 建立 typed `SearchQueryPlan`，一般 plan 的 extraction paths 會交給既有 search-type projection 產生 Mongo filter。`composite` 在 capability、activation 與 compiler 仍被視為 unsupported；schema 與官方 fixture 雖保留 `component[]`，但 runtime 沒有 component canonical resolution、composite value parser 或 correlated filter。

本設計必須延續 per-lookup plan、immutable registry snapshot、builtin committed artifact 與 database overlay compile 的既有邊界。不得回復 generated handler 或 `FHIRParametersClean.json` fallback。規格需求見同一 change 下的 `specs/fhir-searchparameter-registry/spec.md`。

## Goals / Non-Goals

**Goals:**

- 讓可由現有 primitive search types 執行的 R4 composite definitions 形成可 hydrate 的 per-lookup plan。
- 重用既有 token、quantity、number、date/dateTime、string、reference、uri projection 與 operator validation。
- 在 composite root scope 中維持 component 的同元素 correlation，並將 union branches 分開評估。
- 以 escape-aware parser 實作 R4 Pair、OR、重複參數 AND 與明確的 invalid-value errors。
- 讓 builtin artifact、migration diagnostics、fixture/hit-set 與 registry snapshot 對 composite outcome 可重現。

**Non-Goals:**

- 不支援 component 再指向 `composite`、`special` 或 chained SearchParameter。
- 不新增 `_filter`、reverse chaining、跨 resource `$lookup` 或新的 SearchParameter schema。
- 不把所有任意 FHIRPath 變成可執行 expression；無法由現有 type map 與 projection 安全表達的 definition 維持 disabled。
- 不改變非 composite search parameter 的既有 comma/repeated parameter 語意。

## Decisions

### 1. 在 compiler 中採用兩階段 definition compilation

先以既有流程編譯非-composite definitions，建立 canonical resolver 可查詢的 component metadata；再對 composite definition 執行 component resolution 與 composite plan compilation。resolver 以 `url::version` 精確匹配，component 未指定 version 時使用既有 FHIR R4 default version。

每個 composite lookup 產生自己的 plan，包含：

- `searchType: "composite"` 與 composite plan kind。
- root scope branches。
- component 順序、引用 definition identity、component search type、relative extraction paths。
- 每個 component 可用 comparator/modifier、`multipleOr`/`multipleAnd` 與 projection metadata。
- correlation scope、required indexes、estimated cost 與 compile diagnostics。

這延續現有「plan 不能跨 resource base 共用」的決策。只把所有 component definition 暫存成 map 而不產生 per-lookup scope 會讓 multi-base union expression 使用錯誤 resource type，因此不採用。

### 2. 以 composite expression 與 component expression 組合 scope-relative paths

對每個 composite root branch，先解析 composite `expression` 的 scope path，例如 `Observation.component`、`ActivityDefinition.useContext` 或 `DocumentReference.relatesTo`。再將 component expression 解析為 scope-relative path；支援現有 choice、union、`as`/`ofType`、literal predicate 與 `%resource` 規則。

每個 component 會使用被引用 SearchParameter 的 search type 與 operator metadata，但實際 extraction path 使用 composite component 的 expression。若 component expression 無法在該 root branch 的 resource type map 中得到 compatible datatype，該 branch 失敗；若所有 branches 都失敗，整個 lookup disabled。

相較於直接重用被引用 SearchParameter 的完整 plan，這可避免 component plan 把自己的 resource root 或 unrelated array scope 帶入 composite。相較於只拼接字串 path，顯式 scope compilation 能處理 root-relative expression、choice elements 與 type map diagnostics。

### 3. 新增 composite-specific value parser，primitive value 仍交給既有 parser

runtime 對 composite parameter name 先拒絕 modifier，再將每個 raw query value 以 escape-aware tokenizer 處理：

1. 在未跳脫的 `,` 拆出完整 Pair，形成同一 query parameter 的 OR groups。
2. 在每個 Pair 中以未跳脫的 `$` 拆成固定數量的 component tokens。
3. 將 `\$`、`\,`、`\|`、`\\` 還原成 literal；未知或結尾 escape 視為 invalid。
4. 將每個 component token 交給對應 component search type 的既有 value/comparator parser 與 operator validator。

composite 的 Pair list 依 R4 文件支援 comma OR；重複 query parameter 的 groups 以 AND 組合。這是 composite value 的專用語意，不將 scalar `multipleOr` 檢查錯誤套用到 Pair list。component token 仍遵守其引用 SearchParameter 的 comparator、modifier 與 value validation。

不直接把 composite raw value 送進現有 `parseSearchValue`，因為該 parser 不知道 component 邊界，會先把 component 內的語法錯當成整體 parameter 的 comma group。

### 4. 以 correlated filter builder 產生 Mongo filter

每個 Pair 先為各 component branch 產生 primitive filter，再依 root scope 組合：

- 非陣列 scalar scope：以 `$and` 組合 component filters。
- 單一陣列 scope：把 component relative filters 放進同一個 scope field 的 `$elemMatch`。
- 多個合法 root branches：每個 branch 形成一個完整 Pair filter，branches 以 `$or` 組合。
- Pair list OR：各 Pair filter 以 `$or` 組合。
- 重複 query parameter AND：各 raw group filter 以 `$and` 組合。

component filter builder 會把 primitive projection 產生的 scope-relative keys 改寫到同一 `$elemMatch` document；遇到既有 projection 已產生自身 correlation 的 reference/token/temporal filter 時，先保留其 correlation metadata，無法安全嵌入共同 scope 則在 compile 時停用該 branch，而不是在 runtime 放寬條件。

Mongo filter 仍經既有 safety assertion；不新增 `$where` 或任意使用者提供的 `$function`。query cost 以 component 數量、root branches 與 extraction branches 計算，超過既有限制時以 invalid/unsupported diagnostics 拒絕。

### 5. Registry activation 與 artifact 使用同一 compile result

移除 `composite` 作為 unconditional unsupported type 的 activation/compiler 分支，改由 composite compilation outcome 決定 active 或 disabled。`buildRegistrySnapshot` 不需特殊信任 composite；只要 lookup plan 可執行，就沿用既有 `byLookupKey` active path。

builtin generate command 的單一 compile pass 同時輸出：

- runtime compiled builtin definitions，保存 hydrated composite plan 所需 metadata；
- lookup matrix 的 compiled/unsupported outcome；
- migration manifest、hit-set 與 resource enablement；
- diagnostics 中的 component identities、scope 與失敗原因。

artifact hydrate 不重新編譯 builtin；資料庫 SearchParameter overlay 仍在 reload 時編譯。artifact identity 欄位與 checksum 規則維持不變。

### 6. 以代表性 fixture 驗證 correlation 與 value semantics

測試分成純 parser、compiler plan、filter shape、registry/artifact 與 integration 層。integration fixture 至少涵蓋 Observation component code/value、Group characteristic/value、DocumentReference relatesTo、useContext quantity/value，以及含 union/choice 的 MolecularSequence composite。

正向測試必須搭配：

- code 在元素 A、value 在元素 B 的 negative fixture；
- comma Pair OR 與重複 parameter AND；
- escaped separators；
- 缺少/過多 component、空 token、trailing escape、modifier 與 unsupported operator。

不以 legacy filter equality 作為 composite enablement 條件；以 compiled plan golden filter、document hit-set、diagnostics completeness 與 artifact identity gates 作為啟用條件。

## Risks / Trade-offs

- [Risk] 官方 composite definitions 使用的 FHIRPath scope 與 component expression 可能超出目前 type map 或 projection 能力。→ [Mitigation] 逐 branch 編譯並保留穩定 component diagnostics；只有所有必要 scope 都可執行時才 active。
- [Risk] `$elemMatch` 嵌入既有 token/reference/temporal filter 時可能遺失內層 correlation。→ [Mitigation] 以 scope-relative filter builder 保留 correlation metadata，並以 cross-element negative fixtures 阻止回歸。
- [Risk] Pair list 與 component literal 的 comma/pipe escaping 會造成相容性錯誤。→ [Mitigation] parser 使用單一 escape-aware tokenizer，先測試 delimiter classification，再交給 primitive parser。
- [Risk] 啟用 46 個 builtin composite 會改變 migration resource enablement 與 committed JSON artifacts。→ [Mitigation] generate command 一次重建所有產物，執行 artifact identity、manifest drift、resource enablement 與完整 search-parameter 測試。
- [Risk] composite query filter 的 branch 數量可能造成 Mongo cost 增長。→ [Mitigation] 沿用並擴充既有 cost limit、required index metadata 與 invalid query error，不在 runtime 無限制展開。

## Migration Plan

1. 先新增 compiler/parser/filter 與 registry 測試，確認既有 non-composite lookup output 不變。
2. 實作 composite plan與 runtime semantics，啟用通過 component validation 的 definitions。
3. 執行既有 SearchParameter artifact generate command，更新 committed runtime/migration artifacts 並驗證 identity、manifest drift 與 enablement。
4. 執行 fast search-parameter tests，必要時執行完整 test profile 與 targeted Mongo integration。
5. 若需 rollback，回復 composite compiler/activation/runtime changes 及同一 commit 產生的 artifacts；registry reload 會再次將 composite lookup 視為 disabled，其他 search types 不受影響。
