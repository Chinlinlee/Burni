# Temporal rollout deployment sequence

本文件是 `normalize-fhir-temporal-search` 的 7.3 部署順序。它只定義 orchestration、prerequisite、abort point 與 rollback point；不會自動執行 production migration、MongoDB destructive operation 或 legacy code removal。

## 使用的既有 contract

- Migration preflight 與 idempotent write API：`models/FHIR/searchParameter/migration/temporalPreflight.js`、`models/FHIR/searchParameter/migration/temporalMigration.js`
- 7.1 temporal index manifest/generator：`models/FHIR/searchParameter/indexes/indexManifest.js`、`models/FHIR/searchParameter/indexes/indexGenerator.js`
- 7.2 compatibility 與 explain validator：`models/FHIR/searchParameter/indexes/indexValidation.js`、`models/FHIR/searchParameter/indexes/indexCompatibility.js`
- Registry activation policy：`models/FHIR/searchParameter/registry/activationPolicy.js`；runtime reload 使用 `models/FHIR/searchParameter/runtime/registryLifecycle.js`
- Backup/restore：`docs/temporal-migration-backup-restore.md`

Index manifest 必須由 7.1 generator 產生，並先通過 7.2 manifest、extraction-path、BSON type、array correlation、choice branch 與 explain 驗證。不得以 raw FHIR `value` filter 或另一份手工 index 清單取代這些 contract。

## 不可跳步的順序

### 1. Migration preflight

Prerequisite：載入與 production catalog、nested、choice、contained、history、temporal array 相符的 schema definitions 與 models。

執行 `runTemporalMigrationPreflight` 的 read-only scan。只有 `valid: true`，且 `summary.invalid`、`summary.ambiguousBsonDates` 與 unavailable source 都是零，才可繼續。任何 invalid 或 ambiguous value 都要停止並修正來源資料；不得猜測日期或繞過 gate。

Abort point：此步驟不寫資料，因此不需要 data rollback。保留 preflight report 作為 rollout evidence。

### 2. Backup / snapshot

Prerequisite：preflight gate 已通過。

依 [`temporal-migration-backup-restore.md`](./temporal-migration-backup-restore.md) 建立包含所有 resource 與 `_history` collection 的可驗證 backup/snapshot，並保存於資料庫以外的可靠位置。記錄資料庫、Burni 版本、dump 時間與工具版本。

Abort point：backup 無法驗證時停止，不得開始 migration。此時尚未改變 temporal data。

### 3. Migration

Prerequisite：backup/snapshot identifier、restore owner 與 restore procedure 已確認。

使用既有 `runTemporalMigration`，設定合適的 `batchSize`，保存每個 batch 與總結結果。它會使用既有 preflight、canonical conversion 與 idempotent update contract；已是 canonical object 的值必須保持 skipped，不得重複包裝。

Abort point：任何 write exception、failed batch 或不一致結果都停止後續步驟。依 backup/restore 文件確認目標資料庫後還原，restore 後重新執行 read-only preflight，再切回相容版本。

### 4. Index creation

Prerequisite：migration operation 已成功完成，且使用同一份 7.1 manifest。

只建立 manifest `indexes` 中列出的 normalized temporal indexes：date calendar boundary、dateTime Decimal128 boundary、instant Decimal128 epoch，以及相容的 Period compound shape。index creation operation 必須由 deployment adapter 注入；本 repository 不提供自動 production index writer。

Abort point：任一 index 建立失敗時停止，不得進入 schema cutover。依 MongoDB index deployment 的 release rollback procedure 處理，不得刪除或重建 unrelated non-temporal indexes。

### 5. Index verification

Prerequisite：所有 manifest index 已建立。

先以 7.2 validator 確認 manifest 與 compiled plan 一致，再對代表性的 Period、array、choice 與 execution modes 執行 explain。explain winning plan 必須使用 manifest 中的 index；`find`、`aggregate` 與 `chained` 必須使用相同 filter、BSON type 與 index metadata。沒有 explain adapter 時只能使用 deterministic dry-run fake explain，不能將它當成實際 optimizer evidence。

