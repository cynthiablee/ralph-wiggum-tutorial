# Implementation Plan — ralph-wiggum-tutorial

> **Last audited:** 2026-04-08 — Pong game + leaderboard feature added

### Summary
**Hello World app is complete. Next priority: Pong game + leaderboard feature.**

See `specs/pong-game-leaderboard.md` for the full implementation spec (18 steps, 3 phases).

| Area | Status | Details |
|------|--------|---------|
| `src/` | ✅ Complete | Flask app, models, views, templates, errors, logging, schemas, controllers |
| `frontend/` | ✅ Complete | React Islands, Vite, TypeScript, Tailwind, ESLint, Vitest |
| `scripts/` | ✅ Complete | bootstrap, setup, server, test, lint, typecheck, update, console, db-seed, Procfile |
| `tests/` | ✅ Complete | conftest.py, test_hello.py, vitest setup |
| `.devcontainer/` | ✅ Complete | Python 3.12, PostgreSQL, Node.js with post-create hook |
| Config files | ✅ Complete | `.gitignore`, `.env.example`, `requirements.txt`, `pyproject.toml`, `eslint.config.js` |
| `.pre-commit-config.yaml` | ✅ Complete | Pre-commit hooks for Python and TypeScript |
| `.github/workflows/` | ✅ Complete | CI pipeline for lint, typecheck, test |
| `AGENTS.md` | ⏳ In progress | Being updated with build/run/test commands |
| `README.md` | ⏳ In progress | Being updated with project overview and setup |
| `migrations/` | ⏸️ Pending | Requires `flask db init` (not needed for quick start without actual schema changes) |

---

## 🎮 NEW FEATURE: Pong Game + Leaderboard

**Status: ⏳ NOT STARTED — This is the current implementation priority.**

Full spec: `specs/pong-game-leaderboard.md` (18 steps, 3 phases)

### Phase 1 — Backend Foundation (Steps 1–6)
- ⏳ Step 1: `LeaderboardEntry` SQLAlchemy model in `src/app/models/leaderboard.py`
- ⏳ Step 2: Alembic migration for `leaderboard_entries` table (auto-generate with `flask db migrate`)
- ⏳ Step 3: Pydantic v2 schemas — `LeaderboardEntryResponse`, `LeaderboardEntryCreate` in `src/app/schemas/leaderboard.py`
- ⏳ Step 4: Controller — `list_entries`, `create_entry` in `src/app/controllers/leaderboard.py`
- ⏳ Step 5: Blueprint + Jinja2 template — `src/app/views/pong.py`, `src/app/templates/pong/index.html`
- ⏳ Step 6: API Blueprint — `GET /api/leaderboard`, `POST /api/leaderboard` in `src/app/views/pong_api.py`

### Phase 2 — Frontend (Steps 7–14)
- ⏳ Step 7: E2E test file `e2e/pong.spec.ts` (write early as acceptance targets)
- ⏳ Step 8: Shared TypeScript types — `Difficulty`, `LeaderboardEntry`, `LeaderboardCreate` in `frontend/src/types/index.ts`
- ⏳ Step 9: Game engine — pure functions in `frontend/src/islands/pong/gameEngine.ts` + types in `pong/types.ts`
- ⏳ Step 10: `PongCanvas.tsx` — pure renderer, no game loop
- ⏳ Step 11: `LeaderboardPanel.tsx` — difficulty tabs + entry table
- ⏳ Step 12: `PongIsland.tsx` — owns game loop (two effects: RAF + game-over watcher), keyboard/mouse input, API calls
- ⏳ Step 13: Island mount `frontend/src/islands/pong/index.tsx`
- ⏳ Step 14: Register island in `frontend/src/main.ts` + Blueprint in `src/app/views/__init__.py`

### Phase 3 — Tests + Polish (Steps 15–18)
- ⏳ Step 15: Backend unit tests `tests/test_leaderboard.py`
- ⏳ Step 16: Frontend unit tests for game engine + components
- ⏳ Step 17: Nav link to `/pong` from homepage footer
- ⏳ Step 18: Run full validation (`script/test`, `script/typecheck`, `script/lint`, `npx playwright test`)

