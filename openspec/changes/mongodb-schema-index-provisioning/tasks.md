## 1. Provisioning contracts and model catalog

- [x] 1.1 定義 collection、baseline index、derived index、manifest checksum 與 reconcile result 的資料契約。
- [x] 1.2 建立 resource、history、static model catalog，確認 collection name 與目前 146 個 resource catalog 對齊。
- [x] 1.3 從已註冊 Mongoose model 收集 schema index metadata，並加入 history compound index 與其他固定服務 query indexes。
- [x] 1.4 建立 deterministic desired manifest generator，合併 schema、service 與 temporal sources，並產生可提交的 JSON artifact。

## 2. Collection and index provisioning

- [x] 2.1 建立 collection provisioning service，明確建立或確認全部 resource、history 與 static collections。
- [x] 2.2 建立 baseline index reconcile，辨識相容、缺少、extra 與 mismatch indexes，維持 additive-only policy。
- [x] 2.3 將既有 temporal manifest generator 與 compatibility validator 接到 desired manifest，只納入 built-in、active、compilable 且通過 temporal policy 的 lookup。
- [x] 2.4 建立 temporal index reconcile，支援 deterministic names、choice branches、array correlation 與 BSON metadata。
- [x] 2.5 確認 `autoCreate=false` 與 `autoIndex=false` 下 provisioning 仍能明確完成 collection/index DDL。

## 3. Lock and state management

- [x] 3.1 建立 `MongoProvisioningLock` control-plane model/collection，支援 database-scoped owner、lease expiry 與 expired lock reclaim。
- [x] 3.2 建立 `MongoProvisioningState` control-plane model/collection，保存 manifest checksum、phase、結果與 drift summary。
- [x] 3.3 將 collection、baseline index、temporal index 與 verify 納入同一個 provisioning lock scope。
- [x] 3.4 實作部分完成後可重試的 phase result 與 failure reporting，不 rollback 已建立的 collection/index。

## 4. Operational commands and startup integration

- [x] 4.1 新增 `mongodb:provision` command，執行完整 provisioning 與最後 verify，錯誤時回傳非零狀態。
- [x] 4.2 新增 `mongodb:verify` command，只讀取 actual state 並回報 missing、extra、mismatch 與 manifest identity drift。
- [x] 4.3 新增 `mongodb:audit-id` command，掃描 resource/history duplicate ids，且不得修改資料。
- [x] 4.4 將 provisioning readiness 與既有 application readiness 分離，維持預設 startup 不執行 provisioning。
- [x] 4.5 新增明確 startup opt-in，啟用時等待 provisioning 成功後才宣告 ready；失敗時不得 listen 並回傳非零結果。

## 5. Identity migration boundary

- [x] 5.1 實作 duplicate audit report，按 collection、resource type 與 id 彙整衝突 documents。
- [x] 5.2 驗證一般 provisioning 不會將既有 `id` index 自動改為 unique。
- [x] 5.3 為未來 unique migration 建立 clean-audit gate，duplicate 存在時拒絕 migration 且不刪除資料。

## 6. Tests

- [x] 6.1 新增 model catalog 與 desired manifest deterministic tests，涵蓋 schema、service、temporal source 合併與 checksum。
- [x] 6.2 新增 collection provisioning tests，涵蓋完整 catalog、already-existing collection、失敗回報與重跑。
- [x] 6.3 新增 baseline/temporal index reconcile tests，涵蓋相容 index、missing index、mismatch、extra index 與 unsafe temporal shape。
- [x] 6.4 新增 lock/state tests，涵蓋 concurrent owner、lease expiry、部分完成與 retry。
- [x] 6.5 新增 MongoDB integration tests，驗證 `listCollections`、`listIndexes`、history compound index 與 temporal index 實際存在。
- [x] 6.6 新增 lifecycle tests，驗證預設 startup 不 provisioning、startup opt-in readiness gate 與 provisioning failure 不 listen。
- [x] 6.7 新增 duplicate audit tests，驗證 duplicate report、unique migration block 與不修改資料。

## 7. Documentation and verification

- [x] 7.1 更新部署 runbook，記錄 provision、verify、audit command、startup opt-in、lock、drift 與 partial retry 行為。
- [x] 7.2 更新 SearchParameter 文件，說明第一階段只有 approved built-in temporal definitions 會建立 derived index，custom definitions 預設不建立。
- [x] 7.3 執行 artifact identity、manifest drift、diagnostics 與 resource enablement gates。
- [x] 7.4 執行 `npm test` fast profile，以及 MongoDB 可用時的 targeted integration tests 或 `npm run test:full`。
- [x] 7.5 執行 OpenSpec validation，確認所有 proposal、spec、design 與 tasks artifact 完整。
