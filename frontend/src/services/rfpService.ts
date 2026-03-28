import api from './api'
import { ExtractRequirementsResponse, Project, UploadRFPResponse } from '@/types'

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

// Upload an RFP PDF and get parsed raw text
export const uploadRFPForExtraction = async (file: File): Promise<UploadRFPResponse> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post('/upload-rfp', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

// Extract structured requirements from raw RFP text
export const extractRequirements = async (
  rfpText: string
): Promise<ExtractRequirementsResponse> => {
  const response = await api.post('/extract-requirements', { rfpText })
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
  uploadRFPForExtraction,
  extractRequirements,
  deleteProject,
}
