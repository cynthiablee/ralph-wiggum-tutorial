# Feature: Pong Game with Leaderboard

## Feature Description
Add a fully playable browser-based Pong game embedded in the website at `/pong`, with a persistent leaderboard that stores and ranks player scores by difficulty level. Players select a difficulty (Easy/Medium/Hard), play a match against an AI opponent on a canvas, then optionally submit their name and score to the leaderboard. The top 10 scores per difficulty are displayed alongside the game.

This feature showcases the React Islands architecture in a richer, stateful, real-time context and gives the site an engaging, competitive element.

## User Story
As a visitor to the website,
I want to play a Pong game in the browser and submit my score to a leaderboard,
So that I can have fun and compete against other players for the highest score.

## Problem Statement
The site currently only demonstrates a simple greeting message board. There is no interactive game or competitive element — missing an opportunity to showcase the full-stack Islands architecture in a more compelling scenario and to drive repeat engagement.

## Solution Statement
Build a `/pong` page that:
1. Renders a Jinja2 template extending `base.html` with a `data-island="pong"` mount point, pre-loading top leaderboard scores from the server.
2. Mounts a self-contained React Island that runs a canvas-based Pong game with an AI opponent, difficulty selection, and game-over score submission flow.
3. Persists scores in a `leaderboard_entries` PostgreSQL table via a Flask REST API (`GET/POST /api/leaderboard`).
4. Displays the live leaderboard in a panel adjacent to the game, filterable by difficulty.

---

## Relevant Files

### Existing Files to Modify
- **`src/app/views/__init__.py`** — Register the new `pong_bp` Blueprint.
- **`src/app/models/__init__.py`** — Export the new `LeaderboardEntry` model.
- **`src/app/schemas/__init__.py`** — Export `LeaderboardCreate` and `LeaderboardResponse` schemas.
- **`src/app/controllers/__init__.py`** — Export `LeaderboardController`.
- **`frontend/src/main.ts`** — Register the `pong` island in `islandRegistry`.
- **`frontend/src/types/index.ts`** — Add `LeaderboardEntry` and `LeaderboardCreate` TypeScript types.
- **`src/app/templates/hello/index.html`** — Add a navigation link to the `/pong` page in the footer.

### New Files

#### Backend
- **`src/app/models/leaderboard.py`** — `LeaderboardEntry` SQLAlchemy model with `id`, `player_name`, `score`, `difficulty`, `created_at`.
- **`src/app/schemas/leaderboard.py`** — Pydantic `LeaderboardCreate` (player_name, score, difficulty) and `LeaderboardResponse` schemas.
- **`src/app/controllers/leaderboard.py`** — `LeaderboardController` with `get_top_scores(difficulty, limit)` and `create_entry(data)` static methods.
- **`src/app/views/pong.py`** — `pong_bp` Blueprint: `GET /pong` (page), `GET /api/leaderboard`, `POST /api/leaderboard`.
- **`src/app/templates/pong/index.html`** — Jinja2 template with hero section, `data-island="pong"` mount point, and nav back to home.
- **`migrations/versions/<id>_create_leaderboard_entries_table.py`** — Alembic migration creating `leaderboard_entries` table.

#### Frontend
- **`frontend/src/islands/pong/index.tsx`** — Island mount logic; receives leaderboard data as initial props.
- **`frontend/src/islands/pong/PongIsland.tsx`** — Root island component; orchestrates game state, difficulty selection, post-game submission flow, and leaderboard panel.
- **`frontend/src/islands/pong/PongCanvas.tsx`** — `<canvas>` rendering component; runs the `requestAnimationFrame` game loop.
- **`frontend/src/islands/pong/gameEngine.ts`** — Pure-function game logic: initial state, tick (advance frame), handle input, detect collisions, check win condition.
- **`frontend/src/islands/pong/LeaderboardPanel.tsx`** — Renders the top-10 leaderboard table with difficulty filter tabs.
- **`frontend/src/islands/pong/types.ts`** — Pong-specific TypeScript types: `GameState`, `Ball`, `Paddle`, `Difficulty`, `GamePhase`.

