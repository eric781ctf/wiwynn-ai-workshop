## ADDED Requirements

### Requirement: 帳號密碼登入
系統 SHALL 提供登入頁，使用者輸入正確的帳號與密碼後，成功登入並導向首頁儀表板。系統 SHALL 將取得的 token 與使用者資料 (含 `role`) 持久化保存於瀏覽器，使重新整理頁面後仍維持登入狀態。

#### Scenario: 管理者帳號登入成功
- **WHEN** 使用者在登入頁輸入 `username=admin`、`password=admin123` 並提交
- **THEN** 系統呼叫 `POST /api/auth/login` 並收到帶 `role=admin` 的回應
- **AND** 系統將 token 與使用者資料寫入 localStorage
- **AND** 系統導向 `/`（首頁儀表板）
- **AND** 側邊欄顯示「員工管理」入口

#### Scenario: 一般使用者登入成功
- **WHEN** 使用者輸入 `username=user`、`password=user123` 並提交
- **THEN** 系統登入成功並導向 `/`
- **AND** 側邊欄 **不** 顯示「員工管理」入口

#### Scenario: 帳號或密碼錯誤
- **WHEN** 使用者輸入錯誤的帳號或密碼
- **THEN** 系統顯示錯誤訊息「帳號或密碼錯誤」
- **AND** 不寫入 localStorage、不導向其他頁

#### Scenario: 必填欄位空白
- **WHEN** 使用者未填帳號或密碼即按下登入
- **THEN** 表單顯示欄位驗證錯誤
- **AND** 不送出 API 請求

### Requirement: 登出
系統 SHALL 提供登出操作，登出後清除 localStorage 中的 token 與使用者資料，並將使用者導回登入頁。

#### Scenario: 已登入使用者點擊登出
- **WHEN** 使用者點擊側邊欄/Topbar 的「登出」按鈕
- **THEN** 系統清除 localStorage 中的 `token` 與 `user`
- **AND** 系統導向 `/login`

### Requirement: 路由守衛 — 必須登入
系統 SHALL 對所有非 `/login` 的路由強制要求登入。未登入使用者存取受保護路由時，SHALL 被導向 `/login`。

#### Scenario: 未登入存取首頁
- **WHEN** 未登入使用者於網址列輸入 `/` 或 `/vehicles`
- **THEN** 系統導向 `/login`

#### Scenario: 已登入存取登入頁
- **WHEN** 已登入使用者存取 `/login`
- **THEN** 系統導向 `/`（避免重複登入）

### Requirement: 路由守衛 — 角色權限
系統 SHALL 限制 `/employees` 路由僅 `role=admin` 的使用者可存取。`role=user` 嘗試存取時，SHALL 被導向 `/`。

#### Scenario: 一般使用者嘗試進入員工管理
- **WHEN** 已登入但 `role=user` 的使用者於網址列輸入 `/employees`
- **THEN** 系統導向 `/`
- **AND** 側邊欄不顯示「員工管理」連結

#### Scenario: 管理者進入員工管理
- **WHEN** 已登入且 `role=admin` 的使用者點擊「員工管理」
- **THEN** 系統渲染員工管理頁

### Requirement: 登入狀態還原
應用啟動時，系統 SHALL 嘗試從 localStorage 還原使用者登入狀態。在還原完成前，SHALL 顯示 loading 畫面，避免短暫閃過登入頁。

#### Scenario: 重新整理已登入的頁面
- **WHEN** 已登入的使用者按 F5 重新整理 `/vehicles`
- **THEN** 系統先顯示 loading
- **AND** 還原成功後維持在 `/vehicles`，不會跳到 `/login`
