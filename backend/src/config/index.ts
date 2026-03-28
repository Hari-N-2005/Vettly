import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',

  // Database
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  jwtExpiry: process.env.JWT_EXPIRY || '1h',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',

  // Anthropic Claude
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',

  // AWS S3
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsS3Bucket: process.env.AWS_S3_BUCKET,

  // File Upload
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '50'),
  uploadsDir: process.env.UPLOADS_DIR || './uploads',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'debug',
  logDir: process.env.LOG_DIR || './logs',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Email (optional)
  smtpHost: process.env.SMTP_HOST,
  smtpPort: parseInt(process.env.SMTP_PORT || '587'),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
}

// Validate required config
const requiredVars = ['DATABASE_URL', 'ANTHROPIC_API_KEY', 'JWT_SECRET']
const missing = requiredVars.filter(v => !process.env[v])

if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
}

export default config
