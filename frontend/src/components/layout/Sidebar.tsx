import { NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'RFP Uploads', to: '/rfp-uploads' },
  { label: 'Settings', to: '/settings' },
]

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:w-72 lg:flex-col border-r border-slate-800 bg-slate-950/90">
      <div className="px-6 py-6 border-b border-slate-800">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Vettly</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100">Tender Intelligence</h1>
        <p className="mt-2 text-sm text-slate-400">Enterprise procurement workspace</p>
      </div>

      <nav className="flex-1 px-4 py-5 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600/20 text-blue-200 border border-blue-500/40'
                  : 'text-slate-300 border border-transparent hover:bg-slate-900 hover:text-slate-100'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-slate-800">
        <p className="text-xs text-slate-500">Global navigation only. Project-specific views appear in the project workspace bar.</p>
      </div>
    </aside>
  )
}
