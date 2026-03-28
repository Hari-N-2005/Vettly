// ============================================================
// SHARED DATA MODELS & TYPESCRIPT INTERFACES
// ============================================================

// ============================================================
// ENUMS
// ============================================================

export enum RequirementCategory {
  LEGAL = "LEGAL",
  COMMERCIAL = "COMMERCIAL",
  TECHNICAL = "TECHNICAL",
  FINANCIAL = "FINANCIAL",
  TIMELINE = "TIMELINE",
  COMPLIANCE = "COMPLIANCE",
  OTHER = "OTHER",
}

export enum ComplianceStatus {
  COMPLIANT = "COMPLIANT",           // Requirement fully met
  PARTIALLY_COMPLIANT = "PARTIALLY_COMPLIANT",  // Partially addressed
  NON_COMPLIANT = "NON_COMPLIANT",   // Not met
  UNCLEAR = "UNCLEAR",               // Unable to determine
  NOT_APPLICABLE = "NOT_APPLICABLE", // Requirement doesn't apply
}

export enum RiskSeverity {
  CRITICAL = "CRITICAL",    // 🔴 Must be resolved
  HIGH = "HIGH",           // 🟠 Should be resolved
  MEDIUM = "MEDIUM",       // 🟡 May need resolution
  LOW = "LOW",             // 🟢 Minor issue
  INFO = "INFO",           // ℹ️ Informational
}

export enum RiskCategory {
  LEGAL = "LEGAL",
  FINANCIAL = "FINANCIAL",
  TIMELINE = "TIMELINE",
  TECHNICAL = "TECHNICAL",
  VENDOR_CREDIBILITY = "VENDOR_CREDIBILITY",
  OPERATIONAL = "OPERATIONAL",
  REGULATORY = "REGULATORY",
  CONTRACTUAL = "CONTRACTUAL",
}

export enum DocumentType {
  RFP = "RFP",
  PROPOSAL = "PROPOSAL",
  QUOTE = "QUOTE",
  CONTRACT = "CONTRACT",
}

export enum FileFormat {
  PDF = "PDF",
  DOCX = "DOCX",
  DOC = "DOC",
  TXT = "TXT",
  XLSX = "XLSX",
}

// ============================================================
// RFP DOCUMENT
// ============================================================

export interface RFPDocument {
  id: string;                          // UUID
  title: string;
  description?: string;
  uploadedBy: string;                  // User ID
  uploadedAt: Date;
  updatedAt: Date;
  fileUrl: string;                     // S3/local path
  fileName: string;
  fileFormat: FileFormat;
  fileSizeBytes: number;
  documentHash: string;                // SHA-256 for deduplication
  extractedText: string;               // Full OCR/parsed text
  summary?: string;                    // AI-generated summary
  status: "PENDING_PROCESSING" | "PROCESSED" | "ERROR"; // Processing status
  errorMessage?: string;               // If status = ERROR
  processingStartedAt?: Date;
  processingCompletedAt?: Date;
  requirements: Requirement[];         // Associated requirements
  vendorProposals: VendorProposal[];   // Proposals submitted for this RFP
  createdAt: Date;
  isArchived: boolean;
}

// ============================================================
// REQUIREMENT
// ============================================================

export interface Requirement {
  id: string;                          // UUID
  rfpDocumentId: string;               // Foreign key
  rfpDocument?: RFPDocument;           // Relation
  
  /// Requirement Content
  text: string;                        // Full requirement text
  summary?: string;                    // Condensed version (AI-generated)
  category: RequirementCategory;
  priority: "MANDATORY" | "DESIRABLE" | "OPTIONAL"; // Importance level
  isMandatory: boolean;                // Convenience flag for filtering
  
  /// Keywords for matching
  keywords: string[];                  // Key terms to match in proposals
  
  /// Evaluation Criteria
  acceptanceCriteria?: string;         // What constitutes compliance
  weightingScore?: number;             // 1-100 for scoring purposes
  
  /// Audit
  extractedByAI: boolean;              // Whether AI extracted this
  manuallyEdited: boolean;             // Whether human edited
  aiConfidenceScore?: number;          // 0-1 confidence in extraction
  
  /// Relations
  complianceResults: ComplianceResult[]; // Results from each proposal
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// VENDOR PROPOSAL
// ============================================================

export interface VendorProposal {
  id: string;                          // UUID
  rfpDocumentId: string;               // Foreign key
  rfpDocument?: RFPDocument;           // Relation
  
  /// Vendor Information
  vendorName: string;
  vendorEmail?: string;
  vendorContactPerson?: string;
  vendorPhone?: string;
  vendorCompanyReg?: string;           // Registration/Tax ID
  vendorWebsite?: string;
  vendorCountry?: string;
  
  /// Proposal Content
  fileUrl: string;                     // S3/local path
  fileName: string;
  fileFormat: FileFormat;
  fileSizeBytes: number;
  extractedText: string;               // Full OCR/parsed text
  summary?: string;                    // AI-generated proposal summary
  
  /// Processing
  status: "PENDING_PROCESSING" | "PROCESSED" | "ERROR";
  errorMessage?: string;
  processingStartedAt?: Date;
  processingCompletedAt?: Date;
  
  /// Scoring
  overallComplianceScore?: number;     // 0-100 aggregate score
  overallRiskLevel?: RiskSeverity;     // Aggregate risk
  
  /// Relations
  complianceResults: ComplianceResult[]; // Compliance per requirement
  riskFlags: RiskFlag[];               // Identified risks
  
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean;
}

// ============================================================
// COMPLIANCE RESULT
// ============================================================

export interface ComplianceResult {
  id: string;                          // UUID
  requirementId: string;               // Foreign key
  requirement?: Requirement;           // Relation
  proposalId: string;                  // Foreign key
  proposal?: VendorProposal;           // Relation
  