#### Tests
- **`tests/test_leaderboard.py`** — pytest tests for `GET /api/leaderboard` and `POST /api/leaderboard` endpoints.
- **`frontend/tests/islands/pong/PongIsland.test.tsx`** — Vitest unit tests for `LeaderboardPanel` rendering and `gameEngine` logic.
- **`e2e/pong.spec.ts`** — Playwright E2E tests validating page load, difficulty selection, game interaction, score submission, and leaderboard display.

---

## Design Decisions (Confirmed)
- **Score submission**: Only shown when `playerScore >= 1` (player must have scored at least once).
- **Leaderboard entries**: Raw log — all submissions stored, no deduplication by name.
- **MAX_SCORE**: 5 points — first to 5 wins the match.
- **Leaderboard panel**: Always visible alongside the game canvas (desktop: side-by-side; mobile: stacked).
- **Input**: Mouse + keyboard only (no touch/mobile support needed).

## Implementation Plan

### Phase 1: Foundation
Set up the database model, Alembic migration, Pydantic schemas, and controller for leaderboard entries. This layer has no frontend dependency and can be tested in isolation.

### Phase 2: Core Implementation
Build the Flask Blueprint with API endpoints and the Pong page template. Build the React Island: game engine, canvas renderer, post-game submission/skip flow, and leaderboard panel.

### Phase 3: Integration
Register the Blueprint, island, and types in their respective registries. Add a navigation link from the home page. Validate end-to-end in the browser and run all test suites.

---

## Step by Step Tasks

### Step 1: Create the LeaderboardEntry model
- Create `src/app/models/leaderboard.py` with a `LeaderboardEntry` class inheriting from `Base`:
  - `id: Mapped[int]` — primary key
  - `player_name: Mapped[str]` — `String(50)`, not null
  - `score: Mapped[int]` — not null
  - `difficulty: Mapped[str]` — `String(20)`, not null, default `'medium'`
  - `created_at: Mapped[datetime]` — `default=func.now()`
- Update `src/app/models/__init__.py` to import and export `LeaderboardEntry`.

### Step 2: Generate the Alembic migration
- After creating the model in Step 1, auto-generate the migration by running:
  ```bash
  export FLASK_APP=src/app:create_app
  flask db migrate -m "create leaderboard entries table"
  ```
  This follows the existing codebase pattern (the `hello` migration was also auto-generated).
- Review the generated file under `migrations/versions/<id>_create_leaderboard_entries_table.py` and verify it correctly creates all columns.
- **Important: Add an index for fast leaderboard queries** — since `TestingConfig` uses SQLite (in-memory), the index must use a plain column list (no DESC syntax, which is unsupported by SQLite):
  ```python
  op.create_index('ix_leaderboard_difficulty_score', 'leaderboard_entries',
                  ['difficulty', 'score'])
  ```
  Add a matching `op.drop_index('ix_leaderboard_difficulty_score', table_name='leaderboard_entries')` in `downgrade()`.
- Confirm `down_revision = 'e31396db40b1'` (the SHA of the existing `create_hello_table` migration).
- **Do not run** `flask db upgrade` manually here — `script/setup` handles migration application automatically.

### Step 3: Create Pydantic schemas
- Create `src/app/schemas/leaderboard.py`:
  - `LeaderboardCreate`:
    - `player_name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]` — use `Annotated` + `StringConstraints` (Pydantic v2 idiomatic) so whitespace-only names like `" "` correctly fail validation after stripping.
    - `score: int = Field(ge=0)` — non-negative.
    - `difficulty: Literal['easy', 'medium', 'hard']` — Pydantic v2 native enum validation; no validator needed.
  - `LeaderboardResponse`: `id`, `player_name`, `score`, `difficulty`, `created_at`; `model_config = ConfigDict(from_attributes=True)`
- Update `src/app/schemas/__init__.py` to export both.
- Required imports: `from typing import Annotated, Literal` and `from pydantic import BaseModel, Field, StringConstraints, ConfigDict`.

