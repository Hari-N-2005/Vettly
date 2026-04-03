import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useProjectStore } from '../stores/projectStore'
import { ComplianceStatus, RequirementCategory } from '@/types'
import { deleteProposal, saveVendorProposal, validateVendorProposal } from '../services/proposalService'
import { uploadRFPForExtraction } from '../services/rfpService'
import { scanVendorRisks } from '../services/riskService'

import RFPUploadForm from '../components/upload/RFPUploadForm'
import RequirementChecklist from '../components/requirements/RequirementChecklist'
import RiskFlagPanel from '../components/risks/RiskFlagPanel'
import RiskHeatmap from '../components/risks/RiskHeatmap'
import AnalysisLoader from '../components/common/AnalysisLoader'
import ErrorToast from '../components/common/ErrorToast'
import EmptyState from '../components/common/EmptyState'
import RecentProjectsList from '../components/rfp/RecentProjectsList'
import VendorComparisonTable, { VendorComparisonVendor } from '../components/proposals/VendorComparisonTable'
import { useSimulatedProgress } from '@/hooks/useSimulatedProgress'
import { useTender, VendorResult } from '@/context/TenderContext'

const normalizeCategory = (category?: string): RequirementCategory => {
  if (category === 'Technical' || category === 'Legal' || category === 'Financial' || category === 'Operational' || category === 'Environmental') {
    return category
  }

  return 'Operational'
}

