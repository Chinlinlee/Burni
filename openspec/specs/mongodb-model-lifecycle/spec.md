# mongodb-model-lifecycle Specification

## Purpose

定義 Burni 啟動時 MongoDB model registry、資料庫連線、FHIR 搜尋 registry 與 sharding provisioning 的可觀測生命週期，讓既有同步模型存取保持相容並避免未 ready 的服務接收請求。

## Requirements

### Requirement: Complete model registry initialization

系統 SHALL 在 application initialization 完成前註冊所有 resource model、history model 與 static model。模型註冊 SHALL 使用穩定且可重現的順序，且 history model SHALL 可取得其對應 resource model 所需的 schema。

#### Scenario: Successful full model registration

- **WHEN** application initialization 使用有效設定開始
- **THEN** 所有 resource、history 與 static model 都已註冊，且既有同步 model map 可依原有名稱取得這些 model

#### Scenario: Model registration failure

- **WHEN** 任一必要 model 無法註冊或發生名稱衝突
- **THEN** initialization SHALL 立即失敗，且不得宣告 application ready

### Requirement: Synchronous model map with explicit readiness

系統 SHALL 保留同步取得 model map 的相容介面，並提供 application readiness 與 sharding provisioning 的獨立非同步結果。application readiness SHALL 僅在 database ready 且 SearchParameter registry reload 成功後完成；sharding provisioning SHALL 不得延後 application readiness。

#### Scenario: Map is available before application readiness

- **WHEN** model registry initialization 成功但 database 或 SearchParameter registry 尚未 ready
- **THEN** 呼叫端可同步取得已註冊的 model map，但 application readiness SHALL 尚未完成

#### Scenario: Application becomes ready

- **WHEN** model registry、database connection 與 SearchParameter registry reload 全部成功
- **THEN** application readiness SHALL resolve，且系統可進入正常服務狀態

#### Scenario: Application readiness failure

- **WHEN** database connection 或 SearchParameter registry reload 失敗
- **THEN** application readiness SHALL reject，且系統 SHALL 不得宣告 application ready

#### Scenario: Sharding is independent

- **WHEN** sharding mode 未啟用
- **THEN** sharding provisioning 結果 SHALL 立即以成功狀態完成

- **WHEN** sharding mode 已啟用
- **THEN** sharding provisioning SHALL 在 database ready 後獨立執行，且其成功或失敗 SHALL 由獨立結果表示

### Requirement: Idempotent initialization for one process

同一 process 以相同正規化連線設定初始化時，系統 SHALL 共用同一個 model map 與 readiness 結果。以不同連線設定再次初始化時，系統 SHALL 拒絕該次初始化，不得靜默切換資料庫或重新註冊 models。

#### Scenario: Repeated initialization with the same settings

- **WHEN** 同一 process 以相同連線 URL、database、authSource 與 username 再次初始化
- **THEN** 系統 SHALL 回傳相同的 model map 與 readiness 結果，且不得重複註冊 model、listener 或資料庫連線

#### Scenario: Initialization with conflicting settings

- **WHEN** 同一 process 以不同正規化連線設定初始化
- **THEN** 系統 SHALL 拒絕該次初始化，且既有 initialization SHALL 維持不變

#### Scenario: Initialization fails permanently

- **WHEN** 該 process 的第一次 initialization 已失敗
- **THEN** 後續相同設定的初始化 SHALL 回傳相同失敗結果，不得自動重新註冊 models 或建立第二條初始化流程

### Requirement: Server readiness gate

HTTP server SHALL 在 application readiness 完成前不得開始 listen。若 application initialization 失敗，HTTP server SHALL 不得 listen，且 process SHALL 以非零狀態結束。

#### Scenario: Server waits for readiness

- **WHEN** server 啟動但 application readiness 尚未完成
- **THEN** HTTP server SHALL 維持未 listen 狀態

#### Scenario: Server starts after readiness

- **WHEN** application readiness 成功完成
- **THEN** HTTP server SHALL 才可開始 listen

#### Scenario: Server initialization failure

- **WHEN** application readiness reject
- **THEN** HTTP server SHALL 不得開始 listen，並 SHALL 以非零狀態結束

### Requirement: Safe initialization observability

系統 SHALL 記錄 model registry、database connection、SearchParameter registry 與總 initialization 的耗時。初始化 log SHALL 不包含明文 password、完整含認證資訊的 connection URL 或其他敏感憑證。

#### Scenario: Timings are recorded safely

- **WHEN** 一次 initialization 成功或失敗
- **THEN** log SHALL 提供各階段及總耗時，且 connection 資訊 SHALL 經過遮罩或完全省略敏感欄位
