## ADDED Requirements

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
