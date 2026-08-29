## Context

本 change 延續既有 SearchParameter Registry、restricted FHIRPath compiler 與 SearchQueryPlan。現有 Registry 已能載入官方 R4 Bundle、建立 immutable snapshot、編譯部分 lookup 並接入搜尋 runtime，但 production 目前仍只有 Patient rollout，其他 resource 仍可經由 generated handler fallback。

目前 repository 有 146 種 production resource、1,706 個 `(resourceType, code)` lookup。官方 `search-parameters-r4-4.0.1.json` 是真正的 R4 SearchParameter Bundle；`temp/fhir-search-parameters.json` 是缺少 FHIR resource 語意欄位的精簡 inventory，不能作為 Registry source。`temp/fhir-examples` 可作為遷移輸入，但原始檔案不應直接被測試修改。

Legacy 依賴不只存在於 normal search，也存在於 chain、`_include`/`_revinclude`、conditional delete、Bundle GET parameter validation、API generator 與 shadow tooling。因此刪除單一檔案會破壞尚未遷移的呼叫路徑。

## Goals / Non-Goals

**Goals:**

- 讓 146 種 production resource 都有可追蹤的 Registry outcome，並在通過 gates 後使用 Registry-first。
- 以正式 R4 Bundle、合法 DB overlay、per-lookup typed SearchQueryPlan 作為唯一搜尋語意來源。
- 以固定 official example mapping、derived/synthetic fixture 與可重現 manifest 覆蓋所有 applicable lookup。
- 將所有 SearchParameter 查詢入口統一至 Registry metadata/plan，包含 normal search、one-level chain、include/revinclude、conditional delete 與 Bundle GET validation。
- 在最後一個 legacy call site 移除後，刪除 SearchParameter legacy source、generated handlers、legacy query methods 與過渡 rollout 工具。
- 保留 diagnostics 作為 production/CI 的 source、compiler、fixture 與 enablement 完整性檢查。

**Non-Goals:**

- 不在本 change 實作完整 FHIRPath evaluator、任意函數、arithmetic、terminology evaluation 或 recursive chain。
- 不將 `composite`、`special`、無 expression 或未列入 allowlist 的語意假裝成可執行功能。
- 不將 Bundle transaction、URL/id parsing、response、pagination、summary 或其他非 SearchParameter control pipeline 改寫成 SearchParameter。
- 不因搜尋遷移而移除 CRUD、history、validation 等 API generator 能力。
- 不要求 Registry 與已知有缺陷的 legacy filter JSON 完全相等。

## Decisions

### 1. Canonical source 與 migration inventory 分離

正式 R4/4.0.1 Bundle 是唯一 canonical SearchParameter source。Source adapter 只接受完整 FHIR SearchParameter resource，保留 raw resource、provenance、raw status 與 canonical identity。DB resource 僅依既有 active/overlay/conflict policy 進入 Registry。

`temp/fhir-search-parameters.json` 只用來建立 resource/code inventory 與 migration coverage 差異報告，不讀入 runtime、不補欄位後冒充 SearchParameter resource，也不覆蓋官方 expression。遷移完成後刪除該暫存檔；若需要稽核，應保存帶有 source URL、版本、抓取日期與 hash 的獨立 migration artifact。

替代方案是將精簡 JSON 直接轉成 Registry source，但它缺少 `base`、`status`、`target`、`comparator`、`modifier` 等語意，且 expression 與官方 Bundle 存在差異，會製造不可追蹤的 definition drift，因此不採用。

### 2. 以 lookup 為單位建立完整狀態

Registry 對每個 `(resourceType, code)` 建立獨立結果，狀態只能是：

- `compiled`：有該 resource type 專屬的 typed plan，並通過所有 applicable gates。
- `unsupported`：符合明確政策，例如 `composite`、`special`、無 expression 或未 allowlist 語法。
- `disabled`：有 source definition 但尚未通過 validation/compiler/capability，必須帶穩定 diagnostic；migration 完成前應將可修復 failure 修到 `compiled`。

