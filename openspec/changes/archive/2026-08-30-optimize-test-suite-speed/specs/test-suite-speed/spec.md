## Purpose

定義 Burni 測試套件的快速執行、完整驗證與資料庫 lifecycle 契約，使日常開發能快速取得回饋，同時保留完整 FHIR coverage 與可診斷的失敗結果。

## ADDED Requirements

### Requirement: Test profiles SHALL have distinct purposes

系統 MUST 提供快速測試與完整測試兩種可辨識的執行 profile。快速測試 MUST 不依賴 MongoDB；完整測試 MUST 包含現有需要 MongoDB 的 integration 與資料持久化驗證。

#### Scenario: Developer runs the fast profile

- **WHEN** 開發者執行快速測試 profile
- **THEN** 不需要啟動 MongoDB，且只執行不依賴 MongoDB 的測試

#### Scenario: Release validation runs the complete profile

- **WHEN** 執行完整測試 profile
- **THEN** 所有現有測試分類與 MongoDB-dependent integration coverage 都會被納入

### Requirement: Test database lifecycle SHALL avoid redundant startup

同一個測試 process MUST 重用同一個 MongoDB test database lifecycle，並在 process 結束時完成清理。各 suite MUST 維持資料隔離，不得依賴其他 suite 留下的資料或執行順序。

#### Scenario: Multiple database suites run in one process

- **WHEN** 同一 process 依序執行多個需要 MongoDB 的 suite
- **THEN** test database 不會為每個 suite 重複建立與停止，且每個 suite 仍從可預期的資料狀態開始

#### Scenario: A suite finishes with test data

- **WHEN** 一個 suite 在 test database 中留下資料後結束
- **THEN** 後續 suite 不會讀取或依賴該資料

### Requirement: Existing FHIR coverage SHALL remain complete

完整測試 MUST 保留 FHIR resource catalog 中每一個 resource 的 create/read coverage，並 MUST 保留 Patient 專用回歸測試、temporal serialization、temporal round-trip 與 temporal persistence coverage。

#### Scenario: Resource catalog changes

- **WHEN** FHIR resource catalog 新增或移除 resource
- **THEN** 完整測試會驗證 coverage 與 catalog 的一致性，並指出缺少或多出的 resource type

#### Scenario: Patient has both general and focused coverage

- **WHEN** 完整測試執行 Patient resource coverage
- **THEN** 全 resource CRUD coverage 與 Patient 專用 integration coverage 都會執行

### Requirement: Test removal SHALL preserve unique coverage

測試 MUST NOT 僅因執行時間較長而被刪除。只有在測試驗證已移除的行為，或其所有可觀察行為已由其他測試完整覆蓋且沒有獨特失敗訊息時，才可移除或合併。

#### Scenario: A slow test has unique coverage

- **WHEN** 測試執行時間較長但驗證其他測試未涵蓋的行為
- **THEN** 該測試仍會保留於適當的測試 profile

#### Scenario: Duplicate coverage is confirmed

- **WHEN** 兩個測試驗證相同的可觀察契約，且其中一個沒有額外的邊界條件或診斷價值
- **THEN** 可以移除或合併重複測試，並保留至少一個可執行的契約驗證

### Requirement: Targeted test execution SHALL be deterministic

指定單一測試檔或 gate 的命令 MUST 只執行指定範圍，不得因全域測試 glob 自動擴展為完整測試套件。指定命令的 timeout、require 與 process cleanup 行為 MUST 與其 profile 一致。

#### Scenario: Developer runs one gate

- **WHEN** 開發者執行指定的 diagnostics 或 focused test gate
- **THEN** 只有該 gate 的測試被發現與執行

#### Scenario: Focused test fails

- **WHEN** 指定測試檔中的案例失敗
- **THEN** 命令會回傳非零狀態，且不以執行其他未指定測試來掩蓋失敗

### Requirement: Test timing SHALL distinguish setup cost from case cost

測試驗證 MUST 能區分 test case、suite setup、database lifecycle 與 teardown 的耗時，並以可比較的方式記錄優化前後基準。測試通過與否 MUST 不得由效能量測取代。

#### Scenario: Baseline is recorded

- **WHEN** 在優化前或優化後執行測試基準量測
- **THEN** 結果會分別呈現快速 profile、完整 profile 與主要 database suite 的耗時

#### Scenario: A test case is fast but suite is slow

- **WHEN** 個別案例耗時很短但 suite lifecycle 耗時很長
- **THEN** 量測結果會指出 lifecycle 成本，而不是將等待時間歸因於個別案例

### Requirement: CI branch and failure visibility SHALL be explicit

CI workflow MUST 保留 `main` 並支援 `next` 與 `dev`。在 Specimen CRUD 失敗尚未修正前，完整測試 MUST 保持可獨立執行但不得接入必要的 CI gate；該失敗 MUST 保持可見，不得透過 skip、exclude 或允許失敗隱藏。

#### Scenario: CI runs on supported branches

- **WHEN** `main`、`next` 或 `dev` 發生符合 workflow 條件的 push 或 pull request
- **THEN** 對應的測試 workflow 會依 branch policy 執行

#### Scenario: Specimen remains unresolved

- **WHEN** Specimen CRUD 仍然失敗且完整測試被單獨執行
- **THEN** 完整測試會回傳失敗並保留診斷資訊，但不會以該結果阻斷尚未接入完整 gate 的 CI workflow

#### Scenario: Specimen is fixed

- **WHEN** Specimen CRUD 修正完成且完整測試通過
- **THEN** 完整測試可以依既定 CI policy 接入必要 gate
