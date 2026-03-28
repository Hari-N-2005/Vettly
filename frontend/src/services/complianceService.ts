import api from './api'

interface RequirementExtraction {
  requirements: Array<{
    id: string
    category: string
    description: string
    mandatory: boolean
    priority: 'high' | 'medium' | 'low'
  }>
  summary: string
}

interface ComplianceResult {
  projectId: string
  requirements: Array<{
    requirementId: string
    status: 'compliant' | 'non_compliant' | 'unclear'
    evidence: string[]
    riskLevel: 'low' | 'medium' | 'high'
  }>
  overallScore: number
}

// Extract requirements from RFP
export const extractRequirements = async (
  projectId: string
): Promise<RequirementExtraction> => {
  const response = await api.post(`/rfp/${projectId}/extract`)
  return response.data
}

// Get compliance results
export const getComplianceResults = async (
  projectId: string
): Promise<ComplianceResult> => {
  const response = await api.get(`/compliance/${projectId}`)
  return response.data
}

// Validate proposal against requirements
export const validateProposal = async (
  projectId: string,
  vendorId: string,
  proposalFile: File
): Promise<ComplianceResult> => {
  const formData = new FormData()
  formData.append('file', proposalFile)

  const response = await api.post(
    `/compliance/${projectId}/validate/${vendorId}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  return response.data
}

export default {
  extractRequirements,
  getComplianceResults,
  validateProposal,
}
