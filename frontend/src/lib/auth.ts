import type { User, Role } from '@/types'

interface JwtPayload {
  userId: string
  email: string
  organisationId: string
  branchId?: string
  roles: string[]
  permissions: string[]
  exp: number
}

export function parseJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    )
    return JSON.parse(jsonPayload) as JwtPayload
  } catch {
    return null
  }
}

export function userFromToken(token: string): User | null {
  const payload = parseJwt(token)
  if (!payload) return null
  const [firstName = '', lastName = ''] = payload.email.split('@')[0].split('.')
  return {
    id: payload.userId,
    email: payload.email,
    firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
    lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1),
    organisationId: payload.organisationId,
    branchId: payload.branchId,
    roles: payload.roles.map((role): Role => ({ id: role, name: role })),
    permissions: payload.permissions,
  }
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem('pabos_user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function setStoredUser(user: User): void {
  localStorage.setItem('pabos_user', JSON.stringify(user))
}

export function clearAuth(): void {
  localStorage.removeItem('pabos_access_token')
  localStorage.removeItem('pabos_refresh_token')
  localStorage.removeItem('pabos_user')
}

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false
  return user.permissions.includes(permission) || user.permissions.includes('*')
}

export function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token)
  if (!payload) return true
  return payload.exp * 1000 < Date.now()
}
