# Getting Started with Vettly

This guide will help you set up and run the Tender Compliance Validator locally.

## Prerequisites

Before you begin, make sure you have:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 15+** - [Download](https://www.postgresql.org/download/)
- **Redis** (optional) - [Download](https://redis.io/download/)
- **Git** - [Download](https://git-scm.com/)
- **Anthropic API Key** - [Get one](https://console.anthropic.com/)

Verify installations:
```bash
node --version   # v18.0.0 or higher
npm --version    # 9.0.0 or higher
psql --version   # psql (PostgreSQL) 15.0 or higher
```

## Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/vettly.git
cd vettly
```

## Step 2: Set Up Backend

### 2.1 Install Dependencies

```bash
cd backend
npm install
```

### 2.2 Configure Environment

Copy the environment template:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your settings:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/vettly_db

# Optional: Redis for job queues
REDIS_URL=redis://localhost:6379

# Required: Anthropic API
ANTHROPIC_API_KEY=sk-ant-[YOUR_KEY_HERE]

# Security
JWT_SECRET=your-secret-key-change-in-production

# Development
NODE_ENV=development
PORT=3000
```

### 2.3 Set Up Database

Create PostgreSQL database:

```bash
# Connect to PostgreSQL
psql -U postgres

# In psql:
CREATE DATABASE vettly_db;
\q
```

Run migrations:
```bash
npm run prisma:migrate
```

(Optional) Seed with test data:
```bash
npm run seed
```

### 2.4 Start Backend

```bash
npm run dev
```

Backend runs on http://localhost:3000

✅ You'll see: `✅ Server running on http://localhost:3000`

## Step 3: Set Up Frontend

### 3.1 In a new terminal, navigate to frontend:

```bash
cd frontend
npm install
```

### 3.2 Configure Environment

```bash
cp .env.example .env.local
```

Verify `.env.local`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_API_TIMEOUT=30000
```

### 3.3 Start Frontend

```bash
npm run dev
```

Frontend runs on http://localhost:5173

✅ Open http://localhost:5173 in your browser

## Step 4: Verify Setup

### Check Backend API

```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{ "status": "ok", "timestamp": "2024-01-15T..." }
```

### Check Frontend

Open http://localhost:5173 and verify:
- ✅ Landing page loads
- ✅ Logo and navigation visible
- ✅ "Start New Tender Review" card visible
- ✅ Recent Projects section visible

## Common Issues

### "Cannot connect to PostgreSQL"
- Verify PostgreSQL is running: `psql -U postgres -h localhost`
- Check DATABASE_URL in .env.local
- Ensure database `vettly_db` exists

### "ANTHROPIC_API_KEY not set"
- Add key to .env.local
- Restart backend with `npm run dev`

### "Port 3000/5173 already in use"
- Change PORT in .env.local for backend
- Set custom port: `PORT=3001 npm run dev`

### "Module not found" errors
- Delete `node_modules/` and `package-lock.json`
- Run `npm install` again
- Ensure TypeScript paths are configured in tsconfig.json

## Development Commands

### Backend

```bash
npm run dev              # Start dev server with hot reload
npm run build           # Build TypeScript
npm run lint            # Check code quality
npm run test            # Run tests
npm run typecheck       # TypeScript validation
npm run prisma:studio   # View/edit database GUI
```

### Frontend

```bash
npm run dev             # Start Vite dev server
npm run build           # Create production build
npm run lint            # Check code quality
npm run test            # Run tests
npm run test:ui         # Interactive test runner
npm run type-check      # TypeScript validation
```

## Testing the App

### 1. Upload an RFP

1. Go to http://localhost:5173
2. Click "Start New Tender Review"
3. Enter project name: "Test Tender"
4. Drag-drop a PDF/DOCX document
5. Click "Analyse RFP"

### 2. View Requirements Extraction

Backend will process the file with Claude AI and extract requirements.

### 3. Upload Vendor Proposals

In the project detail page:
1. Click "Add Vendor"
2. Enter vendor name
3. Upload their proposal document
4. System automatically evaluates compliance

### 4. View Compliance Results

On the compliance matrix, you'll see:
- Requirements vs vendors grid
- Compliance status (green/yellow/red)
- Compliance scores
- Risk indicators

## Database Administration

### View Database with Prisma Studio

```bash
cd backend
npm run prisma:studio
```

Opens http://localhost:5555 with GUI for database management.

### Reset Database (Development Only)

```bash
npm run prisma:migrate reset
```

This will:
1. Drop all tables
2. Run all migrations
3. Seed test data (if seed.ts exists)

## Next Steps

- ✅ [Frontend Documentation](frontend/README.md)
- ✅ [Backend Documentation](backend/README.md)
- ✅ [API Endpoints](backend/README.md#-api-endpoints)
- ✅ [Architecture](TECH_STACK.md)

## Troubleshooting

### Can't connect to backend from frontend

Frontend config in `vite.config.ts`:
```typescript
server: {
  proxy: {
    '/api': 'http://localhost:3000'
  }
}
```

Ensure backend is running on port 3000.

### Database migrations fail

```bash
# Check migration status
npx prisma migrate status

# Reset database and retry
npx prisma migrate reset
```

### Tests failing

```bash
# Clear test cache
npm run test -- --clearCache

# Run specific test
npm run test -- FormComponent.test.tsx
```

## Production Deployment

See [Backend README - Deployment](backend/README.md#-deployment) for Docker and production setup.

## Support

- 📖 Check documentation files in repo
- 🐛 Review error logs in `backend/logs/`
- 💬 Check GitHub issues

---

**Happy building! 🚀**
