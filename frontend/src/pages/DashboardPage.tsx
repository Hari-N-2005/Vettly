import { useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import StatCard from '@/components/dashboard/StatCard'
import EmptyState from '@/components/common/EmptyState'
import { useProjectStore } from '@/stores/projectStore'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { projects, currentProject, fetchProjects } = useProjectStore()

  useEffect(() => {
    void fetchProjects()
  }, [fetchProjects])

  const metrics = useMemo(() => {
    const totalProjects = projects.length
    const totalVendors = projects.reduce((count, project) => count + (project.proposalCount || 0), 0)
    const avgVendors = totalProjects > 0 ? (totalVendors / totalProjects).toFixed(1) : '0.0'

    return {
      totalProjects,
      totalVendors,
      avgVendors,
    }
  }, [projects])

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold text-slate-100">Dashboard</h2>
        <p className="mt-1 text-sm text-slate-400">
          Track tender evaluations, requirement extraction progress, and vendor readiness from one workspace.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title="Active Projects"
          value={metrics.totalProjects}
          description="Saved RFP initiatives available for review and vendor validation."
          accent="blue"
        />
        <StatCard
          title="Saved Vendor Submissions"
          value={metrics.totalVendors}
          description="Total vendor proposals saved across all projects."
          accent="indigo"
        />
        <StatCard
          title="Avg Vendors Per Project"
          value={metrics.avgVendors}
          description="Average benchmark to gauge competitiveness in each tender."
          accent="indigo"
        />
      </section>

      <section className="rounded-xl border border-indigo-400/35 bg-gradient-to-r from-slate-900/95 via-indigo-900/20 to-slate-900 p-5 shadow-[0_10px_24px_rgba(79,70,229,0.16)] ring-1 ring-indigo-400/20">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
          <span className="h-2 w-2 rounded-full bg-indigo-300" />
          Quick Actions
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          Requirements, comparison, and risk actions are available after selecting an active project.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/rfp-uploads"
            className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-100 hover:bg-blue-500/15"
          >
            Upload New RFP
          </Link>
          {currentProject ? (
            <>
              <Link
                to="/requirements"
                className="rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-4 py-3 text-sm font-semibold text-indigo-100 hover:bg-indigo-500/15"
              >
                View Requirements
              </Link>
              <Link
                to="/vendor-comparison"
                className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/15"
              >
                Compare Vendors
              </Link>
              <Link
                to="/risk-analysis"
                className="rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-4 py-3 text-sm font-semibold text-indigo-100 hover:bg-indigo-500/15"
              >
                Review Risks
              </Link>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled
                className="rounded-lg border border-indigo-500/20 bg-indigo-500/8 px-4 py-3 text-left text-sm text-indigo-200/60 cursor-not-allowed"
                title="Select a project first"
              >
                View Requirements (select project first)
              </button>
              <button
                type="button"
                disabled
                className="rounded-lg border border-cyan-500/20 bg-cyan-500/8 px-4 py-3 text-left text-sm text-cyan-200/60 cursor-not-allowed"
                title="Select a project first"
              >
                Compare Vendors (select project first)
              </button>
              <button
                type="button"
                disabled
                className="rounded-lg border border-indigo-500/20 bg-indigo-500/8 px-4 py-3 text-left text-sm text-indigo-200/60 cursor-not-allowed"
                title="Select a project first"
              >
                Review Risks (select project first)
              </button>
            </>
          )}
        </div>
      </section>

      <section>
        {projects.length === 0 ? (
          <EmptyState
            variant="generic"
            title="No projects yet"
            description="Create your first project by uploading an RFP document and confirming requirements."
            actionLabel="Go to RFP Uploads"
            onAction={() => {
              navigate('/rfp-uploads')
            }}
          />
        ) : (
          <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-6">
            <h3 className="text-lg font-semibold text-slate-100">Project Library</h3>
            <p className="mt-1 text-sm text-slate-400">
              Need project-level actions? Jump to RFP Uploads and browse Recent Projects.
            </p>
            <button
              type="button"
              onClick={() => navigate('/rfp-uploads', { state: { scrollToRecentProjects: true } })}
              className="mt-4 rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-blue-100 hover:bg-blue-500/15"
            >
              Open Recent Projects In RFP Uploads
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
