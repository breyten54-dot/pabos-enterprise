import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useAuth } from './useAuth'

function makeToken(payload: Record<string, unknown>) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.signature`
}

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('restores user from stored user when token is valid', async () => {
    const token = makeToken({
      userId: 'u1',
      email: 'jane.doe@praeto.co.za',
      organisationId: 'o1',
      roles: ['advisor'],
      permissions: ['client:read'],
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
    localStorage.setItem('pabos_access_token', token)
    localStorage.setItem(
      'pabos_user',
      JSON.stringify({
        id: 'u1',
        email: 'jane.doe@praeto.co.za',
        firstName: 'Jane',
        lastName: 'Doe',
        organisationId: 'o1',
        roles: [{ id: 'advisor', name: 'advisor' }],
        permissions: ['client:read'],
      }),
    )

    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.user).not.toBeNull()
    expect(result.current.user?.firstName).toBe('Jane')
  })

  it('clears auth and sets user to null when token is expired', async () => {
    const token = makeToken({
      userId: 'u1',
      email: 'a@b.c',
      organisationId: 'o1',
      roles: [],
      permissions: [],
      exp: Math.floor(Date.now() / 1000) - 10,
    })
    localStorage.setItem('pabos_access_token', token)

    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.user).toBeNull()
    expect(localStorage.getItem('pabos_access_token')).toBeNull()
  })

  it('sets user to null when no token exists', async () => {
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user).toBeNull()
  })

  it('logout clears auth and redirects to login', async () => {
    const token = makeToken({
      userId: 'u1',
      email: 'a@b.c',
      organisationId: 'o1',
      roles: [],
      permissions: [],
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
    localStorage.setItem('pabos_access_token', token)

    // jsdom's window.location is read-only; replace it with a writable stub for this test.
    const originalLocation = window.location
    // @ts-expect-error — deleting a built-in is safe in this jsdom test context
    delete window.location
    const hrefStub = vi.fn()
    // @ts-expect-error — jsdom stub assignment; window.location is typed string & Location
    window.location = { ...originalLocation, href: '' } as unknown as Location
    Object.defineProperty(window.location, 'href', { set: hrefStub, get: () => '' })

    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.logout()
    })

    expect(localStorage.getItem('pabos_access_token')).toBeNull()
    expect(hrefStub).toHaveBeenCalledWith('/login')

    // @ts-expect-error — restoring the real Location (typed string & Location)
    window.location = originalLocation
  })
})
