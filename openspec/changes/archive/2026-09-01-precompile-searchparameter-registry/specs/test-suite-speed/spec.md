## ADDED Requirements

### Requirement: Fast profile SHALL verify SearchParameter compile-artifact identity without MongoDB

快速測試 profile MUST 包含 SearchParameter committed compile artifact 的 identity 驗證。該驗證 MUST 核對 artifact header 與目前 Bundle、compiler、type maps 的 SHA-256 identity 以及 body checksum，且 MUST NOT 啟動 MongoDB，也 MUST NOT 編譯 builtin SearchParameter definitions。

#### Scenario: Developer runs the fast profile after forgetting to regenerate

- **WHEN** 官方 Bundle、compiler 或 type maps 已變更但 committed compile artifact 未更新，且開發者執行快速測試 profile
- **THEN** identity 驗證 MUST 失敗並回傳非零狀態，且該失敗 MUST NOT 依賴 MongoDB

#### Scenario: Fast profile passes when the artifact matches current inputs

- **WHEN** committed compile artifact 的 identity 與目前 Bundle、compiler 與 type maps 相符
- **THEN** 快速測試 profile 中的 identity 驗證 SHALL 通過，且 MUST NOT 啟動 MongoDB

### Requirement: Diagnostics verification SHALL NOT live-compile default builtin definitions

`search-parameter:verify` 與 diagnostics CI gate MUST 以 identity 核對加上 hydrate 後的 registry snapshot 執行完整性檢查，MUST NOT 對預設 builtin definitions 做 live compile。Identity 不符時這些命令 MUST 以非零狀態失敗。

#### Scenario: Diagnostics CI runs against a matching artifact

- **WHEN** diagnostics verification 或 diagnostics CI gate 在 identity 相符的 committed compile artifact 上執行
- **THEN** 既有 registry integrity、lookup coverage 與 manifest-drift 檢查 SHALL 使用 hydrate 後的 snapshot，且 MUST NOT 編譯 builtin definitions

#### Scenario: Diagnostics CI fails on a stale artifact

- **WHEN** committed compile artifact 缺失或 identity 不符
- **THEN** diagnostics verification 與 diagnostics CI gate MUST 失敗，且 MUST NOT 以 live compile 當作成功路徑
