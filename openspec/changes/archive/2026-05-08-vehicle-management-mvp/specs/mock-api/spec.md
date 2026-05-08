## ADDED Requirements

### Requirement: MSW 啟動
系統 SHALL 在 development 環境啟動 MSW Service Worker 以攔截前端 fetch 請求。Production build SHALL **不** 啟動 MSW。

#### Scenario: dev server 啟動
- **WHEN** 開發者執行 `npm run dev`
- **THEN** `main.tsx` 偵測 `import.meta.env.DEV === true` 並呼叫 `worker.start()`
- **AND** Console 顯示 MSW ready 訊息
- **AND** 之後所有 `/api/**` 請求皆被 MSW 攔截

#### Scenario: production build
- **WHEN** 執行 `npm run build`
- **THEN** 打包結果不包含 MSW 啟動程式（透過 `import.meta.env.DEV` 檢查 tree-shake）

### Requirement: 認證 API
MSW SHALL 提供以下認證端點：
- `POST /api/auth/login` — 接收 `{ username, password }`，比對寫死 mock users 後回傳 `{ token, user }` 或 401。
- `POST /api/auth/logout` — 回傳 204（前端負責清 localStorage）。

#### Scenario: 登入成功
- **WHEN** 收到 `POST /api/auth/login`，body 為 `{ username: "admin", password: "admin123" }`
- **THEN** 回傳 200 與 `{ token: "fake-jwt-admin", user: { id, username, name, role: "admin" } }`

#### Scenario: 登入失敗
- **WHEN** 收到的帳號密碼組合不在 mock users 清單
- **THEN** 回傳 401 與 `{ message: "帳號或密碼錯誤" }`

### Requirement: 車輛 API
MSW SHALL 提供完整的車輛 RESTful 端點：`GET /api/vehicles`、`POST /api/vehicles`、`PUT /api/vehicles/:id`、`DELETE /api/vehicles/:id`。資料 SHALL 儲存於 in-memory mock DB，並 mirror 至 localStorage 以便重整後保留。

#### Scenario: 取得車輛列表
- **WHEN** `GET /api/vehicles`
- **THEN** 回傳 200 與 `Vehicle[]`（一次回全部，不分頁）

#### Scenario: 建立車輛
- **WHEN** `POST /api/vehicles` body 為合法的 Vehicle (不含 id)
- **THEN** 回傳 201 與新建的 Vehicle (含 server 產生的 id)

#### Scenario: 車牌重複
- **WHEN** `POST /api/vehicles` 的 plateNo 與既有資料重複
- **THEN** 回傳 400 與 `{ message: "車牌號碼已存在" }`

#### Scenario: 更新車輛
- **WHEN** `PUT /api/vehicles/:id` body 為合法欄位
- **THEN** 回傳 200 與更新後的 Vehicle

#### Scenario: 更新不存在的車輛
- **WHEN** `PUT /api/vehicles/:id` 但 id 不存在
- **THEN** 回傳 404

#### Scenario: 刪除車輛
- **WHEN** `DELETE /api/vehicles/:id`
- **THEN** 回傳 204
- **AND** mock DB 中該筆資料被移除

### Requirement: 員工 API
MSW SHALL 提供完整的員工 RESTful 端點：`GET /api/employees`、`POST /api/employees`、`PUT /api/employees/:id`、`DELETE /api/employees/:id`。

#### Scenario: 取得員工列表
- **WHEN** `GET /api/employees`
- **THEN** 回傳 200 與 `Employee[]`

#### Scenario: 建立員工
- **WHEN** `POST /api/employees` body 合法
- **THEN** 回傳 201 與新建的 Employee

#### Scenario: 更新員工
- **WHEN** `PUT /api/employees/:id` body 合法
- **THEN** 回傳 200 與更新後的 Employee

#### Scenario: 刪除員工會清空相關 vehicle.assignedTo
- **WHEN** `DELETE /api/employees/:id`，且某些 vehicle 的 assignedTo === id
- **THEN** 回傳 204
- **AND** 那些 vehicle 的 assignedTo 被設為 null

### Requirement: 儀表板統計 API
MSW SHALL 提供 `GET /api/dashboard/summary`，依當前 mock DB 即時計算統計值。

#### Scenario: 取得儀表板摘要
- **WHEN** `GET /api/dashboard/summary`
- **THEN** 回傳 200 與
  ```json
  {
    "totalVehicles": <number>,
    "availableVehicles": <number>,
    "totalEmployees": <number>,
    "monthlyUsageRate": <number 0-100>,
    "vehicleStatusBreakdown": [
      { "status": "available", "count": <number> },
      { "status": "in_use",    "count": <number> },
      { "status": "maintenance","count": <number> }
    ]
  }
  ```

### Requirement: Mock DB 種子資料
系統 SHALL 在 mock DB 初始化時提供 seed 資料，確保打開 app 即有可演示的內容。

#### Scenario: 初次啟動
- **WHEN** localStorage 中無 mock DB 紀錄
- **THEN** 系統載入預設 seed：至少 5 台車輛（涵蓋三種 status）、至少 5 位員工、寫死的 2 位 mock user (admin / user)
- **AND** 將 seed 寫入 localStorage

#### Scenario: 之後啟動
- **WHEN** localStorage 中已有 mock DB 紀錄
- **THEN** 系統從 localStorage 讀取資料，不覆蓋既有內容