沒有 SearchParameter 的 resource 只需要 structural gate。任何 lookup 都不能因缺少 fixture、未分類 failure 或 legacy 差異而悄悄跳過；所有 resource enablement 都在 diagnostics 與 manifest 中可追蹤。

替代方案是以 canonical definition 或 resource type 整體作為狀態，但 multi-base definition、union branch 與單一 resource type 的 projection 差異會被混在一起，因此採用 per-lookup state。

### 3. Fixture archive 與 manifest 採固定、可重現的 mapping

從 `temp/fhir-examples` 選出每個 resource 的一個官方 example，建立明確 mapping、resource type 驗證與 source hash。原始 example 複製至受版本控制的 fixture archive，不在測試中 mutate。需要額外欄位時建立 derived fixture；沒有官方 example 的 resource 建立最小合法 synthetic fixture，並在 manifest 標註 `valueSource` 與 augmentation。

Manifest 的主要層級是 source、resource、lookup、plan、fixture、expected hit-set 與 enablement。每個 compiled lookup 至少記錄 positive hit-set、companion negative hit-set，以及適用的 `:missing`、comparator、modifier、multipleOr/multipleAnd contract。choice、union、nested array、reference correlation 與 one-level chain 需要 branch-specific fixture metadata。

替代方案是每次測試自動挑欄位最多的 example，或只提交生成腳本。前者會因上游新增檔案而改變測試語意，後者無法審查歷史 hit-set，因此採固定 mapping 加上提交 manifest/fixtures。

### 4. 所有查詢入口共用 Registry-derived plan

Normal search、conditional delete、Bundle GET validation 與 controlled reference operation 都從同一個 Registry lookup 取得 type、target、extraction path、operator 與 value semantics。Chain 只允許一層，依 declared chain/target 與 Registry lookup index 建立 bounded relation plan；超過 depth/cost、未宣告 target 或 unsupported reference value 一律拒絕。

`_include`、`_revinclude` 的 control behavior 保留，但 reference path、target type 與合法關係改由 Registry metadata 提供。Bundle transaction、resource URL/id parsing、response 組裝、pagination、summary 等非 SearchParameter 行為維持獨立 pipeline。

先將可重用的 type-specific executor primitives 從 legacy `queryBuild`/`searchParameterQueryHandler` 邏輯中抽離，再切換所有呼叫入口。不能以新增另一層 legacy adapter 作為長期解法。

### 5. Legacy removal 依 dependency graph 反向拆除

移除順序固定為：

1. 完成所有 compiler、projection、relation plan 與 per-resource fixture gates。
2. 將 normal search、chain、include/revinclude、conditional delete、Bundle GET 全部切至 Registry。
3. 將 Bundle URL/id helpers 從 SearchParameter-specific utility 中分離。
4. 停止 API generator 讀取 `FHIRParametersClean.json` 與產生 parameter handlers，但保留其他 API generation。
5. 確認所有 runtime、build、test、diagnostics call site 不再依賴 generated handlers。
6. 移除 generated handlers、`parameterHandler.js`、`searchParameterQueryHandler.js` 與已解耦的 legacy search methods。
7. 移除 `FHIRParametersClean.json` 與 SearchParameter-specific `fhir-param` 邏輯。
8. 移除 shadow 與 rollout-status scripts；保留 diagnostics。

替代方案是先刪除 legacy 檔案再依錯誤修復，但會讓 conditional delete、Bundle GET 或 include 功能在中途失效，且無法辨認真正的 migration gap。

### 6. 遷移期間可 rollout，最終不保留 legacy rollback path

遷移期間以 resource gate 控制啟用，先逐 resource 驗證，再關閉該 resource 的 fallback。最終 Registry 永久啟用、legacy fallback 與 rollout flags/config 移除；正式版本不保留切回 legacy handler 的 runtime path。若需要回復，使用上一個完整版本部署，而不是在新版本保留 legacy implementation。

