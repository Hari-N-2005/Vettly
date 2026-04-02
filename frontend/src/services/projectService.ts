import api from './api'
import { Requirement } from '@/types'

export interface Project {
  id: string
  name: string
  description?: string
  status: 'draft' | 'active' | 'completed' | 'archived'
  createdAt: Date
  requirementCount?: number
  proposalCount?: number
}

export interface ProjectDetail extends Project {
  documents: Array<{
    id: string
    filename: string
    fileSize: number
    uploadedAt: Date
  }>
  requirements: Array<{
    id: string
    text: string
    category?: string
    priority?: string
    order: number
  }>
  proposals: Array<{
    id: string
    vendorName: string
    createdAt: Date
    validatedAt?: Date
    overallScore?: number
  }>
}

export const projectService = {
  // Get all user projects
  async getProjects(): Promise<Project[]> {
    const response = await api.get('/projects')
    return response.data
  },

  // Get single project with requirements
  async getProject(projectId: string): Promise<ProjectDetail> {
    const response = await api.get(`/projects/${projectId}`)
    return response.data
  },

  // Create new project with requirements
  async createProject(
    name: string,
    requirements: Requirement[],
    description?: string,
    rfpFileName?: string,
    rfpFileSize?: number
  ): Promise<Project> {
    const response = await api.post('/projects', {
      name,
      description,
      requirements: requirements.map((req) => ({
        text: req.requirementText,
        category: req.category,
      })),
      rfpFileName,
      rfpFileSize,
    })
    return response.data
  },

  // Update project
  async updateProject(projectId: string, data: Partial<Project>): Promise<Project> {
    const response = await api.put(`/projects/${projectId}`, data)
    return response.data
  },

  // Delete project
  async deleteProject(projectId: string): Promise<void> {
    await api.delete(`/projects/${projectId}`)
  },
}
