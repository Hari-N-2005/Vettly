# Vettly Backend

Node.js + Express backend for the Tender Compliance Validator.

## 📋 Project Structure

```
src/
├── controllers/        # Route handlers for RFP, compliance, risks
├── routes/            # API route definitions
├── services/          # Business logic
│   ├── AIService      # Claude AI integration
│   ├── RFPService     # RFP processing
│   ├── ComplianceService  # Compliance checking
│   └── RiskService    # Risk analysis
├── middleware/        # Auth, error handling, logging
├── utils/             # Helper functions
├── types/             # TypeScript interfaces
├── config/            # Environment configuration
├── database/          # Prisma setup
└── jobs/              # Background job queues
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis (optional, for job queues)
- Anthropic API key

### Installation

```bash
cd backend
npm install
```

### Environment Setup

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update with your configuration:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/vettly
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET=your-secret-key
NODE_ENV=development
PORT=3000
```

### Database Setup

Initialize Prisma and run migrations:

```bash
npm run prisma:migrate
```

Seed database with test data (optional):

```bash
npm run seed
```

### Development

```bash
npm run dev
```

Server runs on http://localhost:3000

### Build for Production

```bash
npm run build
npm start
```

### Testing

```bash
npm run test              # Run tests
npm run test:coverage    # Coverage report
npm run typecheck        # TypeScript checking
npm run lint             # ESLint
```

## 🔌 API Endpoints

### RFP Management
- `POST /api/rfp/upload` - Upload RFP document
- `GET /api/rfp` - List all projects
- `GET /api/rfp/:id` - Get project details
- `DELETE /api/rfp/:id` - Delete project

### Requirements Extraction
- `POST /api/rfp/:id/extract` - Extract requirements using AI
- `GET /api/requirements/:id` - Get extracted requirements
- `PUT /api/requirements/:id` - Update requirement

### Compliance
- `GET /api/compliance/:projectId` - Get compliance results
- `POST /api/compliance/:projectId/validate/:vendorId` - Validate proposal
- `GET /api/compliance/:projectId/matrix` - Comparison matrix

### Risk Analysis
- `GET /api/risks/:projectId` - Get risk analysis
- `GET /api/risks/detail/:riskId` - Risk details
- `POST /api/risks/:riskId/acknowledge` - Mark risk as reviewed

### Proposals
- `POST /api/proposals/:projectId/upload` - Upload vendor proposal
- `GET /api/proposals/:projectId/comparison` - Get comparison matrix
- `DELETE /api/proposals/:projectId/:vendorId` - Delete proposal

## 🔐 Authentication

JWT-based authentication with token refresh:

1. `POST /api/auth/login` - Get tokens
2. Include `Authorization: Bearer <token>` in headers
3. Token expires in 1 hour
4. Use refresh token to get new token

## 🤖 AI Integration

Uses Anthropic Claude API for:
- Requirement extraction from RFP documents
- Automatic risk detection
- Vendor proposal analysis
- Compliance scoring

### Prompts

Key prompts defined in `src/services/AIService.ts`:

- `EXTRACT_REQUIREMENTS` - Parse RFP and extract structured requirements
- `ANALYZE_COMPLIANCE` - Compare proposal against requirements
- `DETECT_RISKS` - Identify potential issues and risks

## 📦 File Upload

Supports uploading:
- RFP documents (PDF, DOCX, DOC, TXT)
- Vendor proposals (same formats)
- Maximum file size: 50MB

Files stored in:
- Local: `./uploads/` (development)
- AWS S3: `s3://bucket-name/` (production)

## 🔍 Logging

Winston logger configured with:
- Console output (development)
- File output (all levels: error, warn, info, debug)
- Structured logging with metadata
- Request/response logging via middleware

Logs stored in `./logs/` directory.

## 🧪 Testing

- **Unit tests**: Services and utilities
- **Integration tests**: API endpoints
- **Test framework**: Vitest
- **HTTP testing**: Supertest

## 🚀 Deployment

### Docker
```bash
docker build -t vettly-backend .
docker run -p 3000:3000 vettly-backend
```

### Environment Variables
All required env vars documented in `.env.example`

### Database Migrations
Automatically run on startup via Prisma migration system

## 📝 License

MIT
