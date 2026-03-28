// ============================================================
// EXAMPLE API ROUTES & SERVICE IMPLEMENTATIONS
// This shows how the architecture flows together
// ============================================================

// ============================================================
// BACKEND API ROUTES EXAMPLE
// Location: backend/src/routes/complianceRoutes.ts
// ============================================================

import { Router } from 'express';
import { validateProposal, getComplianceResults, generateReport } from '@/controllers/complianceController';
import { authMiddleware } from '@/middleware/authMiddleware';
import { validationMiddleware } from '@/middleware/validation';
import { validateProposalSchema } from '@/utils/validators';

const router = Router();

/**
 * POST /api/validate/:proposalId
 * Validate a vendor proposal against RFP requirements
 * Triggers async processing via Bull queue
 */
router.post(
  '/:proposalId',
  authMiddleware,
  validationMiddleware(validateProposalSchema),
  validateProposal
);

/**
 * GET /api/compliance/:proposalId
 * Fetch compliance results for a specific proposal
 * Returns array of ComplianceResult objects
 */
router.get('/:proposalId', authMiddleware, getComplianceResults);

/**
 * GET /api/compliance/rfp/:rfpId/report
 * Generate comprehensive compliance report for RFP
 * Aggregates all proposals and requirements
 */
router.get('/rfp/:rfpId/report', authMiddleware, generateReport);

export default router;

// ============================================================
// BACKEND COMPLIANCE SERVICE EXAMPLE
// Location: backend/src/services/complianceService.ts
// ============================================================

import { prisma } from '@/config/database';
import { aiService } from './aiService';
import { riskService } from './riskService';
import { logger } from '@/utils/logger';
import {
  VendorProposal,
  Requirement,
  ComplianceResult,
  ComplianceStatus,
  ComplianceSummary,
} from '../../../MODELS';

