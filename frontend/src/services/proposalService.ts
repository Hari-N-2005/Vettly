import api from './api'

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

// Delete proposal
export const deleteProposal = async (projectId: string, vendorId: string): Promise<void> => {
  await api.delete(`/proposals/${projectId}/${vendorId}`)
}

export default {
  getProposalComparison,
  uploadProposal,
  deleteProposal,
}
