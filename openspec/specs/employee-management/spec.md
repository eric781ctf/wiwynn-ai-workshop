# employee-management Specification

## Purpose

定義員工資料的管理能力，包含列表檢視、新增、編輯、刪除等 CRUD 操作。本能力僅開放給 `role=admin` 使用，並涵蓋員工被車輛指派時的刪除提示行為。
## Requirements
### Requirement: 員工列表檢視（僅 admin）
系統 SHALL 在 `/employees` 路由提供員工資料列表，**僅 `role=admin` 可存取**。列表 SHALL 顯示以下欄位：姓名 (name)、部門 (department)、職稱 (title)、Email、到職日 (hiredAt)、操作 (編輯 / 刪除)。

#### Scenario: 管理者進入員工管理
- **WHEN** `role=admin` 點擊側邊欄「員工管理」
- **THEN** 系統呼叫 `GET /api/employees`
- **AND** 以表格顯示所有員工
- **AND** 表格上方提供「新增員工」按鈕

#### Scenario: 一般使用者被拒絕存取
- **WHEN** `role=user` 於網址列輸入 `/employees`
- **THEN** 系統導向 `/`（首頁）
- **AND** **不** 呼叫 `GET /api/employees`

#### Scenario: 列表為空
- **WHEN** 系統內無任何員工資料
- **THEN** 表格顯示「尚無員工資料」提示

### Requirement: 新增員工（僅 admin）
系統 SHALL 提供「新增員工」對話框，包含 name、department、title、email、hiredAt 欄位。提交時 SHALL 呼叫 `POST /api/employees`。

#### Scenario: 成功新增
- **WHEN** admin 填妥所有欄位後送出
- **THEN** 系統呼叫 `POST /api/employees` 並收到 201
- **AND** 對話框關閉
- **AND** 列表多出一筆新員工資料
- **AND** 顯示成功 toast「新增成功」

#### Scenario: Email 格式錯誤
- **WHEN** 使用者填入不符合 email 格式的字串
- **THEN** 表單顯示「請輸入有效的 Email」
- **AND** 不送出 API

#### Scenario: 必填欄位空白
- **WHEN** 任一必填欄位為空
- **THEN** 對應欄位顯示錯誤訊息
- **AND** 表單不送出

### Requirement: 編輯員工（僅 admin）
系統 SHALL 提供編輯功能，點擊「編輯」按鈕後 SHALL 開啟對話框並預填資料。提交時 SHALL 呼叫 `PUT /api/employees/:id`。

#### Scenario: 成功編輯
- **WHEN** admin 修改某員工的 department 並送出
- **THEN** 系統呼叫 `PUT /api/employees/:id`
- **AND** 列表對應 row 更新
- **AND** 顯示成功 toast「更新成功」

### Requirement: 刪除員工（僅 admin）
系統 SHALL 提供刪除功能，點擊「刪除」按鈕後 SHALL 顯示確認對話框，確認後 SHALL 呼叫 `DELETE /api/employees/:id`。

#### Scenario: 確認刪除
- **WHEN** admin 在確認對話框點擊「確定刪除」
- **THEN** 系統呼叫 `DELETE /api/employees/:id`
- **AND** 列表移除該筆資料
- **AND** 顯示成功 toast「刪除成功」

#### Scenario: 員工已被車輛指派
- **WHEN** 欲刪除的員工是某台車輛的 `assignedTo`
- **THEN** 系統顯示警告訊息「此員工目前已指派車輛，仍要刪除？」
- **AND** 使用者確認後仍可刪除（MVP 不強制 FK 約束，刪除後 vehicle.assignedTo 變為 null）

### Requirement: 員工 CRUD 觸發操作紀錄
系統 SHALL 在「成功」完成新增、編輯、刪除員工時於後端寫入一筆 activity log（action 分別為 `employee.created`、`employee.updated`、`employee.deleted`）。`targetLabel` SHALL 為該員工當下的姓名（name）。當操作失敗（Email 格式錯誤、必填欄位驗證未過、id 不存在而 404）時 SHALL **不** 寫入紀錄。

紀錄寫入 SHALL 對使用者透明 — 不額外彈出 toast、不改變既有 UI 行為，僅在 admin 進入 `/activity-logs` 時可見。員工刪除 cascade 解除車輛指派時，額外的 `vehicle.unassigned` 紀錄行為定義於 `vehicle-management` 與 `mock-api` spec。

#### Scenario: 新增員工成功觸發紀錄
- **WHEN** admin 成功新增員工「林小華」
- **THEN** 既有 UI 行為（toast「新增成功」、列表更新、對話框關閉）不變
- **AND** 後端多一筆 `employee.created` activity log，targetLabel=`林小華`

#### Scenario: 編輯員工成功觸發紀錄
- **WHEN** admin 成功修改某員工的 department
- **THEN** 後端多一筆 `employee.updated` activity log

#### Scenario: 刪除員工成功觸發紀錄
- **WHEN** admin 於確認對話框點擊「確定刪除」並成功
- **THEN** 後端多一筆 `employee.deleted` activity log
- **AND** 若該員工原本被任一車輛指派，亦額外觸發 `vehicle.unassigned` 紀錄（詳見 vehicle-management spec）

#### Scenario: Email 格式錯誤不觸發紀錄
- **WHEN** 提交時 email 格式錯誤而表單驗證未過
- **THEN** 不發出 API 請求
- **AND** 後端 activity log 數量不變

