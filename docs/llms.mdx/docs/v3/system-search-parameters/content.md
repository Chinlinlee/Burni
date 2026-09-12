# FHIR System Search Parameters (/docs/v3/system-search-parameters)



# FHIR System Search Parameters [#fhir-system-search-parameters]

The HL7 FHIR standard defines system search parameters that apply across all resource types. **Burni v3** provides full native support and MongoDB query optimization for these parameters.

***

## 1. `_tag`: Filtering by Meta Tags [#1-_tag-filtering-by-meta-tags]

Find resources associated with specific category or metadata tags (`Resource.meta.tag`):

```http
GET [baseUrl]/Patient?_tag=http://example.org/codes|VIP
GET [baseUrl]/Observation?_tag=critical
```

### Multiple Tag Combinations [#multiple-tag-combinations]

* Comma separated (`_tag=a,b`): Logical OR
* Repeated parameters (`_tag=a&_tag=b`): Logical AND

```http
GET [baseUrl]/Patient?_tag=http://example.org|tagA&_tag=http://example.org|tagB
```

***

## 2. `_security`: Security Labels [#2-_security-security-labels]

Filter resources based on their confidentiality classification or access constraints (`Resource.meta.security`):

```http
GET [baseUrl]/DocumentReference?_security=http://terminology.hl7.org/CodeSystem/v3-ActCode|R
```

Ideal for multi-tenant isolation, role-based filtering, and compliance auditing.

***

## 3. `_profile`: Profile Conformance [#3-_profile-profile-conformance]

Query resources conforming to a designated StructureDefinition Canonical URI (`Resource.meta.profile`):

```http
GET [baseUrl]/Patient?_profile=http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient
```

***

## 4. Full Date & Timezone Offset Precision [#4-full-date--timezone-offset-precision]

FHIR date searches require strict interval calculation depending on the parameter format:

* Prefixes: `eq`, `ne`, `gt`, `lt`, `ge`, `le`, `sa`, `eb`, `ap`.
* Timezone Offsets: Handles UTC offsets (`+08:00`, `-05:00`, `Z`) accurately.
* Varying Precision: Searches using year (`ge2026`) or month (`2026-09`) automatically expand to exact start and end millisecond ranges, preventing false negatives.

Examples:

```http
GET [baseUrl]/Appointment?date=ge2026-09-01&date=le2026-09-30
GET [baseUrl]/Observation?date=gt2026-09-12T00:00:00+08:00
```
