/**
 * Shared TypeScript types for the application.
 *
 * These types are used across islands, components, and API interactions.
 * Difficulty is the canonical definition — import it everywhere, never redefine.
 */

/**
 * Hello record from the API.
 */
export interface Hello {
  id: number
  message: string
  created_at: string
}

/**
 * Request payload for creating a new Hello.
 */
export interface HelloCreate {
  message: string
}

/**
 * Generic API error response.
 */
export interface ApiError {
  error: string
  message: string
  details?: Record<string, unknown>[]
}

/**
 * Props passed to islands via data-props attribute.
 * Each island receives its initial data from the server.
 */
export type IslandProps<T = unknown> = {
  initialData?: T
}

/**
 * Game difficulty level — single source of truth.
 * Import from here everywhere; never redefine.
 */
export type Difficulty = 'easy' | 'medium' | 'hard'

/**
 * Leaderboard entry from the API.
 */
export interface LeaderboardEntry {
  id: number
  player_name: string
  score: number
  difficulty: Difficulty
  created_at: string
}

/**
 * Request payload for creating a leaderboard entry.
 */
export interface LeaderboardCreate {
  player_name: string
  score: number
  difficulty: Difficulty
}
