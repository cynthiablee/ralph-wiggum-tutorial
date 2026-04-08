/**
 * Pong frontend unit tests.
 *
 * Tests game engine pure functions and LeaderboardPanel component.
 * Game engine tests verify physics, scoring, and win detection
 * without needing a DOM or canvas — they're pure function tests.
 * LeaderboardPanel tests verify rendering, filtering, and highlighting.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import {
  createInitialState,
  tick,
  checkWin,
} from '@/islands/pong/gameEngine'
import { LeaderboardPanel } from '@/islands/pong/LeaderboardPanel'
import { CANVAS_HEIGHT, PADDLE_HEIGHT, MAX_SCORE } from '@/islands/pong/types'
import type { GameState } from '@/islands/pong/types'
import type { LeaderboardEntry } from '@/types'

// ──────────────────────────────────────────────────────
// Game Engine Tests
// ──────────────────────────────────────────────────────

describe('gameEngine.createInitialState', () => {
  it('returns ball centred with scores at 0 and phase playing', () => {
    const state = createInitialState('medium')
    expect(state.ball.x).toBe(400) // CANVAS_WIDTH / 2
    expect(state.ball.y).toBe(250) // CANVAS_HEIGHT / 2
    expect(state.playerScore).toBe(0)
    expect(state.aiScore).toBe(0)
    expect(state.phase).toBe('playing')
    expect(state.winner).toBeNull()
  })
})

describe('gameEngine.tick', () => {
  it('moves the ball after one tick', () => {
    const state = createInitialState('medium')
    const next = tick(state, state.playerPaddle.y)
    // Ball should have moved from its initial position
    expect(
      next.ball.x !== state.ball.x || next.ball.y !== state.ball.y
    ).toBe(true)
  })

  it('clamps player paddle to canvas bounds (Y < 0 → 0)', () => {
    const state = createInitialState('medium')
    const next = tick(state, -100)
    expect(next.playerPaddle.y).toBe(0)
  })

  it('clamps player paddle to canvas bounds (Y too large)', () => {
    const state = createInitialState('medium')
    const next = tick(state, CANVAS_HEIGHT + 100)
    expect(next.playerPaddle.y).toBe(CANVAS_HEIGHT - PADDLE_HEIGHT)
  })
})

describe('gameEngine.checkWin', () => {
  function makeState(playerScore: number, aiScore: number): GameState {
    const state = createInitialState('medium')
    return { ...state, playerScore, aiScore }
  }

  it('returns "player" when playerScore === MAX_SCORE', () => {
    expect(checkWin(makeState(MAX_SCORE, 2))).toBe('player')
  })

  it('returns "ai" when aiScore === MAX_SCORE', () => {
    expect(checkWin(makeState(1, MAX_SCORE))).toBe('ai')
  })

  it('returns null when neither score reaches MAX_SCORE', () => {
    expect(checkWin(makeState(3, 2))).toBeNull()
  })
})

// ──────────────────────────────────────────────────────
// LeaderboardPanel Tests
// ──────────────────────────────────────────────────────

const sampleEntries: LeaderboardEntry[] = [
  { id: 1, player_name: 'Alice', score: 5, difficulty: 'medium', created_at: '2026-01-01T00:00:00' },
  { id: 2, player_name: 'Bob', score: 3, difficulty: 'medium', created_at: '2026-01-01T00:00:00' },
  { id: 3, player_name: 'Carol', score: 4, difficulty: 'easy', created_at: '2026-01-01T00:00:00' },
]

describe('LeaderboardPanel', () => {
  it('renders entries correctly (rank, player name, score)', () => {
    render(
      <LeaderboardPanel
        entries={sampleEntries}
        activeDifficulty="medium"
        onDifficultyChange={() => {}}
        lastSubmittedId={null}
      />
    )
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    // Carol is easy, not medium — should not appear
    expect(screen.queryByText('Carol')).not.toBeInTheDocument()
  })

  it('shows "No scores yet" when filtered list is empty', () => {
    render(
      <LeaderboardPanel
        entries={sampleEntries}
        activeDifficulty="hard"
        onDifficultyChange={() => {}}
        lastSubmittedId={null}
      />
    )
    expect(screen.getByText(/no scores yet/i)).toBeInTheDocument()
  })

  it('filters entries by difficulty tabs', async () => {
    const user = userEvent.setup()
    let activeDiff = 'medium' as string

    const { rerender } = render(
      <LeaderboardPanel
        entries={sampleEntries}
        activeDifficulty="medium"
        onDifficultyChange={(d) => { activeDiff = d }}
        lastSubmittedId={null}
      />
    )

    // Click "easy" tab
    await user.click(screen.getByRole('button', { name: /easy/i }))
    expect(activeDiff).toBe('easy')

    // Re-render with easy filter
    rerender(
      <LeaderboardPanel
        entries={sampleEntries}
        activeDifficulty="easy"
        onDifficultyChange={(d) => { activeDiff = d }}
        lastSubmittedId={null}
      />
    )

    expect(screen.getByText('Carol')).toBeInTheDocument()
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
  })

  it('highlights the entry matching lastSubmittedId', () => {
    render(
      <LeaderboardPanel
        entries={sampleEntries}
        activeDifficulty="medium"
        onDifficultyChange={() => {}}
        lastSubmittedId={2}
      />
    )
    // Bob's row (id=2) should have the highlight class
    const bobRow = screen.getByText('Bob').closest('tr')
    expect(bobRow?.className).toContain('bg-indigo-50')
  })
})
