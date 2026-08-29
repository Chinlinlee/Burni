# fhir-searchparameter-registry Specification

## Purpose

提供以 FHIR R4 SearchParameter resource 為契約的有效搜尋定義來源，讓內建與自訂搜尋參數可以被驗證、診斷、原子更新並一致地提供給搜尋 API。

## Requirements

### Requirement: Registry SHALL use FHIR SearchParameter resources as definitions

有效搜尋定義 MUST 來自 FHIR R4/4.0.1 SearchParameter resource。Registry SHALL 能合併受信任的官方 R4 Bundle 與資料庫中的 SearchParameter resource，且不得以精簡欄位快照取代 resource 的語意欄位。

#### Scenario: Load trusted built-in definitions
- **WHEN** registry 載入受信任的官方 R4 Bundle
- **THEN** 每個可驗證且可編譯的 SearchParameter resource SHALL 成為候選有效定義，並保留原始 resource 與 provenance

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

Registry SHALL 成為主要 runtime definition path；既有 generated handlers 可以作為暫時 fallback 或對照來源。停用或不存在於有效 snapshot 的 code MUST NOT 對外宣告為可用參數，查詢時 SHALL 走既有 unknown search parameter error flow。

#### Scenario: Search with an effective registry definition
- **WHEN** client 使用有效 snapshot 中的 `(base, code)` 查詢
- **THEN** runtime SHALL 優先使用 registry definition 的 compiled behavior

#### Scenario: Search with a disabled definition
- **WHEN** client 查詢曾載入但已被 registry 停用的 code
- **THEN** API SHALL 將它視為 unknown search parameter，並保留既有錯誤回應流程

#### Scenario: Compare legacy and registry behavior
- **WHEN** 遷移期間同一查詢可由 registry 與 legacy handler 執行
- **THEN** 系統 SHALL 能記錄兩者 query plan/result 差異，而不以 legacy output 覆寫 registry definition

#### Scenario: Do not gate enablement on shadow filter equality
- **WHEN** registry 的正確性測試通過，但 shadow comparison 因 legacy 缺陷（例如 quantity `eq10|kg` 被解析成 `$eq: null`）而報告 filter mismatch
- **THEN** 該 resource type MUST 仍可依 registry 正確性測試進入 enabled set；shadow comparison SHALL 維持診斷，MUST NOT 成為唯一啟用門檻

#### Scenario: Enable a resource type with registry correctness tests
- **WHEN** 決定是否將某 resource type 加入 `enabledResourceTypes`
- **THEN** 該 resource 的 SearchQueryPlan golden filter tests 與 document fixture tests MUST 通過；shadow filter 全等 MUST NOT 被要求

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
