import { Router, Response } from 'express'
import multer from 'multer'
import pdfParse from 'pdf-parse'
import { Prisma, PrismaClient } from '@prisma/client'
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware'

const prisma = new PrismaClient()
const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

type SavedComplianceResultInput = {
  requirementId: string
  status: 'Met' | 'Partially Met' | 'Missing'
  confidenceScore: number
  matchedExcerpt?: string | null
  explanation?: string
  suggestedFollowUp?: string
}

type SavedVendorProposalPayload = {
  vendorName?: string
  validationResult?: {
    vendorName?: string
    complianceResults?: SavedComplianceResultInput[]
    overallScore?: number
    metCount?: number
    partialCount?: number
    missingCount?: number
  }
  matchingCriteria?: unknown
  requirementsSnapshot?: unknown
}

router.use(authMiddleware)

const parseJsonField = <T>(value: unknown): T | null => {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

router.post('/:projectId/save', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: req.userId },
      include: {
        requirements: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No vendor proposal file uploaded.' })
    }

    const proposalFile = req.file

    const vendorNameFromBody = typeof req.body?.vendorName === 'string' ? req.body.vendorName.trim() : ''
    const parsedPayload = parseJsonField<SavedVendorProposalPayload>(req.body?.payload)
    const validationResult = parsedPayload?.validationResult ?? null

    const vendorName =
      vendorNameFromBody ||
      validationResult?.vendorName?.trim() ||
      req.file.originalname.replace(/\.pdf$/i, '').trim() ||
      'Unknown Vendor'

    const proposalText = (await pdfParse(proposalFile.buffer)).text?.trim() ?? ''

    if (!proposalText) {
      return res.status(400).json({ error: 'Uploaded PDF contains no extractable text.' })
    }

    const complianceResults = Array.isArray(validationResult?.complianceResults)
      ? validationResult.complianceResults
      : []

    const resultsByRequirementId = new Map(
      complianceResults
        .filter(result => typeof result?.requirementId === 'string')
        .map(result => [result.requirementId, result])
    )

    const normalizedResults = project.requirements.map(requirement => {
      const result = resultsByRequirementId.get(requirement.id)

      return {
        requirementId: requirement.id,
        status: result?.status ?? 'Missing',
        confidence: Math.max(0, Math.min(100, Math.round(result?.confidenceScore ?? 0))),
        matchedExcerpt: result?.matchedExcerpt ?? null,
        explanation:
          result?.explanation ??
          'No validation result was returned for this requirement when the vendor details were saved.',
        suggestedFollowUp: result?.suggestedFollowUp ?? null,
      }
    })

    const metCount = normalizedResults.filter(result => result.status === 'Met').length
    const partialCount = normalizedResults.filter(result => result.status === 'Partially Met').length
    const missingCount = normalizedResults.filter(result => result.status === 'Missing').length
    const totalPoints = normalizedResults.reduce((sum, result) => {
      if (result.status === 'Met') return sum + 100
      if (result.status === 'Partially Met') return sum + 50
      return sum
    }, 0)
    const overallScore = normalizedResults.length > 0 ? Math.round(totalPoints / normalizedResults.length) : 0

    const savedProposal = await prisma.$transaction(async tx => {
      const proposal = await tx.vendorProposal.create({
        data: {
          vendorName,
          filename: proposalFile.originalname,
          fileSize: proposalFile.size,
          proposalText,
          matchingCriteria: parsedPayload?.matchingCriteria
            ? (parsedPayload.matchingCriteria as Prisma.InputJsonValue)
            : Prisma.DbNull,
          requirementsSnapshot:
            parsedPayload?.requirementsSnapshot
              ? (parsedPayload.requirementsSnapshot as Prisma.InputJsonValue)
              : (project.requirements.map(requirement => ({
                  id: requirement.id,
                  text: requirement.text,
                  category: requirement.category,
                  priority: requirement.priority,
                  order: requirement.order,
                })) as Prisma.InputJsonValue),
          overallScore,
          metCount,
          partialCount,
          missingCount,
          validatedAt: new Date(),
          projectId: project.id,
          userId: req.userId!,
        },
      })

      await tx.complianceResult.createMany({
        data: normalizedResults.map(result => ({
          proposalId: proposal.id,
          requirementId: result.requirementId,
          status: result.status,
          confidence: result.confidence,
          matchedExcerpt: result.matchedExcerpt,
          explanation: result.explanation,
          suggestedFollowUp: result.suggestedFollowUp,
        })),
      })

      return proposal
    })

    res.status(201).json({
      id: savedProposal.id,
      vendorName: savedProposal.vendorName,
      filename: savedProposal.filename,
      fileSize: savedProposal.fileSize,
      validatedAt: savedProposal.validatedAt,
      overallScore: savedProposal.overallScore,
      metCount: savedProposal.metCount,
      partialCount: savedProposal.partialCount,
      missingCount: savedProposal.missingCount,
    })
  } catch (error: any) {
    console.error('Failed to save vendor proposal:', error)
    res.status(500).json({ error: error.message || 'Failed to save vendor proposal.' })
  }
})

router.delete('/:projectId/:proposalId', async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, proposalId } = req.params

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: req.userId,
      },
    })

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const proposal = await prisma.vendorProposal.findFirst({
      where: {
        id: proposalId,
        projectId,
        userId: req.userId,
      },
      select: {
        id: true,
      },
    })

    if (!proposal) {
      return res.status(404).json({ error: 'Saved vendor not found for this project' })
    }

    await prisma.vendorProposal.delete({
      where: { id: proposal.id },
    })

    return res.json({ message: 'Saved vendor deleted' })
  } catch (error: any) {
    console.error('Failed to delete saved vendor proposal:', error)
    return res.status(500).json({ error: error.message || 'Failed to delete saved vendor' })
  }
})

export default router