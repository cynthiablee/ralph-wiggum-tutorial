/**
 * LeaderboardPanel — displays top-10 scores with difficulty filter tabs.
 *
 * Always visible alongside the game. Highlights the row matching
 * lastSubmittedId so the player can spot their new entry.
 */
import type { Difficulty, LeaderboardEntry } from '@/types'

interface LeaderboardPanelProps {
  entries: LeaderboardEntry[]
  activeDifficulty: Difficulty
  onDifficultyChange: (d: Difficulty) => void
  lastSubmittedId: number | null
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

export function LeaderboardPanel({
  entries,
  activeDifficulty,
  onDifficultyChange,
  lastSubmittedId,
}: LeaderboardPanelProps) {
  const filtered = entries
    .filter((e) => e.difficulty === activeDifficulty)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  return (
    <div className="w-full lg:w-72 shrink-0">
      <h2 className="text-lg font-bold text-slate-900 mb-3">🏆 Leaderboard</h2>

      {/* Difficulty tabs */}
      <div className="flex gap-1 mb-4">
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            onClick={() => onDifficultyChange(d)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg capitalize transition-colors ${
              d === activeDifficulty
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Entries table */}
      {filtered.length === 0 ? (
        <p className="text-slate-400 text-sm italic py-4">No scores yet</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 text-left border-b border-slate-200">
              <th className="pb-2 w-8">#</th>
              <th className="pb-2">Player</th>
              <th className="pb-2 text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, idx) => {
              const isHighlighted = entry.id === lastSubmittedId
              return (
                <tr
                  key={entry.id}
                  className={`border-b border-slate-100 ${
                    isHighlighted
                      ? 'bg-indigo-50 font-bold text-indigo-700'
                      : 'text-slate-700'
                  }`}
                >
                  <td className="py-1.5">{idx + 1}</td>
                  <td className="py-1.5 truncate max-w-[120px]">
                    {entry.player_name}
                  </td>
                  <td className="py-1.5 text-right">{entry.score}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
