import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import multer from 'multer'
import pdfParse from 'pdf-parse'

dotenv.config()

const app: Express = express()

// Store uploaded files in memory so we can parse the PDF buffer directly.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max upload size
  },
  fileFilter: (_req, file, cb) => {
    const isPdfMimeType = file.mimetype === 'application/pdf'
    const isPdfExtension = file.originalname.toLowerCase().endsWith('.pdf')

    if (!isPdfMimeType || !isPdfExtension) {
      cb(new Error('Only PDF files are allowed'))
      return
    }

    cb(null, true)
  },
})

// Middleware
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`)
  })
  next()
})

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Upload and parse an RFP PDF file.
app.post('/api/upload-rfp', (req: Request, res: Response) => {
  upload.single('file')(req, res, async err => {
    if (err) {
      // Handle multer-specific upload errors (size limits, etc.).
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'File too large. Maximum allowed size is 10MB.' })
          return
        }
        res.status(400).json({ error: `Upload error: ${err.message}` })
        return
      }

      // Handle custom file filter errors (non-PDF).
      res.status(400).json({ error: err.message || 'Invalid upload request' })
      return
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded. Provide a PDF file in form field "file".' })
      return
    }

    try {
      // Parse PDF text and metadata from uploaded file buffer.
      const parsedPdf = await pdfParse(req.file.buffer)
      const rawText = (parsedPdf.text || '').trim()

      if (!rawText) {
        res.status(400).json({ error: 'Uploaded PDF contains no extractable text.' })
        return
      }

      res.status(200).json({
        fileName: req.file.originalname,
        pageCount: parsedPdf.numpages,
        rawText,
        uploadedAt: new Date().toISOString(),
      })
    } catch (parseError) {
      console.error('Failed to parse uploaded PDF:', parseError)
      res.status(500).json({ error: 'Failed to parse PDF file.' })
    }
  })
})

// API Routes (to be implemented)
// Import routes here as they're created:
// app.use('/api/rfp', rfpRoutes)
// app.use('/api/compliance', complianceRoutes)
// app.use('/api/risks', riskRoutes)
// app.use('/api/proposals', proposalRoutes)

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found', path: req.path })
})

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal Server Error' })
})

export default app

// Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
  console.log(`📄 API documentation: http://localhost:${PORT}/api/docs`)
})