  /// Compliance Assessment
  status: ComplianceStatus;            // COMPLIANT, PARTIAL, NON_COMPLIANT, etc.
  complianceScore?: number;            // 0-100: how well it meets requirement
  evidenceText?: string;               // Extracted text from proposal supporting compliance
  
  /// AI Analysis
  analysisNotes?: string;              // AI-generated explanation
  aiConfidenceScore?: number;          // 0-1: confidence in assessment
  
  /// Gaps & Deviations
  gapDescription?: string;             // What's missing or not met
  deviationReason?: string;            // Why requirement isn't met
  
  /// Manual Review
  reviewedBy?: string;                 // User ID if manually reviewed
  reviewNotes?: string;                // Human reviewer's notes
  isManuallyVerified: boolean;         // Whether human confirmed
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// RISK FLAG
// ============================================================

export interface RiskFlag {
  id: string;                          // UUID
  proposalId: string;                  // Foreign key
  proposal?: VendorProposal;           // Relation
  
  /// Risk Details
  title: string;                       // Risk title
  description: string;                 // Detailed description
  category: RiskCategory;
  severity: RiskSeverity;
  
  /// Evidence & Context
  relatedRequirementId?: string;       // If tied to specific requirement
  relatedComplianceResultId?: string;  // If tied to compliance assessment
  evidenceText?: string;               // Quote from proposal supporting risk
  sourceLocation?: string;             // Section/page reference in proposal
  
  /// Risk Attributes
  isFinancialRisk: boolean;            // Financial implication
  isLegalRisk: boolean;                // Legal implication
  isScheduleRisk: boolean;             // Timeline implication
  potentialImpact?: string;            // Possible consequences
  recommendedMitigation?: string;      // How to address
  
  /// Tracking
  isRecognized: boolean;               // Whether team acknowledged
  acknowledgedAt?: Date;
  acknowledgedBy?: string;             // User ID
  resolutionStatus: "OPEN" | "ACKNOWLEDGED" | "MITIGATED" | "RESOLVED" | "ACCEPTED";
  resolutionNotes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// COMPLIANCE SUMMARY (for Dashboard)
// ============================================================

export interface ComplianceSummary {
  proposalId: string;
  vendorName: string;
  totalRequirements: number;
  mandatoryRequirements: number;
  
  compliantCount: number;
  partiallyCompliantCount: number;
  nonCompliantCount: number;
  unclearCount: number;
  notApplicableCount: number;
  
  overallScore: number;              // Weighted compliance %
  mandatoryComplianceScore: number;  // % of mandatory requirements met
  
  criticalRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  
  overallRiskLevel: RiskSeverity;
  
  complianceByCategory: {
    [key in RequirementCategory]?: {
      total: number;
      compliant: number;
      score: number;
    };
  };
}

// ============================================================
// VENDOR COMPARISON (for Dashboard)
// ============================================================

export interface VendorComparison {
  rfpId: string;
  vendors: Array<{
    proposalId: string;
    vendorName: string;
    overallScore: number;
    mandatoryScore: number;
    riskLevel: RiskSeverity;
    totalRisks: number;
    criticalRisks: number;
    complianceByCategory: Record<string, number>;
  }>;
  
  ranking: Array<{
    rank: number;
    proposalId: string;
    vendorName: string;
    score: number;
  }>;
}

// ============================================================
// API REQUEST/RESPONSE TYPES
// ============================================================

export interface UploadRFPRequest {
  file: File;
  title: string;
  description?: string;
}

export interface UploadProposalRequest {
  rfpId: string;
  file: File;
  vendorName: string;
  vendorEmail?: string;
  vendorContactPerson?: string;
  vendorPhone?: string;
}

export interface ValidateProposalRequest {
  proposalId: string;
  forceReprocess?: boolean;  // Skip cache
}

export interface ValidateProposalResponse {
  proposalId: string;
  complianceResults: ComplianceResult[];
  riskFlags: RiskFlag[];
  summary: ComplianceSummary;
}

export interface GetComplianceReportRequest {
  rfpId: string;
  proposalIds?: string[]; // Specific proposals or all
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: Date;
  requestId: string; // For debugging
}

// ============================================================
// USER & AUTHENTICATION
// ============================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "PROCUREMENT_OFFICER" | "LEGAL_REVIEWER" | "VIEWER";
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JWTPayload {
  sub: string;     // User ID
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// ============================================================
// AUDIT LOG
// ============================================================

export interface AuditLog {
  id: string;
  userId: string;
  action: string;             // e.g., "UPLOAD_RFP", "VALIDATE_PROPOSAL", "ACKNOWLEDGE_RISK"
  resourceType: string;        // e.g., "RFP", "PROPOSAL", "COMPLIANCE_RESULT"
  resourceId: string;
  changes?: Record<string, unknown>;  // What changed
  timestamp: Date;
}

// ============================================================
// PROCESSING QUEUE ITEM (Bull/Redis)
// ============================================================

export interface ProcessingJob {
  id: string;
  type: "EXTRACT_REQUIREMENTS" | "VALIDATE_PROPOSAL";
  documentId?: string;
  proposalId?: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number;           // 0-100
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// ============================================================
// DATABASE SCHEMA NOTES (for Prisma)
// ============================================================
/*
Prisma would have:
- rfpdocument
- requirement
- vendorproposal
- complianceresult
- riskflag
- user
- auditlog
- processingqueue (for Bull job tracking)

Indexes:
- rfpdocument.createdAt, status
- requirement.rfpDocumentId
- vendorproposal.rfpDocumentId, status
- complianceresult.(requirementId, proposalId) - composite
- riskflag.proposalId, severity
- auditlog.userId, timestamp
*/
