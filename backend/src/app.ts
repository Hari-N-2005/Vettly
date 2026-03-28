import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import multer from 'multer'
import pdfParse from 'pdf-parse'

dotenv.config()

const app: Express = express()

type RequirementCategory = 'Technical' | 'Legal' | 'Financial' | 'Operational' | 'Environmental'
type RequirementPriority = 'Critical' | 'Standard'

interface Requirement {
  id: string
  requirementText: string
  category: RequirementCategory
  keywords_detected: string[]
  sourceExcerpt: string
  priority: RequirementPriority
}

const REQUIREMENT_CATEGORIES: RequirementCategory[] = [
  'Technical',
  'Legal',
  'Financial',
  'Operational',
  'Environmental',
]

const REQUIREMENT_PRIORITIES: RequirementPriority[] = ['Critical', 'Standard']

const REQUIREMENT_EXTRACTION_SYSTEM_PROMPT = `You are an expert procurement compliance extraction engine.
Your task is to read raw RFP text and extract every mandatory requirement.

Goal:
Return only a strict JSON array. No markdown, no commentary, no surrounding object, no trailing text.

Mandatory requirement detection:
A statement is mandatory if it includes obligation language, including but not limited to:
- shall
- must
- required
- mandatory
- will be
- is required to

Detection rules:
1. Match keywords case-insensitively and with punctuation variants.
2. Extract all mandatory requirements, not just the first one.
3. If one sentence contains multiple mandatory obligations joined by and or commas, split into separate requirement items when they are independently actionable.
4. Preserve intent exactly; do not weaken or paraphrase obligation meaning.
5. Keep requirementText concise but faithful to source.
6. sourceExcerpt must be a direct excerpt from the input text supporting that exact requirement.
7. Do not extract optional language such as may, can, should, preferred, desirable unless the same clause also contains mandatory language for the extracted obligation.

Output format:
Return a JSON array where each element is exactly:
{
  "id": "REQ-001",
  "requirementText": "string",
  "category": "Technical | Legal | Financial | Operational | Environmental",
  "keywords_detected": ["must", "shall"],
  "sourceExcerpt": "string",
  "priority": "Critical | Standard"
}

Field rules:
- id: sequential, zero-padded, REQ-001, REQ-002, ...
- requirementText: one mandatory requirement per item.
- category:
  - Technical: systems, security, performance, certifications, integrations, tooling
  - Legal: regulatory, contractual, statutory, policy/legal compliance
  - Financial: pricing, payment terms, guarantees, penalties, financial capacity
  - Operational: service delivery, staffing, support, SLAs, processes, reporting
  - Environmental: sustainability, emissions, waste, environmental compliance
- keywords_detected: include only matched mandatory trigger words/phrases present in that requirement.
- sourceExcerpt: exact snippet from source text.
- priority:
  - Critical if requirement is explicitly mandatory via shall, must, mandatory, required, is required to
  - Standard if mandatory phrasing is weaker/indirect, including will be, but still obligatory by context

Quality checks before output:
- Ensure valid JSON syntax.
- Ensure array only.
- Ensure each mandatory obligation is captured once.
- Ensure no empty fields.
- Ensure category and priority are from allowed enums only.`

const sleep = async (ms: number): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, ms))
}

const parseRetryAfterSeconds = (retryAfterHeader: string | null): number | null => {
  if (!retryAfterHeader) {
    return null
  }

  const numericValue = Number(retryAfterHeader)
  if (!Number.isNaN(numericValue) && numericValue >= 0) {
    return numericValue
  }

  const retryDate = Date.parse(retryAfterHeader)
  if (Number.isNaN(retryDate)) {
    return null
  }

  const deltaMs = retryDate - Date.now()
  return deltaMs > 0 ? Math.ceil(deltaMs / 1000) : 0
}

const tryExtractJSONArrayText = (rawText: string): string => {
  const trimmed = rawText.trim()

  if (trimmed.startsWith('```')) {
    const withoutFenceStart = trimmed.replace(/^```(?:json)?\s*/i, '')
    const withoutFence = withoutFenceStart.replace(/\s*```$/, '')
    return withoutFence.trim()
  }

  const firstArrayBracket = trimmed.indexOf('[')
  const lastArrayBracket = trimmed.lastIndexOf(']')

  if (firstArrayBracket !== -1 && lastArrayBracket !== -1 && lastArrayBracket > firstArrayBracket) {
    return trimmed.slice(firstArrayBracket, lastArrayBracket + 1)
  }

  return trimmed
}

