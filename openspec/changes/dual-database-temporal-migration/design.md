## Context

目前 `models/mongodb/index.js` 會在載入時初始化 global Mongoose connection，resource/history generated models 也使用 global Mongoose。現有 temporal migration 由同一個 model 讀取及寫入，並將整個 collection 先載入記憶體；它只更新已存在文件，不會建立隔離 target database 的完整副本。

本設計依 proposal.md、`temporal-database-migration` spec 與 `fhir-temporal-storage` delta spec 實作 source/target migration，不改變 public FHIR JSON contract。

## Goals / Non-Goals

**Goals:**

- 以獨立 source/target connection 完成完整、可恢復、可審計的 migration。
- 讓 resource/history model 可以安全地綁定指定 target connection。
- 以 bounded cursor batches 複製完整文件並轉換所有 temporal path。
- 保留 identity、非 temporal fields 與 history 結構。
- 對 BSON Date 套用固定 UTC lossy policy，並區分已處理與未解決 diagnostics。
- 在 application cutover 前提供 deterministic source/target comparison 與 search evidence。

**Non-Goals:**

- 不在 migration 期間觸發 resource save hooks、history creation、ID allocation 或 reference tracking。
- 不在 source database 原地改寫資料。
- 不在本 change 內建立 production index writer 或自動執行 application cutover。
- 不以 legacy mixed-type query fallback 取代 canonical migration。
- 不保證 legacy BSON Date 的原始 FHIR lexical value 可以還原。

## Decisions

### 1. 使用新的雙 database operator entrypoint

新增明確的雙 database CLI，保留 `temporal:migrate` 與 `temporal:preflight` npm command 名稱，並移除現有單 database entrypoint 與 helper。CLI 接受 source/target URI，解析並顯示遮罩後的 database identity；write mode 必須同時確認 target identity，且 source 與 target database 不得相同。

URI 直接由 CLI 傳入是既定操作選擇，但不可寫入 logs、reports 或 audit。connection 物件只在 process 內傳遞，不把 authenticated URI 放進 migration evidence。

替代方案：沿用 `.env` 單一 URI 會保留誤寫 source 的風險；只刪除 CLI 則會失去 preflight、confirmation、evidence 與 exit-code safety gate。

### 2. source 使用 raw cursor，target 使用 connection-aware model collection

connector 增加可指定 Mongoose connection 的 model registry；resource models 先註冊，history models 再重用 resource schema。generator 更新後重新產生所有 resource/history models。

source 使用 native MongoDB collection cursor，避免新版 schema 對 legacy BSON Date 做 casting。target 使用指定 connection 建立的 model collection 進行低階 bulk write；不呼叫 `.save()`、`.create()` 或其他會執行 resource hooks 的 API。bulk write 前先執行轉換結果與 canonical temporal validation。

替代方案：直接使用 global `@mongodb` 會無法隔離 source/target；使用 `.save()` 會可能產生非 migration 的 history、ID 與 reference side effects；raw driver target 則需要另外重建 target collection identity 與 schema binding。

### 3. 以完整文件轉換取代 temporal-only update

每個 source document 由 schema definition 遞迴映射，產生完整 transformed document。Temporal scalar 依 field datatype 轉換為 canonical object，其他欄位原樣保留；`_id`、FHIR `id`、`meta.versionId` 與 history identity 不得重新產生。

target 以 collection-level bulk operation 寫入完整文件。target 必須是專用空 database；重跑時使用 source identity、collection 與 migration run identity 判斷已完成 batch，避免 duplicate insert。文件寫入不修改 source。

替代方案：先 dump 再 `$set` 只能處理已存在 target 文件，無法把 conversion、audit 與 identity verification 統一在同一 pipeline。

### 4. 將 streaming、checkpoint 與 audit 分離

migration pipeline 分成 source reader、document transformer、target batch writer、checkpoint writer 與 audit writer。每批 bounded size，只有 target write 成功且 audit 已保存後才將 checkpoint 標記完成。

target metadata collection 保存 run identity、source/target database identity、collection、batch boundary、source count、target count、status 與 error metadata。外部 JSON/JSONL 保存 lossy conversion 的逐筆 audit；summary report 只保存 aggregate counts 與 audit artifact identity。

checkpoint 避免依賴整個 collection 的記憶體快照；audit 不承擔 resume state。batch failure 保留 partial target state，修正後可由 checkpoint 重跑或重建空 target。

替代方案：只寫 filesystem progress 無法與 target 狀態共同驗證；只寫 audit 無法可靠表示 batch commit 邊界。

### 5. 採固定 UTC lossy temporal policy

