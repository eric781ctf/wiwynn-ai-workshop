# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository purpose

This is a teaching repo for the Wiwynn "Build with AI" workshop ([deanlin.net/course/wiwynn](https://deanlin.net/course/wiwynn)). It contains **two unrelated codebases** plus a shared library of agent skills:

- **Root** (`src/`, `package.json`) — a Node.js sandbox where files like [src/skills/echo.js](src/skills/echo.js) are *intentionally broken* (ESLint violations, wrong test expectations). Students practise using AI to find and fix the violations. Do not "fix" these by deleting the lint errors silently — the user is usually demonstrating the workflow, not asking for the bug to disappear.
- **`frontend/`** — a self-contained React 19 + TypeScript + Vite vehicle-management MVP with an MSW-mocked backend. Has its own `package.json`, `eslint.config.js`, and `node_modules`. See [frontend/README.md](frontend/README.md) for full details.
- **Skills directories** — `.agents/skills/` is the source of truth; `.agent/`, `.claude/`, `.codex/`, `.cursor/`, `.factory/`, `.gemini/`, `.github/`, `.opencode/` are mirrors for different AI tools. When editing a skill, edit the `.agents/skills/<name>/SKILL.md` source and propagate, or update the variant the user is actively using — don't assume one mirror is canonical.

## Common commands

### Root
```bash
npm run lint           # ESLint over the whole root project
npm run lint:fix       # ESLint with autofix
npm test               # Jest (ESM via --experimental-vm-modules)
npm test -- echo       # Run a single test file by name pattern
npm run test:watch     # Jest watch mode
```

Node ≥ 20 is required (`package.json` `engines`). The project uses ESM (`"type": "module"`), so test files import with `.js` extensions.

### Frontend
```bash
cd frontend
npm install
npm run dev            # Vite dev server (auto-starts MSW worker)
npm run build          # tsc -b && vite build
npm run lint
npm run preview
```

### Pre-commit hook
[.husky/pre-commit](.husky/pre-commit) runs `npm run lint` and `npm test` **in parallel** at the repo root, then prints both outputs in labelled sections. A failure in either blocks the commit. The hook applies to root commits — frontend has no separate hook.

## Architecture notes

### Frontend (vehicle management MVP)
The interesting structural points that span multiple files:

- **MSW is the backend.** [frontend/src/main.tsx](frontend/src/main.tsx) conditionally starts the worker only when `import.meta.env.DEV` is true; production builds tree-shake the mock layer entirely. All REST endpoints live in [frontend/src/mocks/handlers.ts](frontend/src/mocks/handlers.ts), backed by an in-memory DB in [frontend/src/mocks/db.ts](frontend/src/mocks/db.ts) that persists to `localStorage` under key `vms.mock-db.v1`. To reset state during dev, clear that key in DevTools.
- **Auth is fake.** [frontend/src/features/auth/](frontend/src/features/auth/) issues a token on login but the mock handlers don't verify it. Any UI work assuming JWT semantics will be wrong until a real backend is wired in.
- **Role-based routing.** Routes are guarded by `RequireAuth` / `RequireRole` in `routes/router.tsx`. Admin sees an "員工管理" (employee management) entry; regular users do not, and a direct visit to `/employees` is redirected. Default credentials: `admin` / `admin123` and `user` / `user123`.
- **Cascade behaviour to remember.** Deleting an employee via `DELETE /api/employees/:id` also nulls out `vehicle.assignedTo` for any vehicles assigned to them — implemented in the mock handler, so a real backend port must replicate this.
- **API client** ([frontend/src/lib/api-client.ts](frontend/src/lib/api-client.ts)) is a thin fetch wrapper that auto-attaches the bearer token from `localStorage` and throws `ApiError` on non-2xx; features call into this rather than fetch directly.

### Root skill exercise
[src/skills/echo.js](src/skills/echo.js) deliberately violates each ESLint rule configured in [eslint.config.js](eslint.config.js) (`no-var`, `prefer-const`, `no-unused-vars`, `no-console`, `eqeqeq`, `no-undef`). Each violation is annotated by number in a comment. The companion test [src/skills/__tests__/echo.test.js](src/skills/__tests__/echo.test.js) imports an `echo` function that doesn't exist yet and asserts wrong values (`"helloa"`, `"12"`) — students implement `echo` and correct the expectations as part of the exercise.

### OpenSpec
The repo uses the experimental OpenSpec workflow under [openspec/](openspec/) with capability specs (`auth`, `dashboard`, `employee-management`, `mock-api`, `vehicle-management`) and an `openspec/changes/archive/` directory of completed deltas. The `openspec-*` and `opsx-*` skills drive proposing, applying, verifying, and archiving changes — invoke them rather than editing spec files freehand.

## Things to know before editing

- **Two `node_modules`, two lockfiles.** Don't run `npm install` at the root expecting frontend dependencies to install, and vice versa.
- **The "broken on purpose" files matter.** Before fixing lint errors in `src/`, confirm whether the user wants the fix or wants to walk through the AI-assisted process. The same applies to the failing tests.
- **Skills live in many places.** A change to a skill in `.claude/skills/foo/SKILL.md` won't reach Cursor/Gemini/Codex users unless you update the matching mirror (or `.agents/skills/foo/SKILL.md` and re-propagate).