const isRequirementCategory = (value: unknown): value is RequirementCategory => {
  return typeof value === 'string' && REQUIREMENT_CATEGORIES.includes(value as RequirementCategory)
}

const isRequirementPriority = (value: unknown): value is RequirementPriority => {
  return typeof value === 'string' && REQUIREMENT_PRIORITIES.includes(value as RequirementPriority)
}

const isRequirement = (value: unknown): value is Requirement => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Requirement
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.requirementText === 'string' &&
    isRequirementCategory(candidate.category) &&
    Array.isArray(candidate.keywords_detected) &&
    candidate.keywords_detected.every(keyword => typeof keyword === 'string') &&
    typeof candidate.sourceExcerpt === 'string' &&
    isRequirementPriority(candidate.priority)
  )
}

const parseAndValidateRequirements = (rawModelText: string): Requirement[] => {
  const jsonArrayText = tryExtractJSONArrayText(rawModelText)

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonArrayText)
  } catch {
    throw new Error('Model response is not valid JSON array.')
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Model response must be a JSON array.')
  }

  const requirements: Requirement[] = []

  for (const item of parsed) {
    if (!isRequirement(item)) {
      throw new Error('Model returned malformed requirement objects.')
    }

    if (!item.requirementText.trim() || !item.sourceExcerpt.trim()) {
      throw new Error('Model returned empty requirement text or source excerpt.')
    }

    requirements.push({
      ...item,
      requirementText: item.requirementText.trim(),
      sourceExcerpt: item.sourceExcerpt.trim(),
      keywords_detected: item.keywords_detected
        .map(keyword => keyword.trim())
        .filter(Boolean),
    })
  }

  return requirements
}

const MANDATORY_PHRASES = [
  'shall',
  'must',
  'required',
  'mandatory',
  'will be',
  'is required to',
]

const inferCategoryFromText = (text: string): RequirementCategory => {
  const lower = text.toLowerCase()

  if (/(iso|security|technical|system|platform|authentication|vulnerability|api|integration)/.test(lower)) {
    return 'Technical'
  }
  if (/(law|legal|contract|compliance|regulatory|statutory|agreement|privacy|breach)/.test(lower)) {
    return 'Legal'
  }
  if (/(price|pricing|payment|invoice|cost|financial|credit|penalt)/.test(lower)) {
    return 'Financial'
  }
  if (/(support|service|operational|staff|sla|incident|delivery|reporting|manager)/.test(lower)) {
    return 'Operational'
  }
  if (/(environment|sustainab|recycl|waste|emission|energy|e-waste)/.test(lower)) {
    return 'Environmental'
  }

  return 'Operational'
}

const extractRequirementsLocally = (rfpText: string): Requirement[] => {
  const segments = rfpText
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)

  const results: Requirement[] = []

  for (const segment of segments) {
    const lower = segment.toLowerCase()
    const detectedKeywords = MANDATORY_PHRASES.filter(phrase => lower.includes(phrase))

    if (detectedKeywords.length === 0) {
      continue
    }

    const id = `REQ-${String(results.length + 1).padStart(3, '0')}`
    const category = inferCategoryFromText(segment)
    const hasStrongKeyword = detectedKeywords.some(keyword =>
      ['shall', 'must', 'required', 'mandatory', 'is required to'].includes(keyword)
    )

    results.push({
      id,
      requirementText: segment,
      category,
      keywords_detected: detectedKeywords,
      sourceExcerpt: segment,
      priority: hasStrongKeyword ? 'Critical' : 'Standard',
    })
  }

  return results
}

interface GeminiHttpError extends Error {
  status: number
  responseBody: string
}

const createGeminiHttpError = (status: number, responseBody: string): GeminiHttpError => {
  const error = new Error(
    `Gemini API request failed with status ${status}: ${responseBody}`
  ) as GeminiHttpError
  error.status = status
  error.responseBody = responseBody
  return error
}

const isGeminiHttpError = (error: unknown): error is GeminiHttpError => {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'status' in error &&
      'responseBody' in error
  )
}

