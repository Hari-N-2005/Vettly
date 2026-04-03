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
        <p className="mt-1 text-sm text-slate-400">
          Open a project from RFP Uploads to access Requirements, Vendor Comparison, and Risk Analysis views.
        </p>
      </section>
    )
  }

  return (
    <section className="border-b border-blue-500/40 bg-gradient-to-r from-slate-950 via-blue-950/40 to-slate-950 px-4 py-3 shadow-[0_6px_20px_rgba(29,78,216,0.15)] sm:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="rounded-lg border border-blue-500/35 bg-slate-900/70 px-3 py-2">
          <p className="text-xs uppercase tracking-[0.16em] text-blue-200/70">Project Workspace</p>
          <p className="mt-1 text-sm text-slate-100">
            Active project: <span className="font-semibold">{currentProject.name}</span>
          </p>
        </div>

        <nav className="flex flex-wrap gap-2">
          {projectNavItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-blue-400/70 bg-blue-500/35 text-white shadow-[0_0_0_1px_rgba(96,165,250,0.45)]'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-blue-500/35 hover:text-slate-100'
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
