import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useProjectStore } from '../stores/projectStore'
import { RequirementCategory } from '@/types'
import { validateVendorProposal } from '../services/proposalService'
import { uploadRFPForExtraction } from '../services/rfpService'
import { scanVendorRisks } from '../services/riskService'

import RFPUploadForm from '../components/upload/RFPUploadForm'
import RequirementChecklist from '../components/requirements/RequirementChecklist'
import RiskFlagPanel from '../components/risks/RiskFlagPanel'
import ComplianceDeepDive from '../components/compliance/ComplianceDeepDive'
import SimulatedProgressBar from '../components/common/SimulatedProgressBar'
import RecentProjectsList from '../components/rfp/RecentProjectsList'
import { useSimulatedProgress } from '@/hooks/useSimulatedProgress'

const normalizeCategory = (category?: string): RequirementCategory => {
  if (category === 'Technical' || category === 'Legal' || category === 'Financial' || category === 'Operational' || category === 'Environmental') {
    return category
  }

  return 'Operational'
}

export default function Home() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { projects, currentProject, fetchProjects, fetchProject, createProject, clearCurrentProject } = useProjectStore()

  const [extractedRequirements, setExtractedRequirements] = useState<any[]>([])
  const [extractionMeta, setExtractionMeta] = useState<any>(null)
  const [confirmedRequirements, setConfirmedRequirements] = useState<any[]>([])
  const [vendorName, setVendorName] = useState('')
  const [vendorProposalFile, setVendorProposalFile] = useState<File | null>(null)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [validationError, setValidationError] = useState<string>('')
  const [isValidatingVendor, setIsValidatingVendor] = useState(false)
  const [hasValidatedVendor, setHasValidatedVendor] = useState(false)
  const [riskScanResult, setRiskScanResult] = useState<any>(null)
  const [riskScanError, setRiskScanError] = useState<string>('')
  const [isScanningRisks, setIsScanningRisks] = useState(false)
  const [hasScannedRisks, setHasScannedRisks] = useState(false)
  const [activeComplianceResult, setActiveComplianceResult] = useState<any>(null)
  const [isSavingProject, setIsSavingProject] = useState(false)
  const [saveProjectError, setSaveProjectError] = useState<string>('')
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const {
    progress: validationProgress,
    complete: completeValidationProgress,
    reset: resetValidationProgress,
  } = useSimulatedProgress({
    isActive: isValidatingVendor,
    totalDurationMs: 21000,
  })

  // Load projects on component mount
  useEffect(() => {
    if (user) {
      fetchProjects()
    }
  }, [user, fetchProjects])

  useEffect(() => {
    if (!currentProject) {
      return
    }

    const mappedRequirements = currentProject.requirements.map((req: any) => ({
      id: req.id,
      requirementText: req.text ?? '',
      category: normalizeCategory(req.category),
      keywords_detected: [],
      sourceExcerpt: req.text ?? '',
      priority: 'Standard' as const,
    }))

    setProjectName(currentProject.name)
    setProjectDescription(currentProject.description ?? '')
    setExtractedRequirements(mappedRequirements)
    setConfirmedRequirements(mappedRequirements)
    setExtractionMeta({
      projectName: currentProject.name,
      extractedAt: currentProject.createdAt,
      totalCount: mappedRequirements.length,
      source: 'saved_project',
    })
    setShowSaveDialog(false)
    setSaveProjectError('')
    setValidationResult(null)
    setRiskScanResult(null)
    setValidationError('')
    setRiskScanError('')
  }, [currentProject])

  useEffect(() => {
    if (!isValidatingVendor && validationResult) {
      const timerId = window.setTimeout(() => resetValidationProgress(), 1200)
      return () => window.clearTimeout(timerId)
    }

    return undefined
  }, [isValidatingVendor, resetValidationProgress, validationResult])

  const handleRequirementsExtracted = (payload: any, _file?: File) => {
    const requirements = payload.requirements || payload
    setExtractedRequirements(Array.isArray(requirements) ? requirements : [])
    setExtractionMeta({
      ...payload,
      totalCount: Array.isArray(requirements) ? requirements.length : 0,
    })
    setConfirmedRequirements([])
    setValidationResult(null)
    setRiskScanResult(null)
    setHasValidatedVendor(false)
    setHasScannedRisks(false)
  }

  const handleConfirmRequirements = (selected: any[]) => {
    setConfirmedRequirements(selected)
  }

  const handleOpenProject = async (projectId: string) => {
    setExtractedRequirements([])
    setExtractionMeta(null)
    setConfirmedRequirements([])
    setValidationResult(null)
    setRiskScanResult(null)
    setValidationError('')
    setRiskScanError('')
    setHasValidatedVendor(false)
    setHasScannedRisks(false)
    setVendorProposalFile(null)
    setVendorName('')
    clearCurrentProject()
    await fetchProject(projectId)
  }

  const handleBackToProjects = () => {
    clearCurrentProject()
    setExtractedRequirements([])
    setExtractionMeta(null)
    setConfirmedRequirements([])
    setProjectName('')
    setProjectDescription('')
    setShowSaveDialog(false)
    setValidationResult(null)
    setRiskScanResult(null)
    setValidationError('')
    setRiskScanError('')
    setHasValidatedVendor(false)
    setHasScannedRisks(false)
    setVendorProposalFile(null)
    setVendorName('')
  }

  const handleSaveProject = async () => {
    if (!projectName.trim() || confirmedRequirements.length === 0) {
      setSaveProjectError('Please enter a project name and confirm requirements')
      return
    }
    setIsSavingProject(true)
    setSaveProjectError('')
    try {
      await createProject(projectName, confirmedRequirements, projectDescription)
      setProjectName('')
      setProjectDescription('')
      setShowSaveDialog(false)
      setExtractedRequirements([])
      setConfirmedRequirements([])
      setHasValidatedVendor(false)
      setHasScannedRisks(false)
      await fetchProjects()
    } catch (error: any) {
      setSaveProjectError(error.message || 'Failed to save project')
    } finally {
      setIsSavingProject(false)
    }
  }

  const handleValidateVendor = async () => {
    if (!vendorProposalFile) {
      setValidationError('Please select a vendor proposal file')
      return
    }

    if (confirmedRequirements.length === 0) {
      setValidationError('Please confirm at least one requirement')
      return
    }

    setIsValidatingVendor(true)
    setValidationError('')

    try {
      const result = await validateVendorProposal(
        vendorProposalFile,
        confirmedRequirements,
        vendorName || undefined
      )

      setValidationResult(result)
      setValidationError('')
      setHasValidatedVendor(true)
      completeValidationProgress()
    } catch (error: any) {
      setValidationError(error.message || 'Validation failed')
      setValidationResult(null)
      setHasValidatedVendor(false)
      resetValidationProgress()
    } finally {
      setIsValidatingVendor(false)
    }
  }

  const handleScanRisks = async () => {
    if (!vendorProposalFile) {
      setRiskScanError('Please select a vendor proposal file')
      return
    }

    setIsScanningRisks(true)
    setRiskScanError('')
    setHasScannedRisks(true)

    try {
      const extraction = await uploadRFPForExtraction(vendorProposalFile)
      const inferredVendorName =
        vendorName.trim() || vendorProposalFile.name.replace(/\.pdf$/i, '').trim() || 'Unknown Vendor'
      const result = await scanVendorRisks(extraction.rawText, inferredVendorName)

      setRiskScanResult(result)
      setRiskScanError('')
    } catch (error: any) {
      setRiskScanError(error.message || 'Risk scanning failed')
      setRiskScanResult(null)
      setHasScannedRisks(false)
    } finally {
      setIsScanningRisks(false)
    }
  }

  const getRequirementTextById = (requirementId: string): string => {
    if (currentProject) {
      const req = currentProject.requirements.find((r: any) => r.id === requirementId)
      return req ? req.text : ''
    }
    const req = confirmedRequirements.find((r: any) => r.id === requirementId)
    return req ? req.text : ''
  }

  return (
    <div className="min-h-screen bg-legal-dark">
      {/* Navigation Header */}
      <nav className="border-b border-legal-blue border-opacity-20 bg-legal-dark bg-opacity-80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold bg-gradient-to-r from-legal-accent to-legal-gold bg-clip-text text-transparent">
              Vettly
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <>
                  <span className="text-sm text-gray-400">{user.email}</span>
                  {currentProject && (
                    <button
                      onClick={handleBackToProjects}
                      className="px-3 py-1.5 text-sm text-legal-accent hover:text-legal-gold transition-colors border border-legal-accent/30 rounded"
                    >
                      Back to Projects
                    </button>
                  )}
                  <button
                    onClick={() => {
                      logout()
                      navigate('/login')
                    }}
                    className="px-4 py-2 bg-legal-accent/20 text-legal-accent rounded-lg hover:bg-legal-accent/30 transition-colors text-sm font-medium"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Active Project Banner */}
        {currentProject && (
          <section className="mb-8">
            <div className="bg-legal-slate/70 rounded-xl border border-legal-accent/40 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-legal-accent">Loaded Project</p>
                <h2 className="text-2xl font-bold text-gray-100 mt-1">{currentProject.name}</h2>
                <p className="text-sm text-gray-400 mt-1">
                  {currentProject.requirements.length} requirements preloaded. You can upload a vendor proposal now.
                </p>
              </div>
              <button
                onClick={handleBackToProjects}
                className="px-4 py-2 text-legal-accent hover:text-legal-gold transition-colors border border-legal-accent/30 rounded-lg"
              >
                Back to Project List
              </button>
            </div>
          </section>
        )}

        <>
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
                  Automatically extract requirements from RFP documents, validate vendor proposals against compliance standards,
                  and identify risks.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-legal-slate bg-opacity-50 rounded-lg p-6 border border-legal-blue border-opacity-20 hover:border-legal-accent hover:border-opacity-50 transition-all">
                  <div className="text-3xl mb-3">🤖</div>
                  <h3 className="font-semibold text-gray-100 mb-2">AI-Powered</h3>
                  <p className="text-sm text-gray-400">
                    Claude AI automatically extracts requirements and evaluates compliance
                  </p>
                </div>

                <div className="bg-legal-slate bg-opacity-50 rounded-lg p-6 border border-legal-blue border-opacity-20 hover:border-legal-accent hover:border-opacity-50 transition-all">
                  <div className="text-3xl mb-3">✅</div>
                  <h3 className="font-semibold text-gray-100 mb-2">Vendor Validation</h3>
                  <p className="text-sm text-gray-400">
                    Instantly validate vendor proposals against all confirmed requirements
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
                  onConfirm={(selected) => handleConfirmRequirements(selected)}
                />

                {/* Save Project Button */}
                {!currentProject && (
                  <div className="mt-6 flex justify-end gap-4">
                    {saveProjectError && (
                      <div className="w-full p-4 bg-red-950 border border-red-700 rounded-lg">
                        <p className="text-sm text-red-300">{saveProjectError}</p>
                      </div>
                    )}
                    <button
                      onClick={() => setShowSaveDialog(true)}
                      disabled={isSavingProject || confirmedRequirements.length === 0}
                      className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-600 transition-colors"
                    >
                      {isSavingProject ? 'Saving...' : '💾 Save Project'}
                    </button>
                  </div>
                )}

                {showSaveDialog && !currentProject && (
                  <div className="mt-6 p-4 border border-legal-blue/30 rounded-lg bg-legal-slate/50">
                    <h4 className="font-semibold text-gray-100 mb-4">Save Project</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Project name (e.g., RFP-2024-Q1)"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full px-4 py-2 bg-legal-dark border border-legal-blue/40 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-legal-accent"
                      />
                      <textarea
                        placeholder="Project description (optional)"
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        className="w-full px-4 py-2 bg-legal-dark border border-legal-blue/40 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-legal-accent"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveProject}
                          disabled={isSavingProject || !projectName.trim()}
                          className="flex-1 px-4 py-2 bg-legal-accent text-white font-semibold rounded-lg hover:bg-legal-accent/90 disabled:bg-gray-600"
                        >
                          {isSavingProject ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setShowSaveDialog(false)
                            setProjectName('')
                            setProjectDescription('')
                          }}
                          className="flex-1 px-4 py-2 bg-gray-700 text-gray-100 font-semibold rounded-lg hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {confirmedRequirements.length > 0 && (
                  <div className="mt-6 rounded-xl border border-legal-blue/30 bg-legal-slate/50 p-5">
                    <h3 className="text-lg font-semibold text-gray-100">Vendor Proposal Validation</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Validate one vendor proposal against {confirmedRequirements.length} confirmed requirement
                      {confirmedRequirements.length === 1 ? '' : 's'}.
                    </p>

                    {isValidatingVendor && (
                      <div className="mt-4">
                        <SimulatedProgressBar
                          progress={validationProgress}
                          label="Validating vendor proposal"
                          helperText="Estimated progress while Gemini matches the proposal against all selected requirements."
                        />
                      </div>
                    )}

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="vendorName" className="block text-sm font-semibold text-gray-200 mb-2">
                          Vendor Name (optional)
                        </label>
                        <input
                          id="vendorName"
                          type="text"
                          value={vendorName}
                          onChange={(event) => {
                            setVendorName(event.target.value)
                            setHasValidatedVendor(false)
                            setHasScannedRisks(false)
                            setValidationResult(null)
                            setRiskScanResult(null)
                          }}
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
                          onChange={(event) => {
                            const file = event.target.files?.[0] ?? null
                            setVendorProposalFile(file)
                            setValidationError('')
                            setHasValidatedVendor(false)
                            setHasScannedRisks(false)
                            setValidationResult(null)
                            setRiskScanResult(null)
                          }}
                          className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-legal-accent/20 file:text-legal-accent hover:file:bg-legal-accent/30"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={handleValidateVendor}
                        disabled={isValidatingVendor || hasValidatedVendor || !vendorProposalFile || !vendorName.trim()}
                        className="px-4 py-2 rounded-lg bg-legal-accent text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:bg-legal-blue transition-colors"
                      >
                        {isValidatingVendor ? 'Validating...' : 'Validate Vendor'}
                      </button>

                      <button
                        type="button"
                        onClick={handleScanRisks}
                        disabled={isScanningRisks || hasScannedRisks || !vendorProposalFile || !vendorName.trim()}
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
                        <div className="mb-6">
                          <h4 className="text-base font-semibold text-gray-100 mb-4">Validation Summary</h4>
                          <div className="grid grid-cols-3 gap-4">
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
                        </div>

                        <div className="mt-4 rounded-lg border border-legal-blue/30 overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-legal-dark/80">
                              <tr>
                                <th className="text-left px-4 py-3 text-xs uppercase text-gray-400 font-semibold">
                                  Requirement
                                </th>
                                <th className="text-left px-4 py-3 text-xs uppercase text-gray-400 font-semibold">Status</th>
                                <th className="text-left px-4 py-3 text-xs uppercase text-gray-400 font-semibold">
                                  Confidence
                                </th>
                                <th className="text-left px-4 py-3 text-xs uppercase text-gray-400 font-semibold">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {validationResult.complianceResults.map((result: any) => (
                                <tr key={result.requirementId} className="border-t border-legal-blue/20">
                                  <td className="px-4 py-3 text-gray-200">
                                    {getRequirementTextById(result.requirementId) || result.requirementId}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`inline-flex px-2.5 py-1 rounded-full text-xs border ${
                                        result.status === 'Met'
                                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                                          : result.status === 'Partially Met'
                                            ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                                            : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                                      }`}
                                    >
                                      {result.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-gray-300">{result.confidenceScore}</td>
                                  <td className="px-4 py-3">
                                    <button
                                      type="button"
                                      onClick={() => setActiveComplianceResult(result)}
                                      className="text-sm font-medium text-legal-accent hover:text-legal-gold"
                                    >
                                      View
                                    </button>
                                  </td>
                                </tr>
                              ))}
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
              {projects.length > 0 && <RecentProjectsList projects={projects.map(p => ({ ...p as any, vendorCount: p.proposalCount || 0 }))} onOpenProject={handleOpenProject} />}
            </section>
        </>

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
        requirementText={activeComplianceResult ? getRequirementTextById(activeComplianceResult.requirementId) : ''}
        onClose={() => setActiveComplianceResult(null)}
        onFlagForReview={({ requirementId, note }: any) => {
          console.log('Flagged for review:', { requirementId, note })
          alert(`Flagged ${requirementId} for review.`)
        }}
      />
    </div>
  )
}
