## Context

本次為一個全新的純前端 MVP 專案，目的在於快速驗證車輛管理系統的核心 UX、權限模型與資料流程。後端尚未存在，因此需要一套穩定且接近真實 REST 行為的 mock 機制。利害關係人 (PM、營運單位) 將透過此 MVP 確認頁面流程後，再決定後端與資料庫設計。

當前環境：
- Repo 為 `wiwynn-ai-workshop`，根目錄已具備 ESLint、Husky 等基礎設定。
- 專案內無既有前端框架，可從零搭建。
- 所有開發於本機 dev server (Vite) 完成，無部署需求。

## Goals / Non-Goals

**Goals:**
- 以最小依賴搭建一個可登入、可瀏覽、可 CRUD 的前端 SPA。
- 路由與 UI 權限以 `role` 欄位驅動，admin / user 行為清楚可見。
- API 呼叫端與「真實後端」對齊：使用 `fetch` + RESTful URL，僅在 dev 啟動時由 MSW 攔截。
- UI 元件全部走 shadcn/ui，避免自刻樣式。
- 資料 schema 簡單但完整 (車輛、員工、使用者) 以支撐儀表板統計。

**Non-Goals:**
- ❌ 真實後端、資料庫、伺服器端驗證。
- ❌ 多語系、深色模式、無障礙完整稽核 (基本可讀即可)。
- ❌ 完整單元測試覆蓋；只做關鍵流程的手動驗證 + 少量 smoke test。
- ❌ JWT / Refresh Token 等真實安全機制 (僅以 localStorage 儲存假 token)。
- ❌ 分頁、搜尋、排序等進階列表功能 (列表先一次回全部資料)。
- ❌ 檔案上傳、匯入匯出、稽核紀錄。

## Decisions

### Decision 1: 技術棧選用 Vite + React + TypeScript + shadcn/ui
- **選擇**：Vite 18 + React 18 + TypeScript 5 + Tailwind CSS 3 + shadcn/ui。
- **理由**：Vite 啟動快、HMR 體驗佳；shadcn/ui 是 copy-in 元件 (非 npm dep)，方便客製且無版本鎖定。
- **替代**：Next.js (overkill，本案無 SSR / API routes 需求)、CRA (已停滯)。

### Decision 2: Mock API 採用 MSW (Service Worker)
- **選擇**：MSW v2，透過 `public/mockServiceWorker.js` 在瀏覽器層攔截 fetch。
- **理由**：與真實後端最接近 (DevTools 可看到 Network)；切換到真後端時程式碼幾乎不動。
- **替代**：`json-server` (需另起 process)、直接在 service 內 `if (mock)` 分支 (耦合過重)。

### Decision 3: 路由與權限 — react-router-dom + Route Guard 元件
- **選擇**：使用 `react-router-dom` v6，定義兩層 guard：`<RequireAuth>` 與 `<RequireRole role="admin">`。
- **理由**：宣告式、易讀；guard 元件化便於重用。
- **替代**：在每個 page 內手動 redirect (重複碼多)、用 loader (v6 data router 對 MVP 過重)。

### Decision 4: 狀態管理 — React Context + useReducer (auth)，TanStack Query 僅在需要時引入
- **選擇**：登入狀態用 `AuthContext` (內含 user, role, login, logout)；列表資料 MVP 階段直接 `useEffect + fetch`，**不引入 TanStack Query**。
- **理由**：MVP 資料量小、互動簡單；引入 react-query 反而增加學習與設定成本。
- **替代**：Redux / Zustand (對此規模 over-engineering)。

### Decision 5: 表單 — react-hook-form + zod (僅登入與 CRUD 表單)
- **選擇**：`react-hook-form` + `zod` resolver，搭配 shadcn `<Form>` 元件。
- **理由**：shadcn 官方表單範例就是這組合，整合最順。
- **替代**：Formik (較肥)、自己 useState (錯誤處理冗長)。

### Decision 6: 圖表 — Recharts (透過 shadcn chart 包裝)
- **選擇**：shadcn 提供的 `chart.tsx` (底層為 Recharts)。
- **理由**：與其他 shadcn 元件視覺一致；Recharts API 簡單。
- **替代**：Chart.js (需額外 wrapper)、Apache ECharts (較重)。

