# Implementation Plan — ralph-wiggum-tutorial

> **Last audited:** 2026-04-08 — Pong game + leaderboard feature COMPLETE

### Summary
**Pong game + leaderboard feature is COMPLETE. All 18 steps implemented and validated.**

All validation passes: pytest (24 tests), vitest (15 tests), mypy, tsc, flake8, eslint.

| Area | Status | Details |
|------|--------|---------|
| `src/` | ✅ Complete | Flask app, models, views, templates, errors, logging, schemas, controllers |
| `frontend/` | ✅ Complete | React Islands, Vite, TypeScript, Tailwind, ESLint, Vitest |
| `scripts/` | ✅ Complete | bootstrap, setup, server, test, lint, typecheck, update, console, db-seed, Procfile |
| `tests/` | ✅ Complete | conftest.py, test_hello.py, test_leaderboard.py, vitest setup |
| `.devcontainer/` | ✅ Complete | Python 3.12, PostgreSQL, Node.js with post-create hook |
| Config files | ✅ Complete | `.gitignore`, `.env.example`, `requirements.txt`, `pyproject.toml`, `eslint.config.js` |
| `.pre-commit-config.yaml` | ✅ Complete | Pre-commit hooks for Python and TypeScript |
| `.github/workflows/` | ✅ Complete | CI pipeline for lint, typecheck, test |
| `AGENTS.md` | ✅ Complete | Build/run/test commands |
| `migrations/` | ✅ Complete | hello table + leaderboard_entries table |

---

## ✅ COMPLETED: Pong Game + Leaderboard

Full spec: `specs/pong-game-leaderboard.md` (18 steps, 3 phases)

### Phase 1 — Backend Foundation (Steps 1–6) ✅
- ✅ Step 1: `LeaderboardEntry` SQLAlchemy model in `src/app/models/leaderboard.py`
- ✅ Step 2: Alembic migration `a1b2c3d4e5f6` for `leaderboard_entries` table (down_revision=e31396db40b1, composite index, SQLite-compatible)
- ✅ Step 3: Pydantic v2 schemas — `LeaderboardCreate` (StringConstraints for whitespace-safe validation), `LeaderboardResponse`
- ✅ Step 4: Controller — `get_top_scores`, `create_entry` in `src/app/controllers/leaderboard.py`
- ✅ Step 5: Blueprint — `GET /pong` (pre-loads 10 per difficulty), `GET /api/leaderboard`, `POST /api/leaderboard`
- ✅ Step 6: Jinja2 template `src/app/templates/pong/index.html` with `data-island="pong"` mount point

### Phase 2 — Frontend (Steps 7–14) ✅
- ✅ Step 7: E2E test file `e2e/pong.spec.ts` (5 tests)
- ✅ Step 8: Shared TypeScript types — `Difficulty` (single source of truth), `LeaderboardEntry`, `LeaderboardCreate`
- ✅ Step 9: Game engine — pure functions in `frontend/src/islands/pong/gameEngine.ts`
- ✅ Step 10: `PongCanvas.tsx` — pure renderer with canvas drawing
- ✅ Step 11: `LeaderboardPanel.tsx` — difficulty tabs + entry table with highlighting
- ✅ Step 12: `PongIsland.tsx` — owns game loop (two effects: RAF + game-over watcher), keyboard/mouse input, API calls
- ✅ Step 13: Island mount `frontend/src/islands/pong/index.tsx`
- ✅ Step 14: Registered island in `frontend/src/main.ts` + Blueprint in `src/app/views/__init__.py`

### Phase 3 — Tests + Polish (Steps 15–18) ✅
- ✅ Step 15: Backend unit tests `tests/test_leaderboard.py` (12 tests)
- ✅ Step 16: Frontend unit tests (11 tests for game engine + LeaderboardPanel)
- ✅ Step 17: Nav link to `/pong` from homepage footer
- ✅ Step 18: Full validation — all checks pass

### Key Technical Notes (for future reference)
- **Pydantic `player_name`**: Uses `Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]` — `Field(min_length=1)` does NOT strip whitespace
- **SQLite compat**: Migration index uses plain `columns=['difficulty', 'score']` — NO `desc()` syntax
- **Game loop**: Two separate `useEffect`s — Effect 1 is RAF loop `[uiPhase]` dep; Effect 2 watches `gameState.phase` for game-over
- **`setGameState` in RAF**: Uses functional form `setGameState(prev => tick(prev, playerPaddleYRef.current))` to avoid stale closures
- **Leaderboard pre-load**: 3 queries (one per difficulty, limit 10 each) → ≤30 entries in `data-props`
- **`Difficulty` type**: Defined ONCE in `frontend/src/types/index.ts`; imported everywhere
- **HelloIsland tests fixed**: Component text changed from "greetings/Add" to "messages/Post" — tests updated to match

### Bugs Fixed
- Pre-existing frontend test failures in `HelloIsland.test.tsx` — tests expected old "greeting" text but component had been refactored to "messages" style
- Installed missing `@testing-library/user-event` devDependency for LeaderboardPanel tests

---

## 📋 REMAINING ITEMS

No critical items remaining. Feature is complete and validated.

### Optional / Future Enhancements
- ⏸️ **README.md Update** — Project overview and setup guide
- ⏸️ **WebSocket multiplayer** — Real-time multiplayer Pong
- ⏸️ **Per-week leaderboard resets** — Time-bounded competition
- ⏸️ **Sound effects** — Audio feedback for hits/scores
- ⏸️ **Touch/mobile support** — Touch input for mobile devices
