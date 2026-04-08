/**
 * Pong Island mount logic.
 *
 * Dynamically imported by main.ts when a [data-island="pong"] element
 * is found in the DOM. Receives pre-loaded leaderboard entries as props.
 */
import { createRoot } from 'react-dom/client'
import { PongIsland } from './PongIsland'
import type { LeaderboardEntry } from '@/types'

/**
 * Mount the PongIsland component into the given element.
 *
 * @param element - DOM element to render into
 * @param props - Initial leaderboard data (LeaderboardEntry[])
 */
export function mount(element: HTMLElement, props: unknown): void {
  element.innerHTML = ''

  const initialLeaderboard = Array.isArray(props)
    ? (props as LeaderboardEntry[])
    : []

  const root = createRoot(element)
  root.render(<PongIsland initialLeaderboard={initialLeaderboard} />)
}