### Step 4: Create the LeaderboardController
- Create `src/app/controllers/leaderboard.py`:
  - `get_top_scores(difficulty: str | None = None, limit: int = 10) -> list[LeaderboardEntry]`: query ordered by `score DESC`, filter by difficulty if provided.
  - `create_entry(data: LeaderboardCreate) -> LeaderboardEntry`: create and commit entry.
- Update `src/app/controllers/__init__.py` to export `LeaderboardController`.

### Step 5: Create the pong Blueprint and API
- Create `src/app/views/pong.py` with `pong_bp = Blueprint('pong', __name__)`:
  - `GET /pong`: query the top 10 entries **per difficulty** (run three separate queries — one per difficulty level — with `limit=10` each, yielding up to 30 entries total), then merge and pass as JSON to the template. This ensures the client-side leaderboard panel always has up to 10 entries per tab.
  - `GET /api/leaderboard`: accept `?difficulty=<str>&limit=<int>` query params (default limit 10); return JSON list of `LeaderboardResponse`.
  - `POST /api/leaderboard`: validate with `LeaderboardCreate`, create entry, return 201 with `LeaderboardResponse`.
- Update `src/app/views/__init__.py` to import and register `pong_bp`.

### Step 6: Create the pong Jinja2 template
- Create `src/app/templates/pong/index.html` extending `base.html`:
  - Override `{% block title %}` → `"Pong · Ralph Wiggum"`
  - Hero section: dark gradient header, "Pong" title, tagline, "← Back to Home" link
  - Main content: `<div data-island="pong" data-props='{{ leaderboard | tojson | safe }}' class="…">` with loading skeleton
  - Footer: "Built with Flask & React · Styled with Tailwind CSS"

### Step 7: Create the E2E test file (early, to define acceptance targets)
- Create `e2e/pong.spec.ts` with the following tests:
  - `loads the pong page and shows the game canvas` — navigate to `/pong`, assert `data-island="pong"` is visible, assert a `<canvas>` is rendered.
  - `difficulty selector is visible with three options` — assert Easy, Medium, Hard buttons/tabs are present.
  - `leaderboard panel is visible on page load` — assert leaderboard heading and table/list are visible.
  - `can submit a score via API and it appears in leaderboard` — POST to `/api/leaderboard` directly (via `request`), reload page, assert entry appears in leaderboard panel.
  - `POST /api/leaderboard rejects invalid data` — API test: post missing `player_name`, expect 400.

### Step 8: Define TypeScript types
- In `frontend/src/types/index.ts`, add the following. **`Difficulty` is the canonical definition** — import it from here everywhere else (including `pong/types.ts`):
  ```ts
  export type Difficulty = 'easy' | 'medium' | 'hard'

  export interface LeaderboardEntry {
    id: number
    player_name: string
    score: number
    difficulty: Difficulty
    created_at: string
  }

  export interface LeaderboardCreate {
    player_name: string
    score: number
    difficulty: Difficulty
  }
  ```

### Step 9: Create the game engine (pure functions)
- Create `frontend/src/islands/pong/types.ts` with:
  - `Ball`: `{ x, y, vx, vy, radius }`
  - `Paddle`: `{ x, y, width, height, speed }`
  - `GamePhase`: `'idle' | 'playing' | 'gameOver'`
  - `GameState`: `{ ball, playerPaddle, aiPaddle, playerScore, aiScore, phase, winner: 'player' | 'ai' | null }`
  - `CANVAS_WIDTH = 800`, `CANVAS_HEIGHT = 500`, `MAX_SCORE = 5`
  - Import `Difficulty` from `@/types` — do **not** redefine it here.
