import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import multer from 'multer'
import pdfParse from 'pdf-parse'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import PDFDocument from 'pdfkit'
import { PrismaClient } from '@prisma/client'
import authRouter from './routes/auth'
import projectsRouter from './routes/projects'
import proposalsRouter from './routes/proposals'
import { authMiddleware, AuthRequest } from './middleware/authMiddleware'

dotenv.config()

const prisma = new PrismaClient()

const app: Express = express()

// Cache for vendor validation results keyed by proposal hash + requirement IDs.
// Avoids re-validating the same vendor proposal multiple times.
const validationCache = new Map<
  string,
  {
    results: ComplianceResult[]
    overallScore: number
    timestamp: number
  }
>()

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

interface ValidationRequirement {
  id: string
  requirementText: string
}

type ComplianceStatus = 'Met' | 'Partially Met' | 'Missing'

interface ComplianceResult {
  requirementId: string
  status: ComplianceStatus
  confidenceScore: number
  matchedExcerpt: string | null
  explanation: string
  suggestedFollowUp?: string
}

interface VendorValidationResponse {
  vendorName: string
  complianceResults: ComplianceResult[]
  overallScore: number
  metCount: number
  partialCount: number
  missingCount: number
  processedAt: string
}

type RiskType =
  | 'Liability'
  | 'Cost Escalation'
  | 'Vague Commitment'
  | 'Approval Dependency'
  | 'Scope Creep'

type RiskSeverity = 'High' | 'Medium' | 'Low'
type ToneAssessment = 'Evasive' | 'Ambiguous' | 'Acceptable'

interface RiskFlag {
  riskId: string
  flaggedText: string
  riskType: RiskType
  severity: RiskSeverity
  impactSummary: string
  toneAssessment: ToneAssessment
}

interface RiskScanResponse {
  vendorName: string
  riskFlags: RiskFlag[]
  riskSummary: {
    high: number
    medium: number
    low: number
  }
  overallToneScore: number
  scannedAt: string
  note?: string
}

interface GenerateReportRequirement {
  id: string
  requirementText: string
  category?: string
}

interface GenerateReportVendorResult {
  vendorName: string
  overallScore?: number
  metCount?: number
  partialCount?: number
  missingCount?: number
  complianceResults: ComplianceResult[]
}

interface GenerateReportInput {
  projectName: string
  user: string
  generatedAt: Date
  requirements: GenerateReportRequirement[]
  vendorResults: GenerateReportVendorResult[]
  riskFlagsPerVendor: Record<string, RiskFlag[]>
}

type FinalRecommendation = 'Recommend' | 'Review' | 'Reject'

const reportsDirectoryPath = path.resolve(process.cwd(), 'reports')
fs.mkdirSync(reportsDirectoryPath, { recursive: true })

const csvEscape = (value: unknown): string => {
  const normalized = String(value ?? '')
  return `"${normalized.replace(/"/g, '""')}"`
}

const getRiskFlagsForVendor = (
  riskFlagsPerVendor: Record<string, RiskFlag[]>,
  vendorName: string
): RiskFlag[] => {
  if (Array.isArray(riskFlagsPerVendor[vendorName])) {
    return riskFlagsPerVendor[vendorName]
  }

  const matchedKey = Object.keys(riskFlagsPerVendor).find(
    key => key.toLowerCase() === vendorName.toLowerCase()
  )

  return matchedKey ? riskFlagsPerVendor[matchedKey] : []
}

const calculateRecommendation = (
  overallScore: number,
  highRiskCount: number,
  missingCount: number
): FinalRecommendation => {
  if (overallScore >= 80 && highRiskCount === 0 && missingCount <= 2) {
    return 'Recommend'
  }

  if (overallScore >= 60 && highRiskCount <= 2) {
    return 'Review'
  }

  return 'Reject'
}

const buildCsvRows = (input: GenerateReportInput): string[] => {
  const header = [
    'projectName',
    'vendorName',
    'requirementId',
    'requirementText',
    'category',
    'status',
    'confidenceScore',
  ]

  const rows = [header.map(csvEscape).join(',')]

  input.vendorResults.forEach(vendor => {
    const resultMap = new Map(vendor.complianceResults.map(result => [result.requirementId, result]))

    input.requirements.forEach(requirement => {
      const result = resultMap.get(requirement.id)

      rows.push(
        [
          input.projectName,
          vendor.vendorName,
          requirement.id,
          requirement.requirementText,
          requirement.category ?? '',
          result?.status ?? 'Missing',
          result?.confidenceScore ?? 0,
        ]
          .map(csvEscape)
          .join(',')
      )
    })
  })

  return rows
}

const writeCsvReport = async (input: GenerateReportInput, outputPath: string): Promise<void> => {
  const rows = buildCsvRows(input)
  await fs.promises.writeFile(outputPath, rows.join('\n'), 'utf8')
}

const addSummaryTableHeader = (doc: InstanceType<typeof PDFDocument>): number => {
  const startY = doc.y
  doc.fontSize(10).fillColor('#1f2937').text('Rank', 50, startY)
  doc.text('Vendor', 95, startY)
  doc.text('Score', 280, startY)
  doc.text('Met/Part/Miss', 350, startY)
  doc.text('Recommendation', 470, startY)
  doc.moveDown(0.5)
  doc.strokeColor('#cbd5e1').moveTo(50, doc.y).lineTo(560, doc.y).stroke()
  return doc.y + 6
}

const addFinalRecommendationSection = (
  doc: InstanceType<typeof PDFDocument>,
  rankedVendors: Array<{
    vendorName: string
    overallScore: number
    metCount: number
    partialCount: number
    missingCount: number
    highRiskCount: number
    recommendation: FinalRecommendation
  }>
): void => {
  const topVendor = rankedVendors[0]
  doc.addPage()
  doc.fontSize(20).fillColor('#111827').text('Final Recommendation', { underline: true })
  doc.moveDown(1)

  if (!topVendor) {
    doc.fontSize(12).fillColor('#374151').text('No vendor results were supplied.')
    return
  }

  doc.fontSize(13).fillColor('#1f2937').text(`Top Ranked Vendor: ${topVendor.vendorName}`)
  doc.moveDown(0.35)
  doc.text(`Overall Score: ${topVendor.overallScore}%`)
  doc.text(
    `Compliance Breakdown: Met ${topVendor.metCount}, Partial ${topVendor.partialCount}, Missing ${topVendor.missingCount}`
  )
  doc.text(`High Severity Risks: ${topVendor.highRiskCount}`)
  doc.moveDown(0.5)
  doc.fontSize(15).fillColor('#111827').text(`Recommendation: ${topVendor.recommendation}`)
}

