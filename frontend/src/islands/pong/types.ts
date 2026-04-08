/**
 * Pong-specific TypeScript types.
 *
 * Game state, physics objects, and phase management.
 * Difficulty is imported from the shared types (single source of truth).
 */
import type { Difficulty } from '@/types'

export type { Difficulty }

export interface Ball {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

export interface Paddle {
  x: number
  y: number
  width: number
  height: number
  speed: number
}

export type GamePhase = 'idle' | 'playing' | 'gameOver'

export interface GameState {
  ball: Ball
  playerPaddle: Paddle
  aiPaddle: Paddle
  playerScore: number
  aiScore: number
  phase: GamePhase
  winner: 'player' | 'ai' | null
}

export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 500
export const MAX_SCORE = 5
export const PADDLE_WIDTH = 12
export const PADDLE_HEIGHT = 80
export const BALL_RADIUS = 8
export const MAX_BALL_SPEED = 14
export const PADDLE_MARGIN = 20
