# fhir-temporal-storage Specification

## Purpose

提供一致的 FHIR temporal storage contract，讓 date、dateTime 與 instant 在保留原始表示的同時，能以正確 precision 與可比較的 normalized value 支援儲存、查詢、migration 和 FHIR response。

## Requirements

### Requirement: Temporal values SHALL use type-specific canonical objects

系統 SHALL 將 FHIR temporal primitive 轉換為依 datatype 定義的 canonical object。`date` SHALL 保存 calendar string interval；`dateTime` SHALL 保存 UTC epoch seconds interval；`instant` SHALL 使用獨立的 absolute epoch representation。每個 object 的 `value` SHALL 保存原始 FHIR lexical value。

#### Scenario: Store a partial date

- **WHEN** resource 提供 `date` value `1995-06`
- **THEN** 系統 SHALL 保存 `value` 為 `1995-06`、`precision` 為 `month`、`normalizedStart` 為 `1995-06-01`，以及 `normalizedEnd` 為 `1995-07-01`

#### Scenario: Store a partial dateTime

- **WHEN** resource 提供沒有時間的 `dateTime` value `2015-02`
- **THEN** 系統 SHALL 保存原始 `value` 與 `precision`，並以固定 UTC 將其轉換為該月份的 Decimal128 epoch interval

#### Scenario: Store an instant independently

- **WHEN** resource 提供 `instant` value `2015-02-07T13:28:17.230456789+02:00`
- **THEN** 系統 SHALL 使用 instant-specific object 保存原始 `value`、fraction precision 與 Decimal128 `epochSeconds`，且 MUST NOT 將 instant 當成 date 或 dateTime calendar value

### Requirement: Temporal precision and lexical representation SHALL be preserved

系統 SHALL 保存足以還原原始 FHIR response 的 lexical `value`、precision 與 fractional digit count。Temporal normalization MUST NOT 以 UTC conversion、zero-fill 或 BSON casting 覆寫原始 response value。

#### Scenario: Preserve an offset

- **WHEN** client 傳入 `2015-02-07T13:28:17+02:00`
- **THEN** FHIR response SHALL 保留 `+02:00`，即使 normalized value 使用 UTC epoch

#### Scenario: Preserve trailing fractional zeros

- **WHEN** client 傳入 `2015-02-07T13:28:17.230+02:00`
- **THEN** FHIR response SHALL 保留 `.230`，不得輸出成 `.23` 或其他等價但不同的 lexical value

#### Scenario: Preserve minute precision

- **WHEN** client 傳入合法的 minute-precision dateTime search value `2015-02-07T13:28`
- **THEN** normalization SHALL 保留 `precision` 為 `minute`，並建立從該分鐘起點到下一分鐘起點的 interval

### Requirement: Temporal API boundaries SHALL remain FHIR-compatible

FHIR create、update、Bundle write、read、search response 與 history response SHALL 使用 FHIR scalar temporal strings。canonical temporal object SHALL 是內部 persistence/query representation，不得成為 public FHIR JSON contract。

#### Scenario: Normalize a FHIR write

- **WHEN** client 以 `birthDate: "1995"` 建立 resource
- **THEN** 系統 SHALL 驗證並轉換為 canonical date object 後保存

#### Scenario: Serialize a stored temporal object

- **WHEN** 系統讀取保存有 canonical temporal object 的 resource
- **THEN** FHIR response SHALL 輸出該 object 的原始 `value` 作為 scalar string，且 MUST NOT 輸出 `precision` 或 normalized fields

#### Scenario: Reject persistence-shaped public input

- **WHEN** client 直接提交包含 `value`、`precision` 或 normalized fields 的 temporal object
- **THEN** public FHIR API SHALL 回傳標準 invalid resource/value error

### Requirement: Temporal migration SHALL produce canonical data without guessing

Migration SHALL 將可解析的 legacy string 與 BSON Date 轉換為 canonical temporal object。legacy BSON Date 在 absolute-time field SHALL 轉成 canonical UTC value；legacy BSON Date 在無法無歧義判定 calendar date 的 `date` field SHALL 使 migration fail-fast。Migration MUST NOT 靜默猜測或自動修正 invalid temporal data。

#### Scenario: Migrate a legacy temporal string

- **WHEN** legacy field 保存合法的 `date` 或 `dateTime` string
- **THEN** migration SHALL 保留該 string 作為 `value`，推導 precision，並建立 canonical normalized interval

#### Scenario: Migrate a legacy BSON Date instant

- **WHEN** legacy `instant` field 保存 BSON Date
- **THEN** migration SHALL 以 UTC canonical string 建立 `value`，並以 Decimal128 `epochSeconds` 建立 instant object

#### Scenario: Reject an ambiguous legacy date

- **WHEN** legacy `date` field 保存無法判定原始 calendar date 的 BSON Date
- **THEN** migration SHALL fail-fast、回報欄位與資料值，且 MUST NOT 將猜測結果寫回資料庫

#### Scenario: Reject an invalid or unsupported temporal value

- **WHEN** legacy temporal value 無法解析或沒有適用的 conversion policy
- **THEN** migration SHALL fail-fast、回報 source document、欄位 path 與資料值，且 MUST NOT 將 migration 標記為完成

### Requirement: Temporal normalization SHALL use a deterministic timezone policy

沒有 timezone 的 `dateTime` SHALL 以 UTC 解讀。帶 timezone 的 `dateTime` 與 `instant` SHALL 以其 offset 正規化為 UTC comparable value；原始 offset SHALL 僅由 lexical `value` 保留。

#### Scenario: Normalize a timezone-bearing dateTime

- **WHEN** dateTime value 帶有 `+02:00` offset
- **THEN** normalized value SHALL 代表相同的 UTC instant，FHIR response SHALL 仍輸出原始 `+02:00`

#### Scenario: Normalize a timezone-less dateTime

- **WHEN** dateTime value 沒有 timezone
- **THEN** 系統 SHALL 使用 UTC，而不得依賴作業系統 local timezone
