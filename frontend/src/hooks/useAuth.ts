import { useEffect, useState } from 'react'
import type { User } from '@/types'
import { getStoredUser, clearAuth, isTokenExpired, setStoredUser, userFromToken } from '@/lib/auth'

interface UseAuthReturn {
  user: User | null
  loading: boolean
  logout: () => void
  refetchUser: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    const token = localStorage.getItem('pabos_access_token')
    if (!token || isTokenExpired(token)) {
      clearAuth()
      setUser(null)
      setLoading(false)
      return
    }

    const stored = getStoredUser()
    if (stored) {
      setUser(stored)
      setLoading(false)
      return
    }

    const derived = userFromToken(token)
    if (derived) {
      setStoredUser(derived)
      setUser(derived)
    } else {
      clearAuth()
      setUser(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const logout = () => {
    clearAuth()
    setUser(null)
    window.location.href = '/login'
  }

  return {
    user,
    loading,
    logout,
    refetchUser: fetchUser,
  }
}
