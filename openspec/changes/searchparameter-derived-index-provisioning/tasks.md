## 1. Policy and manifest contracts

- [x] 1.1 定義 non-temporal derived-index policy、entry identity、provenance、policy version 與 stable diagnostics contract。
- [x] 1.2 建立 token、reference、string、number、quantity、uri 的 key pattern policy，涵蓋 code/value-only、compound、exact leaf、quantity value 與 raw URI。
- [x] 1.3 建立 single-array correlation、choice/union branch、parallel multikey rejection 與 positional path rejection。
- [x] 1.4 將 non-temporal entries 合併至既有 desired manifest，實作 deterministic ordering、deduplication、readable prefix plus identity hash naming 與 checksum。

## 2. Capability and runtime alignment

- [x] 2.1 修正 number/quantity capability matrix，移除 runtime 尚未支援的 `sa`、`eb`、`ap`，並保留既有 query error contract。
- [x] 2.2 建立 policy-level indexability diagnostics，確保 custom、disabled、unsupported modifier、unsafe shape 與不可投影 branch 不會進入 manifest。
- [x] 2.3 驗證 policy 不新增 token/reference/string/quantity/uri normalization，不改變 raw stored value 或 query hit-set。

## 3. Provisioning and reconciliation integration

- [x] 3.1 將 non-temporal manifest source 接入既有 collection/index provisioning pipeline，只建立 resource collection indexes。
- [x] 3.2 確認 derived indexes 固定 non-unique、無新增 collation/partial filter/sparse constraint，且不使用 query `$hint`。
- [x] 3.3 驗證 missing、compatible、extra、mismatch、manifest identity drift 與 partial retry 沿用 additive-only 行為。
- [x] 3.4 更新 committed desired manifest artifact 與 source/policy identity verification gate。

## 4. Unit and contract tests

- [x] 4.1 新增 policy tests，覆蓋六種型別的 approved key patterns、deduplication 與 unsupported modes。
- [x] 4.2 新增 token tests，覆蓋 Coding、CodeableConcept、Identifier、ContactPoint 的 system/value correlation 與 `:text` boundary。
- [x] 4.3 新增 reference、string、number、quantity、uri tests，覆蓋 target guard、exact leaf、numeric BSON、quantity optional qualifiers 與 raw hierarchy。
- [x] 4.4 新增 array/choice/union safety tests，覆蓋同 element positive、cross-element negative、parallel multikey 與 unsafe branch diagnostics。
- [x] 4.5 新增 manifest determinism、physical name、checksum、provenance 與 artifact drift tests。

## 5. MongoDB and operational verification

- [x] 5.1 新增 MongoDB integration tests，驗證 resource collection 的 derived indexes 實際出現在 `listIndexes`。
- [x] 5.2 驗證 provision/verify 在 missing、compatible、extra 與 mismatch index 狀態下的結果與不刪除行為。
- [x] 5.3 驗證缺少 derived index 時 query 仍可執行、diagnostics 明確標記效能 drift，且 application readiness contract 不變。
- [x] 5.4 執行 artifact identity、manifest drift、SearchParameter diagnostics、fast profile 與可用 MongoDB 下的 targeted/full verification。

## 6. Documentation

- [x] 6.1 更新 SearchParameter 文件，記錄六種型別的 indexed boundary、unsupported modifiers、array correlation 與 custom exclusion。
- [x] 6.2 更新 MongoDB provisioning runbook，記錄 manifest source、policy version、verify/provision、drift、COLLSCAN fallback 與 rollback 行為。