- Create `frontend/src/islands/pong/gameEngine.ts` with pure functions (no side effects, no imports from React or browser APIs):
  - `createInitialState(difficulty: Difficulty): GameState` — positions ball center, paddles at edges, sets AI speed per difficulty (easy=3, medium=5, hard=8 px/frame).
  - `tick(state: GameState, playerPaddleY: number): GameState` — advance one frame: clamp player paddle to canvas bounds `[0, CANVAS_HEIGHT - PADDLE_HEIGHT]`, move ball, move AI paddle toward ball centre (capped at AI speed), detect wall collisions (top/bottom), detect paddle collisions (call `reflectBallOnPaddle`), detect scoring (ball exits left/right edge), check win condition. Returns a new state object (immutable — spread `state`).
  - `reflectBallOnPaddle(ball: Ball, paddle: Paddle): Ball` — new velocity based on relative hit offset (centre = straight, edge = steep angle); slightly increase speed on each hit (cap at `MAX_BALL_SPEED`).
  - `checkWin(state: GameState): 'player' | 'ai' | null` — return winner if either score reaches `MAX_SCORE`.

### Step 10: Create PongCanvas component
**Role: pure renderer — no game loop, no keyboard handling.**

- Create `frontend/src/islands/pong/PongCanvas.tsx`:
  - Props: `gameState: GameState`, `onPlayerMove: (y: number) => void`
  - Use `useRef<HTMLCanvasElement>` to hold the canvas DOM node.
  - Use `useEffect(() => { /* draw */ }, [gameState])` to redraw whenever `gameState` changes:
    - Clear canvas with black background.
    - Draw centre dashed line.
    - Draw both paddles (white rectangles).
    - Draw ball (white circle).
    - Draw player score (top-left) and AI score (top-right).
    - Draw "GAME OVER" / winner text overlay when `gameState.phase === 'gameOver'`.
  - Attach a `mousemove` listener **on the canvas element** (not `document`) to compute cursor Y relative to canvas top and call `onPlayerMove(relativeY)`. Remove on unmount.
  - **No keyboard handling here** — keyboard input is handled in `PongIsland` (see Step 12).
  - **No `requestAnimationFrame` here** — the game loop lives in `PongIsland` (see Step 12).

### Step 11: Create LeaderboardPanel component
- Create `frontend/src/islands/pong/LeaderboardPanel.tsx`:
  - Props: `entries: LeaderboardEntry[]`, `activeDifficulty: Difficulty`, `onDifficultyChange: (d: Difficulty) => void`, `lastSubmittedId: number | null`
  - Renders difficulty filter tabs (Easy / Medium / Hard).
  - Filters `entries` by `activeDifficulty`, shows top 10.
  - Table columns: Rank, Player, Score.
  - Highlights the row whose `id === lastSubmittedId` (e.g., bold text or accent background) so the player can spot their new entry.
  - Shows "No scores yet" when filtered list is empty.

### Step 12: Create PongIsland (root island component)
**Role: owns the game loop, all game state, keyboard input, and API calls.**