const writePdfReport = async (input: GenerateReportInput, outputPath: string): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' })
    const stream = fs.createWriteStream(outputPath)

    stream.on('finish', resolve)
    stream.on('error', reject)
    doc.on('error', reject)

    doc.pipe(stream)

    // Cover page
    doc.fontSize(26).fillColor('#111827').text('Tender Review Report', { align: 'center' })
    doc.moveDown(1.25)
    doc.fontSize(15).fillColor('#374151').text(`Project: ${input.projectName}`, { align: 'center' })
    doc.moveDown(0.5)
    doc.text(`Generated By: ${input.user}`, { align: 'center' })
    doc.moveDown(0.5)
    doc.text(`Date: ${input.generatedAt.toISOString()}`, { align: 'center' })

    const rankedVendors = input.vendorResults
      .map(vendor => {
        const metCount =
          typeof vendor.metCount === 'number'
            ? vendor.metCount
            : vendor.complianceResults.filter(result => result.status === 'Met').length
        const partialCount =
          typeof vendor.partialCount === 'number'
            ? vendor.partialCount
            : vendor.complianceResults.filter(result => result.status === 'Partially Met').length
        const missingCount =
          typeof vendor.missingCount === 'number'
            ? vendor.missingCount
            : vendor.complianceResults.filter(result => result.status === 'Missing').length

        const total = metCount + partialCount + missingCount
        const overallScore =
          typeof vendor.overallScore === 'number'
            ? vendor.overallScore
            : total > 0
              ? Math.round((metCount * 100 + partialCount * 50) / total)
              : 0

        const riskFlags = getRiskFlagsForVendor(input.riskFlagsPerVendor, vendor.vendorName)
        const highRiskCount = riskFlags.filter(flag => flag.severity === 'High').length

        return {
          vendorName: vendor.vendorName,
          overallScore,
          metCount,
          partialCount,
          missingCount,
          highRiskCount,
          recommendation: calculateRecommendation(overallScore, highRiskCount, missingCount),
          topRisks: riskFlags.slice(0, 3),
        }
      })
      .sort((a, b) => b.overallScore - a.overallScore)

    // Executive summary page
    doc.addPage()
    doc.fontSize(20).fillColor('#111827').text('Executive Summary', { underline: true })
    doc.moveDown(0.75)

    let rowY = addSummaryTableHeader(doc)
    rankedVendors.forEach((vendor, index) => {
      doc.fontSize(10).fillColor('#111827').text(String(index + 1), 50, rowY)
      doc.text(vendor.vendorName, 95, rowY)
      doc.text(`${vendor.overallScore}%`, 280, rowY)
      doc.text(`${vendor.metCount}/${vendor.partialCount}/${vendor.missingCount}`, 350, rowY)
      doc.text(vendor.recommendation, 470, rowY)
      rowY += 18
    })

    // Per-vendor sections
    rankedVendors.forEach(vendor => {
      doc.addPage()
      doc.fontSize(18).fillColor('#111827').text(`Vendor: ${vendor.vendorName}`)
      doc.moveDown(0.65)
      doc.fontSize(12).fillColor('#374151').text(`Overall Score: ${vendor.overallScore}%`)
      doc.text(
        `Compliance Breakdown: Met ${vendor.metCount}, Partially Met ${vendor.partialCount}, Missing ${vendor.missingCount}`
      )
      doc.text(`Recommendation: ${vendor.recommendation}`)
      doc.moveDown(0.65)
      doc.fontSize(13).fillColor('#111827').text('Top 3 Risks')
      doc.moveDown(0.35)

      if (vendor.topRisks.length === 0) {
        doc.fontSize(11).fillColor('#374151').text('No risk flags available for this vendor.')
      } else {
        vendor.topRisks.forEach((risk, idx) => {
          doc
            .fontSize(11)
            .fillColor('#1f2937')
            .text(`${idx + 1}. [${risk.severity}] ${risk.riskType}: ${risk.flaggedText}`)
          doc.fontSize(10).fillColor('#4b5563').text(`Impact: ${risk.impactSummary}`)
          doc.moveDown(0.3)
        })
      }
    })

    addFinalRecommendationSection(doc, rankedVendors)
    doc.end()
  })
}

const REQUIREMENT_PRIORITIES: RequirementPriority[] = ['Critical', 'Standard']

/**
 * Generate a cache key for vendor validation based on proposal text + requirement IDs.
 * This allows caching of validation results to avoid redundant API calls.
 */
const generateValidationCacheKey = (proposalText: string, requirements: ValidationRequirement[]): string => {
  const proposalHash = crypto.createHash('sha256').update(proposalText).digest('hex')
  const requirementIds = requirements.map(r => r.id).sort().join('|')
  const requirementHash = crypto.createHash('sha256').update(requirementIds).digest('hex')
  return `${proposalHash}:${requirementHash}`
}

const REQUIREMENT_CATEGORIES: RequirementCategory[] = [
  'Technical',
  'Legal',
  'Financial',
  'Operational',
  'Environmental',
]

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

