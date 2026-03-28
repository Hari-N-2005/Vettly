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
