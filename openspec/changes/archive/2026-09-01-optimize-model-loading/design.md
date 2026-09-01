## Context

目前 `models/mongodb/connector.js` 在同步註冊所有 model 的同時啟動 MongoDB 連線，並透過 connection event 觸發 SearchParameter registry reload。`server.js` 載入 model index 後即建立 session store、載入 routes 並 listen，沒有等待 application readiness。

既有呼叫端直接使用同步 model map 或全域 Mongoose model registry。測試 helper 也可能在載入 connector 前先建立相同的 MongoDB connection，因此設計必須保留同步 model access，並讓重複初始化可安全共用。

## Goals / Non-Goals

**Goals:**

- 建立單一、可等待且可測試的 application initialization lifecycle。
- 在不改變既有 model map 及 Mongoose model name 的前提下，確保全量模型 deterministic 註冊。
- 讓 server listen 與 application readiness 建立明確先後關係。
- 將 sharding provisioning 與一般 application readiness 分離。
- 提供安全的初始化錯誤與階段耗時資訊。

**Non-Goals:**

- 不改 resource model、history model 或 static model 的 schema、hook 與資料契約。
- 不改成依請求或依 resource type 的 lazy model loading。
- 不移除 model hook 對 `models/mongodb/index.js` 的既有依賴。
- 不改用獨立 Mongoose connection。
- 不新增 connection retry、test-only reset API 或 runtime dependency。
- 不追蹤初始化期間的記憶體用量。

## Decisions

### 以 module-level initialization state 實作 singleton

connector 在第一次呼叫時建立 immutable initialization state，包含正規化設定 fingerprint、同步 model map、application readiness 與 sharding provisioning 結果。後續相同 fingerprint 的呼叫共用同一個 state；不同 fingerprint 立即拒絕。

這保留既有同步 map API，同時避免重複 model registration、connection listener 與 `mongoose.connect()`。失敗的 initialization state 也會被保留，讓後續呼叫不會偷偷啟動第二條流程。

替代方案是每次重新初始化，會造成同一 process 內 model、listener 與 connection 副作用累積；改成完全 Promise-based export 則會破壞既有同步取用者，因此不採用。

### 以不可列舉屬性附加 readiness Promise

同步 model map 會附加不可列舉的 `ready` 與 `shardingReady`。`ready` 只在 model registry、default Mongoose connection 與 SearchParameter registry 全部完成後 resolve；`shardingReady` 在 sharding mode 關閉時立即 resolve，啟用時於 database ready 後獨立執行。

不可列舉可避免 readiness 欄位被誤認為 model map entry，也維持既有以 model name 直接取值的使用方式。server 及需要完整服務狀態的呼叫端顯式 await `ready`。

### 保留 default Mongoose connection，並以連線 Promise 形成 readiness

系統繼續使用全域 Mongoose connection，以相容目前 resource service、session store、SearchParameter registry 與 model hooks 的依賴。初始化流程會共用已存在且符合設定的 connection，並等待真正的 database ready 狀態，不再只註冊 open event 而讓呼叫端自行猜測時序。

這比引入獨立 connection 的影響面小，也能支援測試 helper 先建立相同 URI 的情況。不同設定不會嘗試切換既有 connection。

### 以固定階段註冊 model

模型檔案只掃描一次並依穩定排序分組，依序註冊主 resource model、history model、static model。每一階段完成後才進入下一階段，且任一 registration error 都立即終止同步初始化。

明確階段可消除檔案系統回傳順序造成的隱性依賴，並保留 history model 取得主 model schema 的既有契約。lazy loading 或重新設計 model hook 依賴會改變目前 API 與啟動語意，因此不納入本次設計。

### 將 server 啟動改為 readiness gate

server 先完成 application wiring，再 await `mongodb.ready`，成功後才建立依賴 database client 的 session store、載入 routes 並開始 listen。ready rejection 由啟動邏輯統一記錄，停止 HTTP server 啟動並以非零狀態結束；connector 本身不直接呼叫 `process.exit()`。

這讓「HTTP server 已 listen」成為 application ready 的可觀測訊號，而不是僅代表 Node process 已開始執行。

### 採用安全的階段耗時記錄

初始化會量測 model registry、database connection、SearchParameter registry 與總耗時，log 僅記錄遮罩後的連線識別資訊或 database metadata。完整 connection URL、username/password 等認證資訊不得輸出。

不加入記憶體量測，避免將與本次需求無關的 runtime 指標與部署環境差異混入驗收。

### 以單元 lifecycle 測試搭配既有 integration coverage

新增隔離的 lifecycle 測試，以 stub/mock 驗證同步 map、readiness、singleton、設定衝突、registration collision、失敗傳播與安全 log 行為；既有 MongoDB memory server 與全資源 CRUD 測試繼續驗證真實 model registration 與資料庫互動。

## Risks / Trade-offs

- [啟動仍需建立全部 model，無法消除全量 schema 建構成本] → 以固定階段、單次掃描、單次 initialization 與階段耗時量測降低額外成本；lazy loading 留待獨立變更。
- [全域 connection 不支援同一 process 同時服務多個 MongoDB 設定] → 發現設定衝突時明確拒絕，不允許靜默切換。
- [SearchParameter registry reload 失敗會阻止整個 server 啟動] → 將失敗視為 application 未 ready，避免啟動後提供不完整搜尋行為；部署系統可依非零狀態重啟。
- [既有測試可能在 connector 前建立 connection] → 以相同設定共用 connection readiness，並在 lifecycle 測試中覆蓋預先連線情境。
- [sharding provisioning 與 application readiness 分離，server 可能在分片設定完成前提供服務] → 暴露獨立 `shardingReady` 結果，讓需要分片完成的部署流程顯式等待。
- [server 啟動順序改變可能影響依賴「立即 listen」的部署腳本] → 將 readiness failure 明確轉為非零退出，並在部署驗證中檢查 listen 發生於 application ready 之後。

## Migration Plan

1. 先加入 lifecycle state、分階段 model registration、readiness 結果與安全耗時 log。
2. 更新 model index 與 server bootstrap，使既有同步 model map 使用者維持不變，server 改為等待 `ready`。
3. 執行 lifecycle 單元測試、既有 model registration 測試與全資源 CRUD integration tests。
4. 部署時觀察各 initialization phase timing 與 `shardingReady` 結果；本變更不改資料儲存格式，因此不需要資料 migration。
5. 若需 rollback，還原本次 initialization 與 server bootstrap 變更；model schema、既有資料與 FHIR API payload 不需回復。