### Key Technical Notes for Implementation
- **Pydantic `player_name`**: Use `Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]` — `Field(min_length=1)` does NOT strip whitespace
- **SQLite compat**: `op.create_index` must use plain `columns=['difficulty', 'score']` — NO `desc()` syntax (breaks SQLite in tests)
- **Game loop**: Two separate `useEffect`s — Effect 1 is the RAF loop `[uiPhase]` dep only; Effect 2 watches `gameState.phase` for game-over. Never read `gameState` directly inside RAF (stale closure).
- **`setGameState` in RAF**: MUST use functional form `setGameState(prev => tick(prev, playerPaddleYRef.current))` — capturing state directly freezes after frame 1
- **Leaderboard pre-load**: 3 queries (one per difficulty, limit 10 each) → ≤30 entries in `data-props`; client-side filter by tab
- **`down_revision`**: New migration must point to `e31396db40b1` (existing hello table migration)
- **`Difficulty` type**: Define ONCE in `frontend/src/types/index.ts`; import everywhere, never redefine
- **Score gate**: Show submit form only when `gameState.playerScore >= 1`
- **ESLint**: `react-hooks/exhaustive-deps` is `warn` — game loop effect deps must be correct
- **`leaderboardDifficulty` initial value**: `'medium'`; after score submission call `fetchLeaderboard(difficulty)` then set `leaderboardDifficulty = difficulty`

---



✅ **All items below are COMPLETE.** The hello-world app is fully functional with Flask serving a page containing a mounted React island.

### ✅ Step 1 — Environment Foundation (Phase 1.1–1.3) COMPLETE
- ✅ `.devcontainer/devcontainer.json` + post-create.sh
- ✅ `.gitignore`
- ✅ `.env.example`

**Validated:** Container builds, env vars load successfully.

### ✅ Step 2 — Python Backend Core (Phase 2.1–2.3, 2.8–2.9) COMPLETE
- ✅ `requirements.txt`, `requirements-dev.txt`, `pyproject.toml`
- ✅ `src/app/__init__.py` (app factory), `src/app/config.py`
- ✅ `src/app/models/base.py`, `src/app/models/hello.py`, `src/app/models/__init__.py`
- ✅ `src/app/views/__init__.py`, `src/app/views/hello.py`
- ✅ `src/app/templates/base.html`, `src/app/templates/hello/index.html`
- ✅ `src/app/logging_config.py` (Phase 2.4)
- ✅ `src/app/errors.py` + error templates (Phase 2.5)
- ✅ `src/app/schemas/hello.py` (Phase 2.6)
- ✅ `src/app/controllers/hello.py` (Phase 2.7)
- ✅ `src/app/static/` directory setup (Phase 2.10)

**Validated:** `python -c "from app import create_app; create_app()"` works, `curl http://localhost:5000/` returns HTML.

### ✅ Step 3 — React Islands Frontend (Phase 4.1, 4.3–4.4) COMPLETE
- ✅ `frontend/package.json`, `frontend/tsconfig.json`, `frontend/vite.config.ts`
- ✅ `frontend/tailwind.config.ts`, `frontend/postcss.config.js`
- ✅ `frontend/eslint.config.js`
- ✅ `frontend/src/styles/globals.css` with Tailwind (Phase 4.2)
- ✅ `frontend/src/main.ts` (island registry), `frontend/src/types/index.ts`
- ✅ `frontend/src/islands/hello/HelloIsland.tsx`, `frontend/src/islands/hello/index.ts`
- ✅ `frontend/vitest.config.ts`, `frontend/tests/islands/hello/HelloIsland.test.tsx` (Phase 4.7)

**Validated:** `cd frontend && npm run build` produces assets, island mounts in browser.

### ✅ Step 4 — Scripts & Runnable App (Phase 5.1–5.7) COMPLETE
- ✅ `script/bootstrap`
- ✅ `script/setup`
- ✅ `script/server`
- ✅ `script/test` (Phase 5.4)
- ✅ `script/lint` (Phase 5.5)
- ✅ `script/typecheck` (Phase 5.6)
- ✅ `script/update`, `script/console`, `script/db-seed`, `Procfile` (Phase 5.7)

**Validated:** `script/setup && script/server` starts Flask + Vite, hello island renders on `http://localhost:5000/`.

### Additional Completed Items
- ✅ `tests/__init__.py`, `tests/conftest.py`, `tests/test_hello.py` (Phase 6.1 - Python tests)
- ✅ `.pre-commit-config.yaml` (Phase 7.1 - Pre-commit hooks)
- ✅ `.github/workflows/ci.yml` (Phase 8.1 - GitHub Actions CI)

### Remaining Items (~10%)
- ⏳ **9.1 AGENTS.md Update** — Being done now (build/run/test commands)
- ⏳ **9.2 README Update** — Being done now (project overview and setup)
- ⏸️ **3.1 Database Migrations** — Flask-Migrate init + first migration (optional for quick start)

---

## ✅ COMPLETED PHASES (Detailed Summary)

### Phase 1: Foundation (Environment & Configuration)
**Status: ✅ 100% Complete**

