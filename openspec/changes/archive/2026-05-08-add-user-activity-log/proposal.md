## Why

目前管理者無法得知系統中誰在何時做了什麼操作；當車輛或員工資料被誤改、誤刪時無從追溯。新增「使用者操作紀錄」頁面可讓 admin 集中檢視關鍵事件（登入登出、車輛與員工的 CRUD），提升可稽核性，也作為後續正式後端串接稽核 API 的前置介面。

## What Changes

- 在 MSW mock 後端新增 `activityLogs` 集合，並在所有「會異動資料 / 影響身份狀態」的 handler 中（auth 登入、登出；vehicles 與 employees 的 POST / PUT / DELETE）寫入一筆紀錄。
- 新增 `GET /api/activity-logs` handler，支援以 `actorId`、`action`、`resource`、日期範圍、分頁參數查詢。
- 前端新增 `/activity-logs` 路由，以 `RequireRole="admin"` 守衛，僅 admin 可進入；非 admin 直接導回 `/`（與 `/employees` 一致的行為）。
- 在側邊欄（admin 視角）新增「操作紀錄」入口，排序在「員工管理」之後。
- 紀錄頁提供：表格檢視（時間、操作者、動作、目標資源、摘要）、依動作 / 資源 / 時間範圍篩選、分頁。
- 員工刪除導致 `vehicle.assignedTo` 被清空時，需另外寫一筆 `vehicle.unassigned` 紀錄，避免「車輛被改卻沒紀錄」。

## Capabilities

### New Capabilities

- `activity-log`: 定義系統操作紀錄的資料模型、查詢 API、以及 admin 專屬的紀錄檢視頁面行為。

### Modified Capabilities

- `mock-api`: 新增 `activity-logs` REST 端點，以及在 auth / vehicles / employees handler 中寫入紀錄的副作用要求。
- `auth`: 登入成功與登出時 SHALL 觸發一筆 activity log。
- `vehicle-management`: 車輛新增 / 修改 / 刪除 SHALL 觸發 activity log；員工被刪除導致車輛 unassign 時 SHALL 額外寫入 `vehicle.unassigned` 紀錄。
- `employee-management`: 員工新增 / 修改 / 刪除 SHALL 觸發 activity log。

## Impact

- **新檔案**：`frontend/src/features/activity-log/`（list page、API hook、type）、新增 route entry 於 `frontend/src/routes/router.tsx`、側邊欄選單項目。
- **修改**：`frontend/src/mocks/db.ts`（新增 `activityLogs` 集合與 seed）、`frontend/src/mocks/handlers.ts`（新增端點 + 在既有 handler 加寫入副作用）。
- **localStorage**：`vms.mock-db.v1` schema 將多出 `activityLogs` 欄位；既有資料需做 lazy-migration（讀到舊資料時補空陣列），避免 dev 端使用者必須手動清掉 key。
- **無破壞性變更**：API 路徑均為新增，現有端點行為不變（僅多寫一筆 log 副作用）。
- **依賴**：不引入新 npm 套件。