const SEMANTIC_MATCHING_SYSTEM_PROMPT = `You are an expert bid-compliance semantic matching engine.
Your task is to evaluate one requirement against full vendor proposal text and return a strict JSON object.

Goal:
Return only one valid JSON object. No markdown, no code fences, no commentary, no trailing text.

Input:
- requirement: a single object that includes at least { id, requirementText }
- proposalText: full vendor proposal text (may be long)

Matching rules:
- Perform semantic matching, not only exact keyword matching.
- Treat equivalent wording as a match when meaning is the same (for example, "round-the-clock" == "24/7 support", "continuous support", "all-day coverage").
- Prefer direct evidence from proposalText. If multiple candidate matches exist, use the strongest and most specific one.
- If evidence is incomplete, classify as Partially Met.
- If no credible evidence is found, classify as Missing.
- Do not invent evidence.

Status definitions:
- Met: Proposal clearly satisfies the full requirement.
- Partially Met: Proposal addresses part of the requirement or is ambiguous/incomplete.
- Missing: Proposal does not address the requirement at all.

Confidence scoring:
- Return an integer from 0 to 100.
- 85-100: strong explicit semantic or direct match.
- 60-84: partial/indirect match with reasonable evidence.
- 0-59: weak or no evidence.

Output schema (strict):
{
  "requirementId": "string",
  "status": "Met | Partially Met | Missing",
  "confidenceScore": 0,
  "matchedExcerpt": "string or null",
  "explanation": "1-2 sentences",
  "suggestedFollowUp": "string (optional clarification question)"
}

Field rules:
- requirementId: copy exactly from requirement.id.
- status: must be exactly one of "Met", "Partially Met", "Missing".
- confidenceScore: integer only.
- matchedExcerpt: the most relevant sentence from proposalText; null only if status is Missing.
- explanation: 1-2 concise sentences explaining why status was chosen.
- suggestedFollowUp:
  - Include only if status is Partially Met or Missing.
  - Omit this field when status is Met.
- Return valid JSON only.`

const BATCH_SEMANTIC_MATCHING_SYSTEM_PROMPT = `You are an expert bid-compliance semantic matching engine.
Your task is to evaluate ALL requirements against the full vendor proposal text in a single pass and return strict JSON.

Goal:
Return only one valid JSON array. No markdown, no code fences, no commentary, no trailing text.

Input:
- requirements: array of objects with requirementIndex, requirementId, requirementText
- proposalText: full vendor proposal text

Rules:
- Perform semantic matching, not only exact keyword matching.
- Treat synonyms and equivalent phrasing as matches when intent is equivalent.
- For each requirement, return exactly one result item.
- Never omit any requirement from output.
- Do not invent evidence.

Status definitions:
- Met: proposal clearly satisfies the full requirement.
- Partially Met: proposal addresses only part of requirement or is ambiguous/incomplete.
- Missing: no credible evidence found.

Output schema (strict):
[
  {
    "requirementIndex": 0,
    "requirementId": "REQ-001",
    "status": "Met | Partially Met | Missing",
    "confidenceScore": 0,
    "matchedExcerpt": "string or null",
    "explanation": "1-2 sentences",
    "suggestedFollowUp": "string (optional, only for Partially Met or Missing)"
  }
]

Field rules:
- confidenceScore must be integer 0-100.
- matchedExcerpt must be null when status is Missing.
- Omit suggestedFollowUp when status is Met.
- Return valid JSON only.`

const RISK_SCAN_SYSTEM_PROMPT = `You are an expert procurement risk analyst focused on hidden legal and commercial risk language in vendor proposals.

Task:
Analyze the provided vendor proposal text and identify risky, non-committal, or commercially unfavorable clauses.

Primary detection targets:
- "subject to change"
- "at our discretion"
- "additional fees may apply"
- "limited liability"
- "best efforts"
- "pending approval"
- "may vary"
- and semantically similar language (e.g., "as determined by us", "not guaranteed", "where applicable", "from time to time", "indicative only", "subject to availability", "reserves the right", "to be mutually agreed", "commercially reasonable efforts", "estimate only").

What to flag:
1. Liability limitations, disclaimers, indemnity imbalance.
2. Cost uncertainty, variable pricing, pass-through charges, optional surcharges.
3. Vague commitment language lacking firm obligations, dates, or measurable outcomes.
4. Dependencies on external/internal approvals that could delay delivery.
5. Scope ambiguity that can lead to change orders, exclusions, or interpretation drift.

Output requirements:
- Return strict JSON only. No markdown, no commentary, no code fences.
- Return a single JSON object with:
  - "risks": an array of risk objects
  - "toneScore": integer 0-10 (10 = fully committed language, 0 = highly evasive/non-committal)
- Each risk object must be:
  {
    "riskId": "RISK-001",
    "flaggedText": "exact quote from proposal",
    "riskType": "Liability" | "Cost Escalation" | "Vague Commitment" | "Approval Dependency" | "Scope Creep",
    "severity": "High" | "Medium" | "Low",
    "impactSummary": "Exactly 2 sentences describing likely contractual/commercial impact.",
    "toneAssessment": "Evasive" | "Ambiguous" | "Acceptable"
  }

Strict rules:
- flaggedText must be an exact quote copied from the proposal.
- Do not invent text not present in the proposal.
- Use one risk per distinct problematic quote; avoid duplicates.
- If no material risks are found, return:
  { "risks": [], "toneScore": <calculated_score> }
- riskId must be sequential: RISK-001, RISK-002, ...
- severity guidance:
  - High: likely to materially affect liability, pricing certainty, or enforceability.
  - Medium: moderate ambiguity or negotiable risk.
  - Low: minor caveat with limited commercial impact.
- toneAssessment guidance:
  - Evasive: clear avoidance of firm obligation.
  - Ambiguous: unclear commitment but not overtly evasive.
  - Acceptable: wording mostly committal with manageable caveat.
- toneScore guidance:
  - Start from 10 and reduce for each risky pattern.
  - Heavier deductions for High severity and repeated evasive language.
  - Keep as integer between 0 and 10.
- Return valid JSON only.`

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

