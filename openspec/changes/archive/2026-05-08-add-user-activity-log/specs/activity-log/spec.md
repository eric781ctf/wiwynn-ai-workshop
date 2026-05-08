## ADDED Requirements

### Requirement: Activity log 資料模型
系統 SHALL 將每筆操作紀錄存為不可變（append-only）的 `ActivityLog` 結構，欄位包含：`id`、`timestamp` (ISO 8601)、`actorId`、`actorName`（寫入時 snapshot）、`action`、`resource`、`targetId`、`targetLabel`（寫入時 snapshot）、`summary`（zh-TW 可讀描述）。系統 SHALL **不** 提供修改或刪除既有紀錄的 API。

`action` 取值集合 SHALL 為：`auth.login`、`auth.logout`、`vehicle.created`、`vehicle.updated`、`vehicle.deleted`、`vehicle.unassigned`、`employee.created`、`employee.updated`、`employee.deleted`。

`resource` 取值集合 SHALL 為：`auth`、`vehicle`、`employee`。

#### Scenario: 紀錄 snapshot 不受後續資料變更影響
- **WHEN** 系統寫入一筆 `employee.updated` 紀錄，當下 `actorName` 為「管理員」、`targetLabel` 為「王小明」
- **AND** 之後該管理員或員工被改名或被刪除
- **THEN** 該筆 activity log 的 `actorName` 與 `targetLabel` 仍維持寫入當下的值

#### Scenario: 紀錄不可被修改或刪除
- **WHEN** 任何前端程式或 API 嘗試對既有 activity log 進行更新或刪除
- **THEN** 系統 **不** 提供對應端點，操作不可能成功

### Requirement: 操作紀錄頁面（僅 admin）
系統 SHALL 在 `/activity-logs` 路由提供操作紀錄查詢頁，**僅 `role=admin` 可存取**。頁面 SHALL 以表格顯示欄位：時間 (timestamp)、操作者 (actorName)、動作 (action)、目標資源 (resource)、目標名稱 (targetLabel)、摘要 (summary)。表格 SHALL 依 timestamp 由新到舊排序。

#### Scenario: 管理者進入操作紀錄頁
- **WHEN** `role=admin` 點擊側邊欄「操作紀錄」
- **THEN** 系統呼叫 `GET /api/activity-logs?page=1&pageSize=20`
- **AND** 以表格顯示第一頁紀錄，依 timestamp desc 排序
- **AND** 表格上方顯示篩選列（操作者、動作、資源、日期範圍）

#### Scenario: 一般使用者被拒絕存取
- **WHEN** `role=user` 於網址列輸入 `/activity-logs`
- **THEN** 系統導向 `/`（首頁）
- **AND** **不** 呼叫 `GET /api/activity-logs`

#### Scenario: 紀錄為空
- **WHEN** 系統中尚無任何 activity log
- **THEN** 表格顯示「尚無操作紀錄」提示

### Requirement: 操作紀錄篩選
系統 SHALL 在紀錄頁提供下列篩選條件，並將條件轉為查詢字串送至 `GET /api/activity-logs`：
- 操作者 (`actorId`)：下拉選單，選項為目前 mock users。
- 動作 (`action`)：下拉選單，選項為前述 9 種 action 值。
- 資源 (`resource`)：下拉選單，選項為 `auth` / `vehicle` / `employee`。
- 日期範圍 (`from`、`to`)：兩個日期輸入框，格式 `YYYY-MM-DD`。

任何篩選條件變更時，SHALL 重置分頁為第 1 頁並重新呼叫 API。

#### Scenario: 套用單一篩選
- **WHEN** admin 在動作下拉選單選擇 `vehicle.deleted`
- **THEN** 系統呼叫 `GET /api/activity-logs?action=vehicle.deleted&page=1&pageSize=20`
- **AND** 表格僅顯示符合條件的紀錄

#### Scenario: 套用日期範圍
- **WHEN** admin 設定 from=`2026-05-01` 與 to=`2026-05-08`
- **THEN** 系統呼叫的 query string 包含 `from=2026-05-01&to=2026-05-08`
- **AND** 表格僅顯示 timestamp 落於該區間（含起訖日整日）的紀錄

#### Scenario: 清除篩選
- **WHEN** admin 將所有篩選欄位清空
- **THEN** 系統呼叫 `GET /api/activity-logs?page=1&pageSize=20`（不帶任何 filter）
- **AND** 表格顯示全部紀錄

### Requirement: 操作紀錄分頁
系統 SHALL 對紀錄列表進行分頁，預設 `pageSize=20`、最大 100。頁面下方 SHALL 顯示分頁器（第幾頁 / 共幾頁、上一頁、下一頁）。

#### Scenario: 切換下一頁
- **WHEN** admin 點擊「下一頁」
- **THEN** 系統呼叫 `GET /api/activity-logs?page=2&pageSize=20`
- **AND** 表格顯示第 2 頁的 20 筆紀錄

#### Scenario: 已在最後一頁
- **WHEN** 當前為最後一頁
- **THEN** 「下一頁」按鈕為 disabled

### Requirement: 紀錄筆數上限
系統 SHALL 對 mock 端的 activity log 設置筆數上限 1000 筆。當寫入新紀錄使總數超過上限時，SHALL 由最舊的紀錄起裁切，保持總數 ≤ 1000。

#### Scenario: 超出上限自動裁切
- **WHEN** 系統已有 1000 筆紀錄並寫入新一筆
- **THEN** 最舊的一筆被移除
- **AND** 總筆數仍為 1000
