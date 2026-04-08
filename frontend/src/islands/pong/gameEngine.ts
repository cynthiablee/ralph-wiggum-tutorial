/**
 * Pong game engine — pure functions with no side effects.
 *
 * All game logic lives here so it can be unit-tested without a DOM or canvas.
 * The game loop (RAF) and React state live in PongIsland; this module only
 * computes the next state given the current state and player input.
 */
import type { Difficulty } from '@/types'
import type { GameState, Ball, Paddle } from './types'
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MAX_SCORE,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  BALL_RADIUS,
  MAX_BALL_SPEED,
  PADDLE_MARGIN,
} from './types'

const AI_SPEEDS: Record<Difficulty, number> = {
  easy: 3,
  medium: 5,
  hard: 8,
}

const INITIAL_BALL_SPEED = 5

/**
 * Create a fresh game state for the given difficulty.
 */
export function createInitialState(difficulty: Difficulty): GameState {
  const aiSpeed = AI_SPEEDS[difficulty]
  return {
    ball: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      vx: INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
      vy: INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 0.5 : -0.5),
      radius: BALL_RADIUS,
    },
    playerPaddle: {
      x: PADDLE_MARGIN,
      y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      speed: 0, // player speed is irrelevant — controlled by mouse/keyboard
    },
    aiPaddle: {
      x: CANVAS_WIDTH - PADDLE_MARGIN - PADDLE_WIDTH,
      y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
      speed: aiSpeed,
    },
    playerScore: 0,
    aiScore: 0,
    phase: 'playing',
    winner: null,
  }
}

/**
 * Reflect ball off a paddle based on where it hits.
 * Centre hit → straight, edge hit → steep angle.
 * Slightly increases speed on each hit (capped at MAX_BALL_SPEED).
 */
export function reflectBallOnPaddle(ball: Ball, paddle: Paddle): Ball {
  const paddleCentre = paddle.y + paddle.height / 2
  const hitOffset = (ball.y - paddleCentre) / (paddle.height / 2) // -1 to 1
  const clampedOffset = Math.max(-1, Math.min(1, hitOffset))

  const speed = Math.min(
    Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) + 0.5,
    MAX_BALL_SPEED
  )

  const angle = clampedOffset * (Math.PI / 3) // max ±60°
  const direction = ball.vx < 0 ? 1 : -1 // reverse horizontal direction

  const newVx = direction * speed * Math.cos(angle)
  const newVy = speed * Math.sin(angle)

  // Guard against NaN
  if (isNaN(newVx) || isNaN(newVy)) {
    return { ...ball, vx: -ball.vx }
  }

  return { ...ball, vx: newVx, vy: newVy }
}

/**
 * Check if either player has reached MAX_SCORE.
 */
export function checkWin(state: GameState): 'player' | 'ai' | null {
  if (state.playerScore >= MAX_SCORE) return 'player'
  if (state.aiScore >= MAX_SCORE) return 'ai'
  return null
}

/**
 * Advance the game by one frame.
 *
 * Pure function: returns a new GameState without mutating the input.
 * playerPaddleY comes from a ref (mouse/keyboard position).
 */
export function tick(state: GameState, playerPaddleY: number): GameState {
  if (state.phase !== 'playing') return state

  // Clamp player paddle to canvas bounds
  const clampedPlayerY = Math.max(
    0,
    Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, playerPaddleY)
  )

  // Move AI paddle toward ball centre (capped at AI speed)
  const aiTarget = state.ball.y - state.aiPaddle.height / 2
  const aiDiff = aiTarget - state.aiPaddle.y
  const aiMove =
    Math.abs(aiDiff) < state.aiPaddle.speed
      ? aiDiff
      : Math.sign(aiDiff) * state.aiPaddle.speed
  const newAiY = Math.max(
    0,
    Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, state.aiPaddle.y + aiMove)
  )

  // Move ball
  let newBall: Ball = {
    ...state.ball,
    x: state.ball.x + state.ball.vx,
    y: state.ball.y + state.ball.vy,
  }

  // Wall collisions (top/bottom)
  if (newBall.y - newBall.radius <= 0) {
    newBall = { ...newBall, y: newBall.radius, vy: Math.abs(newBall.vy) }
  } else if (newBall.y + newBall.radius >= CANVAS_HEIGHT) {
    newBall = {
      ...newBall,
      y: CANVAS_HEIGHT - newBall.radius,
      vy: -Math.abs(newBall.vy),
    }
  }

  const playerPaddle: Paddle = {
    ...state.playerPaddle,
    y: clampedPlayerY,
  }
  const aiPaddle: Paddle = { ...state.aiPaddle, y: newAiY }

  // Paddle collisions — player (left)
  if (
    newBall.vx < 0 &&
    newBall.x - newBall.radius <= playerPaddle.x + playerPaddle.width &&
    newBall.x - newBall.radius >= playerPaddle.x &&
    newBall.y >= playerPaddle.y &&
    newBall.y <= playerPaddle.y + playerPaddle.height
  ) {
    newBall = reflectBallOnPaddle(newBall, playerPaddle)
    newBall = { ...newBall, x: playerPaddle.x + playerPaddle.width + newBall.radius }
  }

  // Paddle collisions — AI (right)
  if (
    newBall.vx > 0 &&
    newBall.x + newBall.radius >= aiPaddle.x &&
    newBall.x + newBall.radius <= aiPaddle.x + aiPaddle.width &&
    newBall.y >= aiPaddle.y &&
    newBall.y <= aiPaddle.y + aiPaddle.height
  ) {
    newBall = reflectBallOnPaddle(newBall, aiPaddle)
    newBall = { ...newBall, x: aiPaddle.x - newBall.radius }
  }

  // Scoring — ball exits left/right edge
  let { playerScore, aiScore } = state
  let resetBall = false

  if (newBall.x + newBall.radius < 0) {
    // AI scores
    aiScore += 1
    resetBall = true
  } else if (newBall.x - newBall.radius > CANVAS_WIDTH) {
    // Player scores
    playerScore += 1
    resetBall = true
  }

  if (resetBall) {
    newBall = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      vx: INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
      vy: INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 0.5 : -0.5),
      radius: BALL_RADIUS,
    }
  }

  // Check win condition
  const newState: GameState = {
    ball: newBall,
    playerPaddle,
    aiPaddle,
    playerScore,
    aiScore,
    phase: 'playing',
    winner: null,
  }

  const winner = checkWin(newState)
  if (winner) {
    return { ...newState, phase: 'gameOver', winner }
  }

  return newState
}
