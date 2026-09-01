# fhir-searchparameter-registry Specification

## Purpose

提供以 FHIR R4 SearchParameter resource 為契約的有效搜尋定義來源，讓內建與自訂搜尋參數可以被驗證、診斷、原子更新並一致地提供給搜尋 API。

## Requirements

### Requirement: Registry SHALL use FHIR SearchParameter resources as definitions

有效搜尋定義 MUST 來自 FHIR R4/4.0.1 SearchParameter resource。官方 R4 Bundle 仍是 builtin 的 canonical source；generate 流程 MUST 從該 Bundle 編譯。預設 runtime 載入 MUST hydrate 由該 Bundle 產出的 committed compile artifact，且不得以精簡欄位快照取代 resource 的語意欄位。Registry SHALL 能將 hydrate 後的 builtin 與資料庫中的 SearchParameter resource 合併。

#### Scenario: Load trusted built-in definitions

- **WHEN** 預設 registry reload 成功
- **THEN** 每個可驗證且可編譯的官方 SearchParameter resource SHALL 成為候選有效定義，並保留原始 resource 與 provenance，且該結果 MUST 來自與目前 Bundle／compiler／type maps identity 相符的 committed compile artifact

#### Scenario: Ignore reduced legacy definition as source of truth

- **WHEN** registry 需要建立搜尋定義
- **THEN** `FHIRParametersClean.json` 或 generated handler 的欄位快照 MUST NOT 成為新的 canonical definition source

### Requirement: Registry SHALL apply activation policy without mutating source resources

Registry SHALL 將原始 resource metadata 與 Burni effective activation 狀態分開。受信任官方 R4 Bundle 中可編譯的 draft 可以透過 activation overlay 視為 effective active；資料庫中的 draft、unknown、retired 與未明確允許的 experimental definition MUST NOT 啟用。

#### Scenario: Promote a compilable official draft
- **WHEN** 受信任官方 R4 Bundle 的 SearchParameter `status` 為 `draft` 且 compiler 可處理
- **THEN** registry SHALL 將它標記為 effective active，但原始 resource 的 `status` SHALL 仍為 `draft`

#### Scenario: Keep database draft disabled
- **WHEN** 資料庫載入的 SearchParameter `status` 為 `draft`
- **THEN** 該定義 MUST NOT 出現在有效搜尋參數或可用 capability 中

#### Scenario: Disable retired or unknown definition
- **WHEN** SearchParameter 的 `status` 為 `retired` 或 `unknown`
- **THEN** 該定義 MUST NOT 被搜尋 API 使用

### Requirement: Registry SHALL provide deterministic identity and conflict handling

Registry SHALL 以 canonical `url` 與 `version` 識別 SearchParameter definition，並以 `(base, code)` 建立查詢索引。不同 definition 若對同一 `(base, code)` 形成 active conflict，registry MUST 拒絕該衝突，不得依載入順序或不透明優先權選擇。

#### Scenario: Replace the same canonical definition
- **WHEN** Bundle 與資料庫提供相同 canonical `url/version` 的 definition
- **THEN** registry SHALL 將其視為同一 definition，並依既定來源規則保留一份有效 entry

#### Scenario: Reject different active definitions with the same lookup key
- **WHEN** 兩個 effective active definition 對同一 resource base 與 code 提供不一致的 canonical definition
- **THEN** 該 `(base, code)` MUST 不可用，且 registry diagnostics SHALL 說明所有衝突來源

### Requirement: Registry SHALL expose atomic snapshots and diagnostics

Registry SHALL 以 immutable snapshot 回應搜尋請求。啟動載入、SearchParameter CRUD 成功後或管理操作明確觸發 reload 時，更新 MUST 以 atomic snapshot 方式完成；已開始的請求 SHALL 使用單一一致 snapshot。每個停用、衝突或驗證失敗的 definition SHALL 有可追蹤 diagnostics。

#### Scenario: Reload after a valid database update
- **WHEN** active database SearchParameter 通過驗證並觸發 reload
- **THEN** 後續請求 SHALL 使用包含新 definition 的新 snapshot，而不需重啟服務

#### Scenario: Preserve in-flight snapshot consistency
- **WHEN** registry reload 與搜尋請求同時發生
- **THEN** 該搜尋請求 SHALL 從頭到尾使用同一份舊或新 snapshot，不得混用兩份定義

#### Scenario: Diagnose an unusable definition
- **WHEN** definition 因為 status、expression、type、conflict 或 compiler capability 而被停用
- **THEN** diagnostics SHALL 包含 canonical identity、base/code、停用原因與來源 provenance

