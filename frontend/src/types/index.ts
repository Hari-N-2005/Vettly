// Type definitions for RFP upload flow
export interface RFPFile {
  file: File;
  name: string;
  size: number;
  uploadedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  createdAt: Date;
  status: 'in_progress' | 'completed' | 'archived';
  vendorCount: number;
  complianceScore?: number;
}

export interface UploadState {
  file: File | null;
  fileName: string;
  projectName: string;
  isUploading: boolean;
  progress: number;
}

export type RequirementCategory =
  | 'Technical'
  | 'Legal'
  | 'Financial'
  | 'Operational'
  | 'Environmental';

export type RequirementPriority = 'Critical' | 'Standard';

export interface Requirement {
  id: string;
  requirementText: string;
  category: RequirementCategory;
  keywords_detected: string[];
  sourceExcerpt: string;
  priority: RequirementPriority;
}

export interface UploadRFPResponse {
  fileName: string;
  pageCount: number;
  rawText: string;
  uploadedAt: string;
}

export interface ExtractRequirementsResponse {
  requirements: Requirement[];
  extractedAt: string;
  totalCount: number;
  categoryBreakdown: Record<RequirementCategory, number>;
}
