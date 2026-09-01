## Why

目前 MongoDB connector 在啟動時同步掃描並載入 294 個模型，同時負責資料庫連線、SearchParameter registry 初始化與 sharding。模型註冊與資料庫 readiness 沒有明確的生命週期契約，可能造成 server 在資料庫尚未 ready 時開始接收請求，也可能因重複初始化而產生連線、listener 或 model registration 副作用。

## What Changes

- 建立明確的 model registry ready、database ready 與 application ready 生命週期。
- 保留同步 model map 相容介面，另外提供不可列舉的 `ready` 與 `shardingReady` Promise。
- 在啟動時以主模型、history 模型、static model 三階段 deterministic 順序完成全量模型註冊。
- 讓 connector 在同一 process 內對相同設定只初始化一次；不同連線設定 SHALL 被拒絕。
- 讓 application ready 等待 MongoDB connection 與 SearchParameter registry reload 完成。
- 讓 sharding provisioning 維持獨立生命週期，不阻塞一般 application ready。
- 讓初始化錯誤透過明確的 throw 或 Promise rejection 傳遞，不在 connector 內直接終止 process。
- 讓 server 在 application ready 前不得開始 listen；初始化失敗時 SHALL 停止啟動並以非零狀態結束。
- 移除或遮罩 connection URL 中的敏感資訊，並記錄各初始化階段與總耗時。
- 新增 connector lifecycle 測試，保留既有全資源 CRUD integration coverage。
- 建立架構決策文件並更新專案 domain terminology。

## Capabilities

### New Capabilities

- `mongodb-model-lifecycle`: 定義 MongoDB model registry、database、application readiness、singleton initialization 與 sharding provisioning 的生命週期契約。

### Modified Capabilities

## Impact

- 影響 `models/mongodb/connector.js`、`models/mongodb/index.js` 與 `server.js` 的初始化流程。
- 影響 connector lifecycle 測試、MongoDB 測試 helper 與既有模型註冊驗證。
- 保留現有 resource model、history model、static model 的 public map access 與 Mongoose model names。
- 不修改 resource model schema、hook 行為或 FHIR API 的資料契約。
- 不新增 runtime dependency。