Abort point：manifest compatibility、element correlation、choice branch、BSON type 或 explain gate 任何一項失敗，都不得啟用 canonical schema。

### 5.5 Cutover completion gate

在 schema cutover 前執行 `models/FHIR/searchParameter/migration/temporalCutoverGate.js` 的 read-only verification API。它必須同時確認 migration completion、preflight 沒有 unresolved invalid/ambiguous diagnostics、7.1 manifest/7.2 compatibility 與 explain gate，以及 backup/snapshot 的 restoreability。任一 gate 缺失或失敗都會停止 rollout，並輸出 audit diagnostics、summary 與 rollback recommendation。

gate 可注入 migration/preflight status provider、backup verifier、index verifier 與 activation adapter；預設不執行寫入。`runTemporalRollout` 只有在 gate 通過後才會呼叫 schema activation，且 legacy fallback removal 仍依賴成功的 schema cutover。

### 6. Schema cutover

Prerequisite：index verification gate 已通過，且 deployment owner 已完成 cutover 前的 release checks。

以既有 generated canonical schema 啟用 temporal scalar-to-object write normalization 與 canonical-only validation；以 registry 的 `applyActivationOverlay` 規則確認 active、compilable definition，再透過既有 registry reload lifecycle 載入。這一步不改變 non-temporal resource rollout。

Abort point：schema、registry activation 或 health check 失敗時停止。先 rollback application release；若資料已被 migration 改寫，依原始 backup/snapshot 還原。

### 7. Legacy fallback removal

Prerequisite：schema cutover 已完成且健康檢查通過。此步驟不能與 schema cutover 平行，也不能提前執行。

移除 legacy mixed-type query fallback 與相關 deployment wiring。production SearchParameter 只使用 Registry、canonical normalized fields、7.1 manifest 與 7.2 compatibility contract；不恢復 raw string/BSON Date range fallback。

Abort point：fallback removal release 不一致時停止並回復上一個 application release。不要以重新啟用 mixed-type query 作為臨時修復。

## Orchestration API

`models/FHIR/searchParameter/migration/temporalRollout.js` 提供：

- `createTemporalRolloutPlan(options)`：建立上述順序、dependencies、gates、abort/rollback metadata 的純 plan。必須傳入 7.1 `indexManifest`、compiled `plans` 與 7.2 `indexVerification.requests` 或已驗證的 explain result。
- `verifyTemporalCutover(options)`：以 read-only 方式驗證 migration completion、preflight、backup restoreability、manifest compatibility 與 explain gate，輸出可審計的 diagnostics、summary 與 rollback recommendation。
- `runTemporalRollout(options)`：執行注入的 orchestration adapter。`dryRun` 預設為 `true`；預設不會呼叫 backup、migration、index creation、schema cutover 或 fallback removal writer。只有明確傳入 `dryRun: false` 且注入對應 operation 時才會執行。

示意：

```javascript
const {
    runTemporalRollout
} = require("@models/FHIR/searchParameter/migration/temporalRollout");

await runTemporalRollout({
    indexManifest,
    plans,
    indexVerification: {
        requests: explainRequests
    },
    operations: {
        preflight,
        backup,
        migration,
        createIndexes,
    cutoverCompletionGate,
        schemaCutover,
        removeLegacyFallback
    }
});
```

`verifyIndexes` 可注入 deployment-specific adapter；若未注入，API 會使用既有 7.2 `verifyTemporalExecutionModes`。每個 operation 都只在前一步成功後取得呼叫機會，legacy fallback removal 只會在 schema cutover 成功後執行。

## Rollout evidence

每次 rollout 應保存 plan、manifest identity、preflight report、backup/snapshot identifier、migration batch summary、index creation/verification 結果、schema activation 結果與 release rollback reference。non-temporal rollout 不需要加入這套 migration 或 index sequence。
