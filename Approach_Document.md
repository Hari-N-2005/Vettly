# Vettly Solution Design Brief

## 1. Solution Design

Vettly is a project-based tender review platform that converts unstructured RFP and vendor documents into structured, decision-ready outputs. The design focuses on giving procurement teams a clear path from upload to requirement validation and risk review.

The workflow is:

1. Upload an RFP and extract requirements.
2. Confirm requirements and save them to a project.
3. Validate vendor proposals against saved requirements.
4. Review requirement-level status, confidence, explanation, and risk findings.
5. Persist vendor results for future review and reporting.

### Design choices

- Project-centric data model: all documents, requirements, proposals, and results are linked to one project workspace.
- Human-in-the-loop checkpoints: extracted requirements are reviewed before downstream analysis.
- Traceable outputs: each requirement result includes status and evidence-oriented metadata.
- Resilient processing: fallback behavior exists for AI rate-limit scenarios so the flow can continue.

### Architecture summary

- Frontend: React single-page app for workflow navigation and result exploration.
- Backend: Express API for authentication, uploads, extraction/validation/risk orchestration, and persistence.
- Database: PostgreSQL with Prisma models for users, projects, requirements, proposals, and compliance results.
- AI integration: Gemini API for extraction, semantic validation, and risk scanning.

## 2. Tech Stack Choices

### Frontend

- TypeScript + React: maintainable UI for complex stateful workflows.
- Vite: fast local development and production build pipeline.
- Tailwind CSS: consistent design system with rapid UI iteration.
- Zustand and React Query patterns: predictable local/global state and async data handling.

Why this stack: The app has many conditional views (active project state, requirement state, vendor state, risk state). Type-safe React architecture keeps this manageable and easier to evolve.

### Backend

- Node.js + Express + TypeScript: pragmatic API layer with clear middleware/service composition.
- Prisma ORM: typed database access plus simple migration workflow.
- JWT auth: lightweight, stateless authentication for SPA + API architecture.
- Multer + parsing utilities: practical upload and document processing support.

Why this stack: The backend mainly orchestrates file ingestion, AI calls, and persistence. This stack is fast to iterate and straightforward to deploy.

### Database and AI

- PostgreSQL: reliable relational model for normalized project and result data.
- Gemini API: suitable for converting long-form procurement text into structured analysis outputs.

Why this stack: Tender workflows benefit from relational consistency and explainable, requirement-level AI outputs.

## 3. What I Would Improve With More Time

### Product and UX

- Add collaborative review (comments, assignments, approval states).
- Add richer side-by-side evidence views for each requirement decision.
- Add better filtering/saved views for large multi-vendor projects.

### Reliability and scalability

- Break the backend into clearer domain modules.
- Move heavy extraction/validation into queue-backed async jobs.
- Add structured observability (metrics, traces, and alerting).

### Testing and quality

- Expand integration and end-to-end tests for full workflow coverage.
- Add API contract tests to protect frontend-backend compatibility.

### Security and operations

- Strengthen file validation and scanning.
- Add role-based access controls and stronger audit logs.
- Harden production secret management and environment isolation.
