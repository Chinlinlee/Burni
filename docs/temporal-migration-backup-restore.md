# Temporal migration backup/restore

這份說明用於將既有 FHIR `date`、`dateTime` 與 `instant` 欄位遷移至 canonical temporal object。正式環境執行 migration 前，必須先建立可驗證的 MongoDB backup，並保留舊版服務直到 migration 與驗證完成。

完整的 migration、index、schema cutover 與 legacy fallback removal 順序請參考 [`temporal-rollout.md`](./temporal-rollout.md)。

## 建立 backup

在 migration 前，以與 Burni 使用的資料庫名稱及連線設定相同的 MongoDB URI 執行：

```bash
mongodump --uri "$MONGODB_CONNECTION_URL" --out "./backup/temporal-$(date -u +%Y%m%dT%H%M%SZ)"
```

確認 dump 包含所有 FHIR resource collection 及對應的 `_history` collection，並將 dump 目錄保存於與資料庫不同的可靠儲存位置。建議同時記錄 dump 時間、Burni 版本、資料庫名稱與 `mongodump --version`。

Windows PowerShell 可使用：

```powershell
$stamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
mongodump --uri $env:MONGODB_CONNECTION_URL --out ".\backup\temporal-$stamp"
```

## 執行 migration

先執行 read-only preflight。只有 preflight 報告 `valid: true` 且 `invalid` 與 `ambiguousBsonDates` 都為零時，才可執行寫入階段。preflight 失敗時不可以人工猜測值繞過 gate。

寫入 migration 應使用 `runTemporalMigration` 的批次入口，設定符合環境的 `batchSize`，保存 stdout/logger 記錄，並確認每個 batch 的 `processed`、`updated`、`skipped` 與 `failed`。任何 `failed` 或未預期的例外都必須停止 rollout 並調查，不可只依賴 log 判定成功。

migration 可安全重跑。已完成的 canonical value 會被標記為 skipped，不會再次包裝或寫回。

## 驗證與 restore

完成後再次執行 preflight，確認沒有 invalid 或 ambiguous temporal value，並檢查 migration summary 的 `failed` 為零。完成應用程式與查詢驗證前，不要刪除 backup。

若 preflight、寫入或後續驗證失敗，先停止新版本服務與後續 schema/index cutover，再以原始 backup 還原。還原前確認目標資料庫與目前服務隔離，避免覆寫錯誤的環境：

```bash
mongorestore --uri "$MONGODB_CONNECTION_URL" --drop "./backup/temporal-<timestamp>"
```

`--drop` 會刪除 dump 中同名的既有 collection；只可對已確認的目標資料庫使用。restore 完成後重新執行 read-only preflight，確認資料回到 migration 前的狀態，再切回相容的舊版服務。

backup/restore 只處理資料庫內容；部署版本、schema generator 產物及索引變更仍須依照各自的 release rollback 流程處理。
