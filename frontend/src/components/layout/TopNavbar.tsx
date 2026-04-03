import { FormEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export default function TopNavbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [query, setQuery] = useState('')

  const userInitials = useMemo(() => {
    const email = user?.email ?? 'VT'
    const prefix = email.split('@')[0]
    return prefix
      .split(/[._-]/)
      .slice(0, 2)
      .map(chunk => chunk[0]?.toUpperCase() ?? '')
      .join('')
  }, [user?.email])

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <form onSubmit={handleSearch} className="w-full max-w-xl">
          <label htmlFor="dashboard-search" className="sr-only">
            Search
          </label>
          <input
            id="dashboard-search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search projects, vendors, requirements"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </form>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 hover:text-slate-100"
            aria-label="Notifications"
          >
            Notifications
          </button>

          <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-xs font-semibold text-blue-200">
              {userInitials || 'VT'}
            </span>
            <div>
              <p className="text-xs text-slate-400">Signed in as</p>
              <p className="text-sm text-slate-100">{user?.email || 'user@vettly.ai'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-300 hover:text-slate-100"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
