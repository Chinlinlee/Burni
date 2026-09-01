## MODIFIED Requirements

### Requirement: Registry SHALL use FHIR SearchParameter resources as definitions

有效搜尋定義 MUST 來自 FHIR R4/4.0.1 SearchParameter resource。官方 R4 Bundle 仍是 builtin 的 canonical source；generate 流程 MUST 從該 Bundle 編譯。預設 runtime 載入 MUST hydrate 由該 Bundle 產出的 committed compile artifact，且不得以精簡欄位快照取代 resource 的語意欄位。Registry SHALL 能將 hydrate 後的 builtin 與資料庫中的 SearchParameter resource 合併。

#### Scenario: Load trusted built-in definitions

- **WHEN** 預設 registry reload 成功
- **THEN** 每個可驗證且可編譯的官方 SearchParameter resource SHALL 成為候選有效定義，並保留原始 resource 與 provenance，且該結果 MUST 來自與目前 Bundle／compiler／type maps identity 相符的 committed compile artifact

#### Scenario: Ignore reduced legacy definition as source of truth

- **WHEN** registry 需要建立搜尋定義
- **THEN** `FHIRParametersClean.json` 或 generated handler 的欄位快照 MUST NOT 成為新的 canonical definition source

## ADDED Requirements

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
