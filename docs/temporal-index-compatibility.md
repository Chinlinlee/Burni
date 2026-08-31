# Temporal index compatibility

7.2 的 temporal index 驗證由 `models/FHIR/searchParameter/indexes/indexCompatibility.js` 提供。驗證輸入是 7.1 產生的 manifest、compiled search plan 和 typed temporal filter；不會把 raw FHIR `value` 改作 range query，也不會在找不到 index 時回退到 raw field。

## 驗證規則

- `date` 的 boundary 欄位必須是 calendar string；`dateTime` 與 `Period` boundary，以及 `instant` epoch 欄位必須使用 Decimal128。
- `Period` 的 start/end 必須來自同一個 compound index entry，array Period 必須由同一個 `$elemMatch` 維持 element correlation。
- temporal array 的每一層 array ancestor 都必須出現在 filter 的 `$elemMatch` shape 中。
- choice branch 各自使用獨立 index；不得建立跨 choice branch 的 compound index。
- compound index 若跨越獨立 multikey path，會回報 `parallel-multikey-paths` 或 `parallel-multikey-index-fields`。
- positional numeric path、缺少 branch index、raw temporal value comparison 和 BSON type mismatch 都會產生診斷並使驗證失敗。

## Explain seam

`createMongoExplainAdapter(collection)` 將 `find`、aggregate 和 chained pipeline 轉成 Mongo `explain("executionStats")`。`verifyTemporalQueryExplain` 檢查 winning plan 是否包含 manifest 中的 index；`verifyTemporalExecutionModes` 則確認三種 execution mode 共用相同 filter 和 index metadata。

不能連線 Mongo 時，傳入 `dryRun: true` 使用 deterministic fake explain contract。它只回報 manifest 中的第一個 compatible index，並標示 `dryRun: true`；這不是實際 optimizer 成本或 selectivity 的證據。sharded nested `$lookup`、未提供 aggregate pipeline，或 explain response 沒有可辨識的 winning `IXSCAN` 時，應由 adapter 回傳 unsupported condition，或由驗證器回報 `explain-no-winning-index`。
