import api from './api'
import { Project } from '@/types'

// Fetch all projects
export const fetchProjects = async (): Promise<Project[]> => {
  const response = await api.get('/rfp')
  return response.data
}

// Fetch single project
export const fetchProject = async (projectId: string): Promise<Project> => {
  const response = await api.get(`/rfp/${projectId}`)
  return response.data
}

// Upload RFP document
export const uploadRFP = async (
  projectName: string,
  file: File
): Promise<{ id: string; message: string }> => {
  const formData = new FormData()
  formData.append('title', projectName)
  formData.append('file', file)

  const response = await api.post('/rfp/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

// Delete project
export const deleteProject = async (projectId: string): Promise<void> => {
  await api.delete(`/rfp/${projectId}`)
}

export default {
  fetchProjects,
  fetchProject,
  uploadRFP,
  deleteProject,
}
