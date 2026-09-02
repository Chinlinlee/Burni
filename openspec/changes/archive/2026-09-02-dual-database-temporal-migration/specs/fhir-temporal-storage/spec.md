## MODIFIED Requirements

### Requirement: Temporal migration SHALL produce canonical data with explicit loss policy

Migration SHALL convert valid legacy strings and BSON Dates into canonical temporal objects without silently guessing invalid values. Legacy BSON Dates SHALL use a deterministic policy: a BSON Date in a `date` field SHALL become a UTC calendar date with `day` precision, while a BSON Date in an absolute-time field SHALL become a canonical UTC value. Any conversion that cannot reproduce the original FHIR lexical value SHALL be marked as lossy and recorded in migration audit evidence. Invalid values and values without an applicable policy SHALL fail-fast.

#### Scenario: Migrate a legacy temporal string

- **WHEN** legacy field 保存合法的 `date` 或 `dateTime` string
- **THEN** migration SHALL 保留該 string 作為 `value`，推導 precision，並建立 canonical normalized interval

#### Scenario: Migrate a legacy BSON Date in a date field

- **WHEN** legacy `date` field 保存有效 BSON Date
- **THEN** migration SHALL 使用 BSON Date 的 UTC calendar date 建立 `day` precision 的 canonical date object，並將 conversion 標記為 lossy

#### Scenario: Migrate a legacy BSON Date in an absolute-time field

- **WHEN** legacy `instant` 或 `dateTime` field 保存有效 BSON Date
- **THEN** migration SHALL 以 UTC canonical value 建立 temporal object，並將無法恢復的原始 lexical details 寫入 audit evidence

#### Scenario: Reject an invalid or unsupported temporal value

- **WHEN** legacy temporal value 無法解析或沒有適用的 conversion policy
- **THEN** migration SHALL fail-fast、回報 source document、欄位 path 與資料值，且 MUST NOT 將 migration 標記為完成
