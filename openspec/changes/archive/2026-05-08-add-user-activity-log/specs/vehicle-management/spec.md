## ADDED Requirements

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
