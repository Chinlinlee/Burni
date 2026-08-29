## Purpose

為 Burni 的完整 FHIR resource catalog 建立可重複驗證的 create/read round-trip contract，確保每個 resource 都能被建立、以回傳的 identity 讀取，並保留可讀取的資源內容。

## ADDED Requirements

### Requirement: Catalog resources SHALL have CRUD coverage

測試覆蓋範圍 MUST 等於 FHIR resource catalog 的完整內容。每個 catalog resource MUST 有一個可辨識的 create/read coverage case；catalog 新增 resource 時，coverage MUST 自動要求對應案例。

#### Scenario: Every catalog resource has a named case

- **WHEN** CRUD coverage suite 依照 FHIR resource catalog 執行
- **THEN** catalog 中的每一個 resource 都會產生一個以 resource type 命名的測試案例

#### Scenario: Catalog and coverage diverge

- **WHEN** catalog 中的 resource 沒有對應 coverage case，或 coverage case 包含不在 catalog 中的 resource
- **THEN** coverage suite MUST fail 並指出不一致的 resource type

### Requirement: Active fixtures SHALL be used deterministically

每個 resource 的 create payload MUST 來自其 fixture archive provenance 所指定的 active fixture，且不得修改版本控制中的原始 fixture。active fixture 的選擇 MUST 遵循指定 synthetic、derived、official 的 archive 規則；companion fixture MUST 保持為輔助資料，不得作為主要 create payload。

#### Scenario: Resource has a designated synthetic fixture

- **WHEN** archive provenance 將 resource 指定為 synthetic
- **THEN** coverage case MUST 使用該 synthetic fixture 作為 create payload

#### Scenario: Resource uses derived or official fixture

- **WHEN** archive provenance 未指定 synthetic，且 resource 有 derived fixture
- **THEN** coverage case MUST 使用 derived fixture
- **WHEN** resource 沒有 derived fixture
- **THEN** coverage case MUST 使用 official fixture

#### Scenario: Fixture identity is inconsistent

- **WHEN** fixture 的 `resourceType` 不等於 catalog resource type
- **THEN** coverage case MUST fail，不得自動修正或改用其他 payload

### Requirement: Create/read SHALL preserve the created resource

每個 resource 的 coverage case MUST 先 create 一個 active fixture，再使用 create response 的 resource ID 執行 read。read response MUST 保留相同的 resource type、resource ID 與資源內容；FHIR server 產生或更新的 metadata 差異 MAY 被允許。

#### Scenario: Resource completes a create/read round-trip

- **WHEN** active fixture 建立成功，且使用回傳 ID 讀取同一 resource
- **THEN** create 與 read MUST 成功，resource type 與 resource ID MUST 相同，且非 server-managed 資源內容 MUST 等價

#### Scenario: Create response does not provide a usable identity

- **WHEN** create 成功但 response 沒有可用的 resource ID
- **THEN** coverage case MUST fail，且不得使用 fixture 原始 ID 代替

#### Scenario: Read cannot find the created resource

- **WHEN** create response 的 resource ID 無法讀取到 resource
- **THEN** coverage case MUST fail並指出 resource type 與 resource ID

### Requirement: CRUD failures SHALL remain visible

Coverage suite MUST 將 fixture 載入失敗、resource validation 失敗、create 失敗、read 失敗及 round-trip 不一致視為失敗。coverage suite MUST NOT 以自動降級、無條件 skip 或隱藏錯誤的方式宣稱 resource 已覆蓋。

#### Scenario: Fixture or persistence fails

- **WHEN** 任一 resource 的 active fixture 無法載入、create 失敗或 read round-trip 不一致
- **THEN** suite MUST fail 該 resource 的測試，並保留可診斷的錯誤訊息

#### Scenario: Remote Validator is unavailable

- **WHEN** 執行 CRUD coverage suite 時遠端 profile Validator 不可用
- **THEN** suite MUST 不依賴該遠端服務，並以本地 structure validation 驗證 CRUD persistence contract

### Requirement: Existing create identity behavior SHALL remain compatible

CRUD coverage MUST 保持現有 create contract：server 會產生新的 resource ID，而不是沿用 fixture 提供的 ID；後續 read MUST 使用 server-returned ID。

#### Scenario: Fixture includes an existing ID

- **WHEN** active fixture 帶有原始 resource ID 並被 create
- **THEN** create response MUST 提供新的 server-generated ID，且 read MUST 使用該 ID 成功完成 round-trip
