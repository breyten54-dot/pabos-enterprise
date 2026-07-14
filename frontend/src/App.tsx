import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Login } from '@/pages/Login'
import { Mfa } from '@/pages/Mfa'
import { Clients } from '@/pages/Clients'
import { NewClient } from '@/pages/NewClient'
import { ClientDetail } from '@/pages/ClientDetail'
import { Policies } from '@/pages/Policies'
import { NewPolicy } from '@/pages/NewPolicy'
import { AddressChange } from '@/pages/AddressChange'
import { AiIntake } from '@/pages/AiIntake'
import { useAuth } from '@/hooks/useAuth'

function AuthenticatedLayout({ children, permission }: { children: React.ReactNode; permission: string }) {
  return (
    <ProtectedRoute permission={permission}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy">
        <div className="text-gold">Loading PABOS…</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/mfa" element={<Mfa />} />

      <Route
        path="/clients"
        element={
          <AuthenticatedLayout permission="client:read">
            <Clients />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/clients/new"
        element={
          <AuthenticatedLayout permission="client:create">
            <NewClient />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/clients/:id"
        element={
          <AuthenticatedLayout permission="client:read">
            <ClientDetail />
          </AuthenticatedLayout>
        }
      />

      <Route
        path="/policies"
        element={
          <AuthenticatedLayout permission="policy:read">
            <Policies />
          </AuthenticatedLayout>
        }
      />
      <Route
        path="/policies/new"
        element={
          <AuthenticatedLayout permission="policy:create">
            <NewPolicy />
          </AuthenticatedLayout>
        }
      />

      <Route
        path="/endorsements/address-change"
        element={
          <AuthenticatedLayout permission="policy:amend">
            <AddressChange />
          </AuthenticatedLayout>
        }
      />

      <Route
        path="/ai-intake"
        element={
          <AuthenticatedLayout permission="ai:use">
            <AiIntake />
          </AuthenticatedLayout>
        }
      />

      <Route path="/" element={<Navigate to="/clients" replace />} />
      <Route path="*" element={<Navigate to="/clients" replace />} />
    </Routes>
  )
}

export default App
