import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NewClient } from './NewClient'
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

describe('NewClient', () => {
  beforeEach(() => {
    postMock.mockReset()
    navigateMock.mockReset()
  })

  it('renders the new client form', () => {
    renderWithProviders(<NewClient />)
    expect(screen.getByRole('heading', { name: /New Client/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
  })

  it('shows validation errors for required fields', async () => {
    renderWithProviders(<NewClient />)
    const submitButton = screen.getByRole('button', { name: /Save Client/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/First name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Last name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Consent is required under POPIA/i)).toBeInTheDocument()
    })
  })

  it('submits the backend payload in the expected shape on success', async () => {
    postMock.mockResolvedValue({ data: { id: 'client-1' } })
    renderWithProviders(<NewClient />)

    await userEvent.type(screen.getByLabelText(/First Name/i), 'Jane')
    await userEvent.type(screen.getByLabelText(/Last Name/i), 'Doe')
    await userEvent.type(screen.getByLabelText(/Email/i), 'jane@example.com')
    await userEvent.type(screen.getByLabelText(/Phone/i), '0821234567')
    await userEvent.click(screen.getByLabelText(/consents to the lawful processing/i))
    await userEvent.click(screen.getByRole('button', { name: /Save Client/i }))

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith('/clients', {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '0821234567',
        idNumber: '',
        consent: true,
        type: 'INDIVIDUAL',
        idType: 'RSA_ID',
        consentGranted: true,
        consentPurpose: 'MARKETING',
      })
    })

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/clients'))
  })

  it('shows an error message when the submission fails', async () => {
    postMock.mockRejectedValue(new Error('Network error'))
    renderWithProviders(<NewClient />)

    await userEvent.type(screen.getByLabelText(/First Name/i), 'Jane')
    await userEvent.type(screen.getByLabelText(/Last Name/i), 'Doe')
    await userEvent.click(screen.getByLabelText(/consents to the lawful processing/i))
    await userEvent.click(screen.getByRole('button', { name: /Save Client/i }))

    await waitFor(() => {
      expect(screen.getByText(/Failed to create client/i)).toBeInTheDocument()
    })
  })
})
