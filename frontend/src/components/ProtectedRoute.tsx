import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { hasPermission } from '@/lib/auth'

interface ProtectedRouteProps {
  permission: string
  children: React.ReactNode
}

export function ProtectedRoute({ permission, children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy">
        <div className="text-gold">Loading…</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!hasPermission(user, permission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy">
        <div className="card text-center max-w-md">
          <h1 className="text-xl font-semibold text-gold mb-2">Access Denied</h1>
          <p className="text-slate-300">You do not have permission to view this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