const listGeminiGenerateContentModels = async (apiKey: string): Promise<string[]> => {
  const listEndpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
  const response = await fetch(listEndpoint)

  if (!response.ok) {
    return []
  }

  const body = (await response.json()) as {
    models?: Array<{
      name?: string
      supportedGenerationMethods?: string[]
    }>
  }

  const available = (body.models || [])
    .filter(model => model.name?.startsWith('models/'))
    .filter(model => model.supportedGenerationMethods?.includes('generateContent'))
    .map(model => (model.name || '').replace(/^models\//, ''))
    .filter(Boolean)

  return Array.from(new Set(available))
}

const getGeminiModelCandidates = async (
  configuredModel: string,
  apiKey: string
): Promise<string[]> => {
  const preferredOrder = [
    configuredModel,
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
  ]

  const discoveredModels = await listGeminiGenerateContentModels(apiKey)
  const discoveredSet = new Set(discoveredModels)

  const prioritizedDiscovered = preferredOrder.filter(model => discoveredSet.has(model))
  const remainingDiscovered = discoveredModels.filter(model => !prioritizedDiscovered.includes(model))

  const candidates = [
    ...prioritizedDiscovered,
    ...remainingDiscovered,
    ...preferredOrder,
  ]

  return Array.from(new Set(candidates))
}

const callGeminiWithModel = async (
  model: string,
  apiKey: string,
  rfpText: string
): Promise<Requirement[]> => {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`

  const payload = {
    system_instruction: {
      role: 'system',
      parts: [{ text: REQUIREMENT_EXTRACTION_SYSTEM_PROMPT }],
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Extract mandatory requirements from the following RFP text. Return only JSON array.\n\n${rfpText}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
    },
  }

  const maxAttempts = 4
  const baseDelayMs = 1000

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (response.status === 429) {
      if (attempt === maxAttempts) {
        throw new Error('Rate limited by Gemini API after multiple retries.')
      }

      const retryAfterSeconds = parseRetryAfterSeconds(response.headers.get('retry-after'))
      const exponentialBackoffMs = baseDelayMs * 2 ** (attempt - 1)
      const delayMs = retryAfterSeconds ? retryAfterSeconds * 1000 : exponentialBackoffMs

      await sleep(delayMs)
      continue
    }

    if (!response.ok) {
      const errorText = await response.text()
      throw createGeminiHttpError(response.status, errorText)
    }

    const body = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>
        }
      }>
    }

    const textPart = body.candidates?.[0]?.content?.parts?.find(part => typeof part.text === 'string')

    if (!textPart?.text) {
      throw new Error('Gemini API response does not contain text output.')
    }

    return parseAndValidateRequirements(textPart.text)
  }

  throw new Error('Gemini API request failed unexpectedly.')
}

const callGeminiForRequirements = async (rfpText: string): Promise<Requirement[]> => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.')
  }

  const configuredModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
  const modelCandidates = await getGeminiModelCandidates(configuredModel, apiKey)

  let lastError: unknown = null

  for (const model of modelCandidates) {
    try {
      return await callGeminiWithModel(model, apiKey, rfpText)
    } catch (error) {
      lastError = error

      // Fall back to another model only when model is unavailable.
      if (isGeminiHttpError(error) && error.status === 404) {
        continue
      }

      throw error
    }
  }

  if (isGeminiHttpError(lastError) && lastError.status === 404) {
    throw new Error(
      `No compatible Gemini model found for generateContent. Checked models: ${modelCandidates.join(', ')}`
    )
  }

  if (lastError instanceof Error) {
    throw lastError
  }

  throw new Error('Gemini API request failed unexpectedly.')
}

// Store uploaded files in memory so we can parse the PDF buffer directly.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max upload size
  },
  fileFilter: (_req, file, cb) => {
    const isPdfMimeType = file.mimetype === 'application/pdf'
    const isPdfExtension = file.originalname.toLowerCase().endsWith('.pdf')

    if (!isPdfMimeType || !isPdfExtension) {
      cb(new Error('Only PDF files are allowed'))
      return
    }

    cb(null, true)
  },
})

// Middleware
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`)
  })
  next()
})

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Upload and parse an RFP PDF file.
app.post('/api/upload-rfp', (req: Request, res: Response) => {
  upload.single('file')(req, res, async err => {
    if (err) {
      // Handle multer-specific upload errors (size limits, etc.).
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'File too large. Maximum allowed size is 10MB.' })
          return
        }
        res.status(400).json({ error: `Upload error: ${err.message}` })
        return
      }

      // Handle custom file filter errors (non-PDF).
      res.status(400).json({ error: err.message || 'Invalid upload request' })
      return
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded. Provide a PDF file in form field "file".' })
      return
    }

    try {
      // Parse PDF text and metadata from uploaded file buffer.
      const parsedPdf = await pdfParse(req.file.buffer)
      const rawText = (parsedPdf.text || '').trim()

      if (!rawText) {
        res.status(400).json({ error: 'Uploaded PDF contains no extractable text.' })
        return
      }

      res.status(200).json({
        fileName: req.file.originalname,
        pageCount: parsedPdf.numpages,
        rawText,
        uploadedAt: new Date().toISOString(),
      })
    } catch (parseError) {
      console.error('Failed to parse uploaded PDF:', parseError)
      res.status(500).json({ error: 'Failed to parse PDF file.' })
    }
  })
})

