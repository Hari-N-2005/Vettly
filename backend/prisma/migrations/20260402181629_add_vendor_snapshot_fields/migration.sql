-- AlterTable
ALTER TABLE "VendorProposal" ADD COLUMN     "matchingCriteria" JSONB,
ADD COLUMN     "requirementsSnapshot" JSONB;
