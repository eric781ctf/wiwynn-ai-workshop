## Context

VMS 目前所有寫入操作（auth login/logout、vehicles CRUD、employees CRUD）都集中在 [frontend/src/mocks/handlers.ts](frontend/src/mocks/handlers.ts)，後端是 MSW + 一份持久化到 `localStorage` (`vms.mock-db.v1`) 的 in-memory DB。Token 是 `fake-jwt-${role}-${userId}`，handler 並未驗證，但格式可解析出 actor。前端透過 [frontend/src/lib/api-client.ts](frontend/src/lib/api-client.ts) 自動帶 `Authorization: Bearer <token>`，所有 feature 統一走它。

新需求要在每次「異動 / 身份事件」時寫一筆紀錄，並提供一個 admin 才能看的查詢頁。最低風險的做法是把紀錄當成第四個 collection 跟現有 mock DB 共生，不引入新依賴；UI 完全沿用 employee-management 已建立的 list page pattern（表格 + 篩選 + 分頁）。

## Goals / Non-Goals

**Goals:**
- 在 mock 後端記錄六種事件：`auth.login`、`auth.logout`、`vehicle.created`、`vehicle.updated`、`vehicle.deleted`、`vehicle.unassigned`（員工刪除導致）、`employee.created`、`employee.updated`、`employee.deleted`。
- 提供 `GET /api/activity-logs` 支援 `actorId` / `action` / `resource` / `from` / `to` / `page` / `pageSize` 查詢與分頁。
- 提供 `/activity-logs` 頁面：表格（時間、操作者、動作、資源、摘要）、篩選列、分頁器；admin only。
- 在側邊欄 admin 視角新增入口；非 admin 直接導回首頁。
- 跨 dev session 不弄壞既有 `localStorage` 資料：舊 schema 自動補空陣列。

**Non-Goals:**
- 不做日誌的修改 / 刪除 API（紀錄為 append-only）。
- 不做 export / CSV 匯出。
- 不做後端真實 JWT 驗證；token 仍照現有 fake 規則解析 actor。
- 不做 i18n 切換；介面文字統一 zh-TW，與其他頁一致。
- 不替換現有「broken-on-purpose」教材檔案。

## Decisions

### D1. Actor 識別來源：解析 Bearer token

Handler 從 `request.headers.get("Authorization")` 取出 `fake-jwt-${role}-${userId}`，正則解析 `userId`。若 token 缺失或格式不符，actor 記為 `system`（理論上只有未登入時的 login 路徑會發生 — 該事件本身已含 user 資訊，可用 response user 寫入）。

**Why over alternatives:**
- ❌ *讓前端在每個 request body 中帶 actor*：違反現有 api-client 設計，且每個呼叫點都得改，散落容易漏。
- ❌ *handler 內讀 `localStorage.getItem("vms.user")`*：可行但耦合 UI 端 storage key；保留 token 解析方式之後若接真後端可直接換成 JWT decode。
- ✅ *解析 Authorization header*：所有寫入 handler 在一處抽 helper（`getActor(request)`），api-client 已自動帶 token，零呼叫端改動。

### D2. 紀錄結構

```ts
interface ActivityLog {
  id: string;              // newId("log")
  timestamp: string;       // ISO 8601, handler 內生成
  actorId: string;         // user.id 或 "system"
  actorName: string;       // 寫入時 snapshot；user 被改名後不影響歷史紀錄
  action: ActivityAction;  // "auth.login" | "auth.logout" | "vehicle.created" | ...
  resource: ActivityResource; // "auth" | "vehicle" | "employee"
  targetId: string | null; // 被操作對象 id（auth 事件為 actor 自己；可為 null）
  targetLabel: string;     // 可讀標籤（車牌、員工名）寫入時 snapshot
  summary: string;         // zh-TW 摘要，如「新增車輛 ABC-1234」
}
```

`actorName` 與 `targetLabel` 都 snapshot 寫入：之後 user / vehicle / employee 改名，歷史紀錄維持當下狀態，避免「刪了的員工顯示為 undefined」。

### D3. 寫入點：handler 內 inline，不抽 middleware

每個既有 handler 在 `persist()` 前後加一行 `appendLog(...)`。MSW 沒有 Express 等級的 middleware 機制，硬抽會破壞「一個 endpoint 一個 `http.x` 區塊」的可讀性。helper 簽章：

```ts
function appendLog(
  request: Request,
  partial: Omit<ActivityLog, "id" | "timestamp" | "actorId" | "actorName">
): void
```

