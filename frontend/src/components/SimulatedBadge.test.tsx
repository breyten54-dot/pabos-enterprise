import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SimulatedBadge } from './SimulatedBadge'

describe('SimulatedBadge', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('renders the simulated pill and default note in non-production environments', () => {
    vi.stubEnv('VITE_APP_ENV', 'staging')
    render(<SimulatedBadge />)
    expect(screen.getByText(/Simulated/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Shown for demonstration only/i),
    ).toBeInTheDocument()
  })

  it('renders in development (unset VITE_APP_ENV)', () => {
    render(<SimulatedBadge />)
    expect(screen.getByText(/Simulated/i)).toBeInTheDocument()
  })

  it('renders a custom note when provided', () => {
    render(<SimulatedBadge note="AI output is mocked for the demo." />)
    expect(screen.getByText(/AI output is mocked/i)).toBeInTheDocument()
  })

  it('does not render when VITE_APP_ENV is production', () => {
    vi.stubEnv('VITE_APP_ENV', 'production')
    const { container } = render(<SimulatedBadge />)
    expect(container.firstChild).toBeNull()
  })
})