const tryExtractJSONObjectText = (rawText: string): string => {
  const trimmed = rawText.trim()

  if (trimmed.startsWith('```')) {
    const withoutFenceStart = trimmed.replace(/^```(?:json)?\s*/i, '')
    const withoutFence = withoutFenceStart.replace(/\s*```$/, '')
    return withoutFence.trim()
  }

  const firstObjectBrace = trimmed.indexOf('{')
  const lastObjectBrace = trimmed.lastIndexOf('}')

  if (firstObjectBrace !== -1 && lastObjectBrace !== -1 && lastObjectBrace > firstObjectBrace) {
    return trimmed.slice(firstObjectBrace, lastObjectBrace + 1)
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

const isComplianceStatus = (value: unknown): value is ComplianceStatus => {
  return value === 'Met' || value === 'Partially Met' || value === 'Missing'
}

const RISK_TYPES: RiskType[] = [
  'Liability',
  'Cost Escalation',
  'Vague Commitment',
  'Approval Dependency',
  'Scope Creep',
]

const RISK_SEVERITIES: RiskSeverity[] = ['High', 'Medium', 'Low']
const TONE_ASSESSMENTS: ToneAssessment[] = ['Evasive', 'Ambiguous', 'Acceptable']

const isRiskType = (value: unknown): value is RiskType => {
  return typeof value === 'string' && RISK_TYPES.includes(value as RiskType)
}

const isRiskSeverity = (value: unknown): value is RiskSeverity => {
  return typeof value === 'string' && RISK_SEVERITIES.includes(value as RiskSeverity)
}

const isToneAssessment = (value: unknown): value is ToneAssessment => {
  return typeof value === 'string' && TONE_ASSESSMENTS.includes(value as ToneAssessment)
}

const parseAndValidateRiskScanResult = (
  rawModelText: string
): { riskFlags: RiskFlag[]; overallToneScore: number } => {
  const jsonObjectText = tryExtractJSONObjectText(rawModelText)

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonObjectText)
  } catch {
    throw new Error('Model response is not valid JSON object for risk scan.')
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Risk scan model response must be a JSON object.')
  }

  const candidate = parsed as {
    risks?: unknown
    toneScore?: unknown
  }

  if (!Array.isArray(candidate.risks)) {
    throw new Error('Risk scan response must include risks array.')
  }

  const toneScoreRaw = candidate.toneScore
  if (typeof toneScoreRaw !== 'number' || !Number.isInteger(toneScoreRaw)) {
    throw new Error('Risk scan response must include integer toneScore.')
  }

  const overallToneScore = Math.max(0, Math.min(10, toneScoreRaw))

  const riskFlags: RiskFlag[] = candidate.risks.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`Risk at index ${index} is not a valid object.`)
    }

    const risk = item as Partial<RiskFlag>

    if (
      typeof risk.flaggedText !== 'string' ||
      !risk.flaggedText.trim() ||
      !isRiskType(risk.riskType) ||
      !isRiskSeverity(risk.severity) ||
      typeof risk.impactSummary !== 'string' ||
      !risk.impactSummary.trim() ||
      !isToneAssessment(risk.toneAssessment)
    ) {
      throw new Error(`Risk at index ${index} contains malformed fields.`)
    }

    return {
      riskId: `RISK-${String(index + 1).padStart(3, '0')}`,
      flaggedText: risk.flaggedText.trim(),
      riskType: risk.riskType,
      severity: risk.severity,
      impactSummary: risk.impactSummary.trim(),
      toneAssessment: risk.toneAssessment,
    }
  })

  return { riskFlags, overallToneScore }
}