### Requirement: Registry SHALL preserve search API compatibility during migration

Registry SHALL be the sole effective runtime definition path for every production resource type. The runtime MUST NOT load generated SearchParameter handlers, `FHIRParametersClean.json`, or any other legacy SearchParameter definition source. Effective definitions SHALL use their compiled Registry plan; disabled, conflicted, unsupported, or otherwise unavailable definitions SHALL use the existing unknown search parameter error flow and MUST NOT fall back to legacy behavior.

#### Scenario: Search with an effective registry definition
- **WHEN** a client uses a `(resourceType, code)` lookup present in the effective Registry snapshot
- **THEN** runtime SHALL execute that lookup's compiled Registry plan and MUST NOT call a generated legacy handler

#### Scenario: Search with a disabled definition
- **WHEN** a client uses a SearchParameter that is present in the source but disabled, conflicted, or explicitly unsupported
- **THEN** API SHALL treat it as an unknown or unsupported search parameter according to the existing error contract and MUST NOT execute a legacy fallback

#### Scenario: Search with a completely unknown code
- **WHEN** a client uses a code that is not present in the Registry source or disabled/conflict index
- **THEN** API SHALL return the existing unknown search parameter error and MUST NOT consult a generated handler

#### Scenario: Preserve the compatibility boundary
- **WHEN** Registry executes a search whose projection has a documented compatibility-plus-corrections boundary
- **THEN** behavior SHALL preserve the existing valid public projection boundary while applying approved corrections, and MUST NOT claim unsupported full R4 semantics

#### Scenario: Compare legacy and registry behavior
- **WHEN** a migration-only verification process compares a historical legacy result with a Registry result
- **THEN** the comparison SHALL be diagnostic-only, MUST NOT alter the Registry plan or runtime result, and SHALL not be required after legacy removal

#### Scenario: Do not gate enablement on shadow filter equality
- **WHEN** Registry correctness tests pass but a migration-only comparison reports a filter mismatch caused by a known legacy defect
- **THEN** the resource SHALL remain eligible for enablement, provided all Registry gates pass, and the mismatch SHALL remain diagnostic-only

#### Scenario: Enable a resource type with registry correctness tests
- **WHEN** a resource type has passed its SearchQueryPlan golden filter tests, document fixture tests, and applicable diagnostics gates
- **THEN** it SHALL be enabled for Registry-first search without requiring legacy filter equality

### Requirement: Patient SHALL provide a complete registry migration contract

Patient 的第一階段遷移範圍 SHALL exactly cover the following 23 codes：

`active`, `address`, `address-city`, `address-country`, `address-postalcode`, `address-state`, `address-use`, `birthdate`, `death-date`, `deceased`, `email`, `family`, `gender`, `general-practitioner`, `given`, `identifier`, `language`, `link`, `name`, `organization`, `phone`, `phonetic`, `telecom`。

每個 code MUST 在 Patient lookup 上具有 effective compiled definition，且 MUST 通過該 code 的 type、comparator、modifier、multipleOr、multipleAnd 與通用 `:missing` contract。每個 code 的 document fixture MUST 同時驗證預期命中與 companion 不命中。

#### Scenario: Activate the complete Patient code set
- **WHEN** 上述 23 個 Patient code 的 compiler、query contract 與 document hit-set tests 全部通過
- **THEN** `Patient` SHALL 加入 registry-first `enabledResourceTypes`，且 23 個 `(Patient, code)` lookup MUST 出現在 effective registry snapshot

#### Scenario: Do not fallback a migrated Patient code
- **WHEN** client 查詢上述 23 個已 effective 的 Patient code
- **THEN** runtime MUST 使用該 lookup 的 registry compiled plan，MUST NOT 呼叫 generated legacy handler 作為 fallback；shadow comparison MAY 記錄差異，但 MUST NOT 覆寫 registry result

#### Scenario: Keep non-migrated Patient definitions reversible
- **WHEN** client 查詢未列於本次 23-code contract 的 Patient custom/unknown code
- **THEN** migration 期間 SHALL 保留既有 unknown lookup 與 legacy fallback/rollback policy；這項保留 MUST NOT 讓已列出的 23 個 code 回到 legacy

#### Scenario: Preserve the compatibility boundary
- **WHEN** registry 執行 Patient `address` 或 `phonetic` search
- **THEN** behavior SHALL 保留既有 projection boundary：`Address.text` 不納入本階段 `address` projection，`phonetic` 維持既有字串匹配；完整 R4 Address.text 或 phonetic matching MUST NOT 被本次 migration 默默宣稱為已支援

