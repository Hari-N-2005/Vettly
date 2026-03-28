import Anthropic from '@anthropic-ai/sdk'
import { config } from '@/config'
import { ExtractedRequirement } from '@/types'

const client = new Anthropic({
  apiKey: config.anthropicApiKey,
})

export class AIService {
  /**
   * Extract requirements from RFP document text
   */
  static async extractRequirements(
    rfpText: string,
    projectName: string
  ): Promise<ExtractedRequirement[]> {
    const prompt = `You are a legal and procurement expert analyzing a Request for Proposal (RFP) document.

Extract all key requirements from the following RFP text. For each requirement, provide:
1. Title - concise requirement name
2. Description - detailed explanation
3. Category - one of: Technical, Legal, Financial, Timeline, Personnel, Other
4. Mandatory - true if requirement must be met, false if optional
5. Priority - high, medium, or low based on importance

RFP Text:
${rfpText}

Return the requirements as a JSON array with this structure:
[
  {
    "title": "string",
    "description": "string",
    "category": "string",
    "mandatory": boolean,
    "priority": "high" | "medium" | "low"
  }
]

Extract 5-20 key requirements. Return ONLY valid JSON, no other text.`

    const message = await client.messages.create({
      model: config.anthropicModel,
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    try {
      const content = message.content[0]
      if (content.type !== 'text') throw new Error('Unexpected response type')

      const requirements = JSON.parse(content.text)
      return requirements.map((req: any, index: number) => ({
        id: `req-${Date.now()}-${index}`,
        projectId: '',
        title: req.title,
        description: req.description,
        category: req.category,
        mandatory: req.mandatory,
        priority: req.priority,
        extractedAt: new Date(),
      }))
    } catch (error) {
      console.error('Failed to extract requirements:', error)
      throw new Error('Failed to extract requirements from RFP')
    }
  }

  /**
   * Analyze vendor proposal for compliance
   */
  static async analyzeCompliance(
    proposalText: string,
    requirementTitle: string,
    requirementDescription: string
  ): Promise<{
    status: 'compliant' | 'non_compliant' | 'unclear'
    confidence: number
    evidence: string[]
  }> {
    const prompt = `You are a legal compliance expert reviewing a vendor proposal against a specific requirement.

Requirement:
Title: ${requirementTitle}
Description: ${requirementDescription}

Vendor Proposal excerpt:
${proposalText}

Analyze if the proposal meets the requirement. Respond with JSON:
{
  "status": "compliant" | "non_compliant" | "unclear",
  "confidence": 0.0-1.0,
  "evidence": ["quote1", "quote2"],
  "reasoning": "brief explanation"
}

Return ONLY valid JSON.`

    const message = await client.messages.create({
      model: config.anthropicModel,
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    try {
      const content = message.content[0]
      if (content.type !== 'text') throw new Error('Unexpected response type')

      const result = JSON.parse(content.text)
      return {
        status: result.status,
        confidence: result.confidence,
        evidence: result.evidence || [],
      }
    } catch (error) {
      console.error('Failed to analyze compliance:', error)
      return {
        status: 'unclear',
        confidence: 0,
        evidence: [],
      }
    }
  }

  /**
   * Detect risks in proposal
   */
  static async detectRisks(
    proposalText: string,
    requirementTitles: string[]
  ): Promise<
    Array<{
      title: string
      description: string
      severity: 'critical' | 'high' | 'medium' | 'low'
      evidence: string[]
    }>
  > {
    const prompt = `You are a risk assessment expert reviewing a vendor proposal.

Key requirements:
${requirementTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Vendor Proposal:
${proposalText}

Identify 3-7 potential risks or gaps in the proposal. Return JSON array:
[
  {
    "title": "Risk title",
    "description": "Detailed risk description",
    "severity": "critical" | "high" | "medium" | "low",
    "evidence": ["quote1", "quote2"]
  }
]

Return ONLY valid JSON.`

    const message = await client.messages.create({
      model: config.anthropicModel,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    try {
      const content = message.content[0]
      if (content.type !== 'text') throw new Error('Unexpected response type')

      return JSON.parse(content.text)
    } catch (error) {
      console.error('Failed to detect risks:', error)
      return []
    }
  }
}

export default AIService
