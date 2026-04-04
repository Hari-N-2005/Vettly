import { NavLink } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'RFP Uploads', to: '/rfp-uploads' },
  { label: 'Settings', to: '/settings' },
]

interface SidebarProps {
  isMobileOpen?: boolean
  onCloseMobile?: () => void
}

export default function Sidebar({ isMobileOpen = false, onCloseMobile }: SidebarProps) {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  return (
    <>
      <aside className="hidden lg:flex lg:w-72 lg:flex-col border-r border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950 to-indigo-950/40">
        <div className="px-6 py-6 border-b border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Vettly</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-100">Tender Intelligence</h1>
          <p className="mt-2 text-sm text-slate-400">Enterprise procurement workspace</p>
        </div>

        <nav className="flex-1 px-4 py-5 space-y-1">
          <p className="px-4 pb-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">Main Navigation</p>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-100 border border-indigo-400/40'
                    : 'text-slate-300 border border-transparent hover:bg-slate-900 hover:text-slate-100'
                }`
              }
            >
              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-current opacity-80" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-slate-800">
          <p className="text-xs text-slate-500">Global navigation only. Project-specific views appear in the project workspace bar.</p>
        </div>
      </aside>

      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden ${
          isMobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onCloseMobile}
      />

      <aside
        className={`fixed left-0 top-0 z-50 h-full w-72 border-r border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950 to-indigo-950/60 transition-transform duration-300 lg:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Vettly</p>
            <h1 className="mt-2 text-xl font-semibold text-slate-100">Tender Intelligence</h1>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-slate-200"
            aria-label="Close menu"
          >
            X
          </button>
        </div>

        <nav className="px-4 py-5 space-y-1">
          <p className="px-4 pb-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">Main Navigation</p>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-100 border border-indigo-400/40'
                    : 'text-slate-300 border border-transparent hover:bg-slate-900 hover:text-slate-100'
                }`
              }
            >
              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-current opacity-80" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-slate-800">
          <p className="text-xs text-slate-500">Tap menu icon to open navigation.</p>
          <button
            type="button"
            onClick={() => {
              logout()
              onCloseMobile?.()
              navigate('/login')
            }}
            className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
