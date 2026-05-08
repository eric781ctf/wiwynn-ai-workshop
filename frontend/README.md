# 車輛管理系統 — MVP

純前端的 MVP，提供登入、儀表板、車輛 CRUD、員工 CRUD（僅管理者）等功能。後端 API 由 [MSW](https://mswjs.io) 在瀏覽器層攔截，模擬真實 REST 行為。

## 技術棧

- React 19 + TypeScript + Vite
- Tailwind CSS + shadcn/ui 風格元件（Radix UI primitives）
- React Router v7 + 角色路由守衛（RequireAuth / RequireRole）
- React Hook Form + Zod 表單驗證
- Recharts 圖表
- Sonner toast 通知
- MSW v2 模擬後端 API（資料以 in-memory + localStorage 持久化）

## 執行步驟

```bash
cd frontend
npm install        # 第一次需要
npm run dev        # 啟動 dev server（自動啟用 MSW）
```

開啟瀏覽器到 dev server 顯示的網址（預設 `http://localhost:5173`）。

## 預設帳號

| 角色 | 帳號 | 密碼 |
|------|------|------|
| 管理者 | `admin` | `admin123` |
| 一般使用者 | `user` | `user123` |

- 管理者可看到「員工管理」入口；一般使用者沒有此入口，且直接輸入 `/employees` 也會被導回首頁。
- 兩種角色都可使用「車輛管理」與「儀表板」。

## 專案結構

```
src/
  main.tsx                # 啟動 MSW (僅 dev) 後 mount React
  App.tsx                 # AuthProvider + RouterProvider + Toaster
  routes/router.tsx       # 路由樹與守衛掛載
  pages/                  # LoginPage / DashboardPage / VehiclesPage / EmployeesPage / NotFoundPage
  components/
    ui/                   # shadcn 風格元件（Button、Input、Dialog、Table…）
    layout/AppShell.tsx   # 側邊欄 + Topbar + <Outlet />
    common/ConfirmDialog.tsx
    dashboard/            # KpiCard、VehicleStatusChart
  features/
    auth/                 # AuthContext、guards、api
    vehicles/             # api、types、VehicleForm
    employees/            # api、types、EmployeeForm
    dashboard/            # summary api
  lib/
    api-client.ts         # fetch wrapper（自動帶 Bearer token、ApiError）
    utils.ts              # cn helper
  mocks/
    db.ts                 # mock 資料 + localStorage 持久化
    handlers.ts           # 所有 REST 端點實作
    browser.ts            # setupWorker
public/
  mockServiceWorker.js    # MSW 安裝的 service worker（必要）
```

## MSW 注意事項

- **僅在 dev 啟動**：`main.tsx` 透過 `import.meta.env.DEV` 動態 import 並 `worker.start(...)`。Production build (`npm run build`) 不會執行這段程式碼，所有 `setupWorker` 引用都會被 tree-shake 掉。
- **`public/mockServiceWorker.js` 是 MSW 必需的 service worker stub**。若刪除或路徑改變需重新執行 `npx msw init public --save`。
- **資料持久化**：所有寫入都會同步寫進瀏覽器 `localStorage` (`vms.mock-db.v1`)。重整頁面資料仍在；若要重設資料，於 DevTools console 執行 `localStorage.removeItem('vms.mock-db.v1')` 後重整。
- **登入 token**：登入成功後 `vms.token`、`vms.user` 被寫入 localStorage。MVP 中後端不驗證 token；切換到真後端時請改成 JWT 流程。

## 主要 API（皆由 MSW 攔截）

| Method | Path | 說明 |
|--------|------|------|
| POST | `/api/auth/login` | 登入，回傳 `{ token, user }` 或 401 |
| POST | `/api/auth/logout` | 登出 (204) |
| GET | `/api/vehicles` | 取得所有車輛 |
| POST | `/api/vehicles` | 新增車輛（plateNo 重複回 400） |
| PUT | `/api/vehicles/:id` | 更新車輛 |
| DELETE | `/api/vehicles/:id` | 刪除車輛 |
| GET | `/api/employees` | 取得所有員工 |
| POST | `/api/employees` | 新增員工 |
| PUT | `/api/employees/:id` | 更新員工 |
| DELETE | `/api/employees/:id` | 刪除員工（並把相關 vehicle.assignedTo 設為 null） |
| GET | `/api/dashboard/summary` | 儀表板 KPI 與車輛狀態分佈 |

## 切換到真後端

1. `lib/api-client.ts` 將 base URL 改為真實後端網址（或維持 `/api/*` + Vite proxy）。
2. 移除 `main.tsx` 中的 `enableMocking()`。
3. 刪除 `src/mocks/` 與 `public/mockServiceWorker.js`。
4. 確認後端 API 介面與 mock 對齊（路徑、HTTP method、payload 結構）。

## 已知限制（MVP 範圍）

- 不做分頁、搜尋、排序
- 沒有 JWT / refresh token，假 token 可被任意竄改
- 沒有單元測試（只做手動 smoke test）
- 沒有深色模式、多語系、無障礙完整稽核
