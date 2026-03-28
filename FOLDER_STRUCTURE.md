# Complete Folder Structure - Tender Compliance Validator

## Root Directory Structure

```
vettly/
│
├── frontend/                          # React + Vite frontend application
├── backend/                           # Node.js + Express backend
├── shared/                            # Shared types (optional monorepo structure)
├── docker-compose.yml                 # Local development environment
├── .gitignore
├── .editorconfig
├── TECH_STACK.md                      # Tech stack documentation
├── MODELS.ts                          # Data models & TypeScript interfaces
├── FOLDER_STRUCTURE.md                # This file
└── README.md                          # Project overview
```

---

## Frontend Structure: `frontend/`

```
frontend/
├── src/
│   ├── assets/
│   │   ├── logos/
│   │   │   └── vettly-logo.svg
│   │   ├── icons/
│   │   │   ├── upload-icon.svg
│   │   │   ├── check-icon.svg
│   │   │   ├── warning-icon.svg
│   │   │   └── dashboard-icon.svg
│   │   └── images/
│   │       └── placeholder.png
│   │
│   ├── components/
│   │   ├── common/                    # Reusable components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Loading.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── ToastNotification.tsx
│   │   │
│   │   ├── upload/                    # Upload related components
│   │   │   ├── DocumentDropZone.tsx   # Drag-drop file upload
│   │   │   ├── RFPUploadForm.tsx      # RFP-specific upload
│   │   │   ├── ProposalUploadForm.tsx # Proposal upload
│   │   │   ├── FilePreview.tsx        # Show uploaded file details
│   │   │   └── UploadProgress.tsx     # Progress indicator
│   │   │
│   │   ├── dashboard/                 # Dashboard components
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── VendorComparisonTable.tsx  # Vendor comparison matrix
│   │   │   ├── ComplianceHeatmap.tsx      # Visual heatmap
│   │   │   ├── RiskSummaryChart.tsx       # Risk distribution
│   │   │   ├── OverallScoreCard.tsx
│   │   │   ├── TopVendors.tsx
│   │   │   ├── RiskBreakdown.tsx
│   │   │   └── FilterPanel.tsx       # Filter vendors, categories
│   │   │
│   │   ├── requirements/              # Requirements display
│   │   │   ├── RequirementsList.tsx
│   │   │   ├── RequirementCard.tsx
│   │   │   ├── RequirementEditor.tsx  # Edit/add requirements
│   │   │   ├── RequirementDetail.tsx
│   │   │   └── RequirementFilters.tsx # Filter by category, priority
│   │   │
│   │   ├── proposals/                 # Proposal components
│   │   │   ├── ProposalList.tsx
│   │   │   ├── ProposalCard.tsx
│   │   │   ├── ProposalDetail.tsx
│   │   │   └── ProposalActions.tsx    # Archive, delete, revalidate
│   │   │
│   │   ├── compliance/                # Compliance evaluation
│   │   │   ├── ComplianceDetail.tsx   # Per-proposal compliance
│   │   │   ├── ComplianceItem.tsx     # Single requirement result
│   │   │   ├── ComplianceStatusBadge.tsx  # COMPLIANT, PARTIAL, etc.
│   │   │   ├── GapAnalysis.tsx        # Show gaps/missing items
│   │   │   └── ComplianceReport.tsx   # Printable report
│   │   │
│   │   ├── risks/                     # Risk display
│   │   │   ├── RiskList.tsx
│   │   │   ├── RiskCard.tsx
│   │   │   ├── RiskDetail.tsx
│   │   │   ├── RiskSeverityBadge.tsx  # Color-coded severity
│   │   │   ├── RiskTimeline.tsx       # Risk history
│   │   │   └── RiskAcknowledgement.tsx # Mark risk as acknowledged
│   │   │
│   │   └── rfp/                       # RFP management
│   │       ├── RFPList.tsx
│   │       ├── RFPCard.tsx
│   │       ├── RFPDetail.tsx
│   │       └── RFPActions.tsx
│   │
│   ├── pages/                         # Page-level components (routes)
│   │   ├── Home.tsx                   # Landing page
│   │   ├── RFPManagement.tsx          # RFP list & upload
│   │   ├── RFPDetail.tsx              # Single RFP with proposals
│   │   ├── Dashboard.tsx              # Main dashboard (vendor comparison)
│   │   ├── ComplianceReport.tsx       # Detailed compliance view
│   │   ├── ProposalComparison.tsx     # Side-by-side proposal comparison
│   │   ├── RiskAnalysis.tsx           # Risk breakdown & mitigation
│   │   ├── Settings.tsx
│   │   ├── NotFound.tsx
│   │   └── Login.tsx
│   │
│   ├── hooks/                         # Custom React hooks
│   │   ├── useRFPManagement.ts        # Fetch, upload RFP logic
│   │   ├── useProposalValidation.ts   # Validate proposal logic
│   │   ├── useComplianceData.ts       # Fetch compliance results
│   │   ├── useDashboard.ts            # Dashboard data aggregation
│   │   ├── useLocalStorage.ts         # Persist user preferences
│   │   ├── usePagination.ts           # Table pagination
│   │   ├── useFilters.ts              # Multi-field filtering
│   │   └── useAuth.ts                 # Authentication logic
│   │
│   ├── services/                      # API communication
│   │   ├── api.ts                     # Axios instance with interceptors
│   │   ├── rfpService.ts              # RFP endpoints
│   │   ├── proposalService.ts         # Proposal endpoints
│   │   ├── complianceService.ts       # Compliance validation endpoints
│   │   ├── dashboardService.ts        # Dashboard data endpoints
│   │   ├── authService.ts             # Login/logout, token refresh
│   │   └── errorHandler.ts            # Centralized error handling
│   │
│   ├── store/                         # State management (Zustand)
│   │   ├── authStore.ts               # User authentication state
│   │   ├── rfpStore.ts                # RFP state
│   │   ├── proposalStore.ts           # Proposal state
│   │   ├── complianceStore.ts         # Compliance cache
│   │   ├── uiStore.ts                 # UI state (modals, filters)
│   │   └── toastStore.ts              # Toast notifications queue
│   │
│   ├── types/                         # Frontend-specific types (extends MODELS.ts)
│   │   ├── api.ts                     # API request/response types
│   │   ├── components.ts              # Component props types
│   │   ├── redux.ts                   # Store/action types
│   │   └── index.ts                   # Re-export all types
│   │
│   ├── utils/                         # Utility functions
│   │   ├── formatters.ts              # Date, currency formatting
│   │   ├── validators.ts              # Form validation functions
│   │   ├── constants.ts               # App constants, enums
│   │   ├── classifiers.ts             # CSS class utilities
│   │   ├── scoring.ts                 # Compliance score calculations
│   │   └── export.ts                  # PDF/CSV export utilities
│   │
│   ├── styles/
│   │   ├── global.css                 # Global styles
│   │   ├── tailwind.css               # Tailwind directives
│   │   ├── variables.css              # CSS custom properties
│   │   └── animations.css             # Animations/transitions
│   │
│   ├── App.tsx                        # Main app component
│   ├── main.tsx                       # Entry point
│   └── vite-env.d.ts                  # Vite type definitions
│
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── robots.txt
│
├── tests/
│   ├── components/                    # Component tests
│   │   ├── Dashboard.test.tsx
│   │   ├── ComplianceDetail.test.tsx
│   │   └── RiskList.test.tsx
│   ├── hooks/                         # Hook tests
│   │   ├── useRFPManagement.test.ts
│   │   └── useAuth.test.ts
│   ├── services/                      # Service tests
│   │   └── api.test.ts
│   └── setup.ts                       # Test configuration
│
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── vitest.config.ts                   # Vitest configuration
├── .prettierrc
├── .eslintrc.json
├── package.json
├── package-lock.json
└── README.md                          # Frontend-specific README
```