`appendLog` 內部 push 到 `db.activityLogs` 並 `persist()`；呼叫端只要描述 action / resource / target / summary，不重複 actor 解析邏輯。

### D4. 查詢 API：分頁回傳 envelope

```
GET /api/activity-logs?actorId=&action=&resource=&from=&to=&page=1&pageSize=20
→ { items: ActivityLog[], total: number, page: number, pageSize: number }
```

排序固定 `timestamp` desc。`from`/`to` 採 `YYYY-MM-DD`，handler 端轉為 `[from 00:00, to 23:59:59]`。`pageSize` 預設 20、最大 100，超出 clamp。

**Why envelope (而非裸陣列)：** 既有 list 端點都是裸陣列，但那些資料量小（<100）。activity log 會持續成長且需分頁，envelope 是業界慣例；新增端點不會破壞現有 contract。

### D5. localStorage migration

`db.ts` 的 `loadFromStorage()` 在解析後檢查 `parsed.activityLogs`，若 `undefined` 則補 `[]` 並立刻 `persist()`。不 bump storage key（否則所有 dev 端使用者車輛 / 員工資料會被洗掉）。

⚠️ **localStorage shape 變動**：`vms.mock-db.v1` 多一個欄位但 key 不變；舊 build 讀新資料會忽略多餘欄位（JSON.parse 不報錯），新 build 讀舊資料由 lazy-migration 處理 — 雙向相容。

### D6. 路由與守衛

延用 `RequireRole`：

```tsx
<Route element={<RequireRole role="admin" />}>
  <Route path="/employees" element={<EmployeesPage />} />
  <Route path="/activity-logs" element={<ActivityLogsPage />} />
</Route>
```

側邊欄項目以 `useAuth()` 取得角色，admin 才 render。

### D7. 前端 feature 結構

```
frontend/src/features/activity-log/
  api.ts               // listActivityLogs(params) 包 api-client
  types.ts             // ActivityLog, ActivityAction, ActivityResource
  components/
    ActivityLogTable.tsx
    ActivityLogFilters.tsx
  pages/
    ActivityLogsPage.tsx
```

與 `features/employee/` 結構平行，無新慣例。

## Risks / Trade-offs

- **無限成長的 localStorage** → 每次 dev 操作都寫一筆，長期可能數 MB。**Mitigation:** handler 在 push 後若 `activityLogs.length > 1000` 砍掉最舊的；明確當作教學用上限，並在 README 註明可手動 `localStorage.removeItem("vms.mock-db.v1")` 重置。
- **Snapshot 欄位偏離真實狀態** → 若使用者期待「即時看到員工最新名字」會困惑。**Mitigation:** 在 design 與 spec 中明確說明歷史紀錄保留當下值，並在 UI tooltip 補一句「紀錄當下值」。
- **Token 解析耦合 fake JWT 格式** → 若日後改真 JWT，`getActor` 需改寫。**Mitigation:** 集中在單一 helper；接真後端時只改一處。
- **多分頁併發寫入競態** → MSW 在同一頁內合理串行，但跨分頁兩個 dev 同時操作會踩 `localStorage` 寫入。**Mitigation:** 已知教學用 mock 限制，不處理；會在 spec 說明 single-tab 假設。
- **Logout 紀錄需在 token 仍有效時寫入** → handler 接到 `/api/auth/logout` 時 actor 仍是該 user，無問題；前端必須先呼叫 logout API 再清 token。

## Migration Plan

1. 擴充 `MockDB` 型別與 `loadFromStorage` lazy migration（不 bump storage key）。
2. 新增 `appendLog` helper、`getActor` helper。
3. 在現有 handler 各寫入點加 `appendLog`；員工刪除的 cascade unassign 額外寫 `vehicle.unassigned`。
4. 新增 `GET /api/activity-logs` handler。
5. 前端 feature scaffold + route + 側邊欄項目。
6. 手動驗證：admin 看得到、user 被導回；操作各類事件後紀錄出現；refresh 後仍存在。

**Rollback:** 純前端 / mock 範圍，回退 = revert commits；既有 localStorage 資料因 lazy-migration 是相容的，無需手動清理。

## Open Questions

- **是否需要 `auth.login.failed`（密碼錯誤）紀錄？** 提案目前未含，但稽核常見需求。建議延後至下一個 change，避免本次膨脹。
- **「操作者」篩選 UI 用 dropdown 還是搜尋輸入？** 目前 user 數量極少（2 名 seed），dropdown 即可；若日後接真後端再考慮 typeahead。
