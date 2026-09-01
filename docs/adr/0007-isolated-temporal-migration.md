---
status: proposed
---

# 使用隔離 target database 執行 temporal migration

## Context

新版 temporal storage 使用 canonical object 與固定 BSON type。舊版資料可能將 FHIR temporal value 保存為 string 或 BSON Date；新版 query 不會在 mixed BSON type 上提供可靠的 range semantics。現有 migration CLI 綁定單一 global Mongoose connection，且只能更新既有文件，不適合將 legacy database 安全轉換到新的 storage model。

BSON Date 沒有保留 FHIR 原始 lexical value、precision 與 timezone。為了讓既有資料可以進入新版，migration 必須採用明確的 lossy policy，而不能宣稱所有 BSON Date 都能完整 round-trip。

## Decision

使用 source database → target database 的隔離式 migration：

- source database 在 migration 期間停寫並保持唯讀。
- target database 使用專用空 database，完成 migration 與驗證後才切換 application connection。
- source 使用 raw MongoDB cursor；target 使用 connection-aware model 的低階 collection bulk write，不觸發 resource save hooks。
- migration 以 cursor、batch 與 durable checkpoint 執行，完整複製並轉換 resource、history、nested、choice、contained 與 temporal array 文件。
- legacy string 保留原始 lexical value；BSON Date 依固定 UTC policy 轉換，並標記為 lossy。
- `date` BSON Date 轉成 UTC calendar date、precision `day`；`dateTime` 與 `instant` 轉成 UTC canonical representation。
- invalid value 或沒有明確 policy 的資料會 fail-fast。
- 每筆 lossy conversion 寫入 audit JSON/JSONL，target metadata collection 保存 checkpoint。
- cutover 前必須完成 source/target deep comparison、preflight、index verification 與代表性 search hit-set 驗證。
- 以新的雙 DB operator entrypoint 取代目前單 DB CLI，但保留 `npm run temporal:migrate` 與 `npm run temporal:preflight`。

## Alternatives considered

- **原地更新同一 database**：拒絕。失敗時容易留下混合 schema，rollback 也會直接影響正在服務的資料。
- **直接使用 Mongoose `.save()` 或 `.create()`**：拒絕。generated resource hooks 可能寫入 history、ID registry 與 reference tracking，造成 migration side effects。
- **只用 mongodump/restore**：拒絕。dump 不會執行 temporal conversion，也無法產生 source/target semantic comparison。
- **所有 BSON Date fail-fast**：拒絕。這會阻止可透過固定 policy 進入新版的 absolute-time data；但沒有 policy 的資料仍然必須 fail-fast。

## Consequences

- 需要讓 resource/history generated model factory 支援指定 Mongoose connection，並重新產生 generated models。
- migration core 必須分離 source reader、target writer，並支援 streaming、checkpoint、audit 與 full-document copy。
- 現有 preflight contract 必須區分 `lossyBsonDates` 與 `unresolvedAmbiguousBsonDates`。
- BSON Date 的 FHIR lexical round-trip 不再是可宣稱的保證，必須由 audit 明確揭露。
- target verification 與 migration evidence 的成本增加，但可避免 silent data loss 並提供可恢復的 cutover 流程。