// Extract structured mandatory requirements from raw RFP text with Gemini.
app.post('/api/extract-requirements', async (req: Request, res: Response) => {
  const rfpText = req.body?.rfpText

  if (typeof rfpText !== 'string' || !rfpText.trim()) {
    res.status(400).json({
      error: 'Invalid request body. Expected { rfpText: string } with non-empty text.',
    })
    return
  }

  try {
    const requirements = await callGeminiForRequirements(rfpText.trim())

    const categoryBreakdown = REQUIREMENT_CATEGORIES.reduce<Record<RequirementCategory, number>>(
      (acc, category) => {
        acc[category] = requirements.filter(reqItem => reqItem.category === category).length
        return acc
      },
      {
        Technical: 0,
        Legal: 0,
        Financial: 0,
        Operational: 0,
        Environmental: 0,
      }
    )

    res.status(200).json({
      requirements,
      extractedAt: new Date().toISOString(),
      totalCount: requirements.length,
      categoryBreakdown,
    })
  } catch (error) {
    console.error('Requirement extraction failed:', error)

    const message = error instanceof Error ? error.message : 'Unknown extraction error'
    const malformedResponseError =
      message.includes('not valid JSON array') ||
      message.includes('must be a JSON array') ||
      message.includes('malformed requirement objects') ||
      message.includes('empty requirement text or source excerpt')

    if (malformedResponseError) {
      res.status(502).json({
        error: 'AI returned malformed requirement data.',
        details: message,
      })
      return
    }

    if (message.includes('Rate limited')) {
      // Free-tier Gemini can throttle heavily; provide a deterministic fallback.
      const requirements = extractRequirementsLocally(rfpText.trim())
      const categoryBreakdown = REQUIREMENT_CATEGORIES.reduce<Record<RequirementCategory, number>>(
        (acc, category) => {
          acc[category] = requirements.filter(reqItem => reqItem.category === category).length
          return acc
        },
        {
          Technical: 0,
          Legal: 0,
          Financial: 0,
          Operational: 0,
          Environmental: 0,
        }
      )

      res.status(200).json({
        requirements,
        extractedAt: new Date().toISOString(),
        totalCount: requirements.length,
        categoryBreakdown,
        warning: 'Gemini rate-limited. Returned local fallback extraction.',
      })
      return
    }

    if (message.includes('GEMINI_API_KEY is not configured')) {
      res.status(500).json({
        error: 'Server is missing Gemini API configuration.',
        details: message,
      })
      return
    }

    res.status(500).json({
      error: 'Failed to extract requirements from RFP text.',
      details: message,
    })
  }
})

// API Routes (to be implemented)
// Import routes here as they're created:
// app.use('/api/rfp', rfpRoutes)
// app.use('/api/compliance', complianceRoutes)
// app.use('/api/risks', riskRoutes)
// app.use('/api/proposals', proposalRoutes)

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found', path: req.path })
})

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal Server Error' })
})

export default app

// Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
  console.log(`📄 API documentation: http://localhost:${PORT}/api/docs`)
})