---

## Backend Structure: `backend/`

```
backend/
├── src/
│   ├── models/                        # Data models (Prisma generates these)
│   │   ├── RFPDocument.ts            # Model interfaces
│   │   ├── Requirement.ts
│   │   ├── VendorProposal.ts
│   │   ├── ComplianceResult.ts
│   │   ├── RiskFlag.ts
│   │   └── User.ts
│   │
│   ├── controllers/                   # Request handlers
│   │   ├── rfpController.ts           # POST/GET/DELETE RFP
│   │   ├── proposalController.ts      # Upload, list proposals
│   │   ├── complianceController.ts    # Validate proposals
│   │   ├── riskController.ts          # Risk analysis endpoints
│   │   ├── dashboardController.ts     # Dashboard aggregation
│   │   ├── requirementController.ts   # Get, edit requirements
│   │   └── authController.ts          # Login, token refresh
│   │
│   ├── routes/                        # Express route definitions
│   │   ├── rfpRoutes.ts               # /api/rfp/*
│   │   ├── proposalRoutes.ts          # /api/proposals/*
│   │   ├── complianceRoutes.ts        # /api/validate/*, /api/compliance/*
│   │   ├── riskRoutes.ts              # /api/risks/*
│   │   ├── dashboardRoutes.ts         # /api/dashboard/*
│   │   ├── requirementRoutes.ts       # /api/requirements/*
│   │   ├── authRoutes.ts              # /api/auth/*
│   │   └── index.ts                   # Combine all routes
│   │
│   ├── services/                      # Business logic
│   │   ├── rfpService.ts              # RFP extraction, processing
│   │   ├── proposalService.ts         # Proposal processing
│   │   ├── requirementService.ts      # Extract requirements via Claude
│   │   ├── complianceService.ts       # Validate proposal vs requirements
│   │   ├── riskService.ts             # Detect risk flags
│   │   ├── aiService.ts               # Claude API integration
│   │   ├── dashboardService.ts        # Aggregate data for dashboard
│   │   ├── authService.ts             # JWT token management
│   │   ├── fileService.ts             # File upload/storage (S3/local)
│   │   └── emailService.ts            # Send notifications (optional)
│   │
│   ├── middleware/                    # Express middleware
│   │   ├── authMiddleware.ts          # JWT verification
│   │   ├── errorHandler.ts            # Global error handling
│   │   ├── logging.ts                 # Request logging (Winston)
│   │   ├── validation.ts              # Input validation (Zod)
│   │   ├── cors.ts                    # CORS configuration
│   │   ├── rateLimit.ts               # Rate limiting
│   │   └── requestContext.ts          # Attach requestId, userId
│   │
│   ├── utils/
│   │   ├── logger.ts                  # Winston logger setup
│   │   ├── validators.ts              # Zod schemas
│   │   ├── constants.ts               # App constants
│   │   ├── helpers.ts                 # Generic utilities
│   │   ├── formatters.ts              # Data formatting
│   │   ├── scoring.ts                 # Compliance scoring logic
│   │   ├── prompts.ts                 # Claude prompt templates
│   │   └── errorCodes.ts              # Standardized error codes
│   │
│   ├── types/
│   │   ├── index.ts                   # Export shared models from ../../MODELS.ts
│   │   ├── express.d.ts               # Extend Express Request type
│   │   └── environment.ts             # Env var types
│   │
│   ├── config/                        # Configuration
│   │   ├── database.ts                # Prisma client setup
│   │   ├── redis.ts                   # Redis client
│   │   ├── claude.ts                  # Claude API configuration
│   │   ├── storage.ts                 # S3/local storage config
│   │   ├── environment.ts             # Load & validate env vars
│   │   └── bull.ts                    # Bull queue setup
│   │
│   ├── database/
│   │   ├── seed.ts                    # Database seeding
│   │   └── migrations/                # (Managed by Prisma)
│   │
│   ├── jobs/                          # Background jobs (Bull queues)
│   │   ├── extractRequirementsJob.ts  # Extract requirements from RFP
│   │   ├── validateProposalJob.ts     # Asynchronous proposal validation
│   │   ├── processFileJob.ts          # OCR/text extraction
│   │   ├── auditLogJob.ts             # Log user actions
│   │   └── jobProcessor.ts            # Central job handler
│   │
│   └── app.ts                         # Express app initialization
│
├── prisma/
│   ├── schema.prisma                  # Database schema
│   └── migrations/
│       └── init/
│           └── migration.sql
│
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   │   ├── complianceService.test.ts
│   │   │   ├── aiService.test.ts
│   │   │   └── riskService.test.ts
│   │   └── utils/
│   │       └── scoring.test.ts
│   │
│   ├── integration/
│   │   ├── api/
│   │   │   ├── rfp.test.ts
│   │   │   ├── proposals.test.ts
│   │   │   ├── compliance.test.ts
│   │   │   └── dashboard.test.ts
│   │   └── database/
│   │       └── models.test.ts
│   │
│   └── setup.ts                       # Test configuration
│
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── tsconfig.json
├── jest.config.js
├── docker-compose.override.yml        # Backend-specific overrides
├── Dockerfile                         # Production Docker image
├── package.json
├── package-lock.json
└── README.md                          # Backend-specific README
```

