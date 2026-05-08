# Build with AI — 課程範例專案

這是一個 AI 課程的範例專案，用來示範如何與 AI Agent（Claude Code 等）協作開發。
專案內含兩份獨立的程式碼，搭配一組共用的 **Agent Skills**：

- **根目錄練習區（`src/`）**：刻意寫壞的 ESLint 違規與失敗測試，學員透過 AI 找出並修正。
- **車輛管理系統（`frontend/`）**：React 19 + Vite + MSW 的純前端 MVP，含登入、儀表板、車輛 / 員工 CRUD。
- **Agent Skills（`.agents/skills/`）**：可重複使用的 AI 提示詞腳本，並鏡像到 `.claude/`、`.cursor/`、`.gemini/` 等多家工具的對應目錄。

課程講義：[deanlin.net/course/wiwynn](https://deanlin.net/course/wiwynn)

## 環境需求

- Node.js **≥ 20**（根目錄與 frontend 共用）
- npm（package-lock.json 已附）
- [Claude Code](https://claude.ai/code)（或任一支援 Skills 的 AI 工具）

## 啟動方式

本專案有兩個獨立的 npm 工作區，請依照需求進入對應目錄安裝相依套件。

### 1. 根目錄練習區

提供 ESLint + Jest 的練習場，搭配 [src/skills/echo.js](src/skills/echo.js) 的刻意違規。

```bash
npm install
npm run lint           # 全專案 ESLint
npm run lint:fix       # ESLint 自動修正
npm test               # Jest（ESM 模式）
npm test -- echo       # 只跑包含 echo 的測試檔
npm run test:watch     # Jest watch
```

> Husky pre-commit hook 會在每次 commit 前**並行**執行 `npm run lint` 與 `npm test`，
> 任一失敗都會中止 commit（見 [.husky/pre-commit](.husky/pre-commit)）。

### 2. 車輛管理系統前端（frontend）

獨立的 Vite 專案，使用 MSW 在瀏覽器層攔截所有 `/api/*` 請求，無需後端即可運行。

```bash
cd frontend
npm install
npm run dev            # 啟動 dev server（自動掛載 MSW worker）
npm run build          # tsc -b && vite build
npm run lint
npm run preview        # 預覽 production build
```

預設 dev server 網址：`http://localhost:5173`

#### 預設帳號

| 角色 | 帳號 | 密碼 |
|------|------|------|
| 管理者 | `admin` | `admin123` |
| 一般使用者 | `user` | `user123` |

- 管理者可進入「員工管理」；一般使用者僅可使用「車輛管理」與「儀表板」。
- 所有資料會持久化到瀏覽器 `localStorage` (`vms.mock-db.v1`)。
  若要重設，於 DevTools console 執行 `localStorage.removeItem('vms.mock-db.v1')` 後重整。

完整前端說明見 [frontend/README.md](frontend/README.md)。

### 3. 啟動 AI 協作

1. 在專案根目錄開啟 Claude Code。
2. 輸入 `/` 即可看到本專案內建的 Skills 清單。
3. 試著請 AI「修正 `src/skills/echo.js` 的所有 ESLint 錯誤」或「替我寫一個 PR 描述」。

## 內建 Skills

| Skill | 說明 |
|-------|------|
| `git-smart-commit` | 將雜亂的 git 變更依功能邏輯自動拆分成多個有意義的 conventional commit |
| `git-pr-description` | 根據 branch 差異自動產生 Pull Request 的 Title 與 Description |
| `gen-test-cases` | 根據選取的程式碼或功能範圍，自動產生測試案例與對應測試程式 |
| `git-branch-name` | 根據變更內容，設計符合 kebab-case 命名規則的 feature branch 名稱 |

## 自訂 Skills

每個 Skill 的核心是 `SKILL.md`，描述該 Skill 的運作流程與規則。你可以：

- 直接修改現有 Skill 的行為
- 在 `.agents/skills/` 新增自己的 Skill 目錄與 `SKILL.md`
- 將 Skill 邏輯移植到其他 AI Agent 平台（`.cursor/`、`.gemini/`、`.codex/` …）

## 專案結構（重點）

```
.
├── src/skills/              # 練習用：刻意寫壞的程式碼與測試
├── frontend/                # 車輛管理系統 MVP（React + Vite + MSW）
├── .agents/skills/          # Skills 來源（其他 .xxx/ 目錄為鏡像）
├── .claude/                 # Claude Code 專用設定與 Skills 鏡像
├── openspec/                # 規格驅動開發（specs / changes）
├── .husky/pre-commit        # commit 前並行 lint + test
└── CLAUDE.md                # 給 AI 看的專案導覽
```
