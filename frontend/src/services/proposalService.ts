import api from './api'
import { Requirement, ValidateVendorResponse } from '@/types'

export interface SavedVendorProposalResponse {
  id: string
  vendorName: string
  filename: string
  fileSize: number
  validatedAt?: string
  overallScore?: number
  metCount?: number
  partialCount?: number
  missingCount?: number
}

export interface ProposalComparison {
  projectId: string
  vendors: Array<{
    id: string
    name: string
    complianceScore: number
    riskScore: number
    priceQuote?: number
    submittedAt: Date
  }>
  requirements: Array<{
    id: string
    title: string
    vendors: Record<
      string,
      {
        compliant: boolean
        evidence: string
        riskLevel: 'low' | 'medium' | 'high'
      }
    >
  }>
}

// Get proposal comparison matrix
export const getProposalComparison = async (
  projectId: string
): Promise<ProposalComparison> => {
  const response = await api.get(`/proposals/${projectId}/comparison`)
  return response.data
}

// Upload vendor proposal
export const uploadProposal = async (
  projectId: string,
  vendorName: string,
  proposalFile: File
): Promise<{ id: string; message: string }> => {
  const formData = new FormData()
  formData.append('vendorName', vendorName)
  formData.append('file', proposalFile)

  const response = await api.post(`/proposals/${projectId}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

// Validate a vendor proposal PDF against confirmed requirements
export const validateVendorProposal = async (
  proposalFile: File,
  requirements: Requirement[],
  vendorName?: string
): Promise<ValidateVendorResponse> => {
  const formData = new FormData()
  formData.append('file', proposalFile)
  formData.append('requirements', JSON.stringify(requirements))

  if (vendorName?.trim()) {
    formData.append('vendorName', vendorName.trim())
  }

  const response = await api.post('/validate-vendor', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 180000,
  })

  return response.data
}

// Delete proposal
export const deleteProposal = async (projectId: string, vendorId: string): Promise<void> => {
  await api.delete(`/proposals/${projectId}/${vendorId}`)
}

export const saveVendorProposal = async (
  projectId: string,
  vendorName: string,
  proposalFile: File,
  validationResult: ValidateVendorResponse,
  matchingCriteria: Requirement[],
  requirementsSnapshot: Array<{
    id: string
    text: string
    category?: string
    priority?: string
    order?: number
  }>
): Promise<SavedVendorProposalResponse> => {
  const formData = new FormData()
  formData.append('file', proposalFile)
  formData.append(
    'payload',
    JSON.stringify({
      vendorName,
      validationResult,
      matchingCriteria,
      requirementsSnapshot,
    })
  )

  const response = await api.post(`/proposals/${projectId}/save`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

export default {
  getProposalComparison,
  uploadProposal,
  validateVendorProposal,
  saveVendorProposal,
  deleteProposal,
}
