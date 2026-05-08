## ADDED Requirements

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
