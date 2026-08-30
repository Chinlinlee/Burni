## 1. Baseline and test profile inventory

- [x] 1.1 建立快速與完整 profile 的測試檔清單，確認快速 profile 不會載入需要 MongoDB 的 suite。
- [x] 1.2 量測目前快速候選、完整測試、主要 MongoDB suite setup 與 teardown 時間，記錄案例數及 146-resource coverage 數量。
- [x] 1.3 以現有失敗狀態記錄 Specimen CRUD failure，確認完整測試不會透過 skip、exclude 或允許失敗隱藏它。

## 2. Test execution profiles

- [x] 2.1 新增快速 Mocha 設定，排除所有 MongoDB-dependent suite，並保留既有 `test/hook.js` 與 timeout 行為。
- [x] 2.2 新增完整測試設定與 `test:full` script，確保完整 profile 仍 discovery 所有現有測試。
- [x] 2.3 將日常 `test` script 指向快速 profile，並讓 profile 名稱清楚區分快速與完整執行。
- [x] 2.4 修正 diagnostics targeted script，使用 `--no-config` 與明確的 require、timeout、exit 參數，確認只執行指定 gate。

## 3. Shared MongoDB test lifecycle

- [x] 3.1 更新 MongoDB test helper，使同一個 Mocha process 的 MongoDB memory server 只建立一次，且重複 start/stop 呼叫具備安全且可預期的狀態。
- [x] 3.2 在 root test hook 建立 process 結束時的統一 database cleanup，並確保 focused run 與完整 run 都能清理 server。
- [x] 3.3 保留各 suite 的資料隔離，檢查並補足 MongoDB suite 的 collection cleanup，避免依賴 suite 執行順序。
- [x] 3.4 執行 temporal、Patient、support 與 SearchParameter MongoDB focused tests，確認 shared lifecycle 不改變測試結果。

## 4. Coverage and failure safeguards

- [x] 4.1 驗證完整 profile 仍包含 146 個 resource 的 create/read coverage、Patient focused integration 與所有 temporal coverage。
- [x] 4.2 驗證 catalog、fixture provenance 與 coverage alignment checks 仍會在完整 profile 中執行。
- [x] 4.3 保持 Specimen failure 可見，待其修正後重新執行完整 profile 並更新基準結果。
- [x] 4.4 檢查測試重複性；只有確認沒有獨特契約或診斷價值時，才提出後續刪除或合併，不在本階段刪除案例。

## 5. Timing and CI policy

- [x] 5.1 加入可區分 suite setup、database startup、test case 與 teardown 的量測輸出，且不得改變 assertion 或 exit status。
- [x] 5.2 以相同環境重新量測快速與完整 profile，記錄優化前後差異及 coverage 數量。
- [x] 5.3 更新 diagnostics workflow 的 branch filter，保留 `main` 並加入 `next` 與 `dev` 的 push／pull request 觸發範圍。
- [x] 5.4 在 Specimen 修正並通過前，維持完整測試為可獨立執行入口，不接入必要 CI gate；修正後再啟用完整 gate。

## 6. Validation and rollback

- [x] 6.1 執行快速 profile、targeted diagnostics gate、temporal focused tests 與 shared lifecycle 測試。
- [x] 6.2 執行完整 profile，確認既有通過案例、coverage 數量與已知 Specimen failure 狀態符合預期。
- [x] 6.3 執行 lint 與 OpenSpec validation，確認 scripts、設定及所有 artifacts 一致。
- [x] 6.4 若 shared lifecycle 造成 isolation 或 cleanup regression，回退至 per-suite server，同時保留 profile 與 targeted command 改善。
