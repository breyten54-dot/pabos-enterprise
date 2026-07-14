import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Users,
  FileText,
  MapPin,
  Sparkles,
  LogOut,
  Menu,
  X,
  Building2,
  ChevronDown,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { hasPermission } from '@/lib/auth'

const navItems = [
  { to: '/clients', label: 'Clients', icon: Users, permission: 'client:read' },
  { to: '/policies', label: 'Policies', icon: FileText, permission: 'policy:read' },
  { to: '/endorsements/address-change', label: 'Address Change', icon: MapPin, permission: 'policy:amend' },
  { to: '/ai-intake', label: 'AI Intake', icon: Sparkles, permission: 'ai:use' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const visibleNav = navItems.filter((item) => hasPermission(user, item.permission))

  return (
    <div className="min-h-screen flex bg-navy">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-navy-50 border-r border-navy-100 transform transition-transform duration-200 lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center px-6 border-b border-navy-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gold flex items-center justify-center text-navy font-bold">
              P
            </div>
            <span className="text-lg font-semibold text-gold">PABOS</span>
          </div>
          <button
            className="ml-auto lg:hidden text-slate-300"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-gold/10 text-gold border border-gold/20'
                    : 'text-slate-300 hover:bg-navy-100 hover:text-slate-100'
                }`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-navy-100">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-3 py-2 text-slate-300 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-navy-50 border-b border-navy-100 flex items-center px-4 lg:px-6 gap-4">
          <button
            className="lg:hidden text-slate-300"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="ml-auto flex items-center gap-4">
            <button
              onClick={() => navigate('/clients/new')}
              className="hidden sm:block btn-primary text-sm"
            >
              + New Client
            </button>

            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Building2 size={16} className="text-gold" />
              <span className="hidden sm:inline">Praeto HQ / Main Branch</span>
              <ChevronDown size={14} />
            </div>

            {user && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-success/20 text-success flex items-center justify-center font-semibold">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
                <span className="hidden md:inline text-slate-200">
                  {user.firstName} {user.lastName}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Page title */}
        <div className="px-4 lg:px-6 py-4 border-b border-navy-100 bg-navy/50">
          <h1 className="text-xl font-semibold text-gold">
            {visibleNav.find((n) => location.pathname.startsWith(n.to))?.label || 'PABOS'}
          </h1>
        </div>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
