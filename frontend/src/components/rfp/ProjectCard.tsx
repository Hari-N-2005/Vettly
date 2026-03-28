import { Project } from '@/types'

interface ProjectCardProps {
  project: Project
  onOpen: (projectId: string) => void
}

export default function ProjectCard({ project, onOpen }: ProjectCardProps) {
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date))
  }

  const getStatusBadge = (): { bg: string; text: string; label: string } => {
    switch (project.status) {
      case 'completed':
        return { bg: 'bg-green-900 bg-opacity-30', text: 'text-green-400', label: '✓ Completed' }
      case 'in_progress':
        return { bg: 'bg-blue-900 bg-opacity-30', text: 'text-blue-400', label: '⟳ In Progress' }
      case 'archived':
        return { bg: 'bg-gray-700 bg-opacity-30', text: 'text-gray-400', label: '📦 Archived' }
      default:
        return { bg: 'bg-gray-700 bg-opacity-30', text: 'text-gray-400', label: 'Unknown' }
    }
  }

  const status = getStatusBadge()

  return (
    <div className="bg-legal-slate rounded-lg border border-legal-blue border-opacity-20 hover:border-legal-accent hover:border-opacity-50 transition-all duration-300 p-6 hover:shadow-xl hover:shadow-legal-accent hover:shadow-opacity-20">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-100 truncate">{project.name}</h3>
          <p className="text-sm text-gray-400 mt-1">{formatDate(project.createdAt)}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${status.bg} ${status.text}`}>
          {status.label}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-gray-400">Vendors: </span>
            <span className="font-semibold text-gray-100">{project.vendorCount}</span>
          </div>
          {project.complianceScore !== undefined && (
            <div>
              <span className="text-gray-400">Compliance: </span>
              <span className="font-semibold text-legal-gold">{project.complianceScore}%</span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => onOpen(project.id)}
        className="w-full px-4 py-2.5 bg-legal-accent text-white rounded-lg hover:bg-legal-blue active:scale-95 transition-all duration-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-legal-accent focus:ring-offset-2 focus:ring-offset-legal-slate"
      >
        View Project
      </button>
    </div>
  )
}
