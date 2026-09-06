# Mongoose 升級評估：8.24.4 vs 9.9.5

> 評估日期：2026-09-06  
> 專案：burni-fhir-server

## 1. 現況

| 項目 | 版本 | 來源 |
|------|------|------|
| mongoose | `8.24.4`（lockfile） | `package-lock.json` |
| mongodb driver | `6.20.0`（mongoose 依賴） | `package-lock.json` |
| Node.js engines | `>=22` | `package.json` |
| 本機 Node | `v24.14.1` | `node -v` |
| connect-mongo | `^6.0.0` | `package.json` |

連線設定見 `models/mongodb/connector.js`：`autoIndex: false`、`autoCreate: false`，並以 `mongoose.Promise = global.Promise` 設定 Promise。

Session store 已使用 `mongoose.connection.getClient()`（`server.js`），符合 connect-mongo 6 建議用法。

## 2. 8.1.1 → 8.24.4 變更

同 major（8.x）內的 patch/minor 升級，**無需跨 major 遷移**。

專案已在 Mongoose 8 上運行，因此 8.0 的重大變更（如 `count()` 移除、`findOneAndRemove()` 移除、`rawResult` → `includeResultMetadata`）已在進入 8.x 時處理或需持續注意：

- [`rawResult` 已改為 `includeResultMetadata`](https://mongoosejs.com/docs/migrating_to_8.html) — 仍見於 `api/FHIRApiService/services/update.service.js:93`，建議後續獨立 PR 修正，不阻擋 8.24.4 升級。
- MongoDB Node driver 6.x — 8.24.4 仍使用 driver 6.x 系列，與現況相容。

8.24.4 主要帶來安全修補與 bug fix，對本專案 API 使用模式風險低。

## 3. 8.24.4 → 9.9.5 變更

依 [Mongoose 9 遷移指南](https://mongoosejs.com/docs/migrating_to_9.html) 與 [9.0.0 release notes](https://github.com/Automattic/mongoose/releases/tag/9.0.0)：

| 變更 | 對本專案影響 |
|------|-------------|
| **Pre middleware 不再支援 `next()`** | **阻斷性**：146 個 FHIR model 各含 3 個 `function(next)` hooks（save / findOneAndUpdate / findOneAndDelete），共約 438 處 |
| MongoDB Node driver 升級至 v7 | 需驗證 mongodb-memory-server、connect-mongo 與所有 Mongo 操作 |
| `findOne(null)` / `find(null)` 改為 throw | 未發現此用法（grep 無匹配） |
| Update pipeline 預設禁止 | 未發現 pipeline 更新用法 |
| `mongoose.Promise` 等 legacy 設定 | `connector.js` 仍設定，需確認 9.x 行為 |

### Pre hook 範例（全 model 共用模式）

```javascript
PatientSchema.pre('save', async function(next) {
    // ...
    return next(new Error(`...`));
    // ...
    return next();
});
```

來源：`models/mongodb/model/Patient.js`（其他 145 個 resource model 同構）。

Mongoose 9 中 `next()` 為 no-op，錯誤無法正確傳遞，版本遞增與驗證邏輯會失效。需改為 `throw` 或純 async（無 `next` 參數），並更新 schema generator。

## 4. 本專案相容性掃描

| 模式 | 結果 |
|------|------|
| `function(next)` in pre/post hooks | **146 files × 3 = ~438** — 9.x 阻斷 |
| `findOne(null)` / `find(null)` | 0 |
| Update pipelines | 0 |
| `Model.count()` | 0（已用 `countDocuments`） |
| `findOneAndRemove` | 0 |
| `rawResult` | 1（`update.service.js`，8.x 仍可用） |
| `mongoose.Promise` | 1（`connector.js`） |

connect-mongo 6 支援 MongoDB driver 5–7、Node 20/22/24（[npm registry](https://www.npmjs.com/package/connect-mongo)），與 mongoose 8.24.4 或 9.x 在 driver 層面均可搭配，但 9.x 仍受 pre hook 重構阻擋。

## 5. 建議

**選擇 mongoose `8.24.4`，不升級至 `9.9.5`。**

理由：

1. **風險最低**：同 major 升級，不需改動 146 個 model 的 middleware。
2. **已滿足需求**：取得 8.x 最新安全修補與 driver 6.x 穩定性。
3. **9.x 成本過高**：需重構 schema generator 與所有 pre/post hooks，並驗證 FHIR CRUD / history / search 全路徑。
4. **Node 22+ 已滿足**：mongoose 8.24.4 要求 Node >=16.20.1（[engines](https://www.npmjs.com/package/mongoose/v/8.24.4)），與 `engines.node: ">=22"` 相容。

若未來要升 9.x，建議獨立 change：先改 generator 輸出 async hooks（`throw` 取代 `next(err)`），再升 major。

## 6. 升級步驟（8.24.4）

1. `package.json`：`"mongoose": "^8.24.4"`
2. `npm install`
3. 執行 `npm test`（fast profile）與相關 MongoDB 整合測試
4. 確認 `npm ls mongoose mongodb` 解析至預期版本

## 7. 參考來源

- [Migrating to Mongoose 8](https://mongoosejs.com/docs/migrating_to_8.html)
- [Migrating to Mongoose 9](https://mongoosejs.com/docs/migrating_to_9.html)
- [Mongoose 9.0.0 Release](https://github.com/Automattic/mongoose/releases/tag/9.0.0)
- [connect-mongo npm](https://www.npmjs.com/package/connect-mongo)
- 專案檔案：`package.json`、`package-lock.json`、`models/mongodb/connector.js`、`server.js`、`models/mongodb/model/Patient.js`
