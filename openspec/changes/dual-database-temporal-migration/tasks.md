## 1. Contract and operational documentation

- [x] 1.1 更新 `CONTEXT.md`，定義 temporal source/target database、lossy conversion、audit、checkpoint 與 cutover verification。
- [x] 1.2 更新 temporal rollout 與 backup/restore 文件，記錄 source 停寫、target isolation、UTC lossy policy、rollback 與 evidence requirements。
- [x] 1.3 新增 ADR，記錄隔離 target database、connection-aware models、低階 bulk write 與 CLI replacement 的取捨。

## 2. Connection-aware model registry

- [x] 2.1 讓 resource 與 history model registration 接受指定的 Mongoose connection，且不載入 global application singleton。
- [x] 2.2 更新 resource/history model generator，使 generated factory 能使用指定 connection。
- [x] 2.3 重新產生所有 resource/history models，檢查非 temporal generated diff 並建立 generator regression gate。

## 3. Streaming migration core

- [ ] 3.1 分離 source reader、document transformer、target writer、checkpoint writer 與 audit writer 的 migration contract。
- [ ] 3.2 以 bounded cursor batches 讀取所有 catalog resource 與 history collection，避免將完整 collection 載入記憶體。
- [ ] 3.3 將完整 source document 遞迴轉換後寫入 target，保留 `_id`、FHIR identity、version metadata、非 temporal fields 與結構關聯。
- [ ] 3.4 以 target model collection 的低階 bulk operation 寫入，禁止 resource save hooks、history creation、ID allocation 與 reference tracking 副作用。
- [ ] 3.5 在每個 target batch write 前執行 canonical temporal 與 full-document validation。
- [ ] 3.6 建立 target migration metadata collection，保存 run identity、collection、batch boundary、status、counts 與 errors。
- [ ] 3.7 實作 checkpoint retry 與 idempotent batch handling，確認 partial target 永遠不能被標記為完成。

## 4. BSON Date policy and evidence

- [ ] 4.1 將 `date` BSON Date 依 UTC calendar date 轉成 `day` precision canonical object。
- [ ] 4.2 將 `dateTime` 與 `instant` BSON Date 依 UTC policy 轉成 canonical representation，並保留 lossy classification。
- [ ] 4.3 區分 `lossyBsonDates`、`unresolvedAmbiguousBsonDates` 與 `invalid` diagnostics，更新 preflight 與 cutover gates。
- [ ] 4.4 建立逐筆 audit JSON/JSONL，記錄 source identity、FHIR path、temporal type、policy、原始值與 generated value。
- [ ] 4.5 確認 legacy string 與既有 canonical object 的 idempotent conversion 與 lexical round-trip behavior。

## 5. Dual database operator entrypoint

- [ ] 5.1 建立新的雙 DB preflight、dry-run 與 write operator entrypoint，接受 source/target URI 與明確 database confirmation。
- [ ] 5.2 拒絕 source/target 指向相同 database，並在 logs、reports、audit 中遮罩 authenticated URI 與 credentials。
- [ ] 5.3 保留 `temporal:migrate` 與 `temporal:preflight` npm command，將其改指向新 entrypoint。
- [ ] 5.4 移除 `scripts/temporal-migrate.js` 與 `scripts/lib/temporal-migrate-cli.js`，並將既有 CLI tests 改為新入口測試。

## 6. Verification and cutover gates

- [ ] 6.1 建立 source/target collection count 與 identity comparison。
- [ ] 6.2 建立 canonical-aware full-document deep comparison，區分預期 BSON Date lossy difference 與其他資料差異。
- [ ] 6.3 對 target 執行 temporal preflight、index manifest compatibility 與 explain verification。
- [ ] 6.4 建立 representative temporal search hit-set acceptance，涵蓋 precision、comparator、Period、array、choice、history、contained 與 execution modes。
- [ ] 6.5 將 migration completion、audit completeness、source/target comparison 與 search verification 接入 cutover gate。

## 7. Tests and rollout validation

- [ ] 7.1 增加 source/target connection isolation、空 target、identity preservation 與 credential redaction tests。
- [ ] 7.2 增加 streaming batch、checkpoint interruption、retry、duplicate prevention 與 partial target tests。
- [ ] 7.3 增加所有 BSON Date UTC/lossy policy、invalid value 與 unresolved policy tests。
- [ ] 7.4 增加完整 production catalog、history、nested、choice、contained 與 temporal array migration coverage。
- [ ] 7.5 執行 targeted migration tests、generator checks、`npm test` 與 `npm run test:full`，確認所有 OpenSpec acceptance scenarios 通過。
