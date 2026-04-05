import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useProjectStore } from '@/stores/projectStore'

interface TopNavbarProps {
  onOpenMobileMenu?: () => void
}

export default function TopNavbar({ onOpenMobileMenu }: TopNavbarProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { projects, fetchProjects, fetchProject } = useProjectStore()
  const [query, setQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null)
  const searchContainerRef = useRef<HTMLDivElement | null>(null)

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

  useEffect(() => {
    if (!user) {
      return
    }

    if (projects.length === 0) {
      void fetchProjects()
    }
  }, [fetchProjects, projects.length, user])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!searchContainerRef.current) {
        return
      }

      if (!searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const normalizedQuery = query.trim().toLowerCase()
  const matchingProjects = useMemo(
    () =>
      normalizedQuery.length === 0
        ? []
        : projects.filter(project => project.name.toLowerCase().includes(normalizedQuery)),
    [normalizedQuery, projects]
  )

  const handleSelectProject = async (projectId: string, projectName: string) => {
    setLoadingProjectId(projectId)
    try {
      await fetchProject(projectId)
      setQuery(projectName)
      setIsSearchOpen(false)
      navigate('/rfp-uploads')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setLoadingProjectId(null)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-200 lg:hidden"
          aria-label="Open menu"
        >
          <span className="text-lg leading-none">≡</span>
        </button>

        <div ref={searchContainerRef} className="relative min-w-0 flex-1 max-w-xl">
          <form onSubmit={handleSearch}>
            <label htmlFor="dashboard-search" className="sr-only">
              Search
            </label>
            <input
              id="dashboard-search"
              value={query}
              onChange={event => {
                setQuery(event.target.value)
                setIsSearchOpen(true)
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search saved projects"
              className="w-full min-w-0 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:px-4"
            />
          </form>

          {isSearchOpen && normalizedQuery.length > 0 && (
            <div className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
              {matchingProjects.length > 0 ? (
                <ul className="py-1">
                  {matchingProjects.map(project => (
                    <li key={project.id}>
                      <button
                        type="button"
                        onClick={() => {
                          void handleSelectProject(project.id, project.name)
                        }}
                        disabled={Boolean(loadingProjectId)}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-70"
                      >
                        <span className="truncate">{project.name}</span>
                        {loadingProjectId === project.id ? (
                          <span className="text-xs text-blue-200">Loading</span>
                        ) : (
                          <span className="text-xs text-slate-500">{new Date(project.createdAt).toLocaleDateString()}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3 py-3 text-sm text-slate-400">No matching projects found.</p>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/25 text-xs font-semibold text-indigo-100">
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
            className="hidden rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 sm:inline-flex"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