- Create `frontend/src/islands/pong/PongIsland.tsx`:
  - Props: `initialLeaderboard: LeaderboardEntry[]`
  - State (all via `useState`): `gameState`, `difficulty`, `uiPhase: 'difficulty-select' | 'playing' | 'submit-score' | 'done'` (initial: `'difficulty-select'`), `playerName`, `submitting`, `submitError`, `leaderboard` (initial: `initialLeaderboard`), `leaderboardDifficulty: Difficulty` (initial: `'medium'`), `lastSubmittedId: number | null`
  - Ref (via `useRef`, NOT state, to avoid render-lag): `playerPaddleYRef` — stores the current Y position of the player's paddle.
  - **`onPlayerMove(y: number)`**: write `y` into `playerPaddleYRef.current`. No setState here.
  - **Keyboard input**: a `useEffect` with `[]` dependency (mounted once) that adds `keydown` listeners on `document` for `ArrowUp`/`w` (move paddle up by delta) and `ArrowDown`/`s` (move paddle down by delta), updating `playerPaddleYRef.current` directly (clamped to `[0, CANVAS_HEIGHT - PADDLE_HEIGHT]`). Removes listeners on unmount.
  - **Game loop — Effect 1 (RAF)**: a `useEffect` with `[uiPhase]` dependency that runs when `uiPhase === 'playing'`. Starts a `requestAnimationFrame` loop, calling `setGameState(prev => tick(prev, playerPaddleYRef.current))` each frame using the **functional update form** to avoid a stale-closure freeze (capturing `gameState` directly would read the value at effect setup time, not the current value). Cleans up by cancelling the RAF handle on unmount or when `uiPhase` changes. **No game-over detection here** — that lives in Effect 2.
  - **Game loop — Effect 2 (game-over detection)**: a separate `useEffect` with `[gameState.phase, gameState.playerScore]` that watches for `gameState.phase === 'gameOver'` and transitions `uiPhase` to `'submit-score'` (if `gameState.playerScore >= 1`) or `'done'`. This separation avoids reading stale `gameState` inside the RAF callback.
  - **Difficulty select screen**: three buttons (Easy / Medium / Hard); clicking one sets `difficulty`, calls `setGameState(createInitialState(difficulty))`, sets `uiPhase = 'playing'`.
  - **Submit-score screen** (shown when `uiPhase === 'submit-score'`): displays final score, a name input, a "Submit" button, and a "Skip" button. "Skip" transitions directly to `uiPhase = 'done'`. "Submit" POSTs to `/api/leaderboard` and on success: sets `lastSubmittedId` from the response, calls `fetchLeaderboard(difficulty)` to refresh the played difficulty's entries, sets `leaderboardDifficulty = difficulty`, then transitions to `'done'`.
  - **Done screen**: shows result (win/lose), final score, and a "Play Again" button that resets `uiPhase = 'difficulty-select'` and clears `lastSubmittedId`.
  - **`fetchLeaderboard(d: Difficulty)`**: hits `GET /api/leaderboard?difficulty=<d>&limit=10`, merges result with existing `leaderboard` state (replace entries for difficulty `d`).
  - Layout: `<PongCanvas gameState={gameState} onPlayerMove={onPlayerMove} />` on the left and `<LeaderboardPanel entries={leaderboard} activeDifficulty={leaderboardDifficulty} onDifficultyChange={setLeaderboardDifficulty} lastSubmittedId={lastSubmittedId} />` on the right. The difficulty-select and submit-score screens are overlaid on top of (or replace) the canvas area.

### Step 13: Create island mount logic
- Create `frontend/src/islands/pong/index.tsx`:
  - `export function mount(element: HTMLElement, props: unknown): void`
  - Clear element, parse `props` as `LeaderboardEntry[]`
  - `createRoot(element).render(<PongIsland initialLeaderboard={initialLeaderboard} />)`

### Step 14: Register island and types
- In `frontend/src/main.ts`, add to `islandRegistry`:
  ```ts
  pong: () => import('./islands/pong'),
  ```
- Types already updated in Step 8.

### Step 15: Write backend unit tests
- Create `tests/test_leaderboard.py` following the pattern of `tests/test_hello.py`:
  - `TestLeaderboardPage`: `test_pong_page_returns_html`, `test_pong_page_contains_island_mount`
  - `TestLeaderboardAPI`:
    - `test_list_empty` — GET `/api/leaderboard` returns `[]`
    - `test_create_entry` — POST valid data → 201 with correct fields
    - `test_create_entry_invalid_difficulty` — POST `difficulty='extreme'` → 400
    - `test_create_entry_missing_name` — POST missing `player_name` → 400
    - `test_create_entry_whitespace_name` — POST `player_name="   "` → 400 (stripped to empty)
    - `test_create_entry_negative_score` — POST `score=-1` → 400
    - `test_create_entry_zero_score` — POST `score=0` → 201 (zero is valid)
    - `test_list_after_create` — create 2 entries, GET returns both ordered by score desc
    - `test_list_filter_by_difficulty` — create easy + hard entry, GET `?difficulty=easy` returns only easy
    - `test_list_limit` — create 15 entries, GET `?limit=10` returns at most 10

