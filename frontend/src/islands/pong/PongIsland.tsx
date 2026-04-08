/**
 * PongIsland — root island component.
 *
 * Owns the game loop (RAF), all game state, keyboard input, and API calls.
 * PongCanvas is a pure renderer; LeaderboardPanel shows scores.
 *
 * Two separate useEffects for the game loop:
 *  - Effect 1 (RAF): runs the tick loop using functional setState to
 *    avoid stale closures.
 *  - Effect 2 (game-over watcher): watches gameState.phase to transition
 *    uiPhase after the game ends.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import type { Difficulty, LeaderboardEntry, LeaderboardCreate } from '@/types'
import type { GameState } from './types'
import { CANVAS_HEIGHT, PADDLE_HEIGHT } from './types'
import { createInitialState, tick } from './gameEngine'
import { PongCanvas } from './PongCanvas'
import { LeaderboardPanel } from './LeaderboardPanel'

type UiPhase = 'difficulty-select' | 'playing' | 'submit-score' | 'done'

interface PongIslandProps {
  initialLeaderboard: LeaderboardEntry[]
}

const KEYBOARD_DELTA = 20

export function PongIsland({ initialLeaderboard }: PongIslandProps) {
  const [gameState, setGameState] = useState<GameState>(
    () => createInitialState('medium')
  )
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [uiPhase, setUiPhase] = useState<UiPhase>('difficulty-select')
  const [playerName, setPlayerName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [leaderboard, setLeaderboard] =
    useState<LeaderboardEntry[]>(initialLeaderboard)
  const [leaderboardDifficulty, setLeaderboardDifficulty] =
    useState<Difficulty>('medium')
  const [lastSubmittedId, setLastSubmittedId] = useState<number | null>(null)

  // Ref for player paddle Y — updated by mouse/keyboard without triggering renders
  const playerPaddleYRef = useRef(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2)

  const onPlayerMove = useCallback((y: number) => {
    playerPaddleYRef.current = Math.max(
      0,
      Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, y - PADDLE_HEIGHT / 2)
    )
  }, [])

  // Keyboard input — mounted once
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowUp' || e.key === 'w') {
        playerPaddleYRef.current = Math.max(
          0,
          playerPaddleYRef.current - KEYBOARD_DELTA
        )
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        playerPaddleYRef.current = Math.min(
          CANVAS_HEIGHT - PADDLE_HEIGHT,
          playerPaddleYRef.current + KEYBOARD_DELTA
        )
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Effect 1: RAF game loop — runs when uiPhase === 'playing'
  useEffect(() => {
    if (uiPhase !== 'playing') return

    let rafId: number
    function loop() {
      setGameState((prev) => tick(prev, playerPaddleYRef.current))
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [uiPhase])

  // Effect 2: game-over watcher
  useEffect(() => {
    if (gameState.phase === 'gameOver') {
      if (gameState.playerScore >= 1) {
        setUiPhase('submit-score')
      } else {
        setUiPhase('done')
      }
    }
  }, [gameState.phase, gameState.playerScore])

  function handleStartGame(d: Difficulty) {
    setDifficulty(d)
    const state = createInitialState(d)
    setGameState(state)
    playerPaddleYRef.current = state.playerPaddle.y
    setUiPhase('playing')
    setLastSubmittedId(null)
    setSubmitError(null)
    setPlayerName('')
  }

  async function fetchLeaderboard(d: Difficulty) {
    try {
      const res = await fetch(`/api/leaderboard?difficulty=${d}&limit=10`)
      if (!res.ok) return
      const data: LeaderboardEntry[] = await res.json()
      setLeaderboard((prev) => {
        const other = prev.filter((e) => e.difficulty !== d)
        return [...other, ...data]
      })
    } catch {
      // silently ignore fetch errors for leaderboard refresh
    }
  }

  async function handleSubmitScore(e: React.FormEvent) {
    e.preventDefault()
    if (!playerName.trim()) return

    setSubmitting(true)
    setSubmitError(null)

    const payload: LeaderboardCreate = {
      player_name: playerName.trim(),
      score: gameState.playerScore,
      difficulty,
    }

    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to submit score')
      }

      const created: LeaderboardEntry = await res.json()
      setLastSubmittedId(created.id)
      await fetchLeaderboard(difficulty)
      setLeaderboardDifficulty(difficulty)
      setUiPhase('done')
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Something went wrong'
      )
    } finally {
      setSubmitting(false)
    }
  }

  function handlePlayAgain() {
    setUiPhase('difficulty-select')
    setLastSubmittedId(null)
    setSubmitError(null)
    setPlayerName('')
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Game area */}
      <div className="flex-1 min-w-0">
        {uiPhase === 'difficulty-select' && (
          <div className="flex flex-col items-center justify-center bg-slate-900 rounded-lg p-12 text-white min-h-[500px]">
            <h2 className="text-3xl font-bold mb-2">🏓 Ready to Play?</h2>
            <p className="text-slate-400 mb-8">
              Choose your difficulty level
            </p>
            <div className="flex gap-4">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => handleStartGame(d)}
                  className={`px-6 py-3 rounded-xl font-semibold text-lg capitalize transition-colors ${
                    d === 'easy'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : d === 'medium'
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {uiPhase === 'playing' && (
          <PongCanvas gameState={gameState} onPlayerMove={onPlayerMove} />
        )}

        {uiPhase === 'submit-score' && (
          <div className="flex flex-col items-center justify-center bg-slate-900 rounded-lg p-12 text-white min-h-[500px]">
            <h2 className="text-3xl font-bold mb-2">
              {gameState.winner === 'player' ? '🎉 You Win!' : '🤖 AI Wins'}
            </h2>
            <p className="text-slate-400 mb-2">
              Final Score: {gameState.playerScore} – {gameState.aiScore}
            </p>
            <p className="text-slate-500 mb-6 text-sm capitalize">
              Difficulty: {difficulty}
            </p>

            <form
              onSubmit={handleSubmitScore}
              className="flex flex-col items-center gap-3 w-full max-w-xs"
            >
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={50}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={submitting}
              />
              {submitError && (
                <p className="text-rose-400 text-sm">{submitError}</p>
              )}
              <button
                type="submit"
                disabled={submitting || !playerName.trim()}
                className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Submitting…' : 'Submit Score'}
              </button>
              <button
                type="button"
                onClick={() => setUiPhase('done')}
                className="text-slate-400 hover:text-white text-sm transition-colors"
                disabled={submitting}
              >
                Skip
              </button>
            </form>
          </div>
        )}

        {uiPhase === 'done' && (
          <div className="flex flex-col items-center justify-center bg-slate-900 rounded-lg p-12 text-white min-h-[500px]">
            <h2 className="text-3xl font-bold mb-2">
              {gameState.winner === 'player' ? '🎉 You Win!' : '🤖 AI Wins'}
            </h2>
            <p className="text-slate-400 mb-6">
              Final Score: {gameState.playerScore} – {gameState.aiScore}
            </p>
            <button
              onClick={handlePlayAgain}
              className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Leaderboard — always visible */}
      <LeaderboardPanel
        entries={leaderboard}
        activeDifficulty={leaderboardDifficulty}
        onDifficultyChange={setLeaderboardDifficulty}
        lastSubmittedId={lastSubmittedId}
      />
    </div>
  )
}