const parseValidationRequirements = (rawRequirements: unknown): ValidationRequirement[] => {
  const parsedInput = typeof rawRequirements === 'string' ? JSON.parse(rawRequirements) : rawRequirements

  if (!Array.isArray(parsedInput)) {
    throw new Error('Invalid requirements input. Expected an array.')
  }

  const requirements = parsedInput.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Requirement at index ${index} is not a valid object.`)
    }

    const candidate = item as Partial<ValidationRequirement>
    const id = typeof candidate.id === 'string' ? candidate.id.trim() : ''
    const requirementText =
      typeof candidate.requirementText === 'string' ? candidate.requirementText.trim() : ''

    if (!id || !requirementText) {
      throw new Error(
        `Requirement at index ${index} must include non-empty id and requirementText fields.`
      )
    }

    return { id, requirementText }
  })

  return requirements
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

const parseAndValidateComplianceResult = (
  rawModelText: string,
  requirementId: string
): ComplianceResult => {
  const jsonObjectText = tryExtractJSONObjectText(rawModelText)

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonObjectText)
  } catch {
    throw new Error('Model response is not valid JSON object.')
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Model response must be a JSON object.')
  }

  const candidate = parsed as Partial<ComplianceResult>

  if (!isComplianceStatus(candidate.status)) {
    throw new Error('Model response contains invalid compliance status.')
  }

  const rawConfidence = candidate.confidenceScore
  if (typeof rawConfidence !== 'number' || !Number.isInteger(rawConfidence)) {
    throw new Error('Model response must contain integer confidenceScore.')
  }

  const boundedConfidence = Math.max(0, Math.min(100, rawConfidence))
  const explanation = typeof candidate.explanation === 'string' ? candidate.explanation.trim() : ''

  if (!explanation) {
    throw new Error('Model response must contain non-empty explanation.')
  }

  let matchedExcerpt: string | null = null
  if (typeof candidate.matchedExcerpt === 'string' && candidate.matchedExcerpt.trim()) {
    matchedExcerpt = candidate.matchedExcerpt.trim()
  }

  if (candidate.status !== 'Missing' && matchedExcerpt === null) {
    throw new Error('Model response must include matchedExcerpt for Met or Partially Met status.')
  }

  if (candidate.status === 'Missing') {
    matchedExcerpt = null
  }

  const suggestedFollowUp =
    typeof candidate.suggestedFollowUp === 'string' && candidate.suggestedFollowUp.trim()
      ? candidate.suggestedFollowUp.trim()
      : undefined

  const normalized: ComplianceResult = {
    requirementId,
    status: candidate.status,
    confidenceScore: boundedConfidence,
    matchedExcerpt,
    explanation,
    ...(suggestedFollowUp ? { suggestedFollowUp } : {}),
  }

  if (normalized.status === 'Met' && normalized.suggestedFollowUp) {
    delete normalized.suggestedFollowUp
  }

  return normalized
}

const parseAndValidateBatchComplianceResults = (
  rawModelText: string,
  requirements: ValidationRequirement[]
): ComplianceResult[] => {
  const jsonArrayText = tryExtractJSONArrayText(rawModelText)

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonArrayText)
  } catch {
    throw new Error('Batch semantic match response is not valid JSON array.')
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Batch semantic match response must be a JSON array.')
  }

  const requirementIdSet = new Set(requirements.map(req => req.id))
  const byRequirementId = new Map<string, ComplianceResult>()

  for (const item of parsed) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      continue
    }

    const candidate = item as {
      requirementId?: unknown
      status?: unknown
      confidenceScore?: unknown
      matchedExcerpt?: unknown
      explanation?: unknown
      suggestedFollowUp?: unknown
    }

    const requirementId =
      typeof candidate.requirementId === 'string' ? candidate.requirementId.trim() : ''

    if (!requirementId || !requirementIdSet.has(requirementId) || !isComplianceStatus(candidate.status)) {
      continue
    }

    const rawConfidence = candidate.confidenceScore
    let normalizedConfidence = 0
    if (typeof rawConfidence === 'number' && Number.isFinite(rawConfidence)) {
      // Accept either 0-100 integers or 0-1 fractions from model output.
      normalizedConfidence = rawConfidence <= 1 ? Math.round(rawConfidence * 100) : Math.round(rawConfidence)
    }
    normalizedConfidence = Math.max(0, Math.min(100, normalizedConfidence))

    let matchedExcerpt: string | null = null
    if (typeof candidate.matchedExcerpt === 'string' && candidate.matchedExcerpt.trim()) {
      matchedExcerpt = candidate.matchedExcerpt.trim()
    }
    if (candidate.status === 'Missing') {
      matchedExcerpt = null
    }

    const explanation =
      typeof candidate.explanation === 'string' && candidate.explanation.trim()
        ? candidate.explanation.trim()
        : 'No detailed explanation returned by model.'

    const suggestedFollowUp =
      typeof candidate.suggestedFollowUp === 'string' && candidate.suggestedFollowUp.trim()
        ? candidate.suggestedFollowUp.trim()
        : undefined

    byRequirementId.set(requirementId, {
      requirementId,
      status: candidate.status,
      confidenceScore: normalizedConfidence,
      matchedExcerpt,
      explanation,
      ...(candidate.status === 'Met' || !suggestedFollowUp ? {} : { suggestedFollowUp }),
    })
  }

  // Ensure one result per input requirement, in original order.
  return requirements.map(requirement => {
    const found = byRequirementId.get(requirement.id)
    if (found) {
      return found
    }

    return {
      requirementId: requirement.id,
      status: 'Missing',
      confidenceScore: 0,
      matchedExcerpt: null,
      explanation:
        'Model did not return a result for this requirement in batch response; marked as Missing.',
      suggestedFollowUp:
        'Can you provide an explicit proposal statement showing compliance for this requirement?',
    }
  })
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

const SEMANTIC_EQUIVALENCE_GROUPS: string[][] = [
  ['24/7', '24x7', 'round-the-clock', 'round the clock', 'continuous support', 'all-day coverage'],
  ['support', 'service desk', 'helpdesk', 'help desk', 'technical support'],
  ['critical incident', 'severity 1', 'sev1', 'p1 incident', 'priority 1'],
  ['iso 27001', 'information security certification', 'isms certification'],
]

const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'that',
  'this',
  'from',
  'shall',
  'must',
  'required',
  'mandatory',
  'vendor',
  'provide',
  'will',
  'be',
  'is',
  'to',
  'of',
  'in',
  'on',
])

const normalizeForSemanticMatch = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const splitIntoSentences = (text: string): string[] => {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map(sentence => sentence.trim())
    .filter(Boolean)
}

const hasAnyTerm = (normalizedText: string, terms: string[]): boolean => {
  return terms.some(term => normalizedText.includes(normalizeForSemanticMatch(term)))
}

const extractContentTokens = (text: string): string[] => {
  const tokens = normalizeForSemanticMatch(text).split(' ')
  return tokens.filter(token => token.length >= 4 && !STOPWORDS.has(token))
}

const fallbackSemanticMatch = (
  requirement: ValidationRequirement,
  proposalText: string,
  reason?: string
): ComplianceResult => {
  const sentences = splitIntoSentences(proposalText)
  const requirementNormalized = normalizeForSemanticMatch(requirement.requirementText)
  const requirementTokens = extractContentTokens(requirement.requirementText)

  let bestSentence = ''
  let bestScore = 0

  for (const sentence of sentences) {
    const sentenceNormalized = normalizeForSemanticMatch(sentence)
    const sentenceTokens = new Set(extractContentTokens(sentence))

    let score = 0

    // Semantic synonym groups contribute high confidence signal.
    for (const group of SEMANTIC_EQUIVALENCE_GROUPS) {
      if (hasAnyTerm(requirementNormalized, group) && hasAnyTerm(sentenceNormalized, group)) {
        score += 3
      }
    }

    const tokenMatches = requirementTokens.filter(token => sentenceTokens.has(token)).length
    score += tokenMatches

    if (score > bestScore) {
      bestScore = score
      bestSentence = sentence
    }
  }

  let status: ComplianceStatus = 'Missing'
  let confidenceScore = 18
  let matchedExcerpt: string | null = null
  let explanation =
    'No strong semantic evidence was found in the proposal text for this requirement.'
  let suggestedFollowUp =
    'Could you provide a direct statement in the proposal showing how this requirement is met?'

  if (bestScore >= 6) {
    status = 'Met'
    confidenceScore = Math.min(97, 85 + bestScore)
    matchedExcerpt = bestSentence
    explanation =
      'The proposal sentence semantically aligns with the requirement intent with strong keyword and synonym overlap.'
    suggestedFollowUp = undefined as unknown as string
  } else if (bestScore >= 3) {
    status = 'Partially Met'
    confidenceScore = Math.min(84, 60 + bestScore * 3)
    matchedExcerpt = bestSentence
    explanation =
      'The proposal provides partial semantic evidence, but does not fully satisfy all requirement details.'
    suggestedFollowUp =
      'Can you clarify how the proposal fully satisfies every part of this requirement?'
  }

  if (reason) {
    explanation = `${explanation} Fallback used: ${reason}`
  }

  const result: ComplianceResult = {
    requirementId: requirement.id,
    status,
    confidenceScore,
    matchedExcerpt,
    explanation,
    ...(status === 'Met' ? {} : { suggestedFollowUp }),
  }

  return result
}

const RISK_HEURISTIC_RULES: Array<{
  phrases: string[]
  riskType: RiskType
  severity: RiskSeverity
  toneAssessment: ToneAssessment
  impactSummary: string
}> = [
  {
    phrases: ['limited liability', 'liability is limited', 'no liability', 'liability cap'],
    riskType: 'Liability',
    severity: 'High',
    toneAssessment: 'Evasive',
    impactSummary:
      'This clause can materially reduce vendor accountability for delivery failures or damages. It may leave the buyer with limited contractual remedies if issues arise.',
  },
  {
    phrases: ['additional fees may apply', 'fees may apply', 'extra charges', 'subject to additional charges'],
    riskType: 'Cost Escalation',
    severity: 'High',
    toneAssessment: 'Ambiguous',
    impactSummary:
      'This language introduces open-ended commercial exposure beyond the quoted baseline. It can result in unplanned budget increases during execution.',
  },
  {
    phrases: ['subject to change', 'may vary', 'pricing may vary', 'subject to revision'],
    riskType: 'Cost Escalation',
    severity: 'Medium',
    toneAssessment: 'Ambiguous',
    impactSummary:
      'The commitment is not fixed and can shift after award or during delivery. This reduces predictability for planning, procurement, and controls.',
  },
  {
    phrases: ['at our discretion', 'sole discretion', 'reserves the right'],
    riskType: 'Scope Creep',
    severity: 'High',
    toneAssessment: 'Evasive',
    impactSummary:
      'This gives one party unilateral control over interpretation or execution boundaries. It can cause scope drift and disputes over agreed responsibilities.',
  },
  {
    phrases: ['best efforts', 'commercially reasonable efforts', 'reasonable efforts'],
    riskType: 'Vague Commitment',
    severity: 'Medium',
    toneAssessment: 'Ambiguous',
    impactSummary:
      'The language avoids measurable obligations and makes enforcement difficult. Performance outcomes may be contested because commitments are not explicit.',
  },
  {
    phrases: ['pending approval', 'subject to approval', 'internal approval required', 'board approval'],
    riskType: 'Approval Dependency',
    severity: 'Medium',
    toneAssessment: 'Ambiguous',
    impactSummary:
      'Delivery is contingent on additional approvals outside the current commitment. This may create timeline uncertainty and execution delays.',
  },
]

const extractRiskFlagsLocally = (
  vendorProposalText: string,
  reason?: string
): { riskFlags: RiskFlag[]; overallToneScore: number } => {
  const sentences = splitIntoSentences(vendorProposalText)
  const collected: RiskFlag[] = []
  const seen = new Set<string>()

  for (const sentence of sentences) {
    const normalizedSentence = normalizeForSemanticMatch(sentence)

    for (const rule of RISK_HEURISTIC_RULES) {
      const matchedPhrase = rule.phrases.find(phrase =>
        normalizedSentence.includes(normalizeForSemanticMatch(phrase))
      )

      if (!matchedPhrase) {
        continue
      }

      const key = `${rule.riskType}:${normalizeForSemanticMatch(sentence)}`
      if (seen.has(key)) {
        continue
      }

      seen.add(key)
      collected.push({
        riskId: 'RISK-000',
        flaggedText: sentence,
        riskType: rule.riskType,
        severity: rule.severity,
        impactSummary: reason ? `${rule.impactSummary} Fallback used: ${reason}` : rule.impactSummary,
        toneAssessment: rule.toneAssessment,
      })
    }
  }

  const riskFlags = collected.map((item, index) => ({
    ...item,
    riskId: `RISK-${String(index + 1).padStart(3, '0')}`,
  }))

  const severityPenalty = riskFlags.reduce((sum, risk) => {
    if (risk.severity === 'High') {
      return sum + 2
    }
    if (risk.severity === 'Medium') {
      return sum + 1
    }
    return sum + 0.5
  }, 0)

  const overallToneScore = Math.max(0, Math.min(10, Math.round(10 - severityPenalty)))

  return { riskFlags, overallToneScore }
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

const callGeminiSemanticMatchWithModel = async (
  model: string,
  apiKey: string,
  requirement: ValidationRequirement,
  proposalText: string
): Promise<ComplianceResult> => {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`

  const payload = {
    system_instruction: {
      role: 'system',
      parts: [{ text: SEMANTIC_MATCHING_SYSTEM_PROMPT }],
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Evaluate this requirement against the proposal text and return strict JSON only.\n\nrequirement = ${JSON.stringify(requirement)}\n\nproposalText = ${proposalText}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
    },
  }

  const maxAttempts = 2
  const baseDelayMs = 500

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

    return parseAndValidateComplianceResult(textPart.text, requirement.id)
  }

  throw new Error('Gemini API request failed unexpectedly.')
}

