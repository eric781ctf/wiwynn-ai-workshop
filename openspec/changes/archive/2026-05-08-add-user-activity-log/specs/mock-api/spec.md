## ADDED Requirements

### Requirement: Activity log API
MSW SHALL 提供 `GET /api/activity-logs` 端點，回傳分頁的操作紀錄資料。Query 參數 SHALL 支援：`actorId`、`action`、`resource`、`from`（YYYY-MM-DD）、`to`（YYYY-MM-DD）、`page`（預設 1）、`pageSize`（預設 20、最大 100，超過 clamp）。回傳格式 SHALL 為 envelope：`{ items: ActivityLog[], total: number, page: number, pageSize: number }`，items 依 `timestamp` desc 排序。系統 SHALL **不** 提供建立、修改或刪除 activity log 的端點。

#### Scenario: 取得分頁紀錄
- **WHEN** `GET /api/activity-logs?page=1&pageSize=20`
- **THEN** 回傳 200 與 `{ items, total, page: 1, pageSize: 20 }`
- **AND** items 依 timestamp 由新到舊排序

#### Scenario: 依 action 篩選
- **WHEN** `GET /api/activity-logs?action=vehicle.deleted`
- **THEN** 回傳 200，items 僅包含 action 為 `vehicle.deleted` 的紀錄

#### Scenario: 依日期範圍篩選
- **WHEN** `GET /api/activity-logs?from=2026-05-01&to=2026-05-08`
- **THEN** 回傳 200，items 僅包含 timestamp 落於 `2026-05-01 00:00:00` ~ `2026-05-08 23:59:59` 區間的紀錄

#### Scenario: pageSize 超過上限被 clamp
- **WHEN** `GET /api/activity-logs?pageSize=500`
- **THEN** 回傳的 `pageSize` 欄位為 100
- **AND** items 長度 ≤ 100

### Requirement: Auth handler 寫入 activity log
MSW 的 `POST /api/auth/login`（成功時）與 `POST /api/auth/logout` SHALL 在處理完原本邏輯後，於 mock DB 追加一筆 activity log，分別為 `auth.login` 與 `auth.logout`。`actorId` / `actorName` SHALL 為當下登入或登出的 user。登入失敗（401）時 SHALL **不** 寫入紀錄。

#### Scenario: 登入成功寫入紀錄
- **WHEN** `POST /api/auth/login` 收到正確帳密
- **THEN** 回傳 200 與 `{ token, user }`
- **AND** mock DB 多一筆 action=`auth.login`、actorId=該 user.id 的紀錄

#### Scenario: 登入失敗不寫入紀錄
- **WHEN** `POST /api/auth/login` 收到錯誤帳密並回傳 401
- **THEN** mock DB 中 activity log 數量不變

#### Scenario: 登出寫入紀錄
- **WHEN** `POST /api/auth/logout` 由已登入使用者發出（Authorization header 帶有 token）
- **THEN** 回傳 204
- **AND** mock DB 多一筆 action=`auth.logout` 的紀錄，actorId 由 token 解析得出

### Requirement: 車輛 handler 寫入 activity log
MSW 的 `POST /api/vehicles`、`PUT /api/vehicles/:id`、`DELETE /api/vehicles/:id` 在成功時 SHALL 各自追加一筆 activity log，action 分別為 `vehicle.created`、`vehicle.updated`、`vehicle.deleted`。`targetId` SHALL 為該 vehicle 的 id；`targetLabel` SHALL 為該 vehicle 的 `plateNo`（snapshot 寫入時值）。失敗（400 / 404）時 SHALL **不** 寫入紀錄。

#### Scenario: 建立車輛寫入紀錄
- **WHEN** `POST /api/vehicles` 成功建立 plateNo=`XYZ-0001` 的車輛
- **THEN** 回傳 201
- **AND** mock DB 多一筆 action=`vehicle.created`、targetLabel=`XYZ-0001` 的紀錄

#### Scenario: 重複車牌不寫入紀錄
- **WHEN** `POST /api/vehicles` 因車牌重複回傳 400
- **THEN** mock DB 中 activity log 數量不變

#### Scenario: 刪除車輛寫入紀錄
- **WHEN** `DELETE /api/vehicles/:id` 成功
- **THEN** 回傳 204
- **AND** mock DB 多一筆 action=`vehicle.deleted` 的紀錄

### Requirement: 員工 handler 寫入 activity log
MSW 的 `POST /api/employees`、`PUT /api/employees/:id`、`DELETE /api/employees/:id` 在成功時 SHALL 各自追加一筆 activity log，action 分別為 `employee.created`、`employee.updated`、`employee.deleted`。`targetLabel` SHALL 為該 employee 的 `name`（snapshot）。失敗時 SHALL **不** 寫入紀錄。

#### Scenario: 新增員工寫入紀錄
- **WHEN** `POST /api/employees` 成功建立員工「林小華」
- **THEN** 回傳 201
- **AND** mock DB 多一筆 action=`employee.created`、targetLabel=`林小華` 的紀錄

### Requirement: 員工刪除 cascade 觸發 vehicle.unassigned 紀錄
當 `DELETE /api/employees/:id` 成功並導致一台或多台車輛的 `assignedTo` 被清空時，MSW SHALL 對「每一台」被解除指派的車輛追加一筆 action=`vehicle.unassigned` 的 activity log，targetId 為該車輛 id、targetLabel 為該車輛 plateNo、summary 註明「因員工刪除而解除指派」。`employee.deleted` 與 `vehicle.unassigned` 紀錄 SHALL 共用同一次操作的 actor。

#### Scenario: 刪除已指派車輛的員工
- **WHEN** `DELETE /api/employees/:id` 成功，且該員工原本被 v1、v2 兩台車指派
- **THEN** 回傳 204
- **AND** v1 與 v2 的 `assignedTo` 變為 null
- **AND** mock DB 多 1 筆 `employee.deleted` 與 2 筆 `vehicle.unassigned` 紀錄
- **AND** 三筆紀錄的 `actorId` 相同

#### Scenario: 刪除未指派任何車輛的員工
- **WHEN** `DELETE /api/employees/:id` 成功，且該員工未被任何車輛指派
- **THEN** mock DB 僅多 1 筆 `employee.deleted` 紀錄，**無** `vehicle.unassigned` 紀錄

### Requirement: Mock DB 新增 activityLogs 集合與 lazy migration
Mock DB 結構 SHALL 新增 `activityLogs: ActivityLog[]` 欄位。系統載入既有 localStorage（key=`vms.mock-db.v1`）資料時，若該欄位 `undefined`，SHALL 自動補為空陣列並立即 persist 回 localStorage。系統 SHALL **不** 變更 storage key 名稱（避免洗掉既有 dev 資料）。

#### Scenario: 既有 dev 環境首次載入新版
- **WHEN** localStorage 已存在 `vms.mock-db.v1` 但其值不含 `activityLogs` 欄位
- **THEN** 系統讀取後將 `activityLogs` 補為 `[]`
- **AND** 立即將補完的結構寫回 localStorage
- **AND** 既有 users / vehicles / employees 資料保持不變

#### Scenario: 全新環境首次載入
- **WHEN** localStorage 中無 `vms.mock-db.v1`
- **THEN** 系統載入 seed 資料，且 `activityLogs` 初始化為 `[]`