### Requirement: Registry SHALL enable every production resource without legacy fallback

Every resource type listed in the production resource catalog SHALL have a final Registry outcome. A resource with no SearchParameter lookup SHALL pass a structural Registry gate. A resource with SearchParameter lookups SHALL enable only after every lookup is either compiled and gated or explicitly classified as unsupported with a stable diagnostic; missing fixture data alone MUST NOT create an implicit skip or fallback.

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
- **WHEN** a lookup is `composite`, `special`, expressionless, or outside the approved compiler capability
- **THEN** Registry SHALL record a stable unsupported diagnostic, expose no executable plan for that lookup, and MUST NOT use legacy fallback

### Requirement: Migration fixtures and manifest SHALL be reproducible

Migration verification SHALL use one explicitly mapped official example per resource when available. Original examples SHALL remain unchanged; derived or synthetic fixtures SHALL be stored in the version-controlled fixture archive with their origin and augmentation recorded. A committed manifest SHALL identify the source bundle, lookup, compiled plan outcome, fixture provenance, and expected hit-set for each applicable lookup.

#### Scenario: Use a fixed official example
- **WHEN** a resource has an approved official example mapping
- **THEN** the migration test SHALL use that mapped file, verify its resource type and recorded hash, and MUST NOT silently select a different example

#### Scenario: Augment an incomplete example
- **WHEN** the mapped example lacks a value required to exercise a compiled lookup
- **THEN** the test suite SHALL use a derived or synthetic fixture that records the augmentation and SHALL preserve the original example

#### Scenario: Cover a resource without an official example
- **WHEN** no official example is available for a production resource
- **THEN** the migration archive SHALL provide a minimal valid synthetic fixture identified as synthetic so the resource can satisfy its applicable Registry gates

#### Scenario: Verify a lookup hit-set
- **WHEN** a compiled lookup is included in the migration manifest
- **THEN** its test SHALL assert the expected positive hit-set and companion negative hit-set, plus applicable missing-value and declared operator/multiplicity behavior

### Requirement: Diagnostics SHALL enforce migration completion

The Registry diagnostics command SHALL report all source definitions and per-resource lookups with canonical identity, raw/effective status, compiler outcome, unsupported reason, conflict state, fixture provenance, and enablement state. Continuous verification SHALL fail when any lookup is unknown, conflicted, unclassified, or has a compiler failure that is not explicitly allowed by the unsupported policy.

#### Scenario: Produce a complete diagnostics report
- **WHEN** diagnostics runs against the canonical R4 Bundle and current DB overlay
- **THEN** the report SHALL account for every source definition and `(resourceType, code)` lookup without an unclassified outcome

#### Scenario: Fail on a newly introduced failure
- **WHEN** a source or compiler change creates an unknown lookup, active conflict, or unapproved compiler failure
- **THEN** diagnostics verification SHALL fail and identify the affected resource, code, source, and reason

#### Scenario: Retain diagnostics after rollout tooling removal
- **WHEN** Registry-first migration is complete
- **THEN** diagnostics SHALL remain available as an operational and CI command, while shadow comparison and rollout-status commands SHALL no longer be required

### Requirement: Legacy SearchParameter source SHALL be removed after migration gates

After all production resource gates, runtime call-site checks, diagnostics checks, and replacement tests pass, the system SHALL remove SearchParameter-specific legacy source and generated handler generation. Non-SearchParameter API generation and control-parameter behavior SHALL remain available.

#### Scenario: Remove legacy definition source
- **WHEN** no production runtime, build path, test contract, or diagnostic command requires `FHIRParametersClean.json`
- **THEN** the file SHALL be removed and no runtime or build command SHALL reference it

#### Scenario: Remove generated search handlers
- **WHEN** all normal search, chain, include/revinclude, conditional delete, and Bundle GET validation paths use Registry metadata or plans
- **THEN** generated `*ParametersHandler.js` files and their SearchParameter generation path SHALL be removed

#### Scenario: Preserve non-search API generation
- **WHEN** SearchParameter generation is removed
- **THEN** CRUD, history, validation, Bundle operations, response handling, pagination, summary, and other non-SearchParameter API behavior SHALL remain available

#### Scenario: Remove transitional commands
- **WHEN** no release or enablement decision depends on legacy comparison or rollout status
- **THEN** `search-parameter:shadow` and `search-parameter:rollout-status` SHALL be removed, while `search-parameter:diagnostics` SHALL remain

