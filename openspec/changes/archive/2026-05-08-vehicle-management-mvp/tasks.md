## 1. 專案骨架與依賴

- [x] 1.1 建立 Vite + React + TypeScript 專案骨架（`npm create vite@latest` 選 react-ts），放在 repo 既定位置
- [x] 1.2 安裝 Tailwind CSS 3 並完成 `tailwind.config.js`、`postcss.config.js`、`index.css` 的 `@tailwind` 指令設定
- [x] 1.3 初始化 shadcn/ui (`npx shadcn@latest init`)，選 New York style + Slate 主題
- [x] 1.4 安裝核心依賴：`react-router-dom`、`react-hook-form`、`zod`、`@hookform/resolvers`、`recharts`、`lucide-react`
- [x] 1.5 安裝 dev 依賴：`msw`，並執行 `npx msw init public/ --save` 產生 service worker
- [x] 1.6 在 `package.json` 加上 scripts：`dev`、`build`、`preview`、`lint`，確認專案根目錄 ESLint 設定有覆蓋到 `src/`

## 2. shadcn 元件安裝

- [x] 2.1 安裝會用到的 shadcn 元件：`button`、`input`、`label`、`form`、`card`、`table`、`dialog`、`alert-dialog`、`toast`（或 `sonner`）、`select`、`badge`、`skeleton`、`dropdown-menu`、`avatar`、`chart`
- [x] 2.2 在 `src/main.tsx` 掛載 `<Toaster />`（或 `<Sonner />`）

## 3. Mock 資料層 (MSW)

- [x] 3.1 建立 `src/mocks/db.ts`：定義 `User`、`Vehicle`、`Employee` 型別與 in-memory 結構，提供 seed 函式（≥5 台車輛 / ≥5 位員工 / 2 位 mock user）
- [x] 3.2 db.ts 加入 localStorage 持久化：初始化時若 localStorage 有資料則載入，否則寫入 seed；提供 `persist()` helper
- [x] 3.3 建立 `src/mocks/handlers.ts`，實作 `POST /api/auth/login`、`POST /api/auth/logout`
- [x] 3.4 handlers.ts 實作車輛 CRUD：`GET/POST/PUT/DELETE /api/vehicles[/:id]`，包含 plateNo 重複檢查與 404 行為
- [x] 3.5 handlers.ts 實作員工 CRUD：`GET/POST/PUT/DELETE /api/employees[/:id]`，刪除員工時把相關 `vehicle.assignedTo` 設為 null
- [x] 3.6 handlers.ts 實作 `GET /api/dashboard/summary`，依當前 db 即時計算統計
- [x] 3.7 建立 `src/mocks/browser.ts` (`setupWorker(...handlers)`)，並在 `src/main.tsx` 內 `if (import.meta.env.DEV)` 呼叫 `worker.start({ onUnhandledRequest: 'bypass' })`，確保 production build 不啟動

## 4. API client 與 features 接口

- [x] 4.1 建立 `src/lib/api-client.ts`：包一個 fetch wrapper，自動帶 `Authorization: Bearer <token>`、處理 JSON、拋出 `ApiError`
- [x] 4.2 建立 `src/features/auth/api.ts`：`login(username, password)`、`logout()`
- [x] 4.3 建立 `src/features/vehicles/api.ts` 與 `types.ts`：`listVehicles`、`createVehicle`、`updateVehicle`、`deleteVehicle`
- [x] 4.4 建立 `src/features/employees/api.ts` 與 `types.ts`：員工 CRUD 函式
- [x] 4.5 建立 `src/features/dashboard/api.ts`：`getSummary()`

## 5. Auth 與路由守衛

- [x] 5.1 建立 `src/features/auth/AuthContext.tsx`：context + provider，內含 `user, token, login, logout, isReady`，於 mount 時從 localStorage 還原
- [x] 5.2 建立 `useAuth` hook
- [x] 5.3 建立 `<RequireAuth>` 元件：未登入導向 `/login`；尚未 ready 顯示 loading
- [x] 5.4 建立 `<RequireRole role="admin">` 元件：role 不符導向 `/`
- [x] 5.5 建立 `src/routes/router.tsx`：定義路由樹（`/login`、`/`、`/vehicles`、`/employees`、`*`）並掛上對應守衛
- [x] 5.6 在 `App.tsx` 包 `<AuthProvider>` 與 `<RouterProvider>`