---

## Shared Types: `shared/` (Optional Monorepo)

```
shared/
├── src/
│   ├── types/
│   │   ├── models.ts                  # Core data models
│   │   ├── api.ts                     # API types
│   │   ├── enums.ts                   # Shared enums
│   │   └── index.ts                   # Main export
│   │
│   ├── utils/
│   │   ├── constants.ts               # Shared constants
│   │   ├── validators.ts              # Shared validation
│   │   └── formatters.ts              # Shared formatters
│   │
│   └── index.ts                       # Single entry point
│
├── tsconfig.json
├── package.json
└── README.md
```

---

## Root Configuration Files

### `docker-compose.yml`
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    env_file: backend/.env
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### Project Root Files

```
vettly/
├── .gitignore
├── .github/
│   └── workflows/
│       ├── test.yml                   # Run tests on PR
│       ├── lint.yml                   # Lint code
│       └── deploy.yml                 # Deploy to production
│
├── .editorconfig
├── TECH_STACK.md
├── MODELS.ts
├── FOLDER_STRUCTURE.md
└── README.md
```

---

## File Patterns & Naming Conventions

### TypeScript Files
- **Components**: `ComponentName.tsx` (PascalCase)
- **Services**: `serviceName.ts` (camelCase)
- **Utilities**: `utilityName.ts` (camelCase)
- **Types/Interfaces**: `fileName.ts` with `PascalCase` exports
- **Tests**: `fileName.test.ts` or `fileName.spec.ts`

