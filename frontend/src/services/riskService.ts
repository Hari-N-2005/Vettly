import api from './api'

export interface Risk {
  id: string
  category: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  evidence: string[]
  recommendation: string
  detectedAt: Date
}

export interface RiskAnalysis {
  projectId: string
  totalRisks: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  risks: Risk[]
}

// Analyze risks in project
export const analyzeRisks = async (projectId: string): Promise<RiskAnalysis> => {
  const response = await api.get(`/risks/${projectId}`)
  return response.data
}

// Get specific risk details
export const getRiskDetails = async (riskId: string): Promise<Risk> => {
  const response = await api.get(`/risks/detail/${riskId}`)
  return response.data
}

// Dismiss or acknowledge risk
export const acknowledgeRisk = async (riskId: string, notes: string): Promise<void> => {
  await api.post(`/risks/${riskId}/acknowledge`, { notes })
}

export default {
  analyzeRisks,
  getRiskDetails,
  acknowledgeRisk,
}