## 6. Layout 與共用元件

- [x] 6.1 建立 `src/components/layout/AppShell.tsx`：左側 Sidebar + 上方 Topbar + `<Outlet />`
- [x] 6.2 Sidebar 顯示「儀表板」、「車輛管理」連結；當 `role=admin` 時額外顯示「員工管理」
- [x] 6.3 Topbar 顯示目前使用者名稱與登出按鈕
- [x] 6.4 建立 `src/components/common/ConfirmDialog.tsx`：以 shadcn `<AlertDialog>` 包裝，供刪除確認重用

## 7. 登入頁

- [x] 7.1 建立 `src/pages/LoginPage.tsx`：置中卡片 + Logo + 表單 (username, password)
- [x] 7.2 用 react-hook-form + zod 做欄位驗證（必填）
- [x] 7.3 提交時呼叫 `auth.login()`，成功則 `navigate('/')`，失敗顯示錯誤訊息（toast 或表單下方提示）
- [x] 7.4 已登入時進入 `/login` 自動導向 `/`

## 8. 儀表板頁

- [x] 8.1 建立 `src/pages/DashboardPage.tsx`：mount 時呼叫 `dashboard.getSummary()`
- [x] 8.2 建立 `KpiCard` 元件（icon + 標題 + 數值），並渲染 4 張 KPI 卡片於 grid（手機 1 欄、桌機 4 欄）
- [x] 8.3 載入中顯示 `<Skeleton />` 佔位
- [x] 8.4 建立 `VehicleStatusChart`：使用 shadcn `<ChartContainer>` + Recharts `PieChart`，顯示車輛狀態分佈
- [x] 8.5 圖表為空資料時顯示「尚無資料」
- [x] 8.6 載入失敗時顯示錯誤訊息與「重試」按鈕

## 9. 車輛管理頁

- [x] 9.1 建立 `src/pages/VehiclesPage.tsx`：頁首標題 + 「新增車輛」按鈕 + 表格
- [x] 9.2 表格使用 shadcn `<Table>`，顯示 plateNo、brand、model、year、status (badge) 與操作欄
- [x] 9.3 建立 `VehicleForm.tsx`（共用於新增與編輯，使用 dialog + react-hook-form + zod）
- [x] 9.4 新增流程：點擊「新增」開 dialog，提交後呼叫 `createVehicle`，成功 toast + 重抓列表
- [x] 9.5 編輯流程：點擊 row 上的「編輯」，dialog 預填資料，提交呼叫 `updateVehicle`
- [x] 9.6 刪除流程：點擊 row 上的「刪除」，使用 `ConfirmDialog` 確認後呼叫 `deleteVehicle`
- [x] 9.7 無資料時表格顯示「尚無車輛資料」

## 10. 員工管理頁

- [x] 10.1 建立 `src/pages/EmployeesPage.tsx`，並在 router 中以 `<RequireRole role="admin">` 包覆
- [x] 10.2 表格顯示 name、department、title、email、hiredAt 與操作欄
- [x] 10.3 建立 `EmployeeForm.tsx`：欄位含 email 格式驗證、必填驗證
- [x] 10.4 新增 / 編輯 / 刪除流程（同車輛頁模式，重用 `ConfirmDialog`）
- [x] 10.5 刪除員工若仍被指派 vehicle，於確認對話框文案中提示「此員工目前已指派車輛」

## 11. 收尾與驗證

- [x] 11.1 在 `README.md` 補上：執行步驟、預設帳號密碼 (admin/admin123、user/user123)、技術棧說明、MSW 注意事項
- [x] 11.2 手動 smoke test 走完所有 spec scenario：登入（成功/失敗）、登出、路由守衛 (auth + role)、儀表板載入、車輛 CRUD、員工 CRUD、刪除確認對話框
- [x] 11.3 跑 `npm run lint` 與 `npm run build`，確認無錯誤
- [x] 11.4 確認 `npm run build` 後 dist 內 **不** 包含 MSW 啟動程式（grep `mockServiceWorker` 應只在 public 中）
