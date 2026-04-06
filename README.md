# Vettly - Tender Compliance Intelligence Platform

## Project Title
Vettly - Tender Compliance Intelligence Platform

## The Problem
Procurement teams often review large RFP documents and multiple vendor proposals manually, which is slow and inconsistent. Important compliance gaps can be missed when requirements are not structured and compared side by side. Teams need a faster, traceable way to extract requirements, validate vendors, and surface risks before decision-making.

## The Solution
Vettly provides a full tender-review workflow from RFP upload to vendor comparison and risk analysis. The platform extracts and structures requirements, stores project workspaces, validates vendor submissions against requirement checkpoints, and highlights compliance status (met, partially met, missing) with risk signals. It also centralizes project context so teams can review requirements, vendor performance, and risk indicators in one interface.

## Tech Stack
- Programming Languages
	- TypeScript
	- JavaScript (tooling/runtime)
- Frontend
	- React 18
	- Vite
	- Tailwind CSS
	- React Router
	- Zustand
	- TanStack React Query
- Backend
	- Node.js
	- Express
	- Prisma ORM
	- JWT authentication
	- Multer + pdf-parse + mammoth (document handling)
- Database
	- PostgreSQL
- APIs and Third-Party Tools
	- Google Gemini API (used for requirement extraction, semantic matching, and risk scanning)
	- Core third-party libraries in use include Prisma, jsonwebtoken, multer, pdf-parse, and mammoth.

## Setup Instructions
Use these local setup steps (Docker not required).

### 1. Clone and enter project
```bash
git clone <your-repo-url>
cd Vettly
```

### 2. Install backend dependencies
```bash
cd backend
npm install
```

### 3. Configure backend environment
Create `backend/.env.local` and add at least:
```env
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/<db_name>"
JWT_SECRET="your-strong-secret"
PORT=3000
CORS_ORIGIN="http://localhost:5173"
```

### 4. Run database migrations (backend)
```bash
npm run prisma:migrate
```

### 5. Install frontend dependencies
```bash
cd ../frontend
npm install
```

### 6. Run the app locally (two terminals)
Terminal A (backend):
```bash
cd backend
npm run dev
```

Terminal B (frontend):
```bash
cd frontend
npm run dev
```

### 7. Open the app
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`