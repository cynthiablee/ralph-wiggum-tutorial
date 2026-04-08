/**
 * PongCanvas — pure renderer, no game loop, no keyboard handling.
 *
 * Draws the current GameState onto a <canvas> element every time
 * gameState changes. Handles mouse movement on the canvas to report
 * the player's paddle Y position.
 */
import { useRef, useEffect } from 'react'
import type { GameState } from './types'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './types'

interface PongCanvasProps {
  gameState: GameState
  onPlayerMove: (y: number) => void
}

export function PongCanvas({ gameState, onPlayerMove }: PongCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Redraw whenever gameState changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear with black background
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Centre dashed line
    ctx.setLineDash([8, 8])
    ctx.strokeStyle = '#444'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(CANVAS_WIDTH / 2, 0)
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT)
    ctx.stroke()
    ctx.setLineDash([])

    // Player paddle (left, white)
    const pp = gameState.playerPaddle
    ctx.fillStyle = '#fff'
    ctx.fillRect(pp.x, pp.y, pp.width, pp.height)

    // AI paddle (right, white)
    const ap = gameState.aiPaddle
    ctx.fillStyle = '#fff'
    ctx.fillRect(ap.x, ap.y, ap.width, ap.height)

    // Ball (white circle)
    const b = gameState.ball
    ctx.beginPath()
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()

    // Scores
    ctx.font = 'bold 48px monospace'
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.fillText(String(gameState.playerScore), CANVAS_WIDTH / 4, 60)
    ctx.fillText(String(gameState.aiScore), (3 * CANVAS_WIDTH) / 4, 60)

    // Game over overlay
    if (gameState.phase === 'gameOver') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 56px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20)
      ctx.font = '24px sans-serif'
      const winnerText =
        gameState.winner === 'player' ? 'You Win! 🎉' : 'AI Wins 🤖'
      ctx.fillText(winnerText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
    }
  }, [gameState])

  // Mouse move on canvas → report Y position
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function handleMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect()
      const scaleY = CANVAS_HEIGHT / rect.height
      const relativeY = (e.clientY - rect.top) * scaleY
      onPlayerMove(relativeY)
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    return () => canvas.removeEventListener('mousemove', handleMouseMove)
  }, [onPlayerMove])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="w-full max-w-[800px] rounded-lg border border-slate-700 bg-black"
      style={{ aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
    />
  )
}
