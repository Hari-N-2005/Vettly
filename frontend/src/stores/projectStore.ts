import { create } from 'zustand'
import { projectService, Project, ProjectDetail } from '../services/projectService'

interface ProjectStore {
  projects: Project[]
  currentProject: ProjectDetail | null
  isLoading: boolean
  error: string | null

  // Actions
  fetchProjects: () => Promise<void>
  fetchProject: (projectId: string) => Promise<void>
  createProject: (name: string, requirements: any[], description?: string, rfpFile?: File) => Promise<Project>
  updateProject: (projectId: string, data: Partial<Project>) => Promise<void>
  deleteProject: (projectId: string) => Promise<void>
  appendVendorProposal: (projectId: string, proposal: {
    id: string
    vendorName: string
    uploadedAt: Date
    validatedAt?: Date
    overallScore?: number
    metCount?: number
    partialCount?: number
    missingCount?: number
  }) => void
  clearCurrentProject: () => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null })
    try {
      const projects = await projectService.getProjects()
      set({ projects, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  fetchProject: async (projectId) => {
    set({ isLoading: true, error: null })
    try {
      const project = await projectService.getProject(projectId)
      set({ currentProject: project, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  createProject: async (name, requirements, description, rfpFile) => {
    set({ isLoading: true, error: null })
    try {
      const project = await projectService.createProject(
        name,
        requirements,
        description,
        rfpFile?.name,
        rfpFile?.size
      )
      set((state) => ({
        projects: [project, ...state.projects],
        isLoading: false,
      }))
      return project
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  updateProject: async (projectId, data) => {
    try {
      await projectService.updateProject(projectId, data)
      set((state) => ({
        projects: state.projects.map((p) => (p.id === projectId ? { ...p, ...data } : p)),
        currentProject: state.currentProject?.id === projectId ? { ...state.currentProject, ...data } : state.currentProject,
      }))
    } catch (error: any) {
      set({ error: error.message })
      throw error
    }
  },

  deleteProject: async (projectId) => {
    try {
      await projectService.deleteProject(projectId)
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== projectId),
        currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
      }))
    } catch (error: any) {
      set({ error: error.message })
      throw error
    }
  },

  appendVendorProposal: (projectId, proposal) => {
    set((state) => ({
      projects: state.projects.map(project =>
        project.id === projectId
          ? {
              ...project,
              proposalCount: (project.proposalCount || 0) + 1,
            }
          : project
      ),
      currentProject:
        state.currentProject?.id === projectId
          ? {
              ...state.currentProject,
              proposals: [proposal, ...state.currentProject.proposals],
            }
          : state.currentProject,
    }))
  },

  clearCurrentProject: () => {
    set({ currentProject: null })
  },
}))