export class ComplianceService {
  /**
   * Main validation orchestrator
   * Called asynchronously via Bull queue
   */
  async validateProposal(proposalId: string): Promise<void> {
    try {
      logger.info(`Starting compliance validation for proposal ${proposalId}`);

      // 1. Fetch proposal and RFP requirements
      const proposal = await prisma.vendorProposal.findUnique({
        where: { id: proposalId },
        include: {
          rfpDocument: {
            include: {
              requirements: true,
            },
          },
        },
      });

      if (!proposal) {
        throw new Error(`Proposal ${proposalId} not found`);
      }

      const requirements = proposal.rfpDocument.requirements;
      logger.info(`Found ${requirements.length} requirements for validation`);

      // 2. Evaluate proposal against each requirement
      const complianceResults: ComplianceResult[] = [];
      for (const requirement of requirements) {
        const result = await this.evaluateRequirement(
          proposal,
          requirement
        );
        complianceResults.push(result);
      }

      // 3. Detect risks based on compliance gaps
      const riskFlags = await riskService.detectRisks(
        proposalId,
        complianceResults
      );

      // 4. Calculate overall scores
      const overallScore = this.calculateOverallScore(complianceResults);
      const overallRiskLevel = riskService.calculateAggregateRisk(riskFlags);

      // 5. Update proposal with scores
      await prisma.vendorProposal.update({
        where: { id: proposalId },
        data: {
          overallComplianceScore: overallScore,
          overallRiskLevel: overallRiskLevel,
          status: 'PROCESSED',
          processingCompletedAt: new Date(),
        },
      });

      logger.info(`Compliance validation completed for proposal ${proposalId}`);
    } catch (error) {
      logger.error(`Error validating proposal ${proposalId}:`, error);
      await prisma.vendorProposal.update({
        where: { id: proposalId },
        data: {
          status: 'ERROR',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  /**
   * Evaluate single requirement against proposal
   * Uses Claude API for semantic matching
   */
  private async evaluateRequirement(
    proposal: VendorProposal,
    requirement: Requirement
  ): Promise<ComplianceResult> {
    logger.info(
      `Evaluating requirement ${requirement.id} for proposal ${proposal.id}`
    );

    // Use Claude to analyze compliance
    const analysis = await aiService.evaluateCompliance({
      requirementText: requirement.text,
      proposalText: proposal.extractedText,
      keywords: requirement.keywords,
      acceptanceCriteria: requirement.acceptanceCriteria,
    });

    // Store result in database
    const result = await prisma.complianceResult.upsert({
      where: {
        requirementId_proposalId: {
          requirementId: requirement.id,
          proposalId: proposal.id,
        },
      },
      create: {
        requirementId: requirement.id,
        proposalId: proposal.id,
        status: analysis.status as ComplianceStatus,
        complianceScore: analysis.score,
        evidenceText: analysis.evidenceText,
        analysisNotes: analysis.notes,
        aiConfidenceScore: analysis.confidence,
        gapDescription: analysis.gap,
      },
      update: {
        status: analysis.status as ComplianceStatus,
        complianceScore: analysis.score,
        evidenceText: analysis.evidenceText,
        analysisNotes: analysis.notes,
        aiConfidenceScore: analysis.confidence,
        gapDescription: analysis.gap,
        updatedAt: new Date(),
      },
    });

    return result as ComplianceResult;
  }

  /**
   * Calculate overall compliance score (weighted average)
   */
  private calculateOverallScore(results: ComplianceResult[]): number {
    if (results.length === 0) return 0;

    const sum = results.reduce((acc, result) => {
      return acc + (result.complianceScore || 0);
    }, 0);

    return Math.round(sum / results.length);
  }

  /**
   * Get stored compliance results
   */
  async getComplianceResults(proposalId: string): Promise<ComplianceResult[]> {
    return await prisma.complianceResult.findMany({
      where: { proposalId },
      include: { requirement: true },
    });
  }

  /**
   * Generate compliance summary for dashboard
   */
  async generateSummary(proposalId: string): Promise<ComplianceSummary> {
    const proposal = await prisma.vendorProposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) {
      throw new Error(`Proposal not found: ${proposalId}`);
    }

    const results = await this.getComplianceResults(proposalId);
    const riskFlags = await riskService.getRiskFlags(proposalId);

    const summary: ComplianceSummary = {
      proposalId,
      vendorName: proposal.vendorName,
      totalRequirements: results.length,
      mandatoryRequirements: 0,
      compliantCount: 0,
      partiallyCompliantCount: 0,
      nonCompliantCount: 0,
      unclearCount: 0,
      notApplicableCount: 0,
      overallScore: proposal.overallComplianceScore || 0,
      mandatoryComplianceScore: 0,
      criticalRisks: 0,
      highRisks: 0,
      mediumRisks: 0,
      lowRisks: 0,
      overallRiskLevel: proposal.overallRiskLevel,
      complianceByCategory: {},
    };

    // Count by status
    results.forEach((result) => {
      switch (result.status) {
        case ComplianceStatus.COMPLIANT:
          summary.compliantCount++;
          break;
        case ComplianceStatus.PARTIALLY_COMPLIANT:
          summary.partiallyCompliantCount++;
          break;
        case ComplianceStatus.NON_COMPLIANT:
          summary.nonCompliantCount++;
          break;
        case ComplianceStatus.UNCLEAR:
          summary.unclearCount++;
          break;
        case ComplianceStatus.NOT_APPLICABLE:
          summary.notApplicableCount++;
          break;
      }
    });

    // Count risks by severity
    riskFlags.forEach((risk) => {
      switch (risk.severity) {
        case 'CRITICAL':
          summary.criticalRisks++;
          break;
        case 'HIGH':
          summary.highRisks++;
          break;
        case 'MEDIUM':
          summary.mediumRisks++;
          break;
        case 'LOW':
          summary.lowRisks++;
          break;
      }
    });

    return summary;
  }
}

export const complianceService = new ComplianceService();

// ============================================================
// BACKEND AI SERVICE EXAMPLE
// Location: backend/src/services/aiService.ts
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/utils/logger';

const client = new Anthropic();

interface EvaluationInput {
  requirementText: string;
  proposalText: string;
  keywords: string[];
  acceptanceCriteria?: string;
}

interface EvaluationOutput {
  status: 'COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NON_COMPLIANT' | 'UNCLEAR';
  score: number;
  evidenceText: string;
  notes: string;
  confidence: number;
  gap?: string;
}

export class AIService {
  /**
   * Use Claude to evaluate if proposal meets requirement
   */
  async evaluateCompliance(input: EvaluationInput): Promise<EvaluationOutput> {
    const prompt = this.buildEvaluationPrompt(input);

    try {
      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      return this.parseComplianceResponse(content.text);
    } catch (error) {
      logger.error('Error evaluating compliance with Claude:', error);
      throw error;
    }
  }

  /**
   * Extract requirements from RFP document
   */
  async extractRequirements(rfpText: string): Promise<string[]> {
    const prompt = `Analyze the following RFP document and extract all mandatory requirements.
Each requirement should be a clear, concise statement.
Format as JSON array of strings.

RFP Document:
${rfpText}

Return ONLY JSON array, no other text:`;

    try {
      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      return JSON.parse(content.text);
    } catch (error) {
      logger.error('Error extracting requirements:', error);
      throw error;
    }
  }

  /**
   * Detect risks in proposal
   */
  async detectRisks(proposalText: string): Promise<Array<{
    title: string;
    description: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    category: string;
  }>> {
    const prompt = `Analyze this vendor proposal for potential risks and red flags.
Consider legal, financial, timeline, technical, and vendor credibility risks.
Return JSON array of risk objects with title, description, severity, and category.

Proposal:
${proposalText}

Return ONLY JSON array:`;

    try {
      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      return JSON.parse(content.text);
    } catch (error) {
      logger.error('Error detecting risks:', error);
      throw error;
    }
  }

  private buildEvaluationPrompt(input: EvaluationInput): string {
    return `You are a contract compliance expert. Analyze if the following vendor proposal meets the specified requirement.

REQUIREMENT:
${input.requirementText}

ACCEPTANCE CRITERIA:
${input.acceptanceCriteria || 'Not specified'}

KEY TERMS TO MATCH:
${input.keywords.join(', ')}

VENDOR PROPOSAL:
${input.proposalText}

Provide your analysis in JSON format with:
{
  "status": "COMPLIANT" | "PARTIALLY_COMPLIANT" | "NON_COMPLIANT" | "UNCLEAR",
  "score": 0-100,
  "evidenceText": "Quote from proposal supporting assessment",
  "notes": "Detailed explanation",
  "confidence": 0-1,
  "gap": "What's missing if not fully compliant"
}

Return ONLY JSON, no markdown or extra text:`;
  }

  private parseComplianceResponse(text: string): EvaluationOutput {
    try {
      return JSON.parse(text);
    } catch {
      logger.error('Failed to parse Claude response:', text);
      return {
        status: 'UNCLEAR',
        score: 50,
        evidenceText: '',
        notes: 'Unable to determine compliance',
        confidence: 0.2,
      };
    }
  }
}

export const aiService = new AIService();

// ============================================================
// FRONTEND COMPLIANCE HOOK EXAMPLE
// Location: frontend/src/hooks/useComplianceData.ts
// ============================================================

import { useQuery, useMutation } from '@tanstack/react-query';
import { complianceService } from '@/services/complianceService';
import { useToast } from '@/store/toastStore';

export function useComplianceData(proposalId: string | null) {
  const { addToast } = useToast();

  // Fetch compliance results
  const {
    data: results,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['compliance', proposalId],
    queryFn: () => {
      if (!proposalId) return null;
      return complianceService.getComplianceResults(proposalId);
    },
    enabled: !!proposalId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Trigger validation
  const { mutate: validate, isPending: isValidating } = useMutation({
    mutationFn: (id: string) => complianceService.validateProposal(id),
    onSuccess: () => {
      addToast({
        message: 'Proposal validation started',
        type: 'info',
      });
      // Refetch compliance data
      // queryClient.invalidateQueries({ queryKey: ['compliance', proposalId] });
    },
    onError: (error) => {
      addToast({
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
    },
  });

  return {
    results,
    isLoading,
    error,
    validate,
    isValidating,
  };
}

// ============================================================
// FRONTEND COMPLIANCE COMPONENT EXAMPLE
// Location: frontend/src/components/compliance/ComplianceDetail.tsx
// ============================================================

import React from 'react';
import { useComplianceData } from '@/hooks/useComplianceData';
import { ComplianceResult } from '@/types';
import ComplianceItem from './ComplianceItem';

interface Props {
  proposalId: string;
}

export default function ComplianceDetail({ proposalId }: Props) {
  const { results, isLoading, error, validate, isValidating } =
    useComplianceData(proposalId);

  if (isLoading) {
    return <div className="p-4">Loading compliance results...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error loading results</div>;
  }

  const compliant = results?.filter(
    (r) => r.status === 'COMPLIANT'
  ).length || 0;
  const nonCompliant =
    results?.filter((r) => r.status === 'NON_COMPLIANT').length || 0;
  const partial =
    results?.filter((r) => r.status === 'PARTIALLY_COMPLIANT').length || 0;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-green-50 p-4 rounded">
          <div className="text-2xl font-bold text-green-600">{compliant}</div>
          <div className="text-sm text-gray-600">Compliant</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded">
          <div className="text-2xl font-bold text-yellow-600">{partial}</div>
          <div className="text-sm text-gray-600">Partial</div>
        </div>
        <div className="bg-red-50 p-4 rounded">
          <div className="text-2xl font-bold text-red-600">{nonCompliant}</div>
          <div className="text-sm text-gray-600">Non-Compliant</div>
        </div>
        <button
          onClick={() => validate(proposalId)}
          disabled={isValidating}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isValidating ? 'Validating...' : 'Revalidate'}
        </button>
      </div>

      {/* Detailed Results */}
      <div className="space-y-2">
        {results?.map((result) => (
          <ComplianceItem key={result.id} result={result} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// DATABASE ACCESS EXAMPLES
// These show how Prisma is used throughout the codebase
// ============================================================

// Fetch with relations
const proposal = await prisma.vendorProposal.findUnique({
  where: { id: proposalId },
  include: {
    rfpDocument: {
      include: {
        requirements: true,
      },
    },
    complianceResults: {
      include: {
        requirement: true,
      },
    },
    riskFlags: true,
  },
});

// Aggregation query
const summary = await prisma.complianceResult.groupBy({
  by: ['status'],
  where: { proposalId },
  _count: true,
});

// Transaction (multiple operations)
await prisma.$transaction([
  prisma.vendorProposal.update({
    where: { id: proposalId },
    data: { status: 'PROCESSED' },
  }),
  prisma.auditLog.create({
    data: {
      userId: currentUser.id,
      action: 'VALIDATE_PROPOSAL',
      resourceType: 'PROPOSAL',
      resourceId: proposalId,
    },
  }),
]);

// ============================================================
// This shows how TypeScript, React, Node.js, Prisma,
// and Claude API work together in a cohesive architecture
// ============================================================