### Step 16: Write frontend unit tests
- Create `frontend/tests/islands/pong/PongIsland.test.tsx`:
  - Test `LeaderboardPanel` renders entries correctly (rank, player name, score)
  - Test `LeaderboardPanel` shows "No scores yet" empty state
  - Test `LeaderboardPanel` difficulty tabs filter entries correctly
  - Test `LeaderboardPanel` highlights the entry matching `lastSubmittedId`
  - Test `gameEngine.createInitialState('medium')` returns ball centred, scores at 0, phase `'idle'`
  - Test `gameEngine.tick` moves the ball (ball position changes after one tick)
  - Test `gameEngine.tick` clamps player paddle to canvas bounds (Y < 0 → clamped to 0)
  - Test `gameEngine.checkWin` returns `'player'` when `playerScore === MAX_SCORE`
  - Test `gameEngine.checkWin` returns `'ai'` when `aiScore === MAX_SCORE`
  - Test `gameEngine.checkWin` returns `null` when neither score reaches `MAX_SCORE`

### Step 17: Add home page navigation link
- In `src/app/templates/hello/index.html`, add a styled link in the footer to `/pong`:
  - Something like: `<a href="/pong" class="font-medium text-indigo-600 hover:text-indigo-800">🎮 Play Pong</a>`

### Step 18: Run all validation commands
- Run `PYTHONPATH=src pytest tests/` — all backend tests pass.
- Run `cd frontend && npm test` — all vitest tests pass.
- Run `script/typecheck` — mypy + tsc pass with no errors.
- Run `script/lint` — flake8 + eslint pass.
- Run `npx playwright test` — all E2E tests pass.

---

## Testing Strategy

### Unit Tests
- **Backend** (`tests/test_leaderboard.py`): test all `GET /api/leaderboard` and `POST /api/leaderboard` paths including validation errors, filtering, and ordering.
- **Frontend** (`frontend/tests/islands/pong/PongIsland.test.tsx`): test `LeaderboardPanel` rendering with/without data; test `gameEngine` pure functions for correctness without a DOM or canvas.

### Edge Cases
- Submitting a score of 0 is **blocked at the UI level** (`playerScore >= 1` required to see the submit form). The backend still accepts score=0 via direct API calls — this is intentional (no need for extra server-side business logic validation beyond `ge=0`).
- Score submission when `player_name` is whitespace-only — backend rejects with 400 because `StringConstraints(strip_whitespace=True, min_length=1)` strips before checking length.
- Player clicks "Skip" on the submit-score screen — transitions to `done` phase without POSTing; `lastSubmittedId` remains null; leaderboard is unchanged.
- Difficulty filter with no entries for that difficulty — leaderboard panel shows "No scores yet" gracefully.
- Ball corner collisions (simultaneous top/bottom wall and paddle contact) — `reflectBallOnPaddle` must handle without NaN velocity; add a guard to clamp resulting speed.
- Rapid key presses causing paddle to exceed canvas bounds — clamp `playerPaddleYRef.current` to `[0, CANVAS_HEIGHT - PADDLE_HEIGHT]` inside the keyboard handler.
- The `requestAnimationFrame` callback must use the functional `setGameState(prev => tick(prev, ref.current))` form to avoid stale closure issues; do NOT capture `gameState` directly in the RAF callback.
- Multiple rapid POSTs to `/api/leaderboard` — each creates a separate entry (raw log); no deduplication needed.
- The leaderboard pre-loaded on `GET /pong` contains up to 30 entries (10 per difficulty). The island filters client-side; the `fetchLeaderboard` call only refreshes the active difficulty tab after a submission.

---

