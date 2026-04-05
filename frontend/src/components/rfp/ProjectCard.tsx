import { Project } from '@/types'

interface ProjectCardProps {
  project: Project
  onOpen: (projectId: string) => void
  onDelete: (projectId: string) => void
  isOpening?: boolean
}

export default function ProjectCard({ project, onOpen, onDelete, isOpening = false }: ProjectCardProps) {
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
    <div className="rounded-lg border border-slate-700/80 bg-gradient-to-b from-slate-800 to-slate-900 p-6 transition-all duration-300 hover:border-indigo-400/40 hover:shadow-xl hover:shadow-indigo-500/10">
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
              <span className="font-semibold text-amber-300">{project.complianceScore}%</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onOpen(project.id)}
          disabled={isOpening}
          className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-500/90 hover:to-indigo-500/90 active:scale-95 transition-all duration-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          {isOpening ? (
            <span>Loading...</span>
          ) : (
            'View Project'
          )}
        </button>

        <button
          onClick={() => onDelete(project.id)}
          disabled={isOpening}
          className="w-full px-4 py-2.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-lg hover:bg-rose-500/30 active:scale-95 transition-all duration-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