### Decision 7: 假登入機制
- **選擇**：MSW 的 `POST /api/auth/login` 接收 `{ username, password }`，比對寫死的 mock users 清單，回傳 `{ token: "fake-jwt-<role>", user: { id, name, role } }`。前端將 `token` 與 `user` 存進 `localStorage`。後續請求附 `Authorization: Bearer <token>` header (但 MVP 不驗證)。
- **理由**：流程貼近真實 JWT 應用；localStorage 滿足重整保留登入態的需求。
- **替代**：sessionStorage (重開瀏覽器即失效)、cookie (需設 domain，MVP 不必要)。

### Decision 8: Mock 帳號清單 (寫死於 handlers)
| username | password | role  | name      |
|----------|----------|-------|-----------|
| admin    | admin123 | admin | 管理員     |
| user     | user123  | user  | 一般使用者 |

### Decision 9: 資料 Schema (TypeScript types，亦為 mock DB 結構)
- `User`: `{ id, username, password, name, role: 'admin' | 'user' }`
- `Vehicle`: `{ id, plateNo, brand, model, year, status: 'available' | 'in_use' | 'maintenance', assignedTo?: employeeId }`
- `Employee`: `{ id, name, department, title, email, hiredAt: string (ISO date) }`

### Decision 10: 目錄結構
```
src/
  main.tsx
  App.tsx
  routes/                 # router 設定 + guard 元件
  pages/
    LoginPage.tsx
    DashboardPage.tsx
    VehiclesPage.tsx
    EmployeesPage.tsx
    NotFoundPage.tsx
  components/
    ui/                   # shadcn copy-in 元件
    layout/               # AppShell, Sidebar, Topbar
    common/               # DataTable, ConfirmDialog 等
    dashboard/            # KpiCard, VehicleStatusChart 等
  features/
    auth/                 # AuthContext, useAuth, RequireAuth, RequireRole
    vehicles/             # api.ts, types.ts, VehicleForm.tsx
    employees/            # api.ts, types.ts, EmployeeForm.tsx
    dashboard/            # api.ts (彙總統計)
  lib/
    api-client.ts         # fetch wrapper (附 token、處理錯誤)
    utils.ts              # cn 等 shadcn helper
  mocks/
    browser.ts            # setupWorker
    handlers.ts           # 所有 REST handler
    db.ts                 # in-memory mock DB (含 seed)
public/
  mockServiceWorker.js    # `npx msw init public/` 產生
```

## Risks / Trade-offs

- **[MSW worker 在 production build 也會被打包]** → 僅在 `import.meta.env.DEV` 時於 `main.tsx` 啟動 worker；正式環境不註冊。
- **[localStorage 假 token 可被任意竄改]** → MVP 階段接受此風險；於 README 註明此為 demo，非生產安全。
- **[mock DB 為 in-memory，重整即還原]** → 寫入 `localStorage` 同步，模擬持久化；提供「重設假資料」按鈕方便 demo。
- **[shadcn/ui 元件需手動 copy 進專案]** → 一次性成本，列入 tasks 中明確安裝指令。
- **[Recharts 在 SSR 會有 warning]** → 本專案為純 SPA，不受影響。
- **[Route guard 與資料載入競態]** → 在 `AuthProvider` 完成 localStorage 還原前，render 一個 loading state，避免閃過登入頁。

## Migration Plan

不適用 (新建專案，無既有系統需遷移)。後續若接真實後端：

1. 在 `lib/api-client.ts` 將 baseURL 切到後端網址。
2. 移除 `main.tsx` 中啟動 MSW 的程式碼。
3. 刪除 `src/mocks/` 與 `public/mockServiceWorker.js`。
4. API 介面 (URL、payload) 必須與本案 handlers 對齊；若不一致則更新 api 層即可。

## Open Questions

- 儀表板的「使用率」定義為何？目前以「過去 30 天 in_use 車輛數 / 車輛總數」近似，待 PM 確認。
- 員工是否需要與車輛建立指派關係？MVP 先在 `Vehicle.assignedTo` 用員工 id 做弱關聯，不做強制 FK 約束。
- 是否需要「修改密碼」流程？MVP **不做**，留待後端介接後處理。
