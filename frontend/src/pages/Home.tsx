import { useState } from 'react'
import RFPUploadForm from '@/components/upload/RFPUploadForm'
import RecentProjectsList from '@/components/rfp/RecentProjectsList'
import RequirementChecklist from '@/components/requirements/RequirementChecklist'
import { ExtractRequirementsResponse, Project, Requirement } from '@/types'

export default function Home() {
  // Mock data for recent projects
  const mockProjects: Project[] = [
    {
      id: '1',
      name: 'Enterprise Cloud Infrastructure',
      createdAt: new Date('2024-03-15'),
      status: 'in_progress',
      vendorCount: 3,
      complianceScore: 78,
    },
    {
      id: '2',
      name: 'Managed Security Services',
      createdAt: new Date('2024-03-10'),
      status: 'completed',
      vendorCount: 5,
      complianceScore: 92,
    },
    {
      id: '3',
      name: 'Business Intelligence Platform',
      createdAt: new Date('2024-03-05'),
      status: 'completed',
      vendorCount: 2,
      complianceScore: 85,
    },
    {
      id: '4',
      name: 'Software Development Framework',
      createdAt: new Date('2024-02-28'),
      status: 'archived',
      vendorCount: 4,
      complianceScore: 88,
    },
  ]

  const projects = mockProjects
  const [extractedRequirements, setExtractedRequirements] = useState<Requirement[]>([])
  const [extractionMeta, setExtractionMeta] = useState<{
    projectName: string
    extractedAt: string
    totalCount: number
    categoryBreakdown: ExtractRequirementsResponse['categoryBreakdown']
  } | null>(null)

  const handleOpenProject = (projectId: string) => {
    console.log('Opening project:', projectId)
    alert(`Opening project: ${projectId}`)
  }

  const handleRequirementsExtracted = (
    payload: ExtractRequirementsResponse & {
      projectName: string
    }
  ) => {
    setExtractedRequirements(payload.requirements)
    setExtractionMeta({
      projectName: payload.projectName,
      extractedAt: payload.extractedAt,
      totalCount: payload.totalCount,
      categoryBreakdown: payload.categoryBreakdown,
    })
  }

  const handleConfirmRequirements = (selected: Requirement[]) => {
    alert(`Confirmed ${selected.length} requirements. Proceeding to validation setup.`)
  }

  return (
    <div className="min-h-screen bg-legal-dark">
      {/* Navigation Header */}
      <nav className="border-b border-legal-blue border-opacity-20 bg-legal-dark bg-opacity-80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold bg-gradient-to-r from-legal-accent to-legal-gold bg-clip-text text-transparent">
              ⚖️
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-100">Vettly</h1>
              <p className="text-xs text-gray-400">Tender Compliance Validator</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 text-gray-400 hover:text-gray-100 transition-colors text-sm">
              Docs
            </button>
            <button className="px-4 py-2 bg-legal-accent text-white rounded-lg hover:bg-legal-blue transition-all text-sm font-semibold">
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-100 mb-4 leading-tight">
              Tender Compliance
              <br />
              <span className="bg-gradient-to-r from-legal-accent to-legal-gold bg-clip-text text-transparent">
                Simplified
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Automatically extract requirements from RFP documents, validate vendor proposals against compliance standards, and identify risks.
            </p>
          </div>

          {/* Key Features / Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-legal-slate bg-opacity-50 rounded-lg p-6 border border-legal-blue border-opacity-20 hover:border-legal-accent hover:border-opacity-50 transition-all">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="font-semibold text-gray-100 mb-2">AI-Powered</h3>
              <p className="text-sm text-gray-400">
                Claude AI automatically extracts requirements and evaluates compliance
              </p>
            </div>

            <div className="bg-legal-slate bg-opacity-50 rounded-lg p-6 border border-legal-blue border-opacity-20 hover:border-legal-accent hover:border-opacity-50 transition-all">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-gray-100 mb-2">Vendor Comparison</h3>
              <p className="text-sm text-gray-400">
                Compare proposals side-by-side with instant compliance scores
              </p>
            </div>

            <div className="bg-legal-slate bg-opacity-50 rounded-lg p-6 border border-legal-blue border-opacity-20 hover:border-legal-accent hover:border-opacity-50 transition-all">
              <div className="text-3xl mb-3">⚠️</div>
              <h3 className="font-semibold text-gray-100 mb-2">Risk Detection</h3>
              <p className="text-sm text-gray-400">
                Automatically identify legal, financial, and operational risks
              </p>
            </div>
          </div>
        </section>

        {/* Upload Section */}
        <section className="mb-16">
          <RFPUploadForm onRequirementsExtracted={handleRequirementsExtracted} />
        </section>

        {/* Requirement Review Section */}
        {extractedRequirements.length > 0 && (
          <section className="mb-16">
            {extractionMeta && (
              <div className="mb-4 rounded-lg border border-legal-blue/30 bg-legal-slate/50 p-4">
                <h3 className="text-lg font-semibold text-gray-100">Extracted Requirements</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Project: <span className="text-gray-200">{extractionMeta.projectName}</span>
                </p>
                <p className="text-sm text-gray-400">
                  Extracted at: {new Date(extractionMeta.extractedAt).toLocaleString()}
                </p>
                <p className="text-sm text-gray-400">
                  Total requirements: <span className="text-gray-200">{extractionMeta.totalCount}</span>
                </p>
              </div>
            )}

            <RequirementChecklist
              requirements={extractedRequirements}
              onConfirm={selected => handleConfirmRequirements(selected)}
            />
          </section>
        )}

        {/* Recent Projects Section */}
        <section>
          {projects.length > 0 && <RecentProjectsList projects={projects} onOpenProject={handleOpenProject} />}
        </section>

        {/* Footer */}
        <footer className="mt-20 border-t border-legal-blue border-opacity-20 pt-12 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 Vettly - Intelligent Tender Compliance Validation. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  )
}