### Requirement: Default registry reload SHALL NOT compile builtin definitions

預設 registry reload（含 application readiness 所等待的那次載入）MUST NOT 編譯官方 Bundle 的 builtin SearchParameter definitions。該路徑 MUST 核對 committed compile artifact 的 identity、hydrate compile 輸出、編譯資料庫 overlay、再套用既有 activation／merge／snapshot 規則。Artifact 缺失或 identity 不符時，reload MUST 失敗，application readiness MUST reject，且錯誤訊息 MUST 指出既有的 SearchParameter generate 指令。以非預設 Bundle 路徑覆寫來源僅供測試；production connector MUST NOT 使用該覆寫。

#### Scenario: Application becomes ready from the committed artifact

- **WHEN** committed compile artifact 存在且 identity 與目前 Bundle、compiler 與 type maps 相符
- **THEN** application readiness 所等待的 registry reload SHALL 成功產出完整 snapshot，且 MUST NOT 編譯 builtin definitions

#### Scenario: Reject ready when the artifact is missing or stale

- **WHEN** committed compile artifact 缺失，或其 identity 與目前 Bundle、compiler 或 type maps 不符
- **THEN** 預設 registry reload MUST 失敗，application readiness MUST reject，且錯誤訊息 MUST 指出 generate 指令

#### Scenario: Reload after SearchParameter CRUD uses the in-process builtin compile result

- **WHEN** SearchParameter 資源建立、更新或刪除成功並觸發 registry reload
- **THEN** 新 snapshot SHALL 包含當前資料庫 overlay，且該次 reload MUST NOT 重新編譯 builtin definitions

#### Scenario: Test override may compile a non-default bundle

- **WHEN** 測試以非預設 Bundle 路徑明確覆寫 registry 來源
- **THEN** 該次 reload MAY 編譯該覆寫來源；此行為 MUST NOT 成為 production 啟動路徑

### Requirement: Builtin compile artifact SHALL be generated in one pass with verifiable identity

系統 MUST 以版本控制的 committed artifact 保存 builtin 的 compile 輸出（lookup plans、compilable 狀態與 compiler diagnostics），且 MUST NOT 把 activation overlay 或資料庫 overlay 凍進該 artifact。Identity MUST 使用 SHA-256，涵蓋官方 Bundle checksum、compiler 目錄、type maps 目錄與 artifact body checksum。唯一準許編譯預設 builtin 的入口是既有 SearchParameter generate 指令；該指令 MUST 在一次 compile pass 中同時寫入 runtime compile artifact 與既有 migration artifacts。`npm run build` MUST NOT 執行此 generate。

#### Scenario: Maintainer regenerates after compiler or source inputs change

- **WHEN** 官方 Bundle、compiler 或 type maps 變更後執行 SearchParameter generate 指令
- **THEN** 系統 SHALL 以一次 compile pass 更新 runtime compile artifact 與既有 migration artifacts，且 artifact header SHALL 記錄可核對的 identity 與 body checksum

#### Scenario: API generation does not refresh the compile artifact

- **WHEN** 開發者執行 `npm run build`
- **THEN** SearchParameter builtin compile artifact MUST NOT 被該指令重新產生

#### Scenario: Activation policy can change without regenerating compile output

- **WHEN** 僅 activation overlay 政策變更且 Bundle、compiler 與 type maps identity 仍相符
- **THEN** 預設 registry reload SHALL 仍 hydrate 既有 compile artifact，並在載入時套用新的 activation 結果

### Requirement: Database overlay compile SHALL remain a runtime step

每次預設 registry reload MUST 載入當前資料庫 SearchParameter resources（或測試注入的同等來源），僅對這些 overlay definitions 編譯，再與 hydrate 後的 builtin compile 輸出合併。空的資料庫 overlay MUST 仍能產生僅含 builtin 的有效 snapshot。

#### Scenario: First boot with an empty SearchParameter collection

- **WHEN** 資料庫沒有 SearchParameter documents 且 compile artifact identity 相符
- **THEN** registry SHALL 產出僅含 builtin 的有效 snapshot，且 MUST NOT 編譯 builtin definitions

#### Scenario: Custom database SearchParameter is compiled on reload

- **WHEN** 資料庫（或測試注入來源）包含自訂 SearchParameter resource
- **THEN** reload SHALL 編譯這些 overlay definitions，並依既有 overlay／conflict 規則合併進新的 snapshot
