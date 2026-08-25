import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Login } from './Login'
import { renderWithProviders } from '@/test/utils'

const navigateMock = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

const postMock = vi.fn()
vi.mock('@/lib/api', () => ({
  default: {
    post: (...args: unknown[]) => postMock(...args),
  },
}))

function renderLogin() {
  return renderWithProviders(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  )
}

describe('Login', () => {
  beforeEach(() => {
    postMock.mockReset()
    navigateMock.mockReset()
    localStorage.clear()
  })

  it('shows the MFA step when the backend requires a TOTP challenge', async () => {
    postMock.mockResolvedValueOnce({
      data: { mfaRequired: true, requiresMfa: true, userId: 'user-1' },
    })
    renderLogin()

    await userEvent.type(screen.getByLabelText(/Email/i), 'admin@praeto.local')
    await userEvent.type(screen.getByLabelText(/Password/i), 'password12')
    await userEvent.click(screen.getByRole('button', { name: /Sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/MFA required/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Authenticator code/i)).toBeInTheDocument()
    })
    expect(navigateMock).not.toHaveBeenCalled()
    expect(localStorage.getItem('pabos_access_token')).toBeNull()
  })

  it('posts totpCode on the second login and stores tokens', async () => {
    postMock
      .mockResolvedValueOnce({
        data: { mfaRequired: true, requiresMfa: true, userId: 'user-1' },
      })
      .mockResolvedValueOnce({
        data: {
          mfaRequired: false,
          requiresMfa: false,
          accessToken: 'header.eyJ1c2VySWQiOiJ1MSIsImVtYWlsIjoiYSIsIm9yZ2FuaXNhdGlvbklkIjoibzEiLCJyb2xlcyI6W10sInBlcm1pc3Npb25zIjpbXSwiZXhwIjo5OTk5OTk5OTk5fQ.sig',
          refreshToken: 'refresh',
        },
      })

    renderLogin()
    await userEvent.type(screen.getByLabelText(/Email/i), 'admin@praeto.local')
    await userEvent.type(screen.getByLabelText(/Password/i), 'password12')
    await userEvent.click(screen.getByRole('button', { name: /Sign in/i }))
    await screen.findByLabelText(/Authenticator code/i)
    await userEvent.type(screen.getByLabelText(/Authenticator code/i), '123456')
    await userEvent.click(screen.getByRole('button', { name: /Verify and sign in/i }))

    await waitFor(() => {
      expect(postMock).toHaveBeenLastCalledWith('/auth/login', {
        email: 'admin@praeto.local',
        password: 'password12',
        totpCode: '123456',
      })
      expect(navigateMock).toHaveBeenCalledWith('/clients')
    })
  })
})