const callGeminiForSemanticMatch = async (
  requirement: ValidationRequirement,
  proposalText: string
): Promise<ComplianceResult> => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.')
  }

  const configuredModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
  const modelCandidates = await getGeminiModelCandidates(configuredModel, apiKey)

  let lastError: unknown = null

  for (const model of modelCandidates) {
    try {
      return await callGeminiSemanticMatchWithModel(model, apiKey, requirement, proposalText)
    } catch (error) {
      lastError = error

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

const callGeminiRiskScanWithModel = async (
  model: string,
  apiKey: string,
  vendorProposalText: string,
  vendorName: string
): Promise<{ riskFlags: RiskFlag[]; overallToneScore: number }> => {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`

  const payload = {
    system_instruction: {
      role: 'system',
      parts: [{ text: RISK_SCAN_SYSTEM_PROMPT }],
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Scan this vendor proposal for hidden legal and commercial risks. Return strict JSON only.\n\nvendorName = ${vendorName}\n\nvendorProposalText = ${vendorProposalText}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
    },
  }

  const maxAttempts = 3
  const baseDelayMs = 700

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

    return parseAndValidateRiskScanResult(textPart.text)
  }

  throw new Error('Gemini API request failed unexpectedly.')
}

const callGeminiForRiskScan = async (
  vendorProposalText: string,
  vendorName: string
): Promise<{ riskFlags: RiskFlag[]; overallToneScore: number }> => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.')
  }

  const configuredModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
  const modelCandidates = await getGeminiModelCandidates(configuredModel, apiKey)

  let lastError: unknown = null

  for (const model of modelCandidates) {
    try {
      return await callGeminiRiskScanWithModel(model, apiKey, vendorProposalText, vendorName)
    } catch (error) {
      lastError = error

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
app.use('/reports', express.static(reportsDirectoryPath))

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
    const message = error instanceof Error ? error.message : 'Unknown extraction error'

    if (message.includes('Rate limited')) {
      console.warn('Requirement extraction Gemini rate-limited; using local fallback.')
    } else {
      console.error('Requirement extraction failed:', error)
    }

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

/**
 * Validate all requirements in a single Gemini API call.
 * This minimizes rate-limit risk during demos by avoiding per-requirement fan-out.
 */
const callGeminiForBatchValidation = async (
  requirements: ValidationRequirement[],
  proposalText: string
): Promise<ComplianceResult[]> => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.')
  }

  const configuredModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
  const modelCandidates = await getGeminiModelCandidates(configuredModel, apiKey)

  let lastError: unknown = null

  for (const model of modelCandidates) {
    try {
      return await callGeminiSemanticMatchBatchWithModel(model, apiKey, requirements, proposalText)
    } catch (error) {
      lastError = error

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

const callGeminiSemanticMatchBatchWithModel = async (
  model: string,
  apiKey: string,
  requirements: ValidationRequirement[],
  proposalText: string
): Promise<ComplianceResult[]> => {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`

  const indexedRequirements = requirements.map((req, index) => ({
    requirementIndex: index,
    requirementId: req.id,
    requirementText: req.requirementText,
  }))

  const batchPrompt = `Evaluate all requirements against proposalText and return strict JSON array only.\n\nrequirements = ${JSON.stringify(indexedRequirements)}\n\nproposalText = ${proposalText}`

  const payload = {
    system_instruction: {
      role: 'system',
      parts: [{ text: BATCH_SEMANTIC_MATCHING_SYSTEM_PROMPT }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: batchPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
    },
  }

  const maxAttempts = 2
  const baseDelayMs = 500

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

    return parseAndValidateBatchComplianceResults(textPart.text, requirements)
  }

  throw new Error('Gemini API request failed unexpectedly.')
}

// Validate a vendor proposal PDF against an array of requirements.
app.post('/api/validate-vendor', (req: Request, res: Response) => {
  upload.single('file')(req, res, async err => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'File too large. Maximum allowed size is 10MB.' })
          return
        }
        res.status(400).json({ error: `Upload error: ${err.message}` })
        return
      }

      res.status(400).json({ error: err.message || 'Invalid upload request' })
      return
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded. Provide a PDF file in form field "file".' })
      return
    }

    let requirements: ValidationRequirement[]
    try {
      requirements = parseValidationRequirements(req.body?.requirements)
      if (requirements.length === 0) {
        res.status(400).json({ error: 'Requirements array must not be empty.' })
        return
      }
    } catch (parseError) {
      const message = parseError instanceof Error ? parseError.message : 'Invalid requirements input.'
      res.status(400).json({ error: message })
      return
    }

    let proposalText = ''
    try {
      const parsedPdf = await pdfParse(req.file.buffer)
      proposalText = (parsedPdf.text || '').trim()

      if (!proposalText) {
        res.status(400).json({ error: 'Uploaded PDF contains no extractable text.' })
        return
      }
    } catch (parseError) {
      console.error('Failed to parse uploaded vendor PDF:', parseError)
      res.status(500).json({ error: 'Failed to parse vendor PDF file.' })
      return
    }

    const vendorNameFromBody =
      typeof req.body?.vendorName === 'string' ? req.body.vendorName.trim() : ''
    const vendorName =
      vendorNameFromBody || req.file.originalname.replace(/\.pdf$/i, '').trim() || 'Unknown Vendor'

    // Check cache before processing
    const cacheKey = generateValidationCacheKey(proposalText, requirements)
    const cached = validationCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
      // Cache hit! Return cached results (valid for 24 hours)
      console.log(`Cache hit for vendor ${vendorName} - skipping API calls`)

      const responsePayload: VendorValidationResponse = {
        vendorName,
        complianceResults: cached.results,
        overallScore: cached.overallScore,
        metCount: cached.results.filter(r => r.status === 'Met').length,
        partialCount: cached.results.filter(r => r.status === 'Partially Met').length,
        missingCount: cached.results.filter(r => r.status === 'Missing').length,
        processedAt: new Date().toISOString(),
      }

      res.status(200).json(responsePayload)
      return
    }

    let complianceResults: ComplianceResult[]
    try {
      complianceResults = await callGeminiForBatchValidation(requirements, proposalText)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown validation error'

      if (message.includes('Rate limited')) {
        console.warn('Gemini rate-limited for full validation batch; using semantic fallback.')
      } else {
        console.error('Failed to validate full requirement set in one call:', error)
      }

      complianceResults = requirements.map(requirement =>
        fallbackSemanticMatch(requirement, proposalText, message)
      )
    }

    const metCount = complianceResults.filter(result => result.status === 'Met').length
    const partialCount = complianceResults.filter(result => result.status === 'Partially Met').length
    const missingCount = complianceResults.filter(result => result.status === 'Missing').length

    const totalPoints = complianceResults.reduce((sum, result) => {
      if (result.status === 'Met') {
        return sum + 100
      }
      if (result.status === 'Partially Met') {
        return sum + 50
      }
      return sum
    }, 0)

    const overallScore =
      complianceResults.length > 0 ? Math.round(totalPoints / complianceResults.length) : 0

    // Store in cache for future requests
    validationCache.set(cacheKey, {
      results: complianceResults,
      overallScore,
      timestamp: Date.now(),
    })

    const responsePayload: VendorValidationResponse = {
      vendorName,
      complianceResults,
      overallScore,
      metCount,
      partialCount,
      missingCount,
      processedAt: new Date().toISOString(),
    }

    res.status(200).json(responsePayload)
  })
})

