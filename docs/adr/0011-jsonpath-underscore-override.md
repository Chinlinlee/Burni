---
status: accepted
---

# 以 npm override 將 jsonpath 的 underscore 釘在 1.13.8

`jsonpath@1.3.0` 把 `underscore` 精確 pin 成 `1.13.6`。該版本落在
[GHSA-qpx9-hpmf-5gmw](https://github.com/advisories/GHSA-qpx9-hpmf-5gmw)
（`_.flatten` / `_.isEqual` 無深度限制遞迴）的受影響範圍，而上游沒有已發布版本改這個
pin，所以 `npm audit` 顯示 No fix available。Burni 仍使用 `jsonpath` 走訪 resource 與
Bundle；此決策只處理這條 audit，不把 override 當成 FHIR write-path DoS 修復。

## Decision

- 用 npm `overrides` **只**覆蓋 `jsonpath` 底下的 `underscore`，精確版本 `1.13.8`。
- 不換成其他 JSONPath 實作；不對整棵依賴樹全域強制 `underscore`。
- 不在同一次變更裡跑其他套件的 `npm audit fix`。

## Considered Options

- 接受 audit 風險、不改安裝樹：拒絕。之後看到 `overrides` 的人會無法分辨這是刻意忽略還是疏漏。
- 換成其他 JSONPath 套件：拒絕。`$..reference` 等語意已有相容測試；換庫的成本與這次 audit 衛生不成比例。jsonpath 目前只用 `_.uniq`，不是 CVE 那兩個 API。
- 全域 `"overrides": { "underscore": "1.13.8" }`：拒絕。現在樹裡只有 jsonpath 帶進 underscore，但全域 override 會在未來無關套件引入 underscore 時默默改掉它。
- `"^1.13.8"`：拒絕。這次要的是 advisory 標明的 patched version；下一個 1.13.x 再顯式 bump。

## Consequences

- `package-lock.json` 安裝的 `underscore` 會是 `1.13.8`，即使 `jsonpath` 仍宣告 `1.13.6`。
- jsonpath 之後若發布改 pin 的版本，應刪除或縮小這個 override，避免永遠 force-pin。
- client FHIR JSON 被 `$..` descendant walk 的遞迴風險不在此 ADR 範圍；那是 jsonpath 自己的 traverser，不是 GHSA-qpx9-hpmf-5gmw。
