import ProjectCard from './ProjectCard'
import { Project } from '@/types'

interface RecentProjectsListProps {
  projects: Project[]
  onOpenProject: (projectId: string) => void
}

export default function RecentProjectsList({
  projects,
  onOpenProject,
}: RecentProjectsListProps) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No projects yet</p>
        <p className="text-gray-500 text-sm mt-2">
          Upload your first RFP document above to get started
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-100 mb-6">Recent Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <ProjectCard key={project.id} project={project} onOpen={onOpenProject} />
        ))}
      </div>
    </div>
  )
}
