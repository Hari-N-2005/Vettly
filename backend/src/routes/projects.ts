import { Router, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const router = Router()

// Protect all routes with auth middleware
router.use(authMiddleware)

// GET user's projects
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.userId },
      include: {
        _count: {
          select: { requirements: true, proposals: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(
      projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        createdAt: p.createdAt,
        requirementCount: p._count.requirements,
        proposalCount: p._count.proposals,
      }))
    )
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// GET project by ID with requirements
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const project = await prisma.project.findFirst({
      where: { id, userId: req.userId },
      include: {
        documents: true,
        requirements: {
          orderBy: { order: 'asc' },
        },
        proposals: {
          select: {
            id: true,
            vendorName: true,
            uploadedAt: true,
            validatedAt: true,
            overallScore: true,
          },
        },
      },
    })

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    res.json(project)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// CREATE project with requirements
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, requirements, rfpFileName, rfpFileSize } = req.body

    if (!name || !requirements || !Array.isArray(requirements) || requirements.length === 0) {
      return res.status(400).json({ error: 'Project name and requirements are required' })
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        status: 'active',
        userId: req.userId!,
      },
    })

    // Create RFP document record
    const document = await prisma.rFPDocument.create({
      data: {
        filename: rfpFileName || 'uploaded.pdf',
        fileSize: rfpFileSize || 0,
        projectId: project.id,
      },
    })

    // Create requirements
    const createdRequirements = await Promise.all(
      requirements.map((req: any, index: number) =>
        prisma.extractedRequirement.create({
          data: {
            text: req.requirementText || req.text,
            projectId: project.id,
            documentId: document.id,
            category: req.category || 'General',
            priority: req.priority || 'medium',
            order: index,
          },
        })
      )
    )

    res.status(201).json({
      id: project.id,
      name: project.name,
      description: project.description,
      requirementCount: createdRequirements.length,
      createdAt: project.createdAt,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// UPDATE project
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { name, description, status } = req.body

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id, userId: req.userId },
    })

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        name: name || project.name,
        description: description ?? project.description,
        status: status || project.status,
      },
    })

    res.json(updated)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE project
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id, userId: req.userId },
    })

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    await prisma.project.delete({ where: { id } })

    res.json({ message: 'Project deleted' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