// Scan a vendor proposal text for legal/commercial risks.
app.post('/api/scan-risks', async (req: Request, res: Response) => {
  const vendorProposalText = req.body?.vendorProposalText
  const vendorNameRaw = req.body?.vendorName

  if (typeof vendorProposalText !== 'string' || !vendorProposalText.trim()) {
    res.status(400).json({
      error: 'Invalid request body. Expected { vendorProposalText: string, vendorName: string }.',
    })
    return
  }

  if (typeof vendorNameRaw !== 'string' || !vendorNameRaw.trim()) {
    res.status(400).json({
      error: 'Invalid request body. vendorName must be a non-empty string.',
    })
    return
  }

  const vendorName = vendorNameRaw.trim()

  try {
    const { riskFlags, overallToneScore } = await callGeminiForRiskScan(
      vendorProposalText.trim(),
      vendorName
    )

    const riskSummary = riskFlags.reduce(
      (acc, risk) => {
        if (risk.severity === 'High') {
          acc.high += 1
        } else if (risk.severity === 'Medium') {
          acc.medium += 1
        } else {
          acc.low += 1
        }
        return acc
      },
      { high: 0, medium: 0, low: 0 }
    )

    const responsePayload: RiskScanResponse = {
      vendorName,
      riskFlags,
      riskSummary,
      overallToneScore,
      scannedAt: new Date().toISOString(),
      ...(riskFlags.length === 0
        ? { note: 'No material legal or commercial risks were detected in the proposal text.' }
        : {}),
    }

    res.status(200).json(responsePayload)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown risk scan error'

    if (message.includes('GEMINI_API_KEY is not configured')) {
      res.status(500).json({
        error: 'Server is missing Gemini API configuration.',
        details: message,
      })
      return
    }

    const malformedResponseError =
      message.includes('not valid JSON object for risk scan') ||
      message.includes('must be a JSON object') ||
      message.includes('must include risks array') ||
      message.includes('contains malformed fields')

    if (malformedResponseError) {
      res.status(502).json({
        error: 'AI returned malformed risk scan data.',
        details: message,
      })
      return
    }

    if (message.includes('Rate limited')) {
      console.warn('Risk scan Gemini rate-limited; using local fallback scan.')

      const { riskFlags, overallToneScore } = extractRiskFlagsLocally(
        vendorProposalText.trim(),
        message
      )

      const riskSummary = riskFlags.reduce(
        (acc, risk) => {
          if (risk.severity === 'High') {
            acc.high += 1
          } else if (risk.severity === 'Medium') {
            acc.medium += 1
          } else {
            acc.low += 1
          }
          return acc
        },
        { high: 0, medium: 0, low: 0 }
      )

      res.status(200).json({
        vendorName,
        riskFlags,
        riskSummary,
        overallToneScore,
        scannedAt: new Date().toISOString(),
        note:
          riskFlags.length === 0
            ? 'Gemini was rate-limited. Local fallback scan found no material risks.'
            : 'Gemini was rate-limited. Returned local fallback risk scan results.',
      })
      return
    }

    console.error('Risk scan failed:', error)
    res.status(500).json({
      error: 'Failed to scan proposal risks.',
      details: message,
    })
  }
})

