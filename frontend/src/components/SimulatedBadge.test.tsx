import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SimulatedBadge } from './SimulatedBadge'

describe('SimulatedBadge', () => {
  it('renders the simulated pill and default note in non-production environments', () => {
    render(<SimulatedBadge />)
    expect(screen.getByText(/Simulated/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Shown for demonstration only/i),
    ).toBeInTheDocument()
  })

  it('renders a custom note when provided', () => {
    render(<SimulatedBadge note="AI output is mocked for the demo." />)
    expect(screen.getByText(/AI output is mocked/i)).toBeInTheDocument()
  })

  it('does not render in production', () => {
    vi.stubEnv('PROD', 'true')
    const { container } = render(<SimulatedBadge />)
    expect(container.firstChild).toBeNull()
    vi.unstubAllEnvs()
  })
})
