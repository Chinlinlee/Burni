# Temporal migration backup/restore

這份說明用於將既有 FHIR `date`、`dateTime` 與 `instant` 欄位遷移至 canonical temporal object。正式環境採 source database → target database 的隔離式 migration：source 在 migration 期間停寫並保持唯讀，target 使用專用空 database。正式執行前，必須先建立可驗證的 MongoDB backup，並保留舊版服務直到 migration 與驗證完成。

完整的 migration、index、schema cutover 與 legacy fallback removal 順序請參考 [`temporal-rollout.md`](./temporal-rollout.md)。

## 建立 backup

在 migration 前，針對 source database 執行：

```bash
mongodump --uri "$MONGODB_CONNECTION_URL" --out "./backup/temporal-$(date -u +%Y%m%dT%H%M%SZ)"
```

確認 dump 包含所有 FHIR resource collection 及對應的 `_history` collection，並將 dump 目錄保存於與資料庫不同的可靠儲存位置。target database 也應建立獨立 snapshot 或保留可刪除、可重建的專用 namespace。建議同時記錄 source/target database、dump 時間、Burni 版本與 `mongodump --version`。

Windows PowerShell 可使用：

```powershell
$stamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
mongodump --uri $env:MONGODB_CONNECTION_URL --out ".\backup\temporal-$stamp"
```

## 執行 migration

先對 source 執行 read-only preflight。只有 preflight 報告 `valid: true`、`invalid` 與 `unresolvedAmbiguousBsonDates` 都為零時，才可執行寫入階段。允許依固定 UTC policy 轉換的 BSON Date 必須列入 `lossyBsonDates` 與逐筆 audit。preflight 失敗時不可以人工猜測值繞過 gate。

寫入 migration 應使用雙 database operator entrypoint，設定符合環境的 `batchSize`，保存 checkpoint、audit、stdout/logger 記錄，並確認每個 batch 的 `processed`、`created`、`skipped` 與 `failed`。source 使用 raw cursor；target 以完整轉換後的文件寫入，不觸發 resource save hooks。任何 `failed` 或未預期的例外都必須停止 rollout 並調查，不可只依賴 log 判定成功。

migration 可安全重跑。已完成的 canonical value 會被標記為 skipped，不會再次包裝；checkpoint 可讓已完成的 source batch 不必重複處理。

## 驗證與 restore

完成後對 target 再次執行 preflight，確認沒有 invalid 或 unresolved ambiguous temporal value，且所有 lossy BSON Date 都有 audit。檢查 migration summary 的 `failed` 為零，並執行 source/target identity、非 temporal fields、canonical temporal fields 與 search hit-set 對照。完成應用程式與查詢驗證前，不要刪除 backup 或 source archive。

若 preflight、寫入或後續驗證失敗，先停止新版本服務與後續 schema/index cutover。target 若尚未 cutover，優先刪除並重建 target namespace，或依 checkpoint 修正後重跑；source database 不得被 migration writer 修改。需要 rollback 時，以原始 backup 還原 source 或已確認的 target。還原前確認目標資料庫與目前服務隔離，避免覆寫錯誤的環境：

```bash
mongorestore --uri "$MONGODB_CONNECTION_URL" --drop "./backup/temporal-<timestamp>"
```

`--drop` 會刪除 dump 中同名的既有 collection；只可對已確認的目標資料庫使用。restore 完成後重新執行 read-only preflight，確認資料回到預期狀態，再切回相容的舊版服務。source archive 應保持唯讀，直到 rollback window 結束。

backup/restore 只處理資料庫內容；部署版本、schema generator 產物及索引變更仍須依照各自的 release rollback 流程處理。
