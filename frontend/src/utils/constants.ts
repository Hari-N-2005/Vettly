// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
export const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000')

// File upload limits
export const MAX_FILE_SIZE_MB = 50
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
export const ACCEPTED_FILE_FORMATS = ['.pdf', '.docx', '.doc', '.txt']

// Compliance statuses
export const COMPLIANCE_STATUSES = [
  'COMPLIANT',
  'PARTIALLY_COMPLIANT',
  'NON_COMPLIANT',
  'UNCLEAR',
  'NOT_APPLICABLE',
] as const

// Risk severities
export const RISK_SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as const

// Project statuses
export const PROJECT_STATUSES = ['in_progress', 'completed', 'archived'] as const

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const DEFAULT_PAGE = 1
