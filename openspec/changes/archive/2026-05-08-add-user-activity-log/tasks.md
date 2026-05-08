## 1. Mock 後端：資料模型與 helper

- [x] 1.1 在 [frontend/src/mocks/db.ts](frontend/src/mocks/db.ts) 新增 `ActivityAction`、`ActivityResource`、`ActivityLog` type，並擴充 `MockDB` 加入 `activityLogs: ActivityLog[]`。
- [x] 1.2 修改 `loadFromStorage()` 為 lazy migration：解析後若 `activityLogs === undefined` 補 `[]` 並立即 `persist()`；不變更 `STORAGE_KEY`。
- [x] 1.3 修改 `createSeed()` 將 `activityLogs` 初始化為 `[]`，並更新 `resetDb()` 一併重置。
- [x] 1.4 在 [frontend/src/mocks/handlers.ts](frontend/src/mocks/handlers.ts) 新增 helper：`getActor(request)` 解析 `Authorization: Bearer fake-jwt-<role>-<userId>`，回傳 `{ id, name }`；找不到時回傳 `{ id: "system", name: "system" }`。
- [x] 1.5 在 handlers.ts 新增 helper：`appendLog(request, partial)`，自動補 `id`（用 `newId("log")`）、`timestamp`（new Date().toISOString()）、actor，push 到 `db.activityLogs`，超過 1000 筆時 `shift()` 最舊的，最後 `persist()`。

## 2. Mock 後端：handler 副作用

- [x] 2.1 在 `POST /api/auth/login` 成功路徑（401 之後、`HttpResponse.json` 之前）寫入 `auth.login` log，actor 用回應中的 user（不依賴 token，因為登入前無 token）。
- [x] 2.2 在 `POST /api/auth/logout` 寫入 `auth.logout` log，actor 由 `getActor(request)` 解析。
- [x] 2.3 在 `POST /api/vehicles` 成功路徑寫入 `vehicle.created` log，targetId=created.id、targetLabel=plateNo、summary=「新增車輛 <plateNo>」。
- [x] 2.4 在 `PUT /api/vehicles/:id` 成功路徑寫入 `vehicle.updated` log；summary 列出實際變更欄位。
- [x] 2.5 在 `DELETE /api/vehicles/:id` 成功路徑寫入 `vehicle.deleted` log，targetLabel 取刪除前的 plateNo。
- [x] 2.6 在 `POST /api/employees` / `PUT /api/employees/:id` / `DELETE /api/employees/:id` 各成功路徑寫入對應 log。
- [x] 2.7 在 `DELETE /api/employees/:id` 的 cascade 區塊（`db.vehicles.forEach` 內），對每台 `assignedTo === id` 的車輛額外寫一筆 `vehicle.unassigned` log，summary=「因員工 <name> 刪除而解除指派」；確保與 `employee.deleted` 共用同一 actor。
- [x] 2.8 確認所有失敗路徑（401 / 400 / 404）皆「不」呼叫 `appendLog`。

## 3. Mock 後端：查詢 API

- [x] 3.1 在 handlers.ts 新增 `GET /api/activity-logs` handler。
- [x] 3.2 解析 query：`actorId`、`action`、`resource`、`from`、`to`、`page`（parseInt，預設 1）、`pageSize`（parseInt，預設 20，clamp 到 [1, 100]）。
- [x] 3.3 依條件 filter `db.activityLogs`：`from` 轉為 `<from>T00:00:00.000Z`、`to` 轉為 `<to>T23:59:59.999Z` 區間比對 timestamp。
- [x] 3.4 sort 後計算 `total`，slice 出當頁 items，回傳 envelope `{ items, total, page, pageSize }`。

## 4. 前端 feature scaffold

