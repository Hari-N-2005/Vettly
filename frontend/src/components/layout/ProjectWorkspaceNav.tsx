import { NavLink } from 'react-router-dom'
import { useProjectStore } from '@/stores/projectStore'

const projectNavItems = [
  { label: 'Requirements', to: '/requirements' },
  { label: 'Vendor Comparison', to: '/vendor-comparison' },
  { label: 'Risk Analysis', to: '/risk-analysis' },
]

export default function ProjectWorkspaceNav() {
  const { currentProject } = useProjectStore()

  if (!currentProject) {
    return (
      <section className="border-b border-slate-800 bg-slate-950/60 px-4 py-3 sm:px-6">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Project Workspace</p>
        <p className="mt-1 text-sm text-slate-400 break-words">
          Open a project from RFP Uploads to access Requirements, Vendor Comparison, and Risk Analysis views.
        </p>
      </section>
    )
  }

  return (
    <section className="relative border-y border-indigo-400/40 bg-gradient-to-r from-slate-950 via-indigo-900/35 to-slate-950 px-4 py-3 shadow-[0_8px_22px_rgba(67,56,202,0.18)] ring-1 ring-indigo-400/25 sm:px-6">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-amber-300 via-indigo-400 to-blue-300" />
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 rounded-lg border border-indigo-300/35 bg-slate-900/80 px-3 py-2 shadow-[0_0_20px_rgba(99,102,241,0.14)]">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <p className="text-xs uppercase tracking-[0.16em] text-indigo-100">Project Workspace</p>
            <span className="rounded-full border border-amber-300/40 bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-100">
              Active
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-100 break-words">
            Active project: <span className="font-semibold">{currentProject.name}</span>
          </p>
        </div>

        <nav className="flex flex-wrap gap-2">
          {projectNavItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg border px-2.5 py-1.5 text-sm font-semibold transition-all sm:px-3 ${
                  isActive
                    ? 'border-indigo-300/70 bg-indigo-500/30 text-white shadow-[0_0_0_1px_rgba(129,140,248,0.45),0_0_14px_rgba(129,140,248,0.18)]'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-amber-300/45 hover:bg-slate-800 hover:text-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </section>
  )
}
