## ADDED Requirements

### Requirement: 首頁儀表板版面
系統 SHALL 在使用者登入後，於 `/`（首頁）顯示儀表板，分為上方 KPI 區與下方圖表區。所有登入使用者（不分角色）皆可存取本頁。

#### Scenario: 登入後進入首頁
- **WHEN** 使用者登入成功
- **THEN** 系統導向 `/` 並渲染儀表板
- **AND** 上方顯示 KPI 卡片區
- **AND** 下方顯示圖表區

### Requirement: KPI 卡片
系統 SHALL 在 KPI 區顯示至少 4 張資料卡片：
1. 車輛總數
2. 可用車輛數 (status=available)
3. 員工總數
4. 本月車輛使用率 (近 30 天 in_use 車輛數 / 車輛總數，百分比)

每張卡片 SHALL 顯示一個 icon、標題與數值。資料 SHALL 透過 `GET /api/dashboard/summary` 取得。

#### Scenario: KPI 載入成功
- **WHEN** 使用者進入儀表板
- **THEN** 系統呼叫 `GET /api/dashboard/summary`
- **AND** 4 張卡片依序顯示對應數值
- **AND** 數值以千分位格式化（百分比加上 `%` 符號）

#### Scenario: KPI 載入中
- **WHEN** API 尚未回應
- **THEN** 卡片顯示 skeleton 佔位

### Requirement: 圖表區
系統 SHALL 在圖表區顯示至少 1 張圖表：「車輛狀態分佈」（圓餅圖或長條圖，呈現 available / in_use / maintenance 三種狀態的車輛數量）。圖表資料 SHALL 由 `GET /api/dashboard/summary` 一併回傳。

#### Scenario: 圖表正常顯示
- **WHEN** 儀表板資料載入完成
- **THEN** 圖表渲染三種狀態的車輛數
- **AND** 滑鼠 hover 時顯示對應狀態名稱與數值 tooltip

#### Scenario: 圖表資料為空
- **WHEN** 系統內無任何車輛資料
- **THEN** 圖表區顯示「尚無資料」提示訊息

### Requirement: 載入失敗處理
系統 SHALL 在儀表板 API 失敗時顯示錯誤訊息，並提供「重試」按鈕。

#### Scenario: API 失敗
- **WHEN** `GET /api/dashboard/summary` 回傳非 2xx
- **THEN** 儀表板顯示錯誤訊息「資料載入失敗」
- **AND** 顯示「重試」按鈕，點擊後重新呼叫 API
