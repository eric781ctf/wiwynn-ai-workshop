## Why

目前缺少一個集中化的車輛與員工資料管理系統，導致車輛調度、人員權限與營運數據檢視仰賴零散的試算表，缺乏角色分權與即時的營運可視化。本次以最小可行性方案 (MVP) 建立純前端原型，讓利害關係人快速驗證流程、UI 與權限模型，後續再接真實後端。

## What Changes

- 新增 React + Vite + TypeScript 前端骨架，整合 shadcn/ui 元件庫。
- 新增 MSW (Mock Service Worker) 攔截 REST API，提供本地假資料以模擬後端。
- 新增登入頁：以帳號密碼驗證並區分 `admin` / `user` 兩種角色，登入狀態與角色保存於前端 (localStorage)。
- 新增首頁儀表板：上方 KPI 卡片 (車輛總數、可用車輛、員工總數、本月使用率)，下方 1-2 張圖表 (車輛狀態分佈、近期使用趨勢)。
- 新增車輛管理頁：列表 + 新增 / 編輯 / 刪除 (CRUD)，所有登入使用者皆可存取。
- 新增員工管理頁：列表 + 新增 / 編輯 / 刪除 (CRUD)，**僅 `admin` 角色** 可存取，`user` 角色嘗試進入時導回首頁。
- 新增基於角色的路由守衛 (Route Guard)，未登入導向 `/login`，無權限導向 `/`。

## Capabilities

### New Capabilities
- `auth`: 帳號密碼登入、登出、角色判斷 (admin/user)、登入狀態持久化、路由守衛。
- `dashboard`: 首頁儀表板，呈現 KPI 卡片與營運圖表。
- `vehicle-management`: 車輛資料 CRUD 與列表檢視 (所有登入使用者)。
- `employee-management`: 員工資料 CRUD 與列表檢視 (僅 admin)。
- `mock-api`: 透過 MSW 攔截前端發出的 REST 請求，回傳假資料以模擬後端 (登入、車輛、員工、儀表板統計)。

### Modified Capabilities
<!-- 無，本次為全新專案 -->

## Impact

- **新增程式碼**：`src/` 下的 pages / components / routes / api / mocks / store。
- **新增依賴**：`react`, `react-dom`, `react-router-dom`, `typescript`, `vite`, `tailwindcss`, `shadcn-ui` 相關套件 (radix-ui, class-variance-authority, clsx, tailwind-merge, lucide-react)、`msw`、`recharts` (或 shadcn chart)、`zod` (表單驗證, 可選)、`react-hook-form` (可選)。
- **不影響後端**：MVP 階段不接真實 API，所有請求由 MSW 攔截。
- **建構與部署**：採 Vite dev server；MSW 透過 `public/mockServiceWorker.js` 啟用。
- **後續銜接點**：未來移除 MSW 並換成真實 API base URL 即可，呼叫端 (api 層) 介面不變。