app.post('/api/generate-report', async (req: Request, res: Response) => {
  const body = req.body as Partial<{
    projectName: string
    user: string
    generatedAt: string
    requirements: GenerateReportRequirement[]
    vendorResults: GenerateReportVendorResult[]
    riskFlagsPerVendor: Record<string, RiskFlag[]>
    riskFlagsByVendor: Record<string, RiskFlag[]>
  }>

  if (!body.projectName || typeof body.projectName !== 'string') {
    res.status(400).json({ error: 'projectName is required and must be a string.' })
    return
  }

  if (!Array.isArray(body.requirements) || body.requirements.length === 0) {
    res.status(400).json({ error: 'requirements must be a non-empty array.' })
    return
  }

  if (!Array.isArray(body.vendorResults) || body.vendorResults.length === 0) {
    res.status(400).json({ error: 'vendorResults must be a non-empty array.' })
    return
  }

  const reportInput: GenerateReportInput = {
    projectName: body.projectName.trim(),
    user: typeof body.user === 'string' && body.user.trim() ? body.user.trim() : 'Unknown User',
    generatedAt: body.generatedAt ? new Date(body.generatedAt) : new Date(),
    requirements: body.requirements,
    vendorResults: body.vendorResults,
    riskFlagsPerVendor: body.riskFlagsPerVendor ?? body.riskFlagsByVendor ?? {},
  }

  try {
    await fs.promises.mkdir(reportsDirectoryPath, { recursive: true })

    const uniqueId = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
    const csvFileName = `tender-review-${uniqueId}.csv`
    const pdfFileName = `tender-review-${uniqueId}.pdf`
    const csvPath = path.join(reportsDirectoryPath, csvFileName)
    const pdfPath = path.join(reportsDirectoryPath, pdfFileName)

    await writeCsvReport(reportInput, csvPath)
    await writePdfReport(reportInput, pdfPath)

    const baseUrl = `${req.protocol}://${req.get('host')}`

    res.status(201).json({
      message: 'Report generated successfully.',
      csv: {
        fileName: csvFileName,
        downloadUrl: `${baseUrl}/reports/${csvFileName}`,
      },
      pdf: {
        fileName: pdfFileName,
        downloadUrl: `${baseUrl}/reports/${pdfFileName}`,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown report generation error.'
    console.error('Failed to generate report:', error)
    res.status(500).json({ error: 'Failed to generate report.', details: message })
  }
})

// API Routes (to be implemented)
// Import routes here as they're created:
app.use('/api/auth', authRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/proposals', proposalsRouter)
// app.use('/api/rfp', rfpRoutes)
// app.use('/api/compliance', complianceRoutes)
// app.use('/api/risks', riskRoutes)

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
