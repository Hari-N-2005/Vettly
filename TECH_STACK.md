# Tender Compliance Validator - Tech Stack & Architecture

## Overview
A full-stack web application for legal/procurement teams to validate vendor proposals against RFP requirements using AI-powered compliance checking.

---

## Tech Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **State Management**: TanStack Query (React Query) + Zustand
- **UI Components**: React Hook Form + Shadcn/ui (or Material-UI)
- **HTTP Client**: Axios
- **Document Processing**: React-Dropzone, React-PDF
- **Charting**: Recharts (for vendor comparison dashboard)
- **Styling**: Tailwind CSS

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM/Database Access**: Prisma + PostgreSQL
- **File Storage**: AWS S3 or local file system (configurable)
- **AI API**: Anthropic Claude API (claude-3.5-sonnet-20241022)
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Logging**: Winston
- **Task Queue**: Bull (Redis) - for async processing of large documents

### Database
- **Primary DB**: PostgreSQL
- **Cache**: Redis (for session storage & task queues)

### DevOps & Deployment
- **Containerization**: Docker & Docker Compose
- **Environment Management**: dotenv, cross-env
- **Testing**: 
  - Frontend: Vitest + React Testing Library
  - Backend: Jest + Supertest
- **API Documentation**: Swagger/OpenAPI

### Development Tools
- **Linting**: ESLint + Prettier
- **Version Control**: Git
- **Package Manager**: npm or yarn

---

## Key Features

1. **RFP Document Upload & Parsing**
   - Accepts PDF, DOCX, TXT formats
   - Automatic requirement extraction using Claude API

2. **Vendor Proposal Validation**
   - Multi-file upload support
   - Compliance scoring per requirement
   - Risk detection (missing clauses, non-compliance, red flags)

3. **Dashboard & Reporting**
   - Vendor comparison matrix
   - Compliance heatmap
   - Risk summary
   - Detailed compliance report per vendor

4. **AI-Powered Analysis**
   - Requirement extraction from RFP
   - Semantic matching of proposals to requirements
   - Risk flag detection (legal, financial, timeline, etc.)

---

## Data Models

See `MODELS.md` for detailed TypeScript interfaces and data relationships.

---

## Folder Structure

```
vettly/
├── frontend/                       # React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── store/
│   │   ├── utils/
│   │   ├── styles/
│   │   └── App.tsx
│   ├── public/
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                        # Node.js + Express
│   ├── src/
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── utils/
│   │   ├── types/
│   │   ├── config/
│   │   ├── database/
│   │   └── app.ts
│   ├── prisma/
│   ├── tests/
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
│
├── shared/                         # Shared types (optional monorepo)
│   └── types.ts
│
├── docker-compose.yml
└── README.md
```

---

## API Endpoints

### RFP Management
- `POST /api/rfp/upload` - Upload RFP document
- `GET /api/rfp/:id` - Fetch RFP details
- `DELETE /api/rfp/:id` - Delete RFP
- `GET /api/rfp/:id/requirements` - Get extracted requirements

### Vendor Proposals
- `POST /api/proposals/upload` - Upload vendor proposal
- `GET /api/proposals/:id` - Fetch proposal details
- `DELETE /api/proposals/:id` - Delete proposal
- `GET /api/rfp/:rfpId/proposals` - List proposals for RFP

### Compliance Validation
- `POST /api/validate/:proposalId` - Validate proposal against RFP
- `GET /api/compliance/:proposalId` - Get compliance results
- `GET /api/rfp/:rfpId/compliance` - Get all compliance for RFP

### Risk Analysis
- `GET /api/risks/:rfpId` - Get consolidated risk flags
- `GET /api/risks/proposal/:proposalId` - Proposal-specific risks

### Dashboard
- `GET /api/dashboard/:rfpId` - Dashboard summary (vendor comparison, scores)

---

## Environment Variables

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:3000/api
VITE_API_TIMEOUT=30000
```

### Backend (.env)
```
NODE_ENV=development
PORT=3000
DB_URL=postgresql://user:password@localhost:5432/vettly
REDIS_URL=redis://localhost:6379
CLAUDE_API_KEY=sk-ant-...
AWS_S3_BUCKET=vettly-uploads (or local)
JWT_SECRET=your-secret-key
FILE_STORAGE_TYPE=local (or s3)
```

---

## Development Setup

1. **Clone & Install**
   ```bash
   git clone <repo>
   cd vettly
   npm install
   ```

2. **Setup Database**
   ```bash
   cd backend
   npx prisma migrate dev
   ```

3. **Start Services**
   ```bash
   docker-compose up  # PostgreSQL + Redis
   npm run dev:backend
   npm run dev:frontend
   ```

4. **Access App**
   - Frontend: http://localhost:5173
   - API: http://localhost:3000/api
   - Swagger Docs: http://localhost:3000/api-docs

---

## CI/CD & Deployment

- **Docker**: Multi-stage builds for both frontend and backend
- **Testing**: Pre-commit hooks (Husky)
- **Deployment**: GitHub Actions → AWS/Azure/Vercel

---

## Security Considerations

- JWT token refresh mechanism
- Rate limiting on API endpoints
- Input validation with Zod
- CORS configuration
- Secure file upload validation
- API key management (Claude, AWS)
- SQL injection prevention (Prisma)
- XSS protection in React

