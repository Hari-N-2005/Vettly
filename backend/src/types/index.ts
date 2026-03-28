export interface CreateRFPInput {
  title: string
  description?: string
  file: Express.Multer.File
}

export interface RFPDocument {
  id: string
  projectId: string
  filename: string
  fileSize: number
  mimeType: string
  filePath: string
  uploadedAt: Date
  processedAt?: Date
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

export interface ExtractedRequirement {
  id: string
  projectId: string
  title: string
  description: string
  category: string
  mandatory: boolean
  priority: 'high' | 'medium' | 'low'
  source?: string
  extractedAt: Date
}

export interface VendorProposal {
  id: string
  projectId: string
  vendorId: string
  vendorName: string
  filename: string
  filePath: string
  fileSize: number
  uploadedAt: Date
  processedAt?: Date
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

export interface ComplianceScore {
  requirementId: string
  vendorId: string
  status: 'compliant' | 'non_compliant' | 'unclear' | 'not_applicable'
  confidence: number
  evidence: string[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  notes?: string
}

export interface DetectedRisk {
  id: string
  projectId: string
  vendorId?: string
  title: string
  description: string
  category: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  evidence: string[]
  mitigation?: string
  detectedAt: Date
  acknowledgedAt?: Date
  acknowledgedBy?: string
}

export interface VendorScore {
  vendorId: string
  vendorName: string
  complianceScore: number
  riskScore: number
  overallScore: number
  requirementsMetCount: number
  requirementsTotalCount: number
  risksDetected: number
  recommendation: string
}
