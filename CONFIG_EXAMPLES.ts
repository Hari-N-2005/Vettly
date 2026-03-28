// ============================================================
// BACKEND TSCONFIG EXAMPLE
// Location: backend/tsconfig.json
// ============================================================

{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    
    // Output
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,
    
    // Strict type checking
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    
    // Path aliases
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/types": ["src/types/index.ts"],
      "@/models": ["src/models/*"],
      "@/controllers": ["src/controllers/*"],
      "@/routes": ["src/routes/*"],
      "@/services": ["src/services/*"],
      "@/middleware": ["src/middleware/*"],
      "@/utils": ["src/utils/*"],
      "@/config": ["src/config/*"],
      "@/database": ["src/database/*"],
      "@/jobs": ["src/jobs/*"]
    },
    
    "lib": ["ES2020"],
    "types": ["node", "jest"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}

// ============================================================
// FRONTEND TSCONFIG EXAMPLE
// Location: frontend/tsconfig.json
// ============================================================

{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    
    // Bundler mode
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "noEmit": true,
    "jsx": "react-jsx",
    
    // Strict type checking
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    
    // Path aliases
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/pages/*": ["src/pages/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/services/*": ["src/services/*"],
      "@/store/*": ["src/store/*"],
      "@/types/*": ["src/types/*"],
      "@/utils/*": ["src/utils/*"],
      "@/styles/*": ["src/styles/*"],
      "@/assets/*": ["src/assets/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.app.json" }],
  "exclude": ["node_modules", "dist"]
}

// ============================================================
// FRONTEND TSCONFIG.APP EXAMPLE
// Location: frontend/tsconfig.app.json
// ============================================================

{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}

// ============================================================
// VITE CONFIG EXAMPLE
// Location: frontend/vite.config.ts
// ============================================================

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
  },
})

// ============================================================
// JEST CONFIG EXAMPLE (Backend)
// Location: backend/jest.config.js
// ============================================================

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/app.ts',
    '!src/config/**',
  ],
  coveragePathIgnorePatterns: ['/node_modules/'],
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: 'node',
      },
    },
  },
}

// ============================================================
// VITEST CONFIG EXAMPLE (Frontend)
// Location: frontend/vitest.config.ts
// ============================================================

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

// ============================================================
// ESLINT CONFIG EXAMPLE (Shared)
// Location: frontend/.eslintrc.json
// ============================================================

{
  "root": true,
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "ignorePatterns": ["dist", ".eslintrc.json"],
  "parser": "@typescript-eslint/parser",
  "plugins": ["react-refresh", "@typescript-eslint"],
  "rules": {
    "react-refresh/only-export-components": [
      "warn",
      { "allowConstantExport": true }
    ],
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}

// ============================================================
// PRETTIER CONFIG EXAMPLE
// Location: both frontend/.prettierrc and backend/.prettierrc
// ============================================================

{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always"
}

// ============================================================
// ENV EXAMPLE (.env.example)
// Location: backend/.env.example
// ============================================================

# Server
NODE_ENV=development
PORT=3000

# Database
DB_URL=postgresql://vettly:vettly@localhost:5432/vettly_db

# Cache
REDIS_URL=redis://localhost:6379

# AI/LLM
CLAUDE_API_KEY=sk-ant-YOUR_KEY_HERE

# Authentication
JWT_SECRET=your-very-secure-secret-key-min-32-char
JWT_EXPIRY=7d

# File Storage
FILE_STORAGE_TYPE=local  # or "s3"
LOCAL_STORAGE_PATH=./uploads
MAX_FILE_SIZE_MB=50

# AWS S3 (if FILE_STORAGE_TYPE=s3)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=vettly-uploads

# Logging
LOG_LEVEL=info  # debug, info, warn, error

# CORS
CORS_ORIGIN=http://localhost:5173

# Email (optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

// ============================================================
// ENV EXAMPLE (.env.local)
// Location: frontend/.env.local
// ============================================================

VITE_API_URL=http://localhost:3000/api
VITE_API_TIMEOUT=30000
VITE_ENVIRONMENT=development

// ============================================================
// DOCKER COMPOSE EXAMPLE
// Location: docker-compose.yml (root)
// ============================================================

version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: vettly-postgres
    environment:
      POSTGRES_USER: vettly
      POSTGRES_PASSWORD: vettly
      POSTGRES_DB: vettly_db
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U vettly']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: vettly-redis
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:

# ============================================================
// Build & deployment configs follow Docker best practices
// with multi-stage builds for production images.
// ============================================================
