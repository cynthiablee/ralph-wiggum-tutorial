/**
 * HelloIsland component tests.
 *
 * Tests the greeting island's core functionality:
 * - Rendering with initial data
 * - Displaying empty state
 * - Form interaction
 *
 * The component renders a message board about AI and CS education,
 * so assertions match the actual UI text (not the old "greeting" wording).
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HelloIsland } from '@/islands/hello/HelloIsland'

describe('HelloIsland', () => {
  it('renders empty state when no data provided', () => {
    render(<HelloIsland />)
    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument()
  })

  it('renders initial data', () => {
    const initialData = [
      { id: 1, message: 'Hello World', created_at: '2024-01-01T00:00:00' },
    ]
    render(<HelloIsland initialData={initialData} />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('renders input field and post button', () => {
    render(<HelloIsland />)
    expect(screen.getByPlaceholderText(/share a thought/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /post/i })).toBeInTheDocument()
  })

  it('disables post button when input is empty', () => {
    render(<HelloIsland />)
    const button = screen.getByRole('button', { name: /post/i })
    expect(button).toBeDisabled()
  })
})
