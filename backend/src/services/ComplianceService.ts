import { ExtractedRequirement } from '@/types'

/**
 * Calculate overall compliance score for a vendor
 */
export const calculateComplianceScore = (
  complianceResults: Array<{ status: string; confidence: number }>
): number => {
  if (complianceResults.length === 0) return 0

  const compliantCount = complianceResults.filter(
    r => r.status === 'compliant'
  ).length
  const weighting = complianceResults.reduce((sum, r) => {
    if (r.status === 'compliant') return sum + r.confidence
    if (r.status === 'unclear') return sum + r.confidence * 0.5
    return sum
  }, 0)

  return Math.round((weighting / complianceResults.length) * 100)
}

/**
 * Calculate risk score based on detected risks
 */
export const calculateRiskScore = (
  risks: Array<{ severity: string }>
): number => {
  const severity_weights: Record<string, number> = {
    critical: 5,
    high: 4,
    medium: 3,
    low: 2,
    info: 1,
  }

  if (risks.length === 0) return 0

  const totalWeight = risks.reduce(
    (sum, risk) => sum + (severity_weights[risk.severity] || 0),
    0
  )
  const maxWeight = risks.length * 5

  return Math.round(100 - (totalWeight / maxWeight) * 100)
}

/**
 * Generate vendor ranking based on multiple factors
 */
export interface VendorRanking {
  vendorId: string
  vendorName: string
  overallScore: number
  complianceScore: number
  riskScore: number
  recommendation: 'Strongly Recommend' | 'Recommend' | 'Consider' | 'Not Recommended'
}

export const rankVendors = (
  vendors: Array<{
    vendorId: string
    vendorName: string
    complianceScore: number
    riskScore: number
  }>
): VendorRanking[] => {
  return vendors
    .map(v => {
      const overallScore = v.complianceScore * 0.6 + v.riskScore * 0.4
      let recommendation: 'Strongly Recommend' | 'Recommend' | 'Consider' | 'Not Recommended'

      if (overallScore >= 85) recommendation = 'Strongly Recommend'
      else if (overallScore >= 70) recommendation = 'Recommend'
      else if (overallScore >= 50) recommendation = 'Consider'
      else recommendation = 'Not Recommended'

      return {
        vendorId: v.vendorId,
        vendorName: v.vendorName,
        overallScore: Math.round(overallScore),
        complianceScore: v.complianceScore,
        riskScore: v.riskScore,
        recommendation,
      }
    })
    .sort((a, b) => b.overallScore - a.overallScore)
}

export default {
  calculateComplianceScore,
  calculateRiskScore,
  rankVendors,
}