合法 legacy string 交由既有 temporal normalizer，保留原始 lexical `value`、precision、offset 與 fractional trailing zeros。有效 BSON Date 使用以下規則：

- `date`：以 UTC calendar date 建立 `day` precision 的 canonical date。
- `dateTime`：以 BSON Date 的 UTC instant 建立 canonical UTC dateTime representation。
- `instant`：以 BSON Date 的 UTC instant 建立 canonical instant representation。

所有 BSON Date conversion 都產生 lossy audit。invalid value 或未定義 policy 的 value 仍 fail-fast。preflight 與 cutover gate 將 `lossyBsonDates` 和 `unresolvedAmbiguousBsonDates` 分開計算。

替代方案：使用作業系統 local timezone 會使部署環境改變資料結果；猜測原始 precision 或 timezone 會產生無法追蹤的 silent data corruption。

### 6. 使用 read-only source/target comparison 作為 cutover gate

驗證器依 collection 比對 source/target count 與 identity，對 source document 套用同一 deterministic transformation 後，再與 target document 做 canonical-aware deep comparison。比較時區分 BSON Date 的預期 lossy difference，其他欄位差異一律 failure。

驗證另外執行 target preflight、required index/manifest checks，以及涵蓋 precision、comparator、Period、array、choice、history、contained 與 execution mode 的代表性 search hit-set。所有 gate 通過後才允許 application connection cutover。

替代方案：只比對 count 無法發現欄位遺失；只跑 preflight 無法證明 source/target identity 與 query hit-set 相容。

### 7. 以 generator、unit、integration 與 acceptance tests 保護 contract

先測試 connection-aware model registration、source/target isolation、full-document transformation、checkpoint retry、audit completeness 與 credential redaction，再測試完整 catalog/history migration。保留既有 temporal normalization、serialization、query 與 index tests，新增 BSON Date UTC/lossy cases 及 source/target comparison cases。

generator 重新產生後檢查 generated diff；CLI 測試改測新的雙 DB entrypoint。只有新入口、core migration tests、targeted temporal tests 與完整 test profile 都通過後，才刪除舊 CLI 檔案。

## Risks / Trade-offs

- **[Risk]** 直接在 CLI 傳 authenticated URI 可能暴露於 process inspection。→ 不在 log/report 顯示 URI，並在後續 operator hardening 評估 URI file 或 credential provider；本 change 只實作既定 CLI contract。
- **[Risk]** target model generator 的變更可能產生大量非 temporal generated diff。→ generator 後執行完整 diff gate，非預期非 temporal diff 阻止 migration。
- **[Risk]** bulk write 不會自動執行 Mongoose validators 或 hooks。→ bulk write 前執行 canonical conversion/full-document validation，並以 target preflight 與 source/target deep comparison 作第二道 gate。
- **[Risk]** source 與 target 位於不同 cluster 時無法使用跨 cluster transaction。→ 使用 durable checkpoint、batch idempotency、空 target 與 cutover 前完整驗證，不依賴跨 cluster transaction。
- **[Risk]** BSON Date 轉換後無法恢復原始 lexical value。→ 固定 UTC policy、逐筆 lossy audit，並在 FHIR temporal contract 中禁止宣稱 BSON Date lexical round-trip。
- **[Risk]** migration 中斷可能留下 partial target。→ partial target 永遠不可 cutover；可依 checkpoint 修正重跑，或刪除 target 後從 source 重建。

## Migration Plan

1. 先建立 source backup/snapshot，停止 source writes，確認 source/target identity 與 rollback owner。
2. 更新 connector、model generator 與 generated resource/history models，確認 target connection 不會載入 global application singleton。
3. 實作 streaming preflight、full-document transformer、target bulk writer、checkpoint 與 audit writer。
4. 在測試 database 執行完整 catalog 與 history migration，驗證 BSON Date policy、audit、retry 與 source/target comparison。
5. 以新雙 DB CLI 取代 npm scripts 的舊入口，執行 preflight-only 與 dry-run，確認 evidence 不含 credentials。
6. 在 production target database 執行 write migration；任何 failure 都停止 rollout，不允許 partial target cutover。
7. 執行 target preflight、source/target deep comparison、index verification、explain 與 temporal search acceptance。
8. 通過 cutover gate 後切換 application connection；保留 source database 唯讀並保留 backup、audit、checkpoint 與 reports。
9. rollback 時停止新版 application，切回舊 connection；target 未 cutover 時刪除並重建，已 cutover 則依 backup/restore procedure 還原。
10. rollback window 結束後才封存 source，並移除 legacy mixed-type query fallback。

## Open Questions

無。source/target topology、BSON Date policy、checkpoint/audit location、verification depth 與 CLI replacement scope 已在 design session 中定案。
