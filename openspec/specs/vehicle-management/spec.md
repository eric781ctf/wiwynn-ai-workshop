# vehicle-management Specification

## Purpose

定義車輛資料的管理能力，包含列表檢視、新增、編輯、刪除等 CRUD 操作。本能力開放給所有登入使用者（admin / user），並涵蓋車牌重複驗證、必填欄位驗證、刪除確認等行為。
## Requirements
### Requirement: 車輛列表檢視
系統 SHALL 在 `/vehicles` 路由提供車輛資料列表，所有登入使用者（admin / user）皆可存取。列表 SHALL 顯示以下欄位：車牌號碼 (plateNo)、廠牌 (brand)、車型 (model)、年份 (year)、狀態 (status)、操作 (編輯 / 刪除)。

#### Scenario: 進入車輛管理頁
- **WHEN** 已登入使用者點擊側邊欄「車輛管理」
- **THEN** 系統呼叫 `GET /api/vehicles`
- **AND** 以表格顯示所有車輛
- **AND** 表格上方提供「新增車輛」按鈕

#### Scenario: 一般使用者也能存取
- **WHEN** `role=user` 的使用者進入 `/vehicles`
- **THEN** 頁面正常渲染（不被路由守衛擋下）

#### Scenario: 列表為空
- **WHEN** 系統內無任何車輛資料
- **THEN** 表格顯示「尚無車輛資料」提示

### Requirement: 新增車輛
系統 SHALL 提供「新增車輛」對話框 (Dialog)，包含 plateNo、brand、model、year、status 欄位。提交後 SHALL 呼叫 `POST /api/vehicles` 建立資料，成功後關閉對話框並刷新列表。

#### Scenario: 成功新增
- **WHEN** 使用者點擊「新增車輛」並填妥所有欄位後送出
- **THEN** 系統呼叫 `POST /api/vehicles` 並收到 201
- **AND** 對話框關閉
- **AND** 列表多出一筆新資料
- **AND** 顯示成功 toast「新增成功」

#### Scenario: 必填欄位驗證
- **WHEN** plateNo / brand / model / year / status 任一為空
- **THEN** 對應欄位顯示錯誤訊息
- **AND** 表單不送出

#### Scenario: 車牌號碼重複
- **WHEN** 提交的 plateNo 與既有車輛重複
- **THEN** 系統收到 400 並顯示錯誤訊息「車牌號碼已存在」

### Requirement: 編輯車輛
系統 SHALL 提供編輯功能，點擊列表中的「編輯」按鈕開啟對話框並預填現有資料。提交時 SHALL 呼叫 `PUT /api/vehicles/:id`。

#### Scenario: 成功編輯
- **WHEN** 使用者修改某筆車輛的 status 為 `maintenance` 並送出
- **THEN** 系統呼叫 `PUT /api/vehicles/:id`
- **AND** 列表上對應 row 的 status 欄位更新
- **AND** 顯示成功 toast「更新成功」

### Requirement: 刪除車輛
系統 SHALL 提供刪除功能，點擊「刪除」按鈕後 SHALL 顯示確認對話框，使用者確認後才呼叫 `DELETE /api/vehicles/:id`。

#### Scenario: 確認刪除
- **WHEN** 使用者於確認對話框點擊「確定刪除」
- **THEN** 系統呼叫 `DELETE /api/vehicles/:id`
- **AND** 列表移除該筆資料
- **AND** 顯示成功 toast「刪除成功」

#### Scenario: 取消刪除
- **WHEN** 使用者點擊確認對話框的「取消」
- **THEN** 對話框關閉
- **AND** 不發出 DELETE 請求
- **AND** 列表資料不變

### Requirement: 車輛 CRUD 觸發操作紀錄
系統 SHALL 在「成功」完成新增、編輯、刪除車輛時於後端寫入一筆 activity log（action 分別為 `vehicle.created`、`vehicle.updated`、`vehicle.deleted`）。`targetLabel` SHALL 為該車輛當下的車牌號碼（plateNo）。當操作失敗（必填驗證未過、車牌重複而 400、id 不存在而 404）時 SHALL **不** 寫入紀錄。

紀錄寫入 SHALL 對使用者透明 — 不額外彈出 toast、不改變既有 UI 行為，僅在 admin 進入 `/activity-logs` 時可見。

#### Scenario: 新增車輛成功觸發紀錄
- **WHEN** 使用者成功新增 plateNo=`XYZ-0001` 的車輛
- **THEN** 既有 UI 行為（toast「新增成功」、列表更新、對話框關閉）不變
- **AND** 後端多一筆 `vehicle.created` activity log，targetLabel=`XYZ-0001`

#### Scenario: 編輯車輛成功觸發紀錄
- **WHEN** 使用者成功將某車輛 status 改為 `maintenance`
- **THEN** 後端多一筆 `vehicle.updated` activity log

#### Scenario: 刪除車輛成功觸發紀錄
- **WHEN** 使用者於確認對話框點擊「確定刪除」並成功
- **THEN** 後端多一筆 `vehicle.deleted` activity log

#### Scenario: 車牌重複不觸發紀錄
- **WHEN** 新增 / 編輯時因車牌重複收到 400
- **THEN** 後端 activity log 數量不變

### Requirement: 員工刪除 cascade 觸發車輛 unassign 紀錄
當員工被刪除導致某些車輛的 `assignedTo` 被清空時，系統 SHALL 對每台被解除指派的車輛額外寫入一筆 action=`vehicle.unassigned` 的 activity log，summary 註明「因員工刪除而解除指派」。本紀錄與該次 `employee.deleted` 紀錄 SHALL 共用同一 actor。

#### Scenario: 刪除員工解除多台車輛指派
- **WHEN** admin 刪除某員工，原本有 v1、v2 兩台車指派給該員工
- **THEN** 後端產生 1 筆 `employee.deleted` 與 2 筆 `vehicle.unassigned` 紀錄
- **AND** 兩筆 `vehicle.unassigned` 的 targetLabel 分別為 v1、v2 的車牌
- **AND** 三筆紀錄的 actorId 相同