`search-parameter:diagnostics` 不是 rollout status 的替代品，而是長期 Registry integrity command。CI 必須在 source、compiler、fixture 或 capability 改變時檢查 lookup completeness、active conflict、unclassified failure 與不一致的 manifest。

### 7. 以 compatibility-plus-corrections 判定行為

測試以有效 public search projection 為基準，並納入已確認的 deceased choice、ContactPoint system/value correlation 等修正。Address.text、完整 phonetic、Period overlap 與其他明確 non-goal 不得因新 compiler 能解析部分 expression 而被默默納入。

Shadow comparison 只可用於遷移研究與差異報告，不是 enablement gate，也不在 legacy 移除後繼續成為 runtime dependency。

## Risks / Trade-offs

- [官方 example 缺少可搜尋欄位] → 保留原始 example，使用 derived/synthetic fixture 並在 manifest 記錄 augmentation；不得把缺資料標成 compiler failure。
- [某些 resource 沒有官方 example] → 建立可驗證的最小合法 synthetic fixture，明確標記非官方來源。
- [compiler failure 數量在全量 source 下增加] → 以 per-lookup diagnostics 分類，先修復可支援的 parser/type-map/projection failure，對真正 unsupported 建立固定 policy。
- [legacy 与 Registry 行為不同] → 使用 compatibility-plus-corrections 與 document hit-set 作 correctness gate，不要求錯誤 legacy filter 相等。
- [include、conditional delete 與 Bundle GET 遺漏 legacy call site] → 以 dependency graph、全域 import 掃描、端到端 API tests 與刪除後的 module-load verification 作為 deletion gate。
- [多 base 或 union branch 互相污染] → 每個 `(resourceType, code)` 產生獨立 plan，所有可投影 branch 以明確 OR semantics 執行。
- [reference array 產生 false positive] → 使用同一 array element 的 correlated predicate，並拒絕未宣告 target、versioned、contained 與 logical identifier。
- [移除 runtime rollback 後發生 production regression] → 在每個 resource gate 完成後才關閉 fallback；使用上一個版本部署回復，不把 legacy code 留在新架構內。
- [manifest 與 source drift] → 記錄 Bundle hash、example hash、plan hash 與 canonical identity，CI 在 drift 時失敗。

## Migration Plan

1. 固定 R4 Bundle provenance，將 `temp/fhir-search-parameters.json` 降級為一次性 inventory，建立 resource/example mapping 與 manifest schema。
2. 以 146 種 resource 與所有 `(resourceType, code)` 產生 lookup matrix，分類 compiled、可修復 disabled、unsupported、no-lookup 與 fixture coverage。
3. 補齊缺少 official example 的 synthetic fixture，為每個 resource 建立歸檔 fixture；為缺欄位的 official example 建立 derived fixture。
4. 修復 compiler、Resource type map、search-type projection、choice/union、reference correlation、multiple semantics 與 `:missing`，直到所有非 unsupported failure 有明確結果。
5. 將 normal search、one-level chain、include/revinclude、conditional delete 與 Bundle GET validation 全部接到 Registry-derived metadata/plan，並建立各入口的等價行為測試。
6. 逐 resource 通過 golden filter、document hit-set、negative companion、operator/multiplicity、diagnostics 與 structural gates；通過後關閉該 resource fallback。
7. 將 Registry 設為唯一 production search path，移除 fallback/rollout flags；保留 diagnostics 與 CI verification。
8. 依 dependency order 停止 parameter handler generation，移除 generated handlers、legacy search methods、`FHIRParametersClean.json` 與過渡 scripts。
9. 執行全 repository import/reference 檢查、完整測試套件、diagnostics CI 與 production-like startup verification；只在全部通過後刪除最後的暫存 inventory 與不再需要的 migration-only artifacts。
