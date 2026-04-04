import { useState } from 'react'
import ProjectCard from './ProjectCard'
import { Project } from '@/types'

interface RecentProjectsListProps {
  projects: Project[]
  onOpenProject: (projectId: string) => Promise<void> | void
  onDeleteProject: (projectId: string) => void
}

export default function RecentProjectsList({
  projects,
  onOpenProject,
  onDeleteProject,
}: RecentProjectsListProps) {
  const [openingProjectId, setOpeningProjectId] = useState<string | null>(null)

  const handleOpenProject = async (projectId: string) => {
    setOpeningProjectId(projectId)
    try {
      await Promise.resolve(onOpenProject(projectId))
    } finally {
      setOpeningProjectId(null)
    }
  }

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
      <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-gray-100">
        <span className="h-2.5 w-2.5 rounded-full bg-indigo-300" />
        Recent Projects
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onOpen={handleOpenProject}
            onDelete={onDeleteProject}
            isOpening={openingProjectId === project.id}
          />
        ))}
      </div>
    </div>
  )
}