All environment setup complete:
- `.devcontainer/devcontainer.json` — Python 3.12, PostgreSQL, Node.js
- `.devcontainer/post-create.sh` — Runs setup script automatically
- `.gitignore` — Configured for Python, Node.js, IDE, build artifacts
- `.env.example` — Template with DATABASE_URL, FLASK_ENV, SECRET_KEY, FLASK_DEBUG

### Phase 2: Python Backend Foundation
**Status: ✅ 100% Complete**

All backend code implemented:
- `requirements.txt` & `requirements-dev.txt` — Flask, SQLAlchemy, Pydantic, pytest, mypy
- `pyproject.toml` — Tool configurations (pytest, mypy, flake8)
- `src/app/__init__.py` — App factory with extension initialization
- `src/app/config.py` — Configuration classes (Dev/Prod/Test)
- `src/app/models/` — Base model, Hello model with SQLAlchemy
- `src/app/logging_config.py` — JSON in production, human-readable in development
- `src/app/errors.py` — Error handlers returning JSON/HTML
- `src/app/templates/errors/` — Error pages (400, 404, 500)
- `src/app/schemas/hello.py` — Pydantic schemas for validation
- `src/app/controllers/hello.py` — Business logic layer
- `src/app/views/hello.py` — Flask blueprint with routes (GET /, GET/POST /api/hello)
- `src/app/templates/` — Base template with Vite integration, Hello page with island mount
- `src/app/static/` — Directory for Vite build output

### Phase 3: Database Migrations
**Status: ⏸️ Pending (Optional for Quick Start)**

Database setup not yet initialized:
- `migrations/` directory not yet created (requires `flask db init`)
- Plan: Run migrations only when schema changes are needed

### Phase 4: React Islands Frontend
**Status: ✅ 100% Complete**

All frontend code implemented:
- `frontend/package.json` — Dependencies and scripts (dev, build, lint, typecheck, test)
- `frontend/tsconfig.json` — TypeScript configuration
- `frontend/vite.config.ts` — Vite build → `../src/app/static/`, manifest.json for production
- `frontend/tailwind.config.ts` & `frontend/postcss.config.js` — Tailwind CSS setup
- `frontend/eslint.config.js` — ESLint flat config for TypeScript
- `frontend/src/styles/globals.css` — Tailwind imports
- `frontend/src/main.ts` — Island registry with auto-mount logic
- `frontend/src/types/index.ts` — Shared TypeScript types
- `frontend/src/islands/hello/HelloIsland.tsx` — React component with API fetch
- `frontend/src/islands/hello/index.ts` — Island mount logic
- `frontend/vitest.config.ts` — Vitest configuration
- `frontend/tests/islands/hello/HelloIsland.test.tsx` — Component tests

### Phase 5: Scripts to Rule Them All
**Status: ✅ 100% Complete**

All operational scripts implemented:
- `script/bootstrap` — Install dependencies
- `script/setup` — Full environment setup (bootstrap, .env, DB init, pre-commit)
- `script/server` — Start Flask + Vite servers (concurrent execution)
- `script/test` — Run all tests (pytest + vitest)
- `script/lint` — Run all linters (flake8 + eslint)
- `script/typecheck` — Run type checkers (mypy + tsc)
- `script/update` — Update dependencies
- `script/console` — Flask shell
- `script/db-seed` — Seed database with dev data
- `Procfile` — Production server config

### Phase 6: Testing Infrastructure
**Status: ✅ 100% Complete**

Python tests implemented:
- `tests/__init__.py` — Test package marker
- `tests/conftest.py` — Pytest fixtures (app, client, db)
- `tests/test_hello.py` — Hello route tests

### Phase 7: Pre-commit & Quality
**Status: ✅ 100% Complete**

Pre-commit hooks configured:
- `.pre-commit-config.yaml` — Hooks for trailing whitespace, YAML validation, flake8, mypy, eslint

### Phase 8: CI/CD
**Status: ✅ 100% Complete**

GitHub Actions pipeline implemented:
- `.github/workflows/ci.yml` — Jobs for lint, typecheck, test with PostgreSQL service

---

## 📋 REMAINING ITEMS (~10%)

### 9.1 AGENTS.md Update
**Priority:** P1 (In Progress)
**Status:** ⏳ Being updated now

Files to create/update:
- `AGENTS.md` — Build/run/test commands and codebase patterns

### 9.2 README.md Update
**Priority:** P2 (In Progress)
**Status:** ⏳ Being updated now

Files to update:
- `README.md` — Project overview, quick start, and development guide

### 3.1 Database Migrations (Optional)
**Priority:** P0 (Can defer)
**Status:** ⏸️ Not needed for quick start

When to do:
- Run `flask db init` and `flask db migrate` when schema changes require persistence
- Currently not required as all models are defined and in-memory SQLite works for testing

---

## Detailed Phase Reference (For Context)