- [x] 4.1 建立 [frontend/src/features/activity-log/types.ts](frontend/src/features/activity-log/types.ts)：匯出 `ActivityLog`、`ActivityAction`、`ActivityResource`、`ListActivityLogsParams`、`ListActivityLogsResponse`。
- [x] 4.2 建立 [frontend/src/features/activity-log/api.ts](frontend/src/features/activity-log/api.ts)：實作 `listActivityLogs(params)`，組 query string 後透過 `apiClient` 呼叫 `GET /api/activity-logs`。
- [x] 4.3 建立 [frontend/src/features/activity-log/labels.ts](frontend/src/features/activity-log/labels.ts)：匯出 `ACTION_LABELS`、`RESOURCE_LABELS`（zh-TW 對照表）供表格與篩選下拉共用。

## 5. 前端 UI 元件

- [x] 5.1 建立 [frontend/src/features/activity-log/ActivityLogFilters.tsx](frontend/src/features/activity-log/ActivityLogFilters.tsx)：操作者 / 動作 / 資源 dropdown + from / to 兩個 date input + 「清除」按鈕；以受控元件透過 props 回報 filter 變更。
- [x] 5.2 建立 [frontend/src/features/activity-log/ActivityLogTable.tsx](frontend/src/features/activity-log/ActivityLogTable.tsx)：Table 欄位 timestamp / actorName / action / resource / targetLabel / summary，timestamp 以 zh-TW locale 顯示；空資料 fallback「尚無操作紀錄」。
- [x] 5.3 建立 [frontend/src/features/activity-log/ActivityLogPagination.tsx](frontend/src/features/activity-log/ActivityLogPagination.tsx)：顯示「第 N / M 頁」、上一頁 / 下一頁按鈕；邊界 disabled。

## 6. 頁面與路由

- [x] 6.1 建立 [frontend/src/pages/ActivityLogsPage.tsx](frontend/src/pages/ActivityLogsPage.tsx)：管 `filters`、`page` state，組 `listActivityLogs` 呼叫；filter 變更時重置 `page=1`；用 5.x 元件組成版面。處理 loading / error 狀態（沿用其他頁的 skeleton / toast 模式）。
- [x] 6.2 修改 [frontend/src/routes/router.tsx](frontend/src/routes/router.tsx)：在 `RequireRole role="admin"` 區塊新增 `/activity-logs` route，element 為 `ActivityLogsPage`。
- [x] 6.3 修改 [frontend/src/components/layout/AppShell.tsx](frontend/src/components/layout/AppShell.tsx)：在 admin 視角側邊欄於「員工管理」之後新增「操作紀錄」入口，連結 `/activity-logs`；非 admin 不顯示。

## 7. 整合：登出時序

- [x] 7.1 確認 [frontend/src/features/auth/AuthContext.tsx](frontend/src/features/auth/AuthContext.tsx) 的登出流程「先呼叫 `POST /api/auth/logout` 再清 token」（spec 要求 logout log 的 actor 必須由仍有效的 token 解析）。若目前順序相反則調整。

## 8. 驗證

- [ ] 8.1 在 frontend dev server 手動驗證：admin 登入 → 看到「操作紀錄」入口 → 進入頁面 → 看到 `auth.login` 紀錄。
- [ ] 8.2 對車輛與員工各做一次 create / update / delete，確認各產生對應紀錄；故意觸發車牌重複（400）確認**不**產生紀錄。
- [ ] 8.3 刪除一個被多台車指派的員工，確認產生 1 筆 `employee.deleted` + N 筆 `vehicle.unassigned`，三者 actorId 相同。
- [ ] 8.4 用 user 帳號登入：側邊欄無「操作紀錄」、直接輸入 `/activity-logs` 被導回 `/`。
- [ ] 8.5 測試篩選（每個欄位獨立 + 組合）、分頁切換、refresh 後紀錄仍存在。
- [ ] 8.6 在 DevTools 用未含 `activityLogs` 的舊 `vms.mock-db.v1` 值覆寫 localStorage，reload 後確認 lazy migration 補上空陣列且既有資料未被洗掉。
- [x] 8.7 跑 `cd frontend && npm run lint && npm run build`，確認無 type / lint 錯誤。
