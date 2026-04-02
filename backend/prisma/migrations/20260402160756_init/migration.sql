-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFPDocument" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extractedText" TEXT,
    "pageCount" INTEGER,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "RFPDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractedRequirement" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "order" INTEGER NOT NULL DEFAULT 0,
    "projectId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,

    CONSTRAINT "ExtractedRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorProposal" (
    "id" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proposalText" TEXT,
    "overallScore" INTEGER,
    "metCount" INTEGER,
    "partialCount" INTEGER,
    "missingCount" INTEGER,
    "validatedAt" TIMESTAMP(3),
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "VendorProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceResult" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "matchedExcerpt" TEXT,
    "explanation" TEXT,
    "suggestedFollowUp" TEXT,
    "flaggedForReview" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "proposalId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,

    CONSTRAINT "ComplianceResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationCache" (
    "id" TEXT NOT NULL,
    "proposalHash" TEXT NOT NULL,
    "requirementIds" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidationCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "RFPDocument_projectId_idx" ON "RFPDocument"("projectId");

-- CreateIndex
CREATE INDEX "ExtractedRequirement_projectId_idx" ON "ExtractedRequirement"("projectId");

-- CreateIndex
CREATE INDEX "ExtractedRequirement_documentId_idx" ON "ExtractedRequirement"("documentId");

-- CreateIndex
CREATE INDEX "VendorProposal_projectId_idx" ON "VendorProposal"("projectId");

-- CreateIndex
CREATE INDEX "VendorProposal_userId_idx" ON "VendorProposal"("userId");

-- CreateIndex
CREATE INDEX "VendorProposal_vendorName_idx" ON "VendorProposal"("vendorName");

-- CreateIndex
CREATE INDEX "ComplianceResult_proposalId_idx" ON "ComplianceResult"("proposalId");

-- CreateIndex
CREATE INDEX "ComplianceResult_requirementId_idx" ON "ComplianceResult"("requirementId");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceResult_proposalId_requirementId_key" ON "ComplianceResult"("proposalId", "requirementId");

-- CreateIndex
CREATE UNIQUE INDEX "ValidationCache_proposalHash_key" ON "ValidationCache"("proposalHash");

-- CreateIndex
CREATE INDEX "ValidationCache_expiresAt_idx" ON "ValidationCache"("expiresAt");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFPDocument" ADD CONSTRAINT "RFPDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractedRequirement" ADD CONSTRAINT "ExtractedRequirement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractedRequirement" ADD CONSTRAINT "ExtractedRequirement_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "RFPDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProposal" ADD CONSTRAINT "VendorProposal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorProposal" ADD CONSTRAINT "VendorProposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceResult" ADD CONSTRAINT "ComplianceResult_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "VendorProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceResult" ADD CONSTRAINT "ComplianceResult_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "ExtractedRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
