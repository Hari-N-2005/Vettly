import { useState } from 'react'
import RFPUploadForm from '@/components/upload/RFPUploadForm'
import RecentProjectsList from '@/components/rfp/RecentProjectsList'
import RequirementChecklist from '@/components/requirements/RequirementChecklist'
import ComplianceDeepDive from '@/components/compliance/ComplianceDeepDive'
import RiskFlagPanel from '@/components/risks/RiskFlagPanel'
import { validateVendorProposal } from '@/services/proposalService'
import { uploadRFPForExtraction } from '@/services/rfpService'
import { scanVendorRisks } from '@/services/riskService'
import {
  ComplianceResult,
  ExtractRequirementsResponse,
  Project,
  Requirement,
  RiskScanResponse,
  ValidateVendorResponse,
} from '@/types'

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
  const [confirmedRequirements, setConfirmedRequirements] = useState<Requirement[]>([])
  const [vendorProposalFile, setVendorProposalFile] = useState<File | null>(null)
  const [vendorName, setVendorName] = useState('')
  const [isValidatingVendor, setIsValidatingVendor] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [validationResult, setValidationResult] = useState<ValidateVendorResponse | null>(null)
  const [isScanningRisks, setIsScanningRisks] = useState(false)
  const [riskScanError, setRiskScanError] = useState<string | null>(null)
  const [riskScanResult, setRiskScanResult] = useState<RiskScanResponse | null>(null)
  const [activeComplianceResult, setActiveComplianceResult] = useState<ComplianceResult | null>(null)
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
    setConfirmedRequirements([])
    setVendorProposalFile(null)
    setVendorName('')
    setValidationError(null)
    setValidationResult(null)
    setRiskScanError(null)
    setRiskScanResult(null)
    setActiveComplianceResult(null)
    setExtractionMeta({
      projectName: payload.projectName,
      extractedAt: payload.extractedAt,
      totalCount: payload.totalCount,
      categoryBreakdown: payload.categoryBreakdown,
    })
  }

  const handleConfirmRequirements = (selected: Requirement[]) => {
    setConfirmedRequirements(selected)
    setValidationError(null)
    setValidationResult(null)
    setRiskScanError(null)
    setRiskScanResult(null)
  }

  const handleValidateVendor = async () => {
    if (!vendorProposalFile || confirmedRequirements.length === 0) {
      setValidationError('Confirm at least one requirement and upload a vendor proposal PDF.')
      return
    }

    setIsValidatingVendor(true)
    setValidationError(null)

    try {
      const response = await validateVendorProposal(
        vendorProposalFile,
        confirmedRequirements,
        vendorName.trim() || undefined
      )

      setValidationResult(response)
      setRiskScanError(null)
      setRiskScanResult(null)
      setActiveComplianceResult(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to validate vendor proposal.'
      setValidationError(message)
    } finally {
      setIsValidatingVendor(false)
    }
  }

  const handleScanRisks = async () => {
    if (!vendorProposalFile) {
      setRiskScanError('Upload a vendor proposal PDF before running risk scan.')
      return
    }

    setIsScanningRisks(true)
    setRiskScanError(null)

    try {
      const uploadResult = await uploadRFPForExtraction(vendorProposalFile)
      const resolvedVendorName =
        validationResult?.vendorName ||
        vendorName.trim() ||
        vendorProposalFile.name.replace(/\.pdf$/i, '').trim() ||
        'Unknown Vendor'

      const scanResult = await scanVendorRisks(uploadResult.rawText, resolvedVendorName)
      setRiskScanResult(scanResult)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to scan proposal risks.'
      setRiskScanError(message)
    } finally {
      setIsScanningRisks(false)
    }
  }

  const getRequirementTextById = (requirementId: string): string => {
    const requirement = confirmedRequirements.find(item => item.id === requirementId)
    return requirement?.requirementText || ''
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

            {confirmedRequirements.length > 0 && (
              <div className="mt-6 rounded-xl border border-legal-blue/30 bg-legal-slate/50 p-5">
                <h3 className="text-lg font-semibold text-gray-100">Vendor Proposal Validation</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Validate one vendor proposal against {confirmedRequirements.length} confirmed requirement{confirmedRequirements.length === 1 ? '' : 's'}.
                </p>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="vendorName" className="block text-sm font-semibold text-gray-200 mb-2">
                      Vendor Name (optional)
                    </label>
                    <input
                      id="vendorName"
                      type="text"
                      value={vendorName}
                      onChange={event => setVendorName(event.target.value)}
                      placeholder="e.g., Acme Solutions"
                      className="w-full px-4 py-2.5 bg-legal-dark border border-legal-blue/40 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-legal-accent"
                    />
                  </div>

                  <div>
                    <label htmlFor="vendorProposal" className="block text-sm font-semibold text-gray-200 mb-2">
                      Vendor Proposal PDF
                    </label>
                    <input
                      id="vendorProposal"
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={event => {
                        const file = event.target.files?.[0] ?? null
                        setVendorProposalFile(file)
                        setValidationError(null)
                      }}
                      className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-legal-accent/20 file:text-legal-accent hover:file:bg-legal-accent/30"
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleValidateVendor}
                    disabled={isValidatingVendor || !vendorProposalFile}
                    className="px-4 py-2 rounded-lg bg-legal-accent text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:bg-legal-blue transition-colors"
                  >
                    {isValidatingVendor ? 'Validating...' : 'Validate Vendor'}
                  </button>

                  <button
                    type="button"
                    onClick={handleScanRisks}
                    disabled={isScanningRisks || !vendorProposalFile}
                    className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:bg-amber-500/30 transition-colors"
                  >
                    {isScanningRisks ? 'Scanning Risks...' : 'Scan Risks'}
                  </button>

                  {vendorProposalFile && (
                    <span className="text-sm text-gray-300">Selected file: {vendorProposalFile.name}</span>
                  )}
                </div>

                {validationError && (
                  <p className="mt-4 text-sm text-red-300 bg-red-950/40 border border-red-700/40 rounded-lg px-3 py-2">
                    {validationError}
                  </p>
                )}

                {riskScanError && (
                  <p className="mt-4 text-sm text-red-300 bg-red-950/40 border border-red-700/40 rounded-lg px-3 py-2">
                    {riskScanError}
                  </p>
                )}

                {validationResult && (
                  <div className="mt-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="rounded-lg bg-legal-dark/70 border border-legal-blue/30 p-3">
                        <p className="text-xs text-gray-400">Vendor</p>
                        <p className="text-sm text-gray-100 font-semibold mt-1">{validationResult.vendorName}</p>
                      </div>
                      <div className="rounded-lg bg-legal-dark/70 border border-legal-blue/30 p-3">
                        <p className="text-xs text-gray-400">Overall Score</p>
                        <p className="text-xl text-legal-accent font-bold mt-1">{validationResult.overallScore}%</p>
                      </div>
                      <div className="rounded-lg bg-legal-dark/70 border border-emerald-500/30 p-3">
                        <p className="text-xs text-gray-400">Met</p>
                        <p className="text-xl text-emerald-300 font-bold mt-1">{validationResult.metCount}</p>
                      </div>
                      <div className="rounded-lg bg-legal-dark/70 border border-amber-500/30 p-3">
                        <p className="text-xs text-gray-400">Partially Met</p>
                        <p className="text-xl text-amber-300 font-bold mt-1">{validationResult.partialCount}</p>
                      </div>
                      <div className="rounded-lg bg-legal-dark/70 border border-rose-500/30 p-3">
                        <p className="text-xs text-gray-400">Missing</p>
                        <p className="text-xl text-rose-300 font-bold mt-1">{validationResult.missingCount}</p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-legal-blue/30 overflow-hidden">
                      <table className="w-full min-w-[640px]">
                        <thead className="bg-legal-dark/80">
                          <tr>
                            <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-gray-400">Requirement</th>
                            <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-gray-400">Status</th>
                            <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-gray-400">Confidence</th>
                            <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-gray-400">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {validationResult.complianceResults.map(result => {
                            const badgeClass =
                              result.status === 'Met'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                                : result.status === 'Partially Met'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                                  : 'bg-rose-500/20 text-rose-300 border-rose-400/30'

                            return (
                              <tr key={result.requirementId} className="border-t border-legal-blue/20">
                                <td className="px-4 py-3 text-sm text-gray-200">{result.requirementId}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs border ${badgeClass}`}>
                                    {result.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-300">{result.confidenceScore}</td>
                                <td className="px-4 py-3">
                                  <button
                                    type="button"
                                    onClick={() => setActiveComplianceResult(result)}
                                    className="text-sm font-medium text-legal-accent hover:text-legal-gold"
                                  >
                                    Deep Dive
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {riskScanResult && (
                  <div className="mt-6">
                    <RiskFlagPanel
                      vendorName={riskScanResult.vendorName}
                      riskFlags={riskScanResult.riskFlags}
                      overallToneScore={riskScanResult.overallToneScore}
                    />
                    {riskScanResult.note && (
                      <p className="mt-3 text-sm text-emerald-200 bg-emerald-950/30 border border-emerald-700/30 rounded-lg px-3 py-2">
                        {riskScanResult.note}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
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

      <ComplianceDeepDive
        isOpen={Boolean(activeComplianceResult)}
        result={activeComplianceResult}
        requirementText={
          activeComplianceResult
            ? getRequirementTextById(activeComplianceResult.requirementId)
            : ''
        }
        onClose={() => setActiveComplianceResult(null)}
        onFlagForReview={({ requirementId, note }) => {
          console.log('Flagged for review:', { requirementId, note })
          alert(`Flagged ${requirementId} for review.`)
        }}
      />
    </div>
  )
}
