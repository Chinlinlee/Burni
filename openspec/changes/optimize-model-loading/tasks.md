## 1. MongoDB initialization lifecycle

- [x] 1.1 定義正規化連線設定 fingerprint 與 module-level singleton state，涵蓋相同設定共用、衝突設定拒絕及失敗結果保留。
- [x] 1.2 建立一次模型檔案 discovery 與 deterministic 分組，依序載入主 resource model、history model、static model。
- [x] 1.3 保留同步 model map 介面，附加不可列舉的 `ready` 與 `shardingReady` Promise。
- [x] 1.4 讓 database readiness 共用既有符合設定的 default Mongoose connection，並讓 application readiness 等待 SearchParameter registry reload。
- [x] 1.5 讓 sharding provisioning 在 database ready 後獨立執行，依規格回報成功或失敗，不阻塞 application readiness。
- [x] 1.6 加入 model registration、database connection、SearchParameter registry 與總初始化耗時記錄，並遮罩或移除敏感 connection 資訊。

## 2. Application bootstrap integration

- [x] 2.1 更新 `models/mongodb/index.js`，讓既有同步 model map 使用者不變並可取得 readiness Promise。
- [x] 2.2 更新 `server.js` 的啟動順序，使 HTTP server 在 application readiness 完成前不 listen。
- [x] 2.3 將依賴 database client 的 session store、routes 與 HTTP listen 放入成功 readiness 後的 bootstrap 流程。
- [x] 2.4 讓 readiness failure 被記錄、阻止 HTTP server 啟動，並以非零狀態結束 process；connector 不直接終止 process。

## 3. Lifecycle verification

- [ ] 3.1 建立隔離 connector lifecycle 測試替身，驗證同步 model map 可在 readiness 完成前取得。
- [ ] 3.2 驗證主模型、history 模型與 static model 的完整註冊順序，以及 model collision 的立即錯誤。
- [ ] 3.3 驗證相同設定重複初始化共用 map 與 Promise，不同設定被拒絕，失敗 initialization 不自動重試。
- [ ] 3.4 驗證 database、SearchParameter registry 與 sharding provisioning 的成功、失敗及相互獨立行為。
- [ ] 3.5 驗證初始化 log 不洩漏 password 或認證 URL，且記錄各階段與總耗時。
- [ ] 3.6 更新測試 helper 以覆蓋預先建立相同 database connection 的情境，並保留既有 model registration 與全資源 CRUD integration coverage。

## 4. Architecture documentation

- [ ] 4.1 更新 `CONTEXT.md`，記錄 model registry ready、database ready、application ready 與 sharding provisioning 的 canonical terminology。
- [ ] 4.2 建立 ADR，記錄同步 model map、singleton lifecycle、default connection、server readiness gate 與 sharding 分離的取捨。

## 5. Validation

- [ ] 5.1 執行 connector lifecycle focused tests、model registration tests 與相關 lint 檢查。
- [ ] 5.2 執行完整 test suite，確認既有 FHIR API、SearchParameter 與全資源 CRUD 行為未回歸。
- [ ] 5.3 執行 OpenSpec validation，確認所有規格、設計與任務文件完整且互相一致。