### Configuration
- `tsconfig.json` - TypeScript config
- `vite.config.ts` / `jest.config.js` - Build config
- `.env.example` - Environment template
- `.eslintrc.json` / `.prettierrc` - Linting/formatting

### Styling
- Global: `global.css`, `variables.css`
- Component-scoped: Co-locate with component (optional)
- Tailwind: Use utility classes directly in JSX

---

## Module Import Patterns

### Frontend
```typescript
// Absolute imports
import { Button } from "@/components/common";
import { useRFPManagement } from "@/hooks";
import { rfpService } from "@/services";
import { RFPDocument } from "@/types";
```

### Backend
```typescript
// Absolute imports (configured in tsconfig.json)
import { rfpController } from "@/controllers";
import { complianceService } from "@/services";
import { logger } from "@/utils";
import { Requirement } from "@/types";
```

### Shared Types
```typescript
// Import from root MODELS.ts
import { RFPDocument, Requirement, ComplianceStatus } from "../../MODELS";
```

---

## Environment Variables

### Frontend `.env.local`
```
VITE_API_URL=http://localhost:3000/api
VITE_API_TIMEOUT=30000
VITE_ENVIRONMENT=development
```

### Backend `.env`
```
NODE_ENV=development
PORT=3000
DB_URL=postgresql://user:pass@localhost:5432/vettly
REDIS_URL=redis://localhost:6379
CLAUDE_API_KEY=sk-ant-...
JWT_SECRET=super-secret-key
JWT_EXPIRY=7d
FILE_STORAGE_TYPE=local
LOCAL_STORAGE_PATH=./uploads
AWS_S3_BUCKET=vettly-prod
AWS_REGION=us-east-1
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:5173
MAX_FILE_SIZE_MB=50
```

---

## Build & Runtime Structure

### Development Entry Points
- **Frontend**: `frontend/src/main.tsx` → `http://localhost:5173`
- **Backend**: `backend/src/app.ts` → listening on `:3000`

### Production Build Outputs
- **Frontend**: `frontend/dist/` (optimized bundle)
- **Backend**: `backend/dist/` or containerized

---

## Key Design Patterns

1. **API Layer Separation**: All backend endpoints go through defined services, never directly in controllers
2. **Type Safety**: All data flows through TypeScript interfaces from `MODELS.ts`
3. **Error Handling**: Centralized error handler with standardized response format
4. **Logging**: Winston logger tracks all significant operations
5. **Async Processing**: Bull queue handles long-running tasks (RFP extraction, validation)
6. **State Management**: Zustand for frontend, SQL for persistence backend
7. **Validation**: Zod for API input validation
8. **Authentication**: JWT tokens with refresh mechanism

---

This structure supports:
- ✅ Easy navigation and file discovery
- ✅ Scalable component architecture
- ✅ Clear separation of concerns
- ✅ AI integration (Claude via services)
- ✅ Async job processing (Bull/Redis)
- ✅ Database persistence (Prisma + PostgreSQL)
- ✅ Production-ready security
- ✅ Comprehensive testing
