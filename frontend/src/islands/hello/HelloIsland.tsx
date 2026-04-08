/**
 * HelloIsland - Interactive greeting component
 *
 * Demonstrates the islands pattern by:
 * - Receiving initial data from server via data-props
 * - Fetching fresh data from API
 * - Allowing users to add new greetings
 *
 * This island handles its own data fetching and state management,
 * making it self-contained and portable.
 */
import React, { useState, useEffect } from 'react'
import type { Hello, HelloCreate } from '@/types'

interface HelloIslandProps {
  initialData?: Hello[]
}

export function HelloIsland({ initialData = [] }: HelloIslandProps) {
  const [hellos, setHellos] = useState<Hello[]>(initialData)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch fresh data from API on mount
  useEffect(() => {
    fetchHellos()
  }, [])

  async function fetchHellos() {
    try {
      const response = await fetch('/api/hello')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setHellos(data)
    } catch (e) {
      console.error('Failed to fetch hellos:', e)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return

    setLoading(true)
    setError(null)

    try {
      const payload: HelloCreate = { message: message.trim() }
      const response = await fetch('/api/hello', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create')
      }

      const newHello = await response.json()
      setHellos([newHello, ...hellos])
      setMessage('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      const response = await fetch(`/api/hello/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete')
      setHellos(hellos.filter(h => h.id !== id))
    } catch (e) {
      console.error('Failed to delete:', e)
    }
  }

  return (
    <div className="space-y-6">
      {/* Add new message form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share a thought on AI and CS education..."
          className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          disabled={loading}
          maxLength={255}
        />
        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Posting…' : 'Post'}
        </button>
      </form>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Messages list */}
      <div className="space-y-3">
        {hellos.length === 0 ? (
          <p className="text-slate-400 italic text-center py-8">No messages yet — be the first to share a thought!</p>
        ) : (
          hellos.map((hello) => (
            <div
              key={hello.id}
              className="flex items-start justify-between gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 leading-relaxed">{hello.message}</p>
                <p className="text-slate-400 text-xs mt-1">
                  {new Date(hello.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => handleDelete(hello.id)}
                className="shrink-0 text-slate-300 hover:text-rose-500 transition-colors text-sm font-medium"
                aria-label="Delete message"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