## Acceptance Criteria
1. Navigating to `/pong` renders the page without errors (200 status, contains `data-island="pong"`).
2. The Pong canvas is visible and the difficulty-select screen is shown on initial load.
3. The game starts (ball moves, AI tracks ball) immediately after selecting a difficulty.
4. The player paddle responds to mouse movement over the canvas and to `ArrowUp`/`ArrowDown`/`W`/`S` keyboard keys.
5. The score increments when the ball passes a paddle; the game ends when one side reaches 5 points.
6. After the game, the submit-score form is shown **only if the player scored at least 1 point**; otherwise the done screen is shown directly.
7. The submit form has a "Skip" button that proceeds to the done screen without submitting.
8. Submitted scores appear in the leaderboard panel, ordered by score descending, with the new entry highlighted.
9. The leaderboard panel is visible throughout the game (difficulty-select, playing, and done screens).
10. The leaderboard filters correctly by difficulty tab.
11. `GET /api/leaderboard` returns JSON ordered by score desc, supporting `?difficulty` and `?limit` params.
12. `POST /api/leaderboard` rejects invalid difficulty values, missing/whitespace-only player_name, and negative scores with 400 errors.
13. All existing tests (`test_hello.py`, `HelloIsland.test.tsx`, `hello.spec.ts`) continue to pass.
14. `script/typecheck` and `script/lint` pass with zero errors or warnings.

---

## Validation Commands

```bash
# Apply new migration (FLASK_APP must be set — script/setup does this automatically)
export FLASK_APP=src/app:create_app && flask db upgrade

# Or simply re-run setup (recommended — handles env + migrations atomically)
script/setup

# Backend tests (all should pass, including new leaderboard tests)
PYTHONPATH=src pytest tests/ -v

# Frontend unit tests
cd frontend && npm test

# Type checking
script/typecheck

# Linting
script/lint

# E2E tests for pong only (auto-starts dev servers via playwright.config.ts webServer)
npx playwright test e2e/pong.spec.ts --reporter=list

# Full E2E suite (ensure no regressions on hello page)
npx playwright test --reporter=list
```

---

## Notes
- **Game loop ownership**: `PongIsland` is the sole owner of the `requestAnimationFrame` loop and all game state. `PongCanvas` only draws — it has a `useEffect([gameState])` that repaints on each state change. This mirrors the HelloIsland pattern where the island owns all state/effects, and keeps the architecture React-idiomatic.
- **Stale closure trap**: Inside the RAF callback, always use `setGameState(prev => tick(prev, playerPaddleYRef.current))` — never capture the `gameState` variable directly from the enclosing effect scope, or it will be stale after the first frame.
- **Keyboard input ownership**: `PongIsland` manages `document` key listeners (not `PongCanvas`). `PongCanvas` handles only `mousemove` on the canvas element itself. This separation prevents duplicate/conflicting handlers.
- **`Difficulty` type**: defined once in `frontend/src/types/index.ts` and imported everywhere else (including `pong/types.ts`). Do not redefine it.
- **`player_name` validation**: uses Pydantic v2 `StringConstraints(strip_whitespace=True, min_length=1, max_length=50)` via `Annotated`. This correctly rejects whitespace-only names after stripping. Plain `Field(min_length=1)` would NOT reject `" "` (a single space has length 1).
- **Alembic index**: uses plain `columns=['difficulty', 'score']` without DESC ordering — required for SQLite compatibility in `TestingConfig`. PostgreSQL will still use it effectively for descending score queries.
- **Migration generation**: run `flask db migrate -m "create leaderboard entries table"` (with `FLASK_APP` set) after creating the model. The auto-generated file follows the same style as `e31396db40b1`. Then manually add the `op.create_index` call.
- **Leaderboard pre-load**: `GET /pong` queries top 10 per difficulty (3 queries → ≤30 entries total) so each tab has a full 10-entry list on first render. Island fetches only the active difficulty after a score submission.
- **Score submission gate**: submit form only appears when `gameState.playerScore >= 1`. The backend still accepts `score=0` via direct API (for completeness), but the UI never reaches that path for zero scores.
- **No authentication**: player names are self-reported and un-verified. This is intentional for low-friction use.
- **Canvas dimensions**: 800×500 logical pixels; CSS `max-width: 100%` on the canvas wrapper ensures it doesn't overflow on smaller viewports. No touch support — desktop (mouse + keyboard) only.
- Future enhancements: WebSocket multiplayer, per-week leaderboard resets, sound effects, avatar icons.
