import { useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import StatCard from '@/components/dashboard/StatCard'
import EmptyState from '@/components/common/EmptyState'
import RecentProjectsList from '@/components/rfp/RecentProjectsList'
import { useProjectStore } from '@/stores/projectStore'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { projects, currentProject, fetchProjects, deleteProject, fetchProject, clearCurrentProject } = useProjectStore()

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
        />
        <StatCard
          title="Saved Vendor Submissions"
          value={metrics.totalVendors}
          description="Total vendor proposals saved across all projects."
        />
        <StatCard
          title="Avg Vendors Per Project"
          value={metrics.avgVendors}
          description="Average benchmark to gauge competitiveness in each tender."
        />
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h3 className="text-lg font-semibold text-slate-100">Quick Actions</h3>
        <p className="mt-1 text-sm text-slate-400">
          Requirements, comparison, and risk actions are available after selecting an active project.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/rfp-uploads"
            className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-medium text-slate-200 hover:border-blue-500/40"
          >
            Upload New RFP
          </Link>
          {currentProject ? (
            <>
              <Link
                to="/requirements"
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-medium text-slate-200 hover:border-blue-500/40"
              >
                View Requirements
              </Link>
              <Link
                to="/vendor-comparison"
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-medium text-slate-200 hover:border-blue-500/40"
              >
                Compare Vendors
              </Link>
              <Link
                to="/risk-analysis"
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-medium text-slate-200 hover:border-blue-500/40"
              >
                Review Risks
              </Link>
            </>
          ) : (
            <>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-500">View Requirements (select project first)</div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-500">Compare Vendors (select project first)</div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-500">Review Risks (select project first)</div>
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
          <RecentProjectsList
            projects={projects.map(project => ({ ...project as any, vendorCount: project.proposalCount || 0 }))}
            onOpenProject={(projectId) => {
              clearCurrentProject()
              void fetchProject(projectId)
              navigate('/rfp-uploads')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            onDeleteProject={(projectId) => {
              void deleteProject(projectId)
            }}
          />
        )}
      </section>
    </div>
  )
}