export default function Home() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { state: tenderState, dispatch: tenderDispatch } = useTender()
  const {
    projects,
    currentProject,
    fetchProjects,
    fetchProject,
    createProject,
    deleteProject,
    appendVendorProposal,
    removeVendorProposal,
    clearCurrentProject,
  } = useProjectStore()

  const [extractedRequirements, setExtractedRequirements] = useState<any[]>([])
  const [extractionMeta, setExtractionMeta] = useState<any>(null)
  const [confirmedRequirements, setConfirmedRequirements] = useState<any[]>([])
  const [vendorName, setVendorName] = useState('')
  const [vendorProposalFile, setVendorProposalFile] = useState<File | null>(null)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [expandedValidationResultIds, setExpandedValidationResultIds] = useState<Record<string, boolean>>({})
  const [validationError, setValidationError] = useState<string>('')
  const [isValidatingVendor, setIsValidatingVendor] = useState(false)
  const [hasValidatedVendor, setHasValidatedVendor] = useState(false)
  const [riskScanResult, setRiskScanResult] = useState<any>(null)
  const [riskScanError, setRiskScanError] = useState<string>('')
  const [isScanningRisks, setIsScanningRisks] = useState(false)
  const [hasScannedRisks, setHasScannedRisks] = useState(false)
  const [isSavingProject, setIsSavingProject] = useState(false)
  const [saveProjectError, setSaveProjectError] = useState<string>('')
  const [isSavingVendorDetails, setIsSavingVendorDetails] = useState(false)
  const [saveVendorDetailsError, setSaveVendorDetailsError] = useState<string>('')
  const [deleteProjectError, setDeleteProjectError] = useState<string>('')
  const [deleteVendorError, setDeleteVendorError] = useState<string>('')
  const [isDeletingVendor, setIsDeletingVendor] = useState(false)
  const [hasSavedVendorDetails, setHasSavedVendorDetails] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [pendingDeleteProjectId, setPendingDeleteProjectId] = useState<string | null>(null)
  const [showDeleteVendorDialog, setShowDeleteVendorDialog] = useState(false)
  const [pendingDeleteVendorId, setPendingDeleteVendorId] = useState<string | null>(null)
  const [showSavedVendors, setShowSavedVendors] = useState(false)
  const [selectedComparisonVendorIds, setSelectedComparisonVendorIds] = useState<string[]>([])
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
    setSaveVendorDetailsError('')
    setDeleteProjectError('')
    setDeleteVendorError('')
    setShowDeleteDialog(false)
    setShowDeleteVendorDialog(false)
    setPendingDeleteProjectId(null)
    setPendingDeleteVendorId(null)
    setShowSavedVendors(false)
    setSelectedComparisonVendorIds([])
    setHasSavedVendorDetails(false)
    setValidationResult(null)
    setRiskScanResult(null)
    setValidationError('')
    setRiskScanError('')

    tenderDispatch({
      type: 'SET_RFP',
      payload: {
        projectName: currentProject.name,
        rfpDocument: null,
      },
    })
    tenderDispatch({ type: 'SET_REQUIREMENTS', payload: mappedRequirements as any })
    tenderDispatch({ type: 'SET_STEP', payload: 'validate' })
  }, [currentProject, tenderDispatch])

  useEffect(() => {
    if (!isValidatingVendor && validationResult) {
      const timerId = window.setTimeout(() => resetValidationProgress(), 1200)
      return () => window.clearTimeout(timerId)
    }

    return undefined
  }, [isValidatingVendor, resetValidationProgress, validationResult])

  const savedVendors = useMemo(() => {
    if (!currentProject?.proposals?.length) {
      return []
    }

    return [...currentProject.proposals].sort((a: any, b: any) => {
      const aTime = new Date(a.validatedAt || a.uploadedAt).getTime()
      const bTime = new Date(b.validatedAt || b.uploadedAt).getTime()
      return bTime - aTime
    })
  }, [currentProject])

  const comparisonCategories = useMemo(() => {
    const uniqueCategories = new Set<string>()
    confirmedRequirements.forEach((req: any) => {
      uniqueCategories.add(normalizeCategory(req.category))
    })
    return Array.from(uniqueCategories)
  }, [confirmedRequirements])

  const toggleComparisonVendor = (proposalId: string) => {
    setSelectedComparisonVendorIds(prev =>
      prev.includes(proposalId)
        ? prev.filter(id => id !== proposalId)
        : [...prev, proposalId]
    )
  }

  const buildCategoryStatuses = (resultsByRequirement: Map<string, any>) => {
    const categoryStatuses: VendorComparisonVendor['categoryStatuses'] = {}

    const categoryBuckets = new Map<
      string,
      Array<{
        requirement: any
        result: any
      }>
    >()

    confirmedRequirements.forEach((requirement: any) => {
      const category = normalizeCategory(requirement.category)
      const matchedResult = resultsByRequirement.get(requirement.id)

      const bucket = categoryBuckets.get(category) ?? []
      bucket.push({ requirement, result: matchedResult })
      categoryBuckets.set(category, bucket)
    })

    categoryBuckets.forEach((entries, category) => {
      const metCount = entries.filter(entry => entry.result?.status === 'Met').length
      const partialCount = entries.filter(entry => entry.result?.status === 'Partially Met').length
      const missingCount = entries.filter(entry => !entry.result || entry.result.status === 'Missing').length

      let status: ComplianceStatus = 'Missing'
      if (metCount === entries.length) {
        status = 'Met'
      } else if (missingCount === 0 && partialCount > 0) {
        status = 'Partially Met'
      } else if (metCount > 0 || partialCount > 0) {
        status = 'Partially Met'
      }

      const representativeEntry =
        entries.find(entry => entry.result?.status === 'Met') ||
        entries.find(entry => entry.result?.status === 'Partially Met') ||
        entries[0]

      const representativeResult = representativeEntry.result ?? {
        requirementId: representativeEntry.requirement.id,
        status: 'Missing' as ComplianceStatus,
        confidenceScore: 0,
        matchedExcerpt: null,
        explanation: 'No detailed explanation returned.',
      }

      categoryStatuses[category] = {
        status,
        deepDive: {
          result: representativeResult,
          requirementText: representativeEntry.requirement.requirementText,
          categoryRequirementResults: entries.map(entry => ({
            requirementId: entry.requirement.id,
            requirementText: entry.requirement.requirementText,
            result:
              entry.result ?? {
                requirementId: entry.requirement.id,
                status: 'Missing' as ComplianceStatus,
                confidenceScore: 0,
                matchedExcerpt: null,
                explanation: 'No detailed explanation returned.',
              },
          })),
        },
      }
    })

    return categoryStatuses
  }

  const comparisonVendors = useMemo<VendorComparisonVendor[]>(() => {
    if (currentProject && selectedComparisonVendorIds.length === 0) {
      return []
    }

    if (currentProject?.proposals?.length && selectedComparisonVendorIds.length > 0) {
      const selectedProposals = currentProject.proposals.filter((proposal: any) =>
        selectedComparisonVendorIds.includes(proposal.id)
      )

      if (selectedProposals.length > 0) {
        return selectedProposals.map((proposal: any) => {
          const normalizedResults = Array.isArray(proposal.complianceResults)
            ? proposal.complianceResults.map((result: any) => ({
                requirementId: result.requirementId,
                status:
                  result.status === 'Met' || result.status === 'Partially Met' || result.status === 'Missing'
                    ? result.status
                    : ('Missing' as ComplianceStatus),
                confidenceScore: result.confidence ?? 0,
                matchedExcerpt: result.matchedExcerpt ?? null,
                explanation: result.explanation || 'No detailed explanation returned.',
                suggestedFollowUp: result.suggestedFollowUp || undefined,
              }))
            : []

          const resultsByRequirement = new Map<string, any>()
          normalizedResults.forEach((result: any) => {
            resultsByRequirement.set(result.requirementId, result)
          })

          const metCount =
            typeof proposal.metCount === 'number'
              ? proposal.metCount
              : normalizedResults.filter((result: any) => result.status === 'Met').length
          const partialCount =
            typeof proposal.partialCount === 'number'
              ? proposal.partialCount
              : normalizedResults.filter((result: any) => result.status === 'Partially Met').length
          const missingCount =
            typeof proposal.missingCount === 'number'
              ? proposal.missingCount
              : normalizedResults.filter((result: any) => result.status === 'Missing').length

          return {
            vendorId: proposal.id,
            vendorName: proposal.vendorName || 'Saved Vendor',
            complianceScore: proposal.overallScore ?? 0,
            metCount,
            partialCount,
            missingCount,
            risks: {
              total: 0,
              high: 0,
              medium: 0,
              low: 0,
            },
            categoryStatuses: buildCategoryStatuses(resultsByRequirement),
          }
        })
      }
    }

    if (!validationResult) {
      return []
    }

    const resultsByRequirement = new Map<string, any>()
    validationResult.complianceResults.forEach((result: any) => {
      resultsByRequirement.set(result.requirementId, result)
    })

    const riskSummary = riskScanResult?.riskSummary ?? { high: 0, medium: 0, low: 0 }

    return [
      {
        vendorId: validationResult.vendorName || 'current-vendor',
        vendorName: validationResult.vendorName || 'Current Vendor',
        complianceScore: validationResult.overallScore ?? 0,
        metCount: validationResult.metCount ?? 0,
        partialCount: validationResult.partialCount ?? 0,
        missingCount: validationResult.missingCount ?? 0,
        risks: {
          total: riskScanResult?.riskFlags?.length ?? 0,
          high: riskSummary.high,
          medium: riskSummary.medium,
          low: riskSummary.low,
        },
        categoryStatuses: buildCategoryStatuses(resultsByRequirement),
      },
    ]
  }, [
    buildCategoryStatuses,
    currentProject,
    riskScanResult,
    selectedComparisonVendorIds,
    validationResult,
  ])

  const riskHeatmapVendors = useMemo(() => {
    if (!riskScanResult) {
      return []
    }

    return [riskScanResult.vendorName || validationResult?.vendorName || vendorName || 'Current Vendor']
  }, [riskScanResult, validationResult, vendorName])

  const riskHeatmapMatrix = useMemo(() => {
    if (!riskScanResult || riskHeatmapVendors.length === 0) {
      return {}
    }

    const vendorKey = riskHeatmapVendors[0]
    const baseRow = {
      Liability: 0,
      'Cost Escalation': 0,
      'Vague Commitment': 0,
      'Approval Dependency': 0,
      'Scope Creep': 0,
    }

    const nextRow = { ...baseRow }
    riskScanResult.riskFlags?.forEach((flag: any) => {
      if (flag?.riskType in nextRow) {
        nextRow[flag.riskType as keyof typeof nextRow] += 1
      }
    })

    return {
      [vendorKey]: nextRow,
    }
  }, [riskHeatmapVendors, riskScanResult])

  const handleRequirementsExtracted = (payload: any, file?: File) => {
    const requirements = payload.requirements || payload
    const project = payload?.projectName || ''

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
    setHasSavedVendorDetails(false)
    setSaveVendorDetailsError('')

    tenderDispatch({
      type: 'SET_RFP',
      payload: {
        projectName: project,
        rfpDocument: file ?? null,
      },
    })
    tenderDispatch({ type: 'SET_REQUIREMENTS', payload: [] })
    tenderDispatch({ type: 'SET_STEP', payload: 'review' })
  }

  const handleConfirmRequirements = (selected: any[]) => {
    setConfirmedRequirements(selected)
    tenderDispatch({ type: 'SET_REQUIREMENTS', payload: selected as any })
    tenderDispatch({ type: 'SET_STEP', payload: 'validate' })
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
    setHasSavedVendorDetails(false)
    setSaveVendorDetailsError('')
    setVendorProposalFile(null)
    setVendorName('')
    clearCurrentProject()
    tenderDispatch({ type: 'RESET' })
    await fetchProject(projectId)
  }

  const handleRequestDeleteProject = (projectId: string) => {
    setPendingDeleteProjectId(projectId)
    setDeleteProjectError('')
    setShowDeleteDialog(true)
  }

  const handleRequestDeleteVendor = (proposalId: string) => {
    setPendingDeleteVendorId(proposalId)
    setDeleteVendorError('')
    setShowDeleteVendorDialog(true)
  }

  const handleDeleteVendor = async () => {
    if (!currentProject?.id || !pendingDeleteVendorId) {
      return
    }

    setIsDeletingVendor(true)
    setDeleteVendorError('')

    try {
      await deleteProposal(currentProject.id, pendingDeleteVendorId)
      removeVendorProposal(currentProject.id, pendingDeleteVendorId)
      setSelectedComparisonVendorIds(prev => prev.filter(id => id !== pendingDeleteVendorId))
      setShowDeleteVendorDialog(false)
      setPendingDeleteVendorId(null)
    } catch (error: any) {
      setDeleteVendorError(error.message || 'Failed to delete saved vendor.')
    } finally {
      setIsDeletingVendor(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!pendingDeleteProjectId) {
      return
    }

    try {
      await deleteProject(pendingDeleteProjectId)

      if (currentProject?.id === pendingDeleteProjectId) {
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
        tenderDispatch({ type: 'RESET' })
      }

      setShowDeleteDialog(false)
      setPendingDeleteProjectId(null)
      setDeleteProjectError('')
    } catch (error: any) {
      setDeleteProjectError(error.message || 'Failed to delete project.')
    }
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
    setHasSavedVendorDetails(false)
    setSaveVendorDetailsError('')
    setShowSavedVendors(false)
    setVendorProposalFile(null)
    setVendorName('')
    tenderDispatch({ type: 'RESET' })
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
      tenderDispatch({ type: 'RESET' })
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
    setHasSavedVendorDetails(false)
    setSaveVendorDetailsError('')

    try {
      const result = await validateVendorProposal(
        vendorProposalFile,
        confirmedRequirements,
        vendorName || undefined
      )

      setValidationResult(result)
      setExpandedValidationResultIds({})
      setValidationError('')
      setHasValidatedVendor(true)

      const mappedVendorResult: VendorResult = {
        id: result.vendorName || `vendor-${Date.now()}`,
        vendorName: result.vendorName || vendorName || 'Unknown Vendor',
        complianceResults: result.complianceResults || [],
        overallScore: result.overallScore || 0,
        metCount: result.metCount || 0,
        partialCount: result.partialCount || 0,
        missingCount: result.missingCount || 0,
      }

      tenderDispatch({ type: 'ADD_VENDOR_RESULT', payload: mappedVendorResult })
      tenderDispatch({ type: 'SET_STEP', payload: 'compare' })
      completeValidationProgress()
    } catch (error: any) {
      setValidationError(error.message || 'Validation failed')
      setValidationResult(null)
      setExpandedValidationResultIds({})
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

  const handleSaveVendorDetails = async () => {
    if (!currentProject) {
      setSaveVendorDetailsError('Save the project first before saving vendor details.')
      return
    }

    if (!vendorProposalFile) {
      setSaveVendorDetailsError('Please select a vendor proposal file.')
      return
    }

    if (!validationResult) {
      setSaveVendorDetailsError('Validate the vendor proposal before saving it.')
      return
    }

    const resolvedVendorName = vendorName.trim() || validationResult.vendorName?.trim() || 'Unknown Vendor'
    const requirementsSnapshot = currentProject.requirements.map((requirement: any) => ({
      id: requirement.id,
      text: requirement.text,
      category: requirement.category,
      priority: requirement.priority,
      order: requirement.order,
    }))

    setIsSavingVendorDetails(true)
    setSaveVendorDetailsError('')

    try {
      const response = await saveVendorProposal(
        currentProject.id,
        resolvedVendorName,
        vendorProposalFile,
        validationResult,
        confirmedRequirements,
        requirementsSnapshot
      )

      appendVendorProposal(currentProject.id, {
        id: response.id,
        vendorName: response.vendorName,
        uploadedAt: new Date(),
        validatedAt: response.validatedAt ? new Date(response.validatedAt) : new Date(),
        overallScore: response.overallScore,
        metCount: response.metCount,
        partialCount: response.partialCount,
        missingCount: response.missingCount,
        filename: response.filename,
        fileSize: response.fileSize,
        matchingCriteria: confirmedRequirements,
        requirementsSnapshot,
        complianceResults: validationResult.complianceResults.map((result: any) => ({
          requirementId: result.requirementId,
          status: result.status,
          confidence: result.confidenceScore ?? 0,
          matchedExcerpt: result.matchedExcerpt ?? null,
          explanation: result.explanation ?? null,
          suggestedFollowUp: result.suggestedFollowUp ?? null,
        })),
      })
      setHasSavedVendorDetails(true)
      tenderDispatch({ type: 'SET_STEP', payload: 'report' })
    } catch (error: any) {
      setSaveVendorDetailsError(error.message || 'Failed to save vendor details.')
      setHasSavedVendorDetails(false)
    } finally {
      setIsSavingVendorDetails(false)
    }
  }

  const isAnalysisLoading = isValidatingVendor || isScanningRisks || isSavingVendorDetails

  const analysisTitle = isValidatingVendor
    ? 'Validating vendor proposal'
    : isScanningRisks
      ? 'Scanning proposal risks'
      : 'Saving vendor results'

  const analysisSteps = isValidatingVendor
    ? [
        'Extracting proposal text...',
        'Matching requirements...',
        'Scoring compliance...',
        'Preparing validation summary...',
      ]
    : isScanningRisks
      ? [
          'Extracting proposal text...',
          'Detecting risky language...',
          'Classifying risk severity...',
          'Compiling risk panel...',
        ]
      : [
          'Preparing vendor payload...',
          'Storing compliance results...',
          'Saving tender comparison data...',
          'Finalizing vendor record...',
        ]

  const activeError =
    validationError
      ? { key: 'validation', message: validationError }
      : riskScanError
        ? { key: 'risk', message: riskScanError }
        : saveProjectError
          ? { key: 'saveProject', message: saveProjectError }
          : saveVendorDetailsError
            ? { key: 'saveVendor', message: saveVendorDetailsError }
            : deleteProjectError
              ? { key: 'deleteProject', message: deleteProjectError }
              : deleteVendorError
                ? { key: 'deleteVendor', message: deleteVendorError }
                : null

  const dismissActiveError = () => {
    if (!activeError) {
      return
    }

    if (activeError.key === 'validation') setValidationError('')
    if (activeError.key === 'risk') setRiskScanError('')
    if (activeError.key === 'saveProject') setSaveProjectError('')
    if (activeError.key === 'saveVendor') setSaveVendorDetailsError('')
    if (activeError.key === 'deleteProject') setDeleteProjectError('')
    if (activeError.key === 'deleteVendor') setDeleteVendorError('')
  }

  const retryActiveError = () => {
    if (!activeError) {
      return
    }

    if (activeError.key === 'validation') {
      void handleValidateVendor()
      return
    }

    if (activeError.key === 'risk') {
      void handleScanRisks()
      return
    }

    if (activeError.key === 'saveProject') {
      void handleSaveProject()
      return
    }

    if (activeError.key === 'saveVendor') {
      void handleSaveVendorDetails()
    }
  }

  return (
    <div className="min-h-screen bg-legal-dark">
      <AnalysisLoader
        isVisible={isAnalysisLoading}
        title={analysisTitle}
        steps={analysisSteps}
        progress={isValidatingVendor ? validationProgress : undefined}
      />

      <ErrorToast
        isVisible={Boolean(activeError)}
        title="Action failed"
        message={activeError?.message || ''}
        onDismiss={dismissActiveError}
        onRetry={
          activeError?.key === 'deleteProject' || activeError?.key === 'deleteVendor'
            ? undefined
            : retryActiveError
        }
      />

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
                <p className="mt-4 text-sm text-legal-accent">
                  Workflow step: {tenderState.currentStep}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-legal-slate bg-opacity-50 rounded-lg p-6 border border-legal-blue border-opacity-20 hover:border-legal-accent hover:border-opacity-50 transition-all">
                  <div className="text-3xl mb-3">🤖</div>
                  <h3 className="font-semibold text-gray-100 mb-2">AI-Powered</h3>
                  <p className="text-sm text-gray-400">
                    AI will automatically extract requirements and evaluate compliance
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

            {extractionMeta && extractedRequirements.length === 0 && (
              <section className="mb-16">
                <EmptyState
                  variant="requirements"
                  title="No requirements were detected"
                  description="Try uploading a clearer RFP file, or adjust the document content so mandatory clauses are explicit."
                  actionLabel="Reset Upload"
                  onAction={() => {
                    setExtractionMeta(null)
                    setConfirmedRequirements([])
                    tenderDispatch({ type: 'SET_STEP', payload: 'upload' })
                  }}
                />
              </section>
            )}

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
                            setHasSavedVendorDetails(false)
                            setSaveVendorDetailsError('')
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
                            setHasSavedVendorDetails(false)
                            setSaveVendorDetailsError('')
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

                    {validationResult && (
                      <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-emerald-100">Validation result ready</h4>
                            <p className="mt-1 text-sm text-emerald-100/80">
                              {validationResult.vendorName || vendorName || 'Unknown Vendor'} was evaluated against the
                              confirmed requirements.
                            </p>
                          </div>
                          <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-right">
                            <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">Overall score</p>
                            <p className="text-2xl font-bold text-emerald-100">
                              {validationResult.overallScore}%
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3">
                            <p className="text-xs text-emerald-200/70">Met</p>
                            <p className="text-lg font-semibold text-emerald-100">{validationResult.metCount}</p>
                          </div>
                          <div className="rounded-lg border border-amber-400/20 bg-amber-500/10 p-3">
                            <p className="text-xs text-amber-200/70">Partially met</p>
                            <p className="text-lg font-semibold text-amber-100">{validationResult.partialCount}</p>
                          </div>
                          <div className="rounded-lg border border-rose-400/20 bg-rose-500/10 p-3">
                            <p className="text-xs text-rose-200/70">Missing</p>
                            <p className="text-lg font-semibold text-rose-100">{validationResult.missingCount}</p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-lg border border-legal-blue/20 bg-legal-dark/40 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-gray-100">Full compliance results</p>
                            <p className="text-xs text-gray-400">{validationResult.complianceResults.length} requirements</p>
                          </div>

                          {validationResult.complianceResults.length > 0 ? (
                            <div className="mt-3 max-h-[32rem] space-y-3 overflow-y-auto pr-1">
                              {validationResult.complianceResults.map((result: any, index: number) => {
                                const matchedRequirement = confirmedRequirements.find(
                                  (requirement: any) => requirement.id === result.requirementId
                                )

                                return (
                                  <article
                                    key={`${result.requirementId}-${index}`}
                                    className="rounded-lg border border-legal-blue/20 bg-legal-slate/40 p-4"
                                  >
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                      <div className="min-w-0">
                                        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                                          Requirement {index + 1}
                                        </p>
                                        <h5 className="mt-1 text-sm font-semibold text-gray-100">
                                          {matchedRequirement?.requirementText || result.requirementText || result.requirementId}
                                        </h5>
                                        <p className="mt-1 text-xs text-gray-400">
                                          ID: <span className="font-semibold text-gray-200">{result.requirementId}</span>
                                        </p>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                            result.status === 'Met'
                                              ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                                              : result.status === 'Partially Met'
                                                ? 'border-amber-400/40 bg-amber-500/15 text-amber-200'
                                                : 'border-rose-400/40 bg-rose-500/15 text-rose-200'
                                          }`}
                                        >
                                          {result.status}
                                        </span>
                                        <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-200">
                                          {result.confidenceScore}% confidence
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setExpandedValidationResultIds(prev => ({
                                              ...prev,
                                              [result.requirementId]: !prev[result.requirementId],
                                            }))
                                          }
                                          className="rounded-full border border-legal-blue/30 bg-legal-dark/60 px-3 py-1 text-[11px] font-semibold text-gray-200 transition-colors hover:bg-legal-blue/20"
                                        >
                                          {expandedValidationResultIds[result.requirementId] ? 'Hide details' : 'Show details'}
                                        </button>
                                      </div>
                                    </div>

                                    {expandedValidationResultIds[result.requirementId] && (
                                      <>
                                        <div className="mt-3 grid gap-3 text-sm text-gray-300 md:grid-cols-2">
                                          <div className="rounded-md border border-legal-blue/20 bg-legal-dark/50 p-3">
                                            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Matched excerpt</p>
                                            <p className="mt-1 text-gray-200">
                                              {result.matchedExcerpt || 'No excerpt returned.'}
                                            </p>
                                          </div>
                                          <div className="rounded-md border border-legal-blue/20 bg-legal-dark/50 p-3">
                                            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Explanation</p>
                                            <p className="mt-1 text-gray-200">{result.explanation || 'No explanation returned.'}</p>
                                          </div>
                                        </div>

                                        {result.suggestedFollowUp && (
                                          <div className="mt-3 rounded-md border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-100">
                                            <p className="text-xs uppercase tracking-[0.16em] text-amber-200/70">Suggested follow-up</p>
                                            <p className="mt-1">{result.suggestedFollowUp}</p>
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </article>
                                )
                              })}
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-gray-400">No compliance results were returned.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {currentProject && (
                      <div className="mt-6 rounded-xl border border-legal-blue/30 bg-legal-slate/50 p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-100">Saved Vendors</h4>
                            <p className="text-sm text-gray-400">{savedVendors.length} saved for this project</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowSavedVendors(prev => !prev)}
                            className="px-4 py-2 text-emerald-300 hover:text-emerald-200 transition-colors border border-emerald-400/40 rounded-lg"
                          >
                            {showSavedVendors ? 'Hide Saved Vendors' : `View Saved Vendors (${savedVendors.length})`}
                          </button>
                        </div>

                        {showSavedVendors && (
                          <div className="mt-4">
                            {savedVendors.length === 0 ? (
                              <EmptyState
                                variant="vendors"
                                title="No vendors saved yet"
                                description="Validate a proposal and save vendor details to start comparisons."
                              />
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {savedVendors.map((proposal: any) => (
                                  <article
                                    key={proposal.id}
                                    className="rounded-lg border border-legal-blue/30 bg-legal-dark/40 p-4"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <h4 className="text-lg font-semibold text-gray-100">{proposal.vendorName}</h4>
                                        <p className="text-xs text-gray-400 mt-1">
                                          Saved {new Date(proposal.validatedAt || proposal.uploadedAt).toLocaleString()}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xs text-gray-400">Overall Score</p>
                                        <p className="text-xl font-bold text-legal-gold">{proposal.overallScore ?? 0}%</p>
                                      </div>
                                    </div>

                                    <div className="mt-3 text-sm text-gray-300 grid grid-cols-3 gap-2">
                                      <p>
                                        Met: <span className="text-emerald-300 font-semibold">{proposal.metCount ?? 0}</span>
                                      </p>
                                      <p>
                                        Partial: <span className="text-amber-300 font-semibold">{proposal.partialCount ?? 0}</span>
                                      </p>
                                      <p>
                                        Missing: <span className="text-rose-300 font-semibold">{proposal.missingCount ?? 0}</span>
                                      </p>
                                    </div>

                                    {proposal.filename && (
                                      <p className="mt-2 text-xs text-gray-400 truncate">File: {proposal.filename}</p>
                                    )}

                                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <button
                                        type="button"
                                        onClick={() => toggleComparisonVendor(proposal.id)}
                                        className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                                          selectedComparisonVendorIds.includes(proposal.id)
                                            ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                                            : 'border-legal-blue/40 bg-legal-slate text-gray-200 hover:bg-legal-blue/20'
                                        }`}
                                      >
                                        {selectedComparisonVendorIds.includes(proposal.id)
                                          ? 'Added To Comparison'
                                          : 'Use For Comparison'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRequestDeleteVendor(proposal.id)}
                                        className="rounded-lg border border-rose-500/50 bg-rose-500/20 px-3 py-2 text-sm font-semibold text-rose-200 transition-colors hover:bg-rose-500/30"
                                      >
                                        Delete Vendor
                                      </button>
                                    </div>
                                  </article>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {validationResult && (
                      <div className="mt-6 rounded-xl border border-legal-blue/30 bg-legal-slate/50 p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-100">Save vendor details</h4>
                          <p className="text-sm text-gray-400 mt-1">
                            Persist the vendor name, uploaded proposal, matching criteria, and all requirement results for
                            comparison across vendors.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleSaveVendorDetails}
                          disabled={
                            isSavingVendorDetails ||
                            hasSavedVendorDetails ||
                            !currentProject ||
                            !vendorProposalFile ||
                            !validationResult
                          }
                          className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-4 py-2.5 text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSavingVendorDetails
                            ? 'Saving...'
                            : hasSavedVendorDetails
                              ? 'Saved to Comparison'
                              : 'Save Vendor Details'}
                        </button>
                      </div>
                    )}

                    {comparisonVendors.length > 0 && (
                      <div className="mt-6">
                        <VendorComparisonTable
                          vendors={comparisonVendors}
                          categories={comparisonCategories}
                          onFlagForReview={({ vendorName: flaggedVendorName, category, requirementId, note }) => {
                            console.log('Flagged for review:', {
                              vendor: flaggedVendorName,
                              category,
                              requirementId,
                              note,
                            })
                            alert(`Flagged ${requirementId} (${category}) for review.`)
                          }}
                        />
                      </div>
                    )}

                    {currentProject && selectedComparisonVendorIds.length === 0 && savedVendors.length > 0 && (
                      <div className="mt-6">
                        <EmptyState
                          variant="vendors"
                          title="No vendors selected for comparison"
                          description="Use the 'Use For Comparison' button in a vendor panel to load the comparison table."
                        />
                      </div>
                    )}

                    {riskScanResult && (
                      <div className="mt-6">
                        <RiskHeatmap vendors={riskHeatmapVendors} riskMatrix={riskHeatmapMatrix} />

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
              {projects.length > 0 && (
                <RecentProjectsList
                  projects={projects.map(p => ({ ...p as any, vendorCount: p.proposalCount || 0 }))}
                  onOpenProject={handleOpenProject}
                  onDeleteProject={handleRequestDeleteProject}
                />
              )}

              {projects.length === 0 && (
                <EmptyState
                  variant="generic"
                  title="No saved projects yet"
                  description="Upload an RFP and save confirmed requirements to create your first tender project."
                  actionLabel="Start New Review"
                  onAction={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                />
              )}
            </section>

            {showDeleteDialog && pendingDeleteProjectId && (
              <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
                <div
                  className="absolute inset-0 bg-black/60"
                  onClick={() => {
                    setShowDeleteDialog(false)
                    setPendingDeleteProjectId(null)
                    setDeleteProjectError('')
                  }}
                />
                <div className="relative w-full max-w-lg rounded-2xl border border-rose-500/30 bg-legal-dark p-6 shadow-2xl">
                  <p className="text-xs uppercase tracking-[0.2em] text-rose-300">Delete project</p>
                  <h3 className="mt-2 text-xl font-bold text-gray-100">
                    Remove this project from the database?
                  </h3>
                  <p className="mt-3 text-sm text-gray-300">
                    This action permanently deletes the project, its uploaded document, and all saved requirements.
                    It cannot be undone.
                  </p>

                  {deleteProjectError && (
                    <p className="mt-4 rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
                      {deleteProjectError}
                    </p>
                  )}

                  <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteDialog(false)
                        setPendingDeleteProjectId(null)
                        setDeleteProjectError('')
                      }}
                      className="rounded-lg border border-legal-blue/40 bg-legal-slate px-4 py-2.5 text-sm font-semibold text-gray-100 transition-colors hover:bg-legal-blue/20"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteProject}
                      className="rounded-lg border border-rose-500/50 bg-rose-500/20 px-4 py-2.5 text-sm font-semibold text-rose-200 transition-colors hover:bg-rose-500/30"
                    >
                      Delete Project
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showDeleteVendorDialog && pendingDeleteVendorId && (
              <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
                <div
                  className="absolute inset-0 bg-black/60"
                  onClick={() => {
                    if (isDeletingVendor) {
                      return
                    }
                    setShowDeleteVendorDialog(false)
                    setPendingDeleteVendorId(null)
                    setDeleteVendorError('')
                  }}
                />
                <div className="relative w-full max-w-lg rounded-2xl border border-rose-500/30 bg-legal-dark p-6 shadow-2xl">
                  <p className="text-xs uppercase tracking-[0.2em] text-rose-300">Delete saved vendor</p>
                  <h3 className="mt-2 text-xl font-bold text-gray-100">
                    Remove this vendor from the project?
                  </h3>
                  <p className="mt-3 text-sm text-gray-300">
                    This deletes the saved vendor proposal and all associated compliance results for this project.
                  </p>

                  {deleteVendorError && (
                    <p className="mt-4 rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
                      {deleteVendorError}
                    </p>
                  )}

                  <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (isDeletingVendor) {
                          return
                        }
                        setShowDeleteVendorDialog(false)
                        setPendingDeleteVendorId(null)
                        setDeleteVendorError('')
                      }}
                      className="rounded-lg border border-legal-blue/40 bg-legal-slate px-4 py-2.5 text-sm font-semibold text-gray-100 transition-colors hover:bg-legal-blue/20"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteVendor}
                      disabled={isDeletingVendor}
                      className="rounded-lg border border-rose-500/50 bg-rose-500/20 px-4 py-2.5 text-sm font-semibold text-rose-200 transition-colors hover:bg-rose-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isDeletingVendor ? 'Deleting...' : 'Delete Vendor'}
                    </button>
                  </div>
                </div>
              </div>
            )}
        </>

        {/* Footer */}
        <footer className="mt-20 border-t border-legal-blue border-opacity-20 pt-12 text-center">
          <p className="text-gray-400 text-sm">
            © 2026 Vettly - Intelligent Tender Compliance Validation. All rights reserved.
          </p>
        </footer>
      </main>

    </div>
  )
}
