## ADDED Requirements

### Requirement: 登入 / 登出觸發操作紀錄
系統 SHALL 在登入成功與登出時於後端寫入一筆 activity log（action 分別為 `auth.login`、`auth.logout`），actor 為該登入 / 登出的使用者。登入失敗（帳密錯誤、欄位驗證未過）時 SHALL **不** 觸發紀錄。

#### Scenario: 登入成功觸發紀錄
- **WHEN** 使用者輸入正確帳密並登入成功
- **THEN** 後端產生一筆 `auth.login` activity log，actorId 為該使用者
- **AND** 之後 admin 進入 `/activity-logs` 可看到該筆紀錄

#### Scenario: 登入失敗不觸發紀錄
- **WHEN** 使用者輸入錯誤帳密並收到 401
- **THEN** 後端 activity log 數量不變

#### Scenario: 登出觸發紀錄
- **WHEN** 已登入使用者點擊「登出」
- **THEN** 系統先呼叫 `POST /api/auth/logout`（token 此時仍有效）
- **AND** 後端產生一筆 `auth.logout` activity log
- **AND** 系統清除 localStorage 中 token 並導向 `/login`

## MODIFIED Requirements

### Requirement: 路由守衛 — 角色權限
系統 SHALL 限制 `/employees` 與 `/activity-logs` 兩個路由僅 `role=admin` 的使用者可存取。`role=user` 嘗試存取任一者時，SHALL 被導向 `/`。側邊欄 SHALL 在 `role=user` 時隱藏「員工管理」與「操作紀錄」兩個入口。

#### Scenario: 一般使用者嘗試進入員工管理
- **WHEN** 已登入但 `role=user` 的使用者於網址列輸入 `/employees`
- **THEN** 系統導向 `/`
- **AND** 側邊欄不顯示「員工管理」連結

#### Scenario: 一般使用者嘗試進入操作紀錄
- **WHEN** 已登入但 `role=user` 的使用者於網址列輸入 `/activity-logs`
- **THEN** 系統導向 `/`
- **AND** 側邊欄不顯示「操作紀錄」連結

#### Scenario: 管理者進入員工管理
- **WHEN** 已登入且 `role=admin` 的使用者點擊「員工管理」
- **THEN** 系統渲染員工管理頁

#### Scenario: 管理者進入操作紀錄
- **WHEN** 已登入且 `role=admin` 的使用者點擊「操作紀錄」
- **THEN** 系統渲染操作紀錄頁
