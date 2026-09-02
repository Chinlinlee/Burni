## Why

新版 temporal storage 使用 canonical object 與一致的 BSON type，但目前 migration CLI 綁定單一 global Mongoose connection，且只能更新既有文件，無法安全地將 legacy database 完整複製到新版 storage。舊資料中的 BSON Date 也無法完整還原 FHIR lexical value，因此需要隔離 target database、可恢復的批次流程，以及明確揭露 lossy conversion 的 migration contract。

## What Changes

- **BREAKING** 新增 source database → target database 的隔離式 temporal migration。
- **BREAKING** 將 migration 改為 cursor/batch streaming，完整複製 resource、history、nested、choice、contained 與 temporal array 文件。
- 新增獨立 source/target connection 設定與 database identity confirmation。
- source 使用 raw cursor；target 使用 connection-aware model 的低階 collection bulk write，避免觸發 resource save hooks。
- 新增 target migration metadata、durable checkpoint、可重跑流程與 source/target deep comparison。
- 允許依固定 UTC policy 轉換 legacy BSON Date，並以 lossy audit 揭露無法恢復的 lexical precision、timezone 或 fractional representation。
- invalid temporal value 與未定義 policy 的資料 SHALL fail-fast。
- 新增逐筆 audit JSON/JSONL 與 migration summary evidence。
- 以新的雙 DB operator entrypoint 取代目前單 DB CLI，保留 `npm run temporal:migrate` 與 `npm run temporal:preflight`。
- 移除 `scripts/temporal-migrate.js` 與 `scripts/lib/temporal-migrate-cli.js`。

## Capabilities

### New Capabilities

- `temporal-database-migration`: 定義 source/target database、streaming migration、checkpoint、audit、retry、identity preservation 與 cutover verification。

### Modified Capabilities

- `fhir-temporal-storage`: 修改 legacy BSON Date migration behavior，區分可接受的 lossy conversion 與 unresolved ambiguous data。

## Impact

- 影響 `models/FHIR/searchParameter/migration/temporalPreflight.js`、`temporalMigration.js`、`temporalConversion.js` 與 `temporalCutoverGate.js`。
- 影響 MongoDB connector、resource/history model generators 與重新產生的 model files。
- 影響 temporal migration CLI、npm scripts、migration tests、acceptance tests 與 rollout/backup 文件。
- 需要 source/target MongoDB credentials、空 target database、backup/snapshot、audit storage 與 cutover deployment procedure。
