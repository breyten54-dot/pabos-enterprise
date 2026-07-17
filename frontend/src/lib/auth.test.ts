import { describe, it, expect, beforeEach } from 'vitest'
import {
  parseJwt,
  userFromToken,
  getStoredUser,
  setStoredUser,
  clearAuth,
  hasPermission,
  isTokenExpired,
} from './auth'
import type { User } from '@/types'

function makeToken(payload: Record<string, unknown>) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.signature`
}

describe('auth', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('parseJwt', () => {
    it('returns payload for a valid token', () => {
      const payload = {
        userId: 'u1',
        email: 'admin@praeto.co.za',
        organisationId: 'o1',
        roles: ['admin'],
        permissions: ['*'],
        exp: 9999999999,
      }
      const result = parseJwt(makeToken(payload))
      expect(result).toMatchObject(payload)
    })

    it('returns null for a malformed token', () => {
      expect(parseJwt('not-a-token')).toBeNull()
    })
  })

  describe('userFromToken', () => {
    it('builds a User from token payload', () => {
      const token = makeToken({
        userId: 'u1',
        email: 'john.doe@praeto.co.za',
        organisationId: 'o1',
        branchId: 'b1',
        roles: ['advisor'],
        permissions: ['client:read'],
        exp: 9999999999,
      })
      const user = userFromToken(token)
      expect(user).not.toBeNull()
      expect(user?.id).toBe('u1')
      expect(user?.email).toBe('john.doe@praeto.co.za')
      expect(user?.firstName).toBe('John')
      expect(user?.lastName).toBe('Doe')
      expect(user?.permissions).toContain('client:read')
    })

    it('returns null for an invalid token', () => {
      expect(userFromToken('invalid')).toBeNull()
    })
  })

  describe('localStorage helpers', () => {
    it('stores and retrieves a user', () => {
      const user: User = {
        id: 'u1',
        email: 'a@b.c',
        firstName: 'A',
        lastName: 'B',
        organisationId: 'o1',
        roles: [],
        permissions: [],
      }
      setStoredUser(user)
      expect(getStoredUser()).toEqual(user)
    })

    it('returns null when no user is stored', () => {
      expect(getStoredUser()).toBeNull()
    })

    it('clears all auth keys', () => {
      localStorage.setItem('pabos_access_token', 't')
      localStorage.setItem('pabos_refresh_token', 'r')
      setStoredUser({ id: 'u1', email: 'a@b.c', firstName: 'A', lastName: 'B', organisationId: 'o1', roles: [], permissions: [] })
      clearAuth()
      expect(localStorage.getItem('pabos_access_token')).toBeNull()
      expect(localStorage.getItem('pabos_refresh_token')).toBeNull()
      expect(localStorage.getItem('pabos_user')).toBeNull()
    })
  })

  describe('hasPermission', () => {
    it('returns true when permission is present', () => {
      const user: User = { id: 'u1', email: 'a@b.c', firstName: 'A', lastName: 'B', organisationId: 'o1', roles: [], permissions: ['client:read'] }
      expect(hasPermission(user, 'client:read')).toBe(true)
    })

    it('returns true for wildcard permission', () => {
      const user: User = { id: 'u1', email: 'a@b.c', firstName: 'A', lastName: 'B', organisationId: 'o1', roles: [], permissions: ['*'] }
      expect(hasPermission(user, 'client:delete')).toBe(true)
    })

    it('returns false when user is null or permission missing', () => {
      expect(hasPermission(null, 'client:read')).toBe(false)
      const user: User = { id: 'u1', email: 'a@b.c', firstName: 'A', lastName: 'B', organisationId: 'o1', roles: [], permissions: [] }
      expect(hasPermission(user, 'client:read')).toBe(false)
    })
  })

  describe('isTokenExpired', () => {
    it('returns true for an expired token', () => {
      const token = makeToken({ exp: Math.floor(Date.now() / 1000) - 10 })
      expect(isTokenExpired(token)).toBe(true)
    })

    it('returns false for a non-expired token', () => {
      const token = makeToken({ exp: Math.floor(Date.now() / 1000) + 3600 })
      expect(isTokenExpired(token)).toBe(false)
    })

    it('returns true for an invalid token', () => {
      expect(isTokenExpired('bad-token')).toBe(true)
    })
  })
})
